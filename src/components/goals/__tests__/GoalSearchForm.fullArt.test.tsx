/**
 * Covers the Full Art filter in the goal builder, and the printing-scope prompt it
 * raises.
 *
 * Why the prompt exists: goals default to `onePrintingPerPureName: true`, and full
 * art printings share very few distinct card names (every full art basic land is
 * one of just 12 names). Left alone, "Full Art only" would silently turn a
 * 686-printing goal into a 12-card one, so the form asks instead of guessing.
 */

import React from 'react';
import { fireEvent, render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
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
  data: { borderColors: ['black', 'borderless'], frameEffects: ['extendedart', 'showcase'] },
};

jest.mock('@/api/cards/cardsApi', () => ({
  useGetCardTypesQuery: () => CARD_TYPES,
  useGetCardLayoutsQuery: () => CARD_LAYOUTS,
  useGetCardTreatmentsQuery: () => CARD_TREATMENTS,
}));

// The form only starts emitting conditions once all four option lists are
// populated (the `isInitialized` gate), so every mock has to return real rows.
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

const fullArtGroup = () => within(screen.getByRole('group', { name: 'Full Art filter' }));

// Both filter groups share the "Include all cards" label, so Full Art clicks are
// scoped to their own group.
const clickToggle = (name: string) => fireEvent.click(fullArtGroup().getByRole('button', { name }));

const PROMPT_TITLE = /Count every full art printing\?/i;

describe('GoalSearchForm — Full Art filter', () => {
  it('emits isFullArt true when "Full Art only" is chosen', () => {
    const { onChange } = renderForm();

    clickToggle('Full Art only');

    expect(lastConditions(onChange).isFullArt).toBe(true);
  });

  it('emits isFullArt false when "Exclude Full Art" is chosen', () => {
    const { onChange } = renderForm();

    clickToggle('Exclude Full Art');

    expect(lastConditions(onChange).isFullArt).toBe(false);
  });

  // Uses every-printing scope so the prompt dialog doesn't open and trap focus,
  // which would hide the toggle group behind the modal.
  it('omits isFullArt entirely when the filter is cleared', () => {
    const { onChange } = renderForm({ onePrintingPerPureName: false });

    clickToggle('Full Art only');
    clickToggle('Include all cards');

    expect('isFullArt' in lastConditions(onChange)).toBe(false);
  });

  it('hydrates the toggle from an existing goal', () => {
    renderForm({ conditions: { isFullArt: false } });

    expect(fullArtGroup().getByRole('button', { name: 'Exclude Full Art' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('GoalSearchForm — printing scope prompt', () => {
  it('asks about printing scope when Full Art is turned on with one-printing-per-name', () => {
    renderForm({ onePrintingPerPureName: true });

    clickToggle('Full Art only');

    expect(screen.getByText(PROMPT_TITLE)).toBeInTheDocument();
  });

  it('does not ask when the goal already counts every printing', () => {
    renderForm({ onePrintingPerPureName: false });

    clickToggle('Full Art only');

    expect(screen.queryByText(PROMPT_TITLE)).not.toBeInTheDocument();
  });

  it('does not ask when excluding full art', () => {
    renderForm({ onePrintingPerPureName: true });

    clickToggle('Exclude Full Art');

    expect(screen.queryByText(PROMPT_TITLE)).not.toBeInTheDocument();
  });

  it('switches to every printing when the user accepts', () => {
    const { onOnePrintingPerPureNameChange } = renderForm({ onePrintingPerPureName: true });

    clickToggle('Full Art only');
    fireEvent.click(screen.getByRole('button', { name: 'Count every printing' }));

    expect(onOnePrintingPerPureNameChange).toHaveBeenCalledWith(false);
  });

  it('leaves the printing scope alone when the user declines', async () => {
    const { onOnePrintingPerPureNameChange } = renderForm({ onePrintingPerPureName: true });

    clickToggle('Full Art only');
    fireEvent.click(screen.getByRole('button', { name: 'Keep any printing' }));

    expect(onOnePrintingPerPureNameChange).not.toHaveBeenCalled();
    await waitForElementToBeRemoved(() => screen.queryByText(PROMPT_TITLE));
  });

  it('keeps the full art filter applied whichever scope the user picks', () => {
    const { onChange } = renderForm({ onePrintingPerPureName: true });

    clickToggle('Full Art only');
    fireEvent.click(screen.getByRole('button', { name: 'Keep any printing' }));

    expect(lastConditions(onChange).isFullArt).toBe(true);
  });

  it('warns on an existing goal that pairs full art with one printing per name', () => {
    renderForm({ conditions: { isFullArt: true }, onePrintingPerPureName: true });

    expect(screen.getByText(/far fewer cards than every full art printing/i)).toBeInTheDocument();
  });

  it('drops the warning once the goal counts every printing', () => {
    renderForm({ conditions: { isFullArt: true }, onePrintingPerPureName: false });

    expect(screen.queryByText(/far fewer cards than every full art printing/i)).not.toBeInTheDocument();
  });
});

/**
 * Border colour and frame effect selectors in the goal builder.
 *
 * The two are quoted differently on purpose — border colours exactly match a
 * single-valued column, frame effects match as a substring inside a Postgres
 * array literal — and the goal criteria must preserve that distinction or a
 * compiled goal silently matches the wrong population.
 */
describe('GoalSearchForm — treatment selectors', () => {
  const hasAutocomplete = (label: string) =>
    screen.getByRole('combobox', { name: new RegExp(label, 'i') });

  it('offers a border colour selector', () => {
    renderForm();

    expect(hasAutocomplete('Borders')).toBeInTheDocument();
  });

  it('offers a frame effect selector', () => {
    renderForm();

    expect(hasAutocomplete('Frame Effects')).toBeInTheDocument();
  });

  it('emits no treatment criteria when nothing is selected', () => {
    const { onChange } = renderForm();
    const conditions = lastConditions(onChange);

    expect('borderColor' in conditions).toBe(false);
    expect('frameEffects' in conditions).toBe(false);
  });

  // Selected values render as chips prefixed with an include/exclude marker,
  // so the prefix is asserted alongside the label.
  it('hydrates an included border colour from an existing goal', () => {
    renderForm({ conditions: { borderColor: { OR: ['"borderless"'] } } });

    expect(screen.getByText(/✓\s*Borderless/)).toBeInTheDocument();
  });

  it('hydrates an excluded border colour as a negated chip', () => {
    renderForm({ conditions: { borderColor: { NOT: ['"black"'] } } });

    expect(screen.getByText(/NOT\s*Black/)).toBeInTheDocument();
  });

  it('hydrates a frame effect using its display name, not the raw token', () => {
    renderForm({ conditions: { frameEffects: { OR: ['extendedart'] } } });

    expect(screen.getByText(/✓\s*Extended Art/)).toBeInTheDocument();
    expect(screen.queryByText(/extendedart/)).not.toBeInTheDocument();
  });

  it('preserves an existing goal criteria round trip for both treatments', () => {
    const { onChange } = renderForm({
      conditions: {
        borderColor: { OR: ['"borderless"'] },
        frameEffects: { OR: ['showcase'] },
      },
    });
    const conditions = lastConditions(onChange);

    expect(conditions.borderColor).toEqual({ OR: ['"borderless"'] });
    expect(conditions.frameEffects).toEqual({ OR: ['showcase'] });
  });

  it('keeps frame effect criteria unquoted while border colours stay quoted', () => {
    const { onChange } = renderForm({
      conditions: {
        borderColor: { OR: ['"borderless"'] },
        frameEffects: { OR: ['extendedart'] },
      },
    });
    const conditions = lastConditions(onChange);

    expect(conditions.borderColor.OR[0]).toContain('"');
    expect(conditions.frameEffects.OR[0]).not.toContain('"');
  });

  it('carries treatments alongside the full art filter without conflating them', () => {
    const { onChange } = renderForm({
      conditions: { borderColor: { OR: ['"borderless"'] } },
      onePrintingPerPureName: false,
    });

    clickToggle('Full Art only');
    const conditions = lastConditions(onChange);

    expect(conditions.isFullArt).toBe(true);
    expect(conditions.borderColor).toEqual({ OR: ['"borderless"'] });
  });
});

/**
 * Treatment vocabularies are served from the data, so a token can outlive the
 * option list — three frame effects (dazzlefoil, storyspotlight, vehicle) are
 * expected to drop to zero rows in an upcoming data repair. A saved goal that
 * references one must keep it: silently dropping the criterion here would rewrite
 * the user's goal the moment they pressed save.
 */
describe('GoalSearchForm — treatments no longer in the vocabulary', () => {
  const RETIRED = 'dazzlefoil';

  it('keeps a retired frame effect in the goal criteria', () => {
    const { onChange } = renderForm({ conditions: { frameEffects: { OR: [RETIRED] } } });

    expect(lastConditions(onChange).frameEffects).toEqual({ OR: [RETIRED] });
  });

  it('shows the retired frame effect rather than hiding it', () => {
    renderForm({ conditions: { frameEffects: { OR: [RETIRED] } } });

    expect(screen.getByText(/✓\s*Dazzle Foil/)).toBeInTheDocument();
  });

  it('keeps a retired effect alongside one still in the vocabulary', () => {
    const { onChange } = renderForm({
      conditions: { frameEffects: { OR: ['extendedart', RETIRED] } },
    });

    expect(lastConditions(onChange).frameEffects.OR).toEqual(['extendedart', RETIRED]);
  });

  it('keeps a retired effect on the exclude side', () => {
    const { onChange } = renderForm({ conditions: { frameEffects: { NOT: [RETIRED] } } });

    expect(lastConditions(onChange).frameEffects).toEqual({ NOT: [RETIRED] });
  });

  it('keeps an unknown border colour', () => {
    const { onChange } = renderForm({ conditions: { borderColor: { OR: ['"chartreuse"'] } } });

    expect(lastConditions(onChange).borderColor).toEqual({ OR: ['"chartreuse"'] });
  });

  it('renders an unrecognised token with a readable label, not raw', () => {
    renderForm({ conditions: { frameEffects: { OR: ['brandnewtreatment'] } } });

    expect(screen.getByText(/✓\s*Brandnewtreatment/)).toBeInTheDocument();
  });
});
