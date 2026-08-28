import type { Core } from '@strapi/strapi';

const routes: Core.RouterConfig = {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/products/:id/attach-discogs-release',
      handler: 'api::product.product.attachDiscogsRelease',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};

export default routes;
