import { splitCsvIntoChunks } from './csvChunker';

// ---- helpers ----------------------------------------------------------------

const MANABOX_HEADER =
  'Binder Name,Binder Type,Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Condition,Language,Purchase price currency,Added';

function manaboxRow(o: {
  scry: string;
  finish?: string;
  name?: string;
  binder?: string;
  collector?: string;
  setCode?: string;
}): string {
  const c = {
    binder: 'Main',
    name: 'Card',
    setCode: 'ABC',
    collector: '1',
    finish: 'normal',
    ...o,
  };
  // Order must match MANABOX_HEADER.
  return [
    c.binder, 'binder', c.name, c.setCode, 'Set Name', c.collector, c.finish,
    'common', '1', '999', c.scry, '0.10', 'false', 'false', 'near_mint', 'en', 'EUR', '2026-01-01T00:00:00Z',
  ].join(',');
}

function fillerRows(n: number, prefix: string): string[] {
  return Array.from({ length: n }, (_, i) =>
    manaboxRow({ scry: `${prefix}-fill-${i}`, name: `Filler ${i}`, collector: String(i) }),
  );
}

function dataLinesOf(csvData: string): string[] {
  return csvData.split('\n').slice(1); // drop header
}

/** Number of chunks whose payload contains a (distinctive) token. */
function chunksContaining(chunks: { csvData: string }[], token: string): number {
  return chunks.filter((ch) => ch.csvData.includes(token)).length;
}

// ---- tests ------------------------------------------------------------------

describe('splitCsvIntoChunks', () => {
  it('never drops, duplicates, or mutates a row (verbatim passthrough)', () => {
    const rows = fillerRows(1200, 'pt');
    const csv = [MANABOX_HEADER, ...rows].join('\n');

    const { chunks, totalRows } = splitCsvIntoChunks(csv, 'manabox');

    expect(totalRows).toBe(1200);
    const emitted = chunks.flatMap((c) => dataLinesOf(c.csvData));
    // Same multiset of lines, unchanged.
    expect(emitted.slice().sort()).toEqual(rows.slice().sort());
    // Every chunk re-states the header and respects the 500-row cap.
    chunks.forEach((c) => {
      expect(c.csvData.split('\n')[0]).toBe(MANABOX_HEADER);
      expect(c.rowCount).toBeLessThanOrEqual(500);
      expect(c.rowCount).toBe(dataLinesOf(c.csvData).length);
    });
  });

  it('keeps foil + non-foil + etched of one card in a single chunk, even far apart', () => {
    const rows = [
      manaboxRow({ scry: 'COLOC-AAA', finish: 'foil' }), // row 0
      ...fillerRows(600, 'a'),
      manaboxRow({ scry: 'COLOC-AAA', finish: 'etched' }), // row ~601
      ...fillerRows(600, 'b'),
      manaboxRow({ scry: 'COLOC-AAA', finish: 'normal' }), // row ~1202
    ];
    const csv = [MANABOX_HEADER, ...rows].join('\n');

    const { chunks } = splitCsvIntoChunks(csv, 'manabox');

    // 500+ filler rows separate each finish: if they were NOT grouped, they
    // would land in different chunks. Exactly one chunk proves co-location.
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunksContaining(chunks, 'COLOC-AAA')).toBe(1);
  });

  it('co-locates a card whose finishes live in different binders', () => {
    const rows = [
      manaboxRow({ scry: 'COLOC-BIND', finish: 'foil', binder: 'Binder A' }),
      ...fillerRows(900, 'c'),
      manaboxRow({ scry: 'COLOC-BIND', finish: 'normal', binder: 'Binder Z' }),
    ];
    const csv = [MANABOX_HEADER, ...rows].join('\n');

    const { chunks } = splitCsvIntoChunks(csv, 'manabox');
    expect(chunksContaining(chunks, 'COLOC-BIND')).toBe(1);
  });

  it('co-locates a card whose name contains a quoted comma', () => {
    const tricky = manaboxRow({ scry: 'COLOC-QUOTE', finish: 'foil', name: '"Borrowing 100,000 Arrows"' });
    const tricky2 = manaboxRow({ scry: 'COLOC-QUOTE', finish: 'normal', name: '"Borrowing 100,000 Arrows"' });
    const rows = [tricky, ...fillerRows(800, 'd'), tricky2];
    const csv = [MANABOX_HEADER, ...rows].join('\n');

    const { chunks } = splitCsvIntoChunks(csv, 'manabox');
    expect(chunksContaining(chunks, 'COLOC-QUOTE')).toBe(1);
  });

  it('co-locates a TCGplayer card across the Printing (Normal/Foil) column', () => {
    const HEADER = 'Quantity,Product ID,Printing,Name,Set,Card Number,Set Code,Condition,Language,Rarity,Price Each';
    const tcg = (printing: string) =>
      ['1', 'PROD-1', printing, 'Some Card', 'Some Set', '42', 'SET', 'Near Mint', 'English', 'Common', '0.10'].join(',');
    const tcgFill = (i: number) =>
      ['1', `PROD-f${i}`, 'Normal', `F${i}`, 'S', String(i), 'SET', 'Near Mint', 'English', 'Common', '0.10'].join(',');
    const rows = [tcg('Normal'), ...Array.from({ length: 700 }, (_, i) => tcgFill(i)), tcg('Foil')];
    const csv = [HEADER, ...rows].join('\n');

    const { chunks } = splitCsvIntoChunks(csv, 'tcgplayer_app');
    expect(chunksContaining(chunks, 'PROD-1,')).toBe(1);
  });

  it('co-locates a custom-format card using field mappings', () => {
    const HEADER = 'MyQty,MyId,MyFinish,MyName';
    const row = (finish: string) => ['1', 'CUS-1', finish, 'Custom Card'].join(',');
    const fill = (i: number) => ['1', `cus-f${i}`, 'normal', `C${i}`].join(',');
    const rows = [row('foil'), ...Array.from({ length: 700 }, (_, i) => fill(i)), row('normal')];
    const csv = [HEADER, ...rows].join('\n');

    const fieldMappings = [
      { csvHeader: 'MyId', mtgcbField: 'scryfallId' },
      { csvHeader: 'MyName', mtgcbField: 'cardName' },
      { csvHeader: 'MyFinish', mtgcbField: 'foil' },
      { csvHeader: 'MyQty', mtgcbField: 'quantity' },
    ];
    const { chunks } = splitCsvIntoChunks(csv, 'custom', fieldMappings);
    expect(chunksContaining(chunks, 'CUS-1,')).toBe(1);
  });

  it('maps chunk-relative error rows back to original file row numbers', () => {
    const rows = fillerRows(1100, 'er');
    const csv = [MANABOX_HEADER, ...rows].join('\n');

    const { chunks } = splitCsvIntoChunks(csv, 'manabox');
    chunks.forEach((c) => {
      const lines = dataLinesOf(c.csvData);
      lines.forEach((line, j) => {
        const originalIndex = c.originalRowNumbers[j] - 1; // 1-indexed -> 0-indexed
        expect(line).toBe(rows[originalIndex]);
      });
    });
    // Every original row is accounted for exactly once.
    const allNums = chunks.flatMap((c) => c.originalRowNumbers).sort((a, b) => a - b);
    expect(allNums).toEqual(Array.from({ length: 1100 }, (_, i) => i + 1));
  });

  it('falls back to file-order chunking (status quo) for an unknown format', () => {
    const rows = fillerRows(1100, 'unk');
    const csv = [MANABOX_HEADER, ...rows].join('\n');

    const { chunks, warnings } = splitCsvIntoChunks(csv, 'not-a-real-format');
    expect(warnings.join(' ')).toMatch(/Unknown import format/i);
    // File order preserved end-to-end.
    const emitted = chunks.flatMap((c) => dataLinesOf(c.csvData));
    expect(emitted).toEqual(rows);
    chunks.forEach((c) => expect(c.rowCount).toBeLessThanOrEqual(500));
  });

  it('handles empty and header-only input without throwing', () => {
    expect(splitCsvIntoChunks('', 'manabox').chunks).toHaveLength(0);
    expect(splitCsvIntoChunks(MANABOX_HEADER, 'manabox').chunks).toHaveLength(0);
  });
});
