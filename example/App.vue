<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->

    <VirtualTable
      ref="$table"
      row-key="id"
      bordered
      use-virtual
      :overscan-count="1"
      :scroll="scroll"
      :columns="columns"
      :data-source="dataSource"
      :row-height="54"
      :indent-size="20"
      :row-selection="{ type: 'radio', selectedRowKeys: [] }"
    />
    <!-- <h1 style="margin-top: 3em">Vue-Virtual-List</h1> -->

    <button @click="testUpdateDataSource">Update Data Source</button>

    <virtual-list :data-source="data" :height="240" :item-height="50">
      <template scope="{ data }">
        <div class="virtual-list-item__cell">{{data.content}}</div>
      </template>
    </virtual-list>
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import VirtualList from '@'
import dataSource from './TreeData'
import VirtualTable from '@/virtual-table'
import TableRowExpansionItem from './components/TableRowExpansionItem/index'
// import VirtualTable1 from '@/VirtualTable/demo/Table'

let i = 0
let list = []
for (let i = 0; i < 10000; i++) {
  list.push({
    key: i + 1,
    index: 0,
    content: `Yes, i am ${i + 1}th element`
  })
}

export default {
  name: 'app',
  components: {
    // HelloWorld,
    VirtualList,
    VirtualTable
    // VirtualTable1
  },

  methods: {
    testUpdateDataSource() {
      console.log('this.i: ', i)
      const start = 100 * i++
      const end = start + 100
      console.log('start: ', start, 'end: ', end)

      this.data = list.slice(start, end)
    }
  },

  data() {
    return {
      scroll: { x: 1400, y: 300 },
      list,
      dataSource,
      data: list.slice(0, 100),
      columns: [
        {
          fixed: true,
          label: 'Expander',
          key: 0,
          width: 100,
          render(h, { row, store }) {
            if (row.children && row.children.length) {
              return (
                <TableRowExpansionItem
                  indent-size={store.indentSize}
                  store={store}
                  row={row}
                  depth={row.__depth || row.__tree.depth}
                />
              )
            }
          }
        },
        {
          fixed: true,
          label: '商品 ID',
          prop: 'id',
          key: 1,
          width: 100
        },
        {
          label: '商品名称',
          prop: 'name',
          key: 2,
          width: 200
        },
        {
          label: '描述',
          prop: 'desc',
          width: 300,
          key: 3
        },
        {
          label: '商家地址',
          prop: 'address',
          width: 400,
          key: 4
        },
        {
          // fixed: 'right',
          label: '小吃分类',
          prop: 'category',
          width: 300,
          key: 5
        }
      ]
    }
  }
}
</script>

<style>
body {
  background-color: #eee;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

table {
  border-collapse: collapse;
}

th {
  text-align: inherit;
}

*,
*::before,
*::after {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}
</style>
