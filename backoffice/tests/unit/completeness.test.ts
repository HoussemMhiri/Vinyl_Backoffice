import { validateListingPayload, type PublishableUnit } from '../../src/domain/completeness';

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

describe('validateListingPayload', () => {
  it('accepts a complete unit', () => {
    expect(validateListingPayload(publishableUnit())).toEqual({
      isValid: true,
      missingFields: [],
      errors: [],
    });
  });

  it('reports a unit that has no product at all', () => {
    const result = validateListingPayload(publishableUnit({ product: null }));

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('product');
  });

  it('requires the product to carry a discogs release id', () => {
    const unit = publishableUnit();
    unit.product!.discogsReleaseId = null;

    expect(validateListingPayload(unit).missingFields).toContain('product.discogsReleaseId');
  });

  it.each(['title', 'artist', 'year', 'format'] as const)(
    'requires product.%s',
    (field) => {
      const unit = publishableUnit();
      (unit.product as Record<string, unknown>)[field] = null;

      expect(validateListingPayload(unit).missingFields).toContain(`product.${field}`);
    }
  );

  it('reports every problem at once rather than stopping at the first', () => {
    const result = validateListingPayload(
      publishableUnit({ price: null, currency: null, mediaCondition: null })
    );

    expect(result.missingFields).toEqual(
      expect.arrayContaining(['price', 'currency', 'mediaCondition'])
    );
  });

  it('rejects a price of zero or less', () => {
    expect(validateListingPayload(publishableUnit({ price: 0 })).errors).toContain(
      'Price must be a number greater than zero'
    );
    expect(validateListingPayload(publishableUnit({ price: -5 })).errors.length).toBeGreaterThan(0);
  });

  it('accepts a decimal price arriving as a string from the database', () => {
    expect(validateListingPayload(publishableUnit({ price: '24.90' })).isValid).toBe(true);
  });

  it('rejects a grading value outside the Discogs vocabulary', () => {
    expect(validateListingPayload(publishableUnit({ mediaCondition: 'EXCELLENT' })).errors[0])
      .toContain('Unknown media condition');
  });

  it('rejects a sleeve-only grading used for the disc', () => {
    expect(validateListingPayload(publishableUnit({ mediaCondition: 'NO_COVER' })).isValid).toBe(
      false
    );
  });

  it('accepts a sleeve-only grading for the sleeve', () => {
    expect(validateListingPayload(publishableUnit({ sleeveCondition: 'NO_COVER' })).isValid).toBe(
      true
    );
  });

  it.each(['sold', 'reserved', 'archived', 'out_of_stock'])(
    'refuses to publish a unit that is %s',
    (saleStatus) => {
      const result = validateListingPayload(publishableUnit({ saleStatus }));

      expect(result.isValid).toBe(false);
      expect(result.errors.join(' ')).toContain('available');
    }
  );

  it('requires at least one item in stock', () => {
    expect(validateListingPayload(publishableUnit({ quantity: 0 })).errors).toContain(
      'Quantity must be at least 1'
    );
  });
});
