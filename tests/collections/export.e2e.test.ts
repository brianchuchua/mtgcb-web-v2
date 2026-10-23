import { expect, test, type Page, type Request } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import { API_BASE } from './fixtures/apiMocks';

const MANDATORY_FIELDS = ['id', 'quantity_regular', 'quantity_foil'];

// The export click sets window.location.href to the API. Fulfilling it with a CSV
// attachment keeps the browser on /export and avoids generating a real export.
const interceptExport = async (page: Page): Promise<void> => {
  await page.route(
    (url) => url.origin === API_BASE && url.pathname === '/collection/export',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        headers: { 'content-disposition': 'attachment; filename="export.csv"' },
        body: 'MTG CB ID,Quantity (Regular),Quantity (Foil)\n1,1,0\n',
      });
    },
  );
};

const gotoExport = async (page: Page): Promise<void> => {
  await page.goto('/export');
  await expect(page.getByRole('heading', { name: 'Export Collection' })).toBeVisible({ timeout: 20000 });
};

const clickExport = async (page: Page): Promise<URL> => {
  const requestPromise = page.waitForRequest(
    (request: Request) => new URL(request.url()).pathname === '/collection/export',
  );
  await page.getByRole('button', { name: 'Export Collection' }).click();
  const request = await requestPromise;
  return new URL(request.url());
};

const customizeToggle = (page: Page) => page.getByRole('checkbox', { name: 'Customize fields to export' });

const untickAllOptionalFields = async (page: Page): Promise<void> => {
  for (const box of await page.getByRole('checkbox').all()) {
    const label = await box.evaluate((el) => el.closest('label')?.textContent ?? '');
    if (label !== 'Customize fields to export' && (await box.isEnabled()) && (await box.isChecked())) {
      await box.uncheck();
    }
  }
};

test.describe('Export collection', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await interceptExport(page);
    await gotoExport(page);
  });

  test('default export requests the API export URL for mtgcb with no explicit fields', async ({ page }) => {
    const url = await clickExport(page);

    expect(url.origin).toBe(API_BASE);
    expect(url.searchParams.get('format')).toBe('mtgcb');
    expect(url.searchParams.getAll('fields')).toEqual([]);
    await expect(page).toHaveURL(/\/export$/);
  });

  test('the selected format is sent in the export URL', async ({ page }) => {
    await page.locator('input[type="radio"][value="archidekt"]').check();
    const url = await clickExport(page);

    expect(url.searchParams.get('format')).toBe('archidekt');
  });

  test('customizing fields sends mandatory fields once each plus the chosen fields', async ({ page }) => {
    await customizeToggle(page).check();

    const cardName = page.getByRole('checkbox', { name: 'Card', exact: true });
    await expect(cardName).toBeChecked();
    await cardName.uncheck();
    await page.getByRole('checkbox', { name: 'Rarity', exact: true }).check();

    const url = await clickExport(page);
    const fields = url.searchParams.getAll('fields');

    expect(fields.slice(0, 3)).toEqual(MANDATORY_FIELDS);
    MANDATORY_FIELDS.forEach((field) => expect(fields.filter((f) => f === field)).toHaveLength(1));
    expect(fields).toContain('rarity');
    expect(fields).toContain('expansion_name');
    expect(fields).not.toContain('card_name');
    expect(new Set(fields).size).toBe(fields.length);
  });

  test('mandatory fields are checked, disabled and labelled Required', async ({ page }) => {
    await customizeToggle(page).check();

    for (const label of [/^MTG CB ID/, /^Quantity \(Regular\)/, /^Quantity \(Foil\)/]) {
      const checkbox = page.getByRole('checkbox', { name: label });
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toBeDisabled();
    }
    await expect(page.getByText('(Required)')).toHaveCount(3);
  });

  test('with every optional field unticked only the mandatory fields are exported', async ({ page }) => {
    await customizeToggle(page).check();
    await untickAllOptionalFields(page);

    const url = await clickExport(page);
    expect(url.searchParams.getAll('fields')).toEqual(MANDATORY_FIELDS);
  });

  test('with every optional field unticked the "only the required fields" hint is shown', async ({ page }) => {
    await customizeToggle(page).check();
    await untickAllOptionalFields(page);

    await expect(
      page.getByText('Only the required fields (ID, Quantity Regular, Quantity Foil) will be exported.', {
        exact: false,
      }),
    ).toBeVisible({ timeout: 3000 });
  });

  test('turning customize off again goes back to the default (no fields param)', async ({ page }) => {
    await customizeToggle(page).check();
    await page.getByRole('checkbox', { name: 'Rarity', exact: true }).check();
    await customizeToggle(page).uncheck();

    await expect(page.getByText('The following default fields will be included in your export:')).toBeVisible();
    const url = await clickExport(page);
    expect(url.searchParams.getAll('fields')).toEqual([]);
  });

  test('an unsupported format shows the explanation and no export button', async ({ page }) => {
    await page.locator('input[type="radio"][value="mtgstudio"]').check();

    await expect(page.getByText('This format is not currently supported.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Collection' })).toHaveCount(0);
  });
});
