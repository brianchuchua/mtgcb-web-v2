import { useState } from 'react';
import { Button, Tooltip, useMediaQuery } from '@mui/material';
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
  const isMobile = useMediaQuery('(max-width:899px)');
  const isTablet = useMediaQuery('(min-width:900px) and (max-width:1199px)');
  const isSmallScreen = isMobile || isTablet;

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