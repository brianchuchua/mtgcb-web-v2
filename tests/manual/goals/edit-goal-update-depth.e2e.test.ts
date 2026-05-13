import { test } from '@playwright/test';
import path from 'path';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// Reproduces "Maximum update depth exceeded" on /goals/edit/:goalId and
// /goals/create reported in Sentry MTGCB-WEB-V2-6M (12 events from one
// Chrome Mobile user). Stack trace ends in MUI FormControl.setFilled →
// InputBase.checkDirty.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

const TEST_GOAL_ID = 6;

test.describe('Goal forms should not loop on quantity edits (mobile viewport)', () => {
  // Mimic the Sentry user (Chrome Mobile, Pixel-5-ish viewport) without
  // overriding the browser engine, which forces a new worker in describe.
  test.use({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36',
  });

  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('edit goal: type/clear quantity + flip mode does not loop', async ({ page }) => {
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

    await page.goto(`/goals/edit/${TEST_GOAL_ID}`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('target-quantity-all').waitFor();
    await page.screenshot({ path: shot('goal-depth-01-loaded'), fullPage: false });

    // 1) Hammer the All Type quantity input (clear, type, clear, +/-).
    const allInput = page.getByTestId('target-quantity-all');
    for (let i = 0; i < 4; i++) {
      await allInput.click();
      await allInput.press('Control+a');
      await allInput.press('Backspace');           // forces value 0 → empty render
      await page.waitForTimeout(80);
      await allInput.pressSequentially('5', { delay: 30 });
      await page.waitForTimeout(80);
      await allInput.press('Backspace');
      await allInput.pressSequentially('99', { delay: 30 });
      await page.waitForTimeout(120);
    }
    await page.screenshot({ path: shot('goal-depth-02-all-churn'), fullPage: false });

    // 2) Switch to "Separate Regular/Foil" mode (causes a setValue cascade
    //    + remount of the quantity inputs).
    await page.getByText('Separate Regular/Foil').click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot('goal-depth-03-separate'), fullPage: false });

    // 3) Type into both reg + foil inputs (cross-field "watch" subscriptions
    //    in render fire on every keystroke; flexibleFinishes Switch appears
    //    when both are non-zero).
    const regInput = page.getByTestId('target-quantity-reg');
    const foilInput = page.getByTestId('target-quantity-foil');
    for (let i = 0; i < 5; i++) {
      await regInput.click();
      await regInput.press('Control+a');
      await regInput.press('Backspace');
      await regInput.pressSequentially(`${i + 1}`, { delay: 25 });
      await foilInput.click();
      await foilInput.press('Control+a');
      await foilInput.press('Backspace');
      await foilInput.pressSequentially(`${i + 1}`, { delay: 25 });
      await page.waitForTimeout(100);
    }
    await page.screenshot({ path: shot('goal-depth-04-both-filled'), fullPage: false });

    // 4) Flip back to All mode and back again — second mode-flip cascade.
    await page.getByText('Any Type').click();
    await page.waitForTimeout(200);
    await page.getByText('Separate Regular/Foil').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot('goal-depth-05-flipped'), fullPage: false });

    console.log(
      JSON.stringify({
        label: 'goal-edit-depth-result',
        url: page.url(),
        viewport: page.viewportSize(),
        updateDepthErrorCount: updateDepthErrors.length,
        updateDepthSamples: updateDepthErrors.slice(0, 3),
        totalErrorCount: allErrors.length,
        firstErrors: allErrors.slice(0, 8),
      }),
    );
  });

  test('create goal: rapid quantity edits + mode flips does not loop', async ({ page }) => {
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

    await page.goto('/goals/create');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('target-quantity-all').waitFor();
    await page.screenshot({ path: shot('goal-create-depth-01-loaded'), fullPage: false });

    // Type a name (triggers validation in 'onChange' mode + watch() subscriptions).
    const nameInput = page.getByLabel('Goal Name');
    await nameInput.click();
    await nameInput.pressSequentially('Repro Goal', { delay: 30 });

    // Fill the All quantity and toggle modes back-and-forth like the affected
    // mobile user appears to have been doing for ~12 minutes.
    const allInput = page.getByTestId('target-quantity-all');
    await allInput.click();
    await allInput.press('Control+a');
    await allInput.press('Backspace');
    await allInput.pressSequentially('3', { delay: 30 });

    for (let i = 0; i < 3; i++) {
      await page.getByText('Separate Regular/Foil').click();
      await page.waitForTimeout(150);
      await page.getByText('Any Type').click();
      await page.waitForTimeout(150);
    }

    await page.screenshot({ path: shot('goal-create-depth-02-after'), fullPage: false });

    console.log(
      JSON.stringify({
        label: 'goal-create-depth-result',
        url: page.url(),
        viewport: page.viewportSize(),
        updateDepthErrorCount: updateDepthErrors.length,
        updateDepthSamples: updateDepthErrors.slice(0, 3),
        totalErrorCount: allErrors.length,
        firstErrors: allErrors.slice(0, 8),
      }),
    );
  });
});
