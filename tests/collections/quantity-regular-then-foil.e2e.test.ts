import { type APIRequestContext, type Page, expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt, resetCollectionEntry } from '../utils/auth';

// Regression coverage for "Regular changes lost when Foil is clicked right
// after" (2026-10-20). Clicking Regular + a few times and then Foil + before
// the Regular save had gone out (400 ms debounce) saved only the Foil change.
//
// Each test clicks Regular and Foil + buttons in a set order on a card user
// 1337 owns 0 of, then checks both values on screen, on the server (via the
// API) and after a reload.
//
// Run against a production build (`pnpm build && pnpm start-local`).

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
}

const u = LOCAL_TEST_USER_ID;

// Foil-capable cards user 1337 owns 0 of on the local DB, one per surface.
const SURFACES: Surface[] = [
  {
    label: 'collection set page grid',
    kind: 'grid',
    cardId: 7182,
    cardSlug: 'llanowar-elves',
    cardName: 'Llanowar Elves',
    url: `/collections/${u}/seventh-edition?name=Llanowar%20Elves`,
  },
  {
    label: 'collection set page table',
    kind: 'table',
    cardId: 7126,
    cardSlug: 'giant-growth',
    cardName: 'Giant Growth',
    url: `/collections/${u}/seventh-edition?name=Giant%20Growth`,
  },
  {
    label: 'card detail page',
    kind: 'detail',
    cardId: 7285,
    cardSlug: 'shock',
    cardName: 'Shock',
    url: `/collections/${u}/cards/shock/7285`,
  },
];

// A step is one + click on a field, then a wait before the next step.
type Step = [Field, number];

interface Pattern {
  label: string;
  steps: Step[];
}

const repeat = (field: Field, n: number, gap: number): Step[] => Array.from({ length: n }, () => [field, gap] as Step);

const PATTERNS: Pattern[] = [
  // The reported case: Foil clicks start while the Regular save is still waiting.
  { label: '4 quick regular, then 5 quick foil', steps: [...repeat('regular', 4, 80), ...repeat('foil', 5, 80)] },
  // One Foil click 250 ms after the last Regular click.
  { label: '2 quick regular, foil 250 ms later', steps: [['regular', 80], ['regular', 250], ['foil', 0]] },
  // Alternating fields inside one debounce window.
  {
    label: 'alternate regular and foil quickly',
    steps: [
      ['regular', 120],
      ['foil', 120],
      ['regular', 120],
      ['foil', 120],
    ],
  },
  // Foil starts well after the Regular save went out (control case).
  { label: '3 quick regular, pause, 2 quick foil', steps: [...repeat('regular', 2, 80), ['regular', 1500], ...repeat('foil', 2, 80)] },
];

async function installHelpers(page: Page, s: Surface) {
  await page.evaluate(
    ({ kind, href }) => {
      const w = window as any;
      w.__findQtyInput = (field: 'regular' | 'foil'): HTMLInputElement | null => {
        let scope: ParentNode | null = document;
        if (kind !== 'detail') {
          const link = document.querySelector(`a[href$="${href}"]`);
          if (!link) return null;
          scope = link.closest(kind === 'table' ? 'tr' : '[data-testid="card-item"]');
          if (!scope) return null;
        }
        if (kind === 'table') {
          const inputs = Array.from(scope.querySelectorAll('input[data-testid="card-table-quantity"]'));
          return (inputs[field === 'foil' ? 1 : 0] as HTMLInputElement) ?? null;
        }
        const testId = field === 'foil' ? 'editable-card-quantity-foil' : 'editable-card-quantity-regular';
        return scope.querySelector(`input[data-testid="${testId}"]`) as HTMLInputElement | null;
      };
      w.__findPlusButton = (field: 'regular' | 'foil'): HTMLButtonElement | null => {
        let node: HTMLElement | null = w.__findQtyInput(field);
        while (node && !node.querySelector('[data-testid="AddIcon"]')) node = node.parentElement;
        return (node?.querySelector('[data-testid="AddIcon"]')?.closest('button') as HTMLButtonElement) ?? null;
      };
    },
    { kind: s.kind, href: `/cards/${s.cardSlug}/${s.cardId}` },
  );
}

async function clickPlus(page: Page, field: Field) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const handle = await page.waitForFunction((f) => (window as any).__findPlusButton(f), field, { timeout: 5000 });
    try {
      await handle.asElement()!.click({ timeout: 2000 });
      return;
    } catch (e) {
      if (!String(e).includes('not attached')) throw e;
    }
  }
  throw new Error(`${field} + button kept detaching`);
}

const shown = (page: Page) =>
  page.evaluate(() => ({
    regular: (window as any).__findQtyInput('regular')?.value,
    foil: (window as any).__findQtyInput('foil')?.value,
  }));

async function readSaved(request: APIRequestContext, s: Surface) {
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
  return { regular: Number(card.quantityReg) || 0, foil: Number(card.quantityFoil) || 0 };
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
  await installHelpers(page, s);
  await page.waitForFunction(() => (window as any).__findQtyInput('foil') !== null, undefined, { timeout: 10000 });
}

for (const s of SURFACES) {
  test.describe(s.label, () => {
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
        const expected = {
          regular: p.steps.filter(([f]) => f === 'regular').length,
          foil: p.steps.filter(([f]) => f === 'foil').length,
        };

        await openSurface(page, s);
        await expect.poll(() => shown(page)).toEqual({ regular: '0', foil: '0' });

        for (const [field, gap] of p.steps) {
          await clickPlus(page, field);
          if (gap) await page.waitForTimeout(gap);
        }

        // Last debounce, saves, refetch and the 2 s editing guard.
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle');

        const onScreen = await shown(page);
        const saved = await readSaved(context.request, s);
        const summary = `${s.label} | ${p.label} | shown: ${onScreen.regular}/${onScreen.foil} | saved: ${saved.regular}/${saved.foil} | expected: ${expected.regular}/${expected.foil}`;
        console.log(summary);
        test.info().annotations.push({ type: 'result', description: summary });

        expect.soft(onScreen, 'values shown after all saves settle').toEqual({
          regular: String(expected.regular),
          foil: String(expected.foil),
        });
        expect.soft(saved, 'values saved on the server').toEqual(expected);

        await openSurface(page, s);
        await expect
          .poll(() => shown(page), { timeout: 10000 })
          .toEqual({ regular: String(expected.regular), foil: String(expected.foil) });
      });
    }
  });
}
