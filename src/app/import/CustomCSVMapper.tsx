'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { usePreviewCSVMutation } from '@/api/import/importApi';

interface FieldMapping {
  csvHeader: string;
  mtgcbField: string;
}

interface Props {
  csvData: string;
  onMappingsChange: (mappings: FieldMapping[]) => void;
  onValidationChange: (isValid: boolean) => void;
  onError?: (hasError: boolean) => void;
}

const MTGCB_FIELDS = {
  identifiers: [
    { value: 'tcgplayerId', label: 'TCGPlayer ID', group: 'Identifiers' },
    { value: 'scryfallId', label: 'Scryfall ID', group: 'Identifiers' },
  ],
  cardInfo: [
    { value: 'cardName', label: 'Card Name', group: 'Card Info' },
    { value: 'setName', label: 'Set Name', group: 'Card Info' },
    { value: 'setCode', label: 'Set Code', group: 'Card Info' },
    { value: 'collectorNumber', label: 'Collector Number', group: 'Card Info' },
  ],
  quantities: [
    { value: 'quantity', label: 'Quantity', group: 'Quantities' },
    { value: 'isFoil', label: 'Is Foil', group: 'Quantities' },
  ],
};

const ALL_FIELDS = [...MTGCB_FIELDS.identifiers, ...MTGCB_FIELDS.cardInfo, ...MTGCB_FIELDS.quantities];

export const CustomCSVMapper: React.FC<Props> = ({ csvData, onMappingsChange, onValidationChange, onError }) => {
  const [previewCSV, { data: previewData, isLoading, error }] = usePreviewCSVMutation();
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [hasLoadedSuggestions, setHasLoadedSuggestions] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Reset state when CSV data changes (e.g., new file uploaded)
  useEffect(() => {
    setHasLoadedSuggestions(false);
    setMappings({});
  }, [csvData]);

  useEffect(() => {
    if (csvData) {
      previewCSV({ csvData, rowLimit: 5 });
    }
  }, [csvData, previewCSV]);

  useEffect(() => {
    if (onError) {
      onError(!!error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (previewData && !hasLoadedSuggestions) {
      // Apply suggested mappings
      const initialMappings: Record<string, string> = {};
      Object.entries(previewData.suggestedMappings).forEach(([header, suggestion]) => {
        initialMappings[header] = suggestion.field;
      });
      setMappings(initialMappings);
      setHasLoadedSuggestions(true);
    }
  }, [previewData, hasLoadedSuggestions]);

  useEffect(() => {
    const mappingsArray: FieldMapping[] = Object.entries(mappings)
      .filter(([_, mtgcbField]) => mtgcbField && mtgcbField !== '')
      .map(([csvHeader, mtgcbField]) => ({ csvHeader, mtgcbField }));

    onMappingsChange(mappingsArray);

    // Validate mappings
    const hasIdentifier = mappingsArray.some((m) => m.mtgcbField === 'tcgplayerId' || m.mtgcbField === 'scryfallId');
    const hasQuantity = mappingsArray.some((m) => m.mtgcbField === 'quantity');

    // If using card name, must have set info
    const hasCardName = mappingsArray.some((m) => m.mtgcbField === 'cardName');
    const hasSetInfo = mappingsArray.some((m) => m.mtgcbField === 'setName' || m.mtgcbField === 'setCode');

    const isValid = hasQuantity && (hasIdentifier || (hasCardName && hasSetInfo));
    onValidationChange(isValid);
  }, [mappings, onMappingsChange, onValidationChange]);

  const handleMappingChange = (csvHeader: string, mtgcbField: string) => {
    setMappings((prev) => ({
      ...prev,
      [csvHeader]: mtgcbField,
    }));
  };

  const getUsedFields = () => {
    return Object.values(mappings).filter((field) => field && field !== '');
  };

  const isFieldUsed = (field: string) => {
    return getUsedFields().includes(field);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    let errorMessage = 'Failed to preview CSV file. Please check that your file is properly formatted.';

    // Handle different error structures
    const errorData = (error as any)?.data;
    if (errorData) {
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.message) {
        // Handle {message, code} structure
        errorMessage =
          typeof errorData.message === 'string' ? errorData.message : errorData.message.message || errorMessage;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : errorData.error.message || errorMessage;
      }
    }

    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Error:</strong> {errorMessage}
        </Typography>
      </Alert>
    );
  }

  if (!previewData) {
    return null;
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" paragraph>
          <strong>Map your CSV columns to MTG CB fields.</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          For best accuracy, include a <strong>Scryfall ID</strong> or <strong>TCGPlayer ID</strong> column. Without
          these identifiers, the import will attempt to match cards by name and set and collector number, which may be
          less accurate.
        </Typography>
        <Typography variant="body2" paragraph>
          Required: At least one identifier (or Card Name + Set info) and a quantity field.
        </Typography>
        <Typography variant="body2">
          <strong>Foil column:</strong> The following values are recognized as foil (case-insensitive):{' '}
          <code>true</code>, <code>1</code>, <code>foil</code>, <code>yes</code>. All other values, including blank, are
          treated as non-foil.
        </Typography>
      </Alert>

      {isMobile ? (
        // Mobile view - Cards
        <Stack spacing={2}>
          {previewData.headers.map((header, index) => {
            const suggestion = previewData.suggestedMappings[header];
            const currentMapping = mappings[header] || '';

            return (
              <Card key={header} variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    {/* Header */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle2" fontWeight="bold">
                          {header}
                        </Typography>
                        {suggestion && currentMapping === suggestion.field && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Auto-detected"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>

                    {/* Sample values */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Sample values:
                      </Typography>
                      <Stack spacing={0.25}>
                        {previewData.sampleRows.slice(0, 3).map((row, rowIndex) => (
                          <Typography
                            key={rowIndex}
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: 'text.secondary',
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row[index] || '(empty)'}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>

                    {/* Mapping dropdown */}
                    <FormControl size="small" fullWidth variant="outlined">
                      {currentMapping !== '' && <InputLabel>Maps to</InputLabel>}
                      <Select
                        value={currentMapping}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        displayEmpty
                        label={currentMapping !== '' ? 'Maps to' : ''}
                      >
                        <MenuItem value="">
                          <em>Don't import</em>
                        </MenuItem>
                        {Object.entries(MTGCB_FIELDS).map(([groupKey, fields]) => [
                          <MenuItem key={`group-${groupKey}`} disabled>
                            <Typography variant="caption" color="text.secondary">
                              {fields[0].group}
                            </Typography>
                          </MenuItem>,
                          ...fields.map((field) => (
                            <MenuItem
                              key={field.value}
                              value={field.value}
                              disabled={isFieldUsed(field.value) && currentMapping !== field.value}
                            >
                              <Box sx={{ pl: 2 }}>
                                {field.label}
                                {isFieldUsed(field.value) && currentMapping !== field.value && (
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    (already mapped)
                                  </Typography>
                                )}
                              </Box>
                            </MenuItem>
                          )),
                        ])}
                      </Select>
                    </FormControl>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        // Desktop view - Table
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CSV Column</TableCell>
                <TableCell>Sample Values</TableCell>
                <TableCell>Maps To</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.headers.map((header, index) => {
                const suggestion = previewData.suggestedMappings[header];
                const currentMapping = mappings[header] || '';

                return (
                  <TableRow key={header}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">{header}</Typography>
                        {suggestion && currentMapping === suggestion.field && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Auto-detected"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        {previewData.sampleRows.slice(0, 3).map((row, rowIndex) => (
                          <Typography
                            key={rowIndex}
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: 'text.secondary',
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 300,
                            }}
                          >
                            {row[index] || '(empty)'}
                          </Typography>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={currentMapping}
                          onChange={(e) => handleMappingChange(header, e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Don't import</em>
                          </MenuItem>
                          {Object.entries(MTGCB_FIELDS).map(([groupKey, fields]) => [
                            <MenuItem key={`group-${groupKey}`} disabled>
                              <Typography variant="caption" color="text.secondary">
                                {fields[0].group}
                              </Typography>
                            </MenuItem>,
                            ...fields.map((field) => (
                              <MenuItem
                                key={field.value}
                                value={field.value}
                                disabled={isFieldUsed(field.value) && currentMapping !== field.value}
                              >
                                <Box sx={{ pl: 2 }}>
                                  {field.label}
                                  {isFieldUsed(field.value) && currentMapping !== field.value && (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                      (already mapped)
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            )),
                          ])}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <InfoIcon color="info" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            {Object.keys(mappings).filter((h) => mappings[h]).length} of {previewData.headers.length} columns mapped
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};
