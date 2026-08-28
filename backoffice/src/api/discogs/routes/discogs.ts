import type { Core } from '@strapi/strapi';

const routes: Core.RouterConfig = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/discogs/search',
      handler: 'api::discogs.discogs.search',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};

export default routes;
