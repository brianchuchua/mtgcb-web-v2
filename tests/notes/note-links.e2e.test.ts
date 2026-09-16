import { expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

/**
 * Site-authored set/card notes are written with /browse links. A reader who has a collection
 * should be sent to the same set or card inside a collection instead, so the page they land on
 * shows what they own.
 *
 * Fixture: Mystery Booster's note on the local DB links to both a set
 * ([Heads I Win, Tails You Lose](/browse/sets/heads-i-win-tails-you-lose)) and a card
 * ([Sol Ring](/browse/cards/sol-ring/71320)).
 */
const NOTE_SET_SLUG = 'mystery-booster';
const LINKED_SET_LABEL = 'Heads I Win, Tails You Lose';
const LINKED_SET_SLUG = 'heads-i-win-tails-you-lose';
const LINKED_CARD_LABEL = 'Sol Ring';
const LINKED_CARD_SLUG = 'sol-ring';
const LINKED_CARD_ID = '71320';

const openSetNote = async (page: import('@playwright/test').Page) => {
  const callout = page.getByTestId('note-callout');
  await callout.waitFor();
  const toggle = callout.getByTestId('note-callout-toggle');
  if (await toggle.isVisible()) {
    await toggle.click();
  }
  return callout;
};

test.describe('Set note links (signed out)', () => {
  test('keeps browse links on /browse when there is no collection to point at', async ({ page }) => {
    await page.goto(`/browse/sets/${NOTE_SET_SLUG}`);
    await page.waitForLoadState('networkidle');

    const callout = await openSetNote(page);

    await expect(callout.getByRole('link', { name: LINKED_SET_LABEL }).first()).toHaveAttribute(
      'href',
      `/browse/sets/${LINKED_SET_SLUG}`,
    );
    await expect(callout.getByRole('link', { name: LINKED_CARD_LABEL }).first()).toHaveAttribute(
      'href',
      `/browse/cards/${LINKED_CARD_SLUG}/${LINKED_CARD_ID}`,
    );
  });
});

test.describe('Set note links (signed in)', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('rewrites browse links to the reader own collection while browsing', async ({ page }) => {
    await page.goto(`/browse/sets/${NOTE_SET_SLUG}`);
    await page.waitForLoadState('networkidle');

    const callout = await openSetNote(page);

    await expect(callout.getByRole('link', { name: LINKED_SET_LABEL }).first()).toHaveAttribute(
      'href',
      `/collections/${LOCAL_TEST_USER_ID}/${LINKED_SET_SLUG}`,
    );
    await expect(callout.getByRole('link', { name: LINKED_CARD_LABEL }).first()).toHaveAttribute(
      'href',
      `/collections/${LOCAL_TEST_USER_ID}/cards/${LINKED_CARD_SLUG}/${LINKED_CARD_ID}`,
    );
  });

  test('rewrites browse links on the collection set page too', async ({ page }) => {
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/${NOTE_SET_SLUG}`);
    await page.waitForLoadState('networkidle');

    const callout = await openSetNote(page);

    await expect(callout.getByRole('link', { name: LINKED_SET_LABEL }).first()).toHaveAttribute(
      'href',
      `/collections/${LOCAL_TEST_USER_ID}/${LINKED_SET_SLUG}`,
    );
    await expect(callout.getByRole('link', { name: LINKED_CARD_LABEL }).first()).toHaveAttribute(
      'href',
      `/collections/${LOCAL_TEST_USER_ID}/cards/${LINKED_CARD_SLUG}/${LINKED_CARD_ID}`,
    );
  });

  test('a rewritten set link navigates to the collection set page', async ({ page }) => {
    await page.goto(`/browse/sets/${NOTE_SET_SLUG}`);
    await page.waitForLoadState('networkidle');

    const callout = await openSetNote(page);
    await callout.getByRole('link', { name: LINKED_SET_LABEL }).first().click();

    await expect(page).toHaveURL(new RegExp(`/collections/${LOCAL_TEST_USER_ID}/${LINKED_SET_SLUG}$`));
  });

  test('a rewritten card link navigates to the collection card page', async ({ page }) => {
    await page.goto(`/browse/sets/${NOTE_SET_SLUG}`);
    await page.waitForLoadState('networkidle');

    const callout = await openSetNote(page);
    await callout.getByRole('link', { name: LINKED_CARD_LABEL }).first().click();

    await expect(page).toHaveURL(
      new RegExp(`/collections/${LOCAL_TEST_USER_ID}/cards/${LINKED_CARD_SLUG}/${LINKED_CARD_ID}$`),
    );
  });
});
