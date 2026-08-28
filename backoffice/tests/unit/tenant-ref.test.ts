import { extractTenantRef } from '../../src/api/sellable-unit/services/sku-sequence';

describe('extractTenantRef', () => {
  it('accepts a numeric database id', () => {
    expect(extractTenantRef(3)).toEqual({ id: 3 });
  });

  it('treats a 24-character string as a documentId', () => {
    expect(extractTenantRef('a1b2c3d4e5f6g7h8i9j0klmn')).toEqual({
      documentId: 'a1b2c3d4e5f6g7h8i9j0klmn',
    });
  });

  it('treats an all-digit string as an id, not a documentId', () => {
    expect(extractTenantRef('7')).toEqual({ id: '7' });
  });

  it('unwraps the connect payload the admin panel sends', () => {
    expect(extractTenantRef({ connect: [{ id: 5 }] })).toEqual({ id: 5 });
    expect(extractTenantRef({ connect: [{ documentId: 'abc' }] })).toEqual({
      documentId: 'abc',
    });
  });

  it('unwraps the set payload the Document Service sends', () => {
    expect(extractTenantRef({ set: [{ id: 2 }] })).toEqual({ id: 2 });
  });

  it('prefers documentId when both are present', () => {
    expect(extractTenantRef({ id: 5, documentId: 'abc' })).toEqual({ documentId: 'abc' });
  });

  it('returns null when no tenant can be resolved', () => {
    expect(extractTenantRef(null)).toBeNull();
    expect(extractTenantRef(undefined)).toBeNull();
    expect(extractTenantRef({})).toBeNull();
    expect(extractTenantRef({ connect: [] })).toBeNull();
    expect(extractTenantRef({ set: [] })).toBeNull();
  });
});
