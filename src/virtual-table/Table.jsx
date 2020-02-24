import PropTypes from 'vue-types'
import ColGroup from '../VirtualTable/ColGroup'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import { TableComponents, TableProps } from './interface'

export default {
  name: 'Table',

  props: {
    components: TableComponents.isRequired,
    scroll: TableProps.scroll.isRequired,
    columns: TableProps.columns.isRequired,
    hasHead: PropTypes.bool.def(true),
    hasBody: PropTypes.bool.def(true),
    fixed: TableProps.fixed
  },

  methods: {
    getColumns(cols, options) {
      const { columns = [], fixed } = options
      const { prefixCls } = this

      return (cols || columns).map((column) => ({
        ...column,
        className:
          !!column.fixed && !fixed
            ? [
                `${prefixCls}-fixed-columns-in-body`,
                column.className || column.class
              ]
            : column.className || column.class
      }))
    }
  },

  render() {
    const {
      tableClassName,
      hasHead,
      hasBody,
      fixed,
      scroll,
      components
    } = this.$props
    const tableStyle = {}

    if (!fixed && scroll.x) {
      // not set width, then use content fixed width
      if (scroll.x === true) {
        tableStyle.tableLayout = 'fixed'
      } else {
        tableStyle.width =
          typeof scroll.x === 'number' ? `${scroll.x}px` : scroll.x
      }
    }

    const columns = this.getColumns(null, this.$props)
    const Table = hasBody ? components.table : 'table'

    let body

    if (hasBody) {
      body = (
        <TableBody
          rows={this.dataSource}
          fixed={fixed}
          store={this.store}
          getRowKey={this.getRowKey}
          columns={columns}
          components={components}
          columnManager={this.columnManager}
          // isAnyColumnsFixed={isAnyColumnsFixed}
        ></TableBody>
      )
    }

    const component = (
      <Table class={tableClassName} style={tableStyle} key="table">
        <ColGroup columns={columns} fixed={fixed} />
        {hasHead && (
          <TableHeader
            columns={columns}
            fixed={fixed}
            components={components}
          />
        )}
        {body}
      </Table>
    )

    return component
  }
}
