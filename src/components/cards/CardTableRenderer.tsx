'use client';

import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TableCell,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import debounce from 'lodash.debounce';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardItemProps } from './CardItem';
import { CardLocationTableCell } from './CardLocationTableCell';
import CardPrice from './CardPrice';
import { GoalStatusTableCell } from './GoalStatusTableCell';
import { useUpdateCollectionMutation } from '@/api/collections/collectionsApi';
import { ResponsiveWidth, TableColumn } from '@/components/common/VirtualizedTable';
import { PriceType } from '@/types/pricing';
import { generateCardSlug } from '@/utils/cards/generateCardSlug';
import { getCardImageUrl } from '@/utils/cards/getCardImageUrl';
import { getCollectionSetUrl } from '@/utils/collectionUrls';

export interface CardTableRendererProps {
  priceType: PriceType;
  displaySettings: {
    setIsVisible?: boolean;
    collectorNumberIsVisible?: boolean;
    mtgcbNumberIsVisible?: boolean;
    rarityIsVisible?: boolean;
    typeIsVisible?: boolean;
    artistIsVisible?: boolean;
    manaCostIsVisible?: boolean;
    powerIsVisible?: boolean;
    toughnessIsVisible?: boolean;
    loyaltyIsVisible?: boolean;
    priceIsVisible?: boolean;
    quantityIsVisible?: boolean;
    goalProgressIsVisible?: boolean;
    locationsIsVisible?: boolean;
  };
}

// Card table helper hooks and components
export const useCardTableColumns = (
  { priceType, displaySettings }: CardTableRendererProps,
  currentSortBy: string,
  isOwnCollection?: boolean,
  hasLocations?: boolean,
): TableColumn<CardItemProps>[] => {
  // Tooltip components
  const ReleaseDateTooltip = () => (
    <div>
      <div>Sort by set release date</div>
      <div>Sets are displayed by name, but sorted chronologically</div>
    </div>
  );

  const PriceTooltip = () => (
    <div>
      <div>Sort by {priceType} price</div>
      <div>Changes to the price type in settings will update this sort</div>
    </div>
  );

  const RarityTooltip = () => (
    <div>
      <div>Sort by rarity</div>
      <div>Common → Uncommon → Rare → Mythic → Special</div>
    </div>
  );

  const MtgcbNumberTooltip = () => (
    <div>
      <div>Sort by MTG CB Collector Number</div>
      <div>Custom sequential numbering system used by MTG Collection Builder</div>
    </div>
  );

  const ManaCostTooltip = () => (
    <div>
      <div>Sort by mana value</div>
      <div>Shows the mana symbols, but sorts by converted mana cost</div>
    </div>
  );

  // Tooltip components for quantity columns
  const QuantityRegTooltip = () => (
    <div>
      <div>Sort by regular quantity</div>
      <div>Number of non-foil copies in your collection</div>
    </div>
  );

  const QuantityFoilTooltip = () => (
    <div>
      <div>Sort by foil quantity</div>
      <div>Number of foil copies in your collection</div>
    </div>
  );

  // Define all possible columns
  const allColumns: TableColumn<CardItemProps>[] = [
    {
      id: 'mtgcbCollectorNumber',
      label: 'M#',
      width: { default: '60px' },
      tooltip: <MtgcbNumberTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'name',
      label: 'Name',
      width: {
        xs: '150px',
        sm: '200px',
        md: '250px',
        default: '300px',
      },
      sortable: true,
    },
    {
      id: 'quantityReg',
      label: 'Regular',
      width: { default: '110px' },
      align: 'center',
      tooltip: <QuantityRegTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'quantityFoil',
      label: 'Foils',
      width: { default: '110px' },
      align: 'center',
      tooltip: <QuantityFoilTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'locations',
      label: 'Locations',
      width: {
        xs: '150px',
        sm: '200px',
        md: '250px',
        default: '250px',
      },
      sortable: false,
      align: 'center' as const,
    },
    {
      id: 'collectorNumber',
      label: '#',
      width: { default: '60px' },
      sortable: true,
    },
    {
      id: 'releasedAt', // This renders as a set name, but sorts by release date
      label: 'Set',
      width: {
        xs: '200px',
        sm: '200px',
        md: '200px',
        default: '250px',
      },
      tooltip: <ReleaseDateTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'rarityNumeric',
      label: 'Rarity',
      width: { default: '100px' },
      tooltip: <RarityTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'type',
      label: 'Type',
      width: {
        xs: '120px',
        sm: '150px',
        default: '250px',
      },
      sortable: true,
    },
    {
      id: 'artist',
      label: 'Artist',
      width: {
        xs: '100px',
        sm: '120px',
        default: '150px',
      },
      sortable: true,
    },
    {
      id: 'convertedManaCost',
      label: 'Mana',
      width: {
        xs: '90px',
        sm: '100px',
        md: '120px',
        default: '120px',
      },
      tooltip: <ManaCostTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'powerNumeric',
      label: 'Power',
      width: { default: '100px' },
      align: 'center',
      sortable: true,
    },
    {
      id: 'toughnessNumeric',
      label: 'Toughness',
      width: { default: '100px' },
      align: 'center',
      sortable: true,
    },
    {
      id: 'loyaltyNumeric',
      label: 'Loyalty',
      width: { default: '100px' },
      align: 'center',
      sortable: true,
    },
    {
      id: priceType,
      label: 'Price',
      width: {
        xs: '100px',
        sm: '150px',
        default: '200px',
      },
      tooltip: <PriceTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
  ];

  // Filter columns based on visibility settings
  const filteredColumns = allColumns.filter((column) => {
    if (column.id === 'collectorNumber') return displaySettings.collectorNumberIsVisible;
    if (column.id === 'mtgcbCollectorNumber') return displaySettings.mtgcbNumberIsVisible;
    if (column.id === 'name') return true; // Always show name
    if (column.id === 'releasedAt') return displaySettings.setIsVisible; // Set name is always shown, but sorted by release date
    if (column.id === 'rarityNumeric') return displaySettings.rarityIsVisible;
    if (column.id === 'type') return displaySettings.typeIsVisible;
    if (column.id === 'artist') return displaySettings.artistIsVisible;
    if (column.id === 'convertedManaCost') return displaySettings.manaCostIsVisible;
    if (column.id === 'powerNumeric') return displaySettings.powerIsVisible;
    if (column.id === 'toughnessNumeric') return displaySettings.toughnessIsVisible;
    if (column.id === 'loyaltyNumeric') return displaySettings.loyaltyIsVisible;

    const isPriceColumn =
      column.id === 'market' ||
      column.id === 'low' ||
      column.id === 'average' ||
      column.id === 'high' ||
      column.id === 'foil';

    if (isPriceColumn) return displaySettings.priceIsVisible;

    if (column.id === 'quantityReg' || column.id === 'quantityFoil') {
      return displaySettings.quantityIsVisible ?? false;
    }

    if (column.id === 'locations') {
      // Show locations column when enabled in settings AND user has locations
      // Hide the column if user has no locations, even if they enabled it in settings
      const userWantsLocations = displaySettings.locationsIsVisible ?? false;
      return userWantsLocations && (hasLocations ?? true); // Default to true if hasLocations not provided (backwards compatibility)
    }

    return true;
  });

  return filteredColumns;
};

// Table-specific styled components for editable quantity
const TableQuantityContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'stretch',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '4px',
  overflow: 'hidden', // Clip children to container bounds
  '&:focus-within': {
    borderColor: theme.palette.primary.main,
  },
  '&.error': {
    borderColor: theme.palette.error.main,
  },
}));

const TableQuantityInput = styled(TextField)(({ theme }) => ({
  position: 'relative',
  '& .MuiOutlinedInput-input': {
    padding: '2px 4px',
    width: '30px',
    textAlign: 'center',
    fontSize: '0.75rem',
    height: '22px', // Adjusted for no border
  },
  '& .MuiOutlinedInput-root': {
    height: '24px',
    borderRadius: 0,
    '& fieldset': {
      border: 'none', // Remove all borders since container has them
    },
    '&:hover fieldset': {
      border: 'none',
    },
    '&.Mui-focused fieldset': {
      border: 'none',
    },
    '&.Mui-disabled fieldset': {
      border: 'none',
    },
    '&.Mui-error fieldset': {
      border: 'none',
    },
  },
  '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type="number"]': {
    MozAppearance: 'textfield',
  },
}));

const TableQuantityButton = styled(IconButton)(({ theme }) => ({
  padding: '2px',
  width: '24px',
  height: '24px',
  borderRadius: 0,
  border: 'none', // No individual borders
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '0.875rem',
  },
}));

const TableLeftButton = styled(TableQuantityButton)(({ theme }) => ({
  // No divider border
}));

const TableRightButton = styled(TableQuantityButton)(({ theme }) => ({
  // No divider border
}));

// Inline editable quantity component for table cells
const InlineEditableQuantity: React.FC<{
  cardId: string;
  cardName: string;
  quantity: number;
  quantityType: 'regular' | 'foil';
  otherQuantity?: number; // The other quantity (foil if editing regular, regular if editing foil)
  canBeFoil?: boolean;
  canBeNonFoil?: boolean;
}> = ({ cardId, cardName, quantity, quantityType, otherQuantity = 0, canBeFoil = true, canBeNonFoil = true }) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [inputValue, setInputValue] = useState(quantity.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [overrideNonFoil, setOverrideNonFoil] = useState(false);
  const [overrideFoil, setOverrideFoil] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [updateCollection] = useUpdateCollectionMutation();
  const { enqueueSnackbar } = useSnackbar();
  const updatePromiseRef = useRef<{ abort: () => void } | null>(null);
  const isUserEditingRef = useRef(false);
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if this quantity selector should be disabled
  const canEdit = quantityType === 'regular' ? canBeNonFoil || overrideNonFoil : canBeFoil || overrideFoil;
  const isDisabled = !canEdit;

  // Determine if this selector has an error (disabled but non-zero quantity)
  const hasError = isDisabled && localQuantity > 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only update if user is not actively editing
    if (!isUserEditingRef.current) {
      setLocalQuantity(quantity);
      setInputValue(quantity.toString());
    }
  }, [quantity]);

  const debouncedUpdate = useCallback(
    debounce(async (newQuantity: number) => {
      // Cancel any pending request
      if (updatePromiseRef.current) {
        updatePromiseRef.current.abort();
      }

      // Set loading state
      setIsLoading(true);
      setShowSuccess(false);

      try {
        const promise = updateCollection({
          mode: 'set',
          cards: [
            {
              cardId: parseInt(cardId),
              quantityReg: quantityType === 'regular' ? newQuantity : otherQuantity,
              quantityFoil: quantityType === 'foil' ? newQuantity : otherQuantity,
            },
          ],
        });

        // Store the promise so we can abort it later
        updatePromiseRef.current = promise;

        await promise.unwrap();

        // Set success state - persists until page navigation
        setIsLoading(false);
        setShowSuccess(true);
        // Success is now shown inline with checkmark icon
      } catch (error: any) {
        // Clear loading state on error
        setIsLoading(false);
        // Don't show error or reset for aborted requests
        if (error.name !== 'AbortError' && error.message !== 'Aborted') {
          enqueueSnackbar(`Failed to update ${cardName} quantity`, { variant: 'error' });
          setLocalQuantity(quantity); // Reset on error
        }
      }
    }, 400),
    [updateCollection, cardId, cardName, quantityType, otherQuantity, enqueueSnackbar, quantity],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Mark as user editing
    isUserEditingRef.current = true;

    // Clear any existing timeout
    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }

    // Set timeout to clear editing flag
    editingTimeoutRef.current = setTimeout(() => {
      isUserEditingRef.current = false;
    }, 2000);

    // Update the display value
    setInputValue(value);

    // Allow empty string without updating the actual quantity
    if (value === '') {
      return; // Don't trigger the API call yet
    }

    const numValue = parseInt(value) || 0;
    const newQuantity = Math.max(0, numValue);
    setLocalQuantity(newQuantity);
    debouncedUpdate(newQuantity);
  };

  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // If empty, set to 0
    if (inputValue === '') {
      setLocalQuantity(0);
      setInputValue('0');
      debouncedUpdate(0);
    } else {
      // Ensure the display value matches the numeric value
      const numValue = parseInt(inputValue) || 0;
      setInputValue(numValue.toString());
    }
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus - use currentTarget which is always the input
    event.currentTarget.select();
  };

  const handleIncrement = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.currentTarget.blur();

    // Mark as user editing
    isUserEditingRef.current = true;

    // Clear any existing timeout
    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }

    // Set timeout to clear editing flag
    editingTimeoutRef.current = setTimeout(() => {
      isUserEditingRef.current = false;
    }, 2000);

    const newQuantity = localQuantity + 1;
    setLocalQuantity(newQuantity);
    setInputValue(newQuantity.toString());
    debouncedUpdate(newQuantity);
  };

  const handleDecrement = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.currentTarget.blur();

    // Mark as user editing
    isUserEditingRef.current = true;

    // Clear any existing timeout
    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }

    // Set timeout to clear editing flag
    editingTimeoutRef.current = setTimeout(() => {
      isUserEditingRef.current = false;
    }, 2000);

    const newQuantity = Math.max(0, localQuantity - 1);
    setLocalQuantity(newQuantity);
    setInputValue(newQuantity.toString());
    debouncedUpdate(newQuantity);
  };

  const handleDisabledFieldClick = () => {
    setShowOverrideDialog(true);
  };

  const handleOverrideConfirm = () => {
    if (quantityType === 'regular') {
      setOverrideNonFoil(true);
    } else {
      setOverrideFoil(true);
    }
    setShowOverrideDialog(false);
  };

  const handleOverrideCancel = () => {
    setShowOverrideDialog(false);
  };

  // Determine tooltip message
  const tooltipMessage = isDisabled
    ? hasError
      ? `This card doesn't come in ${quantityType === 'regular' ? 'non-foil' : 'foil'}. You can only reduce the quantity. (Click to override.)`
      : `This card doesn't come in ${quantityType === 'regular' ? 'non-foil' : 'foil'}. (Click to override.)`
    : '';

  return (
    <Box position="relative" display="inline-flex">
      <TableQuantityContainer
        className={hasError ? 'error' : ''}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            e.stopPropagation();
            handleDisabledFieldClick();
          }
        }}
        sx={{
          cursor: isDisabled ? 'pointer' : undefined,
        }}
      >
        <Box component="span" sx={{ display: 'inline-flex' }}>
          <TableLeftButton
            size="small"
            onMouseDown={(e) => {
              e.preventDefault();
              handleDecrement(e);
            }}
            disabled={localQuantity === 0}
            tabIndex={-1}
            disableFocusRipple
          >
            <RemoveIcon />
          </TableLeftButton>
        </Box>
        <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flex: 1,
            }}
          >
            <TableQuantityInput
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              onClick={(e) => {
                if (!isDisabled) {
                  (e.currentTarget.querySelector('input') as HTMLInputElement)?.select();
                }
              }}
              inputProps={{ min: 0 }}
              variant="outlined"
              size="small"
              disabled={isDisabled}
              error={hasError}
            />
            {isDisabled && (
              <Box
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDisabledFieldClick();
                }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  cursor: 'pointer',
                  zIndex: 1,
                }}
              />
            )}
          </Box>
        <Tooltip
          title={tooltipMessage}
          placement="top"
          disableHoverListener={!isDisabled}
          disableFocusListener={!isDisabled}
          disableTouchListener={!isDisabled}
        >
          <Box component="span" sx={{ display: 'inline-flex' }}>
            <TableRightButton
              size="small"
              onMouseDown={(e) => {
                e.preventDefault();
                if (isDisabled) {
                  handleDisabledFieldClick();
                } else {
                  handleIncrement(e);
                }
              }}
              tabIndex={-1}
              disableFocusRipple
              disabled={isDisabled}
              sx={{
                cursor: isDisabled ? 'pointer' : undefined,
              }}
            >
              <AddIcon />
            </TableRightButton>
          </Box>
        </Tooltip>
      </TableQuantityContainer>
      {isLoading && (
          <CircularProgress
            size={10}
            thickness={5}
            sx={{
              position: 'absolute',
              right: '-14px',
              top: '29%',
              transform: 'translateY(-25%)',
              color: 'primary.main',
            }}
          />
        )}
        {showSuccess && (
          <CheckCircleIcon
            sx={{
              position: 'absolute',
              right: '-14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.75rem',
              color: 'inherit',
            }}
          />
        )}

        <Dialog
          open={showOverrideDialog}
          onClose={handleOverrideCancel}
          aria-labelledby="override-dialog-title"
          aria-describedby="override-dialog-description"
        >
          <DialogTitle id="override-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon color="warning" />
            Enable {quantityType === 'regular' ? 'Non-Foil' : 'Foil'} Quantity?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="override-dialog-description" component="div">
              <Typography variant="body2" gutterBottom>
                According to our data, this card doesn&apos;t come in {quantityType === 'regular' ? 'non-foil' : 'foil'}{' '}
                finish.
              </Typography>
              <Typography variant="body2" gutterBottom>
                However, this data can sometimes be incorrect or incomplete. If you have this card in{' '}
                {quantityType === 'regular' ? 'non-foil' : 'foil'} finish, you can override this restriction.
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 2 }}>
                Would you like to enable this field anyway?
              </Typography>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleOverrideCancel} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleOverrideConfirm} variant="contained" color="primary" autoFocus>
              Enable Field
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export const useCardPreviewEffect = (cards: CardItemProps[]) => {
  // Refs for preview functionality
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const currentCardRef = useRef<string | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Initialize and handle tooltip system for the virtualized table
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const container = document.createElement('div');
    container.id = 'card-preview-container';
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.width = '299px';
    container.style.height = 'calc(299px * 1.393)';
    container.style.borderRadius = '5%';
    container.style.overflow = 'hidden';
    container.style.backgroundColor = '#1c2025';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    container.style.display = 'none';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    const loadingDiv = document.createElement('div');
    loadingDiv.style.position = 'absolute';
    loadingDiv.style.top = '0';
    loadingDiv.style.left = '0';
    loadingDiv.style.width = '100%';
    loadingDiv.style.height = '100%';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.justifyContent = 'center';
    loadingDiv.style.backgroundColor = '#1c2025';

    const spinner = document.createElement('div');
    spinner.style.width = '40px';
    spinner.style.height = '40px';
    spinner.style.border = '4px solid #f3f3f3';
    spinner.style.borderTop = '4px solid #3f51b5';
    spinner.style.borderRadius = '50%';

    const keyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    spinner.style.animation = 'spin 1s linear infinite';
    loadingDiv.appendChild(spinner);
    container.appendChild(loadingDiv);

    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.height = '100%';
    errorDiv.style.display = 'none';
    errorDiv.style.flexDirection = 'column';
    errorDiv.style.alignItems = 'center';
    errorDiv.style.justifyContent = 'center';
    errorDiv.style.backgroundColor = '#f9f9f9';
    errorDiv.style.borderRadius = '5%';

    const errorTitle = document.createElement('div');
    errorTitle.style.fontWeight = 'bold';
    errorTitle.style.fontSize = '16px';
    errorTitle.style.marginBottom = '8px';

    const errorMessage = document.createElement('div');
    errorMessage.textContent = 'Image not available';
    errorMessage.style.fontSize = '14px';
    errorMessage.style.opacity = '0.7';

    errorDiv.appendChild(errorTitle);
    errorDiv.appendChild(errorMessage);
    container.appendChild(errorDiv);

    const img = document.createElement('img');
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'none';

    img.onload = () => {
      img.style.display = 'block';
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'none';
    };

    img.onerror = () => {
      img.style.display = 'none';
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'flex';

      if (currentCardRef.current) {
        const card = cards.find((c) => c.id === currentCardRef.current);
        if (card) {
          errorTitle.textContent = card.name;
        }
      }
    };

    container.appendChild(img);

    hoverCardRef.current = container;
    previewImageRef.current = img;
    loadingRef.current = loadingDiv;
    errorRef.current = errorDiv;

    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isCardPreviewVisible = hoverCardRef.current && hoverCardRef.current.style.display !== 'none';
          if (isCardPreviewVisible) {
            const x = mousePositionRef.current.x + 50; // 50px to the right
            const y = mousePositionRef.current.y - 35; // 35px above

            hoverCardRef.current!.style.left = `${x}px`;
            hoverCardRef.current!.style.top = `${y}px`;
          }
          ticking = false;
        });

        ticking = true;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hoverCardRef.current) {
        document.body.removeChild(hoverCardRef.current);
        hoverCardRef.current = null;
      }
      document.head.removeChild(style);
    };
  }, [cards]);

  const showCardPreview = (card: CardItemProps) => {
    if (!hoverCardRef.current || !previewImageRef.current) return;

    const isDifferentCard = currentCardRef.current !== card.id;
    if (isDifferentCard) {
      currentCardRef.current = card.id;

      const borderRadius = card.setName === 'Limited Edition Alpha' ? '7%' : '5%';
      hoverCardRef.current.style.borderRadius = borderRadius;

      if (previewImageRef.current) {
        previewImageRef.current.style.display = 'none';
      }

      if (loadingRef.current) {
        loadingRef.current.style.display = 'flex';
      }

      if (errorRef.current) {
        errorRef.current.style.display = 'none';
      }

      hoverCardRef.current.style.display = 'block';

      const x = mousePositionRef.current.x + 50;
      const y = mousePositionRef.current.y - 35;
      hoverCardRef.current.style.left = `${x}px`;
      hoverCardRef.current.style.top = `${y}px`;

      previewImageRef.current.src = getCardImageUrl(card.id);
    } else if (hoverCardRef.current.style.display === 'none') {
      hoverCardRef.current.style.display = 'block';
    }
  };

  const hideCardPreview = () => {
    if (hoverCardRef.current) {
      hoverCardRef.current.style.display = 'none';
    }
  };

  return { showCardPreview, hideCardPreview };
};

// Card row renderer - this is what actually renders the cells for each card
export const useCardRowRenderer = (
  priceType: PriceType,
  displaySettings: CardTableRendererProps['displaySettings'],
  onCardClick?: (cardId: string, cardName?: string) => void,
  isOwnCollection?: boolean,
  goalId?: string,
  hasLocations?: boolean,
) => {
  const { showCardPreview, hideCardPreview } = useCardPreviewEffect([]);
  const pathname = usePathname();

  const renderCardRow = (index: number, card: CardItemProps) => {
    // Check if we're in a collection view and extract userId
    const collectionMatch = pathname?.match(/^\/collections\/(\d+)/);
    const userId = collectionMatch ? collectionMatch[1] : null;
    // Create a collection of cells based on visible columns
    const cells = [];

    // MTG CB Number Cell
    if (displaySettings.mtgcbNumberIsVisible) {
      cells.push(<TableCell key="mtgcbNumber">{card.mtgcbCollectorNumber || 'N/A'}</TableCell>);
    }

    // Card Name Cell (always shown)
    cells.push(
      <TableCell
        key="name"
        component="th"
        scope="row"
        onMouseEnter={() => showCardPreview(card)}
        onMouseLeave={hideCardPreview}
      >
        {userId ? (
          // In collection context, use onCardClick for proper routing
          <ClickableText
            onClick={(e) => {
              e.stopPropagation();
              if (onCardClick) {
                onCardClick(card.id, card.name);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            {card.name}
          </ClickableText>
        ) : (
          // In browse context, use direct link
          <Link
            href={`/browse/cards/${generateCardSlug(card.name)}/${card.id}`}
            style={{
              color: 'inherit',
              textDecoration: 'none',
            }}
            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking link
          >
            <ClickableText>{card.name}</ClickableText>
          </Link>
        )}
      </TableCell>,
    );

    // Quantity Cells
    if (displaySettings.quantityIsVisible) {
      if (isOwnCollection && (card.quantityReg !== undefined || card.quantityFoil !== undefined)) {
        // Use inline editable quantity components for own collection
        // Regular quantity cell
        cells.push(
          <TableCell
            key="quantityReg"
            sx={{
              padding: '4px',
              textAlign: 'center',
              verticalAlign: displaySettings.goalProgressIsVisible ? 'top' : 'middle',
            }}
          >
            {displaySettings.goalProgressIsVisible ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '48px' }}>
                <Box sx={{ mt: '5px' }}>
                  <InlineEditableQuantity
                    cardId={card.id}
                    cardName={card.name}
                    quantity={card.quantityReg || 0}
                    quantityType="regular"
                    otherQuantity={card.quantityFoil || 0}
                    canBeFoil={card.canBeFoil}
                    canBeNonFoil={card.canBeNonFoil}
                  />
                </Box>
                <GoalStatusTableCell card={card as any} goalType="regular" />
              </Box>
            ) : (
              <InlineEditableQuantity
                cardId={card.id}
                cardName={card.name}
                quantity={card.quantityReg || 0}
                quantityType="regular"
                otherQuantity={card.quantityFoil || 0}
                canBeFoil={card.canBeFoil}
                canBeNonFoil={card.canBeNonFoil}
              />
            )}
          </TableCell>,
        );

        // Foil quantity cell
        cells.push(
          <TableCell
            key="quantityFoil"
            sx={{
              padding: '4px',
              textAlign: 'center',
              verticalAlign: displaySettings.goalProgressIsVisible ? 'top' : 'middle',
            }}
          >
            {displaySettings.goalProgressIsVisible ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '48px' }}>
                <Box sx={{ mt: '5px' }}>
                  <InlineEditableQuantity
                    cardId={card.id}
                    cardName={card.name}
                    quantity={card.quantityFoil || 0}
                    quantityType="foil"
                    otherQuantity={card.quantityReg || 0}
                    canBeFoil={card.canBeFoil}
                    canBeNonFoil={card.canBeNonFoil}
                  />
                </Box>
                <GoalStatusTableCell card={card as any} goalType="foil" />
              </Box>
            ) : (
              <InlineEditableQuantity
                cardId={card.id}
                cardName={card.name}
                quantity={card.quantityFoil || 0}
                quantityType="foil"
                otherQuantity={card.quantityReg || 0}
                canBeFoil={card.canBeFoil}
                canBeNonFoil={card.canBeNonFoil}
              />
            )}
          </TableCell>,
        );
      } else {
        // Show read-only quantities for other collections
        cells.push(
          <TableCell
            key="quantityReg"
            sx={{ textAlign: 'center', verticalAlign: displaySettings.goalProgressIsVisible ? 'top' : 'middle' }}
          >
            {displaySettings.goalProgressIsVisible ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '48px' }}>
                <Box sx={{ mt: '5px' }}>{card.quantityReg !== undefined ? card.quantityReg : '-'}</Box>
                <GoalStatusTableCell card={card as any} goalType="regular" />
              </Box>
            ) : card.quantityReg !== undefined ? (
              card.quantityReg
            ) : (
              '-'
            )}
          </TableCell>,
        );
        cells.push(
          <TableCell
            key="quantityFoil"
            sx={{ textAlign: 'center', verticalAlign: displaySettings.goalProgressIsVisible ? 'top' : 'middle' }}
          >
            {displaySettings.goalProgressIsVisible ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '48px' }}>
                <Box sx={{ mt: '5px' }}>{card.quantityFoil !== undefined ? card.quantityFoil : '-'}</Box>
                <GoalStatusTableCell card={card as any} goalType="foil" />
              </Box>
            ) : card.quantityFoil !== undefined ? (
              card.quantityFoil
            ) : (
              '-'
            )}
          </TableCell>,
        );
      }
    }

    // Locations Cell - only render if column is visible AND user has locations
    // This must match the column filtering logic to prevent header/cell mismatch
    if (displaySettings.locationsIsVisible && (hasLocations ?? true)) {
      cells.push(
        <CardLocationTableCell
          key="locations"
          cardId={card.id}
          cardName={card.name}
          setName={card.setName}
          totalQuantityReg={card.quantityReg || 0}
          totalQuantityFoil={card.quantityFoil || 0}
          canBeFoil={card.canBeFoil}
          canBeNonFoil={card.canBeNonFoil}
          locations={card.locations}
          isOwnCollection={isOwnCollection}
          hasLocations={hasLocations}
        />,
      );
    }

    // Collector Number Cell
    if (displaySettings.collectorNumberIsVisible) {
      cells.push(<TableCell key="collectorNumber">{card.collectorNumber || 'N/A'}</TableCell>);
    }

    // Set Cell
    if (displaySettings.setIsVisible) {
      cells.push(
        <TableCell key="set">
          {card.setName && card.setSlug ? (
            <Link
              href={userId ? getCollectionSetUrl(userId, card.setSlug, goalId) : `/browse/sets/${card.setSlug}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
              }}
              onClick={(e) => e.stopPropagation()} // Prevent row click when clicking set link
            >
              <SetLinkText>{card.setName}</SetLinkText>
            </Link>
          ) : (
            card.setName || 'Unknown'
          )}
        </TableCell>,
      );
    }

    // Rarity Cell
    if (displaySettings.rarityIsVisible) {
      cells.push(<TableCell key="rarity">{formatRarity(card.rarity) || 'N/A'}</TableCell>);
    }

    // Type Cell
    if (displaySettings.typeIsVisible) {
      cells.push(<TableCell key="type">{card.type || 'N/A'}</TableCell>);
    }

    // Artist Cell
    if (displaySettings.artistIsVisible) {
      cells.push(<TableCell key="artist">{card.artist || 'N/A'}</TableCell>);
    }

    // Mana Cost Cell
    if (displaySettings.manaCostIsVisible) {
      cells.push(
        <TableCell
          key="manaCost"
          sx={{
            whiteSpace: 'nowrap',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            {formatManaSymbols(card.manaCost) || ''}
          </Box>
        </TableCell>,
      );
    }

    // Power Cell
    if (displaySettings.powerIsVisible) {
      cells.push(
        <TableCell key="power" sx={{ textAlign: 'center' }}>
          {formatNumeric(card.powerNumeric)}
        </TableCell>,
      );
    }

    // Toughness Cell
    if (displaySettings.toughnessIsVisible) {
      cells.push(
        <TableCell key="toughness" sx={{ textAlign: 'center' }}>
          {formatNumeric(card.toughnessNumeric)}
        </TableCell>,
      );
    }

    // Loyalty Cell
    if (displaySettings.loyaltyIsVisible) {
      cells.push(
        <TableCell key="loyalty" sx={{ textAlign: 'center' }}>
          {formatNumeric(card.loyaltyNumeric)}
        </TableCell>,
      );
    }

    // Price Cell
    if (displaySettings.priceIsVisible) {
      cells.push(
        <TableCell key="price" onClick={(e) => e.stopPropagation()}>
          <CardPrice
            prices={preparePriceData(card) || null}
            isLoading={false}
            priceType={priceType}
            centered={false}
            cardId={card.id}
            cardName={card.name}
            tcgplayerId={'tcgplayerId' in card ? card.tcgplayerId : undefined}
          />
        </TableCell>,
      );
    }

    return <>{cells}</>;
  };

  return renderCardRow;
};

// Utility Functions
function formatNumeric(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';

  const parsed = parseFloat(value);
  const isValidNumber = !isNaN(parsed);
  if (isValidNumber) {
    return Math.floor(parsed).toString();
  }
  return value;
}

function formatRarity(rarity: string | null | undefined): string {
  if (!rarity) return '';
  return rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();
}

/**
 * Format a card's prices into a standardized structure
 */
function preparePriceData(card: CardItemProps) {
  const hasPriceObject = card.prices?.normal || card.prices?.foil;
  if (hasPriceObject) {
    return card.prices;
  }

  return {
    normal: {
      market: card.market ? parseFloat(card.market as string) : null,
      low: card.low ? parseFloat(card.low as string) : null,
      average: card.average ? parseFloat(card.average as string) : null,
      high: card.high ? parseFloat(card.high as string) : null,
    },
    foil: card.foil
      ? {
          market: parseFloat(card.foil as string),
          low: null,
          average: null,
          high: null,
        }
      : null,
  };
}

/**
 * Format mana symbols for display
 */
function formatManaSymbols(manaCost: string | null | undefined): React.ReactNode {
  if (!manaCost) return null;

  // Regular expression to match mana symbols in the format {X}
  const symbolRegex = /\{([^}]+)\}/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Find all mana symbols and convert them to spans with appropriate classes
  while ((match = symbolRegex.exec(manaCost)) !== null) {
    const [fullMatch, symbol] = match;
    const startIndex = match.index;

    // Add any text before the current symbol
    if (startIndex > lastIndex) {
      parts.push(manaCost.substring(lastIndex, startIndex));
    }

    // Handle special cases with different class structures
    if (symbol.startsWith('H')) {
      // Half mana like {HW}
      const color = symbol.substring(1).toLowerCase();
      parts.push(
        <i
          key={`${symbol}-${startIndex}`}
          className={`ms ms-${color} ms-half ms-cost ms-1x`}
          style={{ margin: '1px' }}
          aria-label={`Half ${getSymbolName(color)}`}
        />,
      );
    } else if (symbol.toLowerCase().includes('/p')) {
      // Phyrexian mana like {W/P} or {C/P}
      const color = symbol.split('/')[0].toLowerCase();
      // Special case: {C/P} should use ms-h instead of ms-cp (which doesn't exist)
      const className = color === 'c' ? 'ms-h' : `ms-${color}p`;
      parts.push(
        <i
          key={`${symbol}-${startIndex}`}
          className={`ms ${className} ms-cost ms-1x`}
          style={{ margin: '1px' }}
          aria-label={getSymbolName(symbol)}
        />,
      );
    } else if (symbol.includes('/')) {
      // Hybrid mana like {W/U}
      // For hybrid, we use the format "ms-wu" for W/U hybrid
      const colors = symbol.toLowerCase().split('/').join('');
      parts.push(
        <i
          key={`${symbol}-${startIndex}`}
          className={`ms ms-${colors} ms-cost ms-1x`}
          style={{ margin: '1px' }}
          aria-label={getSymbolName(symbol)}
        />,
      );
    } else {
      // Regular mana symbol
      parts.push(
        <i
          key={`${symbol}-${startIndex}`}
          className={`ms ms-${symbol.toLowerCase()} ms-cost ms-1x`}
          style={{ margin: '1px' }}
          aria-label={getSymbolName(symbol)}
        />,
      );
    }

    lastIndex = startIndex + fullMatch.length;
  }

  // Add any remaining text
  if (lastIndex < manaCost.length) {
    parts.push(manaCost.substring(lastIndex));
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        maxWidth: '100%',
      }}
    >
      {parts}
    </span>
  );
}

/**
 * Gets a human-readable name for a mana symbol
 */
function getSymbolName(symbol: string): string {
  // Handle half mana symbols
  if (symbol.startsWith('H')) {
    const color = symbol.substring(1);
    return `Half ${getSymbolName(color)}`;
  }

  switch (symbol.toLowerCase()) {
    case 'w':
      return 'White Mana';
    case 'u':
      return 'Blue Mana';
    case 'b':
      return 'Black Mana';
    case 'r':
      return 'Red Mana';
    case 'g':
      return 'Green Mana';
    case 'c':
      return 'Colorless Mana';
    case 'x':
      return 'X Mana';
    case 't':
      return 'Tap Symbol';
    case 'q':
      return 'Untap Symbol';
    case 's':
      return 'Snow Mana';
    case 'e':
      return 'Energy Counter';
    case 'p':
      return 'Phyrexian Mana';
    case '∞':
    case 'infinity':
      return 'Infinity Mana';
    case '½':
    case '1/2':
      return 'Half Generic Mana';
    default:
      // For generic mana costs (numbers)
      if (/^\d+$/.test(symbol)) {
        return `${symbol} Generic Mana`;
      }
      // For Phyrexian mana like w/p or c/p
      if (symbol.includes('/p')) {
        const color = symbol.split('/')[0];
        return `Phyrexian ${getSymbolName(color)}`;
      }
      // For hybrid mana like w/u
      if (symbol.includes('/')) {
        const [color1, color2] = symbol.split('/');
        return `Hybrid ${getSymbolName(color1)}/${getSymbolName(color2)}`;
      }
      return symbol;
  }
}

// Styled components
const ClickableText = styled(Typography)(({ theme }) => ({
  fontWeight: 'medium',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const SetLinkText = styled(Typography)(({ theme }) => ({
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.primary.main,
  },
  cursor: 'pointer',
}));
