/**
 * 历史数据迁移脚本 - 重新计算所有加油记录的油耗
 *
 * 使用说明：
 * 1. 在小程序中调用此函数：require('../../utils/migrate-fuel-consumption').migrate()
 * 2. 或在开发者工具控制台手动调用
 * 3. 建议在首次发布新版本时自动执行一次
 *
 * 迁移逻辑：
 * - 遍历所有车辆的所有加油记录
 * - 使用新的 calculateSingleFuelConsumption() 重新计算油耗
 * - 保持原有记录的其他字段不变
 * - 更新后保存到 Storage
 */

const storage = require('./storage');
const calculator = require('./calculator');

/**
 * 执行数据迁移
 * @returns {object} 迁移结果统计
 */
function migrate() {
  console.log('[Migrate] 开始历史数据迁移...');

  try {
    // 1. 读取所有加油记录
    const allRecords = storage.getFuelRecords();
    console.log(`[Migrate] 找到 ${allRecords.length} 条历史记录`);

    if (allRecords.length === 0) {
      return {
        success: true,
        total: 0,
        updated: 0,
        unchanged: 0,
        failed: 0,
        message: '无历史记录需要迁移'
      };
    }

    // 2. 按车辆分组
    const vehicleGroups = {};
    allRecords.forEach(record => {
      const vehicleId = record.vehicleId || 'default';
      if (!vehicleGroups[vehicleId]) {
        vehicleGroups[vehicleId] = [];
      }
      vehicleGroups[vehicleId].push(record);
    });

    console.log(`[Migrate] 涉及 ${Object.keys(vehicleGroups).length} 辆车`);

    // 3. 统计数据
    let updated = 0;
    let unchanged = 0;
    let failed = 0;

    // 4. 逐条重新计算油耗
    allRecords.forEach(record => {
      try {
        // 保存原始油耗
        const oldConsumption = record.fuelConsumption;

        // 重新计算
        const newConsumption = calculator.calculateSingleFuelConsumption(record, allRecords);

        // 更新油耗字段
        record.fuelConsumption = newConsumption;

        // 统计
        if (oldConsumption !== newConsumption) {
          updated++;
          console.log(`[Migrate] 记录 ${record.id} 油耗更新: ${oldConsumption} -> ${newConsumption}`);
        } else {
          unchanged++;
        }
      } catch (error) {
        failed++;
        console.error(`[Migrate] 记录 ${record.id} 计算失败:`, error);
      }
    });

    // 5. 保存更新后的记录
    const success = storage.setFuelRecords(allRecords);

    if (!success) {
      throw new Error('保存记录失败');
    }

    // 6. 返回结果
    const result = {
      success: true,
      total: allRecords.length,
      updated,
      unchanged,
      failed,
      message: `迁移完成：共 ${allRecords.length} 条，更新 ${updated} 条，未变化 ${unchanged} 条，失败 ${failed} 条`
    };

    console.log('[Migrate]', result.message);
    return result;

  } catch (error) {
    console.error('[Migrate] 迁移失败:', error);
    return {
      success: false,
      total: 0,
      updated: 0,
      unchanged: 0,
      failed: 0,
      message: `迁移失败: ${error.message}`
    };
  }
}

/**
 * 检查是否需要迁移
 * @returns {boolean} 是否需要迁移
 */
function checkNeedMigration() {
  const allRecords = storage.getFuelRecords();

  if (allRecords.length === 0) {
    return false;
  }

  // 检查是否有记录使用了旧的计算方式
  // 旧方式特征：fuelConsumption 直接等于 fuelVolume / 100
  for (const record of allRecords) {
    if (record.fuelVolume && record.fuelConsumption) {
      const oldStyleValue = (record.fuelVolume / 100).toFixed(2);
      if (record.fuelConsumption.toString() === oldStyleValue) {
        console.log('[Migrate] 检测到旧版本数据，需要迁移');
        return true;
      }
    }
  }

  return false;
}

/**
 * 自动执行迁移（仅执行一次）
 * 在 app.js 的 onLaunch 中调用
 */
function autoMigrate() {
  // 检查是否已执行过迁移
  const migrationFlag = wx.getStorageSync('fuel_consumption_migrated_v1');

  if (migrationFlag) {
    console.log('[Migrate] 数据已迁移，跳过');
    return;
  }

  // 检查是否需要迁移
  if (!checkNeedMigration()) {
    console.log('[Migrate] 无需迁移');
    wx.setStorageSync('fuel_consumption_migrated_v1', true);
    return;
  }

  // 执行迁移
  console.log('[Migrate] 自动执行数据迁移...');
  const result = migrate();

  if (result.success) {
    // 标记已完成迁移
    wx.setStorageSync('fuel_consumption_migrated_v1', true);

    // 显示提示
    wx.showToast({
      title: `已更新 ${result.updated} 条记录`,
      icon: 'success',
      duration: 2000
    });
  } else {
    wx.showToast({
      title: '数据迁移失败',
      icon: 'error'
    });
  }
}

module.exports = {
  migrate,
  checkNeedMigration,
  autoMigrate
};
