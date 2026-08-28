import { toDiscogsCondition, toDiscogsSleeveCondition } from '../../domain/conditions';
import {
  validateListingPayload,
  type PublishableUnit,
  type ValidationResult,
} from '../../domain/completeness';
import type { MarketplaceConnector } from '../marketplace-connector';
import type {
  DiscogsRelease,
  DiscogsSearchResult,
  ListingPayload,
  LocalStockResult,
  PublishResult,
} from './discogs.types';

const API_BASE = 'https://api.discogs.com';

type DiscogsSearchItem = {
  id: number;
  master_id?: number;
  title: string;
  year?: string | number;
  country?: string;
  format?: string[];
  label?: string[];
  thumb?: string;
};

// Discogs returns "Artist - Title" as a single string on search results
function splitTitle(title: string): { artist: string; title: string } {
  const separator = title.indexOf(' - ');

  return separator === -1
    ? { artist: '', title }
    : { artist: title.slice(0, separator), title: title.slice(separator + 3) };
}

function toSearchResult(item: DiscogsSearchItem): DiscogsSearchResult {
  const { artist, title } = splitTitle(item.title);

  return {
    releaseId: String(item.id),
    masterId: item.master_id ? String(item.master_id) : undefined,
    title,
    artist,
    year: item.year ? Number(item.year) : undefined,
    country: item.country,
    format: item.format?.join(', '),
    label: item.label?.[0],
    thumbnailUrl: item.thumb,
  };
}

export class DiscogsHttpConnector implements MarketplaceConnector {
  readonly channel = 'discogs';
  readonly mode = 'api' as const;

  constructor(
    private readonly token: string,
    private readonly userAgent: string
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T | null> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Discogs token=${this.token}`,
        'User-Agent': this.userAgent,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    // A 404 is an answer, not a failure: the mock returns null for an unknown release
    // and both connectors must behave the same way.
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Discogs ${init.method ?? 'GET'} ${path} failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async searchReleases(query: string): Promise<DiscogsSearchResult[]> {
    const params = new URLSearchParams({ q: query, type: 'release', per_page: '10' });
    const body = await this.request<{ results: DiscogsSearchItem[] }>(
      `/database/search?${params}`
    );

    return body ? body.results.map(toSearchResult) : [];
  }

  async getRelease(releaseId: string): Promise<DiscogsRelease | null> {
    const body = await this.request<{
      id: number;
      master_id?: number;
      title: string;
      year?: number;
      country?: string;
      formats?: { name: string; qty: string }[];
      labels?: { name: string }[];
      artists?: { name: string }[];
      genres?: string[];
    }>(`/releases/${releaseId}`);

    if (!body) {
      return null;
    }

    return {
      releaseId: String(body.id),
      masterId: body.master_id ? String(body.master_id) : undefined,
      title: body.title,
      artist: body.artists?.map((a) => a.name).join(', ') ?? '',
      year: body.year,
      country: body.country,
      format: body.formats?.map((f) => `${f.qty}x${f.name}`).join(', '),
      label: body.labels?.[0]?.name,
      genres: body.genres,
    };
  }

  validateListingPayload(unit: PublishableUnit): ValidationResult {
    return validateListingPayload(unit);
  }

  async publishListing(unit: PublishableUnit): Promise<PublishResult> {
    const validation = this.validateListingPayload(unit);

    if (!validation.isValid) {
      throw new Error(
        `Cannot publish: ${[...validation.missingFields, ...validation.errors].join(', ')}`
      );
    }

    const payload: ListingPayload = {
      release_id: Number(unit.product!.discogsReleaseId),
      condition: toDiscogsCondition(unit.mediaCondition as never),
      sleeve_condition: toDiscogsSleeveCondition(unit.sleeveCondition as never),
      price: Number(unit.price),
      external_id: unit.sku ?? undefined,
      status: 'For Sale',
    };

    const listing = await this.request<{ listing_id: number; uri?: string }>(
      '/marketplace/listings',
      { method: 'POST', body: JSON.stringify(payload) }
    );

    if (!listing) {
      throw new Error('Discogs rejected the listing: release not found');
    }

    const externalListingId = String(listing.listing_id);

    return {
      externalListingId,
      externalUrl: listing.uri ?? `https://www.discogs.com/sell/item/${externalListingId}`,
      publishedPrice: payload.price,
    };
  }

  markLocalSoldOrOutOfStock(unit: PublishableUnit, soldQuantity: number): LocalStockResult {
    const remaining = Math.max((unit.quantity ?? 0) - soldQuantity, 0);

    return {
      saleStatus: remaining === 0 ? 'sold' : 'available',
      quantity: remaining,
    };
  }
}
