import { formatSku, nextSequence, parseSkuSequence } from '../../src/domain/sku';

describe('formatSku', () => {
  it('pads the sequence to six digits', () => {
    expect(formatSku(1)).toBe('VIN-000001');
    expect(formatSku(42)).toBe('VIN-000042');
    expect(formatSku(999999)).toBe('VIN-999999');
  });

  it('keeps growing past the padding width instead of truncating', () => {
    expect(formatSku(1000000)).toBe('VIN-1000000');
  });

  it('rejects sequences that cannot produce a valid SKU', () => {
    expect(() => formatSku(0)).toThrow(RangeError);
    expect(() => formatSku(-1)).toThrow(RangeError);
    expect(() => formatSku(1.5)).toThrow(RangeError);
  });
});

describe('parseSkuSequence', () => {
  it('reads the sequence back out of a formatted SKU', () => {
    expect(parseSkuSequence('VIN-000001')).toBe(1);
    expect(parseSkuSequence('VIN-1000000')).toBe(1000000);
  });

  it('round-trips any sequence through format and parse', () => {
    for (const sequence of [1, 7, 99, 123456, 1000000]) {
      expect(parseSkuSequence(formatSku(sequence))).toBe(sequence);
    }
  });

  it('returns null for anything that is not one of our SKUs', () => {
    expect(parseSkuSequence('VIN-1')).toBeNull();
    expect(parseSkuSequence('CD-000001')).toBeNull();
    expect(parseSkuSequence('VIN-00000A')).toBeNull();
    expect(parseSkuSequence('')).toBeNull();
  });
});

describe('nextSequence', () => {
  it('starts at 1 when the tenant has no unit yet', () => {
    expect(nextSequence(null)).toBe(1);
    expect(nextSequence(undefined)).toBe(1);
  });

  it('increments the highest sequence already issued', () => {
    expect(nextSequence(41)).toBe(42);
  });
});

describe('supplied SKUs', () => {
  it('a supplied SKU in our format yields a sequence the counter can continue from', () => {
    expect(parseSkuSequence('VIN-000007')).toBe(7);
  });

  it('a foreign SKU yields no sequence, so it cannot corrupt the counter', () => {
    expect(parseSkuSequence('IMPORTED-001')).toBeNull();
  });
});
