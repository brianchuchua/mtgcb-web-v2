import { type Page, type Request, test } from '@playwright/test';
import path from 'path';
import { getLocalTestJwt } from '../../utils/auth';

// User story: someone opens a friend's share link and wants to see only the sets they own.
// Screenshots the Sets view on All and on Owned, and logs what the page asked the API for.
// Run before and after a change to compare. Counts depend on user 1337's local collection.

const API = 'http://local.mtgcb.com:5000';
const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const LABEL = process.env.SHOT_LABEL || 'run';
const shot = (name: string) => path.join(SHOTS_DIR, `share-owned-${LABEL}-${name}.png`);

test.describe('User story: a share-link viewer filters Sets to Owned', () => {
  test('All vs Owned on a shared Sets view', async ({ page, request }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    const auth = { cookie: `MTGCB_AuthToken=${getLocalTestJwt()}` };
    const created = await request.post(`${API}/user/share-link`, { data: {}, headers: { ...auth, 'content-type': 'application/json' } });
    const token = (await created.json()).data.token;

    try {
      const opened = await nextSetsSearch(page, () => page.goto(`/shared/${token}?contentType=sets`));
      await settle(page);
      await page.screenshot({ path: shot('01-opened') });
      await log('opened', page, opened);

      const ownership = page.locator('fieldset, div').filter({ has: page.getByText('Ownership Status', { exact: true }) }).last();

      const all = await nextSetsSearch(page, () => ownership.getByRole('button', { name: 'All' }).click(), 8000);
      await settle(page);
      await page.screenshot({ path: shot('02-all') });
      await log('all', page, all);

      const owned = await nextSetsSearch(page, () => ownership.getByRole('button', { name: 'Owned' }).click(), 8000);
      await settle(page);
      await page.screenshot({ path: shot('03-owned') });
      await log('owned', page, owned);
    } finally {
      await request.delete(`${API}/user/share-link`, { headers: auth });
    }
  });
});

async function nextSetsSearch(page: Page, action: () => Promise<unknown>, timeout = 20000): Promise<Request | null> {
  const request = page
    .waitForRequest(
      (req) =>
        req.method() === 'POST' &&
        new URL(req.url()).pathname === '/sets/search' &&
        req.postDataJSON()?.userId === 1337 &&
        (req.postDataJSON()?.offset ?? 0) === 0,
      { timeout },
    )
    .catch(() => null);
  await action();
  return request;
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

async function log(label: string, page: Page, request: Request | null): Promise<void> {
  const body = request?.postDataJSON();
  const total = request ? (await (await request.response())?.json())?.data?.totalCount : null;
  const pressed = await page.locator('button[aria-pressed="true"]').allTextContents();
  console.log(
    JSON.stringify({
      label,
      newRequestSent: request !== null,
      completionStatus: body?.completionStatus ?? null,
      setsReturned: total,
      pressed,
    }),
  );
}
