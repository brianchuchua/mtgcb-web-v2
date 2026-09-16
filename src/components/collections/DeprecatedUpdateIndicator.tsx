'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Button, Popover, Theme, Typography, alpha } from '@mui/material';
import Link from 'next/link';
import React, { MouseEvent, useState } from 'react';

interface DeprecatedUpdateIndicatorProps {
  /** Used to build a /collections/[userId]/migrate link in the popover. Null on shared
   *  collection views where we don't expose the migration tool to non-owners. */
  userId: string | null;
  /** The card this indicator is rendered for. Threaded into the migrate link as ?cardId so
   *  the migrate page deep-links straight to this card instead of starting at the top
   *  of the user's deprecated list. */
  cardId: string;
}

/**
 * Subtle "card data update available" indicator for a card the user owns whose entry has
 * been superseded. Shared by the grid (CardItem) and the table (CardTableRenderer) so both
 * views warn with identical wording — the table went without one until 2026-09-16.
 *
 * Mirrors the dot+letterspaced-label pattern from CardLegalitySection.tsx and the
 * migrate page's ResolutionStatus — a small warning-colored dot with a soft halo plus
 * uppercase letterspaced "UPDATE AVAILABLE" label, ending in a small inline ⓘ icon.
 * The whole strip is clickable; click opens a Popover explaining the update and
 * (for owners) linking to the update tool.
 *
 * Avoids the MUI Chip look, which read as too heavy on the otherwise-clean card box.
 * Component name retains "Deprecated" since that's the DB column it surfaces, but no
 * user-facing string uses that word.
 */
export function DeprecatedUpdateIndicator({ userId, cardId }: DeprecatedUpdateIndicatorProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  // Stop click events inside the popover from bubbling up to the parent card or table row's
  // onClick (which would navigate away from the collection page mid-read).
  const stopPropagation = (event: MouseEvent<HTMLElement>) => event.stopPropagation();

  const warningColor = (theme: Theme) => theme.palette.warning.main;

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={handleOpen}
        aria-label="Card data update available. Click for details."
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.625,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          // Soft pill-shaped hit area gives a subtle hover affordance without a heavy chip.
          borderRadius: '999px',
          px: 0.5,
          py: 0.25,
          transition: 'background-color 0.15s',
          '&:hover': (theme) => ({
            backgroundColor: alpha(theme.palette.warning.main, 0.08),
          }),
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: warningColor,
            boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.warning.main, 0.18)}`,
            flexShrink: 0,
          }}
        />
        <Typography
          component="span"
          sx={{
            color: warningColor,
            fontWeight: 600,
            fontSize: '0.6875rem',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          Update Available
        </Typography>
        <InfoOutlinedIcon sx={{ fontSize: 13, color: warningColor }} />
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        onClick={stopPropagation}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, maxWidth: 320 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Card data update available
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            There&apos;s an update for this card entry — usually a corrected double-sided token product, fresher pricing
            data, or improved face data. Your copies here don&apos;t count toward your value, collection percentage, or
            goal progress until you apply the update.
          </Typography>
          {userId ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                component={Link}
                href={`/collections/${userId}/migrate?cardId=${cardId}`}
                color="warning"
                variant="outlined"
                size="small"
                onClick={stopPropagation}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Update
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Sign in as the owner of this collection to apply card updates.
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}

export default DeprecatedUpdateIndicator;
