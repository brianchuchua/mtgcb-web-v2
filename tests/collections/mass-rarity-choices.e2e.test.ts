import { expect, test, type Page, type Request } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// The "For" dropdown on both bulk tools offers commons with and without basic lands, plus
// basic lands and special cards on their own. The API calls are mocked: these tests check
// what the page sends, and the API e2e suite checks what the API does with it.

const MASS_UPDATE_URL = 'http://local.mtgcb.com:5000/collection/mass-update';
const MASS_ENTRY_URL = 'http://local.mtgcb.com:5000/collection/mass-entry';
const TEST_SET_SLUG = 'limited-edition-alpha';

const CHOICES = [
  { menuLabel: 'All commons (w/basic lands)', rarity: 'common', label: 'commons (including basic lands)' },
  { menuLabel: 'All commons (w/o basic lands)', rarity: 'commonNoBasicLand', label: 'commons (excluding basic lands)' },
  { menuLabel: 'All basic lands', rarity: 'basicLand', label: 'basic lands' },
  { menuLabel: 'All special cards', rarity: 'special', label: 'special cards' },
];

test.describe.configure({ mode: 'serial' });

const captureRequest = async (page: Page, url: string, data: object): Promise<() => Request> => {
  let captured: Request | undefined;
  await page.route(url, async (route) => {
    captured = route.request();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data }),
    });
  });
  return () => {
    if (!captured) throw new Error(`No request was sent to ${url}`);
    return captured;
  };
};

const chooseAndSubmit = async (page: Page, panelTestId: string, menuLabel: string, label: string, scope: string) => {
  const panel = page.getByTestId(panelTestId);
  await panel.getByRole('combobox').click();
  const options = page.getByRole('listbox').getByRole('option');
  await expect(options).toHaveText([
    'All cards',
    'All commons (w/basic lands)',
    'All commons (w/o basic lands)',
    'All uncommons',
    'All rares',
    'All mythics',
    'All special cards',
    'All basic lands',
  ]);
  await page.getByRole('option', { name: menuLabel, exact: true }).click();

  await panel.getByRole('spinbutton').first().fill('2');
  await expect(panel.getByText(`Set all ${label} ${scope} to 2 regular and 0 foil.`)).toBeVisible();

  await panel.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('dialog')).toContainText(label);
  await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click();
};

test.describe('Mass update rarity choices on the set collection page', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/${TEST_SET_SLUG}?contentType=cards`);
    await page.waitForLoadState('networkidle');
  });

  for (const { menuLabel, rarity, label } of CHOICES) {
    test(`"${menuLabel}" sends rarity ${rarity}`, async ({ page }) => {
      const sent = await captureRequest(page, MASS_UPDATE_URL, {
        setId: 1,
        setCode: 'lea',
        setName: 'Limited Edition Alpha',
        updatedCards: 3,
        updates: [],
      });

      await page.getByTestId('collection-set-more-actions').click();
      await page.getByRole('menuitem', { name: 'Mass Update' }).click();
      await chooseAndSubmit(page, 'mass-update-panel', menuLabel, label, 'in this set');

      await expect(page.getByText('Updated 3 cards in Limited Edition Alpha')).toBeVisible();
      expect(sent().postDataJSON()).toMatchObject({
        mode: 'set',
        updates: [{ rarity, quantityReg: 2, quantityFoil: 0 }],
      });
    });
  }
});

test.describe('Mass entry rarity choices on the main collection page', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await page.waitForLoadState('networkidle');
  });

  for (const { menuLabel, rarity, label } of CHOICES) {
    test(`"${menuLabel}" sends rarity ${rarity}`, async ({ page }) => {
      const sent = await captureRequest(page, MASS_ENTRY_URL, {
        totalCardsProvided: 5,
        updatedCards: 3,
        updates: [],
      });

      await page.getByTestId('collection-more-actions').click();
      await page.getByRole('menuitem', { name: 'Mass Update' }).click();
      await chooseAndSubmit(page, 'mass-entry-panel', menuLabel, label, 'on this page');

      await expect(page.getByText('Updated 3 cards', { exact: true })).toBeVisible();
      expect(sent().postDataJSON()).toMatchObject({
        mode: 'set',
        updates: [{ rarity, quantityReg: 2, quantityFoil: 0 }],
      });
    });
  }
});
