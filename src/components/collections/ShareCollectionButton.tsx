import { useState } from 'react';
import { Button, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { Share as ShareIcon } from '@mui/icons-material';
import { ShareCollectionModal } from './ShareCollectionModal';

interface ShareCollectionButtonProps {
  userId: string;
  username: string;
  isPublic: boolean;
  collectionName?: string;
  setSlug?: string;
}

export const ShareCollectionButton = ({
  userId,
  username,
  isPublic,
  collectionName,
  setSlug,
}: ShareCollectionButtonProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleClick = () => {
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  if (isSmallScreen) {
    return (
      <>
        <Tooltip title="Share">
          <Button
            variant="outlined"
            size="small"
            onClick={handleClick}
            sx={{
              minWidth: 'auto',
              px: 1,
            }}
          >
            <ShareIcon />
          </Button>
        </Tooltip>
        <ShareCollectionModal
          open={modalOpen}
          onClose={handleClose}
          userId={userId}
          username={username}
          isPrivate={!isPublic}
          collectionName={collectionName}
          setSlug={setSlug}
        />
      </>
    );
  }

  return (
    <>
      <Button 
        variant="outlined"
        size="small"
        startIcon={<ShareIcon />} 
        onClick={handleClick}
      >
        Share
      </Button>
      <ShareCollectionModal
        open={modalOpen}
        onClose={handleClose}
        userId={userId}
        username={username}
        isPrivate={!isPublic}
        collectionName={collectionName}
        setSlug={setSlug}
      />
    </>
  );
};