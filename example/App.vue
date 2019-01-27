<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
    <h1>Vue-Virtual-List</h1>
    <VirtualList :data-source="list" :height="240" :item-height="50">
      <template scope="{ data }">
        <div class="virtual-list-item__cell">{{ data && data.content }} ,</div>
      </template>
    </VirtualList>

    <table-tree
      class="tree-table-view"
      :row-key="rowKey"
      :show-header="true"
      :data-source="data"
      :columns="columns1"
      :indent-size="20"
      :expand="true"
      :depth="0"
      :expand-depth="1"
      :expand-row-map.sync="expandRowMap"
    />
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import VirtualList from "@";
import TableTree from "./components/TableTree";
import dataSource, { TableData2, tree } from "./TreeData";

export default {
  name: "app",
  components: {
    // HelloWorld,
    VirtualList,
    TableTree
  },
  data() {
    let list = [];
    for (let i = 0; i < 10000; i++) {
      list.push({
        key: i + 1,
        index: 0,
        content: `Yes, i am ${i + 1}th element`
      });
    }

    return {
      list,
      data: dataSource,
      columns1: [
        {
          prop: "index",
          key: 0,
          minWidth: 20,
          render(h, { rowIndex }) {
            return ++rowIndex;
          }
        },
        {
          prop: "_expand",
          key: 0,
          width: 20,
          minWidth: 40,
          render: (h, { store, row, /* column, */ depth }) => {
            if (row.children && row.children.length) {
              const expanded = store.isRowExpanded(row);
              const classname = expanded ? "el-icon-minus" : "el-icon-plus";

              return (
                <i
                  style={`padding-left: ${depth * 20}px`}
                  class={classname}
                  onClick={() => store.toggleRowExpansion(row)}
                >
                  {expanded ? "-" : "+"}
                </i>
              );
            } else {
              return (
                <input
                  type="checkbox"
                  style={`padding-left: ${depth * 20}px`}
                />
              );
            }
          }
        },
        {
          label: "商品 ID",
          prop: "id",
          key: 1
        },
        {
          label: "商品名称",
          prop: "name",
          key: 2
        },
        {
          label: "描述",
          prop: "desc",
          key: 3
        }
      ]
    };
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.cell {
  line-height: 50px;
}
</style>
