/**
 * Covers how the goal editor's Specific Cards field labels the cards a goal already
 * references. Those ids come from the saved goal, not from a search, so they can point at
 * printings that have since been deprecated (hidden from search) or removed entirely.
 *
 * Before 2026-09-09 every unresolved id re-fired a search on each render, which is the
 * request storm in the "Specific Cards field never finishes loading" report. These tests
 * pin the one-batched-lookup contract as much as the labels.
 */
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import CardSelector from '../CardSelector';

const LIVE_CARD = { id: '1', name: 'Drake Token (M13) (4)', setName: 'Magic 2013 Tokens', deprecated: false };
const DEPRECATED_CARD = {
  id: '2',
  name: 'Drake Token (C15) (6)',
  setName: 'Commander 2015 Tokens',
  deprecated: true,
  replacedByCardId: '108744',
};

const lookupCardsByIds = jest.fn();
const searchCards = jest.fn();

jest.mock('@/api/cards/cardsApi', () => ({
  useLazyGetCardsByIdsQuery: () => [lookupCardsByIds, {}],
}));

jest.mock('@/api/browse/browseApi', () => ({
  useLazyGetCardsQuery: () => [searchCards, { data: undefined, isFetching: false }],
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { userId: 1337 } }),
}));

jest.mock('@/hooks/usePriceType', () => ({
  usePriceType: () => 'market',
}));

const resolveWith = (cards: unknown[]) => {
  lookupCardsByIds.mockReturnValue({ unwrap: () => Promise.resolve(cards) });
};

const renderSelector = (value: { include: string[]; exclude: string[] }) => {
  const onChange = jest.fn();
  const view = render(<CardSelector value={value} onChange={onChange} />);
  return { ...view, onChange };
};

const chip = (id: string) => screen.getByTestId(`card-selector-chip-${id}`);

describe('CardSelector hydration of saved card ids', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves every saved id with a single batched lookup', async () => {
    resolveWith([LIVE_CARD, DEPRECATED_CARD]);

    renderSelector({ include: ['1'], exclude: ['2', '999'] });

    await waitFor(() => expect(chip('1')).toHaveTextContent('Drake Token (M13) (4)'));
    expect(lookupCardsByIds).toHaveBeenCalledTimes(1);
    expect(lookupCardsByIds).toHaveBeenCalledWith({ ids: [1, 2, 999] });
  });

  it('does not refetch ids that came back empty', async () => {
    resolveWith([LIVE_CARD]);

    const { rerender } = renderSelector({ include: ['1', '999'], exclude: [] });

    await waitFor(() => expect(chip('999')).toHaveTextContent('Card #999'));
    expect(chip('999')).toHaveTextContent('[not found]');

    rerender(<CardSelector value={{ include: ['1', '999'], exclude: [] }} onChange={jest.fn()} />);
    rerender(<CardSelector value={{ include: ['1', '999'], exclude: [] }} onChange={jest.fn()} />);

    expect(lookupCardsByIds).toHaveBeenCalledTimes(1);
  });

  it('labels deprecated cards with their real name and flags them', async () => {
    resolveWith([LIVE_CARD, DEPRECATED_CARD]);

    renderSelector({ include: ['1'], exclude: ['2'] });

    await waitFor(() => expect(chip('2')).toHaveTextContent('Drake Token (C15) (6)'));
    expect(chip('2')).toHaveTextContent('[Commander 2015 Tokens]');
    expect(chip('2')).toHaveTextContent('[replaced]');
    expect(chip('2')).toHaveAttribute('data-deprecated', 'true');
    expect(chip('1')).not.toHaveTextContent('[replaced]');
    expect(chip('1')).not.toHaveAttribute('data-deprecated');
  });

  it('shows a notice linking to the Update Cards page when any selected card is deprecated', async () => {
    resolveWith([LIVE_CARD, DEPRECATED_CARD]);

    renderSelector({ include: ['1'], exclude: ['2'] });

    const notice = await screen.findByTestId('card-selector-deprecated-notice');
    expect(notice).toHaveTextContent('1 of these cards has been replaced by an updated entry');
    expect(notice).toHaveTextContent('no longer counts toward goals');
    expect(screen.getByRole('link', { name: 'Update Cards' })).toHaveAttribute('href', '/collections/1337/migrate');
  });

  it('pluralises the notice for several deprecated cards', async () => {
    resolveWith([DEPRECATED_CARD, { ...DEPRECATED_CARD, id: '3', name: 'Drake Token (C19) (8)' }]);

    renderSelector({ include: [], exclude: ['2', '3'] });

    const notice = await screen.findByTestId('card-selector-deprecated-notice');
    expect(notice).toHaveTextContent('2 of these cards have been replaced by updated entries');
  });

  it('shows no notice when every selected card is live', async () => {
    resolveWith([LIVE_CARD]);

    renderSelector({ include: ['1'], exclude: [] });

    await waitFor(() => expect(chip('1')).toHaveTextContent('Drake Token (M13) (4)'));
    expect(screen.queryByTestId('card-selector-deprecated-notice')).not.toBeInTheDocument();
  });

  it('falls back to the id when the lookup fails, without retrying', async () => {
    lookupCardsByIds.mockReturnValue({ unwrap: () => Promise.reject(new Error('network')) });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = renderSelector({ include: ['1'], exclude: [] });

    await waitFor(() => expect(chip('1')).toHaveTextContent('Card #1'));
    rerender(<CardSelector value={{ include: ['1'], exclude: [] }} onChange={jest.fn()} />);

    expect(lookupCardsByIds).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
