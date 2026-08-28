import { compileStrapi, createStrapi } from '@strapi/strapi';

const TENANT = { name: 'Vinyl Store Paris', slug: 'vinyl-store-paris', isActive: true };

const PRODUCT = {
  productType: 'vinyl',
  title: 'Discovery',
  artist: 'Daft Punk',
  description: 'Second studio album, French touch classic.',
  label: 'Virgin',
  year: 2001,
  country: 'France',
  format: '2xLP',
} as const;

const UNIT = {
  price: 24.9,
  currency: 'EUR',
  mediaCondition: 'VG_PLUS',
  sleeveCondition: 'GENERIC',
  sellerComment: 'Gatefold sleeve, light shelf wear.',
  saleStatus: 'available',
  quantity: 1,
  internalLocation: 'A-12',
} as const;

async function main() {
  const app = await createStrapi(await compileStrapi()).load();

  const [existingTenant] = await app.documents('api::tenant.tenant').findMany({
    filters: { slug: TENANT.slug },
    limit: 1,
  });

  const tenant =
    existingTenant ?? (await app.documents('api::tenant.tenant').create({ data: TENANT }));

  const [existingProduct] = await app.documents('api::product.product').findMany({
    filters: { title: PRODUCT.title, tenant: { documentId: tenant.documentId } },
    limit: 1,
  });

  // Left without discogsReleaseId on purpose: attaching it is step 4 of the parcours
  const product =
    existingProduct ??
    (await app.documents('api::product.product').create({
      data: { ...PRODUCT, tenant: tenant.documentId },
    }));

  const [existingUnit] = await app.documents('api::sellable-unit.sellable-unit').findMany({
    filters: { tenant: { documentId: tenant.documentId }, product: { documentId: product.documentId } },
    limit: 1,
  });

  const unit =
    existingUnit ??
    (await app.documents('api::sellable-unit.sellable-unit').create({
      data: { ...UNIT, tenant: tenant.documentId, product: product.documentId },
    }));

  console.log('\nSeed complete. Use these ids for the parcours in the README:\n');
  console.log(`  TENANT_ID   ${tenant.documentId}   ${tenant.name}`);
  console.log(`  PRODUCT_ID  ${product.documentId}   ${product.artist} - ${product.title}`);
  console.log(`  UNIT_ID     ${unit.documentId}   ${unit.sku}\n`);

  await app.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
