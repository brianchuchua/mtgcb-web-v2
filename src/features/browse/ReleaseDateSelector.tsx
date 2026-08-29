'use client';

import { Stack, TextField, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OutlinedBox from '@/components/ui/OutlinedBox';
import {
  RELEASE_DATE_FROM_PLACEHOLDER,
  RELEASE_DATE_TO_PLACEHOLDER,
  isUsableReleaseBound,
} from '@/features/browse/releaseDateBounds';
import { selectReleaseDate, setReleaseDate } from '@/redux/slices/browse';

const ReleaseDateSelector = () => {
  const dispatch = useDispatch();
  const reduxReleaseDate = useSelector(selectReleaseDate);

  const [localFrom, setLocalFrom] = useState(reduxReleaseDate?.from ?? '');
  const [localTo, setLocalTo] = useState(reduxReleaseDate?.to ?? '');

  // Follow the store when it changes underneath us — a URL navigation, a reset,
  // or a goal being loaded into the form.
  useEffect(() => {
    setLocalFrom(reduxReleaseDate?.from ?? '');
    setLocalTo(reduxReleaseDate?.to ?? '');
  }, [reduxReleaseDate?.from, reduxReleaseDate?.to]);

  const debouncedDispatch = useMemo(
    () =>
      debounce((from: string, to: string) => {
        dispatch(setReleaseDate({ from, to }));
      }, 400),
    [dispatch],
  );

  useEffect(() => () => debouncedDispatch.cancel(), [debouncedDispatch]);

  /**
   * A half-typed year ("20") would otherwise be sent as a bound and empty the
   * results while the user is still typing, so only complete bounds are
   * dispatched — and a bound being cleared always is.
   */
  const commit = (from: string, to: string) => {
    if (isUsableReleaseBound(from) && isUsableReleaseBound(to)) {
      debouncedDispatch(from.trim(), to.trim());
    }
  };

  const handleFromChange = (value: string) => {
    setLocalFrom(value);
    commit(value, localTo);
  };

  const handleToChange = (value: string) => {
    setLocalTo(value);
    commit(localFrom, value);
  };

  return (
    <OutlinedBox
      label={
        <Stack component="span" direction="row" alignItems="center" spacing={0.5}>
          <span>Release Date</span>
          <Tooltip
            title="Filter by when a printing was released. Enter a year (2019), a year and month (2019-07), or a full date (2019-07-12). Leave either box empty for an open-ended range."
            enterTouchDelay={0}
          >
            <InfoOutlinedIcon sx={{ fontSize: '1rem' }} />
          </Tooltip>
        </Stack>
      }
    >
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          placeholder={RELEASE_DATE_FROM_PLACEHOLDER}
          value={localFrom}
          onChange={(event) => handleFromChange(event.target.value)}
          error={!isUsableReleaseBound(localFrom)}
          data-testid="release-date-from"
          slotProps={{
            htmlInput: {
              'aria-label': 'From',
              maxLength: 10,
              autoComplete: 'off',
              spellCheck: 'false',
            },
          }}
        />
        <TextField
          fullWidth
          size="small"
          placeholder={RELEASE_DATE_TO_PLACEHOLDER}
          value={localTo}
          onChange={(event) => handleToChange(event.target.value)}
          error={!isUsableReleaseBound(localTo)}
          data-testid="release-date-to"
          slotProps={{
            htmlInput: {
              'aria-label': 'To',
              maxLength: 10,
              autoComplete: 'off',
              spellCheck: 'false',
            },
          }}
        />
      </Stack>
    </OutlinedBox>
  );
};

export default ReleaseDateSelector;
