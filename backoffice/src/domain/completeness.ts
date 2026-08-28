import { isMediaCondition, isSleeveCondition } from './conditions';

export type ValidationResult = {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
};

export type PublishableProduct = {
  title?: string | null;
  artist?: string | null;
  year?: number | null;
  format?: string | null;
  discogsReleaseId?: string | null;
};

export type PublishableUnit = {
  sku?: string | null;
  price?: number | string | null;
  currency?: string | null;
  mediaCondition?: string | null;
  sleeveCondition?: string | null;
  saleStatus?: string | null;
  quantity?: number | null;
  product?: PublishableProduct | null;
};

const REQUIRED_PRODUCT_FIELDS: (keyof PublishableProduct)[] = [
  'discogsReleaseId',
  'title',
  'artist',
  'year',
  'format',
];

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

export function validateListingPayload(unit: PublishableUnit): ValidationResult {
  const missingFields: string[] = [];
  const errors: string[] = [];

  if (!unit.product) {
    missingFields.push('product');
    return { isValid: false, missingFields, errors: ['The unit is not linked to a product'] };
  }

  for (const field of REQUIRED_PRODUCT_FIELDS) {
    if (isBlank(unit.product[field])) {
      missingFields.push(`product.${field}`);
    }
  }

  const price = typeof unit.price === 'string' ? Number(unit.price) : unit.price;

  if (isBlank(unit.price)) {
    missingFields.push('price');
  } else if (!Number.isFinite(price) || (price as number) <= 0) {
    errors.push('Price must be a number greater than zero');
  }

  if (isBlank(unit.currency)) {
    missingFields.push('currency');
  }

  if (isBlank(unit.mediaCondition)) {
    missingFields.push('mediaCondition');
  } else if (!isMediaCondition(unit.mediaCondition)) {
    errors.push(`Unknown media condition: ${unit.mediaCondition}`);
  }

  if (isBlank(unit.sleeveCondition)) {
    missingFields.push('sleeveCondition');
  } else if (!isSleeveCondition(unit.sleeveCondition)) {
    errors.push(`Unknown sleeve condition: ${unit.sleeveCondition}`);
  }

  if (unit.saleStatus !== 'available') {
    errors.push(`Only an available unit can be published, this one is ${unit.saleStatus}`);
  }

  if (isBlank(unit.quantity) || (unit.quantity as number) < 1) {
    errors.push('Quantity must be at least 1');
  }

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors,
  };
}
