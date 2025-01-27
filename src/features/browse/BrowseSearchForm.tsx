'use client';

import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, Paper, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSearchName, setSearchName } from '@/redux/slices/browseSlice';

const BrowseSearchForm = () => {
  const dispatch = useDispatch();
  const reduxName = useSelector(selectSearchName) || '';
  const [localName, setLocalName] = useState(reduxName);

  useEffect(() => {
    setLocalName(reduxName);
  }, [reduxName]);

  const debouncedDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setSearchName(value));
    }, 400),
    [dispatch],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalName(newValue);
    debouncedDispatch(newValue);
  };

  return (
    <FormWrapper>
      <Form>
        <TextField
          fullWidth
          label="Card Name"
          value={localName}
          onChange={handleChange}
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
