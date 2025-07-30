'use client';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useGetExportFormatsQuery } from '@/api/export/exportApi';

const MANDATORY_FIELDS = new Set(['id', 'quantity_regular', 'quantity_foil']);

// Explanations for why certain formats are not supported
const UNSUPPORTED_FORMAT_EXPLANATIONS: Record<string, string> = {
  tcgplayer_app:
    'The TCGPlayer App format cannot be supported for export. This is because the TCGPlayer App only has a textbox to manually copy/paste csv contents into, which has a very limited length and also fails silently a lot of the time. If this ever changes, feel free to let me know!',
  mtgstudio:
    "MTG Studio uses very different naming conventions for set codes and card names, and doesn't use any unique IDs to identify cards. After spending a lot of time trying to improve compatibility, there are still over 60,000 cards that would need manual fixes. With few users still on this legacy application, it's no longer feasible to maintain support. This is the tool I used before making MTG CB and I have a lot of respect for its legacy. If they ever add support for TCGPlayer IDs or Scryfall IDs, reach out to me.",
  urzagatherer:
    "While UrzaGatherer's import endpoint expects their proprietary .ugs file format, we've found experimentally that it accepts the ManaBox .csv format with a high success rate. You can try exporting in ManaBox format and importing that into UrzaGatherer.",
  // Add more format explanations here as needed
};

// Notes for supported formats that have limitations or important information
const SUPPORTED_FORMAT_NOTES: Record<string, string> = {
  archidekt:
    "Archidekt's site doesn't allow uploading more than about 40,000 rows at a time. Additionally, once your collection gets that big on their end, their export functionality may also stop working.",
  deckbox:
    "When importing many cards (40000+), Deckbox's site may appear to time out with an infinite spinner after about a minute. However, the import may have succeeded - simply refresh the page and your cards may be there.",
  manabox:
    "The ManaBox app can't handle CSV files with more than ~20,000 cards. You'll need to break up larger exports into multiple files to import them successfully. Note the export here includes many fields with no data on the MTG CB side -- the presence of the columns appears to make the ManaBox import work 10x faster.",
  // Add more format notes here as needed
};

export const ExportClient: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState('mtgcb');
  const [exporting, setExporting] = useState(false);
  const [useCustomFields, setUseCustomFields] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const { data: formats, isLoading: formatsLoading, error: formatsError } = useGetExportFormatsQuery();

  const handleExport = () => {
    setExporting(true);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (selectedFormat) {
      queryParams.append('format', selectedFormat);
    }

    // Add selected fields if using custom field selection
    if (useCustomFields) {
      // Always include mandatory fields
      MANDATORY_FIELDS.forEach((field) => {
        queryParams.append('fields', field);
      });

      // Add other selected fields
      selectedFields.forEach((field) => {
        if (!MANDATORY_FIELDS.has(field)) {
          // Avoid duplicating mandatory fields
          queryParams.append('fields', field);
        }
      });
    }

    // Use window.location.href to trigger browser's native download
    const apiBaseUrl = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL;
    window.location.href = `${apiBaseUrl}/collection/export?${queryParams.toString()}`;

    // Reset exporting state after a delay
    setTimeout(() => {
      setExporting(false);
    }, 3000);
  };

  const handleFieldToggle = (fieldName: string) => {
    // Don't allow toggling mandatory fields
    if (MANDATORY_FIELDS.has(fieldName)) return;

    const newSelectedFields = new Set(selectedFields);
    if (newSelectedFields.has(fieldName)) {
      newSelectedFields.delete(fieldName);
    } else {
      newSelectedFields.add(fieldName);
    }
    setSelectedFields(newSelectedFields);
  };

  const currentFormat = formats?.find((f) => f.id === selectedFormat);

  if (formatsLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (formatsError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load export formats. Please try again later.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Export Collection
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Export Format</FormLabel>
          <RadioGroup value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} sx={{ mt: 2 }}>
            {formats?.map((format) => (
              <FormControlLabel
                key={format.id}
                value={format.id}
                control={<Radio />}
                label={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">{format.name}</Typography>
                      {!format.supported && (
                        <Chip label="Unsupported" size="small" color="default" sx={{ height: 20 }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {format.description}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2 }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        {currentFormat && (
          <>
            <Divider sx={{ my: 3 }} />

            {!currentFormat.supported ? (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>This format is not currently supported.</strong>
                </Typography>
                {UNSUPPORTED_FORMAT_EXPLANATIONS[currentFormat.id] && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {UNSUPPORTED_FORMAT_EXPLANATIONS[currentFormat.id]}
                  </Typography>
                )}
              </Alert>
            ) : (
              <>
                {SUPPORTED_FORMAT_NOTES[currentFormat.id] && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Tips on this export format:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {SUPPORTED_FORMAT_NOTES[currentFormat.id]}
                    </Typography>
                  </Alert>
                )}
                <Box>
                  <Collapse in={!useCustomFields}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        The following default fields will be included in your export:
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {currentFormat.defaultFields.map((field) => (
                          <Typography
                            key={field.name}
                            variant="caption"
                            sx={{
                              px: 1,
                              py: 0.5,
                              bgcolor: 'action.selected',
                              borderRadius: 1,
                            }}
                          >
                            {field.header}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  </Collapse>

                  <Box sx={{ mt: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={useCustomFields}
                          onChange={(e) => {
                            setUseCustomFields(e.target.checked);
                            if (e.target.checked) {
                              // Pre-select default fields when enabling custom selection
                              const defaultFieldNames = currentFormat.defaultFields.map((f) => f.name);
                              setSelectedFields(new Set(defaultFieldNames));
                            } else {
                              // Clear selection when disabling custom selection
                              setSelectedFields(new Set());
                            }
                          }}
                        />
                      }
                      label="Customize fields to export"
                    />
                  </Box>

                  <Collapse in={useCustomFields}>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Select the fields you want to include in your export:
                      </Typography>

                      <FormGroup>
                        {currentFormat.availableFields.map((field) => (
                          <FormControlLabel
                            key={field.name}
                            control={
                              <Checkbox
                                checked={MANDATORY_FIELDS.has(field.name) ? true : selectedFields.has(field.name)}
                                onChange={() => handleFieldToggle(field.name)}
                                disabled={MANDATORY_FIELDS.has(field.name)}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2">
                                  {field.header}
                                  {MANDATORY_FIELDS.has(field.name) && (
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ ml: 1 }}
                                    >
                                      (Required)
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                            }
                          />
                        ))}
                      </FormGroup>

                      {selectedFields.size === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Only the required fields (ID, Quantity Regular, Quantity Foil) will be exported. Select
                          additional fields to include more data.
                        </Alert>
                      )}
                    </Box>
                  </Collapse>
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={exporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
                    onClick={handleExport}
                    disabled={!selectedFormat || exporting}
                  >
                    {exporting ? 'Exporting...' : 'Export Collection'}
                  </Button>
                </Box>
              </>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};
