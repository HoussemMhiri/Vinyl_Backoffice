import { getDiscogsConnector } from '../../../connectors/discogs';
import type { PublishableUnit, ValidationResult } from '../../../domain/completeness';
import { logSyncEvent } from '../../marketplace-sync-event/services/sync-event';
import { findScoped } from '../../../utils/tenant';
import { findListing, upsertListing } from '../../channel-listing/services/listing-store';

const UNIT_UID = 'api::sellable-unit.sellable-unit';

export class UnitNotFoundError extends Error {
  readonly httpStatus = 404;
}

type ScopedUnit = PublishableUnit & { documentId: string };

export async function loadUnit(tenantId: string, unitId: string): Promise<ScopedUnit> {
  const unit = await findScoped<ScopedUnit>(UNIT_UID, unitId, tenantId, { product: true });

  if (!unit) {
    throw new UnitNotFoundError(`Unknown sellable unit ${unitId}`);
  }

  return unit;
}

export async function checkCompleteness(
  tenantId: string,
  unitId: string
): Promise<ValidationResult> {
  const unit = await loadUnit(tenantId, unitId);
  const validation = getDiscogsConnector().validateListingPayload(unit);

  await logSyncEvent({
    tenantId,
    action: 'check_completeness',
    eventStatus: validation.isValid ? 'success' : 'skipped',
    message: validation.isValid
      ? `${unit.sku} is ready to publish`
      : `${unit.sku} is not publishable: ${[...validation.missingFields, ...validation.errors].join(', ')}`,
    payload: {
      missingFields: validation.missingFields,
      errors: validation.errors,
    },
    sellableUnitId: unitId,
  });

  return validation;
}

export class ListingValidationError extends Error {
  readonly httpStatus = 422;

  constructor(readonly validation: ValidationResult) {
    super('The unit is not ready to be published');
  }
}

export class ConnectorError extends Error {
  readonly httpStatus = 502;
}

export class NotPublishedError extends Error {
  readonly httpStatus = 409;
}

export class InsufficientStockError extends Error {
  readonly httpStatus = 409;
}

export async function publishToDiscogs(tenantId: string, unitId: string) {
  const unit = await loadUnit(tenantId, unitId);
  const connector = getDiscogsConnector();
  const validation = connector.validateListingPayload(unit);

  if (!validation.isValid) {
    const reason = [...validation.missingFields, ...validation.errors].join(', ');

    await upsertListing(tenantId, unitId, {
      listingStatus: 'failed',
      lastErrorMessage: reason,
      lastSyncedAt: new Date().toISOString(),
    });

    await logSyncEvent({
      tenantId,
      action: 'publish_listing',
      eventStatus: 'error',
      message: `${unit.sku} was not published: ${reason}`,
      payload: { missingFields: validation.missingFields, errors: validation.errors },
      sellableUnitId: unitId,
    });

    throw new ListingValidationError(validation);
  }

  try {
    const result = await connector.publishListing(unit);
    const listing = await upsertListing(tenantId, unitId, {
      listingStatus: 'published',
      externalListingId: result.externalListingId,
      externalUrl: result.externalUrl,
      publishedPrice: result.publishedPrice,
      lastSyncedAt: new Date().toISOString(),
      lastErrorMessage: null,
    });

    await logSyncEvent({
      tenantId,
      action: 'publish_listing',
      eventStatus: 'success',
      message: `${unit.sku} published as ${result.externalListingId}`,
      payload: { ...result, mode: connector.mode },
      sellableUnitId: unitId,
      channelListingId: listing.documentId,
    });

    return listing;
  } catch (error) {
    const message = (error as Error).message;

    await upsertListing(tenantId, unitId, {
      listingStatus: 'sync_error',
      lastErrorMessage: message,
      lastSyncedAt: new Date().toISOString(),
    });

    await logSyncEvent({
      tenantId,
      action: 'publish_listing',
      eventStatus: 'error',
      message: `${unit.sku} failed to publish: ${message}`,
      payload: { mode: connector.mode },
      sellableUnitId: unitId,
    });

    throw new ConnectorError(message);
  }
}

export async function simulateDiscogsSale(tenantId: string, unitId: string, quantity = 1) {
  const unit = await loadUnit(tenantId, unitId);
  const listing = await findListing(tenantId, unitId);

  if (!listing || listing.listingStatus !== 'published') {
    throw new NotPublishedError(`${unit.sku} is not published on discogs`);
  }

  // Clamping an oversell would silently report a sale larger than the stock we held
  if (quantity > (unit.quantity ?? 0)) {
    throw new InsufficientStockError(
      `${unit.sku} has ${unit.quantity ?? 0} in stock, cannot sell ${quantity}`
    );
  }

  const stock = getDiscogsConnector().markLocalSoldOrOutOfStock(unit, quantity);

  const updatedUnit = await strapi.documents(UNIT_UID).update({
    documentId: unitId,
    data: { saleStatus: stock.saleStatus, quantity: stock.quantity },
  });

  const updatedListing =
    stock.quantity === 0
      ? await upsertListing(tenantId, unitId, {
          listingStatus: 'removed',
          lastSyncedAt: new Date().toISOString(),
        })
      : listing;

  await logSyncEvent({
    tenantId,
    action: 'mark_local_out_of_stock',
    eventStatus: 'success',
    message: `${unit.sku} sold ${quantity}, now ${stock.saleStatus} with ${stock.quantity} left`,
    payload: { soldQuantity: quantity, ...stock },
    sellableUnitId: unitId,
    channelListingId: updatedListing.documentId,
  });

  return { unit: updatedUnit, listing: updatedListing };
}
