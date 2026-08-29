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

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

export const formatFrameEffectName = (effect: string): string =>
  FRAME_EFFECT_LABELS[effect] ?? capitalize(effect);

export const formatBorderColorName = (borderColor: string): string => capitalize(borderColor);
