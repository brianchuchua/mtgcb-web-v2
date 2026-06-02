'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Theme,
  Typography,
  alpha,
} from '@mui/material';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  useGetDeprecatedHoldingsQuery,
  useGetDeprecatedHoldingSetsQuery,
  useRunDeprecatedMigrationsMutation,
} from '@/api/collections/collectionsApi';
import {
  DeprecatedHolding,
  MigrationCandidate,
  MigrationRequestItem,
  MigrationResolution,
} from '@/api/collections/types';
import { QuantitySelector } from '@/components/shared/QuantitySelector';
import { CardHoverPreview } from '@/components/cards/CardHoverPreview';
import { useAuth } from '@/hooks/useAuth';
import { generateCardSlug } from '@/utils/cards/generateCardSlug';
import { getCardBackImageUrl, getCardImageUrl } from '@/utils/cards/getCardImageUrl';
import { getCollectionCardUrl } from '@/utils/collectionUrls';

interface MigrateClientProps {
  userId: number;
}

// Caption shown under the candidates grid when ambiguous-resolution candidates were
// filtered out because the user owns 0 copies in the only finish that candidate accepts.
// Keeps the filtering non-silent so users don't wonder where a foil/regular variant went.
function hiddenCandidateMessage(info: {
  count: number;
  hiddenFoilOnly: number;
  hiddenRegOnly: number;
}): string {
  const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? '' : 's'}`;
  if (info.hiddenFoilOnly > 0 && info.hiddenRegOnly === 0) {
    return `${plural(info.hiddenFoilOnly, 'foil-only target')} hidden — you own no foil copies of this card.`;
  }
  if (info.hiddenRegOnly > 0 && info.hiddenFoilOnly === 0) {
    return `${plural(info.hiddenRegOnly, 'regular-only target')} hidden — you own no regular copies of this card.`;
  }
  return `${plural(info.count, 'target')} hidden — none match the finishes you own.`;
}

// Shared link styles for the source-card and candidate name/set rows. Names use the
// surrounding Typography color (no underline by default; hover underlines + nudges to
// primary) so the link blends with the existing layout. Set names sit beside a "—"
// fallback and get a subtler treatment. Both open in new tabs so the user doesn't lose
// their migration progress when peeking at a related page.
const migrateNameLinkSx = {
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: 1 },
} as const;
const migrateSetLinkSx = {
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: 1 },
} as const;

interface CandidateSplit {
  reg: number;
  foil: number;
}

const resolutionLabel: Record<MigrationResolution, string> = {
  auto: 'Ready to update',
  ambiguous: 'Assign update',
  no_target: 'No update available yet',
};

type ResolutionTone = 'success' | 'warning' | 'muted';

const resolutionTone: Record<MigrationResolution, ResolutionTone> = {
  auto: 'success',
  ambiguous: 'warning',
  no_target: 'muted',
};

/**
 * Pull a single integer out of a collector number for sort purposes. Handles plain ints
 * ("9", "10"), slash forms ("0001/0002"), and decorated forms ("★12"). Unknown returns
 * a sentinel so empty values sort to the end of their set group rather than the front.
 */
function collectorNumericFor(cn: string | null): number {
  if (!cn) return Number.MAX_SAFE_INTEGER;
  const m = cn.match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
}

function toneColor(theme: Theme, tone: ResolutionTone): string {
  switch (tone) {
    case 'success':
      return theme.palette.success.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'muted':
    default:
      return theme.palette.text.disabled;
  }
}

/**
 * Render a "X regular / Y foil" pair, but suppress a finish when the source card can't
 * have it AND no nonzero quantity from any displayed slot would mention it. Keeps the
 * common foil-only / nonfoil-only token rows from showing meaningless "/ 0 foil" noise.
 * `extraQuantities` lets the caller declare additional values that, if any are nonzero,
 * should force the finish to render anyway (e.g. the SplitSummary's totals).
 */
function formatFinishCounts(
  reg: number,
  foil: number,
  canBeFoil: boolean,
  canBeNonFoil: boolean,
  extraQuantities: { reg?: number[]; foil?: number[] } = {},
): string {
  const anyFoil = foil > 0 || canBeFoil || (extraQuantities.foil ?? []).some((q) => q > 0);
  const anyReg = reg > 0 || canBeNonFoil || (extraQuantities.reg ?? []).some((q) => q > 0);
  const parts: string[] = [];
  if (anyReg) parts.push(`${reg} regular`);
  if (anyFoil) parts.push(`${foil} foil`);
  if (parts.length === 0) parts.push(`${reg} regular`);
  return parts.join(' / ');
}

/**
 * Tiny card image used in the guided layout. Plain <img>; no fancy fallback — if the
 * image is missing the browser just shows the alt text. R2 serves these and the back-
 * face variant (`{id}b.jpg`) directly.
 */
/**
 * Section heading used above the source card column ("You are replacing") and the
 * candidates column ("With"). Small uppercase letterspaced label, matching the dot+label
 * vocabulary used elsewhere (ResolutionStatus, CardLegalitySection) for consistency.
 */
function SectionHeading({ children, sx }: { children: ReactNode; sx?: import('@mui/material').SxProps<Theme> }) {
  return (
    <Typography
      component="div"
      sx={[
        {
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: 'text.secondary',
          lineHeight: 1.4,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Typography>
  );
}

function MiniCardImage({
  cardId,
  alt,
  width,
  variant,
  hoverPreview,
}: {
  cardId: number;
  alt: string;
  width: number;
  /** "front" loads {cardId}.jpg, "back" loads {cardId}b.jpg. */
  variant?: 'front' | 'back';
  /** When true, hovering shows the full-size image floating near the cursor (same effect
   *  as the table view), useful for the small candidate thumbnails. */
  hoverPreview?: boolean;
}) {
  const src = variant === 'back' ? getCardBackImageUrl(String(cardId)) : getCardImageUrl(String(cardId));
  const img = (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      sx={{
        width,
        height: 'auto',
        display: 'block',
        borderRadius: '5%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        cursor: hoverPreview ? 'zoom-in' : 'default',
      }}
    />
  );
  if (!hoverPreview) return img;
  return (
    <CardHoverPreview cardId={String(cardId)} cardName={alt} imageUrl={src}>
      {img}
    </CardHoverPreview>
  );
}

export default function MigrateClient({ userId }: MigrateClientProps) {
  // Use the auth hook (not a raw redux selector) so we can wait for the /auth/me check
  // to finish before deciding ownership — otherwise the page flashes the "not your
  // collection" error during the initial paint before the user data resolves.
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const isOwner = authUser?.userId === userId;

  // Lightweight per-set rollup powers the picker without loading any holdings.
  const setsQuery = useGetDeprecatedHoldingSetsQuery(undefined, { skip: !isOwner });
  const sets = useMemo(() => setsQuery.data?.data?.sets ?? [], [setsQuery.data]);

  const [runMigrations, { isLoading: isMigrating }] = useRunDeprecatedMigrationsMutation();

  // Cards the user explicitly skipped this session. The API still returns them, so we
  // mask them client-side and unmask on page refresh — gives the user a way to defer a
  // single tricky card without losing it forever.
  const [skippedIds, setSkippedIds] = useState<Set<number>>(new Set());
  // Per-target split for the CURRENT card only. Reset whenever the current card changes.
  const [splits, setSplits] = useState<Record<number, CandidateSplit>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The set currently being worked. Holdings are fetched one set at a time, so a user with
  // thousands of replaced cards across many sets never pulls them all in a single request.
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  // Counter of successful migrations this session, used for the "Y migrated" tally.
  // Survives refetches (it's pure session state, not derived from holdings).
  const [migratedThisSession, setMigratedThisSession] = useState<number>(0);

  // Deep-link params. ?setId pins a set directly; ?cardId resolves (server-side) to the set
  // it lives in, so the link lands on the right set even though we don't load every set.
  const searchParams = useSearchParams();
  const urlSetId = useMemo(() => {
    const n = parseInt(searchParams?.get('setId') ?? '', 10);
    return Number.isInteger(n) && n > 0 ? n : null;
  }, [searchParams]);
  const targetedCardIdParam = searchParams?.get('cardId') ?? null;
  const targetedCardId = useMemo(() => {
    if (!targetedCardIdParam) return null;
    const n = parseInt(targetedCardIdParam, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
  }, [targetedCardIdParam]);

  // Fetch holdings for exactly one set: the selected set, or (before a selection is made) the
  // set a ?cardId deep-link resolves to. Skipped until we have one of those.
  const holdingsArg = useMemo<{ setId?: number; cardId?: number } | undefined>(() => {
    if (selectedSetId != null) return { setId: selectedSetId };
    if (targetedCardId != null) return { cardId: targetedCardId };
    return undefined;
  }, [selectedSetId, targetedCardId]);

  const { data, isLoading, isFetching, isError, refetch } = useGetDeprecatedHoldingsQuery(holdingsArg, {
    skip: !isOwner || !holdingsArg,
  });

  // After a ?cardId fetch resolves, sync the picker to the set the server scoped to so the
  // dropdown reflects it and subsequent fetches go by setId.
  useEffect(() => {
    const resolved = data?.data?.setId ?? null;
    if (selectedSetId == null && resolved != null) setSelectedSetId(resolved);
  }, [data, selectedSetId]);

  const rawHoldings = useMemo(() => data?.data?.holdings ?? [], [data]);

  // Stable, predictable processing order: by set name, then by source collector number
  // (numeric — "9" before "10"). The API's ORDER BY uses set name + card name + id which
  // doesn't put #9 before #10 alphabetically, so we sort client-side instead.
  const holdings = useMemo(() => {
    const sorted = [...rawHoldings];
    sorted.sort((a, b) => {
      const setA = a.sourceSetName ?? a.sourceSetCode ?? '';
      const setB = b.sourceSetName ?? b.sourceSetCode ?? '';
      const setCmp = setA.localeCompare(setB);
      if (setCmp !== 0) return setCmp;
      return collectorNumericFor(a.sourceCollectorNumber) - collectorNumericFor(b.sourceCollectorNumber);
    });
    return sorted;
  }, [rawHoldings]);

  // Set picker options come from the lightweight sets-list endpoint (counts included), so the
  // dropdown renders immediately without loading any holdings.
  const setOptions = useMemo(
    () => [...sets].sort((a, b) => (a.setName ?? '').localeCompare(b.setName ?? '')),
    [sets],
  );

  // Deep-link ?cardId reorders the current set's holdings so the targeted card is first.
  // Gracefully falls through to the normal first-in-list flow once it's acted on.
  const remaining = useMemo(() => {
    const list = holdings.filter((h) => !skippedIds.has(h.sourceCardId));
    if (targetedCardId == null) return list;
    const idx = list.findIndex((h) => h.sourceCardId === targetedCardId);
    if (idx <= 0) return list;
    return [list[idx], ...list.slice(0, idx), ...list.slice(idx + 1)];
  }, [holdings, skippedIds, targetedCardId]);
  const current = remaining[0] ?? null;
  // The 3 source cards that come after the current one. Shown as plain text below the
  // active card so the user can anticipate what's next without us rendering more cards
  // (which was the perf killer in the original all-at-once view).
  const upNext = remaining.slice(1, 4);

  // Candidates for the current card. Auto rows get a synthetic single-candidate list
  // built from the server-resolved successor; ambiguous rows use the heuristic's list;
  // no_target rows get an empty list (UI shows a "no replacement" note + skip-only).
  //
  // For ambiguous rows we additionally drop candidates the user can't allocate to —
  // a foil-only candidate when the user owns 0 foils, or a regular-only candidate when
  // the user owns 0 regulars. Those targets render with disabled selectors that the
  // user can never increment, which reads as "broken UI" more than "not applicable".
  // A small caption below summarizes how many got hidden so it's not silent.
  const { candidates, hiddenCandidateInfo } = useMemo<{
    candidates: MigrationCandidate[];
    hiddenCandidateInfo: { count: number; hiddenFoilOnly: number; hiddenRegOnly: number };
  }>(() => {
    const empty = { count: 0, hiddenFoilOnly: 0, hiddenRegOnly: 0 };
    if (!current) return { candidates: [], hiddenCandidateInfo: empty };
    if (current.resolution === 'auto' && current.successorCardId != null) {
      return {
        candidates: [
          {
            cardId: current.successorCardId,
            name: current.successorName ?? `Card #${current.successorCardId}`,
            setName: current.successorSetName,
            setSlug: current.successorSetSlug,
            setCode: current.successorSetCode,
            collectorNumber: current.successorCollectorNumber,
            backScryfallId: current.successorBackScryfallId,
            // Fall back to "both finishes allowed" if the API somehow returned null
            // (shouldn't happen for active successors, but defensive).
            canBeFoil: current.successorCanBeFoil ?? true,
            canBeNonFoil: current.successorCanBeNonFoil ?? true,
          },
        ],
        hiddenCandidateInfo: empty,
      };
    }
    if (current.resolution === 'ambiguous') {
      const ownedReg = current.quantityReg;
      const ownedFoil = current.quantityFoil;
      const isAllocatable = (c: MigrationCandidate): boolean =>
        (c.canBeNonFoil && ownedReg > 0) || (c.canBeFoil && ownedFoil > 0);
      // Sort by collector number so the candidate grid follows a predictable order
      // (e.g. "Hero (5) // Copy (1) #1", "Hero (5) // Food (22) #22", "Hero (5) //
      // Wizard (14) #14" -> ordered #1, #14, #22). The API returns candidates in DB
      // order which isn't meaningful to the user.
      const sorted = [...current.ambiguousCandidates].sort(
        (a, b) => collectorNumericFor(a.collectorNumber) - collectorNumericFor(b.collectorNumber),
      );
      const visible = sorted.filter(isAllocatable);
      // Edge case: if every candidate is unallocatable (e.g. user owns only regs but
      // every replacement is foil-only), filtering to an empty list would surface the
      // "No replacement found yet" alert — misleading because targets DO exist, just
      // not in finishes the user owns. Fall back to showing everything; the disabled
      // selectors at least communicate why migration is blocked.
      if (visible.length === 0) {
        return { candidates: sorted, hiddenCandidateInfo: empty };
      }
      const hidden = sorted.filter((c) => !isAllocatable(c));
      const hiddenFoilOnly = hidden.filter((c) => c.canBeFoil && !c.canBeNonFoil).length;
      const hiddenRegOnly = hidden.filter((c) => !c.canBeFoil && c.canBeNonFoil).length;
      return {
        candidates: visible,
        hiddenCandidateInfo: { count: hidden.length, hiddenFoilOnly, hiddenRegOnly },
      };
    }
    return { candidates: [], hiddenCandidateInfo: empty };
  }, [current]);

  // Reset splits when the current card changes. Auto rows and single-candidate ambiguous
  // rows prefill the lone candidate with the owned counts (one click to confirm);
  // multi-candidate ambiguous rows start at zero so the user actively distributes.
  const currentSourceId = current?.sourceCardId ?? null;
  useEffect(() => {
    if (!current) {
      setSplits({});
      setErrorMessage(null);
      return;
    }
    const out: Record<number, CandidateSplit> = {};
    const isPrefillEligible = current.resolution === 'auto' || candidates.length === 1;
    for (const c of candidates) {
      out[c.cardId] = isPrefillEligible
        ? { reg: current.quantityReg, foil: current.quantityFoil }
        : { reg: 0, foil: 0 };
    }
    setSplits(out);
    setErrorMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSourceId, candidates]);

  // Pin to a set. Prefer ?setId, then the first set with replaced cards. A pending ?cardId
  // deep-link resolves its own set above, so we don't snap to the first set in that case.
  useEffect(() => {
    if (sets.length === 0) return;
    if (selectedSetId != null && sets.some((s) => s.setId === selectedSetId)) return;
    if (urlSetId != null && sets.some((s) => s.setId === urlSetId)) {
      setSelectedSetId(urlSetId);
      return;
    }
    if (targetedCardId != null && selectedSetId == null) return; // wait for cardId resolution
    setSelectedSetId(sets[0].setId);
  }, [sets, selectedSetId, urlSetId, targetedCardId]);

  const setCandidateSplit = useCallback((targetCardId: number, field: 'reg' | 'foil', value: number) => {
    setSplits((prev) => {
      const next = { ...prev };
      const existing = next[targetCardId] ?? { reg: 0, foil: 0 };
      next[targetCardId] = { ...existing, [field]: value };
      return next;
    });
  }, []);

  // Allocation totals — drive the split summary text and the migrate-button enabled
  // state without recomputing inline in two places.
  const totals = useMemo(() => {
    if (!current) {
      return {
        totalReg: 0,
        totalFoil: 0,
        anyNonZero: false,
        overReg: false,
        overFoil: false,
        remainingReg: 0,
        remainingFoil: 0,
      };
    }
    let totalReg = 0;
    let totalFoil = 0;
    let anyNonZero = false;
    for (const c of candidates) {
      const s = splits[c.cardId] ?? { reg: 0, foil: 0 };
      totalReg += s.reg;
      totalFoil += s.foil;
      if (s.reg > 0 || s.foil > 0) anyNonZero = true;
    }
    return {
      totalReg,
      totalFoil,
      anyNonZero,
      overReg: totalReg > current.quantityReg,
      overFoil: totalFoil > current.quantityFoil,
      remainingReg: current.quantityReg - totalReg,
      remainingFoil: current.quantityFoil - totalFoil,
    };
  }, [current, candidates, splits]);

  const canMigrateCurrent =
    !!current && candidates.length > 0 && totals.anyNonZero && !totals.overReg && !totals.overFoil;

  const handleSkip = useCallback(() => {
    if (!current) return;
    setSkippedIds((prev) => {
      const next = new Set(prev);
      next.add(current.sourceCardId);
      return next;
    });
    setErrorMessage(null);
  }, [current]);

  const handleMigrate = useCallback(async () => {
    if (!current) return;
    if (!canMigrateCurrent) {
      setErrorMessage('Allocate at least one copy (and stay within what you own) or skip this card.');
      return;
    }

    const migrations: MigrationRequestItem[] = [];
    for (const c of candidates) {
      const s = splits[c.cardId];
      if (!s || (s.reg === 0 && s.foil === 0)) continue;
      migrations.push({
        cardId: current.sourceCardId,
        targetCardId: c.cardId,
        quantityReg: s.reg,
        quantityFoil: s.foil,
      });
    }
    if (migrations.length === 0) {
      setErrorMessage('Allocate at least one copy or skip this card.');
      return;
    }

    try {
      const response = await runMigrations({ migrations }).unwrap();
      if (response.success && response.data) {
        if (response.data.errorCount > 0) {
          const errResult = response.data.results.find((r) => r.status === 'error');
          setErrorMessage(errResult?.message ?? 'Migration encountered an error.');
          return;
        }
        if (response.data.migratedCount === 0) {
          // Server rejected everything (e.g. quantity invalid, target deprecated) but
          // didn't classify as a hard error — surface the first skip reason so the user
          // knows why.
          const skipReason = response.data.results.find((r) => r.status !== 'migrated');
          setErrorMessage(skipReason?.message ?? `Couldn't apply update (status: ${skipReason?.status ?? 'unknown'}).`);
          return;
        }
        setErrorMessage(null);
        setMigratedThisSession((n) => n + 1);
        // Refetch so cascading resolutions (resolving one face's combined may affect
        // another face's candidate list) reflect on the next card.
        await refetch();
      }
    } catch (err) {
      setErrorMessage('Failed to apply update. Try again or skip for now.');
    }
  }, [current, candidates, splits, canMigrateCurrent, runMigrations, refetch]);

  // Auth still resolving — show the same spinner the holdings load does so the user
  // doesn't see a flash of the "not your collection" error before /auth/me returns.
  if (isAuthLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!isOwner) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          You can only update your own collection. Sign in as the owner of this collection to use this tool.
        </Alert>
      </Container>
    );
  }

  // Sets list still loading — show the spinner before we know which sets have work.
  if (setsQuery.isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // No updates available in any set. Friendly empty state — for users who land here
  // without anything pending, a short blurb explains what the page exists for so the
  // success alert doesn't read as a non-sequitur.
  if (sets.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Update Cards
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          MTG CB occasionally publishes improved data for a card entry — refreshed pricing,
          corrected double-sided face combinations, or other printing fixes. When that
          happens, your copies on the old entry stop counting toward your value, collection
          percentage, and goal progress until you move them to the new entry — either with
          this tool or manually from your collection.
        </Typography>
        <Alert severity="success">Your collection is up to date.</Alert>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" action={<Button onClick={() => refetch()}>Retry</Button>}>
          Failed to load card updates.
        </Alert>
      </Container>
    );
  }

  // A set is being resolved/loaded — wait for its holdings before rendering the card.
  if (isLoading || !holdingsArg) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // All-done state: nothing left to act on for the current filter / skip set.
  if (!current) {
    const activeSet = setOptions.find((o) => o.setId === selectedSetId);
    const setLabel = activeSet ? (activeSet.setName ?? activeSet.setCode) : null;
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Update Cards
        </Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          {setLabel
            ? `Nothing left to do for ${setLabel}.`
            : "You've worked through every card update in your collection."}
        </Alert>
        {skippedIds.size > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You skipped {skippedIds.size} card{skippedIds.size === 1 ? '' : 's'}. They&apos;ll show up again next time
            you visit this page.
          </Alert>
        )}
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => {
              setSkippedIds(new Set());
              refetch();
            }}
          >
            Review skipped cards
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" gutterBottom>
        Update Cards
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        These cards have updated entries — improved printing data, fresher pricing, or corrected double-sided face
        combinations. Move your copies to the updated entry so they count toward your value, percentage, and goal
        progress. If there are multiple candidates, it&apos;s a double-sided token — pick the matching pair. Once you
        apply an update, you won&apos;t see the old version anymore.
      </Alert>

      {/* Required Set picker. A user with thousands of replaced cards across sets is
       * better served focusing on one set at a time, so there's no "All sets" option. */}
      {setOptions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="set-filter-label">Set</InputLabel>
            <Select
              labelId="set-filter-label"
              label="Set"
              value={selectedSetId ?? ''}
              onChange={(e) => setSelectedSetId(Number(e.target.value))}
            >
              {setOptions.map((opt) => (
                <MenuItem key={opt.setId} value={opt.setId}>
                  {opt.setName ?? opt.setCode} ({opt.totalCards})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {remaining.length} remaining
        {migratedThisSession > 0 ? ` · ${migratedThisSession} updated` : ''}
        {skippedIds.size > 0 ? ` · ${skippedIds.size} skipped` : ''}
      </Typography>

      <CurrentHoldingCard
        holding={current}
        candidates={candidates}
        splits={splits}
        onSetSplit={setCandidateSplit}
        totals={totals}
        userId={userId}
        hiddenCandidateInfo={hiddenCandidateInfo}
      />

      {upNext.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1.5, textAlign: { xs: 'left', sm: 'right' } }}
        >
          Up next: {upNext.map((h) => h.sourceName).join(', ')}
          {remaining.length > upNext.length + 1 ? ', …' : ''}
        </Typography>
      )}

      {/* Sticky action bar: Skip/Migrate stay glued to the viewport bottom so the user
       * doesn't have to scroll past a tall candidate grid to act. Any error message
       * rides along so it's also always visible. */}
      <Paper
        elevation={4}
        sx={{
          position: 'sticky',
          bottom: 0,
          mt: 2,
          py: 1.5,
          px: { xs: 1.5, sm: 2 },
          zIndex: 10,
          // Slight transparency over a backdrop blur reads as a floating toolbar without
          // looking like a separate card surface.
          backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(6px)',
        }}
      >
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: { sm: 'flex-end' } }}>
          <Button
            variant="outlined"
            onClick={handleSkip}
            disabled={isMigrating || isFetching}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Skip for now
          </Button>
          <Button
            variant="contained"
            onClick={handleMigrate}
            disabled={!canMigrateCurrent || isMigrating || isFetching}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {isMigrating || isFetching ? 'Updating…' : 'Apply update'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

interface CurrentHoldingCardProps {
  holding: DeprecatedHolding;
  candidates: MigrationCandidate[];
  splits: Record<number, CandidateSplit>;
  onSetSplit: (targetCardId: number, field: 'reg' | 'foil', value: number) => void;
  totals: {
    totalReg: number;
    totalFoil: number;
    anyNonZero: boolean;
    overReg: boolean;
    overFoil: boolean;
    remainingReg: number;
    remainingFoil: number;
  };
  userId: number;
  hiddenCandidateInfo: { count: number; hiddenFoilOnly: number; hiddenRegOnly: number };
}

function CurrentHoldingCard({
  holding,
  candidates,
  splits,
  onSetSplit,
  totals,
  userId,
  hiddenCandidateInfo,
}: CurrentHoldingCardProps) {
  const ownedLabel = formatFinishCounts(
    holding.quantityReg,
    holding.quantityFoil,
    holding.canBeFoil,
    holding.canBeNonFoil,
  );

  // Effective status — auto bucket if the user's allocations fully cover what they own
  // across all candidates, ambiguous otherwise. no_target preserves its muted chip.
  const isFullyAllocated =
    candidates.length > 0 && !totals.overReg && !totals.overFoil && !totals.remainingReg && !totals.remainingFoil;
  const effectiveResolution: MigrationResolution =
    holding.resolution === 'no_target' ? 'no_target' : isFullyAllocated ? 'auto' : 'ambiguous';

  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'auto auto 1fr' },
            // `start` (not `center`) so the source card column can sticky-scroll within
            // the row's full height while the candidates extend below it.
            alignItems: 'start',
            gap: { xs: 2, md: 3 },
          }}
        >
          {/* Source card — stuck to the top of the viewport on desktop so it stays
           * visible while the user scrolls through a tall candidate grid. */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              position: { md: 'sticky' },
              top: { md: 16 },
            }}
          >
            <SectionHeading>Old entry</SectionHeading>
            <MiniCardImage cardId={holding.sourceCardId} alt={holding.sourceName} width={300} />
            <Typography variant="body1" sx={{ fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
              <Box
                component={NextLink}
                href={getCollectionCardUrl(userId, generateCardSlug(holding.sourceName), String(holding.sourceCardId))}
                target="_blank"
                rel="noopener noreferrer"
                sx={migrateNameLinkSx}
              >
                {holding.sourceName}
              </Box>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {holding.sourceSetSlug ? (
                <Box
                  component={NextLink}
                  href={`/collections/${userId}/${holding.sourceSetSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={migrateSetLinkSx}
                >
                  {holding.sourceSetName ?? holding.sourceSetCode ?? '—'}
                </Box>
              ) : (
                holding.sourceSetName ?? holding.sourceSetCode ?? '—'
              )}
              {holding.sourceCollectorNumber ? ` · #${holding.sourceCollectorNumber}` : ''}
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              You own: <strong>{ownedLabel}</strong>
            </Typography>
            <ResolutionStatus resolution={effectiveResolution} />
          </Box>

          {/* Arrow — sticky alongside the source so they move together. Horizontal on
           * desktop, vertical on mobile. */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              position: { md: 'sticky' },
              top: { md: 16 },
              // Match the source card's image height so the arrow visually centers next
              // to the card art rather than against the source's full caption stack.
              minHeight: { md: 418 },
            }}
          >
            <ArrowForwardIcon sx={{ fontSize: 36, display: { xs: 'none', md: 'block' } }} />
            <ArrowDownwardIcon sx={{ fontSize: 36, display: { xs: 'block', md: 'none' } }} />
          </Box>

          {/* Candidates */}
          <Box sx={{ minWidth: 0 }}>
            <SectionHeading sx={{ mb: 1 }}>Update to</SectionHeading>
            {candidates.length > 0 ? (
              <>
                {candidates.length > 1 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Distribute your copies across one or more of these options:
                  </Typography>
                )}
                <Box
                  sx={{
                    display: 'grid',
                    // auto-fill instead of a fixed column count: each candidate cell
                    // needs ~280px (two face images side by side + padding), and the
                    // available space inside the candidates column depends on the
                    // viewport. Forcing repeat(3, 1fr) at lg was packing 3 cells into a
                    // ~676px column, which overflowed the Card and got the third cell
                    // clipped. auto-fill lets the grid pick the count that actually fits.
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(auto-fill, minmax(280px, 1fr))',
                    },
                    gap: 2,
                  }}
                >
                  {candidates.map((c) => (
                    <CandidateBlock
                      key={c.cardId}
                      candidate={c}
                      split={splits[c.cardId] ?? { reg: 0, foil: 0 }}
                      ownedReg={holding.quantityReg}
                      ownedFoil={holding.quantityFoil}
                      onChange={onSetSplit}
                      userId={userId}
                    />
                  ))}
                </Box>
                {hiddenCandidateInfo.count > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1.5, textAlign: 'center', fontStyle: 'italic' }}
                  >
                    {hiddenCandidateMessage(hiddenCandidateInfo)}
                  </Typography>
                )}
                <SplitSummary
                  ownedReg={holding.quantityReg}
                  ownedFoil={holding.quantityFoil}
                  canBeFoil={holding.canBeFoil}
                  canBeNonFoil={holding.canBeNonFoil}
                  totals={totals}
                  candidateCount={candidates.length}
                />
              </>
            ) : (
              <Alert severity="info">
                No update available yet for this card. Skip for now and check back later — it&apos;ll resurface once an
                update is published.
              </Alert>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface CandidateBlockProps {
  candidate: MigrationCandidate;
  split: CandidateSplit;
  ownedReg: number;
  ownedFoil: number;
  onChange: (targetCardId: number, field: 'reg' | 'foil', value: number) => void;
  userId: number;
}

function CandidateBlock({ candidate, split, ownedReg, ownedFoil, onChange, userId }: CandidateBlockProps) {
  const candidateId = candidate.cardId;
  const handleReg = useCallback((v: number) => onChange(candidateId, 'reg', v), [onChange, candidateId]);
  const handleFoil = useCallback((v: number) => onChange(candidateId, 'foil', v), [onChange, candidateId]);
  // Selector visibility is driven by the CANDIDATE's finishes (not the source's owned
  // quantities). A foil-only candidate shows only the Foil selector; a regular-only
  // candidate shows only Regular. The source's owned quantity still gates the selector's
  // max so the user can't over-allocate beyond what they own.
  const showReg = candidate.canBeNonFoil;
  const showFoil = candidate.canBeFoil;

  // Single face: one big image. Combined: front + back side by side.
  const imageWidth = candidate.backScryfallId ? 130 : 200;

  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
        <MiniCardImage cardId={candidate.cardId} alt={`${candidate.name} (front)`} width={imageWidth} variant="front" hoverPreview />
        {candidate.backScryfallId && (
          <MiniCardImage cardId={candidate.cardId} alt={`${candidate.name} (back)`} width={imageWidth} variant="back" hoverPreview />
        )}
      </Box>
      <Box
        sx={{
          minWidth: 0,
          width: '100%',
          // Reserve 2 lines of body2 + 1 line of caption (~52px) so 1-line names don't
          // collapse their cell shorter than its 2-line neighbors — keeps cards in the
          // same grid row visually aligned at the QuantitySelector.
          minHeight: 52,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
          <Box
            component={NextLink}
            href={getCollectionCardUrl(userId, generateCardSlug(candidate.name), String(candidate.cardId))}
            target="_blank"
            rel="noopener noreferrer"
            sx={migrateNameLinkSx}
          >
            {candidate.name}
          </Box>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {candidate.setSlug ? (
            <Box
              component={NextLink}
              href={`/collections/${userId}/${candidate.setSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={migrateSetLinkSx}
            >
              {candidate.setName ?? candidate.setCode ?? '—'}
            </Box>
          ) : (
            candidate.setName ?? candidate.setCode ?? '—'
          )}
          {candidate.collectorNumber ? ` · #${candidate.collectorNumber}` : ''}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {showReg && (
          <QuantitySelector
            value={split.reg}
            onChange={handleReg}
            min={0}
            max={ownedReg}
            label="Regular"
            size="small"
          />
        )}
        {showFoil && (
          <QuantitySelector
            value={split.foil}
            onChange={handleFoil}
            min={0}
            max={ownedFoil}
            label="Foils"
            size="small"
          />
        )}
      </Stack>
    </Box>
  );
}

// Status indicator that mirrors CardLegalitySection's dot+label pattern: a small colored
// dot with a soft halo plus uppercase letterspaced label.
function ResolutionStatus({ resolution }: { resolution: MigrationResolution }) {
  const tone = resolutionTone[resolution];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, flexShrink: 0 }}>
      <Box
        sx={(theme) => ({
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: toneColor(theme, tone),
          boxShadow: tone === 'muted' ? 'none' : `0 0 0 2px ${alpha(toneColor(theme, tone), 0.18)}`,
        })}
      />
      <Typography
        sx={(theme) => ({
          color: toneColor(theme, tone),
          fontWeight: tone === 'muted' ? 400 : 600,
          fontSize: '0.6875rem',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        })}
      >
        {resolutionLabel[resolution]}
      </Typography>
    </Box>
  );
}

interface SplitSummaryProps {
  ownedReg: number;
  ownedFoil: number;
  canBeFoil: boolean;
  canBeNonFoil: boolean;
  totals: {
    totalReg: number;
    totalFoil: number;
    anyNonZero: boolean;
    overReg: boolean;
    overFoil: boolean;
    remainingReg: number;
    remainingFoil: number;
  };
  /** Number of visible update candidates. When this is 1 the allocation is effectively
   *  automatic (no decision for the user), so the ready-to-apply summary calls that out
   *  explicitly instead of reading like the user picked a distribution. */
  candidateCount: number;
}

function SplitSummary({ ownedReg, ownedFoil, canBeFoil, canBeNonFoil, totals, candidateCount }: SplitSummaryProps) {
  // Build each "X regular / Y foil" fragment with the same finish-suppression rule the
  // source header uses. We pass the OTHER quantities being shown on this line as extras
  // so a nonzero anywhere in the line keeps the finish visible everywhere (avoids
  // "1 regular exceeds owned (1 regular > 0/0 foil)" weirdness).
  const allRegs = [ownedReg, totals.totalReg, totals.remainingReg];
  const allFoils = [ownedFoil, totals.totalFoil, totals.remainingFoil];
  const fmt = (reg: number, foil: number) =>
    formatFinishCounts(reg, foil, canBeFoil, canBeNonFoil, {
      reg: allRegs,
      foil: allFoils,
    });

  let color: 'error.main' | 'warning.main' | 'success.main' | 'text.secondary' = 'text.secondary';
  let text: string;
  if (totals.overReg || totals.overFoil) {
    color = 'error.main';
    text = `Exceeds owned (${fmt(totals.totalReg, totals.totalFoil)} > ${fmt(ownedReg, ownedFoil)})`;
  } else if (!totals.anyNonZero) {
    color = 'warning.main';
    text = 'No copies allocated yet';
  } else if (totals.remainingReg > 0 || totals.remainingFoil > 0) {
    text = `Allocated ${fmt(totals.totalReg, totals.totalFoil)} (${fmt(totals.remainingReg, totals.remainingFoil)} will stay on the old entry)`;
  } else if (candidateCount === 1) {
    color = 'success.main';
    text = `Auto-allocated ${fmt(totals.totalReg, totals.totalFoil)} to the only available option — ready to apply`;
  } else {
    color = 'success.main';
    text = `Allocated ${fmt(totals.totalReg, totals.totalFoil)} — ready to apply the update`;
  }
  return (
    <Typography variant="caption" sx={{ display: 'block', mt: 1.5, textAlign: 'center', color }}>
      {text}
    </Typography>
  );
}
