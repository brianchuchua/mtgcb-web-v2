import { expect, test } from '@playwright/test';

// Read-only checks on Manath's public collection (user 1337).

test.describe('Faded goal cards', () => {
  // A goal's missing cards are faded. Mouse hover brightens one; on a phone a long-press does
  // the same and it stays bright until the next touch elsewhere. A quick tap must not flash it.
  const FADED = '[data-testid="card-item"] > :first-child';

  const openGoal = async (page: import('@playwright/test').Page) => {
    await page.goto('/collections/1337?contentType=cards&goalId=1181');
    await page.locator('[data-testid="card-item"]').first().waitFor({ timeout: 20000 });
    const faded = page.locator(FADED).first();
    await expect(faded).toHaveCSS('opacity', '0.5');
    return faded;
  };

  const forceHover = async (page: import('@playwright/test').Page) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: FADED });
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
    await page.waitForTimeout(400);
  };

  test('desktop: hover brightens a faded card', async ({ page }) => {
    const faded = await openGoal(page);
    await forceHover(page);
    await expect(faded).toHaveCSS('opacity', '1');
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    const touch = async (page: import('@playwright/test').Page, x: number, y: number, holdMs: number) => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await page.waitForTimeout(holdMs);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };

    test('the fake hover from a tap does not brighten it', async ({ page }) => {
      const faded = await openGoal(page);
      await forceHover(page);
      await expect(faded).toHaveCSS('opacity', '0.5');
    });

    test('a long-press brightens it until the next touch elsewhere', async ({ page }) => {
      const faded = await openGoal(page);
      await faded.scrollIntoViewIfNeeded();
      const box = (await faded.boundingBox())!;
      await touch(page, box.x + box.width / 2, box.y + box.height / 2, 800);
      await expect(faded).toHaveCSS('opacity', '1');
      await page.waitForTimeout(500);
      // Letting go after a long-press doesn't open the card
      await expect(page).toHaveURL(/\/collections\/1337\?/);
      await expect(faded).toHaveCSS('opacity', '1');

      // Touch the page header, away from any card
      await touch(page, 200, 30, 50);
      await expect(faded).toHaveCSS('opacity', '0.5');
    });

    test('a quick tap opens the card without brightening it first', async ({ page }) => {
      const faded = await openGoal(page);
      await faded.scrollIntoViewIfNeeded();
      const box = (await faded.boundingBox())!;
      // Record the highest opacity the faded card reaches until it leaves the page
      await faded.evaluate((el) => {
        const w = window as unknown as { maxFadedOpacity: number };
        w.maxFadedOpacity = 0;
        const sample = () => {
          if (!el.isConnected) return;
          w.maxFadedOpacity = Math.max(w.maxFadedOpacity, parseFloat(getComputedStyle(el).opacity));
          requestAnimationFrame(sample);
        };
        sample();
      });
      await touch(page, box.x + box.width / 2, box.y + box.height / 2, 80);
      await page.waitForURL(/\/collections\/1337\/cards\//, { timeout: 20000 });
      const max = await page.evaluate(() => (window as unknown as { maxFadedOpacity: number }).maxFadedOpacity);
      expect(max).toBe(0.5);
    });
  });
});
