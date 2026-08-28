import type { SyncEventInput } from '../../../domain/sync-event.types';

const EVENT_UID = 'api::marketplace-sync-event.marketplace-sync-event';

export async function logSyncEvent(input: SyncEventInput): Promise<void> {
  const {
    tenantId,
    action,
    eventStatus,
    message,
    channel = 'discogs',
    payload,
    productId,
    sellableUnitId,
    channelListingId,
  } = input;

  try {
    await strapi.documents(EVENT_UID).create({
      data: {
        tenant: tenantId,
        channel,
        action,
        eventStatus,
        message,
        payload: payload ?? null,
        product: productId ?? null,
        sellableUnit: sellableUnitId ?? null,
        channelListing: channelListingId ?? null,
        occurredAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    // A broken audit trail must never roll back the operation it describes
    strapi.log.error(
      `Failed to log ${action} for tenant ${tenantId}: ${(error as Error).message}`
    );
  }
}
