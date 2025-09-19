export const MAX_GAME_WIDTH = 800;
export const GAME_HEIGHT = 500;
export const ICON_SIZE = 64;
export const FALL_SPEED = 0.1; // 50% slower
export const HINT_THRESHOLDS = [0.2, 0.35, 0.55, 0.75];
export const MAX_CONCURRENT_ICONS = 1; // Configurable: how many icons can fall at once
export const GROUND_HEIGHT = 120; // Height from bottom where icons fail (increased for text)
export const SPAWN_DELAY = 500; // Minimum milliseconds between spawns
export const INITIAL_LIVES = 3;

// Animation durations (in frames)
export const SUCCESS_ANIMATION_DURATION = 540;
export const FAILURE_ANIMATION_DURATION = 720;
export const SUCCESS_FADE_START = 180;
export const FAILURE_FADE_START = 240;

// Scoring
export const BASE_POINTS = 100;
export const MAX_DISTANCE_BONUS = 200;

// Visual settings
export const DANGER_ZONE_OPACITY = 0.05;
export const TITLE_ICON_OPACITY = 0.3;
export const PAUSE_OVERLAY_OPACITY = 0.7;
export const TITLE_OVERLAY_OPACITY = 0.5;

// Title screen
export const TITLE_ICON_COUNT = 5;
export const TITLE_ICON_MIN_SPEED = 0.15;
export const TITLE_ICON_SPEED_VARIANCE = 0.1;

// Text positioning
export const HINT_TEXT_OFFSET = 5;
export const ICON_TEXT_OFFSET = 10;
export const GROUND_TEXT_PADDING = 32;