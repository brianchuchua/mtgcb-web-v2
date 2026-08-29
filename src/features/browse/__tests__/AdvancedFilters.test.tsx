/**
 * Behavioural tests for the browse Advanced Filters panel, which now hosts two
 * independent tri-state toggles (Reserved List and Full Art). The interesting
 * risk is cross-talk: both toggles share one hook, so a bug there would make one
 * filter overwrite the other, or make "Exclude" register as "Only".
 */

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import AdvancedFilters from '../AdvancedFilters';
import { createTestStore, getReduxState } from '@/__tests__/utils/testUtils';
import { RootState } from '@/redux/rootReducer';

const renderPanel = (preloadedState?: Partial<RootState>) => {
  const store = createTestStore(preloadedState);
  const view = render(
    <Provider store={store}>
      <AdvancedFilters />
    </Provider>,
  );
  return { store, ...view };
};

const cardsParams = (store: ReturnType<typeof createTestStore>) =>
  getReduxState(store).browse.cardsSearchParams as Record<string, unknown>;

const group = (label: string) => screen.getByRole('group', { name: label });

const clickIn = (label: string, button: string) => {
  fireEvent.click(within(group(label)).getByRole('button', { name: button }));
};

const expand = () => {
  fireEvent.click(screen.getByText('Advanced Filters'));
};

describe('AdvancedFilters — Full Art toggle', () => {
  it('starts unfiltered and sends nothing to state', () => {
    const { store } = renderPanel();
    expand();

    expect(within(group('Full Art filter')).getByRole('button', { name: 'All cards' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect('isFullArt' in cardsParams(store)).toBe(false);
  });

  it('sets isFullArt true for "Full Art only"', () => {
    const { store } = renderPanel();
    expand();

    clickIn('Full Art filter', 'Full Art only');

    expect(cardsParams(store).isFullArt).toBe(true);
  });

  it('sets isFullArt false for "Exclude Full Art"', () => {
    const { store } = renderPanel();
    expand();

    clickIn('Full Art filter', 'Exclude Full Art');

    expect(cardsParams(store).isFullArt).toBe(false);
  });

  it('clears the filter when returning to "All cards"', () => {
    const { store } = renderPanel();
    expand();

    clickIn('Full Art filter', 'Full Art only');
    clickIn('Full Art filter', 'All cards');

    expect('isFullArt' in cardsParams(store)).toBe(false);
  });

  it('does not touch isReserved when Full Art changes', () => {
    const { store } = renderPanel();
    expand();

    clickIn('Reserved List filter', 'Reserved only');
    clickIn('Full Art filter', 'Exclude Full Art');

    expect(cardsParams(store).isReserved).toBe(true);
    expect(cardsParams(store).isFullArt).toBe(false);
  });

  it('does not touch isFullArt when Reserved List changes', () => {
    const { store } = renderPanel();
    expand();

    clickIn('Full Art filter', 'Full Art only');
    clickIn('Reserved List filter', 'Exclude Reserved');

    expect(cardsParams(store).isFullArt).toBe(true);
    expect(cardsParams(store).isReserved).toBe(false);
  });

  it('reflects a preloaded isFullArt=false as "Exclude Full Art"', () => {
    renderPanel({
      browse: {
        viewContentType: 'cards',
        cardsSearchParams: { isFullArt: false },
        setsSearchParams: {},
      },
    } as unknown as Partial<RootState>);

    expect(within(group('Full Art filter')).getByRole('button', { name: 'Exclude Full Art' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('auto-expands the panel when a full art filter is already active', () => {
    renderPanel({
      browse: {
        viewContentType: 'cards',
        cardsSearchParams: { isFullArt: true },
        setsSearchParams: {},
      },
    } as unknown as Partial<RootState>);

    // The group is only reachable once the Collapse has opened.
    expect(within(group('Full Art filter')).getByRole('button', { name: 'Full Art only' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
