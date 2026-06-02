'use client';

import { Alert, Box, Button } from '@mui/material';
import Link from 'next/link';
import { useGetDeprecatedCardCountQuery } from '@/api/collections/collectionsApi';

interface DeprecatedCardsBannerProps {
  userId: number;
  /** The set being viewed. The banner only counts (and shows for) deprecated cards the user
   *  owns IN this set, so it appears on set pages that have replacements to migrate. */
  setId: number;
}

/**
 * Surfaces a one-line banner with a CTA to the migration page when the signed-in user owns
 * deprecated cards in the current set. Uses the lightweight set-scoped count endpoint (no
 * heuristic, no holdings payload) so it stays cheap. Renders nothing when the set is clean.
 */
export function DeprecatedCardsBanner({ userId, setId }: DeprecatedCardsBannerProps) {
  const { data } = useGetDeprecatedCardCountQuery({ setId });
  const totalCards = data?.data?.totalCards ?? 0;

  if (totalCards === 0) return null;

  const message =
    totalCards === 1
      ? `You own a card in this set with a card data update available. It won't count toward your progress, value, or goals until you apply the update.`
      : `You own ${totalCards} cards in this set with card data updates available. They won't count toward your progress, value, or goals until you apply the updates.`;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity="warning"
        action={
          <Button
            component={Link}
            href={`/collections/${userId}/migrate?setId=${setId}`}
            size="small"
            color="inherit"
          >
            Update
          </Button>
        }
      >
        {message}
      </Alert>
    </Box>
  );
}

export default DeprecatedCardsBanner;
