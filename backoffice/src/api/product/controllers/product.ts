import { factories } from '@strapi/strapi';
import { AttachReleaseError, attachRelease } from '../services/product-discogs';
import { TenantError, requireTenant } from '../../../utils/tenant';

export default factories.createCoreController('api::product.product', () => ({
  async attachDiscogsRelease(ctx) {
    const { tenantId, releaseId } = ctx.request.body ?? {};

    try {
      const tenant = await requireTenant(tenantId);

      if (typeof releaseId !== 'string' || releaseId.trim() === '') {
        return ctx.badRequest('A releaseId is required');
      }

      ctx.body = {
        product: await attachRelease(tenant.documentId, ctx.params.id, releaseId.trim()),
      };
    } catch (error) {
      if (error instanceof TenantError || error instanceof AttachReleaseError) {
        return ctx.throw(error.httpStatus, error.message);
      }

      return ctx.throw(502, `Could not attach the release: ${(error as Error).message}`);
    }
  },
}));
