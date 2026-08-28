export const SKU_PREFIX = 'VIN';
export const SKU_PAD_LENGTH = 6;

const SKU_PATTERN = new RegExp(`^${SKU_PREFIX}-(\\d{${SKU_PAD_LENGTH},})$`);

export function formatSku(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new RangeError(`SKU sequence must be a positive integer, received ${sequence}`);
  }

  return `${SKU_PREFIX}-${String(sequence).padStart(SKU_PAD_LENGTH, '0')}`;
}

export function parseSkuSequence(sku: string): number | null {
  const match = SKU_PATTERN.exec(sku);

  return match ? Number(match[1]) : null;
}

export function nextSequence(currentHighest: number | null | undefined): number {
  return (currentHighest ?? 0) + 1;
}
