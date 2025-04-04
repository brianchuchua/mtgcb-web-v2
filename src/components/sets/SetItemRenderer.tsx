'use client';

import { Box, Card, CardContent, CardMedia, Typography } from '@mui/material';
import React from 'react';
import { Set } from '@/types/sets';
import { formatDate } from '@/utils/dateUtils';

export interface SetItemSettings {
  nameIsVisible?: boolean;
  codeIsVisible?: boolean;
  releaseDateIsVisible?: boolean;
  cardCountIsVisible?: boolean;
}

interface SetItemRendererProps {
  set: Set;
  settings: SetItemSettings;
  onClick?: (set: Set) => void;
}

const SetItemRenderer: React.FC<SetItemRendererProps> = ({ set, settings, onClick }) => {
  const isSkeletonLoading = 'isLoadingSkeleton' in set && set.isLoadingSkeleton;

  const handleClick = () => {
    if (onClick && !isSkeletonLoading) {
      onClick(set);
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }} 
      onClick={handleClick}
    >
      <CardMedia
        component="div"
        sx={{
          position: 'relative',
          pt: '75%', // 4:3 aspect ratio
          backgroundColor: isSkeletonLoading ? 'action.disabledBackground' : 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!isSkeletonLoading && set.iconUrl && (
          <Box 
            component="img"
            src={set.iconUrl}
            alt={set.name}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '75%',
              maxHeight: '75%',
              width: 'auto',
              height: 'auto',
            }}
          />
        )}
        {!isSkeletonLoading && !set.iconUrl && (
          <Typography 
            variant="h5" 
            component="div"
            sx={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'text.secondary',
            }}
          >
            {set.code || '?'}
          </Typography>
        )}
      </CardMedia>
      
      <CardContent sx={{ flexGrow: 1, pt: 1.5, pb: 1.5 }}>
        {settings.nameIsVisible !== false && (
          <Typography 
            variant="body1" 
            component="div"
            fontWeight="500" 
            gutterBottom 
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.2,
              height: '2.4em',
            }}
          >
            {isSkeletonLoading ? (
              <Box sx={{ height: 16, width: '80%', bgcolor: 'action.disabledBackground', borderRadius: 0.5 }} />
            ) : (
              set.name
            )}
          </Typography>
        )}
        
        <Box sx={{ mt: 0.5 }}>
          {settings.codeIsVisible !== false && (
            <Typography 
              variant="body2"
              component="div" 
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              {isSkeletonLoading ? (
                <Box sx={{ height: 14, width: '40%', bgcolor: 'action.disabledBackground', borderRadius: 0.5 }} />
              ) : (
                <>Code: {set.code || 'N/A'}</>
              )}
            </Typography>
          )}
          
          {settings.cardCountIsVisible !== false && (
            <Typography 
              variant="body2"
              component="div" 
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
            >
              {isSkeletonLoading ? (
                <Box sx={{ height: 14, width: '60%', bgcolor: 'action.disabledBackground', borderRadius: 0.5 }} />
              ) : (
                <>Cards: {set.cardCount ? parseInt(set.cardCount).toLocaleString() : 'N/A'}</>
              )}
            </Typography>
          )}
          
          {settings.releaseDateIsVisible !== false && (
            <Typography 
              variant="body2"
              component="div" 
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
            >
              {isSkeletonLoading ? (
                <Box sx={{ height: 14, width: '70%', bgcolor: 'action.disabledBackground', borderRadius: 0.5 }} />
              ) : (
                <>Released: {formatDate(set.releasedAt, { year: 'numeric', month: 'short' })}</>
              )}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SetItemRenderer;
