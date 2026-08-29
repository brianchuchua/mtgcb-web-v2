/**
 * Covers the Frames and Release Date filters in the goal builder — the pair that
 * makes "collect every retro frame card" expressible.
 *
 * Neither half is enough on its own: `frameStyle: 1997` sweeps in every card that
 * wore that frame in the nineties, and a date range says nothing about the frame.
 * So the cases that matter are the two arriving together, and a saved goal
 * loading both back into the form without losing the date bound.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { GoalSearchForm } from '../GoalSearchForm';

// RTK Query hands back referentially stable results; these mocks must too. The
// form's option effects key off the whole response object, so returning a fresh
// literal per render would spin them forever.
const CARD_TYPES = {
  data: { cardTypes: ['Land', 'Creature'], superTypes: ['Basic', 'Legendary'], landTypes: ['Forest'] },
};
const CARD_LAYOUTS = { data: { layouts: ['normal'] } };
const ALL_SETS = {
  data: { data: { sets: [{ id: 1, name: 'Zendikar', code: 'ZEN', releasedAt: '2009-10-02' }] } },
};
const SET_TYPES = { data: { data: [{ label: 'Core', value: 'core' }] } };
const CARD_TREATMENTS = {
  data: {
    borderColors: ['black', 'borderless'],
    frameStyles: ['1993', '1997', '2003', '2015', 'future'],
    frameEffects: ['extendedart', 'showcase'],
  },
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

interface Options {
  conditions?: Record<string, unknown>;
  onePrintingPerPureName?: boolean;
}

const renderForm = ({ conditions = {}, onePrintingPerPureName = true }: Options = {}) => {
  const onChange = jest.fn();
  const onOnePrintingPerPureNameChange = jest.fn();

  render(
    <GoalSearchForm
      searchConditions={conditions as never}
      onChange={onChange}
      onePrintingPerPureName={onePrintingPerPureName}
      onOnePrintingPerPureNameChange={onOnePrintingPerPureNameChange}
    />,
  );

  return { onChange, onOnePrintingPerPureNameChange };
};

const lastConditions = (onChange: jest.Mock) => onChange.mock.calls.at(-1)?.[0] ?? {};

const fromField = () => screen.getByRole('textbox', { name: /^From$/i });
const toField = () => screen.getByRole('textbox', { name: /^To$/i });

describe('GoalSearchForm — Release Date filter', () => {
  it('emits a from-only bound as a single comparison token', () => {
    const { onChange } = renderForm();

    fireEvent.change(fromField(), { target: { value: '2019' } });

    expect(lastConditions(onChange).releasedAt).toBe('>=2019');
  });

  it('emits a to-only bound as a single comparison token', () => {
    const { onChange } = renderForm();

    fireEvent.change(toField(), { target: { value: '2003' } });

    expect(lastConditions(onChange).releasedAt).toBe('<=2003');
  });

  it('emits both bounds as an inclusive AND range', () => {
    const { onChange } = renderForm();

    fireEvent.change(fromField(), { target: { value: '2019' } });
    fireEvent.change(toField(), { target: { value: '2021' } });

    expect(lastConditions(onChange).releasedAt).toEqual({ AND: ['>=2019', '<=2021'] });
  });

  it('accepts month and day precision', () => {
    const { onChange } = renderForm();

    fireEvent.change(fromField(), { target: { value: '2019-07-12' } });

    expect(lastConditions(onChange).releasedAt).toBe('>=2019-07-12');
  });

  it('drops the criterion when the bound is cleared', () => {
    const { onChange } = renderForm();

    fireEvent.change(fromField(), { target: { value: '2019' } });
    fireEvent.change(fromField(), { target: { value: '' } });

    expect(lastConditions(onChange)).not.toHaveProperty('releasedAt');
  });

  it('emits no release criterion when the fields are untouched', () => {
    const { onChange } = renderForm();

    expect(lastConditions(onChange)).not.toHaveProperty('releasedAt');
  });

  /**
   * A half-typed bound must not be flagged as valid, but it also must not be
   * silently swallowed — the field shows the error so the user sees why the
   * count did not move.
   */
  it('marks an unparseable bound as an error', () => {
    renderForm();

    fireEvent.change(fromField(), { target: { value: 'last tuesday' } });

    expect(fromField()).toBeInvalid();
  });

  it('does not flag a well-formed bound', () => {
    renderForm();

    fireEvent.change(fromField(), { target: { value: '2019-07' } });

    expect(fromField()).toBeValid();
  });
});

describe('GoalSearchForm — loading a saved goal', () => {
  it('reads a from bound back out of the saved comparison token', () => {
    renderForm({ conditions: { releasedAt: '>=2019' } });

    expect(fromField()).toHaveValue('2019');
    expect(toField()).toHaveValue('');
  });

  it('reads both bounds back out of a saved range', () => {
    renderForm({ conditions: { releasedAt: { AND: ['>=2019', '<=2021'] } } });

    expect(fromField()).toHaveValue('2019');
    expect(toField()).toHaveValue('2021');
  });

  it('leaves the fields empty for a saved criterion the form cannot express', () => {
    renderForm({ conditions: { releasedAt: { OR: ['2019', '2021'] } } });

    expect(fromField()).toHaveValue('');
    expect(toField()).toHaveValue('');
  });

  /**
   * The round trip that matters: a saved retro frame goal must come back out
   * carrying both criteria, or reopening it and pressing save would quietly
   * rewrite the goal.
   */
  it('preserves a saved retro frame goal through a re-emit', () => {
    const { onChange } = renderForm({
      conditions: { frameStyle: { OR: ['1997'] }, releasedAt: '>=2019' },
    });

    fireEvent.change(toField(), { target: { value: '2026' } });

    const conditions = lastConditions(onChange);
    expect(conditions.frameStyle).toEqual({ OR: ['1997'] });
    expect(conditions.releasedAt).toEqual({ AND: ['>=2019', '<=2026'] });
  });
});

describe('GoalSearchForm — Frames filter', () => {
  it('offers the frame eras under readable names', () => {
    renderForm();

    expect(screen.getByRole('combobox', { name: /Frames/i })).toBeInTheDocument();
  });

  it('keeps a saved frame style criterion when another filter changes', () => {
    const { onChange } = renderForm({ conditions: { frameStyle: { OR: ['1993', '1997'] } } });

    fireEvent.change(fromField(), { target: { value: '2019' } });

    expect(lastConditions(onChange).frameStyle).toEqual({ OR: ['1993', '1997'] });
  });

  it('does not confuse the frame style criterion with frame effects', () => {
    const { onChange } = renderForm({
      conditions: { frameStyle: { OR: ['1997'] }, frameEffects: { OR: ['showcase'] } },
    });

    fireEvent.change(fromField(), { target: { value: '2019' } });

    const conditions = lastConditions(onChange);
    expect(conditions.frameStyle).toEqual({ OR: ['1997'] });
    expect(conditions.frameEffects).toEqual({ OR: ['showcase'] });
  });
});
