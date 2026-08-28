import type { MarketplaceConnector } from '../marketplace-connector';
import { DiscogsHttpConnector } from './discogs.http';
import { DiscogsMockConnector } from './discogs.mock';

export type DiscogsConfig = {
  mode?: string;
  token?: string;
  userAgent?: string;
};

const DEFAULT_USER_AGENT = 'VinylBackofficeTest/0.1';

export function createDiscogsConnector(
  config: DiscogsConfig,
  warn: (message: string) => void = () => {}
): MarketplaceConnector {
  if (config.mode !== 'api') {
    return new DiscogsMockConnector();
  }

  if (!config.token) {
    warn('DISCOGS_MODE is "api" but no DISCOGS_TOKEN is set, falling back to mock mode');
    return new DiscogsMockConnector();
  }

  return new DiscogsHttpConnector(config.token, config.userAgent || DEFAULT_USER_AGENT);
}

export function getDiscogsConnector(): MarketplaceConnector {
  return createDiscogsConnector(
    {
      mode: process.env.DISCOGS_MODE,
      token: process.env.DISCOGS_TOKEN,
      userAgent: process.env.DISCOGS_USER_AGENT,
    },
    (message) => strapi.log.warn(message)
  );
}
