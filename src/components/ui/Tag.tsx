'use client';

import { SxProps, Theme, alpha, styled } from '@mui/material/styles';
import { HTMLAttributes, ReactNode } from 'react';

// A label that only tells you something. Chips you press or remove stay round MUI Chips:
// round means pressable, square-ish means informational.
export const Tag = ({ tone = 'neutral', quiet = false, icon, children, ...rest }: TagProps) => (
  <Root tone={tone} quiet={quiet} {...rest}>
    {icon}
    <Text>{children}</Text>
  </Root>
);

export type TagTone = 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'neutral';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  // No box, just an icon and a word. For metadata that should not compete with real labels.
  quiet?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

const hueFor = (theme: Theme, tone: TagTone): string => {
  if (tone === 'blue') return theme.palette.primary.main;
  if (tone === 'purple') return theme.palette.secondary.main;
  if (tone === 'amber') return theme.palette.warning.main;
  if (tone === 'green') return theme.palette.success.main;
  if (tone === 'red') return theme.palette.error.main;
  return theme.palette.text.secondary;
};

const Root = styled('span', {
  shouldForwardProp: (prop) => prop !== 'tone' && prop !== 'quiet',
})<{ tone: TagTone; quiet: boolean }>(({ theme, tone, quiet }) => {
  const hue = hueFor(theme, tone);
  const neutral = tone === 'neutral';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 24,
    fontSize: 13,
    fontWeight: quiet && neutral ? 500 : 600,
    lineHeight: 1,
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    flexShrink: 0,
    // Material icons at 18px, a size they were published at, on whole pixels.
    '& svg': { width: 18, height: 18, fontSize: 18, display: 'block', flexShrink: 0 },
    ...(quiet
      ? { color: hue }
      : {
          padding: '0 8px',
          borderRadius: 6,
          color: neutral ? theme.palette.text.secondary : hue,
          backgroundColor: alpha(neutral ? theme.palette.text.primary : hue, neutral ? 0.07 : 0.13),
          boxShadow: `inset 0 0 0 1px ${alpha(neutral ? theme.palette.text.primary : hue, neutral ? 0.12 : 0.28)}`,
        }),
  };
});

// Trims the line box to the capital letters, so centring the row centres the letters on the icon.
// Browsers without text-box ignore it and fall back to normal centring.
const Text = styled('span')({
  textBox: 'trim-both cap alphabetic',
});

export default Tag;
