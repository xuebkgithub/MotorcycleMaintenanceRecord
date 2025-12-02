// 保养详情页
// 展示单条保养记录的完整信息

const storage = require('../../utils/storage');

Page({
  data: {
    // 记录详情
    record: null,

    // 加载状态
    loading: true,
    notFound: false,

    // 删除对话框
    showDeleteDialog: false
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      this.setData({ notFound: true, loading: false });
      return;
    }

    this.recordId = id;
    this.loadDetail(id);
  },

  onShow() {
    // 每次显示时重新加载数据（从编辑页返回时刷新）
    if (this.recordId) {
      this.loadDetail(this.recordId);
    }
  },

  // 加载详情数据
  loadDetail(id) {
    this.setData({ loading: true });

    const allRecords = storage.getMaintenanceRecords();
    const record = allRecords.find(r => r.id === id);

    if (!record) {
      this.setData({ notFound: true, loading: false });
      return;
    }

    this.setData({
      record,
      loading: false,
      notFound: false
    });
  },

  // 编辑记录
  onEdit() {
    if (!this.data.record) return;

    wx.navigateTo({
      url: `/pages/maintenance-add/index?id=${this.data.record.id}`
    });
  },

  // 删除记录
  onDelete() {
    this.setData({ showDeleteDialog: true });
  },

  // 确认删除
  onConfirmDelete() {
    if (!this.data.record) return;

    const allRecords = storage.getMaintenanceRecords();
    const filtered = allRecords.filter(r => r.id !== this.data.record.id);

    const success = storage.setMaintenanceRecords(filtered);

    if (success) {
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });

      // 延迟返回，让用户看到提示
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } else {
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }

    this.setData({ showDeleteDialog: false });
  },

  // 取消删除
  onCancelDelete() {
    this.setData({ showDeleteDialog: false });
  },

  // 返回列表
  onBackToList() {
    wx.navigateBack();
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `保养记录 - ${this.data.record?.type || '详情'}`,
      path: `/pages/maintenance-detail/index?id=${this.data.record?.id}`
    };
  }
});
