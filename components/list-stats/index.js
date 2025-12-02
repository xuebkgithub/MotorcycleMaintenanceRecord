// 列表统计头部组件
// 用于保养/油耗列表页顶部展示统计数据

Component({
  properties: {
    // 统计数据数组
    // 格式: [{label, value, unit, color}]
    stats: {
      type: Array,
      value: []
    }
  }
});
