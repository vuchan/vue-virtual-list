// import PropTypes from 'vue-types'
import classes from 'component-classes'
import { TableProps } from './interface'
import { DEFAULT_LOCALE, DEFAULT_COMPONENTS } from './constants'
import {
  debounce,
  deepMerge,
  getOptionProps,
  initDefaultProps
} from './helpers/utils/index'
import ColumnManager from './helpers/ColumnManager'
import HeadTable from './HeadTable'
import BodyTable from './BodyTable'
import createStore from './helpers/store/createStore'
import { on, off } from './helpers/dom/index'
// import Provider from './helpers/store/Provider'

export default {
  name: 'VirtualTable',

  props: {
    ...initDefaultProps(TableProps, {
      dataSource: [],
      useFixedHeader: false,
      rowKey: 'key',
      rowClassName: () => '',

      prefixCls: 'vc-table',
      bodyStyle: {},

      showHeader: true,
      scroll: {},

      locale: DEFAULT_LOCALE,
      components: DEFAULT_COMPONENTS,

      title: () => null,
      footer: () => null
      // rowRef: () => null,
      // customHeaderRow: () => {}
    })
  },

  provide() {
    return {
      table: this
    }
  },

  data() {
    const columnManager = new ColumnManager(this.columns)

    return {
      columnManager,
      sComponents: this.mergeDefaultComponents(this.components)
    }
  },

  computed: {
    hasScrollX() {
      return 'x' in this.scroll
    }
  },

  watch: {
    components(val) {
      this.mergeDefaultComponents(val)
    },

    columns(val) {
      if (val) {
        this.columnManager.reset(val)
      }
    },

    dataSource(val) {
      if (val.length === 0 && this.hasScrollX) {
        this.$nextTick(() => {
          this.resetScrollX()
        })
      }
    }
  },

  created() {
    // initialize state in store
    // the store does not need reactive
    const store = createStore({
      currentHoveredKey: '',
      fixedColumnsHeadRowsHeight: [],
      fixedColumnsBodyRowsHeight: {}
    })

    this.store = store
    this.setScrollPosition('left')
    this.debouncedWindowResize = debounce(this.handleWindowResize, 150)
  },

  mounted() {
    this.$nextTick(() => {
      if (this.columnManager.isAnyColumnsFixed()) {
        this.handleWindowResize()
        this.resizeEvent = addEventListener(
          window,
          'resize',
          this.debouncedWindowResize
        )
      }

      // https://github.com/ant-design/ant-design/issues/11635
      if (this.$refs.headTable) {
        this.$refs.headTable.scrollLeft = 0
      }

      if (this.$refs.bodyTable) {
        this.$refs.bodyTable.scrollLeft = 0
      }
    })
  },

  updated() {
    this.$nextTick(() => {
      if (this.columnManager.isAnyColumnsFixed()) {
        this.handleWindowResize()
        if (!this.resizeEvent) {
          this.resizeEvent = on(window, 'resize', this.debouncedWindowResize)
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

    getRowKey(record, index) {
      const rowKey = this.rowKey
      const key =
        typeof rowKey === 'function' ? rowKey(record, index) : record[rowKey]

      return key === undefined ? index : key
    },

    resetScrollX() {
      if (this.$refs.headTable) {
        this.$refs.headTable.scrollLeft = 0
      }

      if (this.$refs.bodyTable) {
        this.$refs.bodyTable.scrollLeft = 0
      }
    },

    saveChildrenRef(name, node) {
      /**
       * To keep the same experience with instance's `$refs`,
       */
      if (name && node) {
        this.$refs[name] = node
      }
    },

    handleBodyScroll(e) {
      this.handleBodyScrollLeft(e)
      this.handleBodyScrollTop(e)
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

      if (target.scrollLeft !== this.lastScrollLeft && scroll.x) {
        if (target === bodyTable && headTable) {
          headTable.scrollLeft = target.scrollLeft
        } else if (target === headTable && bodyTable) {
          bodyTable.scrollLeft = target.scrollLeft
        }

        this.setScrollPositionClassName()
      }
      // Remember last scrollLeft for scroll direction detecting.
      this.lastScrollLeft = target.scrollLeft
    },

    handleWindowResize() {
      this.syncFixedTableRowHeight()
      this.setScrollPositionClassName()
    },

    syncFixedTableRowHeight() {
      const tableRect = this.$refs.tableNode.getBoundingClientRect()
      // If tableNode's height less than 0, suppose it is hidden and don't recalculate rowHeight.
      // see: https://github.com/ant-design/ant-design/issues/4836
      if (tableRect.height !== undefined && tableRect.height <= 0) {
        return
      }

      const { prefixCls } = this
      const headRows = this.$refs.headTable
        ? this.$refs.headTable.querySelectorAll('thead')
        : this.$refs.bodyTable.querySelectorAll('thead')

      const bodyRows =
        this.$refs.bodyTable.querySelectorAll(`.${prefixCls}-row`) || []
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
      this.scrollPosition = position

      if (this.$refs.tableNode) {
        const { prefixCls } = this
        if (position === 'both') {
          classes(this.$refs.tableNode)
            .remove(new RegExp(`^${prefixCls}-scroll-position-.+$`))
            .add(`${prefixCls}-scroll-position-left`)
            .add(`${prefixCls}-scroll-position-right`)
        } else {
          classes(this.$refs.tableNode)
            .remove(new RegExp(`^${prefixCls}-scroll-position-.+$`))
            .add(`${prefixCls}-scroll-position-${position}`)
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
          bodyTable: bodyTable,
          fixedColumnsBodyLeft: fixedColumnsBodyLeft,
          fixedColumnsBodyRight: fixedColumnsBodyRight
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

    renderMainTable() {
      const { scroll, prefixCls } = this
      const isAnyColumnsFixed = this.columnManager.isAnyColumnsFixed()
      const scrollable = isAnyColumnsFixed || scroll.x || scroll.y

      const table = [
        this.renderTable({
          columns: this.columnManager.groupedColumns(),
          isAnyColumnsFixed
        }),
        this.renderEmptyText(),
        this.renderFooter()
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
      const { columns, fixed, isAnyColumnsFixed } = options
      const { prefixCls, scroll = {} } = this
      const tableClassName = scroll.x || fixed ? `${prefixCls}-fixed` : ''

      const headTable = (
        <HeadTable
          key="head"
          columns={columns}
          fixed={fixed}
          tableClassName={tableClassName}
          handleBodyScrollLeft={this.handleBodyScrollLeft}
        />
      )

      const bodyTable = (
        <BodyTable
          key="body"
          columns={columns}
          fixed={fixed}
          tableClassName={tableClassName}
          getRowKey={this.getRowKey}
          handleWheel={this.handleWheel}
          handleBodyScroll={this.handleBodyScroll}
          isAnyColumnsFixed={isAnyColumnsFixed}
        />
      )

      return [headTable, bodyTable]
    },

    renderTitle() {
      const { title, prefixCls, dataSource: data } = this
      const node = title(data)

      return node ? (
        <div class={`${prefixCls}-title`} key="title">
          {node}
        </div>
      ) : null
    },

    renderFooter() {
      const { footer, prefixCls, dataSource: data } = this
      const node = footer(data)

      return footer ? (
        <div class={`${prefixCls}-footer`} key="footer">
          {node}
        </div>
      ) : null
    },

    renderEmptyText() {
      const {
        locale: { emptyText },
        prefixCls,
        dataSource
      } = this

      if (dataSource.length) {
        return null
      }

      const emptyClassName = `${prefixCls}-placeholder`

      return (
        <div class={emptyClassName} key="emptyText">
          {typeof emptyText === 'function' ? emptyText() : emptyText}
        </div>
      )
    }
  },

  render() {
    const props = getOptionProps(this)
    const { title, $listeners, columnManager /*  getRowKey */ } = this
    const prefixCls = props.prefixCls
    let className = props.prefixCls

    if (props.useFixedHeader || (props.scroll && props.scroll.y)) {
      className += ` ${prefixCls}-fixed-header`
    }
    if (this.scrollPosition === 'both') {
      className += ` ${prefixCls}-scroll-position-left ${prefixCls}-scroll-position-right`
    } else {
      className += ` ${prefixCls}-scroll-position-${this.scrollPosition}`
    }

    const hasLeftFixed = columnManager.isAnyColumnsLeftFixed()
    const hasRightFixed = columnManager.isAnyColumnsRightFixed()
    const attrs = {
      on: { ...$listeners },
      style: { ...props.style },
      attrs: { ...this.$attrs }
    }

    return (
      <div
        ref="tableNode"
        class={className}
        // style={props.style}
        // id={props.id}
        {...attrs}
      >
        {title && this.renderTitle()}

        <div class={`${prefixCls}-content`}>
          {this.renderMainTable()}
          {hasLeftFixed && this.renderLeftFixedTable()}
          {hasRightFixed && this.renderRightFixedTable()}
        </div>
      </div>
    )
  }
}
