'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import { Button, InputAdornment, Paper, Stack, TextField, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ColorSelector from '@/features/browse/ColorSelector';
import StatSearch from '@/features/browse/StatSearch';
import TypeSelector from '@/features/browse/TypeSelector';
import {
  resetSearch,
  selectOracleText,
  selectSearchName,
  setOracleText,
  setSearchName,
} from '@/redux/slices/browseSlice';

const BrowseSearchForm = () => {
  const dispatch = useDispatch();
  const reduxName = useSelector(selectSearchName) || '';
  const reduxOracleText = useSelector(selectOracleText) || '';

  const [localName, setLocalName] = useState(reduxName);
  const [localOracleText, setLocalOracleText] = useState(reduxOracleText);

  useEffect(() => {
    setLocalName(reduxName);
  }, [reduxName]);

  useEffect(() => {
    setLocalOracleText(reduxOracleText);
  }, [reduxOracleText]);

  const debouncedNameDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setSearchName(value));
    }, 300),
    [dispatch],
  );

  const debouncedOracleDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setOracleText(value));
    }, 300),
    [dispatch],
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalName(newValue);
    debouncedNameDispatch(newValue);
  };

  const handleOracleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalOracleText(newValue);
    debouncedOracleDispatch(newValue);
  };

  const handleResetSearch = () => {
    dispatch(resetSearch());
  };

  return (
    <FormWrapper>
      <Form sx={{ paddingTop: 0.5 }}>
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            label="Card Name"
            value={localName}
            onChange={handleNameChange}
            placeholder="Search by card name"
            margin="dense"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="disabled" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            label="Oracle Text"
            value={localOracleText}
            onChange={handleOracleChange}
            placeholder="Search card text"
            margin="dense"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title={<OracleTextTooltip />} placement="right">
                    <InfoOutlinedIcon color="disabled" sx={{ cursor: 'help' }} />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          <ColorSelector />
          <TypeSelector />
          <StatSearch />
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleResetSearch}
            sx={{ mt: 1 }}
          >
            Reset Search
          </Button>
        </Stack>
      </Form>
    </FormWrapper>
  );
};

const FormWrapper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(0),
  margin: theme.spacing(1),
}));

const Form = styled('form')({
  width: '100%',
});

const OracleTextTooltip = () => (
  <>
    <div>The following special symbols are supported:</div>
    <ul style={{ margin: '8px 0', paddingInlineStart: '20px' }}>
      <li>{`{T} – tap symbol`}</li>
      <li>{`{Q} – untap symbol`}</li>
      <li>{`{W} – white mana`}</li>
      <li>{`{U} – blue mana`}</li>
      <li>{`{B} – black mana`}</li>
      <li>{`{R} – red mana`}</li>
      <li>{`{G} – green mana`}</li>
      <li>{`{C} – colorless mana`}</li>
      <li>{`{X} – X generic mana`}</li>
      <li>{`{0} – zero mana`}</li>
      <li>{`{1} – one generic mana`}</li>
      <li>{`{2} – two generic mana`}</li>
      <li>{`{S} – snow mana`}</li>
      <li>{`{E} – energy symbol`}</li>
    </ul>
  </>
);

export default BrowseSearchForm;