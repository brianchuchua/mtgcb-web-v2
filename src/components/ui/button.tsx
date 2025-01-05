'use client';

import {
  CircularProgress,
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import * as React from 'react';

const ButtonWrapper = styled('div')({
  position: 'relative',
  display: 'flex',
});

const StyledCircularProgress = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.primary.light,
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)', // Modern replacement for margin-based centering
}));

interface ButtonProps extends MuiButtonProps {
  isSubmitting?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { isSubmitting, children, ...props },
  ref,
) {
  return (
    <ButtonWrapper>
      <MuiButton disabled={isSubmitting} ref={ref} {...props}>
        {children}
      </MuiButton>
      {isSubmitting && <StyledCircularProgress size={24} />}
    </ButtonWrapper>
  );
});
