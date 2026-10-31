import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { LONG_PRESS_MS, useLongPressReveal } from '../useLongPressReveal';

// jsdom has no PointerEvent, so fireEvent would drop pointerType without this stand-in
beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    class PointerEventStub extends MouseEvent {
      pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerType = init.pointerType ?? '';
      }
    }
    (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventStub;
  }
});

const Card = ({ enabled = true }: { enabled?: boolean }) => {
  const { revealed, handlers } = useLongPressReveal(enabled);
  return (
    <div>
      <div data-testid="card" data-revealed={String(revealed)} {...handlers}>
        <img data-testid="image" alt="" />
      </div>
      <div data-testid="elsewhere" />
    </div>
  );
};

const revealed = () => screen.getByTestId('card').getAttribute('data-revealed');
const press = (pointerType: string, target = 'image') => fireEvent.pointerDown(screen.getByTestId(target), { pointerType });

describe('useLongPressReveal', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('reveals after a long touch press and stays revealed after lifting', () => {
    render(<Card />);
    press('touch');
    act(() => jest.advanceTimersByTime(LONG_PRESS_MS - 1));
    expect(revealed()).toBe('false');
    act(() => jest.advanceTimersByTime(1));
    expect(revealed()).toBe('true');
    fireEvent.pointerUp(screen.getByTestId('image'), { pointerType: 'touch' });
    expect(revealed()).toBe('true');
  });

  it('does nothing on a quick tap', () => {
    render(<Card />);
    press('touch');
    act(() => jest.advanceTimersByTime(150));
    fireEvent.pointerUp(screen.getByTestId('image'), { pointerType: 'touch' });
    act(() => jest.advanceTimersByTime(LONG_PRESS_MS * 2));
    expect(revealed()).toBe('false');
  });

  it('does nothing when the press turns into a scroll', () => {
    render(<Card />);
    press('touch');
    fireEvent.pointerCancel(screen.getByTestId('image'), { pointerType: 'touch' });
    act(() => jest.advanceTimersByTime(LONG_PRESS_MS * 2));
    expect(revealed()).toBe('false');
  });

  it('reveals on a touch contextmenu even if the pointer was cancelled first', () => {
    render(<Card />);
    press('touch');
    fireEvent.pointerCancel(screen.getByTestId('image'), { pointerType: 'touch' });
    fireEvent.contextMenu(screen.getByTestId('image'));
    expect(revealed()).toBe('true');
  });

  it('ignores mouse presses and right-clicks', () => {
    render(<Card />);
    press('mouse');
    act(() => jest.advanceTimersByTime(LONG_PRESS_MS * 2));
    fireEvent.contextMenu(screen.getByTestId('image'));
    expect(revealed()).toBe('false');
  });

  it('fades again on the next touch outside the card, not inside it', () => {
    render(<Card />);
    press('touch');
    act(() => jest.advanceTimersByTime(LONG_PRESS_MS));
    expect(revealed()).toBe('true');
    fireEvent.pointerDown(screen.getByTestId('image'), { pointerType: 'touch' });
    expect(revealed()).toBe('true');
    fireEvent.pointerDown(screen.getByTestId('elsewhere'), { pointerType: 'touch' });
    expect(revealed()).toBe('false');
  });

  it('swallows the click that ends a long-press but not a tap', () => {
    const clicks: boolean[] = [];
    render(<Card />);
    const image = screen.getByTestId('image');
    image.addEventListener('click', (e) => clicks.push(e.defaultPrevented));

    press('touch');
    act(() => jest.advanceTimersByTime(LONG_PRESS_MS));
    fireEvent.pointerUp(image, { pointerType: 'touch' });
    fireEvent.click(image);

    press('touch');
    fireEvent.pointerUp(image, { pointerType: 'touch' });
    fireEvent.click(image);

    // The long-press click is stopped before it reaches the image; the tap's click gets through
    expect(clicks).toEqual([false]);
  });

  it('never reveals a card that is not faded', () => {
    render(<Card enabled={false} />);
    press('touch');
    act(() => jest.advanceTimersByTime(LONG_PRESS_MS * 2));
    fireEvent.contextMenu(screen.getByTestId('image'));
    expect(revealed()).toBe('false');
  });
});
