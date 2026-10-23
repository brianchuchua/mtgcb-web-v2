import { extractBaseName } from '@/utils/cards/extractBaseName';
import { generateCardSlug, generateCardUrl } from '@/utils/cards/generateCardSlug';
import { getCardBackImageUrl, getCardImageUrl } from '@/utils/cards/getCardImageUrl';

describe('extractBaseName', () => {
  it.each([
    ['Animate Wall (Retro Frame)', 'Animate Wall'],
    ['Jace, the Mind Sculptor (Borderless)', 'Jace, the Mind Sculptor'],
    ['Lightning Bolt', 'Lightning Bolt'],
    ['Lightning Bolt (Showcase)  ', 'Lightning Bolt'],
    ['  Lightning Bolt  ', 'Lightning Bolt'],
    ['Name (Note) suffix', 'Name (Note) suffix'],
    // Only the trailing parenthetical is removed.
    ['Card (A) (B)', 'Card (A)'],
  ])('%p -> %p', (input, expected) => {
    expect(extractBaseName(input)).toBe(expected);
  });

  it.each([null, undefined, ''])('returns an empty string for %p', (input) => {
    expect(extractBaseName(input)).toBe('');
  });
});

describe('generateCardSlug', () => {
  it.each([
    ['Lightning Bolt', 'lightning-bolt'],
    ['Jace, the Mind Sculptor', 'jace-the-mind-sculptor'],
    ["Ajani's Pridemate", 'ajanis-pridemate'],
    ['Fire // Ice', 'fire-ice'],
    ['Borrowing 100,000 Arrows', 'borrowing-100000-arrows'],
    ['  Spaced   Out  ', 'spaced-out'],
    ['Half-Orc, Half-', 'half-orc-half'],
    ['--Hyphen--Run--', 'hyphen-run'],
    // Non-ASCII letters are dropped rather than transliterated (current behavior).
    ['Æther Vial', 'ther-vial'],
  ])('%p -> %p', (name, slug) => {
    expect(generateCardSlug(name)).toBe(slug);
  });

  it('builds the browse card url from the slug and id', () => {
    expect(generateCardUrl("Ajani's Pridemate", '42')).toBe('/browse/cards/ajanis-pridemate/42');
  });
});

describe('getCardImageUrl', () => {
  const original = process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE;
    else process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE = original;
  });

  it('uses the configured cache date', () => {
    process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE = '20250101';

    expect(getCardImageUrl('abc')).toBe('https://r2.mtgcollectionbuilder.com/cards/images/normal/abc.jpg?v=20250101');
    expect(getCardBackImageUrl('abc')).toBe(
      'https://r2.mtgcollectionbuilder.com/cards/images/normal/abcb.jpg?v=20250101',
    );
  });

  it('falls back to the default cache date', () => {
    delete process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE;

    expect(getCardImageUrl('abc')).toBe('https://r2.mtgcollectionbuilder.com/cards/images/normal/abc.jpg?v=20241220');
  });
});
