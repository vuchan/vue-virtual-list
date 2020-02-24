import PropTypes from 'vue-types'
import classNames from 'classnames'
import ColGroup from './ColGroup'
import TableHeader from './TableHeader'
import TableRow from './TableRow'
// import ExpandableRow from './ExpandableRow'
// import connect from './helpers/store/connect'
import { mergeProps, noop } from './helpers/utils/index'

export default {
  name: 'BaseTable',
  props: {
    fixed: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    columns: PropTypes.array.isRequired,
    tableClassName: PropTypes.string.isRequired,
    hasHead: PropTypes.bool.isRequired,
    hasBody: PropTypes.bool.isRequired,
    getRowKey: PropTypes.func,
    isAnyColumnsFixed: PropTypes.bool
  },

  inject: {
    table: { default: () => ({}) }
  },

  created() {
    this.store = this.table.store
  },

  methods: {
    getColumns(cols) {
      const { columns = [], fixed } = this.$props
      const { table } = this
      const { prefixCls } = table.$props

      return (cols || columns).map((column) => ({
        ...column,
        className:
          !!column.fixed && !fixed
            ? classNames(
                `${prefixCls}-fixed-columns-in-body`,
                column.className || column.class
              )
            : column.className || column.class
      }))
    },

    handleRowHover(isHover, key) {
      this.store.setState({
        currentHoverKey: isHover ? key : null
      })
    },

    renderRows(renderData, indent, ancestorKeys = []) {
      console.log('renderData: ', renderData, indent, ancestorKeys)
      const {
        columnManager,
        sComponents: components,
        prefixCls,
        childrenColumnName,
        rowClassName,
        // rowRef,
        $listeners: {
          rowClick: onRowClick = noop,
          rowDoubleclick: onRowDoubleClick = noop,
          rowContextmenu: onRowContextMenu = noop,
          rowMouseenter: onRowMouseEnter = noop,
          rowMouseleave: onRowMouseLeave = noop
        },
        customRow = noop
      } = this.table
      const { getRowKey, fixed, /* expander, */ isAnyColumnsFixed } = this

      const rows = []

      for (let i = 0; i < renderData.length; i++) {
        const record = renderData[i]
        const key = getRowKey(record, i)
        const className =
          typeof rowClassName === 'string'
            ? rowClassName
            : rowClassName(record, i, indent)

        const onHoverProps = {}

        if (columnManager.isAnyColumnsFixed()) {
          onHoverProps.hover = this.handleRowHover
        }

        let leafColumns

        if (fixed === 'left') {
          leafColumns = columnManager.leftLeafColumns()
        } else if (fixed === 'right') {
          leafColumns = columnManager.rightLeafColumns()
        } else {
          leafColumns = this.getColumns(columnManager.leafColumns())
        }

        const rowPrefixCls = `${prefixCls}-row`
        const attributes = {
          props: {
            fixed,
            indent,
            record,
            index: i,
            prefixCls: rowPrefixCls,
            childrenColumnName: childrenColumnName,
            columns: leafColumns,
            rowKey: key,
            ancestorKeys,
            components,
            isAnyColumnsFixed,
            customRow
          },
          on: {
            rowDoubleclick: onRowDoubleClick,
            rowContextmenu: onRowContextMenu,
            rowMouseenter: onRowMouseEnter,
            rowMouseleave: onRowMouseLeave,
            ...onHoverProps
          },
          class: className,
          ref: `row_${i}_${indent}`
        }

        const row = <TableRow {...attributes} />
        rows.push(row)
      }

      console.log('rows: ', rows)
      return rows
    }
  },

  render() {
    const {
      sComponents: components,
      prefixCls,
      scroll,
      dataSource,
      getBodyWrapper
    } = this.table
    const { tableClassName, hasHead, hasBody, fixed } = this.$props

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

    const Table = hasBody ? components.table : 'table'
    const BodyWrapper = components.body.wrapper

    let body
    if (hasBody) {
      body = (
        <BodyWrapper class={`${prefixCls}-tbody`}>
          {this.renderRows(dataSource, 0)}
        </BodyWrapper>
      )

      if (getBodyWrapper) {
        body = getBodyWrapper(body)
      }
    }

    const columns = this.getColumns()

    return (
      <Table class={tableClassName} style={tableStyle} key="table">
        <ColGroup columns={columns} fixed={fixed} />
        {hasHead && <TableHeader columns={columns} fixed={fixed} />}
        {body}
      </Table>
    )
  }
}
