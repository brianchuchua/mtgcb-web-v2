import React from 'react';
import { TextField, InputAdornment, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OracleTextTooltip from './OracleTextTooltip';

interface OracleTextFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const OracleTextField: React.FC<OracleTextFieldProps> = ({ value, onChange }) => {
  return (
    <TextField
      fullWidth
      label="Oracle Text"
      value={value}
      onChange={onChange}
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
  );
};

export default OracleTextField;