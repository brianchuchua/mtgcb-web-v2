'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, ButtonBase, Collapse, Typography, alpha } from '@mui/material';
import React, { useId, useState } from 'react';
import { NoteText } from './NoteText';

interface NoteCalloutProps {
  note?: string | null;
  /** Heading shown above the text. Defaults to "Note". */
  label?: string;
  /** Widest the callout grows; the set page centres it, the card page fills its column. */
  maxWidth?: number | string;
  /**
   * Collapsed to a one-line header the reader can open. Set pages use this so a long note
   * does not push the card grid down; card pages leave it off and show the text inline.
   */
  collapsible?: boolean;
  /** Only meaningful with `collapsible`. Defaults to collapsed. */
  defaultExpanded?: boolean;
  sx?: React.ComponentProps<typeof Box>['sx'];
}

/**
 * A quiet inline callout for site-authored notes on set and card pages.
 *
 * Styled on the info palette so it reads as guidance, not a warning, and kept to a single
 * bordered block so it sits alongside the existing InfoBanner without competing with it.
 * When collapsible, the header still shows the first line of the note so a reader can tell
 * whether it concerns them before opening it.
 */
export const NoteCallout: React.FC<NoteCalloutProps> = ({
  note,
  label = 'Note',
  maxWidth = 720,
  collapsible = false,
  defaultExpanded = false,
  sx,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = useId();

  if (!note || note.trim() === '') return null;

  const open = !collapsible || expanded;

  const heading = (
    <Typography
      variant="caption"
      component="div"
      sx={{ color: 'info.main', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.4 }}
    >
      {label}
    </Typography>
  );

  return (
    <Box
      role="note"
      aria-label={label}
      sx={[
        (theme) => ({
          textAlign: 'left',
          width: '100%',
          maxWidth,
          borderRadius: 1,
          border: '1px solid',
          borderColor: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.3 : 0.2),
          backgroundColor: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.08 : 0.04),
          overflow: 'hidden',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {collapsible ? (
        <ButtonBase
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={contentId}
          sx={{
            display: 'flex',
            width: '100%',
            gap: 1.5,
            alignItems: 'center',
            justifyContent: 'flex-start',
            textAlign: 'left',
            px: 2,
            py: 1.25,
            '&:hover': { backgroundColor: (theme) => alpha(theme.palette.info.main, 0.06) },
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: '1.25rem', color: 'info.main', flexShrink: 0 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {heading}
            {!expanded && (
              <Typography variant="body2" noWrap sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                {previewOf(note)}
              </Typography>
            )}
          </Box>
          <ExpandMoreIcon
            sx={{
              color: 'text.secondary',
              flexShrink: 0,
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(180deg)' : 'none',
            }}
          />
        </ButtonBase>
      ) : (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', px: 2, pt: 1.5 }}>
          <InfoOutlinedIcon sx={{ fontSize: '1.25rem', color: 'info.main', mt: '2px', flexShrink: 0 }} />
          {heading}
        </Box>
      )}

      <Collapse in={open} timeout={collapsible ? 200 : 0} id={contentId}>
        <Typography
          variant="body2"
          component="div"
          sx={{ lineHeight: 1.6, color: 'text.primary', px: 2, pb: 1.5, pt: collapsible ? 0 : 0.5, pl: { xs: 2, sm: 6.25 } }}
        >
          <NoteText text={note} />
        </Typography>
      </Collapse>
    </Box>
  );
};

/** First paragraph with link syntax reduced to its label, for the collapsed header. */
function previewOf(note: string): string {
  const firstParagraph = note.split(/\n\s*\n/)[0] ?? '';
  return firstParagraph.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1').replace(/\s+/g, ' ').trim();
}

export default NoteCallout;
