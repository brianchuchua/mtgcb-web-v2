import { Box, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import React from 'react';
import { CollectionProgressBar } from './CollectionProgressBar';

interface CollectionHeaderProps {
  username: string;
  userId?: number;
  uniquePrintingsCollected: number;
  numberOfCardsInMagic: number;
  totalCardsCollected: number;
  percentageCollected: number;
  totalValue: number;
  isLoading?: boolean;
  goalSummary?: {
    goalId: number;
    goalName: string;
    totalCards: number;
    collectedCards: number;
    percentageCollected: number;
    totalValue: number;
    costToComplete: number;
  };
}

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: theme.spacing(2),
}));


const CollectionHeaderComponent: React.FC<CollectionHeaderProps> = ({
  username,
  userId,
  uniquePrintingsCollected,
  numberOfCardsInMagic,
  totalCardsCollected,
  percentageCollected,
  totalValue,
  isLoading = false,
  goalSummary,
}) => {
  if (isLoading) {
    return (
      <HeaderContainer sx={{ height: 166 }}>
        <Skeleton variant="text" width={250} height={40} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 0 }} />
        <Skeleton variant="text" width={200} height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 0 }} />
        <Box sx={{ mt: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Skeleton variant="rectangular" width="100%" sx={{ maxWidth: '400px' }} height={24} />
        </Box>
      </HeaderContainer>
    );
  }

  // If we have a goal summary, show goal-specific header
  if (goalSummary) {
    return (
      <HeaderContainer>
        <Typography variant="h4" sx={{ mb: 0.5, color: 'primary.main' }}>
          {goalSummary.goalName}
        </Typography>

        {userId ? (
          <Link href={`/collections/${userId}`} style={{ textDecoration: 'none' }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mb: 0.5,
                color: 'text.secondary',
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {username}'s Collection Goal
            </Typography>
          </Link>
        ) : (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5 }}>
            {username}'s Collection Goal
          </Typography>
        )}

        <Typography variant="h6" color="text.secondary" sx={{ mb: 0 }}>
          {goalSummary.collectedCards}/{goalSummary.totalCards}
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 0 }}>
          Current value: $
          {goalSummary.totalValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>

        <Typography variant="h6" sx={{ mb: 0, color: 'warning.main' }}>
          Cost to complete: $
          {goalSummary.costToComplete.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>

        <Box sx={{ mt: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CollectionProgressBar
            percentage={goalSummary.percentageCollected}
            height={24}
            showLabel={true}
            labelFormat="long"
            maxWidth="400px"
          />
        </Box>
      </HeaderContainer>
    );
  }

  // Default collection header
  return (
    <HeaderContainer>
      <Typography variant="h4" sx={{ mb: 0.5, color: 'primary.main' }}>
        {username}'s Collection
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 0 }}>
        {uniquePrintingsCollected}/{numberOfCardsInMagic}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        ({totalCardsCollected} total cards collected)
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 0 }}>
        Collection value: $
        {totalValue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Typography>

      <Box sx={{ mt: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CollectionProgressBar
          percentage={percentageCollected}
          height={24}
          showLabel={true}
          labelFormat="long"
          maxWidth="400px"
        />
      </Box>
    </HeaderContainer>
  );
};

export const CollectionHeader = React.memo(CollectionHeaderComponent, (prevProps, nextProps) => {
  return (
    prevProps.username === nextProps.username &&
    prevProps.userId === nextProps.userId &&
    prevProps.uniquePrintingsCollected === nextProps.uniquePrintingsCollected &&
    prevProps.numberOfCardsInMagic === nextProps.numberOfCardsInMagic &&
    prevProps.totalCardsCollected === nextProps.totalCardsCollected &&
    prevProps.percentageCollected === nextProps.percentageCollected &&
    prevProps.totalValue === nextProps.totalValue &&
    prevProps.isLoading === nextProps.isLoading &&
    JSON.stringify(prevProps.goalSummary) === JSON.stringify(nextProps.goalSummary)
  );
});
