import React from 'react';
import { Box, MenuItem, Tooltip } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const createWarningTooltip = (priceType: string) => (
  <Box
    component="span"
    onClick={(e) => e.stopPropagation()}
    sx={{
      display: 'inline-flex',
      marginLeft: 1,
      pointerEvents: 'auto',
    }}
  >
    <Tooltip title={`Selecting this will change your display price setting to ${priceType}`}>
      <WarningAmberIcon color="warning" fontSize="small" />
    </Tooltip>
  </Box>
);

export const getCardSortOptions = (isPriceMismatched: (priceOption: string) => boolean, isCollectionPage: boolean) => {
  const baseCardOptions = [
    <MenuItem key="name" value="name">
      Name
    </MenuItem>,
    <MenuItem key="releasedAt" value="releasedAt">
      Release Date
    </MenuItem>,
    <MenuItem key="collectorNumber" value="collectorNumber">
      Collector Number
    </MenuItem>,
    <MenuItem key="mtgcbCollectorNumber" value="mtgcbCollectorNumber">
      MTG CB Collector Number
    </MenuItem>,
    <MenuItem key="rarityNumeric" value="rarityNumeric">
      Rarity
    </MenuItem>,
    <MenuItem key="powerNumeric" value="powerNumeric">
      Power
    </MenuItem>,
    <MenuItem key="toughnessNumeric" value="toughnessNumeric">
      Toughness
    </MenuItem>,
    <MenuItem key="loyaltyNumeric" value="loyaltyNumeric">
      Loyalty
    </MenuItem>,
    <MenuItem key="convertedManaCost" value="convertedManaCost">
      Mana Value
    </MenuItem>,
    <MenuItem key="market" value="market">
      Price (Market)
      {isPriceMismatched('market') && createWarningTooltip('Market')}
    </MenuItem>,
    <MenuItem key="low" value="low">
      Price (Low)
      {isPriceMismatched('low') && createWarningTooltip('Low')}
    </MenuItem>,
    <MenuItem key="average" value="average">
      Price (Average)
      {isPriceMismatched('average') && createWarningTooltip('Average')}
    </MenuItem>,
    <MenuItem key="high" value="high">
      Price (High)
      {isPriceMismatched('high') && createWarningTooltip('High')}
    </MenuItem>,
    <MenuItem key="foil" value="foil">
      Price (Foil)
    </MenuItem>,
  ];

  if (isCollectionPage) {
    const collectionCardOptions = [
      <MenuItem key="quantityReg" value="quantityReg">
        Quantity (Regular)
      </MenuItem>,
      <MenuItem key="quantityFoil" value="quantityFoil">
        Quantity (Foil)
      </MenuItem>,
      <MenuItem key="quantityAll" value="quantityAll">
        Quantity (Total)
      </MenuItem>,
    ];
    return [...baseCardOptions, ...collectionCardOptions];
  }

  return baseCardOptions;
};

export const getSetSortOptions = (isCollectionPage: boolean) => {
  const baseOptions = [
    <MenuItem key="name" value="name">
      Name
    </MenuItem>,
    <MenuItem key="code" value="code">
      Code
    </MenuItem>,
    <MenuItem key="releasedAt" value="releasedAt">
      Release Date
    </MenuItem>,
    <MenuItem key="cardCount" value="cardCount">
      Cards In Set
    </MenuItem>,
    <MenuItem key="setType" value="setType">
      Set Type
    </MenuItem>,
  ];

  if (isCollectionPage) {
    const collectionOptions = [
      <MenuItem key="percentageCollected" value="percentageCollected">
        Completion %
      </MenuItem>,
      <MenuItem key="totalValue" value="totalValue">
        Current Set Value
      </MenuItem>,
      <MenuItem key="costToComplete.oneOfEachCard" value="costToComplete.oneOfEachCard">
        Cost to Complete
      </MenuItem>,
    ];
    return [...baseOptions, ...collectionOptions];
  }

  return baseOptions;
};