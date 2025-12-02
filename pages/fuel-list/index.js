// 油耗列表页
// 展示所有加油记录，支持下拉加载更多

const storage = require('../../utils/storage');
const calculator = require('../../utils/calculator');

Page({
  data: {
    // 统计数据
    stats: [],

    // 加油记录
    allRecords: [],        // 所有记录
    displayRecords: [],    // 当前显示的记录

    // 分页配置
    pageSize: 20,          // 每页显示数量
    currentPage: 1,        // 当前页码
    hasMore: true,         // 是否还有更多数据

    // 加载状态
    loading: false,

    // 删除对话框
    showDeleteDialog: false,
    deleteTargetId: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 从详情页返回时刷新数据
    this.loadData();

    // 检查是否有待查看的详情ID（从首页跳转过来的）
    const pendingId = wx.getStorageSync('pendingFuelDetailId');
    if (pendingId) {
      // 清除缓存
      wx.removeStorageSync('pendingFuelDetailId');

      // 延迟一下再跳转，确保列表页已加载完成
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/fuel-detail/index?id=${pendingId}`
        });
      }, 100);
    }
  },

  // 加载数据
  loadData() {
    this.setData({ loading: true });

    // 读取所有加油记录
    let allRecords = storage.getFuelRecords();

    // 过滤当前车辆的记录
    const currentVehicleId = storage.getCurrentVehicleId();
    if (currentVehicleId) {
      allRecords = allRecords.filter(record => record.vehicleId === currentVehicleId);
    }

    // 按日期倒序排列（最新的在前）
    const sortedRecords = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 计算统计数据
    const totalCount = sortedRecords.length;
    const totalCost = calculator.sum(sortedRecords, 'cost');
    const avgFuelConsumption = calculator.getAverageFuelConsumption(sortedRecords);

    const stats = [
      {
        label: '总数',
        value: totalCount,
        unit: '次',
        color: 'var(--td-primary-color-7)'
      },
      {
        label: '总费用',
        value: totalCost.toFixed(0),
        unit: '元',
        color: 'var(--td-error-color-6)'
      },
      {
        label: '平均油耗',
        value: avgFuelConsumption,
        unit: 'L/100km',
        color: 'var(--td-warning-color-6)'
      }
    ];

    // 初始化第一页数据
    const displayRecords = sortedRecords.slice(0, this.data.pageSize);
    const hasMore = sortedRecords.length > this.data.pageSize;

    this.setData({
      stats,
      allRecords: sortedRecords,
      displayRecords,
      currentPage: 1,
      hasMore,
      loading: false
    });
  },

  // 滚动到底部，加载更多
  onScrollToLower() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({ loading: true });

    // 模拟网络延迟
    setTimeout(() => {
      const { allRecords, displayRecords, pageSize, currentPage } = this.data;
      const nextPage = currentPage + 1;
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;

      const moreRecords = allRecords.slice(startIndex, endIndex);
      const newDisplayRecords = [...displayRecords, ...moreRecords];
      const hasMore = endIndex < allRecords.length;

      this.setData({
        displayRecords: newDisplayRecords,
        currentPage: nextPage,
        hasMore,
        loading: false
      });
    }, 300);
  },

  // 点击记录项，跳转详情页
  onRecordTap(e) {
    console.log('onRecordTap 事件触发', e);
    console.log('e.detail:', e.detail);

    const { record } = e.detail;

    if (!record || !record.id) {
      console.error('记录数据无效:', record);
      wx.showToast({
        title: '数据错误',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/fuel-detail/index?id=${record.id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  // FAB 按钮点击
  onFabClick() {
    wx.navigateTo({
      url: '/pages/fuel-add/index'
    });
  },

  // SwipeCell 操作（删除按钮点击）
  onSwipeAction(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      showDeleteDialog: true,
      deleteTargetId: id
    });
  },

  // 确认删除
  onConfirmDelete() {
    const allRecords = storage.getFuelRecords();
    const filtered = allRecords.filter(r => r.id !== this.data.deleteTargetId);

    const success = storage.setFuelRecords(filtered);

    if (success) {
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      this.loadData(); // 重新加载数据
    } else {
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }

    this.setData({
      showDeleteDialog: false,
      deleteTargetId: ''
    });
  },

  // 取消删除
  onCancelDelete() {
    this.setData({
      showDeleteDialog: false,
      deleteTargetId: ''
    });
  }
});
