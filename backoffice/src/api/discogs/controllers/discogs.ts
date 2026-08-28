import type { Context } from 'koa';
import { TenantError, requireTenant } from '../../../utils/tenant';
import { searchReleases } from '../services/discogs-search';

export default {
  async search(ctx: Context) {
    const { tenantId, q } = ctx.query;

    try {
      const tenant = await requireTenant(tenantId);

      if (typeof q !== 'string' || q.trim() === '') {
        return ctx.badRequest('A search query "q" is required');
      }

      ctx.body = { results: await searchReleases(tenant.documentId, q.trim()) };
    } catch (error) {
      if (error instanceof TenantError) {
        return ctx.throw(error.httpStatus, error.message);
      }

      return ctx.throw(502, `Discogs search failed: ${(error as Error).message}`);
    }
  },
};
