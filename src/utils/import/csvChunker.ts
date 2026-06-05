/**
 * CSV Chunking Utility
 * Splits large CSV files into smaller chunks for sequential processing.
 *
 * IMPORTANT: All rows belonging to the same physical card (e.g. a foil row and
 * a non-foil row of the same printing) are kept together in the same chunk.
 * The server consolidates a card's quantities only within a single import call;
 * in `replace` mode each call overwrites the card's row entirely. If a card's
 * finishes were split across two chunks (two separate HTTP calls), the later
 * chunk would overwrite the earlier one and silently drop a finish. Grouping by
 * card before chunking guarantees a card is never split across calls.
 */

/**
 * Chunk size constant - adjust if needed for testing
 */
const CHUNK_SIZE = 500;

/**
 * Represents a chunk of CSV data ready for import
 */
export interface CsvChunk {
  index: number; // 0-based chunk index
  totalChunks: number; // Total number of chunks
  csvData: string; // CSV string with header + data rows
  rowCount: number; // Number of data rows (excluding header)
  startRow: number; // Lowest original (file) row number in this chunk (1-indexed)
  endRow: number; // Highest original (file) row number in this chunk (1-indexed)
  // Original 1-indexed file row numbers for each data row in this chunk, in the
  // order the rows appear in csvData. Used to map chunk-relative error rows back
  // to the user's file after grouping reorders rows.
  originalRowNumbers: number[];
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
 * Parse a single CSV record into its fields (quote-aware).
 *
 * Every supported import format uses a comma delimiter, so this assumes ','.
 */
function parseCsvFields(record: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < record.length; i++) {
    const char = record[i];
    const nextChar = record[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);

  return fields;
}

/**
 * Per-format card identity.
 *
 * Rows are grouped into chunks by CARD IDENTITY so a card's finishes (foil /
 * non-foil / etched) never split across separate import calls. The grouping key
 * is the same information the API uses to resolve a CSV row to a card: a
 * resolving id when present (Scryfall id, TCGplayer/Product id, MTG CB id),
 * otherwise name + set + collector number.
 *
 * This is an allow-list (declared identity), not a deny-list of "volatile"
 * columns, and that is deliberate. A card's two finishes resolve to the SAME
 * card, so they always share these values and always co-locate. If the identity
 * is ever too loose, two DISTINCT cards merely ride in the same chunk — harmless,
 * because the server still writes them as separate rows keyed by resolved
 * cardId. The deny-list's failure mode (a per-copy column sneaking into the key)
 * silently reintroduces the split-finish bug; this approach cannot.
 *
 * DUPLICATION (intentional): this mirrors the API import schemas
 * (mtgcb-api-v3/src/features/import/formats/<format>.ts -> resolution.idFields +
 * manualResolutionFields). There is no shared source of truth. If you add an
 * import format, or change a format's id / name / set / collector columns, you
 * MUST update this map too. See the note in CLAUDE.md in both repos.
 */
export interface FormatIdentity {
  // Resolving id column header(s), in priority order. The first one present
  // (non-empty) on a row identifies that row's card.
  idHeaders: string[];
  // Fallback identity columns, used only when no id header has a value.
  nameHeader?: string;
  setHeaders?: string[];
  collectorHeader?: string;
}

const FORMAT_IDENTITY: Record<string, FormatIdentity> = {
  manabox: { idHeaders: ['Scryfall ID'], nameHeader: 'Name', setHeaders: ['Set code'], collectorHeader: 'Collector number' },
  tcgplayer_app: { idHeaders: ['Product ID'], nameHeader: 'Name', setHeaders: ['Set Code'], collectorHeader: 'Card Number' },
  archidekt: { idHeaders: ['Scryfall ID'], nameHeader: 'Name', setHeaders: ['Edition Code'], collectorHeader: 'Collector Number' },
  deckbox: { idHeaders: ['TcgPlayer ID', 'Scryfall ID'], nameHeader: 'Name', setHeaders: ['Edition Code'], collectorHeader: 'Card Number' },
  mtggoldfish: { idHeaders: ['Scryfall ID'], nameHeader: 'Card', setHeaders: ['Set Name'], collectorHeader: 'Collector Number' },
  helvault: { idHeaders: ['scryfall_id'], nameHeader: 'name' },
  mtgdelver: { idHeaders: ['Scryfall Id', 'TCGplayer ProductId'], nameHeader: 'Card Name', setHeaders: ['Set Code'], collectorHeader: 'Number' },
  moxfield: { idHeaders: [], nameHeader: 'Name', setHeaders: ['Edition'], collectorHeader: 'Collector Number' },
  mtgcb: { idHeaders: ['MTG CB ID'], nameHeader: 'Card', setHeaders: ['Set'], collectorHeader: 'Collector Number' },
  mtgstudio: { idHeaders: [], nameHeader: 'Name', setHeaders: ['Edition'] },
  urzagatherer: { idHeaders: [], nameHeader: 'Name', setHeaders: ['Set'] },
};

export interface CsvFieldMapping {
  csvHeader: string;
  mtgcbField: string;
}

// Derive identity for the user-mapped "custom" format from its field mappings,
// mirroring the API's generateCustomSchema (id fields tcgplayerId / scryfallId,
// manual fields cardName / setCode / setName / collectorNumber).
function customIdentity(fieldMappings: CsvFieldMapping[] | undefined): FormatIdentity | null {
  if (!fieldMappings || fieldMappings.length === 0) return null;
  const headerFor = (field: string): string | undefined =>
    fieldMappings.find((m) => m.mtgcbField === field)?.csvHeader;

  const idHeaders = ['tcgplayerId', 'scryfallId']
    .map(headerFor)
    .filter((h): h is string => !!h);
  const setHeaders = ['setCode', 'setName']
    .map(headerFor)
    .filter((h): h is string => !!h);
  const identity: FormatIdentity = {
    idHeaders,
    nameHeader: headerFor('cardName'),
    setHeaders,
    collectorHeader: headerFor('collectorNumber'),
  };

  const hasAny =
    identity.idHeaders.length > 0 ||
    !!identity.nameHeader ||
    (identity.setHeaders?.length ?? 0) > 0 ||
    !!identity.collectorHeader;
  return hasAny ? identity : null;
}

function getFormatIdentity(format: string | undefined, fieldMappings?: CsvFieldMapping[]): FormatIdentity | null {
  if (!format) return null;
  if (format === 'custom') return customIdentity(fieldMappings);
  return FORMAT_IDENTITY[format] ?? null;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Build the grouping key for a data row from its card identity. Rows sharing a
 * key are the same card and must travel in the same chunk.
 *
 * Returns null when no identity can be derived for the row (all identity columns
 * blank/absent); the caller then puts the row in its own group so it is never
 * merged with anything else.
 */
function buildIdentityKey(
  fields: string[],
  columnIndex: Map<string, number>,
  identity: FormatIdentity,
): string | null {
  const valueOf = (header: string | undefined): string => {
    if (!header) return '';
    const idx = columnIndex.get(normalizeHeader(header));
    if (idx === undefined) return '';
    return (fields[idx] ?? '').trim();
  };

  // Prefer a resolving id (unique per printing, identical across finishes).
  for (const header of identity.idHeaders) {
    const v = valueOf(header);
    if (v) return `${normalizeHeader(header)}=${v.toLowerCase()}`;
  }

  // Fall back to name + set + collector, the same disambiguation the API uses.
  const parts = [
    valueOf(identity.nameHeader),
    ...(identity.setHeaders ?? []).map(valueOf),
    valueOf(identity.collectorHeader),
  ].map((p) => p.toLowerCase());

  return parts.some((p) => p.length > 0) ? `nsc:${parts.join('|')}` : null;
}

/**
 * Split CSV into chunks
 *
 * Algorithm:
 * 1. Split into LOGICAL lines (respecting quotes)
 * 2. Extract header (first non-empty line)
 * 3. Filter out empty lines
 * 4. Group data rows by card identity (so finishes never split across chunks)
 * 5. Pack whole groups into chunks of up to CHUNK_SIZE rows
 * 6. Prepend header to each chunk
 *
 * @param csvContent - Full CSV string
 * @param format - Import format id; selects the card-identity columns to group by
 * @param fieldMappings - Column mappings for the "custom" format
 * @returns ChunkResult with array of chunks
 */
export const splitCsvIntoChunks = (
  csvContent: string,
  format?: string,
  fieldMappings?: CsvFieldMapping[],
): ChunkResult => {
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

  const warnings: string[] = [];

  // Resolve the card-identity columns for this format and index each CSV header
  // to its column position. When the format is unknown we fall back to
  // file-order chunking (status quo) and warn — without knowing a card's
  // identity we can't guarantee its finishes co-locate.
  const identity = getFormatIdentity(format, fieldMappings);
  const columnIndex = new Map<string, number>();
  parseCsvFields(header).forEach((h, idx) => {
    const norm = normalizeHeader(h);
    if (!columnIndex.has(norm)) columnIndex.set(norm, idx);
  });
  if (!identity) {
    warnings.push(
      `Unknown import format '${format ?? ''}'; using file-order chunking. A card whose rows span a chunk boundary may drop a finish.`,
    );
  }

  // Group data rows by card identity, preserving first-seen order of both the
  // groups and the rows within each group. Track original 1-indexed row numbers
  // so error reporting can map back to the user's file after reordering.
  interface RowEntry {
    line: string;
    originalRowNumber: number;
  }
  const groups = new Map<string, RowEntry[]>();
  dataRows.forEach((line, i) => {
    // With a known identity, group by card; otherwise keep file order (each row
    // its own group => packs into file-order chunks, i.e. the original behavior).
    const key = identity
      ? buildIdentityKey(parseCsvFields(line), columnIndex, identity) ?? `__raw__:${line}`
      : `__row__:${i}`;
    const entry: RowEntry = { line, originalRowNumber: i + 1 };
    const existing = groups.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  });

  // Pack whole groups into chunks of up to CHUNK_SIZE rows. A group is never
  // split across chunks. A single group larger than CHUNK_SIZE (not expected in
  // practice — a card would need 500+ finish rows) gets its own oversized chunk.
  const packed: RowEntry[][] = [];
  let current: RowEntry[] = [];
  for (const group of groups.values()) {
    if (group.length > CHUNK_SIZE) {
      if (current.length > 0) {
        packed.push(current);
        current = [];
      }
      packed.push(group);
      warnings.push(
        `A single card has ${group.length} rows, exceeding the ${CHUNK_SIZE}-row chunk size; it was sent as one oversized chunk.`,
      );
      continue;
    }
    if (current.length > 0 && current.length + group.length > CHUNK_SIZE) {
      packed.push(current);
      current = [];
    }
    current.push(...group);
  }
  if (current.length > 0) {
    packed.push(current);
  }

  const totalChunks = packed.length;
  const chunks: CsvChunk[] = packed.map((entries, index) => {
    const originalRowNumbers = entries.map((e) => e.originalRowNumber);
    return {
      index,
      totalChunks,
      csvData: [header, ...entries.map((e) => e.line)].join('\n'),
      rowCount: entries.length,
      startRow: Math.min(...originalRowNumbers),
      endRow: Math.max(...originalRowNumbers),
      originalRowNumbers,
    };
  });

  return {
    chunks,
    totalRows: dataRows.length,
    header,
    warnings,
  };
};
