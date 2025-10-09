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
 * Split CSV into logical lines, respecting quoted fields that span multiple lines
 *
 * This is critical for proper CSV chunking. Without quote-awareness, multi-line
 * fields (like Oracle Text with newlines) would be split across chunk boundaries,
 * causing parse errors.
 *
 * @param csvContent - Full CSV string
 * @returns Array of complete CSV records (logical lines)
 */
function splitCsvIntoLogicalLines(csvContent: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    // Handle quote characters
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote ("") - add both and skip next
        currentLine += '""';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        currentLine += char;
      }
    }
    // Handle newlines (only end line when NOT in quotes)
    else if (char === '\n' && !inQuotes) {
      // End of logical line
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
      }
      currentLine = '';
    }
    // Handle carriage returns
    else if (char === '\r') {
      // Skip carriage returns (we normalize to just \n)
      // But add to currentLine if we're in quotes
      if (inQuotes) {
        currentLine += char;
      }
    }
    // Regular characters
    else {
      currentLine += char;
    }
  }

  // Add final line if not empty
  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Split CSV into chunks
 *
 * Algorithm:
 * 1. Split into LOGICAL lines (respecting quotes)
 * 2. Extract header (first non-empty line)
 * 3. Filter out empty lines
 * 4. Chunk data rows
 * 5. Prepend header to each chunk
 *
 * @param csvContent - Full CSV string
 * @returns ChunkResult with array of chunks
 */
export const splitCsvIntoChunks = (csvContent: string): ChunkResult => {
  // Split into logical lines (quote-aware)
  const allLines = splitCsvIntoLogicalLines(csvContent);

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
