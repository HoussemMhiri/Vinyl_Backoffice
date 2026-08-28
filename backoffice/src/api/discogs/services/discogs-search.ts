import { getDiscogsConnector } from '../../../connectors/discogs';
import type { DiscogsSearchResult } from '../../../connectors/discogs/discogs.types';
import { logSyncEvent } from '../../marketplace-sync-event/services/sync-event';

export async function searchReleases(
  tenantId: string,
  query: string
): Promise<DiscogsSearchResult[]> {
  const connector = getDiscogsConnector();

  try {
    const results = await connector.searchReleases(query);

    await logSyncEvent({
      tenantId,
      action: 'search_release',
      eventStatus: 'success',
      message: `Found ${results.length} release(s) for "${query}"`,
      payload: { query, resultCount: results.length, mode: connector.mode },
    });

    return results;
  } catch (error) {
    await logSyncEvent({
      tenantId,
      action: 'search_release',
      eventStatus: 'error',
      message: `Search failed for "${query}": ${(error as Error).message}`,
      payload: { query, mode: connector.mode },
    });

    throw error;
  }
}
