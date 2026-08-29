import browseReducer, { setFrameEffects, setFrameStyles, setReleaseDate } from '@/redux/slices/browse';

const initial = () => browseReducer(undefined, { type: '@@INIT' });

const cardsParams = (state: ReturnType<typeof initial>) => state.cardsSearchParams;

describe('browseSlice — setFrameStyles', () => {
  it('stores a selection', () => {
    const state = browseReducer(initial(), setFrameStyles({ include: ['1997'], exclude: [] }));

    expect(cardsParams(state).frameStyles).toEqual({ include: ['1997'], exclude: [] });
  });

  it('stores an exclusion', () => {
    const state = browseReducer(initial(), setFrameStyles({ include: [], exclude: ['2015'] }));

    expect(cardsParams(state).frameStyles).toEqual({ include: [], exclude: ['2015'] });
  });

  it('drops the filter entirely when both sides are emptied', () => {
    const selected = browseReducer(initial(), setFrameStyles({ include: ['1997'], exclude: [] }));
    const cleared = browseReducer(selected, setFrameStyles({ include: [], exclude: [] }));

    expect(cardsParams(cleared)).not.toHaveProperty('frameStyles');
  });

  it('does not disturb the frame effect filter', () => {
    const withEffects = browseReducer(initial(), setFrameEffects({ include: ['showcase'], exclude: [] }));
    const withBoth = browseReducer(withEffects, setFrameStyles({ include: ['1997'], exclude: [] }));

    expect(cardsParams(withBoth).frameEffects).toEqual({ include: ['showcase'], exclude: [] });
    expect(cardsParams(withBoth).frameStyles).toEqual({ include: ['1997'], exclude: [] });
  });
});

describe('browseSlice — setReleaseDate', () => {
  it('stores both bounds', () => {
    const state = browseReducer(initial(), setReleaseDate({ from: '2019', to: '2021' }));

    expect(cardsParams(state).releaseDate).toEqual({ from: '2019', to: '2021' });
  });

  /**
   * A one-sided window is the common case for a retro frame goal ("everything
   * printed since 2019"), so clearing one bound must leave the other standing
   * rather than dropping the filter.
   */
  it('keeps a lone from bound', () => {
    const state = browseReducer(initial(), setReleaseDate({ from: '2019', to: '' }));

    expect(cardsParams(state).releaseDate).toEqual({ from: '2019' });
  });

  it('keeps a lone to bound', () => {
    const state = browseReducer(initial(), setReleaseDate({ from: '', to: '2003' }));

    expect(cardsParams(state).releaseDate).toEqual({ to: '2003' });
  });

  it('narrows a two-sided window to one bound when the other is cleared', () => {
    const both = browseReducer(initial(), setReleaseDate({ from: '2019', to: '2021' }));
    const narrowed = browseReducer(both, setReleaseDate({ from: '2019', to: '' }));

    expect(cardsParams(narrowed).releaseDate).toEqual({ from: '2019' });
  });

  it('drops the filter when both bounds are empty', () => {
    const set = browseReducer(initial(), setReleaseDate({ from: '2019', to: '2021' }));
    const cleared = browseReducer(set, setReleaseDate({ from: '', to: '' }));

    expect(cardsParams(cleared)).not.toHaveProperty('releaseDate');
  });

  it('trims whitespace off the bounds', () => {
    const state = browseReducer(initial(), setReleaseDate({ from: '  2019  ', to: ' 2021 ' }));

    expect(cardsParams(state).releaseDate).toEqual({ from: '2019', to: '2021' });
  });

  it('treats a whitespace-only bound as no bound', () => {
    const state = browseReducer(initial(), setReleaseDate({ from: '   ', to: '2021' }));

    expect(cardsParams(state).releaseDate).toEqual({ to: '2021' });
  });
});
