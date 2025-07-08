import React, { useState } from 'react';
import { Box, IconButton, Menu, MenuItem, TableCell } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CardLocationPills from './CardLocationPills';
import AddCardLocationsDialog from './AddCardLocationsDialog';

interface CardLocationTableCellProps {
  cardId: string;
  cardName: string;
  setName?: string;
  totalQuantityReg: number;
  totalQuantityFoil: number;
  canBeFoil?: boolean;
  canBeNonFoil?: boolean;
  locations?: {
    locationId: number;
    locationName: string;
    description: string | null;
    quantityReg: number;
    quantityFoil: number;
  }[];
}

export const CardLocationTableCell: React.FC<CardLocationTableCellProps> = ({
  cardId,
  cardName,
  setName,
  totalQuantityReg,
  totalQuantityFoil,
  canBeFoil = true,
  canBeNonFoil = true,
  locations,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleAddLocation = () => {
    handleMenuClose();
    setLocationDialogOpen(true);
  };

  return (
    <TableCell sx={{ maxWidth: '300px', position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CardLocationPills
            cardId={parseInt(cardId)}
            cardName={cardName}
            setName={setName}
            totalQuantityReg={totalQuantityReg}
            totalQuantityFoil={totalQuantityFoil}
            canBeFoil={canBeFoil}
            canBeNonFoil={canBeNonFoil}
            locations={locations}
          />
        </Box>
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{
            padding: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleAddLocation}>Add Card to Location</MenuItem>
      </Menu>

      {locationDialogOpen && (
        <AddCardLocationsDialog
          open={locationDialogOpen}
          onClose={() => setLocationDialogOpen(false)}
          cardId={parseInt(cardId)}
          cardName={cardName}
          setName={setName}
          totalQuantityReg={totalQuantityReg}
          totalQuantityFoil={totalQuantityFoil}
          canBeFoil={canBeFoil}
          canBeNonFoil={canBeNonFoil}
        />
      )}
    </TableCell>
  );
};