// 统计卡片组件
// 用于首页宫格统计数据展示

Component({
  properties: {
    // 标签文本（如：上次维护）
    label: {
      type: String,
      value: ''
    },
    // 数值（如：12500）
    value: {
      type: String,
      value: ''
    },
    // 单位（如：km）
    unit: {
      type: String,
      value: ''
    },
    // 图标名称（TDesign图标）
    icon: {
      type: String,
      value: ''
    }
  }
});
