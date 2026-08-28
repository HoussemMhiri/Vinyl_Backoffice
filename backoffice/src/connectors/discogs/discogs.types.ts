export type DiscogsSearchResult = {
  releaseId: string;
  masterId?: string;
  title: string;
  artist: string;
  year?: number;
  country?: string;
  format?: string;
  label?: string;
  thumbnailUrl?: string;
};

export type DiscogsRelease = DiscogsSearchResult & {
  genres?: string[];
  tracklist?: { position: string; title: string }[];
};

export type ListingPayload = {
  release_id: number;
  condition: string;
  sleeve_condition?: string;
  price: number;
  comments?: string;
  external_id?: string;
  status: 'For Sale' | 'Draft';
};

export type PublishResult = {
  externalListingId: string;
  externalUrl: string;
  publishedPrice: number;
};

export type LocalStockResult = {
  saleStatus: 'available' | 'sold' | 'out_of_stock';
  quantity: number;
};
