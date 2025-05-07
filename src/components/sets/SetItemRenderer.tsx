'use client';

import { Box, Button, Card, CardContent, Typography, styled } from '@mui/material';
import React from 'react';
import { CostToComplete } from '@/api/sets/types';
import SetIcon from '@/components/sets/SetIcon';
import TCGPlayerMassImportButton from '@/components/tcgplayer/TCGPlayerMassImportButton';
import { CountType } from '@/components/tcgplayer/useFetchCardsForMassImport';
import { Set } from '@/types/sets';
import capitalize from '@/utils/capitalize';
import { formatPrice } from '@/utils/formatters';

// TODO: Loading skeleton once I know the height of the box after implementing the cost to complete stuff
const SetItemRenderer: React.FC<SetItemRendererProps> = ({ set, settings, costToComplete }) => {
  return (
    <SetBoxWrapper>
      <SetBoxContent>
        <SetNameAndCode set={set} nameIsVisible={settings.nameIsVisible} codeIsVisible={settings.codeIsVisible} />
        <SetCategoryAndType
          set={set}
          isCategoryVisible={settings.categoryIsVisible}
          isTypeVisible={settings.typeIsVisible}
        />
        <SetReleaseDate set={set} isVisible={settings.releaseDateIsVisible} />
        <SetIconDisplay set={set} />
        <SetCardCount set={set} isVisible={settings.cardCountIsVisible} />

        {!isSkeleton(set) && costToComplete && (
          <CostToPurchaseSection costToComplete={costToComplete} isVisible={settings.costsIsVisible} setId={set.id} />
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
}

function isSkeleton(value: unknown): value is { isLoadingSkeleton: boolean } {
  return typeof value === 'object' && value !== null && 'isLoadingSkeleton' in value;
}

const SetBoxWrapper = styled(Card)(({}) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
}));

const SetBoxContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
}));

type SetNameProps = {
  set: Set;
  nameIsVisible?: boolean;
  codeIsVisible?: boolean;
};

export const SetNameAndCode: React.FC<SetNameProps> = ({ set, nameIsVisible = true, codeIsVisible = true }) => {
  if (!nameIsVisible) return null;

  return (
    <SetNameTypography variant="body1" fontWeight="500">
      {codeIsVisible ? `${set.name} (${set.code})` : set.name}
    </SetNameTypography>
  );
};

const SetNameTypography = styled(Typography)(({ theme }) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textAlign: 'center',
  fontWeight: 500,
  color: theme.palette.primary.main,
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
    <Typography component="div" variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
      {isSkeleton(set) ? (
        <SkeletonBar sx={{ width: '70%' }} />
      ) : set.releasedAt ? (
        new Date(set.releasedAt).toISOString().split('T')[0]
      ) : (
        ''
      )}
    </Typography>
  );
};

const SetIconDisplay: React.FC<{ set: Set }> = ({ set }) => {
  if (isSkeleton(set)) return <Box sx={{ height: 40 }} />;

  return <Box sx={{ textAlign: 'center', m: 0.5 }}>{set.code && <SetIcon code={set.code} size="5x" fixedWidth />}</Box>;
};

type SetCardCountProps = {
  set: Set;
  isVisible?: boolean;
};
const SetCardCount: React.FC<SetCardCountProps> = ({ set, isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <Typography component="div" variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
      {isSkeleton(set) ? <SkeletonBar sx={{ width: '60%' }} /> : set.cardCount ? `${set.cardCount} cards` : 'N/A'}
    </Typography>
  );
};

const SkeletonBar = styled(Box)<{ width?: string }>(({ theme, width }) => ({
  height: 14,
  width,
  backgroundColor: theme.palette.action.disabledBackground,
  borderRadius: 4,
}));

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
}

const CostToPurchaseSection: React.FC<CostToPurchaseSectionProps> = ({
  costToComplete,
  isVisible = true,
  setId,
  includeSubsetsInSets = false,
}) => {
  if (!isVisible) return null;

  return (
    <Box
      sx={{
        mt: 2,
        pt: 2,
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
}

const CostToCompleteRow: React.FC<CostToCompleteRowProps> = ({
  label,
  cost,
  setId,
  countType,
  includeSubsetsInSets = false,
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
      </Box>
    </Box>
  );
};

export default SetItemRenderer;
