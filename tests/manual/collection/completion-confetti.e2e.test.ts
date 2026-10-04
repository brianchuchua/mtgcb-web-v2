import { APIRequestContext, Page, expect, request as playwrightRequest, test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: a collector finishes a set, or a whole goal, and gets a confetti celebration —
// but never when nothing was actually completed (page loads, ?goalId= links, switching goals).
//
// Drives real quantity edits through the grid so the real mutation → cache invalidation →
// refetch path runs. Confetti is detected with a MutationObserver that records every
// react-confetti <canvas> (position fixed, z-index 9999) added to the page.
//
// DEV-DB SPECIFIC: relies on user 1337's quantities for the cards below (recorded 2026-10-04).
// It creates a temporary goal and restores every quantity it touches in afterAll.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `confetti-${name}.png`);
const API = 'http://local.mtgcb.com:5000';

const CARDS = {
  char: { id: 42420, name: 'Char', finish: 'foil', original: { reg: 0, foil: 2 } },
  kamahl: { id: 42421, name: 'Kamahl, Pit Fighter', finish: 'foil', original: { reg: 0, foil: 0 } },
  counterspell: { id: 45739, name: 'Counterspell', finish: 'regular', original: { reg: 0, foil: 0 } },
  incinerate: { id: 45740, name: 'Incinerate', finish: 'regular', original: { reg: 0, foil: 0 } },
  soulBurn: { id: 101399, name: 'Soul Burn', finish: 'foil', original: { reg: 0, foil: 0 } },
  urborg: { id: 101400, name: 'Urborg Skeleton', finish: 'foil', original: { reg: 0, foil: 0 } },
} as const;
type CardKey = keyof typeof CARDS;

const EXISTING_GOAL_ALL_CARDS = { id: 8677, name: '1x of all cards' };
const TEMP_GOAL_NAME = 'Confetti test (temp, safe to delete)';

test.describe.configure({ mode: 'serial', timeout: 240000 });

test.describe('User story: completion confetti fires on real completions only', () => {
  let api: APIRequestContext;
  let goalId: number;

  test.beforeAll(async () => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    api = await playwrightRequest.newContext({
      extraHTTPHeaders: { cookie: `MTGCB_AuthToken=${getLocalTestJwt()}`, 'content-type': 'application/json' },
    });

    for (const key of Object.keys(CARDS) as CardKey[]) {
      const current = await getQuantities(api, key);
      const { original } = CARDS[key];
      if (current.reg !== original.reg || current.foil !== original.foil) {
        throw new Error(`${CARDS[key].name} is ${JSON.stringify(current)}, expected ${JSON.stringify(original)}`);
      }
    }

    // Spans two sets: both DCI Legend Membership cards plus one Chinese Market card.
    const created = await api.post(`${API}/goals`, {
      data: {
        name: TEMP_GOAL_NAME,
        searchCriteria: {
          conditions: { id: { OR: [String(CARDS.counterspell.id), String(CARDS.incinerate.id), String(CARDS.soulBurn.id)] } },
        },
        targetQuantityAll: 1,
        flexibleFinishes: false,
        onePrintingPerPureName: false,
      },
    });
    const body = await created.json();
    if (!created.ok() || !body?.data?.id) throw new Error(`Goal create failed: ${JSON.stringify(body)}`);
    goalId = body.data.id;
    console.log(JSON.stringify({ label: 'fixture', goalId }));
  });

  test.afterAll(async () => {
    if (!api) return;
    for (const key of Object.keys(CARDS) as CardKey[]) {
      const { original } = CARDS[key];
      await setQuantitiesViaApi(api, key, original.reg, original.foil);
    }
    if (goalId) {
      const res = await api.delete(`${API}/goals/${LOCAL_TEST_USER_ID}/${goalId}`);
      console.log(JSON.stringify({ label: 'cleanup', goalDeleted: res.ok() }));
    }
    await api.dispose();
  });

  test.beforeEach(async ({ context, page }) => {
    await authenticateAsLocalTestUser(context);
    await instrument(page);
  });

  test('1. set page, no goal: completing the set celebrates; loads and removals do not', async ({ page }) => {
    await setQuantitiesViaApi(api, 'kamahl', 0, 0);
    const url = `/collections/${LOCAL_TEST_USER_ID}/15th-anniversary-cards`;

    await gotoAndSettle(page, url);
    await expectBursts(page, '1a-load-at-50', 0);

    await setQuantity(page, 'kamahl', 1);
    await expectBursts(page, '1b-collect-last-card', 1);

    await gotoAndSettle(page, url);
    await expectBursts(page, '1c-reload-at-100', 0);

    await setQuantity(page, 'kamahl', 0);
    await expectBursts(page, '1d-remove-card', 0);
  });

  test('2. goal view: celebrates only when the whole goal hits 100%', async ({ page }) => {
    for (const key of ['counterspell', 'incinerate', 'soulBurn'] as const) await setQuantitiesViaApi(api, key, 0, 0);
    const cardsUrl = `/collections/${LOCAL_TEST_USER_ID}?goalId=${goalId}&contentType=cards`;

    await gotoAndSettle(page, cardsUrl);
    await waitForCards(page, 3);
    await expectBursts(page, '2a-load-at-0', 0);

    await setQuantity(page, 'counterspell', 1);
    await expectBursts(page, '2b-goal-33', 0);

    await setQuantity(page, 'incinerate', 1);
    await expectBursts(page, '2c-goal-66', 0);

    await setQuantity(page, 'soulBurn', 1);
    await expectBursts(page, '2d-goal-100', 1);

    await gotoAndSettle(page, cardsUrl);
    await waitForCards(page, 3);
    await expectBursts(page, '2e-reload-at-100', 0);

    await gotoAndSettle(page, `/collections/${LOCAL_TEST_USER_ID}?goalId=${goalId}&contentType=sets`);
    await expectBursts(page, '2f-sets-view-at-100', 0);

    await gotoAndSettle(page, cardsUrl);
    await waitForCards(page, 3);
    await setQuantity(page, 'soulBurn', 0);
    await expectBursts(page, '2g-goal-back-to-66', 0);
  });

  test('3. set page with goal: ?goalId= link to a complete slice does not celebrate', async ({ page }) => {
    // DCI slice is 100%, goal 66%.
    await setQuantitiesViaApi(api, 'counterspell', 1, 0);
    await setQuantitiesViaApi(api, 'incinerate', 1, 0);
    await setQuantitiesViaApi(api, 'soulBurn', 0, 0);
    const url = `/collections/${LOCAL_TEST_USER_ID}/dci-legend-membership?goalId=${goalId}`;

    await gotoAndSettle(page, url);
    await expectBursts(page, '3a-deep-link-slice-100', 0);

    await setQuantity(page, 'incinerate', 0);
    await expectBursts(page, '3b-slice-to-50', 0);

    await setQuantity(page, 'incinerate', 1);
    await expectBursts(page, '3c-slice-back-to-100', 1);
  });

  test('4. set page with goal: completing set slice and goal together gives one burst', async ({ page }) => {
    // Chinese Market slice 0%, goal 66%; collecting Soul Burn completes both at once.
    await setQuantitiesViaApi(api, 'counterspell', 1, 0);
    await setQuantitiesViaApi(api, 'incinerate', 1, 0);
    await setQuantitiesViaApi(api, 'soulBurn', 0, 0);
    const url = `/collections/${LOCAL_TEST_USER_ID}/chinese-market-alternate-art?goalId=${goalId}`;

    await gotoAndSettle(page, url);
    await expectBursts(page, '4a-load-slice-0', 0);

    await setQuantity(page, 'soulBurn', 1);
    await expectBursts(page, '4b-slice-and-goal-100', 1);
  });

  test('5. set page: switching goals is not a completion', async ({ page }) => {
    // Under "1x of all cards" this set is 50%; under the temp goal it is 100%.
    await setQuantitiesViaApi(api, 'soulBurn', 0, 1);
    await setQuantitiesViaApi(api, 'urborg', 0, 0);
    const url = `/collections/${LOCAL_TEST_USER_ID}/chinese-market-alternate-art?goalId=${EXISTING_GOAL_ALL_CARDS.id}`;

    await gotoAndSettle(page, url);
    await expectBursts(page, '5a-load-all-cards-goal-50', 0);

    await selectGoal(page, TEMP_GOAL_NAME);
    await expectBursts(page, '5b-switch-to-temp-goal-100', 0);

    await selectGoal(page, EXISTING_GOAL_ALL_CARDS.name);
    await expectBursts(page, '5c-switch-back-50', 0);

    await selectGoal(page, TEMP_GOAL_NAME);
    await expectBursts(page, '5d-switch-to-temp-goal-again', 0);
  });
});

const instrument = async (page: Page) => {
  await page.addInitScript(() => {
    const w = window as any;
    w.__confettiBursts = [];
    const isConfettiCanvas = (el: Element) =>
      el.tagName === 'CANVAS' && (el as HTMLElement).style.zIndex === '9999' && (el as HTMLElement).style.position === 'fixed';
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          const canvases = isConfettiCanvas(node) ? [node] : Array.from(node.querySelectorAll('canvas')).filter(isConfettiCanvas);
          canvases.forEach(() => w.__confettiBursts.push({ at: Math.round(performance.now()), url: location.href }));
        });
      }
    }).observe(document, { childList: true, subtree: true });
  });

  const apiLog: string[] = [];
  (page as any).__apiLog = apiLog;
  page.on('console', (msg) => {
    if (msg.text().includes('[confetti')) apiLog.push(msg.text());
  });
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.includes(':5000/') || res.request().method() !== 'POST') return;
    if (!/\/(sets|cards)\/search|\/collection\/update/.test(u)) return;
    try {
      const body = await res.json();
      const d = body?.data;
      const kind = u.split(':5000')[1];
      const gs = d?.goalSummary;
      const set = d?.sets?.length === 1 ? d.sets[0] : null;
      apiLog.push(
        JSON.stringify({
          kind,
          goal: gs ? `${gs.goalId}:${gs.collectedCards}/${gs.totalCards}=${gs.percentageCollected}%` : undefined,
          set: set ? `${set.slug}=${set.percentageCollected}%` : undefined,
        }),
      );
    } catch {
      // Non-JSON or aborted responses are irrelevant to the log.
    }
  });
};

const gotoAndSettle = async (page: Page, url: string) => {
  await page.goto(url);
  await settle(page);
};

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  // Confetti mounts on the render after the refetch lands; give it room.
  await page.waitForTimeout(2500);
};

const waitForCards = async (page: Page, min: number) => {
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="card-item"]').length >= n, min, {
    timeout: 20000,
  });
};

const setQuantity = async (page: Page, key: CardKey, value: number) => {
  const card = CARDS[key];
  const item = page
    .getByTestId('card-item')
    .filter({ has: page.getByTestId('card-name').filter({ hasText: new RegExp(`^${card.name}$`) }) })
    .first();
  await expect(item).toBeVisible({ timeout: 20000 });
  const input = item.getByTestId(`editable-card-quantity-${card.finish}`);

  const update = page.waitForResponse((r) => r.url().includes('/collection/update') && r.request().method() === 'POST', {
    timeout: 15000,
  });
  await input.fill(String(value));
  await input.press('Tab');
  const res = await update;
  expect(res.ok()).toBe(true);
  await settle(page);
};

const selectGoal = async (page: Page, goalName: string) => {
  await page.getByRole('combobox', { name: 'Collection Goal' }).click();
  await page.getByRole('option').filter({ hasText: goalName }).first().click();
  await settle(page);
};

const expectBursts = async (page: Page, step: string, expected: number) => {
  const bursts = await page.evaluate(() => (window as any).__confettiBursts.splice(0));
  const apiLog: string[] = (page as any).__apiLog.splice(0);
  await page.screenshot({ path: shot(step), fullPage: false });
  console.log(JSON.stringify({ label: 'step', step, expected, bursts: bursts.length, url: page.url(), api: apiLog }));
  expect(bursts.length, `confetti bursts at step ${step}`).toBe(expected);

  if (bursts.length > 0) {
    // A still-mounted canvas would hide a second celebrate() from the observer.
    await page.waitForFunction(
      () => !Array.from(document.querySelectorAll('canvas')).some((c) => (c as HTMLElement).style.zIndex === '9999'),
      undefined,
      { timeout: 45000 },
    );
  }
};

const getQuantities = async (api: APIRequestContext, key: CardKey) => {
  const res = await api.post(`${API}/cards/search`, {
    data: { userId: LOCAL_TEST_USER_ID, id: { OR: [String(CARDS[key].id)] }, limit: 1, offset: 0, priceType: 'market' },
  });
  const body = await res.json();
  const card = body?.data?.cards?.[0];
  if (!card) throw new Error(`Could not read ${CARDS[key].name}: ${JSON.stringify(body).slice(0, 300)}`);
  return { reg: card.quantityReg ?? 0, foil: card.quantityFoil ?? 0 };
};

const setQuantitiesViaApi = async (api: APIRequestContext, key: CardKey, reg: number, foil: number) => {
  const res = await api.post(`${API}/collection/update`, {
    data: { mode: 'set', cards: [{ cardId: CARDS[key].id, quantityReg: reg, quantityFoil: foil }] },
  });
  console.log(JSON.stringify({ label: 'restore', card: CARDS[key].name, reg, foil, ok: res.ok() }));
};
