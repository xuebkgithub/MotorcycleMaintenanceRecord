// 车辆管理页面 - 重构版本
// 功能：车辆的增删改查，设置默认车辆

const storage = require('../../utils/storage');

Page({
  data: {
    vehicles: [],           // 车辆列表
    currentVehicleId: ''    // 当前选中的车辆ID
  },

  /**
   * 页面加载
   */
  onLoad(options) {
    console.log('=== 📄 车辆管理页面 - onLoad ===');
    console.log('页面参数:', options);
    this.loadVehicles();
  },

  /**
   * 页面显示（每次进入都会触发）
   */
  onShow() {
    console.log('=== 📄 车辆管理页面 - onShow ===');
    this.loadVehicles();
  },

  /**
   * 页面初次渲染完成
   */
  onReady() {
    console.log('=== 📄 车辆管理页面 - onReady ===');
    console.log('页面渲染完成，组件已准备好');
  },

  /**
   * 加载车辆数据
   */
  loadVehicles() {
    console.log('--- 开始加载车辆数据 ---');

    try {
      const vehicles = storage.getVehicles();
      const currentVehicleId = storage.getCurrentVehicleId();

      console.log('车辆数据:', vehicles);
      console.log('车辆数量:', vehicles.length);
      console.log('当前车辆ID:', currentVehicleId);

      this.setData({
        vehicles: vehicles || [],
        currentVehicleId: currentVehicleId || ''
      }, () => {
        console.log('✅ 数据设置成功');
        console.log('页面数据:', this.data);
      });
    } catch (error) {
      console.error('❌ 加载车辆数据失败:', error);
      wx.showToast({
        title: '加载数据失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 添加车辆按钮点击
   */
  onAddVehicle(e) {
    console.log('=== 🚗 添加车辆按钮被点击 ===');
    console.log('事件对象:', e);
    console.log('事件类型:', e.type);
    console.log('时间戳:', e.timeStamp);
    console.log('当前时间:', new Date().toLocaleTimeString());

    try {
      const targetUrl = '/pages/vehicle-edit/index?mode=add';
      console.log('准备跳转到:', targetUrl);

      wx.navigateTo({
        url: targetUrl,
        success: (res) => {
          console.log('✅ 页面跳转成功');
          console.log('跳转结果:', res);
        },
        fail: (err) => {
          console.error('❌ 页面跳转失败');
          console.error('错误信息:', err);
          console.error('错误消息:', err.errMsg);

          wx.showModal({
            title: '跳转失败',
            content: `无法打开车辆编辑页面\n错误：${err.errMsg}`,
            showCancel: false
          });
        },
        complete: () => {
          console.log('页面跳转操作完成（无论成功或失败）');
        }
      });
    } catch (error) {
      console.error('❌ onAddVehicle 发生异常:', error);
      console.error('异常堆栈:', error.stack);

      wx.showModal({
        title: '发生错误',
        content: `操作失败：${error.message}`,
        showCancel: false
      });
    }

    console.log('=== onAddVehicle 方法执行完毕 ===\n');
  },

  /**
   * 编辑车辆
   */
  onEditVehicle(e) {
    console.log('=== ✏️ 编辑车辆 ===');

    const { id } = e.currentTarget.dataset;
    console.log('车辆ID:', id);

    if (!id) {
      console.error('❌ 未获取到车辆ID');
      wx.showToast({
        title: '数据错误',
        icon: 'none'
      });
      return;
    }

    console.log('跳转到编辑页面...');
    wx.navigateTo({
      url: `/pages/vehicle-edit/index?mode=edit&id=${id}`,
      success: () => {
        console.log('✅ 跳转成功');
      },
      fail: (err) => {
        console.error('❌ 跳转失败:', err);
      }
    });
  },

  /**
   * 设置默认车辆
   */
  onSetDefault(e) {
    console.log('=== ⭐ 设置默认车辆 ===');

    const { id } = e.currentTarget.dataset;
    console.log('车辆ID:', id);

    if (!id) {
      console.error('❌ 未获取到车辆ID');
      return;
    }

    try {
      // 更新所有车辆的默认状态
      let vehicles = storage.getVehicles();
      vehicles = vehicles.map(v => ({
        ...v,
        isDefault: v.id === id
      }));

      storage.setVehicles(vehicles);
      console.log('✅ 默认车辆设置成功');

      wx.showToast({
        title: '设置成功',
        icon: 'success',
        duration: 1500
      });

      // 刷新页面数据
      this.loadVehicles();
    } catch (error) {
      console.error('❌ 设置默认车辆失败:', error);
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      });
    }
  },

  /**
   * 删除车辆
   */
  onDeleteVehicle(e) {
    console.log('=== 🗑️ 删除车辆 ===');

    // SwipeCell 的 action-click 事件从 detail 中获取信息
    const { index } = e.detail || e.currentTarget.dataset;
    console.log('车辆索引:', index);

    if (index === undefined) {
      console.error('❌ 未获取到车辆索引');
      return;
    }

    const vehicle = this.data.vehicles[index];
    if (!vehicle) {
      console.error('❌ 未找到对应车辆');
      return;
    }

    console.log('准备删除的车辆:', vehicle);

    // 检查是否是最后一辆车
    if (this.data.vehicles.length <= 1) {
      console.warn('⚠️ 这是最后一辆车，不允许删除');
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
      content: `确定删除车辆"${vehicle.name}"吗？\n删除后该车辆的所有记录也将被删除`,
      confirmText: '删除',
      confirmColor: '#E34D59',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认删除');
          this.performDelete(vehicle.id);
        } else {
          console.log('用户取消删除');
        }
      }
    });
  },

  /**
   * 执行删除操作
   */
  performDelete(vehicleId) {
    console.log('--- 执行删除操作 ---');
    console.log('车辆ID:', vehicleId);

    try {
      // 1. 删除车辆
      let vehicles = storage.getVehicles();
      vehicles = vehicles.filter(v => v.id !== vehicleId);
      storage.setVehicles(vehicles);
      console.log('✅ 车辆已删除');

      // 2. 如果删除的是当前车辆，切换到第一辆车
      if (vehicleId === this.data.currentVehicleId && vehicles.length > 0) {
        storage.setCurrentVehicleId(vehicles[0].id);
        console.log('✅ 已切换到第一辆车');
      }

      // 3. 删除该车辆的所有保养记录
      let maintenanceRecords = storage.getMaintenanceRecords();
      maintenanceRecords = maintenanceRecords.filter(r => r.vehicleId !== vehicleId);
      storage.setMaintenanceRecords(maintenanceRecords);
      console.log('✅ 保养记录已删除');

      // 4. 删除该车辆的所有油耗记录
      let fuelRecords = storage.getFuelRecords();
      fuelRecords = fuelRecords.filter(r => r.vehicleId !== vehicleId);
      storage.setFuelRecords(fuelRecords);
      console.log('✅ 油耗记录已删除');

      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 1500
      });

      // 刷新页面数据
      this.loadVehicles();
    } catch (error) {
      console.error('❌ 删除操作失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
  }
});
