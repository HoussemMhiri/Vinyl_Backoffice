import { factories } from '@strapi/strapi';
import { UnitNotFoundError, checkCompleteness } from '../services/listing-workflow';
import { TenantError, requireTenant } from '../../../utils/tenant';

export default factories.createCoreController('api::sellable-unit.sellable-unit', () => ({
  async checkDiscogsCompleteness(ctx) {
    const { tenantId } = ctx.request.body ?? {};

    try {
      const tenant = await requireTenant(tenantId);

      // An incomplete unit is a valid answer to the question, not a failure
      ctx.body = await checkCompleteness(tenant.documentId, ctx.params.id);
    } catch (error) {
      if (error instanceof TenantError) {
        return ctx.throw(error.httpStatus, error.message);
      }
      if (error instanceof UnitNotFoundError) {
        return ctx.throw(error.httpStatus, error.message);
      }

      return ctx.throw(502, `Completeness check failed: ${(error as Error).message}`);
    }
  },
}));
