import { getDiscogsConnector } from '../../../connectors/discogs';
import type { PublishableUnit, ValidationResult } from '../../../domain/completeness';
import { logSyncEvent } from '../../marketplace-sync-event/services/sync-event';
import { findScoped } from '../../../utils/tenant';

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
