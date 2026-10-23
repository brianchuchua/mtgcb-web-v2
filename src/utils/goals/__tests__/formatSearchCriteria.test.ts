import { formatGoalDescription, formatSearchCriteria } from '@/utils/goals/formatSearchCriteria';

type Criteria = Parameters<typeof formatSearchCriteria>[0];

const describeGoal = (conditions: Record<string, unknown>, onePrintingPerPureName?: boolean) =>
  formatSearchCriteria({ conditions } as Criteria, onePrintingPerPureName);

const describeSearch = (conditions: Record<string, unknown>, isSetPage?: boolean) =>
  formatSearchCriteria({ conditions } as Criteria, undefined, false, isSetPage);

// Treatments, frame styles, release dates, Reserved List and Full Art have their own test files.
describe('formatSearchCriteria (goal wording)', () => {
  it.each<[string, Record<string, unknown>, string]>([
    ['nothing', {}, 'every card'],
    ['name', { name: 'Bolt' }, 'card named "Bolt"'],
    ['name with type', { name: 'Bolt', type: { AND: ['"Instant"'] } }, 'Instant named "Bolt"'],

    ['one type', { type: { AND: ['"Instant"'] } }, 'Instant'],
    ['several types', { type: { AND: ['Artifact', 'Creature'] } }, 'Artifact Creature'],
    ['legendary dragon', { type: { AND: ['Dragon', 'Legendary', 'Creature'] } }, 'Legendary Dragon'],
    ['legendary creature', { type: { AND: ['Legendary', 'Creature', 'Elf'] } }, 'Legendary Creature'],
    ['excluded type', { type: { NOT: ['"Land"'] } }, 'non-Land'],
    ['included and excluded types', { type: { AND: ['Creature'], NOT: ['Human', 'Elf'] } }, 'Creature non-Human non-Elf'],

    ['one layout', { layout: { OR: ['"split"'] } }, 'Split layout'],
    ['several layouts', { layout: { OR: ['modal_dfc', 'transform'] } }, 'Modal Dfc/Transform layouts'],
    ['excluded layout', { layout: { NOT: ['token'] } }, 'non-Token layout'],
    ['excluded layouts', { layout: { NOT: ['token', 'art_series'] } }, 'non-Token/non-Art Series layouts'],

    ['colorless', { colors_array: { exactly: [] } }, 'Colorless'],
    ['exactly one colour', { colors_array: { exactly: ['W'] } }, 'only White'],
    ['exactly several colours', { colors_array: { exactly: ['W', 'U'] } }, 'only White/Blue'],
    ['at least', { colors_array: { atLeast: ['R', 'G'] } }, 'with Red/Green'],
    ['at most', { colors_array: { atMost: ['B'] } }, 'at most Black'],
    ['unknown colour code', { colors_array: { exactly: ['C'] } }, 'only C'],

    ['rarities', { rarityNumeric: { OR: ['=4', '=5'] } }, 'Rare/Mythic'],
    ['special rarity', { rarityNumeric: { OR: ['=6'] } }, 'Special'],
    ['excluded rarities', { rarityNumeric: { AND: ['!=2', '!=3'] } }, 'non-Common/non-Uncommon'],
    ['unknown or non-equality rarity tokens', { rarityNumeric: { OR: ['=9', '>=4'], AND: ['<5'] } }, 'every card'],

    [
      'colour, rarity, type and layout in order',
      {
        layout: { OR: ['normal'] },
        type: { AND: ['Creature'] },
        rarityNumeric: { OR: ['=5'] },
        colors_array: { exactly: ['R'] },
      },
      'only Red Mythic Creature Normal layout',
    ],

    ['oracle text', { oracleText: 'draw a card' }, 'every card with "draw a card" in text'],
    ['artist', { artist: 'John Avon' }, 'every card by artist "John Avon"'],
    ['reserved list', { isReserved: true }, 'every card (Reserved List only)'],

    ['playable in any of', { legalIn: { OR: ['modern', 'pauper'] } }, 'every card playable in Modern/Pauper'],
    ['playable in one (AND)', { legalIn: { AND: ['modern'] } }, 'every card playable in Modern'],
    ['playable in all of', { legalIn: { AND: ['modern', 'legacy'] } }, 'every card playable in all of Modern/Legacy'],
    ['not playable in', { legalIn: { NOT: ['standard'] } }, 'every card not playable in Standard'],
    [
      'playable and not playable',
      { legalIn: { OR: ['modern'], NOT: ['standard'] } },
      'every card playable in Modern, not playable in Standard',
    ],
    ['printed for', { formatRelevantIn: { OR: ['commander'] } }, 'every card printed for Commander'],
    ['not printed for', { formatRelevantIn: { NOT: ['paupercommander'] } }, 'every card not printed for Pauper Commander'],
    [
      'formatRelevantIn wins over legalIn',
      { legalIn: { OR: ['modern'] }, formatRelevantIn: { OR: ['legacy'] } },
      'every card printed for Legacy',
    ],
    ['unknown format', { legalIn: { OR: ['madeup'] } }, 'every card playable in madeup'],
    ['empty legality lists', { legalIn: { OR: [], AND: [], NOT: [] } }, 'every card'],

    ['one set', { setId: { OR: ['1'] } }, 'every card from specific set'],
    ['several sets', { setId: { OR: ['1', '2'] } }, 'every card from specific sets'],
    ['excluded sets', { setId: { AND: ['!=1', '!=2'] } }, 'every card excluding 2 sets'],
    ['one excluded set', { setId: { AND: ['!=1'] } }, 'every card excluding 1 set'],
    ['included and excluded sets', { setId: { OR: ['1', '2'], AND: ['!=3'] } }, 'every card from specific sets excluding 1 set'],
    ['sets go last', { name: 'Bolt', artist: 'X', setId: { OR: ['1'] } }, 'card named "Bolt" by artist "X" from specific set'],

    ['set category string', { setCategory: 'sealed' }, 'every card from sealed category'],
    ['set category array of one', { setCategory: ['normal'] }, 'every card from normal category'],
    ['set category array', { setCategory: ['normal', 'special'] }, 'every card from normal/special categories'],
    ['set category OR', { setCategory: { OR: ['special'] } }, 'every card from special category'],
    ['set category OR several', { setCategory: { OR: ['normal', 'sealed'] } }, 'every card from normal/sealed categories'],
    ['set category NOT', { setCategory: { NOT: ['sealed'] } }, 'every card not from sealed category'],
    ['set category NOT several', { setCategory: { NOT: ['normal', 'sealed'] } }, 'every card not from normal/sealed categories'],
    ['unknown set category', { setCategory: 'funny' }, 'every card from funny category'],

    ['set type string', { setType: 'core' }, 'every card from core sets'],
    ['set type array of one', { setType: ['expansion'] }, 'every card from expansion sets'],
    ['set type array', { setType: ['core', 'expansion'] }, 'every card from core/expansion sets'],
    ['set type OR', { setType: { OR: ['masters'] } }, 'every card from masters sets'],
    ['set type OR several', { setType: { OR: ['masters', 'draft_innovation'] } }, 'every card from masters/draft_innovation sets'],
    ['set type NOT', { setType: { NOT: ['funny'] } }, 'every card not from funny sets'],
    ['set type NOT several', { setType: { NOT: ['funny', 'memorabilia'] } }, 'every card not from funny/memorabilia sets'],

    ['mana value', { convertedManaCost: { AND: ['>=2', '<=4'] } }, 'every card (MV >=2, MV <=4)'],
    [
      'all stats in order',
      {
        loyaltyNumeric: { AND: ['>4'] },
        toughnessNumeric: { AND: ['<=5'] },
        powerNumeric: { AND: ['>=2'] },
        convertedManaCost: { AND: ['=3'] },
      },
      'every card (MV =3, Power >=2, Toughness <=5, Loyalty >4)',
    ],
    [
      'all prices in order',
      {
        foil: { AND: ['>2.50'] },
        high: { AND: ['!=3'] },
        average: { AND: ['=5'] },
        low: { AND: ['<1'] },
        market: { AND: ['>=10'] },
      },
      'every card (Market Price >= $10, Low Price < $1, Average Price = $5, High Price != $3, Foil Price > $2.50)',
    ],
    ['price token without an operator', { market: { AND: ['10'] } }, 'every card (Market Price 10)'],
    ['stats after other attributes', { artist: 'X', powerNumeric: { AND: ['>3'] } }, 'every card by artist "X" (Power >3)'],

    // Quantity filters only shape the search-summary wording, never the goal wording.
    ['quantity filter', { quantityAll: { AND: ['>=1'] } }, 'every card'],

    ['card ids with a name', { name: 'Bolt', id: { OR: ['a'] } }, 'card named "Bolt" (including 1 specific card)'],
    [
      'included and excluded card ids with other criteria',
      { artist: 'X', id: { OR: ['a', 'b'], AND: ['!=c', '!=d'] } },
      'every card by artist "X" (including 2 specific cards and excluding 2 specific cards)',
    ],
  ])('%s', (_label, conditions, expected) => {
    expect(describeGoal(conditions)).toBe(expected);
  });

  // The goal wording keeps only the type next to a name; colour/rarity/layout are dropped (current behavior).
  it('drops colour, rarity and layout when a name is present', () => {
    expect(
      describeGoal({ name: 'Bolt', colors_array: { exactly: ['R'] }, rarityNumeric: { OR: ['=2'] } }),
    ).toBe('card named "Bolt"');
  });

  it('includes sets on a set page for goals', () => {
    expect(formatSearchCriteria({ conditions: { setId: { OR: ['1'] } } } as Criteria, undefined, true, true)).toBe(
      'every card from specific set',
    );
  });

  describe('one printing per card name', () => {
    it.each<[boolean | undefined, string]>([
      [true, 'every card (any printing of each card)'],
      [false, 'every card (every printing of each card)'],
      [undefined, 'every card'],
    ])('onePrintingPerPureName=%p', (flag, expected) => {
      expect(describeGoal({}, flag)).toBe(expected);
    });

    it('is not mentioned when only card ids are selected', () => {
      expect(describeGoal({ id: { OR: ['a'] } }, true)).toBe('1 specific card');
    });
  });

  describe('only card ids', () => {
    it.each<[Record<string, unknown>, string]>([
      [{ OR: ['a'] }, '1 specific card'],
      [{ OR: ['a', 'b'] }, '2 specific cards'],
      [{ AND: ['!=a'] }, 'every card except 1 specific card'],
      [{ AND: ['!=a', '!=b'] }, 'every card except 2 specific cards'],
      [{ OR: ['a', 'b'], AND: ['!=c'] }, '2 specific cards (excluding 1 other)'],
      [{ OR: ['a'], AND: ['!=b', '!=c'] }, '1 specific card (excluding 2 others)'],
      [{ OR: [] }, 'every card'],
    ])('id %j', (id, expected) => {
      expect(describeGoal({ id })).toBe(expected);
    });
  });

  // Drift guard: every condition key the API accepts for goals must change the sentence.
  it.each<[string, unknown]>([
    ['name', 'Bolt'],
    ['oracleText', 'flying'],
    ['artist', 'X'],
    ['type', { AND: ['Creature'] }],
    ['layout', { OR: ['split'] }],
    ['colors_array', { atLeast: ['G'] }],
    ['rarityNumeric', { OR: ['=4'] }],
    ['isReserved', true],
    ['isFullArt', false],
    ['borderColor', { OR: ['"borderless"'] }],
    ['frameStyle', { OR: ['1997'] }],
    ['frameEffects', { OR: ['showcase'] }],
    ['releasedAt', '>=2019'],
    ['legalIn', { OR: ['modern'] }],
    ['formatRelevantIn', { OR: ['modern'] }],
    ['setId', { OR: ['1'] }],
    ['setCategory', 'normal'],
    ['setType', 'core'],
    ['id', { OR: ['a'] }],
    ['convertedManaCost', { AND: ['=1'] }],
    ['powerNumeric', { AND: ['=1'] }],
    ['toughnessNumeric', { AND: ['=1'] }],
    ['loyaltyNumeric', { AND: ['=1'] }],
    ['market', { AND: ['>1'] }],
    ['low', { AND: ['>1'] }],
    ['average', { AND: ['>1'] }],
    ['high', { AND: ['>1'] }],
    ['foil', { AND: ['>1'] }],
  ])('%s is described', (key, value) => {
    expect(describeGoal({ [key]: value })).not.toBe('every card');
  });
});

describe('formatSearchCriteria (search summary wording)', () => {
  it.each<[string, Record<string, unknown>, string]>([
    ['nothing', {}, 'cards: all'],
    ['name', { name: 'Bolt' }, 'cards matching "Bolt"'],
    ['name with type', { name: 'Bolt', type: { AND: ['Instant'] } }, 'cards: Instant named "Bolt"'],
    [
      'name with colour and rarity',
      { name: 'Bolt', colors_array: { exactly: ['R'] }, rarityNumeric: { OR: ['=2'] } },
      'cards: only Red Common named "Bolt"',
    ],
    ['colour only', { colors_array: { exactly: ['G'] } }, 'cards: only Green'],
    ['qualifier only', { artist: 'X' }, 'cards: all by artist "X"'],
    ['one set', { setId: { OR: ['1'] } }, 'cards: all from specific set'],
    ['excluded set', { setId: { AND: ['!=1'] } }, 'cards: all excluding 1 set'],
    ['included and excluded sets', { setId: { OR: ['1', '2'], AND: ['!=3'] } }, 'cards: all from specific sets excluding 1 set'],
    ['type with set', { type: { AND: ['Creature'] }, setId: { OR: ['1'] } }, 'cards: Creature from specific set'],

    ['total quantity equals', { quantityAll: { AND: ['=4'] } }, 'cards: 4x'],
    ['total quantity comparison', { quantityAll: { AND: ['>=1'] } }, 'cards: >= 1x'],
    ['last total quantity token wins', { quantityAll: { AND: ['>=1', '<=3'] } }, 'cards: <= 3x'],
    ['regular quantity', { quantityReg: { AND: ['=0'] } }, 'cards: 0x'],
    ['foil quantity', { quantityFoil: { AND: ['>=1'] } }, 'cards: >= 1x foil'],
    ['foil quantity equals', { quantityFoil: { AND: ['=2'] } }, 'cards: 2x foil'],
    ['regular and foil', { quantityReg: { AND: ['=0'] }, quantityFoil: { AND: ['>=1'] } }, 'cards: 0x and >= 1x foil'],
    [
      'total wins over regular/foil',
      { quantityAll: { AND: ['=4'] }, quantityReg: { AND: ['=1'] } },
      'cards: 4x',
    ],
    ['quantity with type', { quantityAll: { AND: ['=4'] }, type: { AND: ['Instant'] } }, 'cards: 4x of Instant'],
    ['quantity with name', { quantityAll: { AND: ['=4'] }, name: 'Bolt' }, 'cards: 4x matching "Bolt"'],
    [
      'quantity with name and colour',
      { quantityAll: { AND: ['=4'] }, name: 'Bolt', colors_array: { exactly: ['R'] } },
      'cards: 4x of only Red named "Bolt"',
    ],
    ['quantity with qualifier', { quantityAll: { AND: ['=4'] }, artist: 'X' }, 'cards: 4x by artist "X"'],
  ])('%s', (_label, conditions, expected) => {
    expect(describeSearch(conditions)).toBe(expected);
  });

  it('leaves sets out on a set page', () => {
    expect(describeSearch({ setId: { OR: ['1'] } }, true)).toBe('cards: all');
    expect(describeSearch({ type: { AND: ['Creature'] }, setId: { OR: ['1'] } }, true)).toBe('cards: Creature');
  });

  // The search wording always says "cards", even for one (current behavior).
  it.each<[Record<string, unknown>, string]>([
    [{ OR: ['a'] }, '1 specific cards'],
    [{ OR: ['a', 'b'] }, '2 specific cards'],
    [{ AND: ['!=a'] }, 'all cards except 1 specific cards'],
    [{ OR: ['a', 'b'], AND: ['!=c'] }, '2 specific cards (excluding 1 others)'],
  ])('only card ids %j', (id, expected) => {
    expect(describeSearch({ id })).toBe(expected);
  });
});

describe('formatGoalDescription', () => {
  const criteria = { conditions: { type: { AND: ['Creature'] } } } as Criteria;

  it.each<[number | null, number | null, number | null, string]>([
    [null, null, 4, '4x of Creature'],
    [2, 1, 4, '4x of Creature'],
    [2, 1, null, '2x regular and 1x foil of Creature'],
    [3, null, null, '3x regular of Creature'],
    [null, 1, null, '1x foil of Creature'],
    [null, null, null, '1x of Creature'],
    [0, 0, 0, '1x of Creature'],
  ])('reg=%p foil=%p all=%p', (reg, foil, all, expected) => {
    expect(formatGoalDescription(criteria, reg, foil, all)).toBe(expected);
  });

  it('describes an empty goal', () => {
    expect(formatGoalDescription({ conditions: {} } as Criteria, null, null, 1)).toBe('1x of every card');
  });
});
