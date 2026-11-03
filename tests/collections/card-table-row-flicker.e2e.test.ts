import { Page, expect, test } from '@playwright/test';

// Regression test for a user report: on a "masticore" search sorted by price, the
// Razormane Masticore row (Duel Decks: Elspeth vs. Tezzeret) kept switching between one
// and two lines with no input.
//
// The table is virtualized, and its column widths used to depend on which rows were
// rendered. At window heights of about 896-912 px the "Masticore (jk134sb)" row sits at
// the edge of the rendered range. Its long collector number widened the # column, which
// made the set name wrap, which pushed that row out of range, which unwrapped the set
// name, and so on every frame or two.

// Real scrollbars, so the page width matches a normal Windows browser.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

const URL = '/collections/1337?cardsSortBy=market&name=masticore&contentType=cards';
const HEIGHTS = [896, 900, 904, 908, 912];
const FRAMES = 90;

// Counts how often any rendered row's height changes over FRAMES animation frames.
const countRowHeightChanges = (page: Page) =>
  page.evaluate(
    (frames) =>
      new Promise<number>((resolve) => {
        const snap = () =>
          [...document.querySelectorAll('tbody tr')]
            .map((tr) => Math.round(tr.getBoundingClientRect().height))
            .join(',');
        let last = snap();
        let changes = 0;
        let n = 0;
        const tick = () => {
          n++;
          const now = snap();
          if (now !== last) changes++;
          last = now;
          if (n < frames) requestAnimationFrame(tick);
          else resolve(changes);
        };
        requestAnimationFrame(tick);
      }),
    FRAMES,
  );

test.describe('Card table row heights', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.setItem(
        'mtgcb-display-settings',
        JSON.stringify({ preferredCardViewMode: 'table', cardsPageSize: 500 }),
      );
    });
  });

  test('rows stay still while the page sits idle on the masticore search', async ({ page }) => {
    test.setTimeout(120000);
    const results: Record<number, number> = {};

    for (const height of HEIGHTS) {
      await page.setViewportSize({ width: 1920, height });
      await page.goto(URL);
      await expect(page.locator('tbody tr').nth(3)).toBeVisible({ timeout: 30000 });
      await expect(page.locator('tbody tr', { hasText: 'Razormane Masticore' }).first()).toBeVisible();
      await page.waitForTimeout(1500);
      results[height] = await countRowHeightChanges(page);
    }

    expect(results).toEqual(Object.fromEntries(HEIGHTS.map((h) => [h, 0])));
  });
});
