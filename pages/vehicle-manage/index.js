// 车辆管理页面
// 增删改查车辆信息
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

  // 添加车辆
  onAddVehicle() {
    wx.navigateTo({
      url: '/pages/vehicle-edit/index?mode=add'
    });
  },

  // 编辑车辆
  onEditVehicle(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;

    wx.navigateTo({
      url: `/pages/vehicle-edit/index?mode=edit&id=${id}`
    });
  },

  // 设置默认车辆
  onSetDefault(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;

    // 取消所有车辆的默认状态
    let vehicles = storage.getVehicles();
    vehicles = vehicles.map(v => ({
      ...v,
      isDefault: v.id === id
    }));

    storage.setVehicles(vehicles);

    wx.showToast({
      title: '设置成功',
      icon: 'success',
      duration: 1500
    });

    // 刷新列表
    this.loadData();
  },

  // 删除车辆
  onDeleteVehicle(e) {
    // SwipeCell 的 action-click 事件从 detail 中获取信息
    const { index } = e.detail || e.currentTarget.dataset;
    if (index === undefined) return;

    const vehicle = this.data.vehicles[index];
    if (!vehicle) return;

    const id = vehicle.id;

    // 检查是否是最后一辆车
    if (this.data.vehicles.length <= 1) {
      wx.showToast({
        title: '至少保留一辆车',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 确认删除
    wx.showModal({
      title: '确认删除',
      content: '删除后该车辆的所有记录也将被删除，是否继续？',
      confirmText: '删除',
      confirmColor: '#E34D59',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(id);
        }
      }
    });
  },

  // 执行删除
  performDelete(id) {
    // 1. 删除车辆
    let vehicles = storage.getVehicles();
    vehicles = vehicles.filter(v => v.id !== id);
    storage.setVehicles(vehicles);

    // 2. 如果删除的是当前车辆，切换到第一辆车
    if (id === this.data.currentVehicleId && vehicles.length > 0) {
      storage.setCurrentVehicleId(vehicles[0].id);
    }

    // 3. 删除该车辆的所有记录
    let maintenanceRecords = storage.getMaintenanceRecords();
    maintenanceRecords = maintenanceRecords.filter(r => r.vehicleId !== id);
    storage.setMaintenanceRecords(maintenanceRecords);

    let fuelRecords = storage.getFuelRecords();
    fuelRecords = fuelRecords.filter(r => r.vehicleId !== id);
    storage.setFuelRecords(fuelRecords);

    wx.showToast({
      title: '删除成功',
      icon: 'success',
      duration: 1500
    });

    // 刷新列表
    this.loadData();
  },

  // 返回
  onBack() {
    wx.navigateBack();
  }
});
