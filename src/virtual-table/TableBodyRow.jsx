import PropTypes from 'vue-types'
import { getStyle } from './helpers/utils/index'
import { ColumnProps, TableComponents, Store, TableProps } from './interface'
import { withStoreConnect } from './helpers/withStoreConnect'

function getRowHeight(state, props) {
  const { /* expandedRowsHeight,  */ fixedColumnsBodyRowsHeight } = state
  const { fixed, rowKey } = props

  if (!fixed) {
    return null
  }

  if (fixedColumnsBodyRowsHeight && fixedColumnsBodyRowsHeight[rowKey]) {
    return fixedColumnsBodyRowsHeight[rowKey]
  }

  return null
}

function connect(state, props) {
  const { currentHoveredKey /* , expandedRowKeys */ } = state
  const { rowKey /* , ancestorKeys */ } = props
  // const visible =
  //   (ancestorKeys && ancestorKeys.length === 0) ||
  //   ancestorKeys.every((k) => ~expandedRowKeys.indexOf(k))

  return {
    // visible,
    hovered: currentHoveredKey === rowKey,
    height: getRowHeight(state, props)
  }
}

export default {
  name: 'TableBodyRow',

  props: {
    store: Store.isRequired,
    fixed: ColumnProps.fixed.def(false),
    row: PropTypes.object.isRequired,
    rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    index: PropTypes.number.isRequired,
    columns: PropTypes.arrayOf(ColumnProps).isRequired,
    prefixCls: PropTypes.string.isRequired,
    columnManager: PropTypes.object.isRequired,
    stateManager: PropTypes.object.isRequired,
    useVirtual: TableProps.useVirtual,
    components: TableComponents
  },

  mixins: [withStoreConnect(connect)],

  mounted() {
    this.$nextTick(() => {
      this.saveRowRef()
    })
  },

  updated() {
    if (!this.rowRef) {
      this.$nextTick(() => {
        this.saveRowRef()
      })
    }
  },

  methods: {
    $$emit() {
      // 直接调用listeners，底层组件不需要vueTool记录events
      const args = [].slice.call(arguments, 0)
      const filterEvent = []
      const eventName = args[0]

      if (args.length && this.$listeners[eventName]) {
        if (filterEvent.includes(eventName)) {
          this.$emit(eventName, ...args.slice(1))
        } else {
          this.$listeners[eventName](...args.slice(1))
        }
      }
    },

    saveRowRef() {
      this.rowRef = this.$el

      if (!this.columnManager.isAnyColumnsFixed()) {
        return
      }

      if (!this.fixed) {
        this.setRowHeight()
      }
    },

    setRowHeight() {
      const { store, rowKey } = this
      const { fixedColumnsBodyRowsHeight } = store.getState()
      const height = this.rowRef.getBoundingClientRect().height

      store.setState({
        fixedColumnsBodyRowsHeight: {
          ...fixedColumnsBodyRowsHeight,
          [rowKey]: height
        }
      })
    },

    getStyle() {
      const { height, visible } = this
      let style = getStyle(this)

      if (height) {
        style = { ...style, height }
      }

      if (!visible && !style.display) {
        style = { ...style, display: 'none' }
      }

      return style
    },

    handleRowHover(isHover, key) {
      this.store.setState({
        currentHoveredKey: isHover ? key : null
      })
    },

    onRowClick(event) {
      const { row: record, index } = this

      if (this.stateManager.rowSelection) {
        this.stateManager.toggleRowSelection(this.rowKey)
      }

      this.$$emit('rowClick', record, index, event)
    },

    onRowDoubleClick(event) {
      const { row: record, index } = this

      this.$$emit('rowDoubleClick', record, index, event)
    },

    onContextMenu(event) {
      const { row: record, index } = this

      this.$$emit('rowContextmenu', record, index, event)
    },

    onMouseEnter(event) {
      const { row: record, index, rowKey } = this

      this.handleRowHover(true, rowKey)

      this.$$emit('hover', true, rowKey)
      this.$$emit('rowMouseenter', record, index, event)
    },

    onMouseLeave(event) {
      const { row: record, index, rowKey } = this

      this.handleRowHover(false, rowKey)

      this.$$emit('hover', false, rowKey)
      this.$$emit('rowMouseleave', record, index, event)
    }
  },

  render(h) {
    const { columns, row, rowKey, prefixCls, components } = this.$props
    const { row: TableBodyRow, cell: TableBodyRowCell } = components.body || {}
    const { height, hovered } = this.state

    const style = {
      height: typeof height === 'number' ? `${height}px` : height
    }
    const bodyRowProps = {
      on: {
        click: this.onRowClick,
        dblclick: this.onRowDoubleClick,
        mouseenter: this.onMouseEnter,
        mouseleave: this.onMouseLeave,
        contextmenu: this.onContextMenu
      },
      class: {
        [`${prefixCls}-row`]: true,
        [`${prefixCls}-row-hover`]: hovered,
        [`${prefixCls}-row-selected`]: this.stateManager.isSelected(this.rowKey)
      },
      style,
      attrs: {
        'data-row-key': rowKey
      }
    }

    return (
      <TableBodyRow {...bodyRowProps}>
        {columns.map((column, columnIndex) => {
          const value = row[column.prop]
          const cellProps = {
            key: column.key || column.label || columnIndex,
            class: [
              column.ellipsis
                ? `${prefixCls}-row-cell-ellipsis`
                : `${prefixCls}-row-cell-break-word`,
              column.class
            ]
          }
          let customCell

          if (typeof column.render === 'function') {
            customCell = column.render(h, {
              store: this.stateManager,
              row,
              rowKey: rowKey,
              rowIndex: this.index,
              column,
              columnIndex
            })
          }

          if (column.width && column.ellipsis) {
            const width =
              typeof column.width === 'number'
                ? `${column.width}px`
                : column.width

            customCell = (
              <div style={width ? { width, maxWidth: width } : {}}>
                {customCell}
              </div>
            )
          }

          return (
            <TableBodyRowCell {...cellProps}>
              <div class={['cell', column.cellCls]}>{customCell || value}</div>
            </TableBodyRowCell>
          )
        })}
      </TableBodyRow>
    )
  }
}
