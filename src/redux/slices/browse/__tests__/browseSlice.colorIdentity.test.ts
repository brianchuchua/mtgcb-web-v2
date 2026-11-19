import browseReducer, {
  resetSearch,
  setColorIdentity,
  setColors,
  setViewContentType,
} from '@/redux/slices/browse';
import { saveSearchState, loadSearchState } from '@/hooks/useSearchStateSync';

const initial = () => browseReducer(undefined, { type: '@@INIT' });

describe('browseSlice — setColorIdentity', () => {
  it('stores a selection', () => {
    const state = browseReducer(initial(), setColorIdentity({ colors: ['G', 'U'], matchType: 'atMost' }));

    expect(state.cardsSearchParams.colorIdentity).toEqual({ colors: ['G', 'U'], matchType: 'atMost' });
  });

  it('keeps a colorless-only selection', () => {
    const state = browseReducer(
      initial(),
      setColorIdentity({ colors: [], matchType: 'exactly', includeColorless: true }),
    );

    expect(state.cardsSearchParams.colorIdentity).toEqual({
      colors: [],
      matchType: 'exactly',
      includeColorless: true,
    });
  });

  it('deletes the key when nothing is chosen', () => {
    const selected = browseReducer(initial(), setColorIdentity({ colors: ['G'], matchType: 'atLeast' }));
    const cleared = browseReducer(selected, setColorIdentity({ colors: [], matchType: 'atLeast' }));

    expect(cleared.cardsSearchParams).not.toHaveProperty('colorIdentity');
  });

  it('does not disturb the color filter, and is not disturbed by it', () => {
    let state = browseReducer(initial(), setColors({ colors: ['R'], matchType: 'exactly' }));
    state = browseReducer(state, setColorIdentity({ colors: ['R', 'W'], matchType: 'atMost' }));
    state = browseReducer(state, setColors({ colors: [], matchType: 'exactly' }));

    expect(state.cardsSearchParams).not.toHaveProperty('colors');
    expect(state.cardsSearchParams.colorIdentity).toEqual({ colors: ['R', 'W'], matchType: 'atMost' });
  });

  it('never lands on the sets search', () => {
    const state = browseReducer(initial(), setColorIdentity({ colors: ['G'], matchType: 'exactly' }));

    expect(state.setsSearchParams).not.toHaveProperty('colorIdentity');
  });

  it('is cleared by Reset Search', () => {
    // Reset Search clears whichever view is showing.
    const onCards = browseReducer(initial(), setViewContentType('cards'));
    const selected = browseReducer(onCards, setColorIdentity({ colors: ['G'], matchType: 'exactly' }));
    const reset = browseReducer(selected, resetSearch());

    expect(reset.cardsSearchParams).not.toHaveProperty('colorIdentity');
  });
});

describe('search state in sessionStorage — colorIdentity', () => {
  beforeEach(() => sessionStorage.clear());

  it('survives a refresh along with the rest of the active search', () => {
    saveSearchState('cards', { colorIdentity: { colors: ['G', 'U'], matchType: 'atMost' } });

    expect(loadSearchState('cards')).toEqual({ colorIdentity: { colors: ['G', 'U'], matchType: 'atMost' } });
  });
});
