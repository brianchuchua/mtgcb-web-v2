import { expect, test, type Page } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import { type CapturedApiCall, type MockApiResponse, mockApiRoute, ok } from './fixtures/apiMocks';

// Every import request is mocked: a real import would overwrite user 1337's collection.

interface ImportRequestBody {
  csvData: string;
  filename: string;
  fieldMappings?: Array<{ csvHeader: string; mtgcbField: string }>;
}

interface ImportResultData {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  created: number;
  updated: number;
  deleted: number;
  partialSuccess: boolean;
  errors: Array<{ row: number; field: string; value: string; message: string }>;
}

type ImportCall = CapturedApiCall<ImportRequestBody>;

const MTGCB_HEADER = 'MTG CB ID,Quantity (Regular),Quantity (Foil)';
const ARCHIDEKT_HEADER = 'Quantity,Finish,Scryfall ID,Name,Edition Name,Edition Code';

const buildMtgcbCsv = (ids: number[]): string => [MTGCB_HEADER, ...ids.map((id) => `${id},1,0`)].join('\n');

const SMALL_MTGCB_CSV = buildMtgcbCsv([101, 102, 103]);
const ARCHIDEKT_CSV = [
  ARCHIDEKT_HEADER,
  '1,Normal,0000579f-7b35-4ed3-b44c-db2a538066fe,Giant Spider,Tenth Edition,10E',
  '2,Foil,abc,Not A Card,Nowhere,XXX',
].join('\n');

const dataRowCount = (csvData: string): number => csvData.split('\n').filter((line) => line.trim()).length - 1;

const allSucceeded = (call: ImportCall): MockApiResponse => {
  const rows = dataRowCount(call.body.csvData);
  return ok(result({ totalRows: rows, successfulRows: rows, created: rows }));
};

const result = (overrides: Partial<ImportResultData>): ImportResultData => {
  const base: ImportResultData = {
    totalRows: 0,
    successfulRows: 0,
    failedRows: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    partialSuccess: false,
    errors: [],
  };
  const merged = { ...base, ...overrides };
  return { ...merged, partialSuccess: merged.failedRows > 0 && merged.successfulRows > 0 };
};

const mockImport = (page: Page, respond: (call: ImportCall, index: number) => MockApiResponse = allSucceeded) =>
  mockApiRoute<ImportRequestBody>(page, '/collection/import', { method: 'POST', respond });

const gotoImport = async (page: Page): Promise<void> => {
  await page.goto('/import');
  await expect(page.getByRole('heading', { name: 'Import Collection' })).toBeVisible({ timeout: 20000 });
};

const selectFormat = async (page: Page, formatId: string): Promise<void> => {
  await page.locator(`input[type="radio"][value="${formatId}"]`).check();
};

const chooseFile = async (page: Page, name: string, content: string | Buffer): Promise<void> => {
  await page.locator('input[type="file"]').setInputFiles({
    name,
    mimeType: name.endsWith('.csv') ? 'text/csv' : 'text/plain',
    buffer: typeof content === 'string' ? Buffer.from(content) : content,
  });
};

const resultAlert = (page: Page) => page.getByRole('alert').filter({ hasText: /rows|Dry run|Import failed/ });

test.describe('Import collection', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test.describe('MTG CB format', () => {
    test('dry run sends dryRun=true with the file contents and never opens the confirm dialog', async ({ page }) => {
      const calls = await mockImport(page);
      await gotoImport(page);
      await chooseFile(page, 'my-collection.csv', SMALL_MTGCB_CSV);
      await expect(page.getByText(/Selected: my-collection\.csv/)).toBeVisible();

      await page.getByRole('button', { name: 'Preview (Dry Run)' }).click();

      await expect(resultAlert(page)).toHaveText(
        'Dry run successful: All 3 rows would be imported. No changes have been made to your collection.',
      );
      await expect(page.getByRole('dialog')).toHaveCount(0);

      expect(calls).toHaveLength(1);
      const [call] = calls;
      expect(call.url.searchParams.get('format')).toBe('mtgcb');
      expect(call.url.searchParams.get('dryRun')).toBe('true');
      expect(call.url.searchParams.get('updateMode')).toBe('replace');
      expect(call.body.csvData).toBe(SMALL_MTGCB_CSV);
      expect(call.body.filename).toBe('my-collection.csv');
      expect(call.body).not.toHaveProperty('fieldMappings');

      await expect(page.getByRole('button', { name: 'Proceed with Real Import' })).toBeVisible();
    });

    test('real import waits for Confirm Import, and Cancel sends nothing', async ({ page }) => {
      const calls = await mockImport(page);
      await gotoImport(page);
      await chooseFile(page, 'my-collection.csv', SMALL_MTGCB_CSV);

      await page.getByRole('button', { name: 'Import Collection' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: 'Confirm Import' })).toBeVisible();
      await expect(dialog).toContainText('File: my-collection.csv');
      await expect(dialog).toContainText('Update Mode: Replace');
      expect(calls).toHaveLength(0);

      await dialog.getByRole('button', { name: 'Cancel' }).click();
      await expect(dialog).toHaveCount(0);
      expect(calls).toHaveLength(0);

      await page.getByRole('button', { name: 'Import Collection' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Confirm Import' }).click();

      await expect(resultAlert(page)).toHaveText('Imported all 3 rows');
      expect(calls).toHaveLength(1);
      expect(calls[0].url.searchParams.get('dryRun')).toBe('false');
      expect(calls[0].url.searchParams.get('updateMode')).toBe('replace');
      expect(calls[0].body.csvData).toBe(SMALL_MTGCB_CSV);
      expect(calls[0].body.filename).toBe('my-collection.csv');
    });

    test('Add mode sends updateMode=merge and the confirm dialog says Add', async ({ page }) => {
      const calls = await mockImport(page);
      await gotoImport(page);
      await page.locator('input[type="radio"][value="merge"]').check();
      await chooseFile(page, 'add.csv', SMALL_MTGCB_CSV);

      await page.getByRole('button', { name: 'Import Collection' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('Update Mode: Add');
      await expect(dialog).toContainText('Add the CSV quantities to your existing collection quantities');
      await dialog.getByRole('button', { name: 'Confirm Import' }).click();

      await expect(resultAlert(page)).toHaveText('Imported all 3 rows');
      expect(calls[0].url.searchParams.get('updateMode')).toBe('merge');
      expect(calls[0].url.searchParams.get('dryRun')).toBe('false');
    });

    test('Proceed with Real Import after a dry run goes through the confirm dialog', async ({ page }) => {
      const calls = await mockImport(page);
      await gotoImport(page);
      await chooseFile(page, 'my-collection.csv', SMALL_MTGCB_CSV);

      await page.getByRole('button', { name: 'Preview (Dry Run)' }).click();
      await page.getByRole('button', { name: 'Proceed with Real Import' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      expect(calls).toHaveLength(1);
      await dialog.getByRole('button', { name: 'Confirm Import' }).click();

      await expect(resultAlert(page)).toHaveText('Imported all 3 rows');
      expect(calls.map((c) => c.url.searchParams.get('dryRun'))).toEqual(['true', 'false']);
    });

    test('Import Another File clears the result and the selected file', async ({ page }) => {
      await mockImport(page);
      await gotoImport(page);
      await chooseFile(page, 'my-collection.csv', SMALL_MTGCB_CSV);
      await page.getByRole('button', { name: 'Preview (Dry Run)' }).click();
      await expect(resultAlert(page)).toBeVisible();

      await page.getByRole('button', { name: 'Import Another File' }).click();

      await expect(resultAlert(page)).toHaveCount(0);
      await expect(page.getByText(/Selected: /)).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Select CSV File' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Preview (Dry Run)' })).toHaveCount(0);
      await expect(page.getByText('Update Mode')).toBeVisible();
    });
  });

  test.describe('result alerts and errors (Archidekt format)', () => {
    test('partial import shows a warning, the error table, and a downloadable error CSV', async ({ page }) => {
      const calls = await mockImport(page, () =>
        ok(
          result({
            totalRows: 2,
            successfulRows: 1,
            failedRows: 1,
            created: 1,
            errors: [{ row: 2, field: 'Scryfall ID', value: 'abc', message: 'Card not found, check "id"' }],
          }),
        ),
      );
      await gotoImport(page);
      await selectFormat(page, 'archidekt');
      await chooseFile(page, 'archidekt.csv', ARCHIDEKT_CSV);

      await page.getByRole('button', { name: 'Import Collection' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Confirm Import' }).click();

      await expect(resultAlert(page)).toHaveText('Partially successful: 1 of 2 rows imported');
      await expect(resultAlert(page)).toHaveClass(/MuiAlert-.*[Ww]arning/);
      expect(calls[0].url.searchParams.get('format')).toBe('archidekt');
      expect(calls[0].body.csvData).toBe(ARCHIDEKT_CSV);

      await expect(page.getByRole('heading', { name: 'Errors (1)' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Card not found, check "id"' })).toBeVisible();

      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download Errors' }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('import-errors.csv');
      const stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk as Buffer);
      expect(Buffer.concat(chunks).toString('utf8')).toBe(
        'Row,Field,Value,Error Message\n2,Scryfall ID,abc,"Card not found, check ""id"""',
      );
    });

    test('a fully failed real import shows the failure alert without Proceed or Download for zero errors', async ({
      page,
    }) => {
      await mockImport(page, () => ok(result({ totalRows: 2, failedRows: 2 })));
      await gotoImport(page);
      await selectFormat(page, 'archidekt');
      await chooseFile(page, 'archidekt.csv', ARCHIDEKT_CSV);

      await page.getByRole('button', { name: 'Import Collection' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Confirm Import' }).click();

      await expect(resultAlert(page)).toHaveText('Import failed: All 2 rows failed');
      await expect(resultAlert(page)).toHaveClass(/MuiAlert-.*[Ee]rror/);
      await expect(page.getByRole('button', { name: 'Download Errors' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Proceed with Real Import' })).toHaveCount(0);
    });

    test('dry run partial and dry run failed alerts; Proceed only offered when something would import', async ({
      page,
    }) => {
      const responses = [
        result({
          totalRows: 2,
          successfulRows: 1,
          failedRows: 1,
          errors: [{ row: 2, field: 'Scryfall ID', value: 'abc', message: 'Card not found' }],
        }),
        result({ totalRows: 2, failedRows: 2 }),
      ];
      await mockImport(page, (_call, index) => ok(responses[index]));
      await gotoImport(page);
      await selectFormat(page, 'archidekt');
      await chooseFile(page, 'archidekt.csv', ARCHIDEKT_CSV);

      await page.getByRole('button', { name: 'Preview (Dry Run)' }).click();
      await expect(resultAlert(page)).toHaveText(
        'Dry run partially successful: 1 of 2 rows would be imported. No changes have been made to your collection.',
      );
      await expect(page.getByRole('button', { name: 'Download Errors' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Proceed with Real Import' })).toBeVisible();

      await page.getByRole('button', { name: 'Import Another File' }).click();
      await chooseFile(page, 'archidekt.csv', ARCHIDEKT_CSV);
      await page.getByRole('button', { name: 'Preview (Dry Run)' }).click();
      await expect(resultAlert(page)).toHaveText(
        'Dry run failed: All 2 rows would fail to import. No changes have been made to your collection.',
      );
      await expect(page.getByRole('button', { name: 'Proceed with Real Import' })).toHaveCount(0);
    });
  });

  test.describe('file validation', () => {
    test('a non-.csv file is rejected with an alert and not selected', async ({ page }) => {
      await mockImport(page);
      await gotoImport(page);

      const dialogMessage = new Promise<string>((resolve) => {
        page.once('dialog', async (dialog) => {
          resolve(dialog.message());
          await dialog.accept();
        });
      });
      await chooseFile(page, 'collection.txt', SMALL_MTGCB_CSV);

      expect(await dialogMessage).toBe('Please select a CSV file');
      await expect(page.getByText(/Selected: /)).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Preview (Dry Run)' })).toHaveCount(0);
    });

    test('a .csv file over 30MB is rejected with an alert', async ({ page }) => {
      await mockImport(page);
      await gotoImport(page);

      const dialogMessage = new Promise<string>((resolve) => {
        page.once('dialog', async (dialog) => {
          resolve(dialog.message());
          await dialog.accept();
        });
      });
      await chooseFile(page, 'huge.csv', Buffer.alloc(30 * 1024 * 1024 + 1, 'a'));

      expect(await dialogMessage).toBe('File size exceeds 30MB limit');
      await expect(page.getByText(/Selected: /)).toHaveCount(0);
    });
  });

  test.describe('custom CSV mapping', () => {
    const CUSTOM_CSV = ['Card Name,Set Code,Count,Notes', 'Giant Spider,10E,2,binder', 'Llanowar Elves,M19,1,'].join(
      '\n',
    );

    const mockPreview = (page: Page) =>
      mockApiRoute(page, '/collection/import/preview', {
        method: 'POST',
        respond: () =>
          ok({
            headers: ['Card Name', 'Set Code', 'Count', 'Notes'],
            sampleRows: [
              ['Giant Spider', '10E', '2', 'binder'],
              ['Llanowar Elves', 'M19', '1', ''],
            ],
            // Deliberately leaves Set Code unmapped so the mapping starts out invalid.
            suggestedMappings: {
              'Card Name': { field: 'cardName', confidence: 0.95 },
              Count: { field: 'quantity', confidence: 0.9 },
            },
          }),
      });

    test('import stays disabled until quantity and card name + set are mapped, then sends fieldMappings', async ({
      page,
    }) => {
      const previewCalls = await mockPreview(page);
      const importCalls = await mockImport(page);
      await gotoImport(page);
      await selectFormat(page, 'custom');
      await expect(page.getByText('Please select a CSV file first to configure field mappings.', { exact: false })).toBeVisible();

      await chooseFile(page, 'custom.csv', CUSTOM_CSV);
      await expect(page.getByText('Map your CSV columns to MTG CB fields.')).toBeVisible();
      expect(previewCalls[0].body).toEqual({ csvData: CUSTOM_CSV, rowLimit: 5 });
      await expect(page.getByText('2 of 4 columns mapped')).toBeVisible();

      const dryRun = page.getByRole('button', { name: 'Preview (Dry Run)' });
      const realImport = page.getByRole('button', { name: 'Import Collection' });
      await expect(dryRun).toBeDisabled();
      await expect(realImport).toBeDisabled();

      await page.getByRole('row', { name: /Set Code/ }).getByRole('combobox').click();
      await page.getByRole('option', { name: 'Set Code', exact: true }).click();
      await expect(page.getByText('3 of 4 columns mapped')).toBeVisible();

      await expect(dryRun).toBeEnabled();
      await expect(realImport).toBeEnabled();

      await dryRun.click();
      await expect(resultAlert(page)).toContainText('Dry run successful: All 2 rows would be imported.');

      expect(importCalls).toHaveLength(1);
      const [call] = importCalls;
      expect(call.url.searchParams.get('format')).toBe('custom');
      expect(call.url.searchParams.get('dryRun')).toBe('true');
      expect(call.body.filename).toBe('custom.csv');
      expect(call.body.csvData).toBe(CUSTOM_CSV);
      expect(call.body.fieldMappings).toHaveLength(3);
      expect(call.body.fieldMappings).toEqual(
        expect.arrayContaining([
          { csvHeader: 'Card Name', mtgcbField: 'cardName' },
          { csvHeader: 'Count', mtgcbField: 'quantity' },
          { csvHeader: 'Set Code', mtgcbField: 'setCode' },
        ]),
      );
    });

    test('a preview error replaces the buttons with Import Another File', async ({ page }) => {
      await mockApiRoute(page, '/collection/import/preview', {
        method: 'POST',
        respond: () => ({ status: 400, body: { success: false, data: null, error: { message: 'No header row found' } } }),
      });
      const importCalls = await mockImport(page);
      await gotoImport(page);
      await selectFormat(page, 'custom');
      await chooseFile(page, 'custom.csv', CUSTOM_CSV);

      await expect(page.getByText('No header row found')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Preview (Dry Run)' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Import Another File' }).click();
      await expect(page.getByRole('button', { name: 'Select CSV File' })).toBeVisible();
      expect(importCalls).toHaveLength(0);
    });
  });

  test.describe('chunked import (>500 rows)', () => {
    const ROW_COUNT = 1200;
    const FIRST_ID = 500000;
    const idForRow = (row: number) => FIRST_ID + row;
    const rowForId = (id: number) => id - FIRST_ID;

    // Row 1 and the last row are the same card (e.g. its foil and non-foil copies),
    // so they must travel in the same request.
    const SHARED_ID = idForRow(1);
    const buildLargeCsv = () => {
      const ids = Array.from({ length: ROW_COUNT }, (_, i) => idForRow(i + 1));
      ids[ROW_COUNT - 1] = SHARED_ID;
      return buildMtgcbCsv(ids);
    };
    const idsInChunk = (csvData: string) =>
      csvData
        .split('\n')
        .slice(1)
        .map((line) => parseInt(line.split(',')[0], 10));

    test('splits into <=500-row requests, keeps a card together, and maps error rows back to the file', async ({
      page,
    }) => {
      const calls = await mockImport(page, (call, index) => {
        const rows = dataRowCount(call.body.csvData);
        if (index !== 1) return ok(result({ totalRows: rows, successfulRows: rows, created: rows }));
        return ok(
          result({
            totalRows: rows,
            successfulRows: rows - 1,
            failedRows: 1,
            errors: [{ row: 1, field: 'MTG CB ID', value: 'x', message: 'Chunk-relative row one' }],
          }),
        );
      });
      await gotoImport(page);
      await chooseFile(page, 'big.csv', buildLargeCsv());

      await page.getByRole('button', { name: 'Preview (Dry Run)' }).click();
      await expect(resultAlert(page)).toHaveText(
        `Dry run partially successful: ${ROW_COUNT - 1} of ${ROW_COUNT} rows would be imported. No changes have been made to your collection.`,
        { timeout: 20000 },
      );

      expect(calls.length).toBeGreaterThanOrEqual(3);
      const rowCounts = calls.map((c) => dataRowCount(c.body.csvData));
      rowCounts.forEach((count) => expect(count).toBeLessThanOrEqual(500));
      expect(rowCounts.reduce((sum, n) => sum + n, 0)).toBe(ROW_COUNT);

      calls.forEach((c) => {
        expect(c.body.csvData.split('\n')[0]).toBe(MTGCB_HEADER);
        expect(c.body.filename).toBe('big.csv');
        expect(c.url.searchParams.get('dryRun')).toBe('true');
        expect(c.url.searchParams.get('format')).toBe('mtgcb');
        expect(c.url.searchParams.get('updateMode')).toBe('replace');
      });

      const chunksWithSharedCard = calls.filter((c) => idsInChunk(c.body.csvData).includes(SHARED_ID));
      expect(chunksWithSharedCard).toHaveLength(1);
      expect(idsInChunk(chunksWithSharedCard[0].body.csvData).filter((id) => id === SHARED_ID)).toHaveLength(2);

      const expectedFileRow = rowForId(idsInChunk(calls[1].body.csvData)[0]);
      const errorRow = page.getByRole('row').filter({ hasText: 'Chunk-relative row one' });
      await expect(errorRow.getByRole('cell').first()).toHaveText(String(expectedFileRow));
    });

    test('a rejected chunk marks its rows failed and the remaining chunks still run', async ({ page }) => {
      let rejectedRows = 0;
      const calls = await mockImport(page, (call, index) => {
        const rows = dataRowCount(call.body.csvData);
        if (index === 1) {
          rejectedRows = rows;
          return { status: 500, body: { success: false, data: null, error: { message: 'boom' } } };
        }
        return ok(result({ totalRows: rows, successfulRows: rows, created: rows }));
      });
      await gotoImport(page);
      await chooseFile(page, 'big.csv', buildLargeCsv());

      await page.getByRole('button', { name: 'Preview (Dry Run)' }).click();
      await expect(resultAlert(page)).toContainText('Dry run partially successful', { timeout: 20000 });

      expect(calls.length).toBeGreaterThanOrEqual(3);
      await expect(resultAlert(page)).toHaveText(
        `Dry run partially successful: ${ROW_COUNT - rejectedRows} of ${ROW_COUNT} rows would be imported. No changes have been made to your collection.`,
      );
      await expect(page.getByRole('cell', { name: 'Chunk 2', exact: true })).toBeVisible();
      await expect(page.getByRole('cell', { name: /^Chunk failed:/ })).toBeVisible();
    });
  });
});
