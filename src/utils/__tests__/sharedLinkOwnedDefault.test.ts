import {
  isOwnedDefaultCompletion,
  ownedDefaultStorageKey,
  withOwnedDefault,
  withOwnedDefaultState,
  withoutOwnedDefault,
  withoutOwnedDefaultStat,
} from '../sharedLinkOwnedDefault';

const params = (query: string) => new URLSearchParams(query);

describe('withOwnedDefault', () => {
  it('adds Owned for sets and cards to a bare share link', () => {
    const next = withOwnedDefault(params('contentType=sets'));

    expect(next?.get('contentType')).toBe('sets');
    expect(next?.get('includeCompletionStatus')).toBe('complete|partial');
    expect(next?.get('stats')).toBe('quantityAll=gte1');
  });

  it('leaves a completion filter already in the link alone', () => {
    const next = withOwnedDefault(params('includeCompletionStatus=empty'));

    expect(next?.get('includeCompletionStatus')).toBe('empty');
    expect(next?.get('stats')).toBe('quantityAll=gte1');
  });

  it('treats an exclude-only completion filter as an explicit choice', () => {
    const next = withOwnedDefault(params('excludeCompletionStatus=complete'));

    expect(next?.has('includeCompletionStatus')).toBe(false);
  });

  it('appends to other stat filters without touching them', () => {
    const next = withOwnedDefault(params('stats=convertedManaCost%3Dlte3'));

    expect(next?.get('stats')).toBe('convertedManaCost=lte3,quantityAll=gte1');
  });

  it('leaves a quantity filter already in the link alone', () => {
    const next = withOwnedDefault(params('stats=quantityAll%3Deq0'));

    expect(next?.get('stats')).toBe('quantityAll=eq0');
  });

  it('returns null when the link already states both', () => {
    expect(withOwnedDefault(params('includeCompletionStatus=empty&stats=quantityAll%3Deq0'))).toBeNull();
  });

  it('does not mutate its input', () => {
    const input = params('contentType=cards');
    withOwnedDefault(input);

    expect(input.toString()).toBe('contentType=cards');
  });
});

describe('withOwnedDefaultState', () => {
  it('seeds both views and keeps their other saved filters', () => {
    expect(withOwnedDefaultState('sets', { name: 'Alpha' }, params('contentType=sets'))).toEqual({
      name: 'Alpha',
      completionStatus: { include: ['complete', 'partial'], exclude: [] },
    });
    expect(withOwnedDefaultState('cards', { stats: { convertedManaCost: ['lte3'] } }, params(''))).toEqual({
      stats: { convertedManaCost: ['lte3'], quantityAll: ['gte1'] },
    });
  });

  it('leaves a view alone when the link states its ownership filter', () => {
    expect(withOwnedDefaultState('sets', {}, params('excludeCompletionStatus=complete'))).toBeNull();
    expect(withOwnedDefaultState('cards', {}, params('stats=quantityAll%3Deq0'))).toBeNull();
  });
});

describe('isOwnedDefaultCompletion', () => {
  it('matches complete + partial in either order', () => {
    expect(isOwnedDefaultCompletion({ include: ['complete', 'partial'], exclude: [] })).toBe(true);
    expect(isOwnedDefaultCompletion({ include: ['partial', 'complete'], exclude: [] })).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isOwnedDefaultCompletion(undefined)).toBe(false);
    expect(isOwnedDefaultCompletion({ include: ['empty'], exclude: [] })).toBe(false);
    expect(isOwnedDefaultCompletion({ include: ['complete'], exclude: [] })).toBe(false);
    expect(isOwnedDefaultCompletion({ include: ['complete', 'partial'], exclude: ['empty'] })).toBe(false);
  });
});

describe('withoutOwnedDefaultStat', () => {
  it('removes quantityAll >= 1 and keeps other stats', () => {
    expect(withoutOwnedDefaultStat({ quantityAll: ['gte1'], convertedManaCost: ['lte3'] })).toEqual({
      convertedManaCost: ['lte3'],
    });
  });

  it('returns null when quantityAll is not the default', () => {
    expect(withoutOwnedDefaultStat(undefined)).toBeNull();
    expect(withoutOwnedDefaultStat({ quantityAll: ['eq0'] })).toBeNull();
    expect(withoutOwnedDefaultStat({ quantityAll: ['gte1', 'lte4'] })).toBeNull();
  });
});

describe('withoutOwnedDefault', () => {
  it('drops the sets default and keeps other fields', () => {
    expect(
      withoutOwnedDefault('sets', { name: 'Alpha', completionStatus: { include: ['complete', 'partial'], exclude: [] } }),
    ).toEqual({ name: 'Alpha' });
  });

  it('drops an emptied stats object for cards', () => {
    expect(withoutOwnedDefault('cards', { stats: { quantityAll: ['gte1'] } })).toEqual({});
  });

  it('returns null when the saved state carries no default', () => {
    expect(withoutOwnedDefault('sets', { completionStatus: { include: ['empty'], exclude: [] } })).toBeNull();
    expect(withoutOwnedDefault('cards', { name: 'Bolt' })).toBeNull();
  });
});

describe('ownedDefaultStorageKey', () => {
  it('is scoped to the token', () => {
    expect(ownedDefaultStorageKey('abc')).not.toBe(ownedDefaultStorageKey('def'));
  });
});
