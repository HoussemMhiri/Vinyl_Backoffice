import { createDiscogsConnector } from '../../src/connectors/discogs';
import { DiscogsMockConnector } from '../../src/connectors/discogs/discogs.mock';
import type { PublishableUnit } from '../../src/domain/completeness';

function publishableUnit(overrides: Partial<PublishableUnit> = {}): PublishableUnit {
  return {
    sku: 'VIN-000001',
    price: 24.9,
    currency: 'EUR',
    mediaCondition: 'VG_PLUS',
    sleeveCondition: 'GENERIC',
    saleStatus: 'available',
    quantity: 1,
    product: {
      title: 'Discovery',
      artist: 'Daft Punk',
      year: 2001,
      format: '2xLP',
      discogsReleaseId: '123456',
    },
    ...overrides,
  };
}

describe('mode selection', () => {
  it('uses mock when no mode is configured', () => {
    expect(createDiscogsConnector({}).mode).toBe('mock');
  });

  it('falls back to mock, with a warning, when api mode has no token', () => {
    const warnings: string[] = [];
    const connector = createDiscogsConnector({ mode: 'api' }, (m) => warnings.push(m));

    expect(connector.mode).toBe('mock');
    expect(warnings[0]).toContain('DISCOGS_TOKEN');
  });

  it('uses the http connector when api mode has a token', () => {
    expect(createDiscogsConnector({ mode: 'api', token: 'secret' }).mode).toBe('api');
  });
});

describe('DiscogsMockConnector', () => {
  const connector = new DiscogsMockConnector();

  it('finds the seeded release by artist and title', async () => {
    const results = await connector.searchReleases('daft punk discovery');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      releaseId: '123456',
      artist: 'Daft Punk',
      title: 'Discovery',
      year: 2001,
      country: 'France',
      format: '2xLP',
      label: 'Virgin',
    });
  });

  it('returns nothing for a query that matches no release', async () => {
    expect(await connector.searchReleases('nirvana nevermind')).toEqual([]);
  });

  it('returns nothing for an empty query instead of the whole catalogue', async () => {
    expect(await connector.searchReleases('   ')).toEqual([]);
  });

  it('fetches a release by id and returns null for an unknown one', async () => {
    expect(await connector.getRelease('123456')).toMatchObject({ title: 'Discovery' });
    expect(await connector.getRelease('000000')).toBeNull();
  });

  it('publishes a complete unit and echoes the price it sent', async () => {
    const result = await connector.publishListing(publishableUnit());

    expect(result.externalListingId).toBe('discogs-listing-vin-000001');
    expect(result.externalUrl).toContain('discogs.com/sell/item/');
    expect(result.publishedPrice).toBe(24.9);
  });

  it('refuses an incomplete unit, as the real API would', async () => {
    const unit = publishableUnit();
    unit.product!.discogsReleaseId = null;

    await expect(connector.publishListing(unit)).rejects.toThrow('discogsReleaseId');
  });

  describe('markLocalSoldOrOutOfStock', () => {
    it('marks a unit sold once the last copy is gone', () => {
      expect(connector.markLocalSoldOrOutOfStock(publishableUnit({ quantity: 1 }), 1)).toEqual({
        saleStatus: 'sold',
        quantity: 0,
      });
    });

    it('keeps a unit on sale while stock remains', () => {
      expect(connector.markLocalSoldOrOutOfStock(publishableUnit({ quantity: 3 }), 1)).toEqual({
        saleStatus: 'available',
        quantity: 2,
      });
    });

    it('never drives the quantity below zero', () => {
      expect(connector.markLocalSoldOrOutOfStock(publishableUnit({ quantity: 1 }), 5)).toEqual({
        saleStatus: 'sold',
        quantity: 0,
      });
    });
  });
});
