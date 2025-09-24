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
  isOwnCollection?: boolean;
  hasLocations?: boolean;
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
  isOwnCollection = false,
  hasLocations = false,
}) => {
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const handleAddLocation = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (totalQuantityReg || totalQuantityFoil) {
      setLocationDialogOpen(true);
    }
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
          onAddLocation={isOwnCollection ? handleAddLocation : undefined}
          isOwnCollection={isOwnCollection}
        />
      ) : (
        isOwnCollection && hasLocations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Chip
              label="Add Card to Location"
              onClick={handleAddLocation}
              size="small"
              disabled={!totalQuantityReg && !totalQuantityFoil}
              sx={{
                cursor: !totalQuantityReg && !totalQuantityFoil ? 'not-allowed' : 'pointer',
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': !totalQuantityReg && !totalQuantityFoil ? {} : {
                  backgroundColor: 'action.hover',
                  borderColor: 'text.secondary',
                },
              }}
              variant="outlined"
            />
          </Box>
        ) : null
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