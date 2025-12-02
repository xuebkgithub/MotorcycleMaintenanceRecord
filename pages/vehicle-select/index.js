// 车辆选择页面
// 用于切换当前车辆
const storage = require('../../utils/storage');

Page({
  data: {
    vehicles: [],
    currentVehicleId: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadData();
  },

  // 加载车辆数据
  loadData() {
    const vehicles = storage.getVehicles();
    const currentVehicleId = storage.getCurrentVehicleId();

    this.setData({
      vehicles,
      currentVehicleId
    });
  },

  // 选择车辆
  onSelectVehicle(e) {
    const { id } = e.currentTarget.dataset;

    // 如果点击的是当前车辆，直接返回
    if (id === this.data.currentVehicleId) {
      wx.navigateBack();
      return;
    }

    // 切换车辆
    const success = storage.setCurrentVehicleId(id);
    if (success) {
      wx.showToast({
        title: '切换成功',
        icon: 'success',
        duration: 1500
      });

      // 延迟返回，让用户看到提示
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      wx.showToast({
        title: '切换失败',
        icon: 'error',
        duration: 2000
      });
    }
  }
});
