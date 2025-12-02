// 加油记录项组件
// 用于展示单条加油记录

Component({
  properties: {
    // 记录对象
    record: {
      type: Object,
      value: {}
    }
  },

  methods: {
    // 点击事件
    onTap() {
      console.log('fuel-item onTap 触发');
      console.log('record 数据:', this.data.record);
      this.triggerEvent('itemtap', { record: this.data.record });
    }
  }
});
