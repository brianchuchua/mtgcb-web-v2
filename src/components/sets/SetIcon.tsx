'use client';

import Box from '@mui/material/Box';
import React from 'react';

export type SetIconSize = '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '10x' | 'lg';

interface SetIconProps {
  code: string;
  size?: SetIconSize;
  rarity?: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special';
  border?: boolean;
  fixedWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders an MTG set icon using the Keyrune font
 *
 * @param code The set code (e.g. "pptdm")
 * @param size Font size (from '1x' to '10x' or 'lg')
 * @param rarity Optional rarity to colorize the icon
 * @param shadow Whether to add a white text shadow outline
 * @param fixedWidth Whether to apply the fixed width class
 * @param className Additional CSS classes
 * @param style Additional inline styles
 */
const SetIcon: React.FC<SetIconProps> = ({
  code,
  size = '1x',
  rarity = 'common',
  border = true,
  fixedWidth = false,
  className = '',
  style = {},
}) => {
  // Ensure code is lowercase as the keyrune CSS uses lowercase codes
  const normalizedCode = code.toLowerCase();

  // Build the CSS class string
  const classes = [
    'ss',
    `ss-${normalizedCode}`,
    `ss-${size}`,
    ...(rarity ? [`ss-${rarity}`] : []),
    ...(fixedWidth ? ['ss-fw'] : []),
    className,
  ].join(' ');

  // Simulates a 1px white stroke around the icon
  const shadowStyle = border
    ? {
        textShadow:
          'rgb(255, 255, 255) -1px -1px 0px, rgb(255, 255, 255) 1px -1px 0px, rgb(255, 255, 255) -1px 1px 0px, rgb(255, 255, 255) 1px 1px 0px',
      }
    : {};

  return (
    <Box
      component="i"
      className={classes}
      style={{ ...shadowStyle, ...style }}
      aria-hidden="true"
    />
  );
};

export default SetIcon;
