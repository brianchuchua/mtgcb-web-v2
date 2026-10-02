import { BrowseSearchParams, CompletionStatusFilter, StatFilters } from '@/types/browse';

/**
 * Share links open on "Owned" for both Sets and Cards: a sharer is usually showing off
 * what they own. The default is written into the URL so the normal URL -> Redux sync
 * applies it, and only where the link doesn't already say something about ownership.
 */

const OWNED_SETS_COMPLETION = 'complete|partial';
const OWNED_CARDS_STAT = 'quantityAll=gte1';
const STAT_GROUP_SEPARATOR = ',';

export function withOwnedDefault(search: URLSearchParams): URLSearchParams | null {
  const next = new URLSearchParams(search);
  let changed = false;

  if (!search.has('includeCompletionStatus') && !search.has('excludeCompletionStatus')) {
    next.set('includeCompletionStatus', OWNED_SETS_COMPLETION);
    changed = true;
  }

  const stats = search.get('stats');
  if (!hasQuantityAllFilter(stats)) {
    next.set('stats', stats ? `${stats}${STAT_GROUP_SEPARATOR}${OWNED_CARDS_STAT}` : OWNED_CARDS_STAT);
    changed = true;
  }

  return changed ? next : null;
}

/**
 * The URL only carries the visible view's filters, so after a reload the other view's default
 * would be gone. Seeding it into that view's saved search state lets the view switch pick it up.
 * Leaves a view alone when the link already stated its ownership filter.
 */
export function withOwnedDefaultState(
  view: 'cards' | 'sets',
  saved: Partial<BrowseSearchParams>,
  search: URLSearchParams,
): Partial<BrowseSearchParams> | null {
  if (view === 'sets') {
    if (search.has('includeCompletionStatus') || search.has('excludeCompletionStatus')) return null;
    return { ...saved, completionStatus: { include: ['complete', 'partial'], exclude: [] } };
  }

  if (hasQuantityAllFilter(search.get('stats'))) return null;
  return { ...saved, stats: { ...saved.stats, quantityAll: ['gte1'] } };
}

/** Set while a share-link default may still be in this tab's search state. */
export const OWNED_DEFAULT_ACTIVE_KEY = 'mtgcb_share_owned_default_active';

export function ownedDefaultStorageKey(shareToken: string): string {
  return `mtgcb_share_owned_default:${shareToken}`;
}

/**
 * The default belongs to the share link. When the viewer leaves for a page that isn't a
 * share link, these remove it from the carried-over search state, but only while it still
 * has the default value. Any other ownership filter the viewer picked is left alone.
 */
export function isOwnedDefaultCompletion(completionStatus: CompletionStatusFilter | undefined): boolean {
  if (!completionStatus) return false;
  const include = [...completionStatus.include].sort();
  return include.length === 2 && include[0] === 'complete' && include[1] === 'partial' && completionStatus.exclude.length === 0;
}

export function withoutOwnedDefaultStat(stats: StatFilters | undefined): StatFilters | null {
  if (!stats) return null;
  const quantityAll = stats.quantityAll;
  if (!quantityAll || quantityAll.length !== 1 || quantityAll[0] !== 'gte1') return null;
  const { quantityAll: _removed, ...rest } = stats;
  return rest;
}

export function withoutOwnedDefault(view: 'cards' | 'sets', state: Partial<BrowseSearchParams>): Partial<BrowseSearchParams> | null {
  if (view === 'sets') {
    if (!isOwnedDefaultCompletion(state.completionStatus)) return null;
    const { completionStatus: _removed, ...rest } = state;
    return rest;
  }

  const stats = withoutOwnedDefaultStat(state.stats);
  if (!stats) return null;
  const { stats: _removed, ...rest } = state;
  return Object.keys(stats).length > 0 ? { ...rest, stats } : rest;
}

function hasQuantityAllFilter(stats: string | null): boolean {
  if (!stats) return false;
  return stats.split(STAT_GROUP_SEPARATOR).some((group) => group.split('=')[0] === 'quantityAll');
}
