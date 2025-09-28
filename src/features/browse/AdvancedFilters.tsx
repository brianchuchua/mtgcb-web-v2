'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Collapse, FormControl, InputLabel, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsReserved, setIsReserved } from '@/redux/slices/browseSlice';

interface AdvancedFiltersProps {
  resetTrigger?: number;
}

const ClickableLabel = styled(Box)(({ theme }) => ({
  cursor: 'pointer',
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0),
  marginTop: theme.spacing(0),
  marginLeft: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  '&:hover': {
    color: theme.palette.primary.main,
    '& .MuiTypography-root': {
      textDecoration: 'underline',
    },
  },
}));

const ContentBox = styled(Box)(({ theme }) => ({
  border: '1px solid',
  borderColor: 'rgba(255, 255, 255, 0.23)',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const FilterLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
  textAlign: 'center',
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  fontSize: '0.8125rem',
  padding: theme.spacing(0.5, 1),
  textTransform: 'none',
  flex: 1,
}));

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ resetTrigger }) => {
  const dispatch = useDispatch();
  const reduxIsReserved = useSelector(selectIsReserved);
  const userModified = useRef(false);
  const [mainExpanded, setMainExpanded] = useState(false);
  const [isReservedFilter, setIsReservedFilter] = useState<'all' | 'reserved' | 'exclude'>(() => {
    if (reduxIsReserved === true) return 'reserved';
    if (reduxIsReserved === false) return 'exclude';
    return 'all';
  });

  // Expand automatically if there's an active filter
  useEffect(() => {
    if (reduxIsReserved !== undefined && !userModified.current) {
      setMainExpanded(true);
    }
  }, [reduxIsReserved]);

  // Reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      userModified.current = false;
      setIsReservedFilter('all');
      setMainExpanded(false);
      dispatch(setIsReserved(undefined));
    }
  }, [resetTrigger, dispatch]);

  // Sync with Redux state when it changes
  useEffect(() => {
    if (!userModified.current) {
      if (reduxIsReserved === true) {
        setIsReservedFilter('reserved');
      } else if (reduxIsReserved === false) {
        setIsReservedFilter('exclude');
      } else {
        setIsReservedFilter('all');
      }
    }
  }, [reduxIsReserved]);

  // Update Redux when local state changes
  useEffect(() => {
    if (!userModified.current) return;

    const newValue = isReservedFilter === 'all' ? undefined : isReservedFilter === 'reserved' ? true : false;
    dispatch(setIsReserved(newValue));
  }, [isReservedFilter, dispatch]);

  const handleIsReservedChange = (value: 'all' | 'reserved' | 'exclude' | null) => {
    if (!value) return;
    userModified.current = true;
    setIsReservedFilter(value);
  };

  const hasActiveFilters = reduxIsReserved !== undefined;

  return (
    <Box>
      <ClickableLabel onClick={() => setMainExpanded(!mainExpanded)}>
        <Typography variant="caption">Advanced Filters</Typography>
        {hasActiveFilters && (
          <Box
            component="span"
            sx={{
              width: 6,
              height: 6,
              ml: 0.4,
              mb: '1px',
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'inline-block',
            }}
          />
        )}
        {mainExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ClickableLabel>

      <Collapse in={mainExpanded}>
        <ContentBox>
          <Box>
            <FilterLabel>Reserved List</FilterLabel>
            <ToggleButtonGroup
              value={isReservedFilter}
              exclusive
              onChange={(_, value) => handleIsReservedChange(value)}
              fullWidth
              size="small"
            >
              <StyledToggleButton value="all">All cards</StyledToggleButton>
              <StyledToggleButton value="reserved">Reserved only</StyledToggleButton>
              <StyledToggleButton value="exclude">Exclude Reserved</StyledToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Future boolean filters can be added here following the same pattern:
              <Box sx={{ mt: 2 }}>
                <FilterLabel>Filter Name</FilterLabel>
                <ToggleButtonGroup...>
                  ...
                </ToggleButtonGroup>
              </Box>
          */}
        </ContentBox>
      </Collapse>
    </Box>
  );
};

export default AdvancedFilters;
