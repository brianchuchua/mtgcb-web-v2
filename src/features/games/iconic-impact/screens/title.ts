import { GameStateData, GameConfig, TitleIcon } from '../types';
import { GAME_HEIGHT, ICON_SIZE, TITLE_ICON_COUNT, TITLE_OVERLAY_OPACITY } from '../constants';
import { clearCanvas, drawRect } from '../utils/canvas';
import { drawGradientBackground } from '../entities/effects';
import { drawCenteredText, drawMultilineText } from '../utils/text';
import { createTitleIcon, updateTitleIcon, renderTitleIcon } from '../entities/effects';
import { getRandomInRange } from '../utils/math';
import { updateTitleIcons, cacheImage } from '../state';

export function renderTitleScreen(state: GameStateData, config: GameConfig): GameStateData {
  const ctx = config.canvas.getContext('2d');
  if (!ctx) return state;

  let newState = state;

  // Initialize title icons if needed
  if (state.titleIcons.length === 0 && config.sets.length > 0) {
    newState = initializeTitleIcons(newState, config);
  }

  // Update and render title icons
  newState = updateAndRenderTitleIcons(newState, config, ctx);

  // Draw overlay and text
  drawTitleOverlay(ctx, config.width);
  drawTitleText(ctx, config.width);

  return newState;
}

function initializeTitleIcons(state: GameStateData, config: GameConfig): GameStateData {
  let newState = state;
  const titleIcons: TitleIcon[] = [];

  for (let i = 0; i < TITLE_ICON_COUNT; i++) {
    const randomSet = config.sets[Math.floor(Math.random() * config.sets.length)];
    const iconUrl = `https://svgs.scryfall.io/sets/${randomSet.code.toLowerCase()}.svg`;

    // Preload image
    if (!state.imageCache.has(iconUrl)) {
      const img = new Image();
      img.src = iconUrl;
      newState = cacheImage(newState, iconUrl, img);
    }

    titleIcons.push(createTitleIcon(
      Math.random() * (config.width - ICON_SIZE),
      getRandomInRange(-GAME_HEIGHT / 2, GAME_HEIGHT),
      iconUrl
    ));
  }

  return updateTitleIcons(newState, titleIcons);
}

function updateAndRenderTitleIcons(
  state: GameStateData,
  config: GameConfig,
  ctx: CanvasRenderingContext2D
): GameStateData {
  clearCanvas(ctx, config.width, GAME_HEIGHT);
  drawGradientBackground(ctx, config.width, GAME_HEIGHT, '#1a1a1a', '#0d0d0d');

  const updatedIcons = state.titleIcons.map(icon => {
    const updated = updateTitleIcon(icon, config.width, config.sets, state.titleIcons);

    // Preload new image if needed
    if (!state.imageCache.has(updated.iconUrl)) {
      const img = new Image();
      img.src = updated.iconUrl;
      state = cacheImage(state, updated.iconUrl, img);
    }

    const image = state.imageCache.get(updated.iconUrl);
    renderTitleIcon(ctx, updated, image);

    return updated;
  });

  return updateTitleIcons(state, updatedIcons);
}

function drawTitleOverlay(ctx: CanvasRenderingContext2D, width: number): void {
  const color = `rgba(0, 0, 0, ${TITLE_OVERLAY_OPACITY})`;
  drawRect(ctx, 0, 0, width, GAME_HEIGHT, color);
}

function drawTitleText(ctx: CanvasRenderingContext2D, width: number): void {
  const centerX = width / 2;

  // Draw title
  drawCenteredText(ctx, 'Iconic Impact', centerX, 150, 'bold 48px Arial', '#ffffff');

  // Draw description
  const descriptionLines = [
    'Type the name of the Magic: The Gathering set',
    'before its icon hits the ground!',
    '',
    'As icons fall closer, you\'ll get hints to help identify them.'
  ];

  drawMultilineText(ctx, descriptionLines, centerX, 220, 30, '20px Arial', '#b0b0b0');

  // Draw instructions
  drawCenteredText(ctx, 'Click to Start', centerX, 400, '18px Arial', '#909090');

  // Draw device warning
  drawCenteredText(
    ctx,
    'Best played on desktop with a keyboard',
    centerX,
    440,
    '14px Arial',
    '#707070'
  );
}