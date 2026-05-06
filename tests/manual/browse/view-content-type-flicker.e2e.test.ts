import { expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: dev-mode page load should not write to the
// `mtgcb_preferred_view_content_type` localStorage key in a loop.
//
// Background: bug report — in dev mode locally, the value flickers between
// 'cards' and 'sets' indefinitely on /browse, suspected to be triggered by
// React StrictMode's double-mount.
//
// Manual test capture pattern: instrument localStorage.setItem before any
// app code runs, record every write to the key with timestamp + value, then
// settle for ~5s on /browse and inspect the log. A healthy page should write
// 0–2 times during init and then stop. A flickering page will keep writing.

const KEY = 'mtgcb_preferred_view_content_type';

interface ViewWrite {
  ts: number;
  value: string | null;
}

type WindowWithLog = Window & { __viewWrites?: ViewWrite[] };

async function installLocalStorageProbe(page: import('@playwright/test').Page, key: string) {
  // Runs before any framework code on the next document.
  await page.addInitScript((targetKey) => {
    const w = window as WindowWithLog;
    w.__viewWrites = [];
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      if (this === window.localStorage && k === targetKey) {
        try {
          w.__viewWrites!.push({ ts: Date.now(), value: v });
        } catch {
          /* noop */
        }
      }
      return original.call(this, k, v);
    };
  }, key);
}

test.describe('User story: visiting /browse should not flicker the view-content-type preference', () => {
  test.beforeEach(async ({ page }) => {
    // Establish a clean baseline before instrumenting. Doing this on a
    // separate origin would fail the localStorage call, so we use the same
    // origin via a no-op route, then install the probe and navigate.
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* noop */
      }
    });
    await installLocalStorageProbe(page, KEY);
  });

  test('seed: clean storage, no contentType in URL', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Settle window: an idle page should stop writing within ~2s. Wait a bit
    // longer than that to give a flicker loop room to manifest.
    await page.waitForTimeout(5000);

    const writes = await page.evaluate(() => (window as WindowWithLog).__viewWrites ?? []);
    const finalValue = await page.evaluate(() => localStorage.getItem('mtgcb_preferred_view_content_type'));

    console.log(
      JSON.stringify({
        label: 'view-content-type-flicker',
        scenario: 'no-url-no-storage',
        writeCount: writes.length,
        finalValue,
        url: page.url(),
        writes: writes.slice(0, 30),
      }),
    );

    // A non-flickering page writes the preference at most a small number of
    // times during init (URL → preference) and then settles. Anything above
    // ~5 is suspicious and consistent with an oscillation loop.
    expect(writes.length).toBeLessThan(5);
  });

  test('FRESH context: never visited site before, clean storage, /browse', async ({ browser }) => {
    // Replicates the user's reported reproduction precisely: a brand-new
    // browser context (no cookies, no storage from a prior visit) navigating
    // straight to /browse with no contentType in the URL. The probe is
    // installed BEFORE the first navigation so we don't miss the earliest
    // writes.
    const context = await browser.newContext();
    const fresh = await context.newPage();

    await fresh.addInitScript((targetKey) => {
      const w = window as WindowWithLog;
      w.__viewWrites = [];
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (this === window.localStorage && k === targetKey) {
          try {
            w.__viewWrites!.push({ ts: Date.now(), value: v });
          } catch {
            /* noop */
          }
        }
        return original.call(this, k, v);
      };
    }, KEY);

    // Snapshot URL transitions while the page is settling.
    const urlSamples: { ts: number; url: string }[] = [];
    fresh.on('framenavigated', (frame) => {
      if (frame === fresh.mainFrame()) {
        urlSamples.push({ ts: Date.now(), url: frame.url() });
      }
    });

    await fresh.goto('/browse');
    await fresh.waitForLoadState('networkidle');

    // Sit on the page for a long settle window. A real loop will keep growing
    // the writes array; a healthy page settles in <2s.
    await fresh.waitForTimeout(8000);

    const writes = await fresh.evaluate(() => (window as WindowWithLog).__viewWrites ?? []);
    const finalValue = await fresh.evaluate(() =>
      localStorage.getItem('mtgcb_preferred_view_content_type'),
    );
    const finalUrl = fresh.url();
    const distinctValues = Array.from(new Set(writes.map((w) => w.value)));

    console.log(
      JSON.stringify({
        label: 'view-content-type-flicker',
        scenario: 'fresh-context-no-url-no-storage',
        writeCount: writes.length,
        distinctValues,
        finalValue,
        finalUrl,
        first10Writes: writes.slice(0, 10),
        last10Writes: writes.slice(-10),
        urlSamples: urlSamples.slice(0, 20),
      }),
    );

    await context.close();

    // Sub-5 means no loop. If we see hundreds of writes, the loop is real.
    expect(writes.length).toBeLessThan(5);
  });

  test('URL contentType=cards but storage is sets', async ({ page }) => {
    // Pre-seed localStorage with 'sets' so the URL → preference branch fires.
    await page.evaluate(() => localStorage.setItem('mtgcb_preferred_view_content_type', JSON.stringify('sets')));
    await installLocalStorageProbe(page, KEY); // re-install for cleanliness

    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(5000);

    const writes = await page.evaluate(() => (window as WindowWithLog).__viewWrites ?? []);
    const finalValue = await page.evaluate(() => localStorage.getItem('mtgcb_preferred_view_content_type'));

    console.log(
      JSON.stringify({
        label: 'view-content-type-flicker',
        scenario: 'url-cards-storage-sets',
        writeCount: writes.length,
        finalValue,
        writes: writes.slice(0, 30),
      }),
    );

    expect(writes.length).toBeLessThan(5);
  });

  test('URL contentType=sets but storage is cards', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('mtgcb_preferred_view_content_type', JSON.stringify('cards')));
    await installLocalStorageProbe(page, KEY);

    await page.goto('/browse?contentType=sets');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(5000);

    const writes = await page.evaluate(() => (window as WindowWithLog).__viewWrites ?? []);
    const finalValue = await page.evaluate(() => localStorage.getItem('mtgcb_preferred_view_content_type'));

    console.log(
      JSON.stringify({
        label: 'view-content-type-flicker',
        scenario: 'url-sets-storage-cards',
        writeCount: writes.length,
        finalValue,
        writes: writes.slice(0, 30),
      }),
    );

    expect(writes.length).toBeLessThan(5);
  });

  test('toggle cards ↔ sets via the content-type toggle does not loop', async ({ page }) => {
    // Land on browse, settle, then drive the toggle. If StrictMode plus the
    // save-preference effect form a loop, the writes list will keep growing
    // long after the click.
    await page.goto('/browse?contentType=sets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Reset the probe array so we only count writes triggered by the click.
    await page.evaluate(() => {
      (window as WindowWithLog).__viewWrites = [];
    });

    // Click the cards toggle. In dev mode the search-form sidebar is what
    // exposes content-type toggles; we test the most-likely path.
    const cardsToggle = page.getByTestId('content-type-toggle-cards');
    await cardsToggle.click();

    // Wait for URL to flip; that's the canonical signal Redux + URL synced.
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('contentType') === 'cards',
      undefined,
      { timeout: 5000 },
    );

    // Sit and watch — settle window for any post-click oscillation.
    await page.waitForTimeout(5000);

    const writes = await page.evaluate(() => (window as WindowWithLog).__viewWrites ?? []);
    const finalValue = await page.evaluate(() => localStorage.getItem('mtgcb_preferred_view_content_type'));
    const distinctValues = Array.from(new Set(writes.map((w) => w.value)));

    console.log(
      JSON.stringify({
        label: 'view-content-type-flicker',
        scenario: 'toggle-sets-to-cards',
        writeCount: writes.length,
        distinctValues,
        finalValue,
        writes: writes.slice(0, 30),
      }),
    );

    // After a single toggle, we expect 1 write and the loop must have stopped.
    expect(writes.length).toBeLessThan(5);
    // And the value should NOT alternate — every write must be the new value.
    expect(distinctValues).toEqual(['"cards"']);
  });

  test('AUTHED FRESH context, /browse, clean storage', async ({ browser }) => {
    // Same as the FRESH context test but with the test-user auth cookie set,
    // matching a logged-in dev session.
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');

    const context = await browser.newContext();
    await authenticateAsLocalTestUser(context);
    const fresh = await context.newPage();

    await fresh.addInitScript((targetKey) => {
      const w = window as WindowWithLog;
      w.__viewWrites = [];
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (this === window.localStorage && k === targetKey) {
          try {
            w.__viewWrites!.push({ ts: Date.now(), value: v });
          } catch {
            /* noop */
          }
        }
        return original.call(this, k, v);
      };
    }, KEY);

    const urlSamples: { ts: number; url: string }[] = [];
    fresh.on('framenavigated', (frame) => {
      if (frame === fresh.mainFrame()) {
        urlSamples.push({ ts: Date.now(), url: frame.url() });
      }
    });

    await fresh.goto('/browse');
    await fresh.waitForLoadState('networkidle');
    await fresh.waitForTimeout(8000);

    const writes = await fresh.evaluate(() => (window as WindowWithLog).__viewWrites ?? []);
    const finalValue = await fresh.evaluate(() =>
      localStorage.getItem('mtgcb_preferred_view_content_type'),
    );
    const finalUrl = fresh.url();
    const distinctValues = Array.from(new Set(writes.map((w) => w.value)));

    console.log(
      JSON.stringify({
        label: 'view-content-type-flicker',
        scenario: 'authed-fresh-no-url-no-storage',
        writeCount: writes.length,
        distinctValues,
        finalValue,
        finalUrl,
        first10Writes: writes.slice(0, 10),
        last10Writes: writes.slice(-10),
        urlSamples: urlSamples.slice(0, 20),
      }),
    );

    await context.close();

    expect(writes.length).toBeLessThan(5);
  });

  test('LONG-POLL: 20s observation, polled URL + storage', async ({ browser }) => {
    // Aggressive reproduction attempt: sit on /browse for a long time and
    // sample both location.href and localStorage every 100ms. If the user's
    // reported infinite loop is real and the harness is missing it, the
    // poll will show value alternation over time.
    const context = await browser.newContext();
    const fresh = await context.newPage();

    await fresh.addInitScript((targetKey) => {
      const w = window as WindowWithLog;
      w.__viewWrites = [];
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (this === window.localStorage && k === targetKey) {
          try {
            w.__viewWrites!.push({ ts: Date.now(), value: v });
          } catch {
            /* noop */
          }
        }
        return original.call(this, k, v);
      };
    }, KEY);

    await fresh.goto('/browse');
    await fresh.waitForLoadState('networkidle');

    const samples: { ts: number; url: string; storage: string | null }[] = [];
    const start = Date.now();
    while (Date.now() - start < 20000) {
      const sample = await fresh.evaluate((k) => ({
        ts: Date.now(),
        url: window.location.href,
        storage: localStorage.getItem(k),
      }), KEY);
      samples.push(sample);
      await fresh.waitForTimeout(100);
    }

    const writes = await fresh.evaluate(() => (window as WindowWithLog).__viewWrites ?? []);
    const distinctValues = Array.from(new Set(writes.map((w) => w.value)));
    const distinctUrls = Array.from(new Set(samples.map((s) => s.url)));
    const distinctStorageValues = Array.from(new Set(samples.map((s) => s.storage)));

    // Detect alternation in writes: count how many times the value flipped.
    let flips = 0;
    for (let i = 1; i < writes.length; i++) {
      if (writes[i].value !== writes[i - 1].value) flips++;
    }

    console.log(
      JSON.stringify({
        label: 'view-content-type-flicker',
        scenario: 'long-poll',
        writeCount: writes.length,
        flips,
        distinctValues,
        distinctUrls,
        distinctStorageValues,
        sampleCount: samples.length,
        first10Writes: writes.slice(0, 10),
        last10Writes: writes.slice(-10),
      }),
    );

    await context.close();

    // If we genuinely see alternation, this catches it.
    expect(flips).toBeLessThan(5);
  });

  test('MULTI-TAB: two tabs with conflicting viewType must not ping-pong', async ({ browser }) => {
    // Reproduces the actual bug: tab A on /browse?contentType=cards and tab B
    // on /browse?contentType=sets share localStorage. Pre-fix, each tab's
    // save-preference effect reacted to native `storage` events from the
    // other tab and wrote its own viewType back, looping forever at ~16ms
    // per cycle. With the ref-guarded effect, neither tab should write more
    // than once after settling.
    const context = await browser.newContext();

    const probeScript = (targetKey: string) => {
      const w = window as WindowWithLog;
      w.__viewWrites = [];
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (this === window.localStorage && k === targetKey) {
          try {
            w.__viewWrites!.push({ ts: Date.now(), value: v });
          } catch {
            /* noop */
          }
        }
        return original.call(this, k, v);
      };
    };

    const tabA = await context.newPage();
    await tabA.addInitScript(probeScript, KEY);
    await tabA.goto('/browse?contentType=cards');
    await tabA.waitForLoadState('networkidle');
    await tabA.waitForTimeout(1000);

    const tabB = await context.newPage();
    await tabB.addInitScript(probeScript, KEY);
    await tabB.goto('/browse?contentType=sets');
    await tabB.waitForLoadState('networkidle');

    // Reset both tabs' write logs to ignore init writes; we only care about
    // post-settling oscillation.
    await tabA.evaluate(() => {
      (window as WindowWithLog).__viewWrites = [];
    });
    await tabB.evaluate(() => {
      (window as WindowWithLog).__viewWrites = [];
    });

    // Sit and watch. Pre-fix this would accumulate hundreds of writes per
    // tab. Post-fix, both should stay at 0.
    await tabA.waitForTimeout(8000);

    const aWrites = await tabA.evaluate(() => (window as WindowWithLog).__viewWrites ?? []);
    const bWrites = await tabB.evaluate(() => (window as WindowWithLog).__viewWrites ?? []);
    const aDistinct = Array.from(new Set(aWrites.map((w) => w.value)));
    const bDistinct = Array.from(new Set(bWrites.map((w) => w.value)));

    console.log(
      JSON.stringify({
        label: 'view-content-type-flicker',
        scenario: 'multi-tab-cross-storage',
        tabA: { writeCount: aWrites.length, distinct: aDistinct },
        tabB: { writeCount: bWrites.length, distinct: bDistinct },
        first10AWrites: aWrites.slice(0, 10),
        first10BWrites: bWrites.slice(0, 10),
      }),
    );

    await context.close();

    // Each tab should write zero times after settle. Allow a tiny budget
    // (<5) to absorb StrictMode double-mount and other one-shot init paths.
    expect(aWrites.length).toBeLessThan(5);
    expect(bWrites.length).toBeLessThan(5);
  });
});
