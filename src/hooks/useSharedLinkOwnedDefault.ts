import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import { loadSearchState, saveSearchState } from '@/hooks/useSearchStateSync';
import { setCompletionStatus, setStats } from '@/redux/slices/browse';
import { RootState } from '@/redux/store';
import { BrowseSearchParams } from '@/types/browse';
import { safeSessionStorage } from '@/utils/browser/safeStorage';
import {
  OWNED_DEFAULT_ACTIVE_KEY,
  isOwnedDefaultCompletion,
  ownedDefaultStorageKey,
  withOwnedDefault,
  withOwnedDefaultState,
  withoutOwnedDefault,
  withoutOwnedDefaultStat,
} from '@/utils/sharedLinkOwnedDefault';

/**
 * Applies the "Owned" default the first time a share link is opened in this tab.
 * Returns true once the URL is final, so the page can mount the collection only then
 * and its URL -> Redux sync picks the default up on initialisation.
 *
 * Once per tab per token: after that the viewer's own choices (including "All")
 * survive reloads through the normal sessionStorage restore.
 *
 * Leaving share links for any other page drops the default again (see
 * useDropSharedOwnedDefault), so it doesn't follow the viewer into their own collection.
 */
export const useSharedLinkOwnedDefault = (shareToken: string): boolean => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [awaitingUrl, setAwaitingUrl] = useState(false);
  const started = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!shareToken || started.current) return;
    started.current = true;

    const storageKey = ownedDefaultStorageKey(shareToken);
    const alreadyApplied = safeSessionStorage.getItem(storageKey) !== null;
    safeSessionStorage.setItem(storageKey, '1');

    const search = new URLSearchParams(searchParams?.toString() ?? '');
    const next = alreadyApplied ? null : withOwnedDefault(search);
    if (!next) {
      setReady(true);
      return;
    }

    seedOwnedDefault(search);
    safeSessionStorage.setItem(OWNED_DEFAULT_ACTIVE_KEY, '1');
    setAwaitingUrl(true);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [shareToken, searchParams, pathname, router]);

  useEffect(() => {
    if (ready || !awaitingUrl) return;
    if (withOwnedDefault(new URLSearchParams(searchParams?.toString() ?? '')) === null) {
      setReady(true);
    }
  }, [ready, awaitingUrl, searchParams]);

  return ready;
};

/**
 * Runs wherever browse state is restored (useBrowseStateSync). On any page that isn't a share
 * link it drops a share-link default still carried in this tab. It is a layout effect so it
 * runs before the sync's own initialisation reads the saved search state.
 */
export const useDropSharedOwnedDefault = () => {
  const pathname = usePathname();
  const store = useStore<RootState>();

  useLayoutEffect(() => {
    if (!pathname || pathname.startsWith('/shared/')) return;
    if (safeSessionStorage.getItem(OWNED_DEFAULT_ACTIVE_KEY) === null) return;
    safeSessionStorage.removeItem(OWNED_DEFAULT_ACTIVE_KEY);
    dropOwnedDefault(store);
  }, [pathname, store]);
};

const seedOwnedDefault = (search: URLSearchParams) => {
  (['sets', 'cards'] as const).forEach((view) => {
    const seeded = withOwnedDefaultState(view, loadSearchState(view) ?? {}, search);
    if (seeded) saveSearchState(view, seeded as BrowseSearchParams, view);
  });
};

const dropOwnedDefault = (store: ReturnType<typeof useStore<RootState>>) => {
  (['sets', 'cards'] as const).forEach((view) => {
    const saved = loadSearchState(view);
    const stripped = saved ? withoutOwnedDefault(view, saved) : null;
    if (stripped) saveSearchState(view, stripped as BrowseSearchParams, view);
  });

  const { browse } = store.getState();
  if (isOwnedDefaultCompletion(browse.setsSearchParams.completionStatus)) {
    store.dispatch(setCompletionStatus({ include: [], exclude: [] }));
  }
  const stats = withoutOwnedDefaultStat(browse.cardsSearchParams.stats);
  if (stats) store.dispatch(setStats(stats));
};
