'use client';

import { Box, Button, Card, CardContent, Typography, styled } from '@mui/material';
import React from 'react';
import { CostToComplete } from '@/api/sets/types';
import SetIcon from '@/components/sets/SetIcon';
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

        {!isSkeleton(set) && costToComplete && <CostToPurchaseSection costToComplete={costToComplete} />}
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
}

const CostToPurchaseSection: React.FC<CostToPurchaseSectionProps> = ({ costToComplete }) => {
  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
      <Typography variant="subtitle2" color="textSecondary" component="h3" sx={{ mb: 1, textAlign: 'center' }}>
        Costs to purchase:
      </Typography>

      <CostToCompleteRow
        label="1x of all cards"
        cost={costToComplete.oneOfEachCard}
        onBuy1x={() => console.log('Buy 1x of each card')}
        onBuy4x={() => console.log('Buy 4x of each card')}
      />

      <CostToCompleteRow
        label="1x mythics"
        cost={costToComplete.oneOfEachMythic}
        onBuy1x={() => console.log('Buy 1x of each mythic')}
        onBuy4x={() => console.log('Buy 4x of each mythic')}
      />

      <CostToCompleteRow
        label="1x rares"
        cost={costToComplete.oneOfEachRare}
        onBuy1x={() => console.log('Buy 1x of each rare')}
        onBuy4x={() => console.log('Buy 4x of each rare')}
      />

      <CostToCompleteRow
        label="1x uncommons"
        cost={costToComplete.oneOfEachUncommon}
        onBuy1x={() => console.log('Buy 1x of each uncommon')}
        onBuy4x={() => console.log('Buy 4x of each uncommon')}
      />

      <CostToCompleteRow
        label="1x commons"
        cost={costToComplete.oneOfEachCommon}
        onBuy1x={() => console.log('Buy 1x of each common')}
        onBuy4x={() => console.log('Buy 4x of each common')}
      />
    </Box>
  );
};

interface CostToCompleteRowProps {
  label: string;
  cost: number;
  onBuy1x: () => void;
  onBuy4x: () => void;
}

const CostToCompleteRow: React.FC<CostToCompleteRowProps> = ({ label, cost, onBuy1x, onBuy4x }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Typography variant="body2" color="textSecondary" sx={{ flexBasis: '30%', flexShrink: 0 }}>
        {label}:
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ flexBasis: '30%', textAlign: 'right', pr: 1 }}>
        {formatPrice(cost)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, flexBasis: '40%' }}>
        <Button
          variant="outlined"
          size="small"
          sx={{ fontSize: '0.7rem', py: 0.2, minWidth: 'auto' }}
          onClick={onBuy1x}
        >
          Buy 1x
        </Button>
        <Button
          variant="outlined"
          size="small"
          sx={{ fontSize: '0.7rem', py: 0.2, minWidth: 'auto' }}
          onClick={onBuy4x}
        >
          Buy 4x
        </Button>
      </Box>
    </Box>
  );
};

export default SetItemRenderer;
