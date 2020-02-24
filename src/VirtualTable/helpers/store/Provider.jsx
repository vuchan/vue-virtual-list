import { Store } from '@/VirtualTable/interface'

export default {
  name: 'StoreProvider',

  props: {
    store: Store.isRequired
  },

  provide() {
    return {
      store: this.$props
    }
  },

  render() {
    return this.$slots.default[0]
  }
}
