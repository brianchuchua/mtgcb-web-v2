'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Checkbox,
  FormGroup,
  Divider,
  Collapse,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useGetExportFormatsQuery } from '@/api/export/exportApi';

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
    if (useCustomFields && selectedFields.size > 0) {
      selectedFields.forEach(field => {
        queryParams.append('fields', field);
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
    const newSelectedFields = new Set(selectedFields);
    if (newSelectedFields.has(fieldName)) {
      newSelectedFields.delete(fieldName);
    } else {
      newSelectedFields.add(fieldName);
    }
    setSelectedFields(newSelectedFields);
  };

  const currentFormat = formats?.find(f => f.id === selectedFormat);

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
          <RadioGroup
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            sx={{ mt: 2 }}
          >
            {formats?.map((format) => (
              <FormControlLabel
                key={format.id}
                value={format.id}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">{format.name}</Typography>
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
                          const defaultFieldNames = currentFormat.defaultFields.map(f => f.name);
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
                            checked={selectedFields.has(field.name)}
                            onChange={() => handleFieldToggle(field.name)}
                          />
                        }
                        label={field.header}
                      />
                    ))}
                  </FormGroup>
                  
                  {selectedFields.size === 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Please select at least one field to export.
                    </Alert>
                  )}
                </Box>
              </Collapse>
            </Box>
          </>
        )}

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={exporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
            onClick={handleExport}
            disabled={!selectedFormat || exporting || (useCustomFields && selectedFields.size === 0)}
          >
            {exporting ? 'Exporting...' : 'Export Collection'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};