/**
 * 统计数据计算工具
 * 用于计算维护/加油相关的统计数据
 */

// 计算上次维护里程
function getLastMaintenanceMileage(records) {
  if (!records || records.length === 0) return '暂无';
  const sorted = records.sort((a, b) => new Date(b.date) - new Date(a.date));
  return `${sorted[0].mileage}km`;
}

// 计算总费用
function getTotalCost(maintenanceRecords, fuelRecords) {
  const maintenanceCost = maintenanceRecords.reduce((sum, r) => sum + r.cost, 0);
  const fuelCost = fuelRecords.reduce((sum, r) => sum + r.cost, 0);
  return (maintenanceCost + fuelCost).toFixed(0);
}

// 计算近期油耗（最近3次平均）
function getRecentFuelConsumption(records) {
  if (!records || records.length === 0) return '暂无';
  const sorted = records.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 3);
  const avg = recent.reduce((sum, r) => sum + r.fuelConsumption, 0) / recent.length;
  return avg.toFixed(1);
}

// 计算平均油耗（所有记录）
function getAverageFuelConsumption(records) {
  if (!records || records.length === 0) return '暂无';
  const avg = records.reduce((sum, r) => sum + r.fuelConsumption, 0) / records.length;
  return avg.toFixed(1);
}

// 计算百公里平均费用
function getAverageCostPer100km(fuelRecords) {
  if (!fuelRecords || fuelRecords.length === 0) return '暂无';

  // 计算总费用和总里程
  let totalCost = 0;
  let totalDistance = 0;

  for (let i = 0; i < fuelRecords.length - 1; i++) {
    totalCost += fuelRecords[i].cost;
    totalDistance += Math.abs(fuelRecords[i].mileage - fuelRecords[i + 1].mileage);
  }

  if (totalDistance === 0) return '暂无';

  const avgCostPer100km = (totalCost / totalDistance) * 100;
  return avgCostPer100km.toFixed(0);
}

// 获取最近N条记录
function getRecentRecords(records, count = 5) {
  if (!records || records.length === 0) return [];
  const sorted = records.sort((a, b) => new Date(b.date) - new Date(a.date));
  return sorted.slice(0, count);
}

// 计算总里程跨度
function getTotalMileage(records) {
  if (!records || records.length === 0) return 0;
  const sorted = records.sort((a, b) => new Date(a.date) - new Date(b.date));
  return sorted[sorted.length - 1].mileage - sorted[0].mileage;
}

// 数组字段求和
function sum(records, field) {
  if (!records || records.length === 0) return 0;
  return records.reduce((total, r) => total + (r[field] || 0), 0);
}

module.exports = {
  getLastMaintenanceMileage,
  getTotalCost,
  getRecentFuelConsumption,
  getAverageFuelConsumption,
  getAverageCostPer100km,
  getRecentRecords,
  getTotalMileage,
  sum
};
