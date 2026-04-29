import { expect, test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user views a card detail page within their own
// collection. Verifies the inline EditableCardQuantity renders.
// (CardTableRenderer's debounced quantity input is exercised separately by
// regular e2e card-table-quantity-limits tests.)

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test('Card detail in collection shows EditableCardQuantity inputs', async ({ context, page }) => {
  test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
  await authenticateAsLocalTestUser(context);

  const reactErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
      reactErrors.push(msg.text());
    }
  });

  // Lightning Bolt in Manath's collection context.
  await page.goto(`/collections/${LOCAL_TEST_USER_ID}/cards/lightning-bolt/59187`);
  await page.waitForLoadState('networkidle');

  // Quantity inputs render with the testids used by card-detail-quantity-limits regular e2e.
  await page.getByTestId('editable-card-quantity-regular').waitFor({ timeout: 10000 });

  await page.screenshot({ path: shot('collection-card-detail'), fullPage: false });
  console.log(JSON.stringify({ url: page.url(), label: 'collection-card-detail' }));

  expect(reactErrors).toEqual([]);
});
