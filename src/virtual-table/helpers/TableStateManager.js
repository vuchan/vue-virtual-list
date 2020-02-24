import { shallowEqual } from './utils/index'
import TreeDataAdapter from './TreeDataAdapter'

let entireDataSource = null
let _cached = null
let _rootTree = null

export default class TableStateManager {
  constructor(
    initialState = {
      dataSource: [], // any[]
      rowKey: 'id', // string | (row: object, index: number) => string
      expandDepth: null, // number
      expandedRowKeys: null, // number[]
      defaultExpandAllRows: false, // boolean
      rowSelection: null // { type: 'radio' | 'checkbox', selectedRowKeys: Array<string|number> }
    } // initialState: {}
  ) {
    // only used in inner state
    this.dataSource = []
    // used for common state & shared with Table component
    this.rowKey = null
    this.expandDepth = null
    this.expandedRowKeys = null
    this.defaultExpandAllRows = false

    /**
     * {
     *  type: 'radio' | 'checkbox', // 单选/多选,
     *  selectedRowKeys:  Array<string|number> // 被选中的 keys 数组(不包含 hover 的 rowKey)
     * }
     */
    this.rowSelection = null

    this.setState(initialState)
  }

  getRowKey(row, index) {
    const rowKey = this.rowKey
    let key

    if (!row) throw new Error('row is required when get row identity')
    if (typeof rowKey === 'string') {
      if (rowKey.indexOf('.') < 0) {
        key = row[rowKey]
        key = +key || key // when number type
      }

      let keyStr = rowKey.split('.')
      let current = row

      for (let i = 0; i < keyStr.length; i++) {
        current = current[keyStr[i]]
      }

      key = current
    } else if (typeof rowKey === 'function') {
      key = rowKey(row, index)
    }

    return key === undefined ? index : key
  }

  get _cached() {
    return _cached
  }

  set _cached(val) {
    return (_cached = val)
  }

  get rootTreeDataAdapter() {
    return _rootTree
  }

  set rootTreeDataAdapter(val) {
    return (_rootTree = val)
  }

  setState(state, callback) {
    console.log('setState: ', state)
    for (let prop in state) {
      if (
        state.hasOwnProperty(prop) && // state own props
        this.hasOwnProperty(prop) && // is instance own props
        typeof this.prop !== 'function' // not function type
      ) {
        if (prop === 'dataSource') {
          this._updateDataSource(state[prop])
        } else {
          if (!shallowEqual(state[prop], this[prop])) {
            this[prop] = state[prop]
            this._updateSideEffects()
          }
        }
      }
    }

    if (typeof callback === 'function') {
      // eslint-disable-next-line standard/no-callback-literal
      callback(this)
    }
  }

  _updateDataSource(dataSource) {
    this.dataSource = dataSource

    if (!dataSource || !dataSource.length) return

    if (dataSource !== entireDataSource) {
      entireDataSource = dataSource || []

      // clean inner cached
      this._cached = null
      // redefine a new TreeDataAdapter instance
      this.rootTreeDataAdapter = new TreeDataAdapter({
        root: true,
        id: 'root',
        tree: entireDataSource,
        getRowKey: this.getRowKey.bind(this)
      })

      // reset side effects
      this._updateSideEffects()
    }
  }

  _updateSideEffects() {
    // 优先级: defaultExpandAllRows > expandedRowKeys > expandDepth
    if (!entireDataSource || !entireDataSource.length) return

    if (this.defaultExpandAllRows) {
      this.toggleExpandAll()
    } else if (
      Array.isArray(this.expandedRowKeys) &&
      this.expandedRowKeys.length
    ) {
      this.toggleExpandKeys(this.expandedRowKeys)
    } else if (typeof this.expandDepth === 'number') {
      this.toggleExpandDepth(this.expandDepth)
    }
  }

  /**
   * rowKey 是否已展开，判断当前行是否是展开状态
   * @param {number} rowKey
   */
  isRowExpanded(rowKey) {
    return this.expandedRowKeys.includes(this._adaptRowKey(rowKey))
  }

  /**
   * 展开/收起指定 rowKey，切换当前行展开收起状态
   * @param {number} rowKey
   * @param {boolean} state
   */
  toggleRowExpansion(rowKey, state) {
    rowKey = this._adaptRowKey(rowKey)

    const expandedRowKeys = this.expandedRowKeys || []
    const isExpanded = this.isRowExpanded(rowKey)
    const toggle = () => {
      if (isExpanded) {
        const childRowKeys = this.rootTreeDataAdapter
          .findNodeByKey(rowKey)
          .findChildrenLeaves()

        if (childRowKeys && childRowKeys.length) {
          for (let i = 0; i < childRowKeys.length; i++) {
            expandedRowKeys.splice(expandedRowKeys.indexOf(childRowKeys[i]), 1)
          }
        }

        expandedRowKeys.splice(expandedRowKeys.indexOf(rowKey), 1)
      } else {
        expandedRowKeys.push(rowKey)
      }
    }

    if (state !== undefined) {
      if (state) {
        if (!isExpanded) {
          expandedRowKeys.push(rowKey)
        }
      } else {
        if (isExpanded) {
          expandedRowKeys.splice(expandedRowKeys.indexOf(rowKey), 1)
        }
      }
    } else {
      toggle()
    }

    this.dataSource = this._updateDataSourceByKeys()
  }

  toggleExpandKeys() {
    this.dataSource = this._updateDataSourceByKeys()
  }

  /**
   * 展开/收起 全部
   */
  toggleExpandAll() {
    const newData = []

    DFSForEach(entireDataSource, (child) => {
      newData.push(child)

      if (child && child.children && child.children.length) {
        const rowKey = this.getRowKey(child)

        if (!this.expandedRowKeys.includes(rowKey)) {
          this.expandedRowKeys.push(rowKey)
        }
      }
    })

    this.dataSource = newData
  }

  /**
   * 展开指定深度层级的数据并返回
   * @param {number|boolean} depth
   */
  toggleExpandDepth(depth) {
    this.expandedRowKeys = []
    this._updateDataSourceByDepth(depth).forEach((item) => {
      if (item && item.children && item.children.length) {
        this.expandedRowKeys.push(this.getRowKey(item))
      }
    })

    this.dataSource = this._updateDataSourceByKeys()
  }

  /**
   * 根据 depth 更新 dataSource
   * @param {number|boolean} depth
   */
  _updateDataSourceByDepth(depth) {
    const depthKey =
      typeof depth === 'boolean' && depth ? 'all' : `depth-${depth}`
    let newData = (this._cached || (this._cached = {}))[depthKey] || []

    if (newData.length) {
      return newData
    } else {
      return (this._cached[depthKey] = genDataByDepth(
        entireDataSource,
        depth,
        0
      ))
    }
  }

  /**
   * 根据 expandedRowKeys 更新 dataSource
   */
  _updateDataSourceByKeys() {
    const { expandedRowKeys = [] } = this

    if (!expandedRowKeys.length) {
      return entireDataSource
    } else {
      // const newData = []
      const paths = []

      expandedRowKeys.forEach((key) => {
        paths.push(this.rootTreeDataAdapter.genParentPath(key))
      })

      return this._genDataSource(paths)
    }
  }

  _genDataSource(paths) {
    const generatedKeys = []
    let data

    if (paths && paths.length) {
      while (paths.length) {
        const keys = paths.shift()

        while (keys.length) {
          const key = keys.shift()

          if (!generatedKeys.includes(key)) {
            const leaf = this.rootTreeDataAdapter.findNodeByKey(key)

            if (leaf && leaf instanceof TreeDataAdapter) {
              data = leaf.genData(data)
            } else {
              // eslint-disable-next-line no-console
              console.warn(
                `This key '${key}' is not an valid instance of TreeDataAdapter`
              )
            }
            /* console.log(
              'data: ',
              data.length,
              data.map((t, i) => this.getRowKey(t, i))
            ) */
            generatedKeys.push(key)
            // console.log('generatedKeys: ', generatedKeys)
          }
        }
      }
    }

    return data
  }

  /**
   * findRowByKey
   * @param {number|{}} rowKey
   * @returns {undefined|{}}
   */
  findRowByKey(rowKey) {
    rowKey = this._adaptRowKey(rowKey)
    const cachedKey = `row-${rowKey}`
    const cached = this._cached || (this._cached = {})
    const cachedRow = cached[cachedKey]

    return (
      cachedRow ||
      (cached[cachedKey] = DFSForEach(entireDataSource, (child) => {
        if (this.getRowKey(child) === rowKey) {
          return child
        }
      }))
    )
  }

  /**
   * _adaptRowKey
   * @param {number|{}} rowOrRowKey
   * @returns {number|string}
   */
  _adaptRowKey(rowOrRowKey) {
    if (rowOrRowKey && typeof rowOrRowKey === 'object') {
      rowOrRowKey = this.getRowKey(rowOrRowKey)
    }

    return rowOrRowKey
  }

  /**
   * 返回随机字符串
   */
  _randomStr() {
    return Math.random()
      .toString(32)
      .slice(2)
  }

  _uniqueArr(arr) {
    const newArr = []
    const hash = {}

    for (let i = 0; i < arr.length; i++) {
      const ele = arr[i]

      if (hash[ele] === undefined) {
        newArr.push(ele)
        hash[ele] = ele
      }
    }

    return newArr
  }

  /**
   * 判断当前行是否是选中状态
   * @param {number} rowKey
   */
  isSelected(rowKey) {
    return this.rowSelection.selectedRowKeys.includes(rowKey)
  }

  /**
   * 当前行是否选中状态
   * @param {number} rowKey
   */
  toggleRowSelection(rowKey) {
    if (rowKey) {
      const { type, selectedRowKeys } = this.rowSelection

      if (type === 'radio') {
        if (this.isSelected(rowKey)) {
          this.rowSelection.selectedRowKeys = []
        } else {
          this.rowSelection.selectedRowKeys = [rowKey]
        }
      }

      if (type === 'checkbox') {
        if (selectedRowKeys.includes(rowKey)) {
          selectedRowKeys.splice(selectedRowKeys.indexOf(rowKey), 1)
        } else {
          selectedRowKeys.push(rowKey)
        }

        this.rowSelection.selectedRowKeys = selectedRowKeys
      }
    }
  }
}

const genDataByDepth = (children, maxDepth, currDepth = 0, data = []) => {
  let child = null

  if (currDepth >= maxDepth) return (currDepth = 0) || []

  for (let i = 0, l = children.length; i < l; i++) {
    child = children[i]
    data[data.length] = child

    if (child && child.children && child.children.length) {
      genDataByDepth(child.children, maxDepth, currDepth + 1, data)
    }
  }

  return data
}

const DFSForEach = (children, callback, depth) => {
  depth = depth || 0

  for (let i = 0, l = children.length; i < l; i++) {
    let child = children[i]

    if (child && callback(child, depth)) {
      return child
    }

    if (child && child.children && child.children.length) {
      DFSForEach(child.children, callback, depth + 1)
    }
  }
}
