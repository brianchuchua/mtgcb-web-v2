import { test } from '@playwright/test';
import path from 'path';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

// Depends on the local dev DB: user 1337 owns two deprecated HFIN tokens (#37, #38)
// superseded by the double-faced "#37 // 38" printing. If those holdings are migrated
// away locally, the indicator legitimately disappears — that is not a regression.
const SET_URL = '/collections/1337/final-fantasy-helper-cards?name=Ability+Punchcard';

test.describe('User story: a collector spots which owned cards have a data update waiting', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('table view shows the update indicator at desktop and narrow widths', async ({ page }) => {
    const reactErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (
        text.includes('Rendered more hooks') ||
        text.includes('Rendered fewer hooks') ||
        text.includes('Rules of Hooks') ||
        text.includes('hook order')
      ) {
        reactErrors.push(text);
      }
    });

    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(SET_URL);
    await page.waitForLoadState('networkidle');

    // Table view is a persisted preference, so click through rather than assuming it.
    await page.getByRole('button', { name: /^table$/i }).click();
    await page.waitForFunction(() => document.querySelectorAll('td, th[scope="row"]').length > 0, { timeout: 10000 });

    const indicators = page.getByRole('button', { name: /card data update available/i });
    await indicators.first().waitFor({ state: 'visible', timeout: 10000 });
    const desktopCount = await indicators.count();
    await page.screenshot({ path: shot('deprecated-01-table-desktop'), fullPage: false });

    // Popover opens from the table without the row-click navigating away.
    await indicators.first().click();
    await page.getByText('Card data update available').first().waitFor({ state: 'visible' });
    await page.screenshot({ path: shot('deprecated-02-table-popover') });
    const urlAfterPopover = page.url();
    await page.keyboard.press('Escape');

    // Phone width: the Name column narrows and the name wraps, but the label must still fit
    // on one line under it rather than wrapping or being clipped.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const labelVisible = await page
      .getByText('Update Available', { exact: true })
      .first()
      .isVisible()
      .catch(() => false);
    const narrowCount = await indicators.count();
    await indicators.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot('deprecated-03-table-narrow'), fullPage: false });

    console.log(
      JSON.stringify({
        label: 'table-indicator',
        desktopCount,
        narrowCount,
        narrowLabelVisible: labelVisible,
        urlAfterPopover,
        reactErrors,
      }),
    );
  });
});
