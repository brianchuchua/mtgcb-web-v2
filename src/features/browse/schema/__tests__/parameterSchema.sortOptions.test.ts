import { ReactElement } from 'react';
import { getCardSortOptions, getSetSortOptions } from '@/features/browse/BrowseSearchForm/utils/sortOptions';
import { browseParameterSchema } from '@/features/browse/schema/parameterSchema';
import { parseUrlToState } from '@/features/browse/schema/urlStateAdapters';

const menuValues = (items: ReactElement[]) => items.map((item) => (item.props as { value: string }).value);

const schemaOptions = (key: 'cardsSortBy' | 'setsSortBy') => {
  const config = browseParameterSchema[key];
  return config.type === 'enum' ? config.options : [];
};

/**
 * The URL parser drops a sort it doesn't list, and the viewer's saved sort takes over, so a
 * shared link sorted by that option would quietly open in a different order.
 */
describe('parameterSchema — every sort in the menus can be read back from a URL', () => {
  const cardSorts = menuValues(getCardSortOptions(() => false, true));
  const setSorts = menuValues(getSetSortOptions(true));

  it.each(cardSorts)('cards sort "%s" is a cardsSortBy option', (value) => {
    expect(schemaOptions('cardsSortBy')).toContain(value);
  });

  it.each(setSorts)('sets sort "%s" is a setsSortBy option', (value) => {
    expect(schemaOptions('setsSortBy')).toContain(value);
  });

  it.each(cardSorts)('parses cardsSortBy=%s', (value) => {
    expect(parseUrlToState(new URLSearchParams({ cardsSortBy: value }), 'cards').sortBy).toBe(value);
  });

  it.each(setSorts)('parses setsSortBy=%s', (value) => {
    expect(parseUrlToState(new URLSearchParams({ setsSortBy: value }), 'sets').sortBy).toBe(value);
  });
});
