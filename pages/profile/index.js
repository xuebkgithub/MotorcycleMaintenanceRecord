// 我的页面
// 个人设置、数据管理、车辆信息

const storage = require('../../utils/storage');

Page({
  data: {
    vehicleInfo: {}
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 每次显示时刷新车辆信息
    this.loadData();
  },

  // 加载数据
  loadData() {
    const vehicleInfo = storage.getVehicleInfo();
    this.setData({ vehicleInfo });
  },

  // 导入数据
  onImportData() {
    wx.showToast({
      title: '导入功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  // 导出数据
  onExportData() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  // 车辆信息
  onVehicleInfo() {
    wx.navigateTo({
      url: '/pages/vehicle-manage/index'
    });
  },

  // 关于我们
  onAbout() {
    wx.showModal({
      title: '关于我们',
      content: '摩托车维护记录小程序\n版本：1.0.0\n\n帮助您轻松管理摩托车维护和油耗记录',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
