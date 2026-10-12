/**
 * Location dialogs use DualQuantitySelector. A finish the card doesn't come in is disabled,
 * but copies already held in it must still be removable with "-" without the override popup.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DualQuantitySelector } from '../QuantitySelector';

const renderFoilOnlyCard = (regularValue: number) => {
  const onRegularChange = jest.fn();
  render(
    <DualQuantitySelector
      regularValue={regularValue}
      foilValue={0}
      onRegularChange={onRegularChange}
      onFoilChange={jest.fn()}
      canBeNonFoil={false}
      canBeFoil
      onOverrideNonFoil={jest.fn()}
      onOverrideFoil={jest.fn()}
    />,
  );
  const [regularMinus] = screen.getAllByRole('button', { name: 'Decrease quantity' });
  const [regularPlus] = screen.getAllByRole('button', { name: 'Increase quantity' });
  return { onRegularChange, regularMinus, regularPlus };
};

describe('DualQuantitySelector on a finish the card does not come in', () => {
  it('lets "-" remove copies already held in that finish', () => {
    const { onRegularChange, regularMinus } = renderFoilOnlyCard(1);

    expect(regularMinus).toBeEnabled();
    fireEvent.mouseDown(regularMinus);

    expect(onRegularChange).toHaveBeenCalledWith(0);
    expect(screen.queryByText(/Enable Non-Foil Quantity/)).not.toBeInTheDocument();
  });

  it('still blocks adding to that finish', () => {
    const { regularPlus } = renderFoilOnlyCard(1);
    expect(regularPlus).toBeDisabled();
  });

  it('disables "-" once the finish is at 0', () => {
    const { regularMinus } = renderFoilOnlyCard(0);
    expect(regularMinus).toBeDisabled();
  });
});
