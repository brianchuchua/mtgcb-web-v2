import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

export const LONG_PRESS_MS = 400;

/**
 * Touch version of hover for faded goal cards. A long-press brightens the card and it stays
 * bright until the next touch somewhere else, like the hover phones fake. A quick tap does
 * nothing, so tapping a card to open it doesn't flash it bright first. Letting go after a
 * long-press doesn't open the card, the same as hovering. Mouse and pen are ignored; real
 * hover handles those.
 */
export const useLongPressReveal = (enabled: boolean) => {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerType = useRef<string | null>(null);
  const longPressed = useRef(false);
  const element = useRef<HTMLElement | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      lastPointerType.current = e.pointerType;
      longPressed.current = false;
      if (!enabled || e.pointerType !== 'touch') return;
      element.current = e.currentTarget;
      clearTimer();
      timer.current = setTimeout(() => {
        timer.current = null;
        longPressed.current = true;
        setRevealed(true);
      }, LONG_PRESS_MS);
    },
    [enabled],
  );

  // Lifting early is a tap. A scroll also cancels the pointer, so scrolling never reveals.
  const onPointerEnd = useCallback(() => clearTimer(), []);

  // Android fires contextmenu on a long-press, sometimes cancelling the pointer first
  const onContextMenu = useCallback(() => {
    if (!enabled || lastPointerType.current !== 'touch') return;
    clearTimer();
    longPressed.current = true;
    setRevealed(true);
  }, [enabled]);

  // Some browsers send a click when a long-press ends; don't let it open the card
  const onClickCapture = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    if (!longPressed.current) return;
    longPressed.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Fade again on the next touch outside this card
  useEffect(() => {
    if (!revealed) return;
    const hide = (e: PointerEvent) => {
      if (element.current && e.target instanceof Node && element.current.contains(e.target)) return;
      setRevealed(false);
    };
    document.addEventListener('pointerdown', hide, true);
    return () => document.removeEventListener('pointerdown', hide, true);
  }, [revealed]);

  useEffect(() => {
    if (!enabled) setRevealed(false);
  }, [enabled]);

  useEffect(() => clearTimer, []);

  return {
    revealed: enabled && revealed,
    handlers: {
      onPointerDown,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onContextMenu,
      onClickCapture,
    },
  };
};
