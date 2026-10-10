/**
 * The "For" dropdown on both bulk tools: Mass Update (one set) and Mass Entry (cards on the page).
 * Commons come in two flavors because Scryfall files basic lands as common.
 */

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import MassEntryPanel from '../MassEntryPanel';
import MassUpdatePanel from '../MassUpdatePanel';
import { getMassUpdateRarityLabel } from '../massUpdateRarities';

const EXPECTED_OPTIONS = [
  'All cards',
  'All commons (w/basic lands)',
  'All commons (w/o basic lands)',
  'All uncommons',
  'All rares',
  'All mythics',
  'All special cards',
  'All basic lands',
];

const openRarityMenu = () => {
  fireEvent.mouseDown(screen.getByRole('combobox'));
  return screen.getByRole('listbox');
};

const panels: Array<[string, (onSubmit: jest.Mock) => React.ReactElement, string]> = [
  ['MassUpdatePanel', (onSubmit) => <MassUpdatePanel isOpen onSubmit={onSubmit} onCancel={jest.fn()} />, 'in this set'],
  [
    'MassEntryPanel',
    (onSubmit) => <MassEntryPanel isOpen onSubmit={onSubmit} onCancel={jest.fn()} cardCount={24} />,
    'on this page',
  ],
];

describe.each(panels)('%s rarity dropdown', (_name, renderPanel, scope) => {
  it('offers both commons choices and no plain "All commons"', () => {
    render(renderPanel(jest.fn()));
    const options = within(openRarityMenu()).getAllByRole('option').map((option) => option.textContent);

    expect(options).toEqual(EXPECTED_OPTIONS);
  });

  it.each([
    ['All commons (w/basic lands)', 'common', 'commons (including basic lands)'],
    ['All commons (w/o basic lands)', 'commonNoBasicLand', 'commons (excluding basic lands)'],
    ['All basic lands', 'basicLand', 'basic lands'],
    ['All special cards', 'special', 'special cards'],
  ])('choosing "%s" describes it and submits rarity %s', (menuLabel, value, label) => {
    const onSubmit = jest.fn();
    render(renderPanel(onSubmit));

    fireEvent.click(within(openRarityMenu()).getByRole('option', { name: menuLabel }));
    expect(screen.getByText(`Set all ${label} ${scope} to 0 regular and 0 foil.`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ rarity: value, mode: 'set' }));
  });
});

describe('getMassUpdateRarityLabel', () => {
  it('falls back to the raw value for anything unknown', () => {
    expect(getMassUpdateRarityLabel('bonus')).toBe('bonus');
  });
});
