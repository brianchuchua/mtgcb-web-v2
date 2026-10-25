import { expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Regression for Notion "Fix goal header skeleton size" (2d2e035a3bdf41c3b21e5079b3bacd91).
//
// Reloading a collection with a goal selected pushed the page down about 100px half a second in.
// Until login resolved, the header guessed that values were hidden and showed the short goal
// skeleton, then grew to the full one. This records where the Grid/Table toggle sits on every
// frame from first paint until the loaded header is up, and expects it never to move.

const API = 'http://local.mtgcb.com:5000';

test.describe('Collection goal header', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('page below the header does not move while the goal header loads', async ({ page, context }) => {
    const res = await page.request.get(`${API}/goals/${LOCAL_TEST_USER_ID}?limit=500`, {
      headers: { cookie: `MTGCB_AuthToken=${getLocalTestJwt()}` },
    });
    const goals = (await res.json()).data?.goals ?? [];
    const goal = goals.find((g: { isActive: boolean }) => g.isActive);
    test.skip(!goal, 'User has no active goal');

    await context.addInitScript(() => {
      const w = window as unknown as { __toggleTops: number[] };
      w.__toggleTops = [];
      const start = performance.now();
      const sample = () => {
        const toggle = [...document.querySelectorAll('button')].find((b) =>
          /^(grid|table)$/i.test((b.getAttribute('aria-label') || b.title || b.textContent || '').trim()),
        );
        if (toggle) w.__toggleTops.push(Math.round(toggle.getBoundingClientRect().top));
        if (performance.now() - start < 8000) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards&goalId=${goal.id}`);
    await expect(page.getByRole('heading', { level: 4, name: goal.name })).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(500);

    const tops = await page.evaluate(() => (window as unknown as { __toggleTops: number[] }).__toggleTops);
    expect(tops.length).toBeGreaterThan(0);
    expect([...new Set(tops)]).toEqual([tops[0]]);
  });
});
