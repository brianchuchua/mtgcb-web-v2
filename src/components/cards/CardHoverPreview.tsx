import { Box, Paper, Skeleton } from '@mui/material';
import React, { useState } from 'react';

interface CardHoverPreviewProps {
  cardId: string;
  cardName?: string;
  setName?: string;
  children: React.ReactNode;
}

export const CardHoverPreview: React.FC<CardHoverPreviewProps> = ({ 
  cardId, 
  cardName, 
  setName,
  children 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const imageUrl = `https://r2.mtgcollectionbuilder.com/cards/images/normal/${cardId}.jpg?v=${
    process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'
  }`;

  const getBorderRadius = () => {
    return setName === 'Limited Edition Alpha' ? '7%' : '5%';
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setShowPreview(true);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
    setImageLoaded(false);
  };

  // Calculate position for the preview
  const getPreviewPosition = () => {
    const previewWidth = 250;
    const previewHeight = 350;
    const offset = 10;

    let left = mousePosition.x + offset;
    let top = mousePosition.y - previewHeight / 2;

    // Adjust if preview would go off the right edge
    if (typeof window !== 'undefined' && left + previewWidth > window.innerWidth) {
      left = mousePosition.x - previewWidth - offset;
    }

    // Adjust if preview would go off the top
    if (top < 0) {
      top = offset;
    }

    // Adjust if preview would go off the bottom
    if (typeof window !== 'undefined' && top + previewHeight > window.innerHeight) {
      top = window.innerHeight - previewHeight - offset;
    }

    return { left, top };
  };

  const previewPosition = getPreviewPosition();

  return (
    <>
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        sx={{ display: 'contents' }}
      >
        {children}
      </Box>
      
      {showPreview && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            left: `${previewPosition.left}px`,
            top: `${previewPosition.top}px`,
            width: 250,
            height: 350,
            zIndex: 9999,
            pointerEvents: 'none',
            borderRadius: getBorderRadius(),
            overflow: 'hidden',
            backgroundColor: '#1c2025',
          }}
        >
          {!imageLoaded && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              animation="wave"
              sx={{ backgroundColor: '#22262c' }}
            />
          )}
          <Box
            component="img"
            src={imageUrl}
            alt={cardName || 'Card preview'}
            onLoad={() => setImageLoaded(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: imageLoaded ? 'block' : 'none',
            }}
          />
        </Paper>
      )}
    </>
  );
};