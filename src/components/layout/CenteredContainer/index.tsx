'use client';

import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ReactNode } from 'react';

interface CenteredContainerProps {
  children: ReactNode;
  maxWidth?: number | string;
}

const CenteredContainer = ({ children, maxWidth = 400 }: CenteredContainerProps) => {
  return (
    <StyledContainer>
      <ContentWrapper maxWidth={maxWidth}>{children}</ContentWrapper>
    </StyledContainer>
  );
};

const StyledContainer = styled(Box)({
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
});

const ContentWrapper = styled(Box)<{ maxWidth: number | string }>(({ maxWidth }) => ({
  width: '100%',
  maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
}));

export default CenteredContainer;
