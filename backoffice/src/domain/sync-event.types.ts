export const SYNC_ACTIONS = [
  'search_release',
  'check_completeness',
  'publish_listing',
  'mark_local_out_of_stock',
] as const;

export const SYNC_STATUSES = ['success', 'error', 'skipped'] as const;

export const MARKETPLACE_CHANNELS = ['discogs'] as const;

export type SyncAction = (typeof SYNC_ACTIONS)[number];
export type SyncStatus = (typeof SYNC_STATUSES)[number];
export type MarketplaceChannel = (typeof MARKETPLACE_CHANNELS)[number];

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SyncEventInput = {
  tenantId: string;
  action: SyncAction;
  eventStatus: SyncStatus;
  message: string;
  channel?: MarketplaceChannel;
  payload?: JsonValue;
  productId?: string;
  sellableUnitId?: string;
  channelListingId?: string;
};
