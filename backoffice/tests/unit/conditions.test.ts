import {
  MEDIA_CONDITIONS,
  SLEEVE_CONDITIONS,
  fromDiscogsCondition,
  isMediaCondition,
  isSleeveCondition,
  toDiscogsCondition,
  toDiscogsSleeveCondition,
} from '../../src/domain/conditions';

describe('condition vocabularies', () => {
  it('grades the disc with the eight Discogs values', () => {
    expect(MEDIA_CONDITIONS).toHaveLength(8);
  });

  it('grades the sleeve with three extra values Discogs allows only there', () => {
    expect(SLEEVE_CONDITIONS).toHaveLength(11);
    expect(SLEEVE_CONDITIONS).toEqual(
      expect.arrayContaining(['GENERIC', 'NOT_GRADED', 'NO_COVER'])
    );
  });

  it('does not accept sleeve-only values as a disc grading', () => {
    expect(isMediaCondition('NO_COVER')).toBe(false);
    expect(isSleeveCondition('NO_COVER')).toBe(true);
  });
});

describe('toDiscogsCondition', () => {
  it('maps slugs to the exact strings the Discogs API expects', () => {
    expect(toDiscogsCondition('M')).toBe('Mint (M)');
    expect(toDiscogsCondition('NM')).toBe('Near Mint (NM or M-)');
    expect(toDiscogsCondition('VG_PLUS')).toBe('Very Good Plus (VG+)');
    expect(toDiscogsCondition('G_PLUS')).toBe('Good Plus (G+)');
    expect(toDiscogsCondition('P')).toBe('Poor (P)');
  });

  it('maps the sleeve-only values', () => {
    expect(toDiscogsSleeveCondition('GENERIC')).toBe('Generic');
    expect(toDiscogsSleeveCondition('NOT_GRADED')).toBe('Not Graded');
    expect(toDiscogsSleeveCondition('NO_COVER')).toBe('No Cover');
  });

  it('has a mapping for every sleeve value, so no grading can reach Discogs unmapped', () => {
    for (const slug of SLEEVE_CONDITIONS) {
      expect(typeof toDiscogsSleeveCondition(slug)).toBe('string');
      expect(toDiscogsSleeveCondition(slug)).not.toBe('');
    }
  });
});

describe('fromDiscogsCondition', () => {
  it('round-trips every value back to its slug', () => {
    for (const slug of SLEEVE_CONDITIONS) {
      expect(fromDiscogsCondition(toDiscogsSleeveCondition(slug))).toBe(slug);
    }
  });

  it('returns null for a label Discogs never sends', () => {
    expect(fromDiscogsCondition('Excellent')).toBeNull();
  });
});
