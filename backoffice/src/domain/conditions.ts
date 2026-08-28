export const MEDIA_CONDITIONS = ['M', 'NM', 'VG_PLUS', 'VG', 'G_PLUS', 'G', 'F', 'P'] as const;

export const SLEEVE_ONLY_CONDITIONS = ['GENERIC', 'NOT_GRADED', 'NO_COVER'] as const;

export const SLEEVE_CONDITIONS = [...MEDIA_CONDITIONS, ...SLEEVE_ONLY_CONDITIONS] as const;

export type MediaCondition = (typeof MEDIA_CONDITIONS)[number];
export type SleeveCondition = (typeof SLEEVE_CONDITIONS)[number];

const DISCOGS_GRADING: Record<SleeveCondition, string> = {
  M: 'Mint (M)',
  NM: 'Near Mint (NM or M-)',
  VG_PLUS: 'Very Good Plus (VG+)',
  VG: 'Very Good (VG)',
  G_PLUS: 'Good Plus (G+)',
  G: 'Good (G)',
  F: 'Fair (F)',
  P: 'Poor (P)',
  GENERIC: 'Generic',
  NOT_GRADED: 'Not Graded',
  NO_COVER: 'No Cover',
};

export function toDiscogsCondition(slug: MediaCondition): string {
  return DISCOGS_GRADING[slug];
}

// Discogs accepts three extra values for sleeves that are invalid for the disc itself
export function toDiscogsSleeveCondition(slug: SleeveCondition): string {
  return DISCOGS_GRADING[slug];
}

export function isMediaCondition(value: unknown): value is MediaCondition {
  return MEDIA_CONDITIONS.includes(value as MediaCondition);
}

export function isSleeveCondition(value: unknown): value is SleeveCondition {
  return SLEEVE_CONDITIONS.includes(value as SleeveCondition);
}

export function fromDiscogsCondition(label: string): SleeveCondition | null {
  const entry = Object.entries(DISCOGS_GRADING).find(([, value]) => value === label);

  return entry ? (entry[0] as SleeveCondition) : null;
}
