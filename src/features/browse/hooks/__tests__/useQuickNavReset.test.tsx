import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { useQuickNavReset } from '@/features/browse/hooks/useQuickNavReset';
import { setArtist, setCardSearchName, setSelectedGoalId, setViewContentType } from '@/redux/slices/browse';
import { makeStore } from '@/redux/store';

let mockPathname = '/browse';
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

const setup = () => {
  const store = makeStore();
  store.dispatch(setViewContentType('cards'));
  store.dispatch(setCardSearchName('Old search'));
  store.dispatch(setArtist('Old artist'));
  store.dispatch(setSelectedGoalId(9));

  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
  const hook = renderHook(() => useQuickNavReset(), { wrapper });
  return { store, hook, cards: () => store.getState().browse.cardsSearchParams };
};

const navigate = (pathname: string, query: string) => {
  mockPathname = pathname;
  mockSearchParams = new URLSearchParams(query);
};

beforeEach(() => {
  navigate('/browse', '');
  sessionStorage.clear();
});

describe('useQuickNavReset', () => {
  it('does nothing on the first render even with the flag set', () => {
    sessionStorage.setItem('quickNavReset', 'true');
    const { cards } = setup();

    expect(cards()).toMatchObject({ name: 'Old search', artist: 'Old artist' });
    expect(sessionStorage.getItem('quickNavReset')).toBe('true');
  });

  it('keeps filters on a normal navigation without the flag', () => {
    const { hook, cards } = setup();

    navigate('/browse', 'contentType=cards&name=New');
    hook.rerender();

    expect(cards()).toMatchObject({ name: 'Old search', artist: 'Old artist', selectedGoalId: 9 });
  });

  it('clears old filters, applies the quick search name, and clears the flag', () => {
    const { store, hook, cards } = setup();

    sessionStorage.setItem('quickNavReset', 'true');
    navigate('/browse', 'contentType=cards&name=Lightning%20Bolt');
    hook.rerender();

    expect(cards().name).toBe('Lightning Bolt');
    expect(cards()).not.toHaveProperty('artist');
    expect(cards()).not.toHaveProperty('selectedGoalId');
    expect(store.getState().browse.viewContentType).toBe('cards');
    expect(sessionStorage.getItem('quickNavReset')).toBeNull();
  });

  it('switches to the content type in the URL', () => {
    const { store, hook } = setup();

    sessionStorage.setItem('quickNavReset', 'true');
    navigate('/browse', 'contentType=sets');
    hook.rerender();

    expect(store.getState().browse.viewContentType).toBe('sets');
  });

  it('ignores an unknown content type', () => {
    const { store, hook } = setup();

    sessionStorage.setItem('quickNavReset', 'true');
    navigate('/browse', 'contentType=decks');
    hook.rerender();

    expect(store.getState().browse.viewContentType).toBe('cards');
  });

  it('only resets once per flag', () => {
    const { store, hook, cards } = setup();

    sessionStorage.setItem('quickNavReset', 'true');
    navigate('/browse', 'name=Bolt');
    hook.rerender();

    store.dispatch(setArtist('Picked after'));
    navigate('/browse', 'name=Bolt&page=2');
    hook.rerender();

    expect(cards()).toMatchObject({ name: 'Bolt', artist: 'Picked after' });
  });
});
