// 油耗概览页面
// 展示6项统计数据 + 算法说明 + 预留图表区域

const storage = require('../../utils/storage');
const calculator = require('../../utils/calculator');

Page({
  data: {
    // 第一行统计数据
    statsRow1: [
      { label: '平均油耗', value: '0.00', unit: 'L/100km', color: '#0052D9' },
      { label: '平均行驶', value: '0', unit: 'km/天', color: '#029CD4' },
      { label: '平均油费', value: '0', unit: '元/km', color: '#E37318' }
    ],

    // 第二行统计数据
    statsRow2: [
      { label: '累计里程', value: '0', unit: 'km', color: '#00A870' },
      { label: '累计油费', value: '0', unit: '元', color: '#D54941' },
      { label: '累计优惠', value: '0', unit: '元', color: '#8A6DE9' }
    ],

    // 帮助区域展开状态
    helpExpanded: false
  },

  onLoad() {
    // 加载统计数据
    this.loadStatistics();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadStatistics();
  },

  // 加载统计数据
  loadStatistics() {
    // 获取当前车辆的加油记录
    const currentVehicleId = storage.getCurrentVehicleId();
    let allRecords = storage.getFuelRecords();

    // 过滤当前车辆的记录
    const vehicleRecords = allRecords.filter(r => r.vehicleId === currentVehicleId);

    if (vehicleRecords.length === 0) {
      // 无数据时保持默认值
      console.log('[FuelOverview] 无加油记录数据');
      return;
    }

    // 按日期排序
    const sortedRecords = vehicleRecords.sort((a, b) =>
      new Date(a.time || a.date) - new Date(b.time || b.date)
    );

    // 计算各项统计数据
    const avgConsumption = calculator.getAverageFuelConsumption(sortedRecords) || '0.00';
    const avgDistancePerDay = this.calculateAvgDistancePerDay(sortedRecords);
    const avgCostPerKm = this.calculateAvgCostPerKm(sortedRecords);
    const maxMileage = this.getMaxMileage(sortedRecords);
    const totalCost = calculator.sum(sortedRecords, 'cost');
    const totalDiscount = calculator.sum(sortedRecords, 'discount');

    console.log('[FuelOverview] 统计数据:', {
      avgConsumption,
      avgDistancePerDay,
      avgCostPerKm,
      maxMileage,
      totalCost,
      totalDiscount
    });

    // 更新第一行数据
    this.setData({
      'statsRow1[0].value': avgConsumption,
      'statsRow1[1].value': avgDistancePerDay,
      'statsRow1[2].value': avgCostPerKm,
      'statsRow2[0].value': maxMileage.toLocaleString(),
      'statsRow2[1].value': totalCost.toFixed(0),
      'statsRow2[2].value': totalDiscount.toFixed(0)
    });
  },

  // 获取最大里程
  getMaxMileage(records) {
    if (records.length === 0) return 0;

    let maxMileage = 0;
    for (const record of records) {
      const mileage = record.totalMileage || record.mileage || 0;
      if (mileage > maxMileage) {
        maxMileage = mileage;
      }
    }
    return maxMileage;
  },

  // 计算平均行驶（公里/天）
  calculateAvgDistancePerDay(records) {
    if (records.length < 2) return '0';

    // 获取第一条和最后一条记录
    const firstRecord = records[0];
    const lastRecord = records[records.length - 1];

    // 计算总里程
    const firstMileage = firstRecord.totalMileage || firstRecord.mileage;
    const lastMileage = lastRecord.totalMileage || lastRecord.mileage;
    const totalDistance = lastMileage - firstMileage;

    if (totalDistance <= 0) return '0';

    // 计算总天数
    const firstDate = new Date(firstRecord.time || firstRecord.date);
    const lastDate = new Date(lastRecord.time || lastRecord.date);
    const totalDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) return totalDistance.toFixed(0);

    // 计算公里/天
    const avgDistancePerDay = totalDistance / totalDays;
    return avgDistancePerDay.toFixed(0);
  },

  // 计算平均油费（元/公里）
  calculateAvgCostPerKm(records) {
    if (records.length < 2) return '0';

    // 计算总费用
    const totalCost = records.reduce((sum, r) => sum + (r.cost || r.actualAmount || 0), 0);

    // 计算总里程
    const firstMileage = records[0].totalMileage || records[0].mileage;
    const lastMileage = records[records.length - 1].totalMileage || records[records.length - 1].mileage;
    const totalDistance = lastMileage - firstMileage;

    if (totalDistance <= 0) return '0';

    // 计算元/公里
    const avgCostPerKm = totalCost / totalDistance;
    return avgCostPerKm.toFixed(2);
  },

  // 切换帮助区域
  toggleHelp() {
    this.setData({
      helpExpanded: !this.data.helpExpanded
    });
  },

  // 查看详细记录（跳转到油耗列表）
  onViewDetailRecords() {
    // 跳转到油耗列表页面（非 tabBar 页面）
    wx.navigateTo({
      url: '/pages/fuel-list/index'
    });
  }
});
