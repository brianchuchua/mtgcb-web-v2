'use client';

import React from 'react';
import { Box, Button, Collapse, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useCostsToCompleteExpanded } from '@/contexts/DisplaySettingsContext';
import { CostToComplete } from '@/api/sets/types';
import TCGPlayerMassImportButton from '@/components/tcgplayer/TCGPlayerMassImportButton';
import { CountType } from '@/components/tcgplayer/useFetchCardsForMassImport';
import { Set } from '@/types/sets';
import { generateTCGPlayerSealedProductLink } from '@/utils/affiliateLinkBuilder';
import { formatPrice } from '@/utils/formatters';

interface SetPageBuyButtonProps {
  set: Set;
  costToComplete?: CostToComplete;
  includeSubsetsInSets?: boolean;
  userId?: number;
  isCollection?: boolean;
}

export const SetPageBuyButton: React.FC<SetPageBuyButtonProps> = ({
  set,
  costToComplete,
  includeSubsetsInSets = false,
  userId,
  isCollection = false,
}) => {
  const [globalExpanded] = useCostsToCompleteExpanded();
  const [expanded, setExpanded] = React.useState(globalExpanded);

  React.useEffect(() => {
    setExpanded(globalExpanded);
  }, [globalExpanded]);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  if (!costToComplete) return null;

  const buttonLabel = isCollection ? 'Buy missing cards' : 'Buy this set';

  return (
    <Box
      sx={{
        mt: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Button
        onClick={handleExpandClick}
        variant="outlined"
        size="small"
        sx={{
          textTransform: 'none',
          fontSize: '0.875rem',
          py: 0.5,
          px: 2,
        }}
        endIcon={
          <ExpandMore
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          />
        }
      >
        {buttonLabel}
      </Button>

      <Collapse in={expanded} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
        <Box sx={{ width: '100%', maxWidth: '400px', mx: 'auto', mt: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" component="h3" sx={{ mb: 1.5, textAlign: 'center' }}>
            Cost to {isCollection ? 'complete' : 'buy'}:
          </Typography>

          <CostToCompleteRow
            label="All cards"
            cost={costToComplete.oneOfEachCard}
            setId={set.id}
            countType="all"
            includeSubsetsInSets={includeSubsetsInSets}
            userId={userId}
          />

          <CostToCompleteRow
            label="Mythics"
            cost={costToComplete.oneOfEachMythic}
            setId={set.id}
            countType="mythic"
            includeSubsetsInSets={includeSubsetsInSets}
            userId={userId}
          />

          <CostToCompleteRow
            label="Rares"
            cost={costToComplete.oneOfEachRare}
            setId={set.id}
            countType="rare"
            includeSubsetsInSets={includeSubsetsInSets}
            userId={userId}
          />

          <CostToCompleteRow
            label="Uncommons"
            cost={costToComplete.oneOfEachUncommon}
            setId={set.id}
            countType="uncommon"
            includeSubsetsInSets={includeSubsetsInSets}
            userId={userId}
          />

          <CostToCompleteRow
            label="Commons"
            cost={costToComplete.oneOfEachCommon}
            setId={set.id}
            countType="common"
            includeSubsetsInSets={includeSubsetsInSets}
            userId={userId}
          />

          {set.isDraftable && (
            <CostToCompleteRow
              label="Draft Cube"
              cost={costToComplete.draftCube}
              setId={set.id}
              countType="draftcube"
              includeSubsetsInSets={includeSubsetsInSets}
              userId={userId}
              singleButton
            />
          )}

          {set.sealedProductUrl && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 2,
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
      </Collapse>
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
}

const CostToCompleteRow: React.FC<CostToCompleteRowProps> = ({
  label,
  cost,
  setId,
  countType,
  includeSubsetsInSets = false,
  singleButton = false,
  userId,
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
        <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
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
            >
              Buy 1x
            </TCGPlayerMassImportButton>
            <TCGPlayerMassImportButton
              setId={setId}
              count={4}
              countType={countType}
              includeSubsetsInSets={includeSubsetsInSets}
              userId={userId}
            >
              Buy 4x
            </TCGPlayerMassImportButton>
          </>
        )}
      </Box>
    </Box>
  );
};