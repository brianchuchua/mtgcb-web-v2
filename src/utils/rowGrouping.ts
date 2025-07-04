export interface RowGroup<T> {
  id: string;
  items: T[];
  startIndex: number;
}

export function groupIntoRows<T>(
  items: T[],
  columnsPerRow: number
): RowGroup<T>[] {
  if (columnsPerRow <= 0) {
    return [];
  }

  const rows: RowGroup<T>[] = [];
  for (let i = 0; i < items.length; i += columnsPerRow) {
    rows.push({
      id: `row-${Math.floor(i / columnsPerRow)}`,
      items: items.slice(i, i + columnsPerRow),
      startIndex: i,
    });
  }
  return rows;
}

export function getResponsiveColumns(width: number): number {
  if (width < 600) return 1;
  if (width < 1000) return 1;
  if (width < 1300) return 2;
  if (width < 1750) return 3;
  if (width < 2000) return 4;
  return 5;
}