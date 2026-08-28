import type { DiscogsRelease } from './discogs.types';

export const MOCK_RELEASES: DiscogsRelease[] = [
  {
    releaseId: '123456',
    masterId: '654321',
    title: 'Discovery',
    artist: 'Daft Punk',
    year: 2001,
    country: 'France',
    format: '2xLP',
    label: 'Virgin',
    genres: ['Electronic'],
    tracklist: [
      { position: 'A1', title: 'One More Time' },
      { position: 'A2', title: 'Aerodynamic' },
    ],
  },
  {
    releaseId: '789012',
    masterId: '210987',
    title: 'Homework',
    artist: 'Daft Punk',
    year: 1997,
    country: 'France',
    format: '2xLP',
    label: 'Virgin',
    genres: ['Electronic'],
  },
];

export const MOCK_LISTING = {
  externalListingId: 'discogs-listing-0001',
  externalUrl: 'https://www.discogs.com/sell/item/discogs-listing-0001',
};
