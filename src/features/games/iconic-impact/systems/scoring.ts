import { Icon } from '../types';
import { ICON_SIZE, GAME_HEIGHT, GROUND_HEIGHT, BASE_POINTS, MAX_DISTANCE_BONUS } from '../constants';

export function calculatePoints(icon: Icon): number {
  // Calculate bonus based on distance from ground (farther from ground = more points)
  const distanceFromTop = icon.y + ICON_SIZE;
  const maxDistance = GAME_HEIGHT - GROUND_HEIGHT;
  const percentageFallen = distanceFromTop / maxDistance;
  const distanceBonus = Math.max(0, Math.floor((1 - percentageFallen) * MAX_DISTANCE_BONUS));

  return BASE_POINTS + distanceBonus;
}

export function calculateFinalScore(
  correctGuesses: number,
  totalScore: number,
  livesRemaining: number
): number {
  // Could add bonus for lives remaining if desired
  return totalScore;
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function getScoreMessage(points: number): string {
  return `Correct! +${points} points`;
}