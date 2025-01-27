'use client';

import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, Paper, Stack, TextField, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
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
    }, 400),
    [dispatch],
  );

  const debouncedOracleDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setOracleText(value));
    }, 400),
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

  return (
    <FormWrapper>
      <Form>
        <Stack spacing={1}>
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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Tooltip
                      title={<OracleTextTooltip />}
                      placement="right"
                      sx={{
                        '& .MuiTooltip-tooltip': {
                          maxWidth: '400px',
                          fontSize: '0.875rem',
                        },
                      }}
                    >
                      <InfoOutlinedIcon color="disabled" style={{ cursor: 'help' }} />
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
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

export default BrowseSearchForm;

const OracleTextTooltip = () => (
  <>
    <div>
      You can search for exact matches within quotes:
      <br />
      Ex. "loses the game"
      <br />
      <br />
      The following special symbols are also supported:
    </div>

    <ul style={{ margin: '8px 0', paddingInlineStart: '20px' }}>
      <li>
        {`{T} – tap symbol`} <i className="ms ms-tap" />
      </li>
      <li>
        {`{Q} – untap symbol`} <i className="ms ms-untap" />
      </li>
      <li>
        {`{W} – white mana`} <i className="ms ms-w ms-cost" />
      </li>
      <li>
        {`{U} – blue mana`} <i className="ms ms-u ms-cost" />
      </li>
      <li>
        {`{B} – black mana`} <i className="ms ms-b ms-cost" />
      </li>
      <li>
        {`{R} – red mana`} <i className="ms ms-r ms-cost" />
      </li>
      <li>
        {`{G} – green mana`} <i className="ms ms-g ms-cost" />
      </li>
      <li>
        {`{C} – colorless mana`} <i className="ms ms-c ms-cost" />
      </li>
      <li>
        {`{X} – X generic mana`} <i className="ms ms-x ms-cost" />
      </li>
      <li>
        {`{0} – zero mana`} <i className="ms ms-0 ms-cost" />
      </li>
      <li>
        {`{1} – one generic mana`} <i className="ms ms-1 ms-cost" />
      </li>
      <li>
        {`{2} – two generic mana`} <i className="ms ms-2 ms-cost" />
      </li>
      <li>
        {`{3} – three generic mana (and so on)`} <i className="ms ms-3 ms-cost" />
      </li>
      <li>
        {`{W/U} – white or blue mana`} <i className="ms ms-wu ms-cost" />
      </li>
      <li>
        {`{W/B} – white or black mana`} <i className="ms ms-wb ms-cost" />
      </li>
      <li>
        {`{B/R} – black or red mana`} <i className="ms ms-br ms-cost" />
      </li>
      <li>
        {`{B/G} – black or green mana`} <i className="ms ms-bg ms-cost" />
      </li>
      <li>
        {`{U/B} – blue or black mana`} <i className="ms ms-ub ms-cost" />
      </li>
      <li>
        {`{U/R} – blue or red mana`} <i className="ms ms-ur ms-cost" />
      </li>
      <li>
        {`{R/G} – red or green mana`} <i className="ms ms-rg ms-cost" />
      </li>
      <li>
        {`{R/W} – red or white mana`} <i className="ms ms-rw ms-cost" />
      </li>
      <li>
        {`{G/W} – green or white mana`} <i className="ms ms-gw ms-cost" />
      </li>
      <li>
        {`{G/U} – green or blue mana`} <i className="ms ms-gu ms-cost" />
      </li>
      <li>
        {`{2/W} – two generic mana or white mana`} <i className="ms ms-2w ms-cost" />
      </li>
      <li>
        {`{2/U} – two generic mana or blue mana`} <i className="ms ms-2u ms-cost" />
      </li>
      <li>
        {`{2/B} – two generic mana or black mana`} <i className="ms ms-2b ms-cost" />
      </li>
      <li>
        {`{2/R} – two generic mana or red mana`} <i className="ms ms-2r ms-cost" />
      </li>
      <li>
        {`{2/G} – two generic mana or green mana`} <i className="ms ms-2g ms-cost" />
      </li>
      <li>
        {`{W/P} – white mana or two life`} <i className="ms ms-p ms-w ms-cost" />
      </li>
      <li>
        {`{U/P} – blue mana or two life`} <i className="ms ms-p ms-u ms-cost" />
      </li>
      <li>
        {`{B/P} – black mana or two life`} <i className="ms ms-p ms-b ms-cost" />
      </li>
      <li>
        {`{R/P} – red mana or two life`} <i className="ms ms-p ms-r ms-cost" />
      </li>
      <li>
        {`{G/P} – green mana or two life`} <i className="ms ms-p ms-g ms-cost" />
      </li>
      <li>
        {`{S} – snow mana`} <i className="ms ms-s ms-cost" />
      </li>
      <li>
        {`{E} – energy symbol`} <i className="ms ms-e" />
      </li>
      <li>
        {`{CHAOS} – chaos symbol`} <i className="ms ms-chaos" />
      </li>
    </ul>
  </>
);
