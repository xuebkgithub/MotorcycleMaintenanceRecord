// 操作选择器组件
// 用于首页"记一笔"按钮点击后弹出的选择对话框

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示对话框
    visible: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 当前选中的类型
    selectedType: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 选择类型（点击后直接跳转）
    onSelectType(e) {
      const { type } = e.currentTarget.dataset;

      // 直接触发选择事件
      this.triggerEvent('select', { type });

      // 触发关闭事件
      this.triggerEvent('close');
    },

    // 取消按钮
    onCancel() {
      // 触发关闭事件
      this.triggerEvent('close');
    }
  }
});
