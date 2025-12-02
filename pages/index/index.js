// 首页 - 摩托车维护记录概览
// 展示车辆信息、统计数据、最近维护/加油记录

const mockData = require('../../utils/mock-data');
const storage = require('../../utils/storage');
const calculator = require('../../utils/calculator');

Page({
  data: {
    // 车辆信息
    vehicleInfo: {},

    // 统计数据
    stats: {
      lastMaintenance: '暂无',
      totalCost: '0',
      recentFuelConsumption: '暂无',
      averageFuelConsumption: '暂无'
    },

    // Tabs 当前索引
    currentTab: 0,

    // 维护记录（最近5条）
    maintenanceRecords: [],

    // 加油记录（最近5条）
    fuelRecords: [],

    // 加载状态
    loading: true
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    // 每次显示时刷新数据（切换车辆后返回时）
    this.initData();
  },

  // 初始化数据
  initData() {
    // 检查是否有数据，无则初始化 Mock 数据
    let vehicleInfo = storage.getVehicleInfo();
    if (!vehicleInfo.model) {
      mockData.initMockData();
    }

    // 获取当前车辆信息
    const currentVehicle = storage.getCurrentVehicle();
    if (currentVehicle) {
      vehicleInfo = {
        model: currentVehicle.model || '未设置车辆',
        mileage: currentVehicle.mileage || 0
      };
    } else {
      // 兼容旧数据
      vehicleInfo = storage.getVehicleInfo();
    }

    // 读取当前车辆的数据
    const currentVehicleId = storage.getCurrentVehicleId();
    let maintenanceRecords = storage.getMaintenanceRecords();
    let fuelRecords = storage.getFuelRecords();

    // 过滤当前车辆的记录
    if (currentVehicleId) {
      maintenanceRecords = maintenanceRecords.filter(r => r.vehicleId === currentVehicleId);
      fuelRecords = fuelRecords.filter(r => r.vehicleId === currentVehicleId);
    }

    // 计算统计数据
    const stats = {
      lastMaintenance: calculator.getLastMaintenanceMileage(maintenanceRecords),
      totalCost: calculator.getTotalCost(maintenanceRecords, fuelRecords),
      recentFuelConsumption: calculator.getRecentFuelConsumption(fuelRecords),
      averageFuelConsumption: calculator.getAverageFuelConsumption(fuelRecords)
    };

    // 获取最近记录
    const recentMaintenance = calculator.getRecentRecords(maintenanceRecords, 5);
    const recentFuel = calculator.getRecentRecords(fuelRecords, 5);

    // 更新页面数据
    this.setData({
      vehicleInfo,
      stats,
      maintenanceRecords: recentMaintenance,
      fuelRecords: recentFuel,
      loading: false
    });
  },

  // Tabs 切换
  onTabChange(e) {
    this.setData({
      currentTab: e.detail.value
    });
  },

  // 点击维护记录
  onMaintenanceItemTap(e) {
    const { record } = e.detail;

    if (!record || !record.id) {
      wx.showToast({
        title: '数据错误',
        icon: 'none'
      });
      return;
    }

    // 先缓存要查看的记录ID
    wx.setStorageSync('pendingMaintenanceDetailId', record.id);

    // 跳转到列表页，列表页会自动打开详情
    wx.switchTab({
      url: '/pages/maintenance-list/index'
    });
  },

  // 点击加油记录
  onFuelItemTap(e) {
    const { record } = e.detail;

    if (!record || !record.id) {
      wx.showToast({
        title: '数据错误',
        icon: 'none'
      });
      return;
    }

    // 先缓存要查看的记录ID
    wx.setStorageSync('pendingFuelDetailId', record.id);

    // 跳转到列表页，列表页会自动打开详情
    wx.switchTab({
      url: '/pages/fuel-list/index'
    });
  },

  // 查看更多维护记录
  viewMoreMaintenance() {
    wx.switchTab({
      url: '/pages/maintenance-list/index'
    });
  },

  // 查看更多加油记录
  viewMoreFuel() {
    wx.switchTab({
      url: '/pages/fuel-list/index'
    });
  },

  // 切换车辆
  onSwitchVehicle() {
    wx.navigateTo({
      url: '/pages/vehicle-select/index'
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '摩托车维护记录',
      path: '/pages/index/index'
    };
  }
});
