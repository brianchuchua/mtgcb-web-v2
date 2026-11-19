/**
 * Covers the Color Identity filter in the goal builder, and that it stays
 * separate from the Colors filter sitting right above it: the two render the
 * same picker, so a click or a saved value landing in the wrong one is the bug
 * to guard against.
 */

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { GoalSearchForm } from '../GoalSearchForm';

// RTK Query hands back referentially stable results; these mocks must too.
const CARD_TYPES = {
  data: { cardTypes: ['Land', 'Creature'], superTypes: ['Basic', 'Legendary'], landTypes: ['Forest'] },
};
const CARD_LAYOUTS = { data: { layouts: ['normal'] } };
const ALL_SETS = {
  data: { data: { sets: [{ id: 1, name: 'Zendikar', code: 'ZEN', releasedAt: '2009-10-02' }] } },
};
const SET_TYPES = { data: { data: [{ label: 'Core', value: 'core' }] } };
const CARD_TREATMENTS = {
  data: { borderColors: ['black'], frameStyles: ['2015'], frameEffects: ['showcase'] },
};

jest.mock('@/api/cards/cardsApi', () => ({
  useGetCardTypesQuery: () => CARD_TYPES,
  useGetCardLayoutsQuery: () => CARD_LAYOUTS,
  useGetCardTreatmentsQuery: () => CARD_TREATMENTS,
}));

jest.mock('@/api/sets/setsApi', () => ({
  useGetAllSetsQuery: () => ALL_SETS,
}));

jest.mock('@/api/browse/browseApi', () => ({
  useGetSetTypesQuery: () => SET_TYPES,
}));

jest.mock('@/components/goals/CardSelector', () => ({
  __esModule: true,
  default: () => null,
}));

const renderForm = (conditions: Record<string, unknown> = {}) => {
  const onChange = jest.fn();

  render(
    <GoalSearchForm
      searchConditions={conditions as never}
      onChange={onChange}
      onePrintingPerPureName
      onOnePrintingPerPureNameChange={jest.fn()}
    />,
  );

  return { onChange };
};

const lastConditions = (onChange: jest.Mock) => onChange.mock.calls.at(-1)?.[0] ?? {};

const identityButton = (color: string) => screen.getByTestId(`goal-color-identity-filter-${color}`);
const colorButton = (color: string) => screen.getByTestId(`goal-color-filter-${color}`);

const chooseMatchType = (testId: string, option: string) => {
  fireEvent.mouseDown(within(screen.getByTestId(testId)).getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: option }));
};

describe('GoalSearchForm — Color Identity filter', () => {
  it('emits nothing when untouched', () => {
    const { onChange } = renderForm();

    expect(lastConditions(onChange)).not.toHaveProperty('color_identities_array');
  });

  it('emits the clicked colors under exactly by default', () => {
    const { onChange } = renderForm();

    fireEvent.click(identityButton('G'));
    fireEvent.click(identityButton('U'));

    expect(lastConditions(onChange).color_identities_array).toEqual({ exactly: ['G', 'U'] });
  });

  it.each([
    ['At Least These Colors', 'atLeast'],
    ['At Most These Colors', 'atMost'],
  ])('emits under the chosen match type: %s', (option, key) => {
    const { onChange } = renderForm();

    fireEvent.click(identityButton('G'));
    chooseMatchType('goal-color-identity-filter-match-type', option);

    expect(lastConditions(onChange).color_identities_array).toEqual({ [key]: ['G'] });
  });

  it('emits a colorless identity as exactly no colors and drops the picked colors', () => {
    const { onChange } = renderForm();

    fireEvent.click(identityButton('G'));
    fireEvent.click(identityButton('C'));

    expect(lastConditions(onChange).color_identities_array).toEqual({ exactly: [] });
    expect(identityButton('G')).toHaveAttribute('aria-pressed', 'false');
  });

  it('turns colorless off again when a color is picked', () => {
    const { onChange } = renderForm();

    fireEvent.click(identityButton('C'));
    fireEvent.click(identityButton('R'));

    expect(lastConditions(onChange).color_identities_array).toEqual({ exactly: ['R'] });
    expect(identityButton('C')).toHaveAttribute('aria-pressed', 'false');
  });

  it('drops the criterion when the last color is unselected', () => {
    const { onChange } = renderForm();

    fireEvent.click(identityButton('G'));
    fireEvent.click(identityButton('G'));

    expect(lastConditions(onChange)).not.toHaveProperty('color_identities_array');
  });
});

describe('GoalSearchForm — Color Identity stays separate from Colors', () => {
  it('does not write an identity click into colors_array', () => {
    const { onChange } = renderForm();

    fireEvent.click(identityButton('G'));

    expect(lastConditions(onChange)).not.toHaveProperty('colors_array');
    expect(colorButton('G')).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not write a color click into color_identities_array', () => {
    const { onChange } = renderForm();

    fireEvent.click(colorButton('G'));

    expect(lastConditions(onChange).colors_array).toEqual({ exactly: ['G'] });
    expect(lastConditions(onChange)).not.toHaveProperty('color_identities_array');
    expect(identityButton('G')).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps separate match types', () => {
    const { onChange } = renderForm();

    fireEvent.click(colorButton('R'));
    fireEvent.click(identityButton('R'));
    fireEvent.click(identityButton('W'));
    chooseMatchType('goal-color-identity-filter-match-type', 'At Most These Colors');

    const conditions = lastConditions(onChange);
    expect(conditions.colors_array).toEqual({ exactly: ['R'] });
    expect(conditions.color_identities_array).toEqual({ atMost: ['R', 'W'] });
  });
});

describe('GoalSearchForm — loading a saved goal with a color identity', () => {
  it.each([
    [{ exactly: ['W', 'U'] }, ['W', 'U']],
    [{ atLeast: ['B'] }, ['B']],
    [{ atMost: ['R', 'G'] }, ['R', 'G']],
    [{ exactly: [] }, ['C']],
  ])('shows %j as selected', (saved, pressed) => {
    renderForm({ color_identities_array: saved });

    for (const color of ['W', 'U', 'B', 'R', 'G', 'C']) {
      expect(identityButton(color)).toHaveAttribute('aria-pressed', String(pressed.includes(color)));
    }
  });

  it('shows the saved match type', () => {
    renderForm({ color_identities_array: { atMost: ['R', 'G'] } });

    expect(within(screen.getByTestId('goal-color-identity-filter-match-type')).getByRole('combobox')).toHaveTextContent(
      'At Most These Colors',
    );
  });

  it('leaves the Colors picker empty', () => {
    renderForm({ color_identities_array: { atMost: ['R', 'G'] } });

    for (const color of ['W', 'U', 'B', 'R', 'G', 'C']) {
      expect(colorButton(color)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  /**
   * Reopening a goal and changing something else must send the identity back
   * unchanged, or saving would quietly rewrite the goal.
   */
  it('re-emits the saved identity when another filter changes', () => {
    const { onChange } = renderForm({
      colors_array: { exactly: [] },
      color_identities_array: { atMost: ['G', 'U'] },
    });

    fireEvent.change(screen.getByRole('textbox', { name: /^Artist$/i }), { target: { value: 'Avon' } });

    const conditions = lastConditions(onChange);
    expect(conditions.colors_array).toEqual({ exactly: [] });
    expect(conditions.color_identities_array).toEqual({ atMost: ['G', 'U'] });
    expect(conditions.artist).toBe('Avon');
  });
});
