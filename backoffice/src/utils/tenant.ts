const TENANT_UID = 'api::tenant.tenant';

export class TenantError extends Error {
  constructor(
    message: string,
    readonly httpStatus: 400 | 403 | 404
  ) {
    super(message);
  }
}

export async function requireTenant(tenantId: unknown): Promise<{ documentId: string }> {
  if (typeof tenantId !== 'string' || tenantId.trim() === '') {
    throw new TenantError('A tenantId is required', 400);
  }

  const tenant = await strapi.documents(TENANT_UID).findOne({ documentId: tenantId });

  if (!tenant) {
    throw new TenantError(`Unknown tenant ${tenantId}`, 404);
  }

  if (!tenant.isActive) {
    throw new TenantError('This tenant is inactive', 403);
  }

  return tenant;
}

// Returns null rather than throwing on a foreign record: the caller answers 404, so the
// existence of another tenant's data is never confirmed.
export async function findScoped<T>(
  uid: Parameters<typeof strapi.documents>[0],
  documentId: string,
  tenantId: string,
  populate?: Record<string, unknown>
): Promise<T | null> {
  const [record] = await strapi.documents(uid).findMany({
    filters: { documentId, tenant: { documentId: tenantId } },
    populate,
    limit: 1,
  } as never);

  return (record as T) ?? null;
}
