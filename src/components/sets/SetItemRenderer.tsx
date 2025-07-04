'use client';

import { Box, Button, Card, CardContent, Typography, styled } from '@mui/material';
import Link from 'next/link';
import React from 'react';
import { CostToComplete } from '@/api/sets/types';
import SetIcon from '@/components/sets/SetIcon';
import TCGPlayerMassImportButton from '@/components/tcgplayer/TCGPlayerMassImportButton';
import { CountType } from '@/components/tcgplayer/useFetchCardsForMassImport';
import { Set } from '@/types/sets';
import { generateTCGPlayerSealedProductLink } from '@/utils/affiliateLinkBuilder';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';
import { formatPrice } from '@/utils/formatters';

const SetItemRenderer: React.FC<SetItemRendererProps> = ({
  set,
  settings,
  costToComplete,
  cardCountIncludingSubsets,
  includeSubsetsInSets = false,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  // Use useEffect to trigger the fade-in animation after component mount
  React.useEffect(() => {
    setIsVisible(true);
  }, []);


  return (
    <SetBoxWrapper data-testid="set-item">
      <SetBoxContent sx={{ 
        opacity: isVisible ? 1 : 0, 
        transition: 'opacity 0.7s ease-in-out' 
      }}>
        <SetNameAndCode set={set} nameIsVisible={settings.nameIsVisible} codeIsVisible={settings.codeIsVisible} />
        <SetCategoryAndType
          set={set}
          isCategoryVisible={settings.categoryIsVisible}
          isTypeVisible={settings.typeIsVisible}
        />
        <SetReleaseDate set={set} isVisible={settings.releaseDateIsVisible} />
        <SetIconDisplay set={set} />
        <SetCardCount
          set={set}
          isVisible={settings.cardCountIsVisible}
          includeSubsetsInSets={includeSubsetsInSets}
          cardCountIncludingSubsets={cardCountIncludingSubsets}
        />

        {costToComplete && (
          <CostToPurchaseSection
            costToComplete={costToComplete}
            isVisible={settings.costsIsVisible}
            setId={set.id}
            set={set}
            includeSubsetsInSets={includeSubsetsInSets}
          />
        )}
      </SetBoxContent>
    </SetBoxWrapper>
  );
};

export interface SetItemSettings {
  nameIsVisible?: boolean;
  codeIsVisible?: boolean;
  releaseDateIsVisible?: boolean;
  typeIsVisible?: boolean;
  categoryIsVisible?: boolean;
  cardCountIsVisible?: boolean;
  costsIsVisible?: boolean;
}

interface SetItemRendererProps {
  set: Set;
  settings: SetItemSettings;
  costToComplete?: CostToComplete;
  cardCountIncludingSubsets?: string | null;
  includeSubsetsInSets?: boolean;
}

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
  // Overriding the default padding for the last child since it's considering all of these as the last child
  '&:last-child': {
    paddingBottom: theme.spacing(1.5),
  },
}));

type SetNameProps = {
  set: Set;
  nameIsVisible?: boolean;
  codeIsVisible?: boolean;
};

export const SetNameAndCode: React.FC<SetNameProps> = ({ set, nameIsVisible = true, codeIsVisible = true }) => {
  if (!nameIsVisible) return null;

  const displayName = codeIsVisible ? `${set.name} (${set.code})` : set.name;

  return (
    <Link
      href={`/browse/sets/${set.slug}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
      onClick={(e) => e.stopPropagation()} // Prevent card click when clicking set name
    >
      <SetNameTypography variant="body1" fontWeight="500" data-testid="set-name">
        {displayName}
      </SetNameTypography>
    </Link>
  );
};

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

type SetCategoryAndTypeProps = {
  set: Set;
  isCategoryVisible?: boolean;
  isTypeVisible?: boolean;
};

export const SetCategoryAndType: React.FC<SetCategoryAndTypeProps> = ({
  set,
  isCategoryVisible = true,
  isTypeVisible = true,
}) => {
  if (!isCategoryVisible && !isTypeVisible) return null;

  return (
    <CategoryTypeTypography variant="body2" fontWeight="400">
      {formatSetCategoryAndType(set, isCategoryVisible, isTypeVisible)}
    </CategoryTypeTypography>
  );
};

const CategoryTypeTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textAlign: 'center',
}));

type SetReleaseDateProps = {
  set: Set;
  isVisible?: boolean;
};
const SetReleaseDate: React.FC<SetReleaseDateProps> = ({ set, isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <Typography component="div" variant="body2" color="text.secondary" sx={{ textAlign: 'center' }} data-testid="set-release-date">
      {formatISODate(set.releasedAt)}
    </Typography>
  );
};

const SetIconDisplay: React.FC<{ set: Set }> = ({ set }) => {
  return (
    <Box sx={{ textAlign: 'center', m: 0.5 }}>
      {set.code && (
        <Link
          href={`/browse/sets/${set.slug}`}
          style={{
            textDecoration: 'none',
            color: 'inherit',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box data-testid="set-icon">
            <SetIcon code={set.code} size="5x" fixedWidth />
          </Box>
        </Link>
      )}
    </Box>
  );
};

type SetCardCountProps = {
  set: Set;
  isVisible?: boolean;
  includeSubsetsInSets?: boolean;
  cardCountIncludingSubsets?: string | null;
};
const SetCardCount: React.FC<SetCardCountProps> = ({
  set,
  cardCountIncludingSubsets,
  isVisible = true,
  includeSubsetsInSets = false,
}) => {
  if (!isVisible) return null;

  const cardCount = includeSubsetsInSets ? cardCountIncludingSubsets : set.cardCount;

  return (
    <Typography component="div" variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }} data-testid="set-card-count">
      {cardCount ? `${cardCount} cards` : 'N/A'}
    </Typography>
  );
};

function formatSetCategoryAndType(set: Set, showCategory?: boolean, showType?: boolean) {
  const category = showCategory && set.category ? capitalize(set.category) : null;
  const type = showType && set.setType ? capitalize(set.setType) : null;

  if (category && type) return `${category} Set - ${type}`;
  if (category) return `${category} Set`;
  if (type) return type;
  return 'Special Set';
}

interface CostToPurchaseSectionProps {
  costToComplete: CostToComplete;
  isVisible?: boolean;
  setId: string;
  includeSubsetsInSets?: boolean;
  set?: Set;
}

const CostToPurchaseSection: React.FC<CostToPurchaseSectionProps> = ({
  costToComplete,
  isVisible = true,
  setId,
  includeSubsetsInSets = false,
  set,
}) => {
  if (!isVisible) return null;

  return (
    <Box
      sx={{
        mt: 1,
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
        />

        <CostToCompleteRow
          label="Mythics"
          cost={costToComplete.oneOfEachMythic}
          setId={setId}
          countType="mythic"
          includeSubsetsInSets={includeSubsetsInSets}
        />

        <CostToCompleteRow
          label="Rares"
          cost={costToComplete.oneOfEachRare}
          setId={setId}
          countType="rare"
          includeSubsetsInSets={includeSubsetsInSets}
        />

        <CostToCompleteRow
          label="Uncommons"
          cost={costToComplete.oneOfEachUncommon}
          setId={setId}
          countType="uncommon"
          includeSubsetsInSets={includeSubsetsInSets}
        />

        <CostToCompleteRow
          label="Commons"
          cost={costToComplete.oneOfEachCommon}
          setId={setId}
          countType="common"
          includeSubsetsInSets={includeSubsetsInSets}
        />

        {set?.isDraftable && (
          <CostToCompleteRow
            label="Draft Cube"
            cost={costToComplete.draftCube}
            setId={setId}
            countType="draftcube"
            includeSubsetsInSets={includeSubsetsInSets}
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
}

const CostToCompleteRow: React.FC<CostToCompleteRowProps> = ({
  label,
  cost,
  setId,
  countType,
  includeSubsetsInSets = false,
  singleButton = false,
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
            >
              Buy 1x
            </TCGPlayerMassImportButton>
            <TCGPlayerMassImportButton
              setId={setId}
              count={4}
              countType={countType}
              includeSubsetsInSets={includeSubsetsInSets}
            >
              Buy 4x
            </TCGPlayerMassImportButton>
          </>
        )}
      </Box>
    </Box>
  );
};

export default SetItemRenderer;
