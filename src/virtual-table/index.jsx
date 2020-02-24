// import PropTypes from 'vue-types'
import './table.css'
// import classes from 'component-classes'
import { TableProps } from './interface'
import {
  DEFAULT_COMPONENTS,
  DEFAULT_LOCALE,
  STYLE_WRAPPER,
  STYLE_INNER
} from './constants'
import { on, off } from './helpers/dom'
import createStore from './helpers/store/createStore'
import ColumnManager from './helpers/ColumnManager'
import TableStateManager from './helpers/TableStateManager'
import { measureScrollbar } from './helpers/dom/scrollbar-width'
import { debounce, deepMerge, initDefaultProps } from './helpers/utils'
import Column from './Column'
import ColGroup from './ColGroup'
import ColumnGroup from './ColumnGroup'
import TableHeader from './TableHeader'
import TableBody from './TableBody'

const OVERSCAN_COUNT = 5

export default {
  name: 'VirtualTable',

  props: {
    ...initDefaultProps(TableProps, {
      rowKey: 'key',
      prefixCls: 'vc-table',
      scroll: {},
      bodyStyle: {},
      dataSource: [],
      showHeader: true,
      rowClassName: () => '',
      locale: DEFAULT_LOCALE,
      components: DEFAULT_COMPONENTS,
      defaultExpandAllRows: false,
      title: () => null,
      footer: () => null
    })
  },

  Column,
  ColumnGroup,

  provide() {
    return {
      table: this
    }
  },

  data() {
    // store 用于保存一些内部私有、但需要被实时反应的值
    const store = createStore({
      currentHoveredKey: '',
      fixedColumnsHeadRowsHeight: [],
      fixedColumnsBodyRowsHeight: {}
    })
    this.store = store
    this.columnManager = new ColumnManager(this.columns)

    // state 用于保存一些外部公共、需要暴露的等通过 Vue 更新 view 的值
    const state = new TableStateManager(this.$props)

    const data = {
      sComponents: this.mergeDefaultComponents(this.components),
      scrollPosition: 'left',
      stateManager: state
    }

    if (this.useVirtual) {
      data.visibleDataRange = []
      data.scrollToRow = this.scrollToRow || 0
    }

    return data
  },

  computed: {
    hasScrollX() {
      return 'x' in this.scroll
    },

    useVirtualScroll() {
      return (
        this.useVirtual &&
        this.scroll &&
        this.dataSource &&
        this.dataSource.length > 0
      )
    },

    dataSourceLength() {
      return this.stateManager.dataSource.length
    },

    virtualTotalViewSize() {
      return this.useVirtualScroll && this.dataSourceLength * this.rowHeight
    },

    virtualItemSize() {
      return this.useVirtualScroll && Math.ceil(this.scroll.y / this.rowHeight)
    },

    virtualViewScrollTop() {
      return this.scrollToRow * this.rowHeight
    }
  },

  watch: {
    components(value) {
      this.sComponents = this.mergeDefaultComponents(value)
    },

    rowKey(value) {
      this.stateManager.setState({ rowKey: value })
    },

    expandDepth(value) {
      this.stateManager.setState({ expandDepth: value })
    },

    expandedRowKeys(value) {
      this.stateManager.setState({ expandedRowKeys: value })
    },

    defaultExpandAllRows(value) {
      this.stateManager.setState({ defaultExpandAllRows: value })
    },

    rowSelection(value) {
      this.stateManager.setState({ rowSelection: value })
    },

    columns(val) {
      if (val) {
        this.columnManager.reset(val)
      }
    },

    dataSource(value) {
      this.stateManager.setState({ dataSource: value })

      const isSameRef = value === this.dataSource
      const isSameData = value.length === this.dataSource.length && isSameRef

      if (value.length === 0 && this.hasScrollX) {
        this.$nextTick(() => {
          this.resetScrollX()
        })
      } else {
        if (this.useVirtualScroll && !isSameData) {
          this.updatePoolData(this.lastScrollTop, true)
        }
      }
    },

    'stateManager.dataSource'() {
      this.updatePoolData(this.lastScrollTop, true)
    }
  },

  created() {
    if (this.$props.useVirtual && !this.$props.rowHeight) {
      throw new ReferenceError(
        `When 'useVirtual' the property 'rowHeight' must be set as number or function!`
      )
    }

    this.setScrollPosition('left')
    this.debouncedWindowResize = debounce(this.handleWindowResize, 150)
  },

  mounted() {
    const { headTable, bodyTable } = this.$refs

    if (this.hasVirtualData) {
      this.lastScrollTop = bodyTable.scrollTop
    }

    this.$nextTick(() => {
      if (this.columnManager.isAnyColumnsFixed()) {
        this.handleWindowResize()
        this.resizeEvent = on(window, 'resize', this.debouncedWindowResize)
      }

      // https://github.com/ant-design/ant-design/issues/11635
      if (headTable) {
        headTable.scrollLeft = 0
      }

      if (bodyTable) {
        bodyTable.scrollLeft = 0
      }

      this.$__ready && this.$nextTick(this.updatePoolData)
    })

    this.$__ready = true
  },

  updated() {
    this.$nextTick(() => {
      if (this.columnManager.isAnyColumnsFixed()) {
        this.handleWindowResize()

        if (!this.resizeEvent) {
          on(window, 'resize', this.debouncedWindowResize)
          this.resizeEvent = true
        }
      }
    })
  },

  beforeDestroy() {
    if (this.resizeEvent) {
      off(window, 'resize', this.debouncedWindowResize)
      this.resizeEvent = null
    }

    if (this.debouncedWindowResize) {
      this.debouncedWindowResize.cancel()
    }
  },

  methods: {
    mergeDefaultComponents(components = {}) {
      return deepMerge({}, DEFAULT_COMPONENTS, components)
    },

    resetScrollX() {
      const { headTable, bodyTable } = this.$refs

      if (headTable && headTable.scrollLeft) {
        headTable.scrollLeft = 0
      }

      if (bodyTable && bodyTable.scrollLeft) {
        bodyTable.scrollLeft = 0
      }
    },

    getItemSize(index, defaultItemSize) {
      const item = this.dataSource[index]
      const key = this.getRowKey(item, index)
      const state = this.store.getState()

      return (
        state.fixedColumnsBodyRowsHeight[key] ||
        this.estimatedItemSize ||
        defaultItemSize
      )
    },

    getRowKey() {
      return this.stateManager.getRowKey.apply(this, arguments)
    },

    getClassName(name) {
      return `${this.prefixCls}-${name}`
    },

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
    },

    getVisibleRange({
      offset = 0, // number
      overscanCount = 3 // number
    }) {
      const start = Math.floor(offset / this.rowHeight)

      return {
        start,
        stop: start + this.virtualItemSize + overscanCount
      }
    },

    handleBodyScroll(e) {
      console.log('handleBodyScroll: ', e)
      this.handleBodyScrollLeft(e)

      if (this.useVirtualScroll) {
        this.handleVirtualScrollTop(e)
      } else {
        this.handleBodyScrollTop(e)
      }
    },

    /* https://github.com/vuchan/vue-virtual-list/blob/master/src/VirtualList/List.vue#L148 */
    handleVirtualScrollTop(e) {
      this.handleBodyScrollTop(e)
      this.updatePoolData(e.target.scrollTop)
    },

    updatePoolData(scrollTop = 0, forceUpdate) {
      if (!this.$__ready) return

      const { start, stop } = this.getVisibleRange({
        offset: scrollTop,
        overscanCount: this.overscanCount || OVERSCAN_COUNT
      })

      /* 当前列表的索引发生实际变化时才进行切片触发更新 */
      const shouldUpdate = this.$__prevStartIndex !== start
      if (!shouldUpdate && !forceUpdate) return

      this.$__prevStartIndex = start

      this.scrollToRow = Math.floor(scrollTop / this.rowHeight)
      this.visibleDataRange = this.stateManager.dataSource.slice(start, stop)
    },

    handleBodyScrollTop(e) {
      const target = e.target

      // Fix https://github.com/ant-design/ant-design/issues/9033
      if (e.currentTarget !== target) {
        return
      }

      const { scroll = {} } = this
      const {
        headTable,
        bodyTable,
        fixedColumnsBodyLeft,
        fixedColumnsBodyRight
      } = this.$refs

      if (
        target.scrollTop !== this.lastScrollTop &&
        scroll.y &&
        target !== headTable
      ) {
        const scrollTop = target.scrollTop

        if (fixedColumnsBodyLeft && target !== fixedColumnsBodyLeft) {
          fixedColumnsBodyLeft.scrollTop = scrollTop
        }

        if (fixedColumnsBodyRight && target !== fixedColumnsBodyRight) {
          fixedColumnsBodyRight.scrollTop = scrollTop
        }

        if (bodyTable && target !== bodyTable) {
          bodyTable.scrollTop = scrollTop
        }
      }

      // Remember last scrollTop for scroll direction detecting.
      this.lastScrollTop = target.scrollTop
    },

    handleBodyScrollLeft(e) {
      // Fix https://github.com/ant-design/ant-design/issues/7635
      if (e.currentTarget !== e.target) {
        return
      }

      const target = e.target
      const { scroll = {} } = this
      const { headTable, bodyTable } = this.$refs
      const scrollLeft = target.scrollLeft

      if (scrollLeft !== this.lastScrollLeft && scroll.x) {
        if (target === bodyTable && headTable) {
          headTable.scrollLeft = scrollLeft
        } else if (target === headTable && bodyTable) {
          bodyTable.scrollLeft = scrollLeft
        }

        this.setScrollPositionClassName()
      }

      // Remember last scrollLeft for scroll direction detecting.
      this.lastScrollLeft = scrollLeft
    },

    handleWindowResize() {
      this.syncFixedTableRowHeight()
      this.setScrollPositionClassName()
    },

    syncFixedTableRowHeight() {
      const tableNode = this.$refs.tableNode
      const tableRect =
        tableNode &&
        tableNode instanceof HTMLElement &&
        tableNode.getBoundingClientRect()

      // If tableNode's height less than 0, suppose it is hidden and don't recalculate rowHeight.
      // see: https://github.com/ant-design/ant-design/issues/4836
      if (
        tableRect &&
        tableRect.height !== undefined &&
        tableRect.height <= 0
      ) {
        return
      }

      const { prefixCls } = this
      const { headTable, bodyTable } = this.$refs
      const headRows = headTable
        ? headTable &&
          headTable instanceof HTMLElement &&
          headTable.querySelectorAll('thead')
        : bodyTable &&
          bodyTable instanceof HTMLElement &&
          bodyTable.querySelectorAll('thead')

      const bodyRows = bodyTable.querySelectorAll(`.${prefixCls}-row`) || []
      const fixedColumnsHeadRowsHeight = [].map.call(
        headRows,
        (row) => row.getBoundingClientRect().height || 'auto'
      )

      const state = this.store.getState()
      const fixedColumnsBodyRowsHeight = [].reduce.call(
        bodyRows,
        (acc, row) => {
          const rowKey = row.getAttribute('data-row-key')
          const height =
            row.getBoundingClientRect().height ||
            state.fixedColumnsBodyRowsHeight[rowKey] ||
            'auto'
          acc[rowKey] = height
          return acc
        },
        {}
      )

      if (
        this._q(state.fixedColumnsHeadRowsHeight, fixedColumnsHeadRowsHeight) &&
        this._q(state.fixedColumnsBodyRowsHeight, fixedColumnsBodyRowsHeight)
      ) {
        return
      }

      this.store.setState({
        fixedColumnsHeadRowsHeight,
        fixedColumnsBodyRowsHeight
      })
    },

    setScrollPositionClassName() {
      const node = this.$refs.bodyTable
      const scrollToLeft = node.scrollLeft === 0

      const scrollToRight =
        node.scrollLeft + 1 >=
        node.children[0].getBoundingClientRect().width -
          node.getBoundingClientRect().width

      if (scrollToLeft && scrollToRight) {
        this.setScrollPosition('both')
      } else if (scrollToLeft) {
        this.setScrollPosition('left')
      } else if (scrollToRight) {
        this.setScrollPosition('right')
      } else if (this.scrollPosition !== 'middle') {
        this.setScrollPosition('middle')
      }
    },

    setScrollPosition(position) {
      const { prefixCls } = this
      const { tableNode } = this.$refs
      this.scrollPosition = position

      if (tableNode) {
        const classes = tableNode.classList

        if (position === 'both') {
          classes.remove(new RegExp(`^${prefixCls}-scroll-position-.+$`))
          classes.add(`${prefixCls}-scroll-position-left`)
          classes.add(`${prefixCls}-scroll-position-right`)
        } else {
          classes.remove(new RegExp(`^${prefixCls}-scroll-position-.+$`))
          classes.add(`${prefixCls}-scroll-position-${position}`)
        }
      }
    },

    handleWheel(event) {
      const { scroll = {} } = this.$props

      if (window.navigator.userAgent.match(/Trident\/7\./) && scroll.y) {
        event.preventDefault()
        const wd = event.deltaY
        const target = event.target
        const {
          bodyTable,
          fixedColumnsBodyLeft,
          fixedColumnsBodyRight
        } = this.$refs

        let scrollTop = 0

        if (this.lastScrollTop) {
          scrollTop = this.lastScrollTop + wd
        } else {
          scrollTop = wd
        }

        if (fixedColumnsBodyLeft && target !== fixedColumnsBodyLeft) {
          fixedColumnsBodyLeft.scrollTop = scrollTop
        }

        if (fixedColumnsBodyRight && target !== fixedColumnsBodyRight) {
          fixedColumnsBodyRight.scrollTop = scrollTop
        }

        if (bodyTable && target !== bodyTable) {
          bodyTable.scrollTop = scrollTop
        }
      }
    },

    renderBlock(block, name) {
      const content =
        typeof block === 'function' ? block(this.dataSource) : block

      return content ? (
        <div key={name} class={this.getClassName(name)}>
          {content}
        </div>
      ) : null
    },

    renderEmptyText() {
      const {
        locale: { emptyText },
        dataSource
      } = this

      if (dataSource.length) {
        return null
      }

      return this.renderBlock(emptyText, 'placeholder')
    },

    renderMainTable() {
      const { scroll, prefixCls } = this
      const isAnyColumnsFixed = this.columnManager.isAnyColumnsFixed()
      const scrollable = isAnyColumnsFixed || scroll.x || scroll.y

      const table = [
        this.renderTable({
          columns: this.columnManager.groupedColumns(),
          isAnyColumnsFixed
        }),
        this.renderEmptyText()
      ]

      return scrollable ? (
        <div class={`${prefixCls}-scroll`}>{table}</div>
      ) : (
        table
      )
    },

    renderLeftFixedTable() {
      const { prefixCls } = this

      return (
        <div class={`${prefixCls}-fixed-left`}>
          {this.renderTable({
            columns: this.columnManager.leftColumns(),
            fixed: 'left'
          })}
        </div>
      )
    },

    renderRightFixedTable() {
      const { prefixCls } = this

      return (
        <div class={`${prefixCls}-fixed-right`}>
          {this.renderTable({
            columns: this.columnManager.rightColumns(),
            fixed: 'right'
          })}
        </div>
      )
    },

    renderTable(options) {
      return [this.renderHeadTable(options), this.renderBodyTable(options)]
    },

    renderHeadTable(options) {
      const { columns, fixed /* isAnyColumnsFixed */ } = options
      const { prefixCls, scroll = {}, showHeader, handleBodyScrollLeft } = this
      const tableClassName = scroll.x || fixed ? `${prefixCls}-fixed` : ''
      const headStyle = {}

      if (scroll.y) {
        // Add negative margin bottom for scroll bar overflow bug
        const scrollbarWidth = measureScrollbar('horizontal')

        if (scrollbarWidth > 0 && !fixed) {
          headStyle.marginBottom = `-${scrollbarWidth}px`
          headStyle.paddingBottom = '0px'
        }
      }

      if (!showHeader) {
        return null
      }

      return (
        <div
          key="headTable"
          ref={fixed ? null : 'headTable'}
          class={`${prefixCls}-header`}
          style={headStyle}
          onScroll={handleBodyScrollLeft}
        >
          {this.renderBaseTable({
            tableClassName,
            fixed: fixed,
            columns: columns,
            hasHead: true,
            hasBody: false
          })}
        </div>
      )
    },

    renderBodyTable(options) {
      const { columns, fixed, tableClassName } = options
      const {
        scroll,
        prefixCls,
        handleWheel,
        handleBodyScroll
        /* getRowKey */
      } = this

      let useFixedHeader = false
      const bodyStyle = { ...this.bodyStyle }
      const innerBodyStyle = {}

      if (scroll.x || fixed) {
        bodyStyle.overflowX = bodyStyle.overflowX || 'scroll'
        // Fix weired webkit render bug
        // https://github.com/ant-design/ant-design/issues/7783
        bodyStyle.WebkitTransform = 'translate3d (0, 0, 0)'
      }

      if (scroll.y) {
        // maxHeight will make fixed-Table scrolling not working
        // so we only set maxHeight to body-Table here
        let maxHeight = bodyStyle.maxHeight || scroll.y
        maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight

        if (fixed) {
          innerBodyStyle.maxHeight = maxHeight
          innerBodyStyle.overflowY = bodyStyle.overflowY || 'scroll'
        } else {
          bodyStyle.maxHeight = maxHeight
        }

        bodyStyle.overflowY = bodyStyle.overflowY || 'scroll'
        useFixedHeader = true

        // Add negative margin bottom for scroll bar overflow bug
        const scrollbarWidth = measureScrollbar()

        if (scrollbarWidth > 0 && fixed) {
          bodyStyle.marginBottom = `-${scrollbarWidth}px`
          bodyStyle.paddingBottom = '0px'
        }
      }

      let baseTable = this.renderBaseTable({
        ...options,
        tableClassName,
        hasHead: !useFixedHeader,
        hasBody: true
      })

      if (fixed && columns.length) {
        let refName

        if (columns[0].fixed === 'left' || columns[0].fixed === true) {
          refName = 'fixedColumnsBodyLeft'
        } else if (columns[0].fixed === 'right') {
          refName = 'fixedColumnsBodyRight'
        }

        delete bodyStyle.overflowX
        delete bodyStyle.overflowY

        return (
          <div
            key="bodyTable"
            class={`${prefixCls}-body-outer`}
            style={{ ...bodyStyle }}
          >
            <div
              class={`${prefixCls}-body-inner`}
              style={innerBodyStyle}
              ref={refName}
              onWheel={handleWheel}
              onScroll={handleBodyScroll}
            >
              {this.useVirtualScroll
                ? this.renderVirtualWrapper(baseTable)
                : baseTable}
            </div>
          </div>
        )
      }

      return (
        <div
          key="bodyTable"
          class={this.getClassName(`body`)}
          style={bodyStyle}
          ref="bodyTable"
          onWheel={handleWheel}
          onScroll={handleBodyScroll}
        >
          {this.useVirtualScroll
            ? this.renderVirtualWrapper(baseTable)
            : baseTable}
        </div>
      )
    },

    renderBaseTable(options = {}) {
      const { tableClassName, hasHead, hasBody, fixed } = options
      const { prefixCls, showHeader, scroll, sComponents: components } = this
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

      const columns = this.getColumns(null, options)
      const Table = hasBody ? components.table : 'table'

      const component = (
        <Table class={tableClassName} style={tableStyle} key="table">
          <ColGroup columns={columns} fixed={fixed} />

          {hasHead && (
            <TableHeader
              fixed={fixed}
              store={this.store}
              columns={columns}
              prefixCls={prefixCls}
              showHeader={showHeader}
              components={components}
            />
          )}

          {hasBody && (
            <TableBody
              fixed={fixed}
              store={this.store}
              rows={
                this.useVirtualScroll ? this.visibleDataRange : this.dataSource
              }
              getRowKey={this.getRowKey}
              columns={columns}
              components={components}
              stateManager={this.stateManager}
              columnManager={this.columnManager}
            ></TableBody>
          )}
        </Table>
      )

      return component
    },

    renderVirtualWrapper(baseTable) {
      return (
        <div
          class={this.getClassName(`virtual-wrapper`)}
          style={{
            ...STYLE_WRAPPER,
            height: this.virtualTotalViewSize + 'px'
          }}
        >
          <div
            class={this.getClassName(`virtual-inner`)}
            style={{
              ...STYLE_INNER,
              // height: this.virtualScrollManager.viewportSize + 'px',
              transform: `translateY(${this.virtualViewScrollTop}px)`
            }}
          >
            {baseTable}
          </div>
        </div>
      )
    }
  },

  render() {
    const { size, bordered, useVirtual, prefixCls, scroll } = this.$props
    const { title, footer } = this.$slots
    let className = prefixCls

    if (this.scrollPosition === 'both') {
      className += ` ${prefixCls}-scroll-position-left ${prefixCls}-scroll-position-right`
    } else {
      className += ` ${prefixCls}-scroll-position-${this.scrollPosition}`
    }

    const hasLeftFixed = this.columnManager.isAnyColumnsLeftFixed()
    const hasRightFixed = this.columnManager.isAnyColumnsRightFixed()
    const attributes = {
      on: { ...this.$listeners },
      style: { ...this.$props.style },
      attrs: { ...this.$attrs }
    }

    return (
      <div
        class={[
          className,
          {
            [this.getClassName(size)]: size,
            [this.getClassName('bordered')]: bordered,
            [this.getClassName('fixed-header')]: scroll && scroll.y,
            [this.getClassName('virtual')]: useVirtual
          }
        ]}
        ref="tableNode"
        {...attributes}
      >
        {title && this.renderBlock(title, 'title')}

        <div class={this.getClassName('content')}>
          {this.renderMainTable()}
          {hasLeftFixed && this.renderLeftFixedTable()}
          {hasRightFixed && this.renderRightFixedTable()}
        </div>

        {footer && this.renderBlock(footer, 'footer')}
      </div>
    )
  }
}
