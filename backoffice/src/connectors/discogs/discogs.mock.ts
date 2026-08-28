import { validateListingPayload, type PublishableUnit } from '../../domain/completeness';
import type { MarketplaceConnector } from '../marketplace-connector';
import { MOCK_LISTING, MOCK_RELEASES } from './discogs.fixtures';
import type {
  DiscogsRelease,
  DiscogsSearchResult,
  LocalStockResult,
  PublishResult,
} from './discogs.types';

function matches(release: DiscogsRelease, query: string): boolean {
  const haystack = [release.title, release.artist, release.label, release.format]
    .join(' ')
    .toLowerCase();

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export class DiscogsMockConnector implements MarketplaceConnector {
  readonly channel = 'discogs';
  readonly mode = 'mock' as const;

  async searchReleases(query: string): Promise<DiscogsSearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    return MOCK_RELEASES.filter((release) => matches(release, query));
  }

  async getRelease(releaseId: string): Promise<DiscogsRelease | null> {
    return MOCK_RELEASES.find((release) => release.releaseId === releaseId) ?? null;
  }

  validateListingPayload(unit: PublishableUnit) {
    return validateListingPayload(unit);
  }

  async publishListing(unit: PublishableUnit): Promise<PublishResult> {
    const validation = this.validateListingPayload(unit);

    // The real API rejects an incomplete listing, so the mock must too
    if (!validation.isValid) {
      throw new Error(
        `Cannot publish: ${[...validation.missingFields, ...validation.errors].join(', ')}`
      );
    }

    const suffix = unit.sku ? unit.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '0001';
    const externalListingId = `discogs-listing-${suffix}`;

    return {
      externalListingId,
      externalUrl: `https://www.discogs.com/sell/item/${externalListingId}`,
      publishedPrice: Number(unit.price),
    };
  }

  markLocalSoldOrOutOfStock(unit: PublishableUnit, soldQuantity: number): LocalStockResult {
    const remaining = Math.max((unit.quantity ?? 0) - soldQuantity, 0);

    // Stock left means the unit stays on sale; only a fully depleted unit is sold
    return {
      saleStatus: remaining === 0 ? 'sold' : 'available',
      quantity: remaining,
    };
  }
}

export const MOCK_LISTING_FIXTURE = MOCK_LISTING;
