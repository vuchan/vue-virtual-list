export const DEFAULT_COMPONENTS = {
  wrapper: 'div',
  table: 'table',
  header: {
    wrapper: 'thead',
    row: 'tr',
    cell: 'th'
  },
  body: {
    wrapper: 'tbody',
    row: 'tr',
    cell: 'td'
  },
  select: 'select',
  checkbox: 'checkbox',
  radio: 'radio',
  dropdown: 'select'
}

export const DEFAULT_LOCALE = {
  filterTitle: '过滤器',
  filterConfirm: '确定',
  filterReset: '重置',
  emptyText: '暂无数据',
  selectAll: '选择全部',
  selectInvert: '反选',
  sortTitle: '排序'
}

export const STYLE_WRAPPER = {
  position: 'relative',
  overflowY: 'hidden'
  // overflow: 'hidden'
}

export const STYLE_INNER = {
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: '100%',
  willChange: 'transform',
  WebkitOverflowScrolling: 'touch'
}
