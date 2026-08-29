/**
 * Display names for card treatments.
 *
 * The vocabularies come from `/cards/treatments`, which derives them from the data,
 * so any token the importer writes can appear here. These maps cover the tokens
 * that exist today; anything unrecognised falls back to a readable form rather
 * than being hidden, so a newly minted Scryfall frame effect still shows up.
 */

const FRAME_EFFECT_LABELS: Record<string, string> = {
  borderless: 'Borderless',
  colorshifted: 'Color Shifted',
  companion: 'Companion',
  compasslanddfc: 'Compass Land (DFC)',
  convertdfc: 'Convert (DFC)',
  dazzlefoil: 'Dazzle Foil',
  devoid: 'Devoid',
  draft: 'Draft',
  enchantment: 'Enchantment Frame',
  etched: 'Etched',
  extendedart: 'Extended Art',
  fandfc: 'Fan (DFC)',
  fullart: 'Full Art Frame',
  inverted: 'Inverted',
  legendary: 'Legendary Frame',
  lesson: 'Lesson',
  miracle: 'Miracle',
  mooneldrazidfc: 'Moon Eldrazi (DFC)',
  originpwdfc: 'Origin Planeswalker (DFC)',
  shatteredglass: 'Shattered Glass',
  showcase: 'Showcase',
  snow: 'Snow',
  spree: 'Spree',
  storyspotlight: 'Story Spotlight',
  sunmoondfc: 'Sun and Moon (DFC)',
  tombstone: 'Tombstone',
  upsidedowndfc: 'Upside Down (DFC)',
  vehicle: 'Vehicle',
  waxingandwaningmoondfc: 'Waxing and Waning Moon (DFC)',
};

/**
 * Scryfall's base `frame` era. The years alone mean nothing to most collectors,
 * so each is paired with the name the community uses for it — 1997 in
 * particular is the one Wizards themselves reprint as "retro frame".
 */
const FRAME_STYLE_LABELS: Record<string, string> = {
  '1993': '1993 Original',
  '1997': '1997 Retro',
  '2003': '2003 Modern',
  '2015': '2015 Current',
  future: 'Future Sight',
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

export const formatFrameEffectName = (effect: string): string =>
  FRAME_EFFECT_LABELS[effect] ?? capitalize(effect);

export const formatBorderColorName = (borderColor: string): string => capitalize(borderColor);

export const formatFrameStyleName = (frameStyle: string): string =>
  FRAME_STYLE_LABELS[frameStyle] ?? capitalize(frameStyle);
