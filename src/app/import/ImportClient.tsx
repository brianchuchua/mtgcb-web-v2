'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Link,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useRef, useState } from 'react';
import { useGetImportFormatsQuery, useImportCollectionMutation } from '@/api/import/importApi';
import type { ImportError, ImportResult } from '@/api/import/types';
import { Link as NextLink } from '@/components/ui/link';

const InfoBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
  marginBottom: theme.spacing(2),
}));

// Notes for specific import formats
const IMPORT_FORMAT_NOTES: Record<string, string> = {
  tcgplayer_app:
    "TCGPlayer App exports files as .txt format. You'll need to rename the file extension from .txt to .csv before importing.",
  deckbox: "When exporting from Deckbox, make sure to select 'Scryfall ID' and 'TcgPlayer ID' as additional fields.",
  // Add more format notes here as needed
};

export const ImportClient: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState('mtgcb');
  const [updateMode, setUpdateMode] = useState<'replace' | 'merge'>('replace');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDryRun, setPendingDryRun] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: formats, isLoading: formatsLoading, error: formatsError } = useGetImportFormatsQuery();
  const [importCollection, { isLoading: importing }] = useImportCollectionMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImportClick = (dryRun = false) => {
    if (dryRun) {
      handleImport(true);
    } else {
      setPendingDryRun(false);
      setConfirmDialogOpen(true);
    }
  };

  const handleImport = async (dryRun = false) => {
    if (!selectedFile) return;

    setConfirmDialogOpen(false);

    try {
      const csvData = await selectedFile.text();
      const response = await importCollection({
        csvData,
        filename: selectedFile.name,
        query: {
          format: selectedFormat,
          updateMode,
          dryRun,
        },
      }).unwrap();

      if (response.data) {
        setImportResult(response.data);
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleDownloadTemplate = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL;
    window.location.href = `${apiBaseUrl}/collection/import/template?format=${selectedFormat}`;
  };

  const handleDownloadErrors = () => {
    if (!importResult?.errors || importResult.errors.length === 0) return;

    const csv = ['Row,Field,Value,Error Message'];
    importResult.errors.forEach((error: ImportError) => {
      csv.push(`${error.row},"${error.field}","${error.value}","${error.message}"`);
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import-errors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <Alert severity="error">Failed to load import formats. Please try again later.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Import Collection
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Import Format</FormLabel>
          <RadioGroup value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} sx={{ mt: 2 }}>
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

            {IMPORT_FORMAT_NOTES[currentFormat.id] && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Tips on this import format:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {IMPORT_FORMAT_NOTES[currentFormat.id]}
                </Typography>
              </Alert>
            )}

            <Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Required fields for import:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                {currentFormat.requiredFields.map((field) => (
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

              <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />} onClick={handleDownloadTemplate}>
                Download Example
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Update Mode</FormLabel>
                <RadioGroup
                  value={updateMode}
                  onChange={(e) => setUpdateMode(e.target.value as 'replace' | 'merge')}
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel
                    value="replace"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">Replace</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Set quantities to exact values in the CSV
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="merge"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">Add</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Add CSV quantities to existing collection
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select CSV File
                </Button>

                {selectedFile && (
                  <Typography variant="body2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </Typography>
                )}
              </Stack>

              {selectedFile && !importResult && (
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button variant="outlined" onClick={() => handleImportClick(true)} disabled={importing}>
                    Preview (Dry Run)
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleImportClick(false)}
                    disabled={importing}
                    startIcon={importing ? <CircularProgress size={20} /> : null}
                  >
                    {importing ? 'Importing...' : 'Import Collection'}
                  </Button>
                </Stack>
              )}

              {importResult && (
                <Box sx={{ mt: 4 }}>
                  <Alert
                    severity={
                      importResult.failedRows === 0 ? 'success' : importResult.partialSuccess ? 'warning' : 'error'
                    }
                    sx={{ mb: 3 }}
                  >
                    {importResult.failedRows === 0 ? (
                      <>Successfully imported all {importResult.totalRows} rows</>
                    ) : importResult.partialSuccess ? (
                      <>
                        Partially successful: {importResult.successfulRows} of {importResult.totalRows} rows imported
                      </>
                    ) : (
                      <>Import failed: All {importResult.totalRows} rows failed</>
                    )}
                  </Alert>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell align="right">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Rows</TableCell>
                          <TableCell align="right">{importResult.totalRows}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CheckCircleIcon color="success" fontSize="small" />
                              Successful
                            </Box>
                          </TableCell>
                          <TableCell align="right">{importResult.successfulRows}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <ErrorIcon color="error" fontSize="small" />
                              Failed
                            </Box>
                          </TableCell>
                          <TableCell align="right">{importResult.failedRows}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Created</TableCell>
                          <TableCell align="right">
                            <Chip label={importResult.created} size="small" color="success" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Updated</TableCell>
                          <TableCell align="right">
                            <Chip label={importResult.updated} size="small" color="primary" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Deleted</TableCell>
                          <TableCell align="right">
                            <Chip label={importResult.deleted} size="small" color="warning" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {importResult.errors.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Errors ({importResult.errors.length})</Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleDownloadErrors}
                          >
                            Download Errors
                          </Button>
                          <IconButton size="small" onClick={() => setShowErrors(!showErrors)}>
                            {showErrors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Stack>
                      </Box>

                      <Collapse in={showErrors}>
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, maxHeight: 400 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Row</TableCell>
                                <TableCell>Field</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell>Error</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {importResult.errors.map((error, index) => (
                                <TableRow key={index}>
                                  <TableCell>{error.row}</TableCell>
                                  <TableCell>{error.field}</TableCell>
                                  <TableCell>{error.value}</TableCell>
                                  <TableCell>{error.message}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Collapse>
                    </Box>
                  )}

                  <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelectedFile(null);
                        setImportResult(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      Import Another File
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontSize: '1.25rem',
            fontWeight: 500,
          }}
        >
          Confirm Import
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be reversed. If you haven't already,{' '}
            <NextLink href="/export">create an MTG CB export backup</NextLink> of your collection first.
          </Alert>

          <InfoBox>
            <Typography variant="body2" gutterBottom>
              <strong>File:</strong> {selectedFile?.name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Update Mode:</strong> {updateMode === 'replace' ? 'Replace' : 'Add'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Action:</strong>{' '}
              {updateMode === 'replace'
                ? 'Set card quantities to the exact values in the CSV file'
                : 'Add the CSV quantities to your existing collection quantities'}
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="warning.main">
              {updateMode === 'replace' ? (
                <>
                  <strong>Warning:</strong> Replace mode will completely override the quantities for all cards in the
                  CSV file with the new values. Cards not in the CSV will remain unchanged.
                </>
              ) : (
                <>
                  <strong>Warning:</strong> Add mode will add the CSV quantities to your existing collection quantities.
                  Cards not in the CSV will remain unchanged.
                </>
              )}
            </Typography>
          </InfoBox>

          <DialogContentText>Are you sure you want to proceed with this import?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="outlined" onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={() => handleImport(false)} autoFocus>
            Confirm Import
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
