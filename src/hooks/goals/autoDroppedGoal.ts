/**
 * One-shot note that the selected goal was dropped by the app, not by the user (a goal on
 * Browse, or a goal the collection's owner doesn't have).
 *
 * The URL write that follows replaces the history entry instead of adding one. Otherwise Back
 * lands on the old ?goalId= address, the goal is dropped again, and a new entry is pushed, so
 * Back never leaves the page.
 */
let pending = false;

export const noteGoalDroppedAutomatically = () => {
  pending = true;
};

export const takeGoalDroppedAutomatically = (): boolean => {
  const wasPending = pending;
  pending = false;
  return wasPending;
};
