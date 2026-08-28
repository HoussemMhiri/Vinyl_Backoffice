import { formatSku, nextSequence } from '../../../domain/sku';

const UNIT_UID = 'api::sellable-unit.sellable-unit';

type TenantRef = { id: number | string } | { documentId: string };

type RelationInput =
  | number
  | string
  | { id?: number | string; documentId?: string }
  | { connect?: unknown[]; set?: unknown[] }
  | unknown[]
  | null
  | undefined;

export function extractTenantRef(input: RelationInput): TenantRef | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === 'number') {
    return { id: input };
  }

  // A relation passed as a bare string is a documentId unless it is all digits
  if (typeof input === 'string') {
    return /^\d+$/.test(input) ? { id: input } : { documentId: input };
  }

  if (Array.isArray(input)) {
    return input.length > 0 ? extractTenantRef(input[0] as RelationInput) : null;
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;

    // The Document Service sends `set`, the admin panel sends `connect`
    const related = record.set ?? record.connect;

    if (Array.isArray(related)) {
      return extractTenantRef(related as unknown[]);
    }
    if (typeof record.documentId === 'string') {
      return { documentId: record.documentId };
    }
    if (typeof record.id === 'number' || typeof record.id === 'string') {
      return { id: record.id };
    }
  }

  return null;
}

async function highestSequenceForTenant(tenant: TenantRef): Promise<number | null> {
  const [latest] = await strapi.db.query(UNIT_UID).findMany({
    where: { tenant },
    orderBy: { skuSequence: 'desc' },
    limit: 1,
    select: ['skuSequence'],
  });

  return latest?.skuSequence ?? null;
}

export async function assignSku(data: Record<string, unknown>): Promise<void> {
  if (typeof data.sku === 'string' && data.sku.length > 0) {
    return;
  }

  const tenant = extractTenantRef(data.tenant as RelationInput);

  if (!tenant) {
    throw new Error('Cannot generate a SKU: the sellable unit has no tenant');
  }

  const sequence = nextSequence(await highestSequenceForTenant(tenant));

  data.skuSequence = sequence;
  data.sku = formatSku(sequence);
}
