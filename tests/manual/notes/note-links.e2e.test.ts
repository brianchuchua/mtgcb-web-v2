import { test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

/**
 * User story: a reader following a link inside a set or card note lands on the page that
 * shows what they own, not the public browse page.
 *
 * Local-DB fixtures (these notes exist in the dev database as of 2026-09-16):
 *  - Set "Mystery Booster" has a note linking to both a set and a card.
 *  - Card "Boompile" (59659, Heads I Win, Tails You Lose) has a note with no links, which is
 *    still worth a screenshot: it proves the card callout renders unchanged.
 */

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

const NOTE_SET_SLUG = 'mystery-booster';
const NOTE_CARD_SLUG = 'boompile';
const NOTE_CARD_ID = '59659';

/**
 * Rewriting happens on the client once auth resolves, so the server-rendered href starts on
 * /browse. Watch for the hydration mismatch that would cause.
 */
const watchForHydrationErrors = (page: import('@playwright/test').Page) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (
      text.includes('Hydration failed') ||
      text.includes('did not match') ||
      text.includes('Text content does not match') ||
      text.includes('Rendered more hooks') ||
      text.includes('Rendered fewer hooks') ||
      text.includes('Rules of Hooks')
    ) {
      errors.push(text);
    }
  });
  return errors;
};

const collectHrefs = async (page: import('@playwright/test').Page) => {
  const callout = page.getByTestId('note-callout').first();
  await callout.waitFor();
  const toggle = callout.getByTestId('note-callout-toggle');
  if (await toggle.isVisible()) await toggle.click();
  return callout
    .getByRole('link')
    .evaluateAll((links) => links.map((link) => ({ label: link.textContent, href: link.getAttribute('href') })));
};

test.describe('User story: note links follow the reader into their collection', () => {
  test('signed out: set note links stay on /browse', async ({ page }) => {
    const hydrationErrors = watchForHydrationErrors(page);
    await page.goto(`/browse/sets/${NOTE_SET_SLUG}`);
    await page.waitForLoadState('networkidle');

    const hrefs = await collectHrefs(page);
    await page.screenshot({ path: shot('note-links-01-browse-signed-out'), fullPage: false });

    console.log(JSON.stringify({ label: 'set-note-signed-out', url: page.url(), hrefs, hydrationErrors }));
  });

  test.describe('signed in', () => {
    test.beforeEach(async ({ context }) => {
      test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
      await authenticateAsLocalTestUser(context);
    });

    test('set note on /browse points at the reader own collection', async ({ page }) => {
      const hydrationErrors = watchForHydrationErrors(page);
      await page.goto(`/browse/sets/${NOTE_SET_SLUG}`);
      await page.waitForLoadState('networkidle');

      const hrefs = await collectHrefs(page);
      await page.screenshot({ path: shot('note-links-02-browse-signed-in'), fullPage: false });

      console.log(JSON.stringify({ label: 'set-note-browse-signed-in', url: page.url(), hrefs, hydrationErrors }));
    });

    test('set note on the collection set page stays in that collection', async ({ page }) => {
      const hydrationErrors = watchForHydrationErrors(page);
      await page.goto(`/collections/${LOCAL_TEST_USER_ID}/${NOTE_SET_SLUG}`);
      await page.waitForLoadState('networkidle');

      const hrefs = await collectHrefs(page);
      await page.screenshot({ path: shot('note-links-03-collection-set'), fullPage: false });

      console.log(JSON.stringify({ label: 'set-note-collection', url: page.url(), hrefs, hydrationErrors }));
    });

    test('following a note link lands on the collection set page', async ({ page }) => {
      await page.goto(`/browse/sets/${NOTE_SET_SLUG}`);
      await page.waitForLoadState('networkidle');

      const callout = page.getByTestId('note-callout').first();
      await callout.waitFor();
      await callout.getByTestId('note-callout-toggle').click();
      const targetHref = await callout.getByRole('link').first().getAttribute('href');
      await callout.getByRole('link').first().click();
      await page.waitForURL(`**${targetHref}`);
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: shot('note-links-04-after-following-link'), fullPage: false });
      console.log(JSON.stringify({ label: 'after-following-note-link', url: page.url() }));
    });

    test('card note renders on the collection card page', async ({ page }) => {
      await page.goto(`/collections/${LOCAL_TEST_USER_ID}/cards/${NOTE_CARD_SLUG}/${NOTE_CARD_ID}`);
      await page.waitForLoadState('networkidle');

      const callout = page.getByTestId('note-callout').first();
      await callout.waitFor();
      const text = await callout.innerText();
      const hrefs = await callout
        .getByRole('link')
        .evaluateAll((links) => links.map((link) => ({ label: link.textContent, href: link.getAttribute('href') })));

      await page.screenshot({ path: shot('note-links-05-collection-card'), fullPage: false });
      console.log(JSON.stringify({ label: 'card-note-collection', url: page.url(), text, hrefs }));
    });
  });
});
