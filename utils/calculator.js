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

/**
 * 计算单次加油的油耗
 * @param {object} currentRecord - 当前加油记录
 * @param {array} allRecords - 所有加油记录
 * @returns {number} 油耗值（L/100km，保留两位小数）
 */
function calculateSingleFuelConsumption(currentRecord, allRecords) {
  // 1. 过滤当前车辆的记录并按时间排序
  const vehicleRecords = allRecords
    .filter(r => r.vehicleId === currentRecord.vehicleId)
    .sort((a, b) => new Date(a.time || a.date) - new Date(b.time || b.date));

  // 2. 如果只有一条记录或找不到记录，返回0（首次加油）
  if (vehicleRecords.length <= 1) {
    return 0;
  }

  // 3. 找到当前记录在数组中的位置
  let currentIndex = -1;
  for (let i = 0; i < vehicleRecords.length; i++) {
    if (vehicleRecords[i].id === currentRecord.id ||
        (vehicleRecords[i].time === currentRecord.time &&
         vehicleRecords[i].totalMileage === currentRecord.totalMileage)) {
      currentIndex = i;
      break;
    }
  }

  // 4. 如果是第一条记录，返回0
  if (currentIndex <= 0) {
    return 0;
  }

  // 5. 获取前一条记录
  const prevRecord = vehicleRecords[currentIndex - 1];

  // 6. 计算里程差
  const currentMileage = currentRecord.totalMileage || currentRecord.mileage;
  const prevMileage = prevRecord.totalMileage || prevRecord.mileage;
  const mileageDiff = currentMileage - prevMileage;

  // 7. 里程异常（回退或未变化），返回0
  if (mileageDiff <= 0) {
    console.warn('[Calculator] 里程异常:', { currentMileage, prevMileage, mileageDiff });
    return 0;
  }

  // 8. 获取加油量
  const currentVolume = currentRecord.fuelVolume || currentRecord.volume;
  const prevVolume = prevRecord.fuelVolume || prevRecord.volume;

  // 9. 根据加油类型选择算法
  let consumption = 0;

  if (prevRecord.isFull === true) {
    // 满油量算法：第二次加油量 / 里程差
    consumption = currentVolume / (mileageDiff / 100);
    console.log('[Calculator] 使用满油量算法:', { currentVolume, mileageDiff, consumption });
  } else if (prevRecord.isLightOn === true) {
    // 低油量算法：第一次加油量 / 里程差
    consumption = prevVolume / (mileageDiff / 100);
    console.log('[Calculator] 使用低油量算法:', { prevVolume, mileageDiff, consumption });
  } else {
    // 默认算法：当前加油量 / 里程差（不够精确，但有数据）
    consumption = currentVolume / (mileageDiff / 100);
    console.log('[Calculator] 使用默认算法:', { currentVolume, mileageDiff, consumption });
  }

  // 10. 返回保留两位小数的结果
  return Number(consumption.toFixed(2));
}

// 计算近期油耗（最近3次平均）
function getRecentFuelConsumption(records) {
  if (!records || records.length === 0) return '暂无';
  const sorted = records.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 3);
  const avg = recent.reduce((sum, r) => sum + r.fuelConsumption, 0) / recent.length;
  return avg.toFixed(1);
}

// 计算平均油耗（所有记录）- 使用加权平均算法
function getAverageFuelConsumption(records) {
  if (!records || records.length === 0) return '暂无';

  // 按时间排序
  const sortedRecords = records.sort((a, b) => new Date(a.time || a.date) - new Date(b.time || b.date));

  // 过滤掉油耗为0的记录
  const validRecords = sortedRecords.filter(r => r.fuelConsumption > 0);

  if (validRecords.length === 0) return '暂无';
  if (validRecords.length === 1) return validRecords[0].fuelConsumption.toFixed(1);

  // 计算累计里程（使用所有记录，不只是有效记录）
  const firstMileage = sortedRecords[0].totalMileage || sortedRecords[0].mileage;
  const lastMileage = sortedRecords[sortedRecords.length - 1].totalMileage || sortedRecords[sortedRecords.length - 1].mileage;
  const totalMileage = lastMileage - firstMileage;

  if (totalMileage <= 0) {
    // 如果里程无变化，回退到简单平均
    const avg = validRecords.reduce((sum, r) => sum + r.fuelConsumption, 0) / validRecords.length;
    return avg.toFixed(1);
  }

  // 加权平均：遍历所有记录，对油耗>0的记录计算权重并累加
  let weightedSum = 0;
  for (let i = 1; i < sortedRecords.length; i++) {
    const currentRecord = sortedRecords[i];
    const prevRecord = sortedRecords[i - 1];

    // 只有当前记录油耗>0时才计入加权和
    if (currentRecord.fuelConsumption > 0) {
      const currentMileage = currentRecord.totalMileage || currentRecord.mileage;
      const prevMileage = prevRecord.totalMileage || prevRecord.mileage;
      const mileageDiff = currentMileage - prevMileage;

      if (mileageDiff > 0) {
        const weight = mileageDiff / totalMileage;
        weightedSum += currentRecord.fuelConsumption * weight;
      }
    }
  }

  return weightedSum.toFixed(1);
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
  calculateSingleFuelConsumption,
  getRecentFuelConsumption,
  getAverageFuelConsumption,
  getAverageCostPer100km,
  getRecentRecords,
  getTotalMileage,
  sum
};
