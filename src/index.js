import VirtualList from './VirtualList/List.vue';

VirtualList.install = (Vue, options = { name: 'VirtualList' }) => {
  window.Vue && Vue.component(options.name, VirtualList)
}

export default VirtualList;
export {
  VirtualList,
};