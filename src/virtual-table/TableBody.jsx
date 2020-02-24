import PropTypes from 'vue-types'
import TableBodyRow from './TableBodyRow'
import { /* ColumnProps, */ TableComponents, TableProps } from './interface'

export default {
  name: 'TableBody',

  inheritAttrs: false,

  props: {
    rows: TableProps.dataSource,
    // fixed: ColumnProps.fixed.def(false),
    getRowKey: PropTypes.func.isRequired,
    prefixCls: TableProps.prefixCls,
    components: TableComponents
  },

  render() {
    const { prefixCls, components } = this.$props
    const TableBody = components.body.wrapper

    return (
      <TableBody class={`${prefixCls}-tbody`}>
        {this.rows.map((row, index) => {
          const rowKey = this.getRowKey(row, index)
          const attrs = {
            inheritAttrs: false,
            key: rowKey,
            props: {
              ...this.$attrs,
              row,
              rowKey,
              index,
              prefixCls,
              components
            },
            on: {
              ...this.$listeners
            }
          }

          return <TableBodyRow {...attrs}></TableBodyRow>
        })}
      </TableBody>
    )
  }
}
