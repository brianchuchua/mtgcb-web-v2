import { Locator, Page, expect } from '@playwright/test';

export const sidenav = (page: Page): Locator => page.locator('.MuiDrawer-paper');

// Next.js Link hydration can swallow the first click even after Playwright's
// actionability checks pass, so retry until the URL actually changes.
export const clickAndWaitForUrl = async (page: Page, target: Locator, url: string | RegExp): Promise<void> => {
  await expect(async () => {
    await target.click();
    await page.waitForURL(url, { timeout: 5000 });
  }).toPass({ timeout: 30000 });
};

export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const pathUrl = (path: string): RegExp => new RegExp(`^https?://[^/]+${escapeRegExp(path)}(?:[?#].*)?$`);
