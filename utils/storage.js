/**
 * Storage 工具封装
 * 提供类型安全的数据存储和读取
 */

// 读取车辆信息
function getVehicleInfo() {
  try {
    return wx.getStorageSync('vehicleInfo') || {};
  } catch (e) {
    console.error('读取车辆信息失败', e);
    return {};
  }
}

// 保存车辆信息
function setVehicleInfo(data) {
  try {
    wx.setStorageSync('vehicleInfo', data);
    return true;
  } catch (e) {
    console.error('保存车辆信息失败', e);
    return false;
  }
}

// 读取维护记录
function getMaintenanceRecords() {
  try {
    return wx.getStorageSync('maintenanceRecords') || [];
  } catch (e) {
    console.error('读取维护记录失败', e);
    return [];
  }
}

// 保存维护记录
function setMaintenanceRecords(records) {
  try {
    wx.setStorageSync('maintenanceRecords', records);
    return true;
  } catch (e) {
    console.error('保存维护记录失败', e);
    return false;
  }
}

// 读取加油记录
function getFuelRecords() {
  try {
    return wx.getStorageSync('fuelRecords') || [];
  } catch (e) {
    console.error('读取加油记录失败', e);
    return [];
  }
}

// 保存加油记录
function setFuelRecords(records) {
  try {
    wx.setStorageSync('fuelRecords', records);
    return true;
  } catch (e) {
    console.error('保存加油记录失败', e);
    return false;
  }
}

// 清空所有数据
function clearAllData() {
  try {
    // 业务数据
    wx.removeStorageSync('vehicleInfo');
    wx.removeStorageSync('maintenanceRecords');
    wx.removeStorageSync('fuelRecords');
    wx.removeStorageSync('vehicles');
    wx.removeStorageSync('currentVehicleId');

    // 迁移相关 - 保留 _migrated 标记，防止重新创建默认车辆
    // wx.removeStorageSync('_migrated');  // 注释掉，保留此标记
    wx.removeStorageSync('_backup_vehicleInfo');

    // 导入导出相关
    wx.removeStorageSync('_import_backup');
    wx.removeStorageSync('_import_export_guide_seen');

    // 清空后设置 _migrated 为 true，防止 app.js 重新执行迁移
    wx.setStorageSync('_migrated', true);

    console.log('[Storage] 所有数据已清空');
    return true;
  } catch (e) {
    console.error('[Storage] 清空数据失败', e);
    return false;
  }
}

// ========== 多车辆管理功能 ==========

// 获取车辆列表
function getVehicles() {
  try {
    return wx.getStorageSync('vehicles') || [];
  } catch (e) {
    console.error('读取车辆列表失败', e);
    return [];
  }
}

// 保存车辆列表
function setVehicles(vehicles) {
  try {
    wx.setStorageSync('vehicles', vehicles);
    return true;
  } catch (e) {
    console.error('保存车辆列表失败', e);
    return false;
  }
}

// 获取当前车辆ID
function getCurrentVehicleId() {
  try {
    return wx.getStorageSync('currentVehicleId') || '';
  } catch (e) {
    console.error('读取当前车辆ID失败', e);
    return '';
  }
}

// 设置当前车辆ID
function setCurrentVehicleId(id) {
  try {
    wx.setStorageSync('currentVehicleId', id);
    return true;
  } catch (e) {
    console.error('保存当前车辆ID失败', e);
    return false;
  }
}

// 获取当前车辆详情
function getCurrentVehicle() {
  try {
    const currentId = getCurrentVehicleId();
    if (!currentId) return null;

    const vehicles = getVehicles();
    return vehicles.find(v => v.id === currentId) || null;
  } catch (e) {
    console.error('读取当前车辆详情失败', e);
    return null;
  }
}

// 检查是否已迁移
function isMigrated() {
  try {
    return wx.getStorageSync('_migrated') || false;
  } catch (e) {
    console.error('检查迁移状态失败', e);
    return false;
  }
}

// 生成车辆ID
function generateVehicleId() {
  return 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 执行数据迁移
function migrateToMultiVehicle() {
  try {
    // 如果已经迁移，直接返回
    if (isMigrated()) {
      console.log('数据已迁移，跳过迁移流程');
      return { success: true, skipped: true };
    }

    console.log('开始执行数据迁移...');

    // 1. 备份旧数据
    const oldVehicleInfo = getVehicleInfo();
    wx.setStorageSync('_backup_vehicleInfo', oldVehicleInfo);
    console.log('已备份旧车辆信息');

    // 2. 创建默认车辆
    const defaultVehicle = {
      id: generateVehicleId(),
      name: oldVehicleInfo.name || '默认车辆',
      model: oldVehicleInfo.model || '',
      mileage: oldVehicleInfo.mileage || 0,
      note: oldVehicleInfo.note || '',
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-'),
      isDefault: true
    };

    // 3. 保存车辆列表
    setVehicles([defaultVehicle]);
    setCurrentVehicleId(defaultVehicle.id);
    console.log('已创建默认车辆:', defaultVehicle.id);

    // 4. 迁移保养记录
    const maintenanceRecords = getMaintenanceRecords();
    const updatedMaintenanceRecords = maintenanceRecords.map(record => ({
      ...record,
      vehicleId: defaultVehicle.id
    }));
    setMaintenanceRecords(updatedMaintenanceRecords);
    console.log('已迁移保养记录:', updatedMaintenanceRecords.length, '条');

    // 5. 迁移油耗记录
    const fuelRecords = getFuelRecords();
    const updatedFuelRecords = fuelRecords.map(record => ({
      ...record,
      vehicleId: defaultVehicle.id
    }));
    setFuelRecords(updatedFuelRecords);
    console.log('已迁移油耗记录:', updatedFuelRecords.length, '条');

    // 6. 标记迁移完成
    wx.setStorageSync('_migrated', true);
    console.log('数据迁移完成');

    return {
      success: true,
      vehicleId: defaultVehicle.id,
      maintenanceCount: updatedMaintenanceRecords.length,
      fuelCount: updatedFuelRecords.length
    };
  } catch (e) {
    console.error('数据迁移失败', e);
    return { success: false, error: e.message };
  }
}

// 回滚迁移
function rollbackMigration() {
  try {
    console.log('开始回滚迁移...');

    // 1. 恢复旧车辆信息
    const backup = wx.getStorageSync('_backup_vehicleInfo');
    if (backup) {
      setVehicleInfo(backup);
      console.log('已恢复旧车辆信息');
    }

    // 2. 清除多车辆数据
    wx.removeStorageSync('vehicles');
    wx.removeStorageSync('currentVehicleId');
    wx.removeStorageSync('_migrated');
    wx.removeStorageSync('_backup_vehicleInfo');
    console.log('已清除多车辆数据');

    // 3. 清除记录中的 vehicleId 字段
    const maintenanceRecords = getMaintenanceRecords();
    const cleanedMaintenanceRecords = maintenanceRecords.map(record => {
      const { vehicleId, ...rest } = record;
      return rest;
    });
    setMaintenanceRecords(cleanedMaintenanceRecords);

    const fuelRecords = getFuelRecords();
    const cleanedFuelRecords = fuelRecords.map(record => {
      const { vehicleId, ...rest } = record;
      return rest;
    });
    setFuelRecords(cleanedFuelRecords);
    console.log('已清除记录中的 vehicleId 字段');

    console.log('迁移回滚完成');
    return { success: true };
  } catch (e) {
    console.error('回滚迁移失败', e);
    return { success: false, error: e.message };
  }
}

// ========== 导入导出功能 ==========

/**
 * 获取所有数据（用于导出）
 * @returns {object} 包含所有业务数据的对象
 */
function getAllData() {
  try {
    return {
      vehicles: getVehicles(),
      maintenanceRecords: getMaintenanceRecords(),
      fuelRecords: getFuelRecords(),
      currentVehicleId: getCurrentVehicleId()
    };
  } catch (e) {
    console.error('[Storage] 获取所有数据失败', e);
    return {
      vehicles: [],
      maintenanceRecords: [],
      fuelRecords: [],
      currentVehicleId: ''
    };
  }
}

/**
 * 批量设置数据（用于导入）
 * @param {object} data - 数据对象
 * @param {string} mode - 模式 ('overwrite' | 'merge')，merge模式下已在调用前合并
 * @returns {boolean} 是否成功
 */
function setAllData(data, mode = 'overwrite') {
  try {
    setVehicles(data.vehicles);
    setMaintenanceRecords(data.maintenanceRecords);
    setFuelRecords(data.fuelRecords);

    // 覆盖模式：设置当前车辆ID
    // 合并模式：保持本地的当前车辆ID（不覆盖）
    if (mode === 'overwrite' && data.currentVehicleId) {
      setCurrentVehicleId(data.currentVehicleId);
    }

    console.log('[Storage] 批量设置数据成功');
    return true;
  } catch (e) {
    console.error('[Storage] 批量设置数据失败', e);
    return false;
  }
}

/**
 * 备份当前数据（导入前）
 * @returns {object} 备份对象
 */
function backupData() {
  try {
    const backup = {
      timestamp: Date.now(),
      data: getAllData()
    };

    wx.setStorageSync('_import_backup', backup);
    console.log('[Storage] 数据备份成功，时间戳:', backup.timestamp);

    return backup;
  } catch (e) {
    console.error('[Storage] 数据备份失败', e);
    return null;
  }
}

/**
 * 恢复备份数据
 * @returns {boolean} 是否成功
 */
function restoreBackup() {
  try {
    const backup = wx.getStorageSync('_import_backup');

    if (!backup || !backup.data) {
      console.warn('[Storage] 未找到备份数据');
      return false;
    }

    setAllData(backup.data, 'overwrite');
    console.log('[Storage] 备份恢复成功，备份时间:', new Date(backup.timestamp).toLocaleString('zh-CN'));

    return true;
  } catch (e) {
    console.error('[Storage] 恢复备份失败', e);
    return false;
  }
}

module.exports = {
  getVehicleInfo,
  setVehicleInfo,
  getMaintenanceRecords,
  setMaintenanceRecords,
  getFuelRecords,
  setFuelRecords,
  clearAllData,
  // 多车辆管理
  getVehicles,
  setVehicles,
  getCurrentVehicleId,
  setCurrentVehicleId,
  getCurrentVehicle,
  isMigrated,
  migrateToMultiVehicle,
  rollbackMigration,
  // 导入导出
  getAllData,
  setAllData,
  backupData,
  restoreBackup
};
