import { expect, test } from '@playwright/test';
import path from 'path';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user manages physical card storage locations.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('Locations management', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('locations list page renders for authed user', async ({ page }) => {
    const reactErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
        reactErrors.push(msg.text());
      }
    });

    await page.goto('/locations');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: shot('locations-list'), fullPage: false });
    console.log(JSON.stringify({ url: page.url(), label: 'locations-list' }));
    expect(reactErrors).toEqual([]);
  });

  test('create-location form renders and accepts input', async ({ page }) => {
    await page.goto('/locations/create');
    await page.waitForLoadState('networkidle');

    const nameField = page.getByLabel('Location Name');
    await expect(nameField).toBeVisible();
    await nameField.fill('Test Location (manual verification)');

    const descField = page.getByLabel('Description (Optional)');
    await descField.fill('Created during agent-driven manual test run');

    await page.screenshot({ path: shot('locations-create-form-filled'), fullPage: false });
    console.log(JSON.stringify({ label: 'locations-create-form-filled' }));
    // Intentionally not submitting — exploratory only.
  });
});
