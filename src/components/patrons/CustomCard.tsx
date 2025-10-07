import { Box, Typography } from '@mui/material';

interface CustomCardProps {
  username: string;
  cardId: string;
  color: 'white' | 'blue' | 'black' | 'red' | 'green' | 'gold' | 'colorless';
}

export const CustomCard = ({ username, cardId, color }: CustomCardProps) => {
  const typeLine = 'Legendary Creature — Human Patron';
  const powerToughness = '10/10';
  const flavorText = 'Supporting the future of Magic collection tracking.';
  const frameUrl = `https://r2.mtgcollectionbuilder.com/images/${color}-frame.png?v=20251007`;
  const artCropUrl = `https://r2.mtgcollectionbuilder.com/cards/images/art_crop/${cardId}.jpg?v=20251007`;

  return (
    <Box
      sx={{
        position: 'relative',
        width: 250,
        height: 350,
        borderRadius: '7%',
        overflow: 'hidden',
        boxShadow: 3,
      }}
    >
      {/* Art Crop - positioned in the art box area (behind frame) */}
      <Box
        component="img"
        src={artCropUrl}
        alt={username}
        sx={{
          position: 'absolute',
          top: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          height: '45%',
          objectFit: 'cover',
          borderRadius: 1,
          zIndex: 0,
        }}
      />
      {/* Card Frame (transparent where art goes) */}
      <Box
        component="img"
        src={frameUrl}
        alt="Card frame"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1,
        }}
      />
      {/* Username - positioned at the top */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 22,
          right: 22,
          zIndex: 2,
          textAlign: 'left',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#1c1910',
            fontWeight: 700,
            textShadow: '0 0 4px rgba(255,255,255,0.8)',
            fontSize: '1.0rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {username}
        </Typography>
      </Box>

      {/* Type Line - positioned below the art */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 137,
          left: '47%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          textAlign: 'center',
          width: '100%',
          px: 2,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#1c1910',
            fontWeight: 600,
            fontSize: '0.7rem',
            lineHeight: 1.2,
            textShadow: '0 0 3px rgba(255,255,255,0.6)',
          }}
        >
          {typeLine}
        </Typography>
      </Box>

      {/* Flavor Text - positioned below the type line */}
      {flavorText && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 68,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            textAlign: 'center',
            width: '85%',
            px: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#1c1910',
              fontStyle: 'italic',
              fontSize: '0.75rem',
              lineHeight: 1.2,
              textShadow: '0 0 3px rgba(255,255,255,0.6)',
            }}
          >
            {flavorText}
          </Typography>
        </Box>
      )}

      {/* Power/Toughness - positioned bottom right */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 18,
          right: 24,
          zIndex: 2,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: '#1c1910',
            fontWeight: 700,
            fontSize: '0.8rem',
            textShadow: '0 0 3px rgba(255,255,255,0.6)',
          }}
        >
          {powerToughness}
        </Typography>
      </Box>
    </Box>
  );
};
