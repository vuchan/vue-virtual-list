/**
 * @class ExpandManager
 */
export default class ExpandManager {
  /**
   * @typedef {Node}
   * @property {string} id
   * @property {Node[]} [children]
   *
   * @param {Node} treeData
   * @param {string|(Node) => string} rowKey
   *
   * @constructor
   */
  constructor(treeData, rowKey) {
    this.treeData = treeData
    this.rowKey = rowKey
    this._cached = {
      [rowKey]: {
        0: [],
        1: []
      }
    }
  }

  /* state */
  isExpandable(key) {}
  isExpanded(key) {}

  /* action */
  expandItem(item) {}
  expandDepth(item, depth) {
    return this._cache(this._genDepthKey(item, depth), () => {
      return this._travelDFS(item)
    })
  }
  expandAll() {}

  reset(treeData) {
    this.treeData = treeData
    this._cached = {}
  }

  _getRowKey(item) {
    return typeof this.getRowKey === 'function'
      ? this.getRowKey(item)
      : item[this.rowKey]
  }

  _genDepthKey(item, depth) {
    const rowKey = this._getRowKey(item)

    return 'expand-depth:' + rowKey + ':' + depth
  }

  _travelDFS(item) {
    const self = this
    const result = []

    function travelDFS(treeData, depth, parent) {
      travelArray(treeData, function findChildren(element, index) {
        if (parent) {
          element.__parent = parent
        }

        element.__depth = depth
        element.__index = index

        self._setCache(this._genDepthKey(item, depth), [...result])

        result.push(element)

        if (element.children && element.children.length) {
          travelDFS(element.children, depth++, element)
        }
      })
    }

    travelDFS(item, item.__depth || 0, null)

    return result
  }

  _setCache(name, value) {
    return (this._cached[name] = value)
  }

  _cache(name, fn) {
    if (name in this._cached) {
      return this._cached[name]
    }

    this._cached[name] = fn()

    return this._cached[name]
  }
}

function travelArray(array, callback) {
  for (let index = 0; index < array.length; index++) {
    const element = array[index]

    if (callback(element, index)) {
      return element
    }
  }
}
