'use client';

import { Box, Button, Card, CardContent, CircularProgress, Typography, keyframes, styled } from '@mui/material';
import { isDraft } from '@reduxjs/toolkit';
import Link from 'next/link';
import React from 'react';
import { CollectionSetSummary } from '@/api/collections/types';
import { CostToComplete } from '@/api/sets/types';
import SetIcon from '@/components/sets/SetIcon';
import { SetCategoryAndType, SetItemSettings } from '@/components/sets/SetItemRenderer';
import TCGPlayerGoalMassImportButton from '@/components/tcgplayer/TCGPlayerGoalMassImportButton';
import TCGPlayerMassImportButton from '@/components/tcgplayer/TCGPlayerMassImportButton';
import { CountType } from '@/components/tcgplayer/useFetchCardsForMassImport';
import { Set } from '@/types/sets';
import { generateTCGPlayerSealedProductLink } from '@/utils/affiliateLinkBuilder';
import capitalize from '@/utils/capitalize';
import { getCollectionSetUrl } from '@/utils/collectionUrls';
import { formatISODate } from '@/utils/dateUtils';
import { formatPrice } from '@/utils/formatters';

interface CollectionSetItemRendererProps {
  set: Set;
  settings: SetItemSettings;
  costToComplete?: CostToComplete;
  cardCountIncludingSubsets?: string | null;
  includeSubsetsInSets?: boolean;
  collectionData?: CollectionSetSummary;
  userId?: number;
  goalId?: number;
}

// Animation for completed sets - rotating gradient
const rotateGradientAnimation = keyframes`
  from {
    transform: rotate(-90deg);
  }
  to {
    transform: rotate(270deg);
  }
`;

const SetBoxWrapper = styled(Card)(({}) => ({
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  transition: 'opacity 0.1s ease-in-out',
  boxSizing: 'border-box',
  height: '100%', // Fill the available height from the grid cell
}));

const SetBoxContent = styled(CardContent)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  boxSizing: 'border-box',
  overflow: 'hidden',
  flexGrow: 1, // Allow content to expand
  '&:last-child': {
    paddingBottom: theme.spacing(1.5),
  },
}));

const SetNameTypography = styled(Typography)(({ theme }) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'center',
  fontWeight: 500,
  color: theme.palette.primary.main,
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

// Collection-aware SetNameAndCode component
type SetNameProps = {
  set: Set;
  nameIsVisible?: boolean;
  codeIsVisible?: boolean;
  userId?: number;
  goalId?: number;
};

const SetNameAndCode: React.FC<SetNameProps> = ({
  set,
  nameIsVisible = true,
  codeIsVisible = true,
  userId,
  goalId,
}) => {
  if (!nameIsVisible) return null;

  const displayName = codeIsVisible ? `${set.name} (${set.code})` : set.name;
  const href = userId ? getCollectionSetUrl(userId, set.slug, goalId) : `/browse/sets/${set.slug}`;

  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <SetNameTypography variant="body1" fontWeight="500">
        {displayName}
      </SetNameTypography>
    </Link>
  );
};

const SetReleaseDate: React.FC<{ set: Set; isVisible?: boolean }> = ({ set, isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <Typography component="div" variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
      {formatISODate(set.releasedAt)}
    </Typography>
  );
};

const SetIconDisplay: React.FC<{
  set: Set;
  collectionData?: CollectionSetSummary;
  userId?: number;
  goalId?: number;
}> = ({ set, collectionData, userId, goalId }) => {
  const percentageCollected = collectionData?.percentageCollected || 0;

  // Determine rarity based on percentage
  const getRarityByPercentage = (percentage: number): 'common' | 'uncommon' | 'rare' | 'mythic' => {
    if (percentage === 100) return 'mythic';
    if (percentage >= 67) return 'rare';
    if (percentage >= 34) return 'uncommon';
    return 'common';
  };

  const rarity = collectionData ? getRarityByPercentage(percentageCollected) : 'common';

  return (
    <Box sx={{ textAlign: 'center', m: 0.5 }}>
      {set.code && (
        <Link
          href={userId ? getCollectionSetUrl(userId, set.slug, goalId) : `/browse/sets/${set.slug}`}
          style={{
            textDecoration: 'none',
            color: 'inherit',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {collectionData && (
              <>
                {/* SVG gradient definitions */}
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                  <defs>
                    <linearGradient id={`progress-gradient-${set.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={percentageCollected === 100 ? '#B84028' : '#90CAF9'} />
                      <stop offset="100%" stopColor={percentageCollected === 100 ? '#A03823' : '#1976D2'} />
                    </linearGradient>
                    {percentageCollected === 100 && (
                      <linearGradient id={`celebration-gradient-${set.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#BF4427" />
                        <stop offset="25%" stopColor="#E85D39" />
                        <stop offset="50%" stopColor="#FFB347" />
                        <stop offset="75%" stopColor="#E85D39" />
                        <stop offset="100%" stopColor="#BF4427" />
                      </linearGradient>
                    )}
                  </defs>
                </svg>

                {/* Background circle (track) */}
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={130}
                  thickness={4.5}
                  sx={{
                    position: 'absolute',
                    color: 'rgba(255, 255, 255, 0.1)',
                  }}
                />
                {/* Progress circle */}
                <CircularProgress
                  variant="determinate"
                  value={percentageCollected}
                  size={130}
                  thickness={4.5}
                  sx={{
                    position: 'absolute',
                    transform: 'rotate(-90deg)',
                    ...(percentageCollected === 100 && {
                      animation: `${rotateGradientAnimation} 6s linear infinite`,
                    }),
                    '& .MuiCircularProgress-circle': {
                      stroke:
                        percentageCollected === 100
                          ? `url(#celebration-gradient-${set.id})`
                          : `url(#progress-gradient-${set.id})`,
                      strokeLinecap: 'round',
                    },
                  }}
                />
              </>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 130, height: 130 }}>
              <SetIcon code={set.code} size="5x" fixedWidth rarity={rarity} />
            </Box>
          </Box>
        </Link>
      )}
    </Box>
  );
};

// Custom card count component for collections
const CollectionCardCount: React.FC<{
  set: Set;
  collectionData?: CollectionSetSummary;
  isVisible?: boolean;
  includeSubsetsInSets?: boolean;
  cardCountIncludingSubsets?: string | null;
}> = ({ set, collectionData, isVisible = true, includeSubsetsInSets = false, cardCountIncludingSubsets }) => {
  if (!isVisible) return null;

  // Don't show anything if we have collection data (it will be shown in CollectionInfoSection)
  if (collectionData) {
    return null;
  }

  const cardCount = includeSubsetsInSets ? cardCountIncludingSubsets : set.cardCount;

  // Fallback to regular card count for non-collection views
  return (
    <Typography component="div" variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
      {cardCount ? `${cardCount} cards` : 'N/A'}
    </Typography>
  );
};

// Collection info section
const CollectionInfoSection: React.FC<{
  collectionData: CollectionSetSummary;
  includeSubsetsInSets?: boolean;
}> = ({ collectionData, includeSubsetsInSets = false }) => {
  const percentage = Math.ceil(collectionData.percentageCollected);
  const totalCards = includeSubsetsInSets ? collectionData.cardCountIncludingSubsets : collectionData.cardCount;

  return (
    <Box sx={{ textAlign: 'center', mt: 1.5, mb: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        {collectionData.uniquePrintingsCollectedInSet}/{totalCards}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        ({percentage}% collected, {collectionData.totalCardsCollectedInSet} total cards)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Current set value: {formatPrice(collectionData.costToComplete.totalValue)}
      </Typography>
    </Box>
  );
};

const CostToPurchaseSection: React.FC<{
  costToComplete: CostToComplete;
  isVisible?: boolean;
  setId: string;
  includeSubsetsInSets?: boolean;
  set?: Set;
  userId?: number;
  goalId?: number;
}> = ({ costToComplete, isVisible = true, setId, includeSubsetsInSets = false, set, userId, goalId }) => {
  if (!isVisible) return null;

  return (
    <Box
      sx={{
        mt: 0,
        pt: 1,
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography variant="subtitle2" color="textSecondary" component="h3" sx={{ mb: 1 }}>
        Costs to purchase:
      </Typography>

      <Box sx={{ width: '100%', maxWidth: '350px' }}>
        <CostToCompleteRow
          label="All cards"
          cost={costToComplete.oneOfEachCard}
          setId={setId}
          countType="all"
          includeSubsetsInSets={includeSubsetsInSets}
          userId={userId}
          goalId={goalId}
        />

        <CostToCompleteRow
          label="Mythics"
          cost={costToComplete.oneOfEachMythic}
          setId={setId}
          countType="mythic"
          includeSubsetsInSets={includeSubsetsInSets}
          userId={userId}
          goalId={goalId}
        />

        <CostToCompleteRow
          label="Rares"
          cost={costToComplete.oneOfEachRare}
          setId={setId}
          countType="rare"
          includeSubsetsInSets={includeSubsetsInSets}
          userId={userId}
          goalId={goalId}
        />

        <CostToCompleteRow
          label="Uncommons"
          cost={costToComplete.oneOfEachUncommon}
          setId={setId}
          countType="uncommon"
          includeSubsetsInSets={includeSubsetsInSets}
          userId={userId}
          goalId={goalId}
        />

        <CostToCompleteRow
          label="Commons"
          cost={costToComplete.oneOfEachCommon}
          setId={setId}
          countType="common"
          includeSubsetsInSets={includeSubsetsInSets}
          userId={userId}
          goalId={goalId}
        />

        {set?.isDraftable && (
          <CostToCompleteRow
            label="Draft Cube"
            cost={costToComplete.draftCube}
            setId={setId}
            countType="draftcube"
            includeSubsetsInSets={includeSubsetsInSets}
            userId={userId}
            goalId={goalId}
            singleButton
          />
        )}

        {set?.sealedProductUrl && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 1.5,
            }}
          >
            <Button
              variant="outlined"
              href={generateTCGPlayerSealedProductLink(set.sealedProductUrl, set.name)}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                textTransform: 'none',
                py: 0.5,
              }}
            >
              Buy this set sealed
            </Button>
          </Box>
        )}

        {goalId && userId && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 1.5,
            }}
          >
            <TCGPlayerGoalMassImportButton
              setId={setId}
              userId={userId}
              goalId={goalId}
              includeSubsetsInSets={includeSubsetsInSets}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

interface CostToCompleteRowProps {
  label: string;
  cost: number;
  setId: string;
  countType: CountType;
  includeSubsetsInSets?: boolean;
  singleButton?: boolean;
  userId?: number;
  goalId?: number;
}

const CostToCompleteRow: React.FC<CostToCompleteRowProps> = ({
  label,
  cost,
  setId,
  countType,
  includeSubsetsInSets = false,
  singleButton = false,
  userId,
  goalId,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 111px',
        alignItems: 'center',
        mb: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1.5,
        }}
      >
        <Typography variant="body2" color="textSecondary">
          {label}:
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {formatPrice(cost)}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 0.5,
          width: '111px',
          flexShrink: 0,
        }}
      >
        {singleButton ? (
          <TCGPlayerMassImportButton
            setId={setId}
            count={1}
            countType={countType}
            includeSubsetsInSets={includeSubsetsInSets}
            userId={userId}
            goalId={goalId}
            sx={{ width: '100%', textTransform: 'none' }}
          >
            Buy draft cube
          </TCGPlayerMassImportButton>
        ) : (
          <>
            <TCGPlayerMassImportButton
              setId={setId}
              count={1}
              countType={countType}
              includeSubsetsInSets={includeSubsetsInSets}
              userId={userId}
              goalId={goalId}
            >
              Buy 1x
            </TCGPlayerMassImportButton>
            <TCGPlayerMassImportButton
              setId={setId}
              count={4}
              countType={countType}
              includeSubsetsInSets={includeSubsetsInSets}
              userId={userId}
              goalId={goalId}
            >
              Buy 4x
            </TCGPlayerMassImportButton>
          </>
        )}
      </Box>
    </Box>
  );
};

export const CollectionSetItemRenderer: React.FC<CollectionSetItemRendererProps> = ({
  set,
  settings,
  costToComplete,
  cardCountIncludingSubsets,
  includeSubsetsInSets = false,
  collectionData,
  userId,
  goalId,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);


  return (
    <SetBoxWrapper>
      <SetBoxContent
        sx={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.7s ease-in-out',
        }}
      >
        <SetNameAndCode
          set={set}
          nameIsVisible={settings.nameIsVisible}
          codeIsVisible={settings.codeIsVisible}
          userId={userId}
          goalId={goalId}
        />
        <SetCategoryAndType
          set={set}
          isCategoryVisible={settings.categoryIsVisible}
          isTypeVisible={settings.typeIsVisible}
        />
        <SetReleaseDate set={set} isVisible={settings.releaseDateIsVisible} />
        <SetIconDisplay set={set} collectionData={collectionData} userId={userId} goalId={goalId} />
        <CollectionCardCount
          set={set}
          collectionData={collectionData}
          isVisible={settings.cardCountIsVisible}
          includeSubsetsInSets={includeSubsetsInSets}
          cardCountIncludingSubsets={cardCountIncludingSubsets}
        />

        {collectionData && (
          <CollectionInfoSection collectionData={collectionData} includeSubsetsInSets={includeSubsetsInSets} />
        )}

        {costToComplete && (
          <CostToPurchaseSection
            costToComplete={costToComplete}
            isVisible={settings.costsIsVisible}
            setId={set.id}
            set={set}
            includeSubsetsInSets={includeSubsetsInSets}
            userId={userId}
            goalId={goalId}
          />
        )}
      </SetBoxContent>
    </SetBoxWrapper>
  );
};
