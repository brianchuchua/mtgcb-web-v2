'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Collapse, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsFullArt, selectIsReserved, setIsFullArt, setIsReserved } from '@/redux/slices/browse';

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

/**
 * Tri-state boolean filter choice. `all` clears the filter (sends nothing to the
 * API), `only` matches `true`, `exclude` matches `false`.
 */
type TriState = 'all' | 'only' | 'exclude';

export const triStateToBoolean = (value: TriState): boolean | undefined =>
  value === 'all' ? undefined : value === 'only';

export const booleanToTriState = (value: boolean | undefined): TriState =>
  value === undefined ? 'all' : value ? 'only' : 'exclude';

/**
 * Binds one tri-state toggle to a Redux boolean field. Local state leads once the
 * user touches the control so that in-flight Redux updates can't clobber the click,
 * while an untouched control keeps mirroring Redux (URL restores, goal switches).
 */
function useTriStateFilter(
  reduxValue: boolean | undefined,
  setAction: (value: boolean | undefined) => { type: string },
  resetTrigger: number | undefined,
  onExpand: () => void,
) {
  const dispatch = useDispatch();
  const userModified = useRef(false);
  const [value, setValue] = useState<TriState>(() => booleanToTriState(reduxValue));

  useEffect(() => {
    if (reduxValue !== undefined && !userModified.current) {
      onExpand();
    }
  }, [reduxValue, onExpand]);

  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      userModified.current = false;
      setValue('all');
      dispatch(setAction(undefined));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger, dispatch]);

  useEffect(() => {
    if (!userModified.current) {
      setValue(booleanToTriState(reduxValue));
    }
  }, [reduxValue]);

  useEffect(() => {
    if (!userModified.current) return;
    dispatch(setAction(triStateToBoolean(value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dispatch]);

  const onChange = useCallback((next: TriState | null) => {
    if (!next) return;
    userModified.current = true;
    setValue(next);
  }, []);

  return { value, onChange };
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ resetTrigger }) => {
  const reduxIsReserved = useSelector(selectIsReserved);
  const reduxIsFullArt = useSelector(selectIsFullArt);
  const [mainExpanded, setMainExpanded] = useState(false);

  const expand = useCallback(() => setMainExpanded(true), []);

  const reserved = useTriStateFilter(reduxIsReserved, setIsReserved, resetTrigger, expand);
  const fullArt = useTriStateFilter(reduxIsFullArt, setIsFullArt, resetTrigger, expand);

  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      setMainExpanded(false);
    }
  }, [resetTrigger]);

  const hasActiveFilters = reduxIsReserved !== undefined || reduxIsFullArt !== undefined;

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
              value={reserved.value}
              exclusive
              onChange={(_, value) => reserved.onChange(value)}
              fullWidth
              size="small"
              aria-label="Reserved List filter"
            >
              <StyledToggleButton value="all">All cards</StyledToggleButton>
              <StyledToggleButton value="only">Reserved only</StyledToggleButton>
              <StyledToggleButton value="exclude">Exclude Reserved</StyledToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FilterLabel>Full Art</FilterLabel>
            <ToggleButtonGroup
              value={fullArt.value}
              exclusive
              onChange={(_, value) => fullArt.onChange(value)}
              fullWidth
              size="small"
              aria-label="Full Art filter"
            >
              <StyledToggleButton value="all">All cards</StyledToggleButton>
              <StyledToggleButton value="only">Full Art only</StyledToggleButton>
              <StyledToggleButton value="exclude">Exclude Full Art</StyledToggleButton>
            </ToggleButtonGroup>
          </Box>
        </ContentBox>
      </Collapse>
    </Box>
  );
};

export default AdvancedFilters;
