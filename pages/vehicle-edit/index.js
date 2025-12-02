// 车辆编辑页面
// 支持新增和编辑车辆
const storage = require('../../utils/storage');

Page({
  data: {
    mode: 'add', // add | edit
    vehicleId: '',
    formData: {
      name: '',
      model: '',
      note: ''
    }
  },

  onLoad(options) {
    const { mode, id } = options;
    this.setData({ mode: mode || 'add' });

    // 如果是编辑模式，加载车辆数据
    if (mode === 'edit' && id) {
      this.setData({ vehicleId: id });
      this.loadVehicleData(id);
    }

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: mode === 'add' ? '添加车辆' : '编辑车辆'
    });
  },

  // 加载车辆数据
  loadVehicleData(id) {
    const vehicles = storage.getVehicles();
    const vehicle = vehicles.find(v => v.id === id);

    if (vehicle) {
      this.setData({
        formData: {
          name: vehicle.name,
          model: vehicle.model,
          note: vehicle.note
        }
      });
    }
  },

  // 输入事件
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 保存
  onSave() {
    // 验证车辆名称
    if (!this.data.formData.name.trim()) {
      wx.showToast({
        title: '请输入车辆名称',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (this.data.mode === 'add') {
      this.addVehicle();
    } else {
      this.updateVehicle();
    }
  },

  // 添加车辆
  addVehicle() {
    const vehicles = storage.getVehicles();

    const newVehicle = {
      id: 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: this.data.formData.name.trim(),
      model: this.data.formData.model.trim(),
      mileage: 0,
      note: this.data.formData.note.trim(),
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-'),
      isDefault: false
    };

    // 如果是第一辆车，设为默认和当前
    if (vehicles.length === 0) {
      newVehicle.isDefault = true;
      storage.setCurrentVehicleId(newVehicle.id);
    }

    vehicles.unshift(newVehicle);
    const success = storage.setVehicles(vehicles);

    if (success) {
      wx.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      wx.showToast({
        title: '添加失败',
        icon: 'error',
        duration: 2000
      });
    }
  },

  // 更新车辆
  updateVehicle() {
    let vehicles = storage.getVehicles();
    const index = vehicles.findIndex(v => v.id === this.data.vehicleId);

    if (index !== -1) {
      vehicles[index] = {
        ...vehicles[index],
        name: this.data.formData.name.trim(),
        model: this.data.formData.model.trim(),
        note: this.data.formData.note.trim()
      };

      const success = storage.setVehicles(vehicles);

      if (success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'error',
          duration: 2000
        });
      }
    }
  },

  // 取消
  onCancel() {
    wx.navigateBack();
  }
});
