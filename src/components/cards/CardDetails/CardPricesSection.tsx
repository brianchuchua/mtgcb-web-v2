'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Box, Button, Divider, IconButton, Typography } from '@mui/material';
import React from 'react';
import { usePersistedBoolean } from '@/hooks/usePersistedBoolean';
import { generateCardKingdomLink, generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';

const TCG_EXPANDED_STORAGE_KEY = 'mtgcb-tcgplayer-prices-expanded';
const CK_EXPANDED_STORAGE_KEY = 'mtgcb-card-kingdom-prices-expanded';

interface PriceData {
  normal?: {
    market?: number | null;
    low?: number | null;
    average?: number | null;
    high?: number | null;
  } | null;
  foil?: {
    market?: number | null;
    low?: number | null;
    average?: number | null;
    high?: number | null;
  } | null;
}

interface CardPricesSectionProps {
  priceData: PriceData | null;
  tcgplayerId?: number | string | null;
  cardName?: string;
  pricesUpdatedAt?: string | null;
  // Card Kingdom buy-link feature inputs (per docs/future-features/CARD_KINGDOM_INTEGRATION_PLAN.md).
  // Two-slot model — nonfoil + foil-or-equivalent. Special-treatment Card rows have only the
  // foil slot populated; the foil column holds whatever specific treatment that row represents.
  cardKingdomRetail?: string | null;
  cardKingdomFoil?: string | null;
  cardKingdomUrl?: string | null;
  cardKingdomFoilUrl?: string | null;
  cardKingdomPricesUpdatedAt?: string | null;
}

const formatPriceUpdateDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Updated less than an hour ago';
    } else if (diffHours === 1) {
      return 'Updated 1 hour ago';
    } else if (diffHours < 24) {
      return `Updated ${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Updated 1 day ago';
    } else if (diffDays < 7) {
      return `Updated ${diffDays} days ago`;
    } else {
      return `Updated on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  } catch {
    return 'Unknown';
  }
};

const formatUsd = (n: number | null | undefined): string | null => {
  if (n === null || n === undefined || !isFinite(n)) return null;
  return `$${n.toFixed(2)}`;
};

const pickNormalTcgPrice = (priceData: PriceData | null): number | null => {
  if (!priceData?.normal) return null;
  return (
    priceData.normal.market ??
    priceData.normal.low ??
    priceData.normal.average ??
    priceData.normal.high ??
    null
  );
};

const pickFoilTcgPrice = (priceData: PriceData | null): number | null => {
  if (!priceData?.foil) return null;
  return (
    priceData.foil.market ??
    priceData.foil.low ??
    priceData.foil.average ??
    priceData.foil.high ??
    null
  );
};

/** Pick the most representative TCG price for the un-split fallback button label. */
const pickTcgFallbackPrice = (priceData: PriceData | null): number | null =>
  pickNormalTcgPrice(priceData) ?? pickFoilTcgPrice(priceData);

/**
 * Shared sx for every buy button — left-aligns the icon + label so buttons of
 * varying label widths still line up at their start edge. Without this MUI's
 * default centers the label, which makes a stack of differently-worded buttons
 * look ragged.
 */
const buyButtonSx = {
  textTransform: 'none' as const,
  fontWeight: 500,
  justifyContent: 'flex-start',
  pl: 1.5,
  '& .MuiButton-startIcon': {
    marginRight: 1,
  },
};

interface CollapsibleHeaderProps {
  title: string;
  subtitle?: string | null;
  expanded: boolean;
  onToggle: () => void;
  testId?: string;
}

const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  title,
  subtitle,
  expanded,
  onToggle,
  testId,
}) => (
  <Box
    onClick={onToggle}
    data-testid={testId}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      mb: expanded ? 1.5 : 0,
      cursor: 'pointer',
      userSelect: 'none',
    }}
  >
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      sx={{
        p: 0,
        mr: 0.5,
        transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
        transition: 'transform 0.15s ease-in-out',
      }}
      aria-label={expanded ? 'Collapse' : 'Expand'}
    >
      <ExpandMoreIcon fontSize="small" />
    </IconButton>
    <Typography variant="subtitle2" fontWeight="600">
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
        ({subtitle})
      </Typography>
    )}
  </Box>
);

export const CardPricesSection: React.FC<CardPricesSectionProps> = ({
  priceData,
  tcgplayerId,
  cardName,
  pricesUpdatedAt,
  cardKingdomRetail,
  cardKingdomFoil,
  cardKingdomUrl,
  cardKingdomFoilUrl,
  cardKingdomPricesUpdatedAt,
}) => {
  // Both detail blocks start collapsed — the buy buttons below carry the prices, so
  // the user has the cost they care about without having to expand anything. The
  // collapsed/expanded state persists in localStorage so opening a section once
  // keeps it open across navigation and reloads (matches how the rest of the app
  // remembers UI preferences).
  const [tcgExpanded, toggleTcgExpanded] = usePersistedBoolean(TCG_EXPANDED_STORAGE_KEY, false);
  const [ckExpanded, toggleCkExpanded] = usePersistedBoolean(CK_EXPANDED_STORAGE_KEY, false);

  const ckRetail = cardKingdomRetail ? parseFloat(cardKingdomRetail) : null;
  const ckFoil = cardKingdomFoil ? parseFloat(cardKingdomFoil) : null;
  const hasCkPrices = ckRetail !== null || ckFoil !== null;
  const hasCkRegularUrl = Boolean(cardKingdomUrl);
  const hasCkFoilUrl = Boolean(cardKingdomFoilUrl);

  const tcgNormalPrice = pickNormalTcgPrice(priceData);
  const tcgFoilPrice = pickFoilTcgPrice(priceData);
  const tcgFallbackPrice = pickTcgFallbackPrice(priceData);
  const hasTcgRegular = tcgNormalPrice !== null;
  const hasTcgFoil = tcgFoilPrice !== null;
  // Split TCG buttons when both finishes have prices; otherwise show a single button.
  const splitTcgButtons = hasTcgRegular && hasTcgFoil;

  const tcgRegularLabel = tcgNormalPrice !== null
    ? `Buy on TCGPlayer (Regular) (${formatUsd(tcgNormalPrice)})`
    : 'Buy on TCGPlayer (Regular)';
  const tcgFoilLabel = tcgFoilPrice !== null
    ? `Buy on TCGPlayer (Foil) (${formatUsd(tcgFoilPrice)})`
    : 'Buy on TCGPlayer (Foil)';
  // Single-button TCG label. When the only available finish is foil (e.g. special-treatment
  // Card row that's foil-only), keep the "(Foil)" qualifier on the label so the user knows
  // which finish they're buying. Regular-only stays unqualified.
  const tcgFallbackIsFoilOnly = hasTcgFoil && !hasTcgRegular;
  const tcgFallbackBase = tcgFallbackIsFoilOnly ? 'Buy on TCGPlayer (Foil)' : 'Buy on TCGPlayer';
  const tcgFallbackLabel = tcgFallbackPrice !== null
    ? `${tcgFallbackBase} (${formatUsd(tcgFallbackPrice)})`
    : tcgFallbackBase;

  const ckRegularLabel = ckRetail !== null
    ? `Buy on Card Kingdom (Regular) (${formatUsd(ckRetail)})`
    : 'Buy on Card Kingdom (Regular)';
  const ckFoilLabel = ckFoil !== null
    ? `Buy on Card Kingdom (Foil) (${formatUsd(ckFoil)})`
    : 'Buy on Card Kingdom (Foil)';
  // Single-button CK label used when only one CK URL exists. Embeds the price for whichever
  // finish we have, so the user sees what they're about to pay. When the only available URL
  // is foil-side (special-treatment Card row, e.g. Foil Etched / Rainbow Foil), keep the
  // "(Foil)" qualifier so it's unambiguous which finish the button buys.
  const ckSinglePrice = hasCkRegularUrl ? ckRetail : ckFoil;
  const ckSingleIsFoilOnly = hasCkFoilUrl && !hasCkRegularUrl;
  const ckSingleBase = ckSingleIsFoilOnly ? 'Buy on Card Kingdom (Foil)' : 'Buy on Card Kingdom';
  const ckSingleLabel = ckSinglePrice !== null
    ? `${ckSingleBase} (${formatUsd(ckSinglePrice)})`
    : ckSingleBase;

  return (
    <>
      <CollapsibleHeader
        title="TCGPlayer Prices"
        subtitle={pricesUpdatedAt ? formatPriceUpdateDate(pricesUpdatedAt) : null}
        expanded={tcgExpanded}
        onToggle={toggleTcgExpanded}
        testId="tcgplayer-prices-header"
      />

      {tcgExpanded && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }} data-testid="tcgplayer-prices-detail">
          {priceData?.normal && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                REGULAR
              </Typography>
              <Box sx={{ pl: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Market</Typography>
                  <Typography variant="body2" fontWeight="600">
                    {priceData.normal.market ? `$${priceData.normal.market.toFixed(2)}` : '—'}
                  </Typography>
                </Box>
                {priceData.normal.low && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Low</Typography>
                    <Typography variant="body2">${priceData.normal.low.toFixed(2)}</Typography>
                  </Box>
                )}
                {priceData.normal.average && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Average</Typography>
                    <Typography variant="body2">${priceData.normal.average.toFixed(2)}</Typography>
                  </Box>
                )}
                {priceData.normal.high && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">High</Typography>
                    <Typography variant="body2">${priceData.normal.high.toFixed(2)}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {priceData?.foil && (
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                FOIL
              </Typography>
              <Box sx={{ pl: 1 }}>
                {priceData.foil.market && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Market</Typography>
                    <Typography variant="body2" fontWeight="600">
                      ${priceData.foil.market.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {priceData.foil.low && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Low</Typography>
                    <Typography variant="body2">${priceData.foil.low.toFixed(2)}</Typography>
                  </Box>
                )}
                {priceData.foil.average && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Average</Typography>
                    <Typography variant="body2">${priceData.foil.average.toFixed(2)}</Typography>
                  </Box>
                )}
                {priceData.foil.high && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">High</Typography>
                    <Typography variant="body2">${priceData.foil.high.toFixed(2)}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Card Kingdom prices — only renders when at least one CK price is populated. */}
      {hasCkPrices && (
        <Box sx={{ mt: 2 }} data-testid="card-kingdom-prices">
          <Divider sx={{ mb: 1.5 }} />
          <CollapsibleHeader
            title="Card Kingdom Prices"
            subtitle={
              cardKingdomPricesUpdatedAt ? formatPriceUpdateDate(cardKingdomPricesUpdatedAt) : null
            }
            expanded={ckExpanded}
            onToggle={toggleCkExpanded}
            testId="card-kingdom-prices-header"
          />
          {ckExpanded && (
            <Box
              sx={{ pl: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}
              data-testid="card-kingdom-prices-detail"
            >
              {ckRetail !== null && (
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  data-testid="card-kingdom-nonfoil-price"
                >
                  <Typography variant="body2">Regular</Typography>
                  <Typography variant="body2" fontWeight="600">
                    ${ckRetail.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {ckFoil !== null && (
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  data-testid="card-kingdom-foil-price"
                >
                  <Typography variant="body2">Foil</Typography>
                  <Typography variant="body2" fontWeight="600">
                    ${ckFoil.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Buy buttons. Equal-prominence styling — TCG and CK both use `variant="contained"`.
          Each button embeds its representative price so the user sees the cost without
          expanding the detail blocks. When a source has both regular and foil products
          available, we render two buttons (one per finish). All buttons share `buyButtonSx`
          which left-aligns icon + text so the column lines up at the start edge regardless
          of label width. */}
      {(tcgplayerId || cardName) && splitTcgButtons && (
        <>
          <Divider sx={{ my: 2 }} />
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCartIcon />}
            href={generateTCGPlayerLink(tcgplayerId, cardName, 'normal')}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            data-testid="buy-regular-on-tcgplayer-button"
            sx={buyButtonSx}
          >
            {tcgRegularLabel}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCartIcon />}
            href={generateTCGPlayerLink(tcgplayerId, cardName, 'foil')}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            data-testid="buy-foil-on-tcgplayer-button"
            sx={{ ...buyButtonSx, mt: 1 }}
          >
            {tcgFoilLabel}
          </Button>
        </>
      )}
      {(tcgplayerId || cardName) && !splitTcgButtons && (
        <>
          <Divider sx={{ my: 2 }} />
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCartIcon />}
            href={generateTCGPlayerLink(
              tcgplayerId,
              cardName,
              hasTcgFoil ? 'foil' : hasTcgRegular ? 'normal' : undefined,
            )}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            sx={buyButtonSx}
          >
            {tcgFallbackLabel}
          </Button>
        </>
      )}
      {hasCkRegularUrl && hasCkFoilUrl && (
        <>
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCartIcon />}
            href={generateCardKingdomLink(cardKingdomUrl, cardName)}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            data-testid="buy-regular-on-card-kingdom-button"
            sx={{ ...buyButtonSx, mt: 1 }}
          >
            {ckRegularLabel}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCartIcon />}
            href={generateCardKingdomLink(cardKingdomFoilUrl, cardName)}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            data-testid="buy-foil-on-card-kingdom-button"
            sx={{ ...buyButtonSx, mt: 1 }}
          >
            {ckFoilLabel}
          </Button>
        </>
      )}
      {hasCkRegularUrl && !hasCkFoilUrl && (
        <Button
          variant="contained"
          size="small"
          startIcon={<ShoppingCartIcon />}
          href={generateCardKingdomLink(cardKingdomUrl, cardName)}
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          data-testid="buy-on-card-kingdom-button"
          sx={{ ...buyButtonSx, mt: 1 }}
        >
          {ckSingleLabel}
        </Button>
      )}
      {!hasCkRegularUrl && hasCkFoilUrl && (
        <Button
          variant="contained"
          size="small"
          startIcon={<ShoppingCartIcon />}
          href={generateCardKingdomLink(cardKingdomFoilUrl, cardName)}
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          data-testid="buy-on-card-kingdom-button"
          sx={{ ...buyButtonSx, mt: 1 }}
        >
          {ckSingleLabel}
        </Button>
      )}
      {!hasCkRegularUrl && !hasCkFoilUrl && cardName && (
        <Button
          variant="contained"
          size="small"
          startIcon={<ShoppingCartIcon />}
          href={generateCardKingdomLink(null, cardName)}
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          data-testid="buy-on-card-kingdom-button"
          sx={{ ...buyButtonSx, mt: 1 }}
        >
          Buy on Card Kingdom
        </Button>
      )}
    </>
  );
};
