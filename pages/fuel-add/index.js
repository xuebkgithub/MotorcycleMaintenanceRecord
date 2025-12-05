// 油耗记录新增/编辑页面
// 支持新增模式和编辑模式（通过 URL 参数 id 区分）

const storage = require('../../utils/storage');
const validator = require('../../utils/form-validator');

Page({
  data: {
    // 表单数据
    formData: {
      time: '',
      fuelType: '',
      totalMileage: '',
      displayAmount: '',
      fuelVolume: '',
      displayUnitPrice: '',
      actualAmount: '',
      discount: '',
      actualUnitPrice: '',
      isFull: null,
      isLightOn: null,
      isLastRecorded: null,
      note: ''
    },

    // 编辑模式
    isEditMode: false,
    editId: '',

    // 油品类型选项（一维数组，符合TDesign Picker规范）
    fuelTypeOptions: [
      { label: '90#', value: '90#' },
      { label: '92#', value: '92#' },
      { label: '95#', value: '95#' },
      { label: '98#', value: '98#' }
    ],

    // 布尔值选项
    fullOptions: [
      { label: '加满', value: true },
      { label: '没加满', value: false }
    ],
    lightOptions: [
      { label: '油灯亮了', value: true },
      { label: '没亮', value: false }
    ],
    recordOptions: [
      { label: '记录了', value: true },
      { label: '漏记了', value: false }
    ],

    // Picker 显示控制
    showFuelTypePicker: false,
    showTimePicker: false,

    // 错误提示
    errors: {}
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      // 编辑模式：加载已有数据
      this.loadRecord(id);
    } else {
      // 新增模式：设置默认时间为当前时间
      this.setData({
        'formData.time': this.getCurrentDateTime()
      });
    }
  },

  // 加载已有记录
  loadRecord(id) {
    const records = storage.getFuelRecords();
    const record = records.find(r => r.id === id);

    if (record) {
      this.setData({
        formData: { ...record },
        isEditMode: true,
        editId: id
      });
    } else {
      wx.showToast({
        title: '记录不存在',
        icon: 'error'
      });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  // 加油时间 Picker
  onTimePickerShow() {
    this.setData({ showTimePicker: true });
  },

  onTimePickerConfirm(e) {
    const { value } = e.detail;
    this.setData({
      'formData.time': value,
      showTimePicker: false
    });
  },

  onTimePickerCancel() {
    this.setData({ showTimePicker: false });
  },

  // 油品类型 Picker
  onFuelTypePickerShow() {
    this.setData({ showFuelTypePicker: true });
  },

  onFuelTypePickerConfirm(e) {
    const { value, label } = e.detail;
    console.log('选中的油品:', value, label);
    this.setData({
      'formData.fuelType': value[0],
      showFuelTypePicker: false
    });
  },

  onFuelTypePickerCancel() {
    this.setData({ showFuelTypePicker: false });
  },

  // 总里程输入
  onTotalMileageInput(e) {
    this.setData({ 'formData.totalMileage': e.detail.value });
  },

  // 显示金额输入
  onDisplayAmountInput(e) {
    this.setData({ 'formData.displayAmount': e.detail.value });
  },

  // 加油量输入
  onFuelVolumeInput(e) {
    this.setData({ 'formData.fuelVolume': e.detail.value });
  },

  // 显示单价输入
  onDisplayUnitPriceInput(e) {
    this.setData({ 'formData.displayUnitPrice': e.detail.value });
  },

  // 实付金额输入
  onActualAmountInput(e) {
    this.setData({ 'formData.actualAmount': e.detail.value });
  },

  // 优惠金额输入
  onDiscountInput(e) {
    this.setData({ 'formData.discount': e.detail.value });
  },

  // 实际单价输入
  onActualUnitPriceInput(e) {
    this.setData({ 'formData.actualUnitPrice': e.detail.value });
  },

  // 是否加满变化
  onIsFullChange(e) {
    this.setData({ 'formData.isFull': e.detail.value });
  },

  // 油灯是否亮变化
  onIsLightOnChange(e) {
    this.setData({ 'formData.isLightOn': e.detail.value });
  },

  // 上次是否记录变化
  onIsLastRecordedChange(e) {
    this.setData({ 'formData.isLastRecorded': e.detail.value });
  },

  // 保存按钮
  onSave() {
    // 1. 验证表单
    const validation = validator.validateFuelForm(this.data.formData);
    if (!validation.valid) {
      this.setData({ errors: validation.errors });
      wx.showToast({
        title: '请检查表单',
        icon: 'error'
      });
      return;
    }

    // 2. 准备数据（字段映射以兼容详情页显示）
    const record = {
      ...this.data.formData,
      // 数字字段转换
      totalMileage: Number(this.data.formData.totalMileage),
      displayAmount: Number(Number(this.data.formData.displayAmount).toFixed(2)),
      fuelVolume: Number(Number(this.data.formData.fuelVolume).toFixed(2)),
      displayUnitPrice: Number(Number(this.data.formData.displayUnitPrice).toFixed(2)),
      actualAmount: Number(Number(this.data.formData.actualAmount).toFixed(2)),
      discount: Number(Number(this.data.formData.discount).toFixed(2)),
      actualUnitPrice: Number(Number(this.data.formData.actualUnitPrice).toFixed(2)),

      // 兼容字段（用于详情页显示）
      date: this.data.formData.time,
      mileage: Number(this.data.formData.totalMileage),
      volume: Number(Number(this.data.formData.fuelVolume).toFixed(2)),
      cost: Number(Number(this.data.formData.actualAmount).toFixed(2)),
      fuelConsumption: this.data.formData.fuelVolume > 0 ?
        (Number(this.data.formData.fuelVolume) / 100).toFixed(2) : '0.00'
    };

    // 3. 保存到 Storage
    const allRecords = storage.getFuelRecords();

    if (this.data.isEditMode) {
      // 编辑模式：更新记录
      const index = allRecords.findIndex(r => r.id === this.data.editId);
      if (index !== -1) {
        allRecords[index] = { ...allRecords[index], ...record };
      }
    } else {
      // 新增模式：生成ID并添加，绑定当前车辆
      record.id = 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      record.vehicleId = storage.getCurrentVehicleId();
      allRecords.unshift(record);
    }

    const success = storage.setFuelRecords(allRecords);

    // 4. 反馈和导航
    if (success) {
      wx.showToast({
        title: this.data.isEditMode ? '修改成功' : '添加成功',
        icon: 'success',
        duration: 1500
      });
      // 立即返回，让列表页/详情页的onShow自动刷新
      wx.navigateBack();
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  // 取消按钮
  onCancel() {
    wx.navigateBack();
  },

  // 获取当前日期时间
  getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
});
