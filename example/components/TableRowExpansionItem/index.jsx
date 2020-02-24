import PropTypes from 'vue-types'
import './styles.less'

export default {
  name: 'TableRowExpandItem',

  props: {
    // eslint-disable-next-line vue/require-default-prop
    store: PropTypes.object.isRequired,
    // eslint-disable-next-line vue/require-default-prop
    row: PropTypes.object.isRequired,
    // eslint-disable-next-line vue/require-default-prop
    column: PropTypes.object,
    // eslint-disable-next-line vue/require-default-prop
    depth: PropTypes.integer.isRequired,
    indentSize: PropTypes.number.def(20)
  },

  computed: {
    className() {
      return this.expanded ? 'el-icon-minus' : 'el-icon-plus'
    },
    expanded() {
      return this.store.isRowExpanded(this.row)
    },
    title() {
      return '点击' + (this.expanded ? '收起' : '展开')
    },
    style() {
      return {
        marginLeft: this.indentSize * this.depth + 'px'
      }
    }
  },

  methods: {
    handleExpand(e) {
      e.preventDefault()
      e.stopPropagation()

      this.store.toggleRowExpansion(this.row)
    }
  },

  render() {
    return (
      <div
        class="expand-icon"
        style={this.style}
        title={this.title}
        onClick={this.handleExpand}
      >
        <span class={['icon', this.className]}>
          {this.expanded ? '-' : '+'}
        </span>
      </div>
    )
  }
}
