import type { MarketplaceChannel } from '../../../domain/sync-event.types';

const LISTING_UID = 'api::channel-listing.channel-listing';

export type ListingStatus =
  | 'not_published'
  | 'pending'
  | 'published'
  | 'failed'
  | 'removed'
  | 'sync_error';

export type ListingFields = {
  listingStatus: ListingStatus;
  externalListingId?: string | null;
  externalUrl?: string | null;
  publishedPrice?: number | null;
  lastSyncedAt?: string | null;
  lastErrorMessage?: string | null;
};

export type StoredListing = ListingFields & { documentId: string };

export async function findListing(
  tenantId: string,
  unitId: string,
  channel: MarketplaceChannel = 'discogs'
): Promise<StoredListing | null> {
  const [listing] = await strapi.documents(LISTING_UID).findMany({
    filters: {
      channel,
      tenant: { documentId: tenantId },
      sellableUnit: { documentId: unitId },
    },
    limit: 1,
  });

  return (listing as StoredListing) ?? null;
}

// One listing per unit per channel: a marketplace offers an item once, and a duplicate
// would be a real listing a seller keeps paying for.
export async function upsertListing(
  tenantId: string,
  unitId: string,
  fields: ListingFields,
  channel: MarketplaceChannel = 'discogs'
): Promise<StoredListing> {
  const existing = await findListing(tenantId, unitId, channel);

  if (existing) {
    return (await strapi.documents(LISTING_UID).update({
      documentId: existing.documentId,
      // Strapi's generated Input type omits null, which is how a field is cleared
      data: fields as never,
    })) as StoredListing;
  }

  return (await strapi.documents(LISTING_UID).create({
    data: {
      tenant: tenantId,
      sellableUnit: unitId,
      channel,
      ...fields,
    } as never,
  })) as StoredListing;
}
