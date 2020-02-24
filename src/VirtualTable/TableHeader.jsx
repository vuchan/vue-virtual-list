// import PropTypes from 'vue-types'
import TableHeaderRow from './TableHeaderRow'
import { ColumnProps } from './interface'
import { TableProps } from '@/VirtualTreeTable/interface'

function getHeaderRows(columns, currentRow = 0, rows) {
  rows = rows || []
  rows[currentRow] = rows[currentRow] || []

  columns.forEach((column) => {
    if (column.rowSpan && rows.length < column.rowSpan) {
      while (rows.length < column.rowSpan) {
        rows.push([])
      }
    }

    const cell = {
      key: column.key,
      className: column.className || column.class || '',
      children: column.label || column.title,
      column
    }

    if (column.children) {
      getHeaderRows(column.children, currentRow + 1, rows)
    }

    if ('colSpan' in column) {
      cell.colSpan = column.colSpan
    }

    if ('rowSpan' in column) {
      cell.rowSpan = column.rowSpan
    }

    if (cell.colSpan !== 0) {
      rows[currentRow].push(cell)
    }
  })

  return rows.filter((row) => row.length > 0)
}

export default {
  name: 'TableHeader',

  inheritAttrs: false,

  props: {
    fixed: ColumnProps.fixed,
    prefixCls: TableProps.prefixCls.isRequired,
    showHeader: TableProps.showHeader.isRequired,
    // columns: PropTypes.arrayOf(ColumnProps).isRequired,
    components: TableProps.components
  },

  render() {
    const { fixed, columns, components, prefixCls, showHeader } = this.$props

    if (!showHeader) {
      return null
    }

    const rows = getHeaderRows(columns)
    const HeaderWrapper = components.header.wrapper
    const attrs = { attrs: { ...this.$attrs } }

    return (
      <HeaderWrapper class={`${prefixCls}-thead`}>
        {rows.map((row, index) => (
          <TableHeaderRow
            prefixCls={prefixCls}
            key={index}
            row={row}
            rows={rows}
            index={index}
            fixed={fixed}
            columns={columns}
            components={components}
            {...attrs}
          />
        ))}
      </HeaderWrapper>
    )
  }
}
