import browseReducer, {
  setBorderColors,
  setFrameEffects,
  setIsFullArt,
  setIsReserved,
} from '@/redux/slices/browse/browseSlice';

type BrowseState = ReturnType<typeof browseReducer>;

const initial = () => browseReducer(undefined, { type: '@@INIT' }) as BrowseState;

/**
 * The tri-state filters keep state lean by deleting the key when cleared rather
 * than storing `undefined`. That matters because the URL serializer skips absent
 * keys — a lingering `isFullArt: undefined` would be harmless, but a lingering
 * `false` would silently exclude every full art card.
 */
describe('browseSlice — setIsFullArt', () => {
  it('stores true', () => {
    const state = browseReducer(initial(), setIsFullArt(true));

    expect(state.cardsSearchParams.isFullArt).toBe(true);
  });

  it('stores false rather than treating it as a clear', () => {
    const state = browseReducer(initial(), setIsFullArt(false));

    expect(state.cardsSearchParams.isFullArt).toBe(false);
  });

  it('removes the key entirely when cleared', () => {
    const set = browseReducer(initial(), setIsFullArt(true));
    const cleared = browseReducer(set, setIsFullArt(undefined));

    expect('isFullArt' in cleared.cardsSearchParams).toBe(false);
  });

  it('removes the key when cleared from false', () => {
    const set = browseReducer(initial(), setIsFullArt(false));
    const cleared = browseReducer(set, setIsFullArt(undefined));

    expect('isFullArt' in cleared.cardsSearchParams).toBe(false);
  });

  it('does not disturb isReserved', () => {
    let state = browseReducer(initial(), setIsReserved(true));
    state = browseReducer(state, setIsFullArt(false));

    expect(state.cardsSearchParams.isReserved).toBe(true);
    expect(state.cardsSearchParams.isFullArt).toBe(false);
  });

  it('does not leak into sets search params', () => {
    const state = browseReducer(initial(), setIsFullArt(true));

    expect('isFullArt' in state.setsSearchParams).toBe(false);
  });
});

/**
 * Treatment filters are include/exclude sets that must vanish from state when
 * emptied, so the URL serializer and API converter both skip them cleanly.
 */
describe('browseSlice — treatments', () => {
  const empty = { include: [], exclude: [] };

  it('stores selected border colours', () => {
    const state = browseReducer(initial(), setBorderColors({ include: ['"borderless"'], exclude: [] }));

    expect(state.cardsSearchParams.borderColors).toEqual({ include: ['"borderless"'], exclude: [] });
  });

  it('stores selected frame effects unquoted', () => {
    const state = browseReducer(initial(), setFrameEffects({ include: ['extendedart'], exclude: [] }));

    expect(state.cardsSearchParams.frameEffects).toEqual({ include: ['extendedart'], exclude: [] });
  });

  it('removes border colours when the selection is emptied', () => {
    const set = browseReducer(initial(), setBorderColors({ include: ['"gold"'], exclude: [] }));
    const cleared = browseReducer(set, setBorderColors(empty));

    expect('borderColors' in cleared.cardsSearchParams).toBe(false);
  });

  it('removes frame effects when the selection is emptied', () => {
    const set = browseReducer(initial(), setFrameEffects({ include: ['showcase'], exclude: [] }));
    const cleared = browseReducer(set, setFrameEffects(empty));

    expect('frameEffects' in cleared.cardsSearchParams).toBe(false);
  });

  it('keeps an exclude-only selection', () => {
    const state = browseReducer(initial(), setBorderColors({ include: [], exclude: ['"black"'] }));

    expect(state.cardsSearchParams.borderColors).toEqual({ include: [], exclude: ['"black"'] });
  });

  it('does not let the treatments disturb each other or the full art flag', () => {
    let state = browseReducer(initial(), setIsFullArt(true));
    state = browseReducer(state, setBorderColors({ include: ['"borderless"'], exclude: [] }));
    state = browseReducer(state, setFrameEffects({ include: ['etched'], exclude: [] }));

    expect(state.cardsSearchParams.isFullArt).toBe(true);
    expect(state.cardsSearchParams.borderColors?.include).toEqual(['"borderless"']);
    expect(state.cardsSearchParams.frameEffects?.include).toEqual(['etched']);
  });

  it('does not leak treatments into sets search params', () => {
    const state = browseReducer(initial(), setFrameEffects({ include: ['showcase'], exclude: [] }));

    expect('frameEffects' in state.setsSearchParams).toBe(false);
  });
});
