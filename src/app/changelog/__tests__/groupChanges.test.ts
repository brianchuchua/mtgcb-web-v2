import { groupChanges } from '../changelog';

describe('groupChanges', () => {
  it('keeps flat lists flat', () => {
    expect(groupChanges(['A', 'B'])).toEqual([
      { text: 'A', children: [] },
      { text: 'B', children: [] },
    ]);
  });

  it('puts a nested array under the line before it', () => {
    expect(groupChanges(['A', ['A1', 'A2'], 'B'])).toEqual([
      {
        text: 'A',
        children: [
          { text: 'A1', children: [] },
          { text: 'A2', children: [] },
        ],
      },
      { text: 'B', children: [] },
    ]);
  });

  it('supports deeper nesting', () => {
    expect(groupChanges(['A', ['A1', ['A1a']]])).toEqual([
      { text: 'A', children: [{ text: 'A1', children: [{ text: 'A1a', children: [] }] }] },
    ]);
  });

  it('gives a leading nested array an empty parent', () => {
    expect(groupChanges([['X']])).toEqual([{ text: '', children: [{ text: 'X', children: [] }] }]);
  });
});
