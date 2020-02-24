import PropTypes from 'vue-types'
import { TableComponents, Store, TableProps } from './interface'
import { withStoreConnect } from './helpers/withStoreConnect'

function getRowHeight(state, props) {
  const { fixedColumnsHeadRowsHeight } = state
  const { columns, rows, fixed } = props
  const headerHeight = fixedColumnsHeadRowsHeight[0]

  if (!fixed) {
    return null
  }

  if (headerHeight && columns) {
    if (headerHeight === 'auto') {
      return 'auto'
    }

    return `${headerHeight / rows.length}px`
  }

  return null
}

function connect(state, props) {
  return {
    height: getRowHeight(state, props)
  }
}

export default {
  name: 'TableHeaderRow',

  inheritAttrs: false,

  mixins: [withStoreConnect(connect)],

  props: {
    fixed: TableProps.fixed,
    store: Store.isRequired,
    rows: TableProps.columns,
    columns: TableProps.columns,
    row: PropTypes.array,
    prefixCls: PropTypes.string.isRequired,
    components: TableComponents
  },

  render(h) {
    const { row, prefixCls, components } = this
    const { row: TableHeaderRow, cell: TableHeaderRowCell } = components.header
    const { height } = this.state
    const style = { height }

    return (
      <TableHeaderRow>
        {row.map((cell, i) => {
          const { column, children, className, ...cellProps } = cell
          const cls = cell.class || className
          const headerCellProps = {
            inheritAttrs: false,
            attrs: {
              ...cellProps
            },
            class: cls,
            style
          }

          if (column.align) {
            headerCellProps.style = {
              // ...customProps.style,
              textAlign: column.align
            }

            headerCellProps.class = [
              // customProps.cls,
              column.class,
              column.className,
              {
                [`${prefixCls}-align-${column.align}`]: !!column.align
              }
            ]
          }

          if (typeof TableHeaderRowCell === 'function') {
            return TableHeaderRowCell(h, headerCellProps, children)
          }

          return (
            <TableHeaderRowCell
              key={column.key || column.label || i}
              class={`${prefixCls}-row-cell-break-word`}
              {...headerCellProps}
            >
              <span class={`${prefixCls}-header-column`}>{children}</span>
            </TableHeaderRowCell>
          )
        })}
      </TableHeaderRow>
    )
  }
}
