'use client';

import { Box, Card, CardContent, Typography, styled } from '@mui/material';
import React from 'react';
import SetIcon from '@/components/sets/SetIcon';
import { Set } from '@/types/sets';
import capitalize from '@/utils/capitalize';

// TODO: Loading skeleton once I know the height of the box after implementing the cost to complete stuff
const SetItemRenderer: React.FC<SetItemRendererProps> = ({ set, settings }) => {
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

export default SetItemRenderer;
