import { compileStrapi, createStrapi } from '@strapi/strapi';

// Runs against the real PostgreSQL database. Strapi's own testing guide uses in-memory
// SQLite, which it states does not work on Windows.

const SLUG = `it-${Date.now()}`;

let app: Awaited<ReturnType<ReturnType<typeof createStrapi>['load']>>;
let tenantId: string;
let unitId: string;
let workflow: typeof import('../../src/api/sellable-unit/services/listing-workflow');

async function countListings() {
  const listings = await app.documents('api::channel-listing.channel-listing').findMany({
    filters: { tenant: { documentId: tenantId } },
  });

  return listings.length;
}

async function events() {
  return app.documents('api::marketplace-sync-event.marketplace-sync-event').findMany({
    filters: { tenant: { documentId: tenantId } },
  });
}

beforeAll(async () => {
  app = await createStrapi(await compileStrapi()).load();
  workflow = await import('../../src/api/sellable-unit/services/listing-workflow');

  const tenant = await app.documents('api::tenant.tenant').create({
    data: { name: 'Integration Tenant', slug: SLUG, isActive: true },
  });
  tenantId = tenant.documentId;

  const product = await app.documents('api::product.product').create({
    data: {
      tenant: tenantId,
      productType: 'vinyl',
      title: 'Discovery',
      artist: 'Daft Punk',
      year: 2001,
      format: '2xLP',
      discogsReleaseId: '123456',
    },
  });

  const unit = await app.documents('api::sellable-unit.sellable-unit').create({
    data: {
      tenant: tenantId,
      product: product.documentId,
      price: 24.9,
      currency: 'EUR',
      mediaCondition: 'VG_PLUS',
      sleeveCondition: 'GENERIC',
      saleStatus: 'available',
      quantity: 2,
    },
  });
  unitId = unit.documentId;
});

afterAll(async () => {
  if (!app) return;

  for (const uid of [
    'api::marketplace-sync-event.marketplace-sync-event',
    'api::channel-listing.channel-listing',
    'api::sellable-unit.sellable-unit',
    'api::product.product',
  ] as const) {
    const records = await app.documents(uid).findMany({
      filters: { tenant: { documentId: tenantId } },
    });
    for (const record of records) {
      await app.documents(uid).delete({ documentId: record.documentId });
    }
  }

  await app.documents('api::tenant.tenant').delete({ documentId: tenantId });
  await app.destroy();
});

describe('publish to discogs', () => {
  it('generates a SKU when the unit is created', async () => {
    const unit = await app.documents('api::sellable-unit.sellable-unit').findOne({
      documentId: unitId,
    });

    expect(unit.sku).toMatch(/^VIN-\d{6}$/);
  });

  it('publishes the unit and stores the external listing id', async () => {
    const listing = await workflow.publishToDiscogs(tenantId, unitId);

    expect(listing.listingStatus).toBe('published');
    expect(listing.externalListingId).toBeTruthy();
    expect(listing.externalUrl).toContain('discogs.com/sell/item/');
    expect(Number(listing.publishedPrice)).toBe(24.9);
  });

  it('logs the publication', async () => {
    const published = (await events()).filter((e) => e.action === 'publish_listing');

    expect(published).toHaveLength(1);
    expect(published[0].eventStatus).toBe('success');
  });

  it('updates the same listing when published again', async () => {
    await workflow.publishToDiscogs(tenantId, unitId);

    expect(await countListings()).toBe(1);
  });

  it('keeps the unit on sale when only part of the stock sells', async () => {
    const { unit } = await workflow.simulateDiscogsSale(tenantId, unitId, 1);

    expect(unit.saleStatus).toBe('available');
    expect(unit.quantity).toBe(1);
  });

  it('marks the unit sold and removes the listing once stock runs out', async () => {
    const { unit, listing } = await workflow.simulateDiscogsSale(tenantId, unitId, 1);

    expect(unit.saleStatus).toBe('sold');
    expect(unit.quantity).toBe(0);
    expect(listing.listingStatus).toBe('removed');
  });

  it('refuses to publish a sold unit and records why', async () => {
    await expect(workflow.publishToDiscogs(tenantId, unitId)).rejects.toThrow();

    const failed = (await events()).filter(
      (e) => e.action === 'publish_listing' && e.eventStatus === 'error'
    );

    expect(failed).toHaveLength(1);
    expect(failed[0].message).toContain('available');
  });

  it('never exposes another tenant to the workflow', async () => {
    await expect(workflow.publishToDiscogs('someoneelsetenantid00001', unitId)).rejects.toThrow(
      /Unknown sellable unit/
    );
  });
});
