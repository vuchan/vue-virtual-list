# vue-virtual

## vue-virtual-list

### API


## vue-virtual-table

### Usage
#### template
```html
<VirtualTable>
  <VirtualTable.Column
    label="ID"
    prop="id"
    key="id"
    fixed="left"
  ></VirtualTable.Column>
</VirtualTable>
```

### API

#### VirtualTable

##### props

##### events

#### VirtualTable.Column

##### props

| name              | type | required   | default         | description   |
| --------------------- | :------- | :----- | :---------- | :----- |
| label                 | string   | true   | -           | 当前列表头显示内容  |
| prop                  | string   | true   | -           | 当前列 server model 字段的 key |
| key                   | string\|number | true | -           | 当前列 virtual-dom(v-for) 的 key |
| lock                  | string: 'left' \| 'right| - | 'false' | 当前列是否锁定及其锁定位置 |
| align                 | string: 'left' \| 'center' \| 'right| - | 'left' | 当前列文字数据对齐位置 |
| width                 | number   | false  | -           | 当前列的宽度  |
| render                | function | false  | `row[prop]` | 当前列的自定义 render 函数 => render(h, { depth: Number, expandDepth: Number, row: Row, rowIndex: Number, column: Column, columnIndex: Number, store: TableStore }) |


