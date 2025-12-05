// 保养记录新增/编辑页面
// 支持新增模式和编辑模式（通过 URL 参数 id 区分）

const storage = require('../../utils/storage');
const validator = require('../../utils/form-validator');

Page({
  data: {
    // 表单数据
    formData: {
      type: '',
      date: '',
      mileage: '',
      cost: '',
      items: [],
      note: ''
    },

    // 编辑模式
    isEditMode: false,
    editId: '',

    // 保养类型选项（一维数组，符合TDesign Picker规范）
    maintenanceTypeOptions: [
      { label: '小保养', value: '小保养' },
      { label: '大保养', value: '大保养' },
      { label: '临时维修', value: '临时维修' },
      { label: '换机油', value: '换机油' },
      { label: '换机滤', value: '换机滤' },
      { label: '换空滤', value: '换空滤' },
      { label: '换火花塞', value: '换火花塞' },
      { label: '换齿轮油', value: '换齿轮油' },
      { label: '换刹车油', value: '换刹车油' },
      { label: '换链条', value: '换链条' },
      { label: '换轮胎', value: '换轮胎' },
      { label: '换刹车片', value: '换刹车片' },
      { label: '其他', value: '其他' }
    ],

    // 保养项目选项
    itemOptions: [
      { label: '机油', value: '机油', checked: false },
      { label: '机滤', value: '机滤', checked: false },
      { label: '空滤', value: '空滤', checked: false },
      { label: '火花塞', value: '火花塞', checked: false },
      { label: '齿轮油', value: '齿轮油', checked: false },
      { label: '刹车油', value: '刹车油', checked: false },
      { label: '链条', value: '链条', checked: false },
      { label: '轮胎', value: '轮胎', checked: false },
      { label: '刹车片', value: '刹车片', checked: false },
      { label: '冷却液', value: '冷却液', checked: false },
      { label: '电瓶', value: '电瓶', checked: false },
      { label: '其他', value: '其他', checked: false }
    ],

    // Picker 显示控制
    showTypePicker: false,
    showDatePicker: false,

    // 错误提示
    errors: {}
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      // 编辑模式：加载已有数据
      this.loadRecord(id);
    } else {
      // 新增模式：设置默认日期为当前时间
      this.setData({
        'formData.date': this.getCurrentDateTime()
      });
    }
  },

  // 加载已有记录
  loadRecord(id) {
    const records = storage.getMaintenanceRecords();
    const record = records.find(r => r.id === id);

    if (record) {
      // 更新 checkbox 选中状态
      const updatedItemOptions = this.data.itemOptions.map(option => ({
        ...option,
        checked: record.items.includes(option.value)
      }));

      this.setData({
        formData: { ...record },
        isEditMode: true,
        editId: id,
        itemOptions: updatedItemOptions
      });
    } else {
      wx.showToast({
        title: '记录不存在',
        icon: 'error'
      });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  // 保养类型 Picker
  onTypePickerShow() {
    this.setData({ showTypePicker: true });
  },

  onTypePickerConfirm(e) {
    const { value, label } = e.detail;
    console.log('选中的保养类型:', value, label);
    this.setData({
      'formData.type': value[0],
      showTypePicker: false
    });
  },

  onTypePickerCancel() {
    this.setData({ showTypePicker: false });
  },

  // 保养日期 Picker
  onDatePickerShow() {
    this.setData({ showDatePicker: true });
  },

  onDatePickerConfirm(e) {
    const { value } = e.detail;
    this.setData({
      'formData.date': value,
      showDatePicker: false
    });
  },

  onDatePickerCancel() {
    this.setData({ showDatePicker: false });
  },

  // 里程输入
  onMileageInput(e) {
    this.setData({ 'formData.mileage': e.detail.value });
  },

  // 费用输入
  onCostInput(e) {
    this.setData({ 'formData.cost': e.detail.value });
  },

  // 保养项目变化
  onItemsChange(e) {
    const { value } = e.detail;
    this.setData({ 'formData.items': value });
  },

  // 备注输入
  onNotesInput(e) {
    this.setData({ 'formData.note': e.detail.value });
  },

  // 保存按钮
  onSave() {
    // 1. 验证表单
    const validation = validator.validateMaintenanceForm(this.data.formData);
    if (!validation.valid) {
      this.setData({ errors: validation.errors });
      wx.showToast({
        title: '请检查表单',
        icon: 'error'
      });
      return;
    }

    // 2. 准备数据
    const record = {
      ...this.data.formData,
      mileage: Number(this.data.formData.mileage),
      cost: Number(Number(this.data.formData.cost).toFixed(2))
    };

    // 3. 保存到 Storage
    const allRecords = storage.getMaintenanceRecords();

    if (this.data.isEditMode) {
      // 编辑模式：更新记录
      const index = allRecords.findIndex(r => r.id === this.data.editId);
      if (index !== -1) {
        allRecords[index] = { ...allRecords[index], ...record };
      }
    } else {
      // 新增模式：生成ID并添加，绑定当前车辆
      record.id = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      record.vehicleId = storage.getCurrentVehicleId();
      allRecords.unshift(record);
    }

    const success = storage.setMaintenanceRecords(allRecords);

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
