'use client';

import { Paper, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { selectSearchName, setSearchName } from '@/redux/slices/browseSlice';

const BrowseSearchForm = () => {
  const dispatch = useDispatch();
  const name = useSelector(selectSearchName) || '';

  return (
    <FormWrapper>
      <Form>
        <TextField
          fullWidth
          label="Card Name"
          value={name}
          onChange={(e) => dispatch(setSearchName(e.target.value))}
          margin="normal"
          size="small"
        />
      </Form>
    </FormWrapper>
  );
};

const FormWrapper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(2),
}));

const Form = styled('form')({
  width: '100%',
});

export default BrowseSearchForm;