/**
 * CSV Chunking Utility
 * Splits large CSV files into smaller chunks for sequential processing
 */

/**
 * Chunk size constant - adjust if needed for testing
 */
const CHUNK_SIZE = 1000;

/**
 * Represents a chunk of CSV data ready for import
 */
export interface CsvChunk {
  index: number; // 0-based chunk index
  totalChunks: number; // Total number of chunks
  csvData: string; // CSV string with header + data rows
  rowCount: number; // Number of data rows (excluding header)
  startRow: number; // First row number (1-indexed)
  endRow: number; // Last row number (1-indexed)
}

/**
 * Result of CSV chunking operation
 */
export interface ChunkResult {
  chunks: CsvChunk[];
  totalRows: number;
  header: string;
  warnings: string[];
}

/**
 * Split CSV into chunks
 *
 * Algorithm:
 * 1. Split by newlines
 * 2. Extract header (first non-empty line)
 * 3. Filter out empty lines
 * 4. Chunk data rows
 * 5. Prepend header to each chunk
 *
 * @param csvContent - Full CSV string
 * @returns ChunkResult with array of chunks
 */
export const splitCsvIntoChunks = (csvContent: string): ChunkResult => {
  // Normalize line endings
  const normalized = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines
  const allLines = normalized.split('\n');

  // Find header (first non-empty line)
  const headerIndex = allLines.findIndex((line) => line.trim().length > 0);

  if (headerIndex === -1) {
    return {
      chunks: [],
      totalRows: 0,
      header: '',
      warnings: ['CSV file is empty'],
    };
  }

  const header = allLines[headerIndex];

  // Get data rows and filter empty lines
  const dataRows = allLines.slice(headerIndex + 1).filter((line) => line.trim().length > 0);

  if (dataRows.length === 0) {
    return {
      chunks: [],
      totalRows: 0,
      header,
      warnings: ['CSV has no data rows (only header)'],
    };
  }

  // Create chunks
  const totalChunks = Math.ceil(dataRows.length / CHUNK_SIZE);
  const chunks: CsvChunk[] = [];

  for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
    const chunkDataRows = dataRows.slice(i, i + CHUNK_SIZE);
    const chunkCsvData = [header, ...chunkDataRows].join('\n');

    chunks.push({
      index: chunks.length,
      totalChunks,
      csvData: chunkCsvData,
      rowCount: chunkDataRows.length,
      startRow: i + 1,
      endRow: i + chunkDataRows.length,
    });
  }

  return {
    chunks,
    totalRows: dataRows.length,
    header,
    warnings: [],
  };
};
