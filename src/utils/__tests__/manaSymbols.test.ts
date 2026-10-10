import { getManaSymbolClasses, getManaSymbolName, parseSymbolText } from '../manaSymbols';

describe('getManaSymbolClasses', () => {
  it.each([
    ['W', ['ms-w']],
    ['C', ['ms-c']],
    ['S', ['ms-s']],
    ['X', ['ms-x']],
    ['0', ['ms-0']],
    ['15', ['ms-15']],
    ['1000000', ['ms-1000000']],
    ['T', ['ms-tap']],
    ['Q', ['ms-untap']],
    ['E', ['ms-e']],
    ['P', ['ms-paw']],
    ['PW', ['ms-planeswalker']],
    ['A', ['ms-acorn']],
    ['TK', ['ms-ticket']],
    ['CHAOS', ['ms-chaos']],
    ['∞', ['ms-infinity']],
    ['½', ['ms-1-2']],
    ['W/U', ['ms-wu']],
    ['C/R', ['ms-cr']],
    ['2/B', ['ms-2b']],
    ['B/P', ['ms-bp']],
    ['R/W/P', ['ms-rwp']],
    ['C/P', ['ms-h']],
    ['H', ['ms-h']],
    ['HW', ['ms-w', 'ms-half']],
    ['L', ['ms-l']],
    ['D', ['ms-d']],
    ['w', ['ms-w']],
  ])('{%s} -> %j', (symbol, expected) => {
    expect(getManaSymbolClasses(symbol)).toEqual(expected);
  });

  it.each(['FOO', 'W/U/B', '', 'P/W'])('returns null for {%s}', (symbol) => {
    expect(getManaSymbolClasses(symbol)).toBeNull();
  });
});

describe('getManaSymbolName', () => {
  it.each([
    ['T', 'Tap'],
    ['G', 'Green Mana'],
    ['3', '3 Generic Mana'],
    ['G/U/P', 'Phyrexian Green/Blue Mana'],
    ['2/W', 'Hybrid Two Generic/White Mana'],
    ['HR', 'Half Red Mana'],
  ])('{%s} -> %s', (symbol, expected) => {
    expect(getManaSymbolName(symbol)).toBe(expected);
  });
});

describe('parseSymbolText', () => {
  it('splits rules text into text and symbols', () => {
    expect(parseSymbolText('{2}, {T}, Sacrifice this artifact: You gain 3 life.')).toEqual([
      { type: 'symbol', symbol: '2', classes: ['ms-2'] },
      { type: 'text', text: ', ' },
      { type: 'symbol', symbol: 'T', classes: ['ms-tap'] },
      { type: 'text', text: ', Sacrifice this artifact: You gain 3 life.' },
    ]);
  });

  it('keeps unknown braces as text, merged with the text around them', () => {
    expect(parseSymbolText('Pay {FOO} or {W}.')).toEqual([
      { type: 'text', text: 'Pay {FOO} or ' },
      { type: 'symbol', symbol: 'W', classes: ['ms-w'] },
      { type: 'text', text: '.' },
    ]);
  });

  it('returns plain text untouched', () => {
    expect(parseSymbolText('Flying')).toEqual([{ type: 'text', text: 'Flying' }]);
  });
});
