import { resolveNoteHref } from '../noteLinks';
import { setShareModeConfig } from '@/utils/collectionUrls';

describe('resolveNoteHref', () => {
  afterEach(() => {
    setShareModeConfig(false, null);
  });

  describe('with no collection to point at', () => {
    it.each([null, undefined, 0, -1, 1.5])('leaves browse links alone for userId %p', (userId) => {
      expect(resolveNoteHref('/browse/sets/the-list', userId as number | null | undefined)).toBe(
        '/browse/sets/the-list',
      );
      expect(resolveNoteHref('/browse/cards/sol-ring/71320', userId as number | null | undefined)).toBe(
        '/browse/cards/sol-ring/71320',
      );
    });
  });

  describe('browse set links', () => {
    it('rewrites a set link to the collection set page', () => {
      expect(resolveNoteHref('/browse/sets/mystery-booster', 42)).toBe('/collections/42/mystery-booster');
    });

    it('keeps a trailing slash from breaking the match', () => {
      expect(resolveNoteHref('/browse/sets/mystery-booster/', 42)).toBe('/collections/42/mystery-booster');
    });

    it('carries the original query string across', () => {
      expect(resolveNoteHref('/browse/sets/the-list?view=table', 42)).toBe('/collections/42/the-list?view=table');
    });

    it('carries a fragment across', () => {
      expect(resolveNoteHref('/browse/sets/the-list#subsets', 42)).toBe('/collections/42/the-list#subsets');
    });

    it('does not touch a deeper path that only looks like a set link', () => {
      expect(resolveNoteHref('/browse/sets/the-list/extra', 42)).toBe('/browse/sets/the-list/extra');
    });
  });

  describe('browse card links', () => {
    it('rewrites a card link to the collection card page', () => {
      expect(resolveNoteHref('/browse/cards/sol-ring/71320', 42)).toBe('/collections/42/cards/sol-ring/71320');
    });

    it('rewrites the real note shape authored for The List reconciliation', () => {
      const note =
        '[Rune-Tail, Kitsune Ascendant // Rune-Tail’s Essence](/browse/cards/rune-tail-kitsune-ascendant-rune-tails-essence/43325)';
      const href = note.slice(note.indexOf('(') + 1, -1);
      expect(resolveNoteHref(href, 7)).toBe(
        '/collections/7/cards/rune-tail-kitsune-ascendant-rune-tails-essence/43325',
      );
    });
  });

  describe('browse index links', () => {
    it('rewrites /browse to the collection root', () => {
      expect(resolveNoteHref('/browse', 42)).toBe('/collections/42');
    });

    it('rewrites /browse/sets to the collection sets view', () => {
      expect(resolveNoteHref('/browse/sets', 42)).toBe('/collections/42?contentType=sets');
    });

    it('rewrites /browse/cards to the collection cards view', () => {
      expect(resolveNoteHref('/browse/cards', 42)).toBe('/collections/42?contentType=cards');
    });

    it('merges the original query onto a rewritten index link rather than appending a second ?', () => {
      expect(resolveNoteHref('/browse/cards?artist=Rebecca%20Guay', 42)).toBe(
        '/collections/42?contentType=cards&artist=Rebecca%20Guay',
      );
    });

    it('carries a search on /browse itself', () => {
      expect(resolveNoteHref('/browse?contentType=cards&name=bolt', 42)).toBe(
        '/collections/42?contentType=cards&name=bolt',
      );
    });
  });

  describe('links that are not ours to rewrite', () => {
    it('leaves external https links alone', () => {
      expect(resolveNoteHref('https://scryfall.com/sets/plst', 42)).toBe('https://scryfall.com/sets/plst');
    });

    it('leaves unrelated site paths alone', () => {
      expect(resolveNoteHref('/goals', 42)).toBe('/goals');
    });

    it('leaves a link that already points at a collection alone', () => {
      expect(resolveNoteHref('/collections/9/the-list', 42)).toBe('/collections/9/the-list');
    });

    it('does not rewrite a path that merely starts with the word browse', () => {
      expect(resolveNoteHref('/browsers/sets/the-list', 42)).toBe('/browsers/sets/the-list');
    });
  });

  describe('token-only share mode', () => {
    beforeEach(() => {
      setShareModeConfig(true, 'abc123');
    });

    it('rewrites a set link to the shared path instead of the collection path', () => {
      expect(resolveNoteHref('/browse/sets/the-list', 42)).toBe('/shared/abc123/the-list');
    });

    it('rewrites a card link to the shared path', () => {
      expect(resolveNoteHref('/browse/cards/sol-ring/71320', 42)).toBe('/shared/abc123/cards/sol-ring/71320');
    });

    it('rewrites the browse index to the shared root', () => {
      expect(resolveNoteHref('/browse', 42)).toBe('/shared/abc123');
    });
  });
});
