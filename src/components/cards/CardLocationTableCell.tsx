import React, { useState } from 'react';
import { Box, Chip, TableCell } from '@mui/material';
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
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const handleAddLocation = (event: React.MouseEvent) => {
    event.stopPropagation();
    setLocationDialogOpen(true);
  };

  return (
    <TableCell sx={{ maxWidth: '300px', position: 'relative', verticalAlign: 'middle' }}>
      {locations && locations.length > 0 ? (
        <CardLocationPills
          cardId={parseInt(cardId)}
          cardName={cardName}
          setName={setName}
          totalQuantityReg={totalQuantityReg}
          totalQuantityFoil={totalQuantityFoil}
          canBeFoil={canBeFoil}
          canBeNonFoil={canBeNonFoil}
          locations={locations}
          align="center"
          onAddLocation={handleAddLocation}
        />
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Chip
            label="Add Card to Location"
            onClick={handleAddLocation}
            size="small"
            sx={{
              cursor: 'pointer',
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'text.secondary',
              },
            }}
            variant="outlined"
          />
        </Box>
      )}

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