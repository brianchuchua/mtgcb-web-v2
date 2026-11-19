import React from 'react';
import { Box, LinearProgress, Typography, Paper, Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Tag } from '@/components/ui/Tag';

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
          <Tag tone="blue" icon={<HourglassEmptyIcon />}>{`${progressPercentage}%`}</Tag>
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
              <Tag tone="green" icon={<CheckIcon />}>{`${successfulRows.toLocaleString()} successful`}</Tag>
            )}
            {failedRows > 0 && (
              <Tag tone="red" icon={<ErrorOutlineIcon />}>{`${failedRows.toLocaleString()} failed`}</Tag>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};
