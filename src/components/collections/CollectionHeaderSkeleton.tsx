import { Box, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';

// Mirrors the line heights of the loaded header so the page doesn't jump when data arrives.
export const CollectionHeaderSkeleton = ({ hasGoal, hideValue }: CollectionHeaderSkeletonProps) => {
  if (!hasGoal) {
    return (
      <SkeletonContainer sx={{ height: 166 }}>
        <Skeleton variant="text" width={250} height={40} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 0 }} />
        <Skeleton variant="text" width={200} height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 0 }} />
        <ProgressSkeleton />
      </SkeletonContainer>
    );
  }

  return (
    <SkeletonContainer data-testid="goal-header-skeleton">
      <Skeleton variant="text" width={250} height={42} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width={190} height={28} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width={120} height={32} />
      {!hideValue && (
        <>
          <Skeleton variant="text" width={220} height={32} />
          <Skeleton variant="text" width={240} height={32} />
          <Skeleton variant="rounded" width={170} height={33} sx={{ mt: 0.5 }} />
        </>
      )}
      <ProgressSkeleton />
    </SkeletonContainer>
  );
};

const ProgressSkeleton = () => (
  <Box sx={{ mt: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <Skeleton variant="rectangular" width="100%" sx={{ maxWidth: '400px' }} height={24} />
  </Box>
);

const SkeletonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: theme.spacing(2),
}));

interface CollectionHeaderSkeletonProps {
  hasGoal: boolean;
  hideValue: boolean;
}
