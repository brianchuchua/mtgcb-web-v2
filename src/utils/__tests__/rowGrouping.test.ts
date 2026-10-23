import { getResponsiveColumns, groupIntoRows } from '@/utils/rowGrouping';

describe('groupIntoRows', () => {
  it('splits items into rows with stable ids and start indexes', () => {
    expect(groupIntoRows(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
      { id: 'row-0', items: ['a', 'b'], startIndex: 0 },
      { id: 'row-1', items: ['c', 'd'], startIndex: 2 },
      { id: 'row-2', items: ['e'], startIndex: 4 },
    ]);
  });

  it('puts everything in one row when columns exceed items', () => {
    expect(groupIntoRows([1, 2], 5)).toEqual([{ id: 'row-0', items: [1, 2], startIndex: 0 }]);
  });

  it('returns no rows for an empty list', () => {
    expect(groupIntoRows([], 3)).toEqual([]);
  });

  it.each([0, -1])('returns no rows for %p columns', (columns) => {
    expect(groupIntoRows([1, 2, 3], columns)).toEqual([]);
  });
});

describe('getResponsiveColumns', () => {
  it.each([
    [0, 1],
    [599, 1],
    [600, 1],
    [999, 1],
    [1000, 2],
    [1299, 2],
    [1300, 3],
    [1749, 3],
    [1750, 4],
    [1999, 4],
    [2000, 5],
    [4000, 5],
  ])('width %p gives %p columns', (width, columns) => {
    expect(getResponsiveColumns(width)).toBe(columns);
  });
});
