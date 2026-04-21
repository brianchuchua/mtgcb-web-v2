'use client';

import { Box, Typography, alpha } from '@mui/material';
import { FORMAT_LEGALITY_OPTIONS } from '@/features/browse/formatLegalityConstants';

interface CardLegalitySectionProps {
  legalities?: Record<string, string> | null;
}

type Status = 'legal' | 'not_legal' | 'banned' | 'restricted';

interface StatusStyle {
  label: string;
  /**
   * Resolved theme path used by `getColor` below.
   *  - 'success' / 'error' / 'warning' pull from `theme.palette.*.main`
   *  - 'muted' pulls from `theme.palette.text.disabled`
   */
  tone: 'success' | 'error' | 'warning' | 'muted';
  /** Font weight of the status label text. Muted statuses drop a step. */
  weight: number;
}

const STATUS_STYLE: Record<Status, StatusStyle> = {
  legal: { label: 'Legal', tone: 'success', weight: 600 },
  banned: { label: 'Banned', tone: 'error', weight: 600 },
  restricted: { label: 'Restricted', tone: 'warning', weight: 600 },
  not_legal: { label: 'Not Legal', tone: 'muted', weight: 400 },
};

function normalizeStatus(raw: string | undefined): Status {
  if (raw === 'legal' || raw === 'banned' || raw === 'restricted' || raw === 'not_legal') {
    return raw;
  }
  return 'not_legal';
}

export const CardLegalitySection: React.FC<CardLegalitySectionProps> = ({ legalities }) => {
  if (!legalities || Object.keys(legalities).length === 0) {
    return null;
  }

  // Preserve canonical ordering (paper first, then digital), then append unrecognized keys
  // alphabetically so new Scryfall formats still render until we update our constants file.
  const knownOrder = FORMAT_LEGALITY_OPTIONS.map((f) => f.value);
  const unknownFormats = Object.keys(legalities)
    .filter((k) => !knownOrder.includes(k))
    .sort();
  const orderedFormats = [...knownOrder, ...unknownFormats];

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{
          display: 'block',
          fontWeight: 600,
          color: 'text.secondary',
          letterSpacing: 0.8,
          fontSize: '0.6875rem',
          lineHeight: 1.4,
          mb: 1.25,
        }}
      >
        Format Legality
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          columnGap: 3,
        }}
      >
        {orderedFormats.map((formatKey) => {
          const raw = legalities[formatKey];
          if (raw === undefined) return null;

          const status = normalizeStatus(raw);
          const style = STATUS_STYLE[status];
          const formatMeta = FORMAT_LEGALITY_OPTIONS.find((f) => f.value === formatKey);
          const displayName = formatMeta?.label ?? formatKey;
          const isDigital = formatMeta?.digital === true;

          return (
            <Box
              key={formatKey}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                py: 0.75,
                borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              }}
            >
              {/* Format name + optional Digital marker */}
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {displayName}
                </Typography>
                {isDigital && (
                  <Typography
                    component="span"
                    sx={{
                      color: 'text.disabled',
                      fontSize: '0.625rem',
                      fontWeight: 500,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    Digital
                  </Typography>
                )}
              </Box>

              {/* Status: dot + uppercase letterspaced label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, flexShrink: 0 }}>
                <Box
                  sx={(theme) => ({
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: getColor(theme, style.tone),
                    boxShadow:
                      style.tone === 'muted' ? 'none' : `0 0 0 2px ${alpha(getColor(theme, style.tone), 0.18)}`,
                  })}
                />
                <Typography
                  sx={(theme) => ({
                    color: getColor(theme, style.tone),
                    fontWeight: style.weight,
                    fontSize: '0.6875rem',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    fontVariantNumeric: 'tabular-nums',
                  })}
                >
                  {style.label}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

/** Resolve a status tone to the concrete theme color to use. */
function getColor(theme: import('@mui/material').Theme, tone: StatusStyle['tone']): string {
  switch (tone) {
    case 'success':
      return theme.palette.success.main;
    case 'error':
      return theme.palette.error.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'muted':
    default:
      return theme.palette.text.disabled;
  }
}
