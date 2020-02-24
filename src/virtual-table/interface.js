/* Forked from ant-design-vue */
import PropTypes from 'vue-types'

const LEFT = 'left'
const CENTER = 'center'
const RIGHT = 'right'

const LOCK_POSITION_TYPE = PropTypes.oneOfType([
  PropTypes.bool,
  PropTypes.oneOf([LEFT, RIGHT])
])
const ALIGN_POSITION_TYPE = PropTypes.oneOf([LEFT, CENTER, RIGHT, ''])

export const ColumnProps = {
  label: PropTypes.string.isRequired,
  prop: PropTypes.string.isRequired,
  key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  colSpan: PropTypes.number,

  className: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  align: ALIGN_POSITION_TYPE,
  fixed: LOCK_POSITION_TYPE,
  resize: PropTypes.bool.def(false), // required

  // TODO: filter
  filterMultiple: PropTypes.bool,
  filterDropdown: PropTypes.any,
  filterDropdownVisible: PropTypes.bool,
  filterIcon: PropTypes.any,
  filteredValue: PropTypes.array,

  // TODO: sorter
  sorter: PropTypes.oneOfType([PropTypes.boolean, PropTypes.func]),
  defaultSortOrder: PropTypes.oneOf(['ascend', 'descend']),
  sortOrder: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.oneOf(['ascend', 'descend'])
  ]),
  sortDirections: PropTypes.array
}

export const Store = PropTypes.shape({
  setState: PropTypes.func.isRequired,
  getState: PropTypes.func.isRequired,
  subscribe: PropTypes.func.isRequired
})

export const TableComponents = PropTypes.shape({
  wrapper: PropTypes.string.def('table'),
  header: {
    wrapper: PropTypes.string.def('thead'),
    row: PropTypes.string.def('tr'),
    cell: PropTypes.string.def('th')
  },
  body: {
    wrapper: PropTypes.string.def('tbody'),
    row: PropTypes.string.def('tr'),
    cell: PropTypes.string.def('td')
  },

  // if use other UI framework, can instead of the following components
  // the select => ElSelect
  // the check-box => ElCheckBox
  // the radio => ElRadio
  // the scroll-bar => ElScrollbar
  select: PropTypes.string.def('select'),
  checkbox: PropTypes.string.def('checkbox'),
  radio: PropTypes.string.def('radio'),
  scrollbar: PropTypes.string
}).loose

export const TableLocale = PropTypes.shape({
  filterTitle: PropTypes.string.def('过滤器'),
  filterConfirm: PropTypes.any.def('确定'),
  filterReset: PropTypes.any.def('重置'),
  emptyText: PropTypes.any.def('暂无数据'),
  selectAll: PropTypes.any.def('选择全部'),
  selectInvert: PropTypes.any.def('反选'),
  sortTitle: PropTypes.string.def('排序')
}).loose

export const RowSelectionType = PropTypes.oneOf(['checkbox', 'radio'])
export const TableRowSelection = {
  type: RowSelectionType,
  selectedRowKeys: PropTypes.array
  // onChange?: (selectedRowKeys: string[] | number[], selectedRows: Object[]) => any;
  // getCheckboxProps: PropTypes.func,
  // onSelect?: SelectionSelectFn<T>;
  // onSelectAll?: (selected: boolean, selectedRows: Object[], changeRows: Object[]) => any;
  // onSelectInvert?: (selectedRows: Object[]) => any;
  // selections: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  // hideDefaultSelections: PropTypes.bool,

  // fixed: PropTypes.bool,
  // columnWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  // selectWay: PropTypes.oneOf([
  //   'onSelect',
  //   'onSelectMultiple',
  //   'onSelectAll',
  //   'onSelectInvert'
  // ]),
  // columnTitle: PropTypes.any
}

export const TableProps = {
  size: PropTypes.oneOf(['default', 'large', 'middle', 'small']).def('default'),
  locale: TableLocale,
  prefixCls: PropTypes.string.def('vc-table'),
  dropdownPrefixCls: PropTypes.string.def('vc-table'),
  rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  rowClassName: PropTypes.func, // (record: RowModel, index: number) => string

  // if has scroll.x value then set the `Table` total width
  // if has scroll.y value then set the `useFixedHeader` to be truly
  scroll: PropTypes.object.def({}),
  bodyStyle: PropTypes.any,
  bordered: PropTypes.bool.def(false),
  components: TableComponents,

  // whether use virtual to handle big list render
  useVirtual: PropTypes.bool.def(true),
  rowHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  overscanCount: PropTypes.number.def(3),

  // whether the data are tree-like formats
  isTreeData: PropTypes.bool.def(false),
  showHeader: PropTypes.bool.def(true),
  // auto computed property
  useFixedHeader: PropTypes.bool.def(false),

  // data & configuration columns
  dataSource: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(ColumnProps).isRequired,

  expandIcon: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  indentSize: PropTypes.number.def(15),

  // TODO: 是否展开所有
  defaultExpandAllRows: PropTypes.bool,
  // defaultExpandedRowKeys: PropTypes.array,
  // TODO: 手动指定被展开的 rowKeys
  expandedRowKeys: PropTypes.array,
  // TODO: 展开指定 number 深度
  expandDepth: PropTypes.number,

  title: PropTypes.func,
  footer: PropTypes.func,

  loading: PropTypes.oneOfType([PropTypes.bool]).def(false),

  rowSelection: PropTypes.oneOfType([
    PropTypes.shape(TableRowSelection).loose,
    null
  ])

  // sortDirections: PropTypes.array.def([]),
  // childrenColumnName: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),

  // FIXME: what custom means?
  // customRow: PropTypes.func,
  // customHeaderRow: PropTypes.func

  // TODO: expanded table props
  // expandedRowRender: PropTypes.any,
  // expandIconAsCell: PropTypes.bool,
  // expandIconColumnIndex: PropTypes.number,
  // expandRowByClick: PropTypes.bool

  // className?: PropTypes.string,
  // style?: React.CSSProperties;
  // children?: React.ReactNode;
  // onRowClick?: (record: T, index: number, event: Event) => any;
  // onExpandedRowsChange?: (expandedRowKeys: string[] | number[]) => void;
  // onExpand?: (expanded: boolean, record: T) => void;
  // onChange?: (pagination: PaginationProps | boolean, filters: string[], sorter: Object) => any;
}

// export const SelectionCheckboxAllProps = {
//   store: Store,
//   locale: PropTypes.any,
//   disabled: PropTypes.bool,
//   getCheckboxPropsByItem: PropTypes.func,
//   getRecordKey: PropTypes.func,
//   data: PropTypes.array,
//   prefixCls: PropTypes.string,
//   // onSelect: (key: string, index: number, selectFunc: any) => void;
//   hideDefaultSelections: PropTypes.bool,
//   selections: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
//   getPopupContainer: PropTypes.func
// }

// export interface SelectionCheckboxAllState {
//   checked: PropTypes.bool,
//   indeterminate: PropTypes.bool,
// }

// export const SelectionBoxProps = {
//   store: Store,
//   type: RowSelectionType,
//   defaultSelection: PropTypes.arrayOf([PropTypes.string, PropTypes.number]),
//   rowIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
//   name: PropTypes.string,
//   disabled: PropTypes.bool,
//   id: PropTypes.string
//   onChange: React.ChangeEventHandler<HTMLInputElement>;
// }

// export const FilterMenuProps = {
//   locale: TableLocale,
//   selectedKeys: PropTypes.arrayOf([PropTypes.string, PropTypes.number]),
//   column: PropTypes.object,
//   confirmFilter: PropTypes.func,
//   prefixCls: PropTypes.string,
//   dropdownPrefixCls: PropTypes.string,
//   getPopupContainer: PropTypes.func,
//   handleFilter: PropTypes.func
// }
