import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { CollectionProgressBar } from './CollectionProgressBar';

interface CollectionHeaderProps {
  username: string;
  uniquePrintingsCollected: number;
  numberOfCardsInMagic: number;
  totalCardsCollected: number;
  percentageCollected: number;
  totalValue: number;
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
  uniquePrintingsCollected,
  numberOfCardsInMagic,
  totalCardsCollected,
  percentageCollected,
  totalValue,
}) => {
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
    prevProps.uniquePrintingsCollected === nextProps.uniquePrintingsCollected &&
    prevProps.numberOfCardsInMagic === nextProps.numberOfCardsInMagic &&
    prevProps.totalCardsCollected === nextProps.totalCardsCollected &&
    prevProps.percentageCollected === nextProps.percentageCollected &&
    prevProps.totalValue === nextProps.totalValue
  );
});
