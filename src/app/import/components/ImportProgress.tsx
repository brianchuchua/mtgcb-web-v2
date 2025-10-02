import React from 'react';
import { Box, LinearProgress, Typography, Paper, Stack, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

interface ImportProgressProps {
  currentChunk: number;
  totalChunks: number;
  processedRows: number;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({
  currentChunk,
  totalChunks,
  processedRows,
  totalRows,
  successfulRows,
  failedRows,
}) => {
  const progressPercentage = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack spacing={2}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Importing... Chunk {currentChunk} of {totalChunks}
          </Typography>
          <Chip icon={<HourglassEmptyIcon />} label={`${progressPercentage}%`} color="primary" variant="outlined" />
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            height: 10,
            borderRadius: 1,
            backgroundColor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 1,
            },
          }}
        />

        {/* Stats */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {processedRows.toLocaleString()} / {totalRows.toLocaleString()} rows processed
          </Typography>

          <Stack direction="row" spacing={1}>
            {successfulRows > 0 && (
              <Chip
                icon={<CheckCircleIcon />}
                label={`${successfulRows.toLocaleString()} successful`}
                size="small"
                color="success"
                variant="outlined"
              />
            )}
            {failedRows > 0 && (
              <Chip
                icon={<ErrorIcon />}
                label={`${failedRows.toLocaleString()} failed`}
                size="small"
                color="error"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};
