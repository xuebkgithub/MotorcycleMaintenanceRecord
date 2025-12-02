// 绿色单选按钮组组件
// 用于油耗表单的布尔值选择（是否加满、油灯是否亮、上次是否记录）

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 标题
    label: {
      type: String,
      value: ''
    },

    // 选项数组
    // 格式：[{label: '加满', value: true}, {label: '没加满', value: false}]
    options: {
      type: Array,
      value: []
    },

    // 当前值
    value: {
      type: Boolean,
      value: null
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 选择选项
    onSelect(e) {
      const { value } = e.currentTarget.dataset;

      // 触发变化事件
      this.triggerEvent('change', { value });
    }
  }
});
