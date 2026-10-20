/**
 * Unit tests for EditableCardQuantity's debounced saves (grid and card page
 * quantity control).
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { EditableCardQuantity } from '../EditableCardQuantity';

const mockUpdateCollection = jest.fn();

jest.mock('@/api/collections/collectionsApi', () => ({
  useUpdateCollectionMutation: () => [mockUpdateCollection],
}));

// Stable across renders, like the real hook. A new function each render would
// rebuild the debounced saves every render and hide what's being tested.
const mockEnqueueSnackbar = jest.fn();
jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

// Regular's + is the first Add icon, Foil's the second.
const plusButtons = () => screen.getAllByTestId('AddIcon').map((icon) => icon.closest('button')!);

const clickPlus = (field: 'regular' | 'foil') => {
  fireEvent.mouseDown(plusButtons()[field === 'regular' ? 0 : 1]);
};

const sentCards = () => mockUpdateCollection.mock.calls.map(([arg]) => arg.cards[0]);

describe('EditableCardQuantity saves', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUpdateCollection.mockReset();
    mockUpdateCollection.mockImplementation(() => ({
      unwrap: () => Promise.resolve({ success: true }),
      abort: jest.fn(),
    }));
    render(<EditableCardQuantity cardId={7182} cardName="Llanowar Elves" quantityReg={0} quantityFoil={0} />);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('saves both fields when Foil is clicked while the Regular save is still waiting', async () => {
    for (let i = 0; i < 4; i++) clickPlus('regular');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    for (let i = 0; i < 5; i++) clickPlus('foil');

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(sentCards()).toEqual(
      expect.arrayContaining([
        { cardId: 7182, quantityReg: 4 },
        { cardId: 7182, quantityFoil: 5 },
      ]),
    );
    expect(mockUpdateCollection).toHaveBeenCalledTimes(2);
  });

  it('still collapses quick clicks on one field into a single save', async () => {
    for (let i = 0; i < 3; i++) clickPlus('regular');

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(sentCards()).toEqual([{ cardId: 7182, quantityReg: 3 }]);
  });

  it('sends only the field that changed', async () => {
    clickPlus('foil');

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(sentCards()).toEqual([{ cardId: 7182, quantityFoil: 1 }]);
  });
});
