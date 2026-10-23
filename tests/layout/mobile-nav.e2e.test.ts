import { expect, test } from '@playwright/test';
import { pathUrl } from './navHelpers';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
  });

  test('the sidenav is closed until the "menu" button is pressed', async ({ page }) => {
    await expect(page.getByText('Main Menu')).toBeHidden();

    await page.getByRole('button', { name: 'menu', exact: true }).click();

    const drawer = page.locator('.MuiDrawer-paper');
    await expect(drawer.getByText('Main Menu')).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Browse', exact: true })).toBeVisible();
  });

  test('choosing a link navigates and closes the drawer', async ({ page }) => {
    await page.getByRole('button', { name: 'menu', exact: true }).click();
    const drawer = page.locator('.MuiDrawer-paper');
    await expect(drawer.getByText('Main Menu')).toBeVisible();

    await expect(async () => {
      if (!(await drawer.getByText('Main Menu').isVisible())) {
        await page.getByRole('button', { name: 'menu', exact: true }).click();
      }
      await drawer.getByRole('link', { name: 'Support Us', exact: true }).click();
      await page.waitForURL(pathUrl('/patrons'), { timeout: 5000 });
    }).toPass({ timeout: 30000 });

    await expect(page.getByText('Main Menu')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1, name: 'Support MTG CB' })).toBeVisible();
  });

  test('pressing Escape closes the drawer without navigating', async ({ page }) => {
    await page.getByRole('button', { name: 'menu', exact: true }).click();
    await expect(page.locator('.MuiDrawer-paper').getByText('Main Menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Main Menu')).toBeHidden();
    expect(page.url()).toMatch(pathUrl('/faq'));
  });
});
