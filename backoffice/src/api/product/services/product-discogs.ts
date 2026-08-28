import { getDiscogsConnector } from '../../../connectors/discogs';
import type { DiscogsRelease } from '../../../connectors/discogs/discogs.types';
import { logSyncEvent } from '../../marketplace-sync-event/services/sync-event';
import { findScoped } from '../../../utils/tenant';

const PRODUCT_UID = 'api::product.product';

export class AttachReleaseError extends Error {
  constructor(
    message: string,
    readonly httpStatus: 404 | 502
  ) {
    super(message);
  }
}

type Product = {
  documentId: string;
  title?: string | null;
  artist?: string | null;
  year?: number | null;
  country?: string | null;
  format?: string | null;
  label?: string | null;
};

// The seller's own metadata outranks Discogs': only empty fields are filled in.
function backfill(product: Product, release: DiscogsRelease): Record<string, unknown> {
  const candidates: Record<string, unknown> = {
    title: release.title,
    artist: release.artist,
    year: release.year,
    country: release.country,
    format: release.format,
    label: release.label,
  };

  return Object.fromEntries(
    Object.entries(candidates).filter(
      ([key, value]) =>
        value !== undefined && value !== null && value !== '' && !product[key as keyof Product]
    )
  );
}

export async function attachRelease(tenantId: string, productId: string, releaseId: string) {
  const product = await findScoped<Product>(PRODUCT_UID, productId, tenantId);

  if (!product) {
    throw new AttachReleaseError(`Unknown product ${productId}`, 404);
  }

  const connector = getDiscogsConnector();
  const release = await connector.getRelease(releaseId);

  if (!release) {
    await logSyncEvent({
      tenantId,
      action: 'search_release',
      eventStatus: 'error',
      message: `Release ${releaseId} not found on ${connector.channel}`,
      payload: { releaseId, mode: connector.mode },
      productId,
    });

    throw new AttachReleaseError(`Unknown release ${releaseId}`, 404);
  }

  const updated = await strapi.documents(PRODUCT_UID).update({
    documentId: productId,
    data: {
      discogsReleaseId: release.releaseId,
      discogsMasterId: release.masterId,
      ...backfill(product, release),
    },
  });

  await logSyncEvent({
    tenantId,
    action: 'search_release',
    eventStatus: 'success',
    message: `Attached release ${release.releaseId} (${release.artist} - ${release.title})`,
    payload: { releaseId: release.releaseId, mode: connector.mode },
    productId,
  });

  return updated;
}
