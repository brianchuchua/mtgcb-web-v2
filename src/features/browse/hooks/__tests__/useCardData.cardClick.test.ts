import { act } from '@testing-library/react';
import { mockNextNavigation } from '@/__tests__/utils/mockHelpers';
import { renderHookWithRedux } from '@/__tests__/utils/testUtils';
import { generateCardSlug } from '@/utils/cards/generateCardSlug';
import { useCardData } from '../useCardData';

jest.mock('@/api/browse/browseApi', () => ({
  useGetCardsQuery: () => ({ data: undefined, isLoading: false, isFetching: false, refetch: jest.fn() }),
  useGetGoalSummaryQuery: () => ({ data: undefined, isFetching: false, refetch: jest.fn() }),
}));

jest.mock('@/hooks/usePriceType', () => ({
  usePriceType: () => 'market',
}));

jest.mock('@/contexts/DisplaySettingsContext', () => ({
  useCardDisplaySettings: () => ({ locationsIsVisible: false }),
  useCollectionSettings: () => ({ tableLocationsIsVisible: false }),
}));

const clickCard = (cardName: string | undefined, userId?: number) => {
  const { push } = mockNextNavigation();
  const props = { searchParams: {}, pagination: { currentPage: 1, pageSize: 20 }, skip: true, userId };
  const { result } = renderHookWithRedux(() => useCardData(props));
  act(() => result.current.handleCardClick('42', cardName));
  return push.mock.calls[0][0];
};

describe('useCardData card click', () => {
  it.each([
    ["Urza's Saga", '/browse/cards/urzas-saga/42'],
    ['Fire // Ice', '/browse/cards/fire-ice/42'],
    ['Lim-Dûl the Necromancer', '/browse/cards/lim-dl-the-necromancer/42'],
  ])('builds the same slug as generateCardSlug for %j', (name, url) => {
    expect(clickCard(name)).toBe(url);
    expect(url).toContain(`/${generateCardSlug(name)}/`);
  });

  it('uses the collection card URL when a user is set', () => {
    expect(clickCard("Urza's Saga", 7)).toBe('/collections/7/cards/urzas-saga/42');
  });

  it('falls back to "unknown" with no name', () => {
    expect(clickCard(undefined)).toBe('/browse/cards/unknown/42');
  });
});
