import { assignSku } from '../../services/sku-sequence';

export default {
  async beforeCreate(event: { params: { data: Record<string, unknown> } }) {
    await assignSku(event.params.data);
  },
};
