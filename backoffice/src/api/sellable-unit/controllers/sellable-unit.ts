import { factories } from '@strapi/strapi';
import type { Context } from 'koa';
import {
  ConnectorError,
  ListingValidationError,
  NotPublishedError,
  UnitNotFoundError,
  checkCompleteness,
  publishToDiscogs,
  simulateDiscogsSale,
} from '../services/listing-workflow';
import { TenantError, requireTenant } from '../../../utils/tenant';

function toHttpError(ctx: Context, error: unknown) {
  if (
    error instanceof TenantError ||
    error instanceof UnitNotFoundError ||
    error instanceof NotPublishedError ||
    error instanceof ConnectorError
  ) {
    return ctx.throw(error.httpStatus, error.message);
  }

  return ctx.throw(500, (error as Error).message);
}

export default factories.createCoreController('api::sellable-unit.sellable-unit', () => ({
  async checkDiscogsCompleteness(ctx: Context) {
    try {
      const tenant = await requireTenant(ctx.request.body?.tenantId);

      // An incomplete unit is a valid answer to the question, not a failure
      ctx.body = await checkCompleteness(tenant.documentId, ctx.params.id);
    } catch (error) {
      return toHttpError(ctx, error);
    }
  },

  async publishDiscogs(ctx: Context) {
    try {
      const tenant = await requireTenant(ctx.request.body?.tenantId);

      ctx.body = { listing: await publishToDiscogs(tenant.documentId, ctx.params.id) };
    } catch (error) {
      if (error instanceof ListingValidationError) {
        ctx.status = error.httpStatus;
        ctx.body = { error: error.message, ...error.validation };
        return;
      }

      return toHttpError(ctx, error);
    }
  },

  async simulateDiscogsSale(ctx: Context) {
    const { tenantId, quantity = 1 } = ctx.request.body ?? {};

    try {
      const tenant = await requireTenant(tenantId);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return ctx.badRequest('quantity must be a positive integer');
      }

      ctx.body = await simulateDiscogsSale(tenant.documentId, ctx.params.id, quantity);
    } catch (error) {
      return toHttpError(ctx, error);
    }
  },
}));
