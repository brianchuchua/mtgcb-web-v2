import { type APIRequestContext, type Page, expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt, resetCollectionEntry } from '../utils/auth';

// Regression coverage for the "quantity clicks flash back and get lost" bug
// (2026-10-19). Clicking + several times on a card's quantity made the
// value flash back to the old number while the list redrew, and clicks made
// during that window counted up from the old number, so the saved total came
// out short.
//
// Each test clicks + a known number of times on a card user 1337 doesn't own,
// records every value the input shows (and whether the input element was
// replaced, which means the card remounted), then checks:
//   - the value shown never drops back below a value already shown
//   - the value shown at the end is the number of clicks
//   - the saved value (read back from the API) is the number of clicks
//
// Run against a production build (`pnpm build && pnpm start-local`). Dev mode
// renders differently and is not what users see.

// In order, one worker (each surface reuses its card), but keep going after a
// failure so one run shows every surface.
test.describe.configure({ mode: 'default' });

const API = 'http://local.mtgcb.com:5000';

type Kind = 'grid' | 'table' | 'detail';
type Field = 'regular' | 'foil';

interface Surface {
  label: string;
  kind: Kind;
  cardId: number;
  cardSlug: string;
  cardName: string;
  url: string;
  field: Field;
}

const u = LOCAL_TEST_USER_ID;

// Cards picked because user 1337 owns 0 of each on the local DB. Each surface
// uses its own card so a failure in one can't leak into another.
const SURFACES: Surface[] = [
  {
    label: 'collection cards grid',
    kind: 'grid',
    cardId: 604,
    cardSlug: 'armageddon',
    cardName: 'Armageddon',
    url: `/collections/${u}?contentType=cards&name=Armageddon`,
    field: 'regular',
  },
  {
    label: 'collection set page grid (foil)',
    kind: 'grid',
    cardId: 7067,
    cardSlug: 'counterspell',
    cardName: 'Counterspell',
    url: `/collections/${u}/seventh-edition?name=Counterspell`,
    field: 'foil',
  },
  {
    label: 'collection cards table',
    kind: 'table',
    cardId: 898,
    cardSlug: 'wrath-of-god',
    cardName: 'Wrath of God',
    url: `/collections/${u}?contentType=cards&name=Wrath%20of%20God`,
    field: 'regular',
  },
  {
    label: 'collection set page grid',
    kind: 'grid',
    cardId: 747,
    cardSlug: 'lightning-bolt',
    cardName: 'Lightning Bolt',
    url: `/collections/${u}/unlimited-edition?name=Lightning%20Bolt`,
    field: 'regular',
  },
  {
    label: 'collection set page table',
    kind: 'table',
    cardId: 1099,
    cardSlug: 'armageddon',
    cardName: 'Armageddon',
    url: `/collections/${u}/revised-edition?name=Armageddon`,
    field: 'regular',
  },
  {
    label: 'card detail page',
    kind: 'detail',
    cardId: 1396,
    cardSlug: 'wrath-of-god',
    cardName: 'Wrath of God',
    url: `/collections/${u}/cards/wrath-of-god/1396`,
    field: 'regular',
  },
];

interface Pattern {
  label: string;
  // Gaps in ms between clicks; clicks = gaps.length + 1.
  gaps: number[];
  // Extra delay added to every /cards/search response, to stand in for a
  // slower connection than localhost.
  searchDelayMs?: number;
}

const PATTERNS: Pattern[] = [
  // Each click lands after the previous save fired (400 ms debounce).
  { label: '3 clicks, 700 ms apart', gaps: [700, 700] },
  // All clicks inside one debounce window.
  { label: '4 quick clicks', gaps: [80, 80, 80] },
  // "click click click" with a pause in the middle.
  { label: '2 quick, pause, 2 quick', gaps: [100, 600, 100] },
  // Same as the first, with search responses slowed down.
  { label: '3 clicks, 600 ms apart, slow refetch', gaps: [600, 600], searchDelayMs: 900 },
];

// In-page helpers: find the card's quantity input, track every value it shows,
// and count how often the input element is replaced (a remount).
async function installTracker(page: Page, s: Surface) {
  await page.evaluate(
    ({ kind, href, field }) => {
      const w = window as any;
      const testId =
        kind === 'table'
          ? 'card-table-quantity'
          : field === 'foil'
            ? 'editable-card-quantity-foil'
            : 'editable-card-quantity-regular';

      w.__findQtyInput = (): HTMLInputElement | null => {
        let scope: ParentNode | null = document;
        if (kind !== 'detail') {
          const link = document.querySelector(`a[href$="${href}"]`);
          if (!link) return null;
          scope = link.closest(kind === 'table' ? 'tr' : '[data-testid="card-item"]');
          if (!scope) return null;
        }
        const inputs = Array.from(scope.querySelectorAll(`input[data-testid="${testId}"]`)) as HTMLInputElement[];
        if (kind === 'table') return inputs[field === 'foil' ? 1 : 0] ?? null;
        return inputs[0] ?? null;
      };

      w.__findPlusButton = (): HTMLButtonElement | null => {
        const input = w.__findQtyInput();
        let node: HTMLElement | null = input;
        while (node && !node.querySelector('[data-testid="AddIcon"]')) node = node.parentElement;
        const icon = node?.querySelector('[data-testid="AddIcon"]');
        return (icon?.closest('button') as HTMLButtonElement) ?? null;
      };

      const st = { samples: [] as string[], remounts: 0, gone: 0, last: null as HTMLInputElement | null };
      w.__qt = st;
      const tick = () => {
        const el = w.__findQtyInput();
        if (!el) {
          if (st.last) st.gone++;
          st.last = null;
        } else {
          if (st.last && el !== st.last) st.remounts++;
          if (!st.last && st.samples.length > 0) st.remounts++;
          st.last = el;
          const v = el.value;
          if (st.samples[st.samples.length - 1] !== v) st.samples.push(v);
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { kind: s.kind, href: `/cards/${s.cardSlug}/${s.cardId}`, field: s.field },
  );
}

// Returns how many times the button was replaced between finding it and
// clicking it (the card remounted under the pointer). A user's click in that
// moment can land on nothing; the test retries so it can keep counting.
async function clickPlus(page: Page): Promise<number> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const handle = await page.waitForFunction(() => (window as any).__findPlusButton(), undefined, { timeout: 5000 });
    try {
      await handle.asElement()!.click({ timeout: 2000 });
      return attempt;
    } catch (e) {
      if (!String(e).includes('not attached')) throw e;
    }
  }
  throw new Error('+ button kept detaching');
}

async function readSaved(request: APIRequestContext, s: Surface): Promise<number> {
  const res = await request.post(`${API}/cards/search`, {
    data: {
      userId: LOCAL_TEST_USER_ID,
      priceType: 'market',
      name: s.cardName,
      limit: 100,
      select: ['id', 'quantityReg', 'quantityFoil'],
    },
    headers: { 'content-type': 'application/json', cookie: `MTGCB_AuthToken=${getLocalTestJwt()}` },
  });
  const body = await res.json();
  const card = body.data.cards.find((c: any) => String(c.id) === String(s.cardId));
  if (!card) throw new Error(`card ${s.cardId} not in search results`);
  return Number(s.field === 'foil' ? card.quantityFoil : card.quantityReg) || 0;
}

async function openSurface(page: Page, s: Surface) {
  await page.goto(s.url);
  await page.waitForLoadState('networkidle');
  if (s.kind === 'table') {
    await page.getByTestId('pagination-top').getByTestId('view-mode-toggle-table').click();
    await page.getByTestId('card-table-quantity').first().waitFor({ timeout: 15000 });
  } else if (s.kind === 'grid') {
    const toggle = page.getByTestId('pagination-top').getByTestId('view-mode-toggle-grid');
    if (await toggle.count()) await toggle.click();
    await page.getByTestId('card-item').first().waitFor({ timeout: 15000 });
  }
  await page.waitForFunction(() => (window as any).__findQtyInput?.() ?? true);
}

for (const s of SURFACES) {
  test.describe(`${s.label}`, () => {
    test.beforeEach(async ({ context }) => {
      test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
      await authenticateAsLocalTestUser(context);
      await resetCollectionEntry(context.request, s.cardId);
    });

    test.afterEach(async ({ context }) => {
      await resetCollectionEntry(context.request, s.cardId);
    });

    for (const p of PATTERNS) {
      test(p.label, async ({ page, context }) => {
        const clicks = p.gaps.length + 1;

        await openSurface(page, s);
        await installTracker(page, s);
        await page.waitForFunction(() => (window as any).__findQtyInput() !== null, undefined, { timeout: 10000 });
        await expect.poll(() => page.evaluate(() => (window as any).__findQtyInput().value)).toBe('0');

        if (p.searchDelayMs) {
          await page.route('**/cards/search', async (route) => {
            await new Promise((r) => setTimeout(r, p.searchDelayMs));
            await route.continue();
          });
        }

        let detached = 0;
        for (let i = 0; i < clicks; i++) {
          detached += await clickPlus(page);
          if (i < p.gaps.length) await page.waitForTimeout(p.gaps[i]);
        }

        // Let the last debounce, save, refetch and the 2 s editing guard finish.
        await page.waitForTimeout(3000 + (p.searchDelayMs ?? 0));
        await page.waitForLoadState('networkidle');

        const st = await page.evaluate(() => {
          const q = (window as any).__qt;
          return { samples: q.samples as string[], remounts: q.remounts as number, gone: q.gone as number };
        });
        const shownAtEnd = await page.evaluate(() => (window as any).__findQtyInput()?.value);
        const saved = await readSaved(context.request, s);

        // A drop below the highest value already shown is a flash back.
        const nums = st.samples.map((v) => Number(v));
        const drops: string[] = [];
        let max = -1;
        for (const n of nums) {
          if (n < max) drops.push(`${max}->${n}`);
          max = Math.max(max, n);
        }

        const summary = `${s.label} | ${p.label} | shown: ${st.samples.join(',')} | remounts: ${st.remounts} | detached: ${detached} | end: ${shownAtEnd} | saved: ${saved} | expected: ${clicks}`;
        console.log(summary);
        test.info().annotations.push({ type: 'result', description: summary });

        expect.soft(drops, 'value shown dropped back below an earlier value').toEqual([]);
        expect.soft(shownAtEnd, 'value shown after all saves settle').toBe(String(clicks));
        expect.soft(saved, 'value saved on the server').toBe(clicks);

        // Reload and confirm what the page shows from a fresh fetch.
        await page.unroute('**/cards/search');
        await openSurface(page, s);
        await installTracker(page, s);
        await expect
          .poll(() => page.evaluate(() => (window as any).__findQtyInput()?.value), { timeout: 10000 })
          .toBe(String(clicks));
      });
    }
  });
}
