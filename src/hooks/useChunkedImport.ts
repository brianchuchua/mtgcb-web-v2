import { useState, useCallback } from 'react';
import { ImportResult, ImportError } from '@/api/import/types';
import { splitCsvIntoChunks, CsvChunk } from '@/utils/import/csvChunker';

/**
 * Progress state for chunked import
 */
export interface ChunkedImportProgress {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  currentChunk: number;
  totalChunks: number;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errors: ImportError[];
  created: number;
  updated: number;
  deleted: number;
}

/**
 * Hook for managing chunked imports
 *
 * @param importMutation - RTK Query mutation from useImportCollectionMutation
 * @returns State and control functions
 */
export const useChunkedImport = (importMutation: any) => {
  const [progress, setProgress] = useState<ChunkedImportProgress>({
    status: 'idle',
    currentChunk: 0,
    totalChunks: 0,
    totalRows: 0,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
    errors: [],
    created: 0,
    updated: 0,
    deleted: 0,
  });

  const [isImporting, setIsImporting] = useState(false);

  /**
   * Process all chunks sequentially
   */
  const processChunks = useCallback(
    async (
      chunks: CsvChunk[],
      importParams: {
        filename: string;
        fieldMappings?: Array<{
          csvHeader: string;
          mtgcbField: string;
        }>;
        query: {
          format: string;
          updateMode: 'replace' | 'merge';
          dryRun: boolean;
        };
      }
    ): Promise<ChunkedImportProgress> => {
      setIsImporting(true);

      // Initialize progress
      const totalRows = chunks.reduce((sum, chunk) => sum + chunk.rowCount, 0);
      let currentProgress: ChunkedImportProgress = {
        status: 'processing',
        currentChunk: 0,
        totalChunks: chunks.length,
        totalRows,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
        errors: [],
        created: 0,
        updated: 0,
        deleted: 0,
      };

      setProgress(currentProgress);

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Update current chunk
        currentProgress = {
          ...currentProgress,
          currentChunk: i + 1,
        };
        setProgress(currentProgress);

        try {
          // Call import API for this chunk
          const response = await importMutation({
            csvData: chunk.csvData,
            filename: importParams.filename,
            fieldMappings: importParams.fieldMappings,
            query: importParams.query,
          }).unwrap();

          const result: ImportResult = response.data;

          // Aggregate results
          currentProgress = {
            ...currentProgress,
            processedRows: currentProgress.processedRows + chunk.rowCount,
            successfulRows: currentProgress.successfulRows + result.successfulRows,
            failedRows: currentProgress.failedRows + result.failedRows,
            created: currentProgress.created + result.created,
            updated: currentProgress.updated + result.updated,
            deleted: currentProgress.deleted + result.deleted,
            errors: [
              ...currentProgress.errors,
              // Adjust row numbers to be global, not chunk-relative
              ...result.errors.map((err) => ({
                ...err,
                row: err.row + chunk.startRow - 1,
              })),
            ],
          };

          setProgress(currentProgress);
        } catch (error) {
          console.error(`Chunk ${i + 1} failed:`, error);

          // Mark all rows in this chunk as failed
          currentProgress = {
            ...currentProgress,
            processedRows: currentProgress.processedRows + chunk.rowCount,
            failedRows: currentProgress.failedRows + chunk.rowCount,
            errors: [
              ...currentProgress.errors,
              {
                row: chunk.startRow,
                field: 'chunk',
                value: `Chunk ${i + 1}`,
                message: `Chunk failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
          };

          setProgress(currentProgress);

          // Continue to next chunk (don't stop on error)
        }
      }

      // Mark as completed
      currentProgress = {
        ...currentProgress,
        status: currentProgress.failedRows === 0 ? 'completed' : currentProgress.successfulRows > 0 ? 'completed' : 'failed',
      };

      setProgress(currentProgress);
      setIsImporting(false);

      return currentProgress;
    },
    [importMutation]
  );

  /**
   * Main import function
   */
  const runChunkedImport = useCallback(
    async (
      csvContent: string,
      importParams: {
        filename: string;
        fieldMappings?: Array<{
          csvHeader: string;
          mtgcbField: string;
        }>;
        query: {
          format: string;
          updateMode: 'replace' | 'merge';
          dryRun: boolean;
        };
      }
    ) => {
      // Split CSV into chunks
      const chunkResult = splitCsvIntoChunks(csvContent);

      if (chunkResult.warnings.length > 0) {
        console.warn('CSV chunking warnings:', chunkResult.warnings);
      }

      if (chunkResult.chunks.length === 0) {
        throw new Error('No data to import');
      }

      // Process chunks
      return await processChunks(chunkResult.chunks, importParams);
    },
    [processChunks]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setProgress({
      status: 'idle',
      currentChunk: 0,
      totalChunks: 0,
      totalRows: 0,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [],
      created: 0,
      updated: 0,
      deleted: 0,
    });
    setIsImporting(false);
  }, []);

  return {
    progress,
    isImporting,
    runChunkedImport,
    reset,
  };
};
