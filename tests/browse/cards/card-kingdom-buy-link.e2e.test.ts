import { expect, test } from '@playwright/test';

/**
 * E2E: Card Kingdom buy-link feature on the card detail page.
 *
 * Covers the §8 frontend changes plus the post-feedback revisions:
 *  - Card Kingdom price block ("Card Kingdom Prices" header) renders alongside the
 *    TCGPlayer block ("TCGPlayer Prices") on the detail page.
 *  - When both regular and foil CK URLs are populated we render TWO buy buttons
 *    ("Buy Regular on Card Kingdom" + "Buy Foil on Card Kingdom") with equal
 *    visual prominence to the TCG button.
 *  - Foil-only special-treatment Card rows (Foil Etched / Rainbow Foil) get a
 *    single "Buy on Card Kingdom" button and the price block only renders the
 *    Foil row.
 *  - Clicking the card image OR the price link opens the buy-options menu,
 *    not a direct TCG link. The menu omits "View Card Page" since we're
 *    already on the detail page.
 *  - Collision-skipped Card rows (CK fields all NULL) suppress the price block
 *    and skip the split CK buttons; the name-search fallback button still renders.
 *
 * Depends on:
 *  - Dev server running at the playwright baseURL.
 *  - Local DB seeded with the mtgcb-importer Card Kingdom seed task.
 */

const REGULAR_CARD_URL = '/browse/cards/lightning-bolt/59187';
const FOIL_ETCHED_CARD_URL = '/browse/cards/najeela-the-blade-blossom-foil-etched/48300';
// A Card row that genuinely has no CK data (e.g., a freshly-released printing or a
// card the heuristic couldn't bind). Update this id if it ever gets bound — the
// SQL `WHERE "cardKingdomId" IS NULL AND "cardKingdomFoilId" IS NULL` finds candidates.
const UNBOUND_CARD_URL = '/browse/cards/light-up-the-stage/102898';

test.describe('Card Kingdom buy-link on the card detail page', () => {
  test.describe('Section headers', () => {
    test('uses "TCGPlayer Prices" and "Card Kingdom Prices" as block headers', async ({ page }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('TCGPlayer Prices')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Card Kingdom Prices')).toBeVisible();
    });

    test('detail blocks start collapsed on the detail page', async ({ page }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      // Headers visible, but detail rows hidden initially.
      await expect(page.getByTestId('tcgplayer-prices-header')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('card-kingdom-prices-header')).toBeVisible();
      await expect(page.getByTestId('tcgplayer-prices-detail')).toHaveCount(0);
      await expect(page.getByTestId('card-kingdom-prices-detail')).toHaveCount(0);
    });

    test('clicking a header expands the corresponding detail block', async ({ page }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      await page.getByTestId('tcgplayer-prices-header').click();
      await expect(page.getByTestId('tcgplayer-prices-detail')).toBeVisible();

      await page.getByTestId('card-kingdom-prices-header').click();
      await expect(page.getByTestId('card-kingdom-prices-detail')).toBeVisible();
      await expect(page.getByTestId('card-kingdom-nonfoil-price')).toBeVisible();
      await expect(page.getByTestId('card-kingdom-foil-price')).toBeVisible();
    });
  });

  test.describe('Regular printing with both nonfoil and foil CK prices', () => {
    test('renders the Card Kingdom block (header visible; detail rows after expand)', async ({
      page,
    }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      // Container visible (header is present).
      await expect(page.getByTestId('card-kingdom-prices')).toBeVisible({ timeout: 10000 });
      // Detail rows only after expanding.
      await page.getByTestId('card-kingdom-prices-header').click();
      await expect(page.getByTestId('card-kingdom-nonfoil-price')).toBeVisible();
      await expect(page.getByTestId('card-kingdom-foil-price')).toBeVisible();
    });

    test('renders SPLIT TCGPlayer + Card Kingdom buy buttons (Regular + Foil each)', async ({
      page,
    }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      // Lightning Bolt id 59187 has both nonfoil + foil prices on TCG and CK,
      // so we expect 4 buy buttons total (2 TCG + 2 CK).
      const tcgRegular = page.getByTestId('buy-regular-on-tcgplayer-button');
      const tcgFoil = page.getByTestId('buy-foil-on-tcgplayer-button');
      const ckRegular = page.getByTestId('buy-regular-on-card-kingdom-button');
      const ckFoil = page.getByTestId('buy-foil-on-card-kingdom-button');

      await expect(tcgRegular).toBeVisible({ timeout: 10000 });
      await expect(tcgFoil).toBeVisible();
      await expect(ckRegular).toBeVisible();
      await expect(ckFoil).toBeVisible();

      // Equal-prominence styling: all four carry the MUI "contained" class.
      for (const button of [tcgRegular, tcgFoil, ckRegular, ckFoil]) {
        const classes = (await button.getAttribute('class')) ?? '';
        expect(classes).toContain('MuiButton-contained');
      }
    });

    test('TCG Regular button URL filters to Printing=Normal; TCG Foil to Printing=Foil', async ({
      page,
    }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      const tcgRegularHref = await page
        .getByTestId('buy-regular-on-tcgplayer-button')
        .getAttribute('href');
      const tcgFoilHref = await page
        .getByTestId('buy-foil-on-tcgplayer-button')
        .getAttribute('href');
      expect(tcgRegularHref).toContain('Printing%3DNormal');
      expect(tcgFoilHref).toContain('Printing%3DFoil');
    });

    test('regular CK button URL points at nonfoil path; foil CK button at foil path', async ({
      page,
    }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      const regularHref = await page
        .getByTestId('buy-regular-on-card-kingdom-button')
        .getAttribute('href');
      const foilHref = await page
        .getByTestId('buy-foil-on-card-kingdom-button')
        .getAttribute('href');

      expect(regularHref).toContain('cardkingdom.com');
      expect(regularHref).toContain('partner=MTGCB');
      expect(foilHref).toContain('cardkingdom.com');
      expect(foilHref).toContain('partner=MTGCB');
      expect(regularHref).not.toBe(foilHref); // distinct CK products
    });
  });

  test.describe('Click-to-buy-menu interactions on the detail page', () => {
    test('clicking the image opens a menu with split TCG + CK options (no "View Card Page")', async ({
      page,
    }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      const trigger = page.getByTestId('card-image-buy-menu-trigger').first();
      await expect(trigger).toBeVisible({ timeout: 10000 });
      await trigger.click();

      // Use menu-specific test-ids to avoid colliding with the same-text buttons
      // also rendered in the price section below the image.
      await expect(page.getByTestId('buy-regular-on-tcgplayer-menu-item')).toBeVisible();
      await expect(page.getByTestId('buy-foil-on-tcgplayer-menu-item')).toBeVisible();
      await expect(page.getByTestId('buy-regular-on-card-kingdom-menu-item')).toBeVisible();
      await expect(page.getByTestId('buy-foil-on-card-kingdom-menu-item')).toBeVisible();

      // "View Card Page" must NOT appear — we're already on the card page.
      await expect(page.getByText('View Card Page')).toHaveCount(0);
    });

    test('the card image is wrapped in a buy-menu trigger, not a direct TCGPlayer anchor', async ({
      page,
    }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      // The buy-menu trigger box exists. Playwright's toHaveCount expects an exact number,
      // so we assert that the count is greater than zero by checking the first locator visible.
      await expect(page.getByTestId('card-image-buy-menu-trigger').first()).toBeVisible();
      // The legacy direct-anchor wrapper should NOT wrap the image (no anchor at the
      // image-container level pointing at TCGPlayer).
      const imageAnchorCount = await page
        .locator('[data-testid="card-image-container"] >> a[href*="tcgplayer"]')
        .count();
      expect(imageAnchorCount).toBe(0);
    });
  });

  test.describe('Foil Etched treatment (foil-only Card row)', () => {
    test('shows only the Foil row in the Card Kingdom price block', async ({ page }) => {
      await page.goto(FOIL_ETCHED_CARD_URL);
      await page.waitForLoadState('networkidle');

      // Section is collapsed by default. Expand it to access the per-finish rows.
      await expect(page.getByTestId('card-kingdom-prices')).toBeVisible({ timeout: 10000 });
      await page.getByTestId('card-kingdom-prices-header').click();
      await expect(page.getByTestId('card-kingdom-foil-price')).toBeVisible();
      await expect(page.getByTestId('card-kingdom-nonfoil-price')).toHaveCount(0);
    });

    test('renders ONE collapsed CK button (no split regular/foil)', async ({ page }) => {
      await page.goto(FOIL_ETCHED_CARD_URL);
      await page.waitForLoadState('networkidle');

      await expect(page.getByTestId('buy-on-card-kingdom-button')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('buy-regular-on-card-kingdom-button')).toHaveCount(0);
      await expect(page.getByTestId('buy-foil-on-card-kingdom-button')).toHaveCount(0);

      const href = await page.getByTestId('buy-on-card-kingdom-button').getAttribute('href');
      expect(href).toContain('cardkingdom.com');
      expect(href).toMatch(/foil-etched/i);
      expect(href).toContain('partner=MTGCB');
    });
  });

  test.describe('Prices embedded in button labels', () => {
    test('all four split buttons carry per-finish prices', async ({ page }) => {
      await page.goto(REGULAR_CARD_URL);
      await page.waitForLoadState('networkidle');

      await expect(
        page.getByRole('link', { name: /Buy on TCGPlayer \(Regular\) \(\$\d+\.\d{2}\)/ }),
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole('link', { name: /Buy on TCGPlayer \(Foil\) \(\$\d+\.\d{2}\)/ }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Buy on Card Kingdom \(Regular\) \(\$\d+\.\d{2}\)/ }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Buy on Card Kingdom \(Foil\) \(\$\d+\.\d{2}\)/ }),
      ).toBeVisible();
    });
  });

  test.describe('Card with no CK data (heuristic still produces a usable fallback button)', () => {
    test('suppresses the price block and split buttons; falls back to the name-search button', async ({
      page,
    }) => {
      // Note: this needs a card whose `cardKingdomId` AND `cardKingdomFoilId` are both
      // NULL. After a successful seed + Find Missing Bindings run, almost every card
      // has at least one id bound, so the candidate set shrinks to recently-released
      // printings. If the card referenced by UNBOUND_CARD_URL gets bound, update the
      // constant to a different unbound card — the SQL query in the file header
      // explains how to find one.
      await page.goto(UNBOUND_CARD_URL);
      await page.waitForLoadState('networkidle');

      // No CK price data → no price block, no split buttons.
      await expect(page.getByTestId('card-kingdom-prices')).toHaveCount(0);
      await expect(page.getByTestId('buy-regular-on-card-kingdom-button')).toHaveCount(0);
      await expect(page.getByTestId('buy-foil-on-card-kingdom-button')).toHaveCount(0);

      // Fallback search button is still rendered (matches TCG's always-on behavior).
      const ckButton = page.getByTestId('buy-on-card-kingdom-button');
      await expect(ckButton).toBeVisible({ timeout: 10000 });
      const href = await ckButton.getAttribute('href');
      expect(href).toContain('cardkingdom.com/catalog/search');
      expect(href).toContain('partner=MTGCB');
    });
  });
});
