import type { ValidationResult, PublishableUnit } from '../domain/completeness';
import type {
  DiscogsRelease,
  DiscogsSearchResult,
  LocalStockResult,
  PublishResult,
} from './discogs/discogs.types';

export interface MarketplaceConnector {
  readonly channel: string;
  readonly mode: 'mock' | 'api';

  searchReleases(query: string): Promise<DiscogsSearchResult[]>;
  getRelease(releaseId: string): Promise<DiscogsRelease | null>;
  validateListingPayload(unit: PublishableUnit): ValidationResult;
  publishListing(unit: PublishableUnit): Promise<PublishResult>;
  markLocalSoldOrOutOfStock(unit: PublishableUnit, soldQuantity: number): LocalStockResult;
}
