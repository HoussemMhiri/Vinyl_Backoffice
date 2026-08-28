import type { Core } from '@strapi/strapi';

const routes: Core.RouterConfig = {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/sellable-units/:id/check-discogs-completeness',
      handler: 'api::sellable-unit.sellable-unit.checkDiscogsCompleteness',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};

export default routes;
