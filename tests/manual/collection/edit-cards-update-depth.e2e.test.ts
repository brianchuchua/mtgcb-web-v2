import { test } from '@playwright/test';
import path from 'path';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// Reproduces "Maximum update depth exceeded" on /collections/edit-cards
// reported in Sentry MTGCB-WEB-V2-6T/V/W/X after the 2026-05-07 toolchain
// bump (Next 16 + React 19.2 + React Compiler 1.0 stable).

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('User story: Edit Cards typing should not loop', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('select set with dropdown open + rapid typing should not loop', async ({ page }) => {
    const allErrors: string[] = [];
    const updateDepthErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        allErrors.push(text.slice(0, 300));
        if (text.includes('Maximum update depth')) updateDepthErrors.push(text.slice(0, 300));
      }
    });
    page.on('pageerror', (err) => {
      const text = `${err.name}: ${err.message}`;
      allErrors.push(text);
      if (text.includes('Maximum update depth')) updateDepthErrors.push(text);
    });

    await page.goto('/collections/edit-cards');
    await page.waitForLoadState('networkidle');

    // 1) Select a Set FIRST (drives the fetchAllCardsForSet effect, which
    //    populates allCards while no search is typed).
    const setBox = page.getByRole('combobox', { name: 'Set' });
    await setBox.click();
    await setBox.fill('Foundations');
    const opt = page.getByRole('option').filter({ hasText: /Foundations/i }).first();
    await opt.waitFor({ timeout: 10000 });
    await opt.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await page.screenshot({ path: shot('depth-A-set-loaded'), fullPage: false });

    // 2) Open the search dropdown (popper is now anchored, with allCards
    //    populated), then aggressively type+delete to churn state while popper
    //    is open. This is the pattern that exercises the BasePopper
    //    setPlacement loop.
    const searchBox = page.getByRole('combobox', { name: /Search in / });
    await searchBox.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: shot('depth-B-dropdown-open'), fullPage: false });

    for (let i = 0; i < 8; i++) {
      await searchBox.pressSequentially('Llanowar', { delay: 15 });
      await page.waitForTimeout(150);
      for (let j = 0; j < 8; j++) await searchBox.press('Backspace');
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: shot('depth-C-after-churn'), fullPage: false });

    // 3) Switch set WHILE the search dropdown is open. This recreates the
    //    cardOptions list under the popper without it closing.
    await setBox.click();
    await setBox.fill('Bloomburrow');
    const bloom = page.getByRole('option').filter({ hasText: /Bloomburrow/i }).first();
    await bloom.waitFor({ timeout: 10000 });
    await bloom.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: shot('depth-D-set-switched'), fullPage: false });

    // 4) Switch back to All Sets while still focused.
    await setBox.click();
    await setBox.fill('');
    const allOption = page.getByRole('option').filter({ hasText: /^All Sets$/ }).first();
    await allOption.waitFor({ timeout: 10000 });
    await allOption.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: shot('depth-E-all-sets'), fullPage: false });

    console.log(
      JSON.stringify({
        label: 'edit-cards-depth-result',
        url: page.url(),
        updateDepthErrorCount: updateDepthErrors.length,
        updateDepthSamples: updateDepthErrors.slice(0, 3),
        totalErrorCount: allErrors.length,
        firstErrors: allErrors.slice(0, 8),
      }),
    );
  });
});
