import { formatBorderColorName, formatFrameEffectName } from '@/features/browse/treatmentLabels';

/**
 * The treatment vocabularies are served from the data, not hardcoded, so the
 * label helpers have to stay total: an unrecognised token must still render
 * something readable rather than blank or undefined.
 */
describe('treatmentLabels', () => {
  describe('formatFrameEffectName', () => {
    it('gives the treatments users search for real names', () => {
      expect(formatFrameEffectName('extendedart')).toBe('Extended Art');
      expect(formatFrameEffectName('showcase')).toBe('Showcase');
      expect(formatFrameEffectName('shatteredglass')).toBe('Shattered Glass');
    });

    it('distinguishes the fullart frame effect from the full art flag', () => {
      expect(formatFrameEffectName('fullart')).toBe('Full Art Frame');
    });

    it('marks double-faced frame effects', () => {
      expect(formatFrameEffectName('sunmoondfc')).toContain('DFC');
      expect(formatFrameEffectName('originpwdfc')).toContain('DFC');
    });

    it('falls back to a readable label for an unknown token', () => {
      expect(formatFrameEffectName('brandnewtreatment')).toBe('Brandnewtreatment');
    });

    it('never returns an empty label for a non-empty token', () => {
      const vocabulary = [
        'borderless',
        'colorshifted',
        'companion',
        'compasslanddfc',
        'convertdfc',
        'dazzlefoil',
        'devoid',
        'draft',
        'enchantment',
        'etched',
        'extendedart',
        'fandfc',
        'fullart',
        'inverted',
        'legendary',
        'lesson',
        'miracle',
        'mooneldrazidfc',
        'originpwdfc',
        'shatteredglass',
        'showcase',
        'snow',
        'spree',
        'storyspotlight',
        'sunmoondfc',
        'tombstone',
        'upsidedowndfc',
        'vehicle',
        'waxingandwaningmoondfc',
      ];

      for (const token of vocabulary) {
        const label = formatFrameEffectName(token);
        expect(label.length).toBeGreaterThan(0);
        expect(label).not.toBe('undefined');
      }
    });

    it('produces a distinct label for every known token', () => {
      const tokens = ['extendedart', 'showcase', 'inverted', 'legendary', 'etched', 'fullart', 'borderless'];
      const labels = tokens.map(formatFrameEffectName);

      expect(new Set(labels).size).toBe(tokens.length);
    });
  });

  describe('formatBorderColorName', () => {
    it('capitalizes the border colours', () => {
      expect(formatBorderColorName('borderless')).toBe('Borderless');
      expect(formatBorderColorName('black')).toBe('Black');
      expect(formatBorderColorName('gold')).toBe('Gold');
    });

    it('handles an unknown border colour', () => {
      expect(formatBorderColorName('chartreuse')).toBe('Chartreuse');
    });
  });
});
