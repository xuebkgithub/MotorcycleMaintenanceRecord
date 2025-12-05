/**
 * 导入导出业务逻辑模块
 * 处理摩托车维护记录的导入导出功能
 */

const file = require('./file');
const storage = require('./storage');
const csvParser = require('./csv-parser');
const csvValidator = require('./csv-validator');

// 当前数据格式版本
const CURRENT_VERSION = '1.0.0';
const APP_NAME = '摩托车维护记录';

// 预生成文件信息缓存
let preparedFileCache = null;  // {filePath, fileName, timestamp, dataChecksum}

/**
 * 导出所有数据到JSON文件并打开
 * @returns {Promise<{success: boolean, fileName: string}>}
 */
async function exportAllData() {
  try {
    // 1. 收集所有数据
    const allData = storage.getAllData();

    // 检查是否有数据
    if (!allData.vehicles || allData.vehicles.length === 0) {
      throw new Error('暂无数据可导出');
    }

    // 2. 构造导出对象
    const exportData = {
      version: CURRENT_VERSION,
      appName: APP_NAME,
      exportTime: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      data: allData,
      checksum: null  // 待计算
    };

    // 3. 生成校验和
    exportData.checksum = generateChecksum(allData);

    // 4. 生成文件名
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '');
    const fileName = `摩托车维护记录_${dateStr}.json`;

    // 5. 写入文件到临时目录
    const filePath = await file.writeJSONFile(fileName, exportData);

    // 6. 直接打开文档让用户查看和分享
    return new Promise((resolve, reject) => {
      wx.openDocument({
        filePath,
        fileType: 'json',
        showMenu: true,  // 显示分享菜单
        success: () => {
          console.log('[导入导出] 文档已打开');
          wx.showToast({
            title: '文件已打开',
            icon: 'success',
            duration: 2000
          });
          resolve({ success: true, fileName });
        },
        fail: (err) => {
          console.error('[导入导出] 打开文档失败:', err);

          // 打开失败，提示用户文件已保存
          wx.showModal({
            title: '导出成功',
            content: `文件已保存：${fileName}\n\n文件位置：小程序存储空间\n\n您可以通过其他方式访问该文件。`,
            showCancel: false,
            confirmText: '知道了'
          });

          resolve({ success: true, fileName });
        }
      });
    });

  } catch (err) {
    console.error('[导入导出] 导出失败:', err);
    throw err;
  }
}

/**
 * 准备导出文件（预生成，供快速分享使用）
 * @returns {Promise<{filePath: string, fileName: string, timestamp: number, dataChecksum: string}>}
 */
async function prepareExportFile() {
  try {
    console.log('[导入导出] 开始预生成导出文件...');

    // 1. 收集所有数据
    const allData = storage.getAllData();

    // 检查是否有数据
    if (!allData.vehicles || allData.vehicles.length === 0) {
      console.warn('[导入导出] 暂无数据，跳过预生成');
      preparedFileCache = null;
      return null;
    }

    // 2. 构造导出对象
    const exportData = {
      version: CURRENT_VERSION,
      appName: APP_NAME,
      exportTime: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      data: allData,
      checksum: null
    };

    // 3. 生成校验和
    const dataChecksum = generateChecksum(allData);
    exportData.checksum = dataChecksum;

    // 4. 生成文件名
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '');
    const fileName = `摩托车维护记录_${dateStr}.json`;

    // 5. 写入文件（异步）
    const filePath = await file.writeJSONFile(fileName, exportData);

    // 6. 缓存文件信息
    preparedFileCache = {
      filePath,
      fileName,
      timestamp: Date.now(),
      dataChecksum
    };

    console.log('[导入导出] 预生成完成:', preparedFileCache);
    return preparedFileCache;

  } catch (err) {
    console.error('[导入导出] 预生成失败:', err);
    preparedFileCache = null;
    throw err;
  }
}

/**
 * 获取预生成文件信息
 * @returns {object|null} {filePath, fileName, timestamp, dataChecksum} 或 null
 */
function getPreparedFileInfo() {
  return preparedFileCache;
}

/**
 * 清除预生成文件
 * @returns {Promise<void>}
 */
async function clearPreparedFile() {
  try {
    if (preparedFileCache && preparedFileCache.filePath) {
      await file.deleteFile(preparedFileCache.filePath);
      console.log('[导入导出] 已清除预生成文件');
    }
    preparedFileCache = null;
  } catch (err) {
    console.error('[导入导出] 清除预生成文件失败:', err);
    // 不抛出错误，清理失败不影响主流程
  }
}

/**
 * 快速导出（使用预生成文件 + shareFileMessage）
 * @returns {Promise<{success: boolean}>}
 */
async function quickExport() {
  try {
    console.log('[导入导出] 开始快速导出...');

    // 1. 检查预生成文件
    if (!preparedFileCache || !preparedFileCache.filePath) {
      throw new Error('导出文件未准备好，请稍后重试。\n\n错误码：QUICK_EXPORT_NO_FILE');
    }

    // 2. 验证文件是否存在
    try {
      await file.getFileInfo(preparedFileCache.filePath);
    } catch (err) {
      throw new Error('导出文件不存在，请稍后重试。\n\n错误码：QUICK_EXPORT_FILE_NOT_FOUND');
    }

    // 3. 使用 shareFileMessage 分享（必须在同步上下文中）
    return new Promise((resolve, reject) => {
      wx.shareFileMessage({
        filePath: preparedFileCache.filePath,
        fileName: preparedFileCache.fileName,
        success: () => {
          console.log('[导入导出] 快速导出成功');
          wx.showToast({
            title: '文件已分享',
            icon: 'success',
            duration: 2000
          });
          resolve({ success: true });
        },
        fail: (err) => {
          console.error('[导入导出] shareFileMessage 失败:', err);

          // 用户取消不算失败
          if (err.errMsg && err.errMsg.includes('cancel')) {
            console.log('[导入导出] 用户取消分享');
            resolve({ success: false, userCancel: true });
            return;
          }

          // 其他错误
          const errorMsg = `wx.shareFileMessage 调用失败\n\n原因：${err.errMsg}\n\n错误码：QUICK_EXPORT_API_FAIL\n\n建议：请尝试使用"查看并导出"功能`;
          reject(new Error(errorMsg));
        }
      });
    });

  } catch (err) {
    console.error('[导入导出] 快速导出失败:', err);
    throw err;
  }
}

/**
 * 查看并导出（实时生成 + openDocument）
 * @returns {Promise<{success: boolean, fileName: string}>}
 */
async function viewAndExport() {
  try {
    console.log('[导入导出] 开始查看并导出...');

    // 1. 收集所有数据
    const allData = storage.getAllData();

    // 检查是否有数据
    if (!allData.vehicles || allData.vehicles.length === 0) {
      throw new Error('暂无数据可导出，请先添加车辆和记录。\n\n错误码：VIEW_EXPORT_NO_DATA');
    }

    // 2. 构造导出对象
    const exportData = {
      version: CURRENT_VERSION,
      appName: APP_NAME,
      exportTime: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      data: allData,
      checksum: null
    };

    // 3. 生成校验和
    exportData.checksum = generateChecksum(allData);

    // 4. 生成文件名
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '');
    const fileName = `摩托车维护记录_${dateStr}.json`;

    // 5. 写入文件
    const filePath = await file.writeJSONFile(fileName, exportData);

    // 6. 打开文档
    return new Promise((resolve, reject) => {
      wx.openDocument({
        filePath,
        fileType: 'json',
        showMenu: true,  // 显示分享菜单
        success: () => {
          console.log('[导入导出] 文档已打开');
          wx.showToast({
            title: '文件已打开',
            icon: 'success',
            duration: 2000
          });
          resolve({ success: true, fileName });
        },
        fail: (err) => {
          console.error('[导入导出] openDocument 失败:', err);

          const errorMsg = `wx.openDocument 调用失败\n\n原因：${err.errMsg}\n\n错误码：VIEW_EXPORT_OPEN_FAIL\n\n文件已保存：${fileName}`;
          reject(new Error(errorMsg));
        }
      });
    });

  } catch (err) {
    console.error('[导入导出] 查看并导出失败:', err);
    throw err;
  }
}

/**
 * 选择导入文件
 * @returns {Promise<{path: string, size: number, name: string}>}
 */
async function chooseImportFile() {
  try {
    const fileInfo = await file.chooseFile(['json']);
    return fileInfo;
  } catch (err) {
    if (err.message === 'USER_CANCEL') {
      throw new Error('已取消导入');
    }
    throw err;
  }
}

/**
 * 解析导入文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<object>} 解析后的数据对象
 */
async function parseImportFile(filePath) {
  try {
    // 读取文件
    const importData = await file.readJSONFile(filePath);

    // 验证数据
    validateImportData(importData);

    return importData;

  } catch (err) {
    console.error('[导入导出] 解析文件失败:', err);
    throw err;
  }
}

/**
 * 导入数据
 * @param {string} filePath - 文件路径
 * @param {string} mode - 导入模式 ('overwrite' | 'merge')
 * @returns {Promise<{success: boolean, stats: object}>}
 */
async function importData(filePath, mode = 'overwrite') {
  try {
    // 1. 读取并解析文件
    const importData = await parseImportFile(filePath);

    // 2. 备份当前数据
    storage.backupData();
    console.log('[导入导出] 已备份当前数据');

    // 3. 执行导入
    let stats = {};

    if (mode === 'overwrite') {
      // 覆盖模式：直接替换所有数据
      storage.setAllData(importData.data, 'overwrite');

      stats = {
        mode: 'overwrite',
        vehicles: importData.data.vehicles.length,
        maintenanceRecords: importData.data.maintenanceRecords.length,
        fuelRecords: importData.data.fuelRecords.length
      };

    } else if (mode === 'merge') {
      // 合并模式：保留现有数据，合并导入数据
      const localData = storage.getAllData();
      const mergedResult = mergeData(localData, importData.data);

      storage.setAllData(mergedResult.result, 'overwrite');

      stats = {
        mode: 'merge',
        vehicles: mergedResult.result.vehicles.length,
        maintenanceRecords: mergedResult.result.maintenanceRecords.length,
        fuelRecords: mergedResult.result.fuelRecords.length,
        conflicts: mergedResult.conflictCount
      };
    }

    // 4. 验证导入结果
    const verifyData = storage.getAllData();
    if (!verifyData.vehicles || verifyData.vehicles.length === 0) {
      throw new Error('导入后数据验证失败');
    }

    console.log('[导入导出] 导入成功:', stats);
    return { success: true, stats };

  } catch (err) {
    console.error('[导入导出] 导入失败，开始回滚:', err);

    // 自动回滚
    const rollbackSuccess = storage.restoreBackup();

    if (rollbackSuccess) {
      console.log('[导入导出] 已回滚到导入前状态');
      throw new Error('导入失败，数据已恢复到导入前状态');
    } else {
      console.error('[导入导出] 回滚失败，数据可能损坏');
      throw new Error('导入失败且回滚失败，请联系开发者');
    }
  }
}

/**
 * 验证导入数据
 * @param {object} data - 导入的数据对象
 * @throws {Error} 验证失败时抛出错误
 */
function validateImportData(data) {
  // 1. 基本格式验证
  if (!data || typeof data !== 'object') {
    throw new Error('数据格式错误');
  }

  // 2. 版本验证
  if (!data.version) {
    throw new Error('缺少版本信息');
  }

  const [importMajor] = data.version.split('.');
  const [currentMajor] = CURRENT_VERSION.split('.');

  if (importMajor !== currentMajor) {
    throw new Error(`版本不兼容：导入版本 ${data.version}，当前版本 ${CURRENT_VERSION}`);
  }

  // 3. 结构验证
  if (!data.data || typeof data.data !== 'object') {
    throw new Error('数据结构错误');
  }

  const requiredFields = ['vehicles', 'maintenanceRecords', 'fuelRecords'];
  for (const field of requiredFields) {
    if (!Array.isArray(data.data[field])) {
      throw new Error(`缺少必填字段：${field}`);
    }
  }

  // 4. 车辆数据完整性验证
  const vehicleIds = new Set();
  for (const vehicle of data.data.vehicles) {
    if (!vehicle.id) {
      throw new Error('车辆数据缺少ID字段');
    }
    if (!vehicle.name) {
      throw new Error('车辆数据缺少名称字段');
    }
    vehicleIds.add(vehicle.id);
  }

  // 5. 关联性验证
  for (const record of data.data.maintenanceRecords) {
    if (record.vehicleId && !vehicleIds.has(record.vehicleId)) {
      throw new Error('保养记录引用了不存在的车辆');
    }
  }

  for (const record of data.data.fuelRecords) {
    if (record.vehicleId && !vehicleIds.has(record.vehicleId)) {
      throw new Error('加油记录引用了不存在的车辆');
    }
  }

  // 6. 校验和验证（警告但不阻止）
  if (data.checksum) {
    const calculatedChecksum = generateChecksum(data.data);
    if (calculatedChecksum !== data.checksum) {
      console.warn('[导入导出] 校验和不匹配，数据可能已被修改');
      // 不抛出错误，只警告
    }
  }

  return true;
}

/**
 * 合并本地数据和导入数据
 * @param {object} localData - 本地数据
 * @param {object} importData - 导入数据
 * @returns {{result: object, conflictCount: number}}
 */
function mergeData(localData, importData) {
  const result = {
    vehicles: [],
    maintenanceRecords: [],
    fuelRecords: [],
    currentVehicleId: localData.currentVehicleId  // 保持本地的当前车辆ID
  };

  let conflictCount = 0;

  // 1. 合并车辆（按ID去重）
  const vehicleMap = new Map();

  // 先添加本地车辆
  localData.vehicles.forEach(v => vehicleMap.set(v.id, v));

  // 再添加导入车辆（ID冲突时覆盖）
  importData.vehicles.forEach(v => {
    if (vehicleMap.has(v.id)) {
      conflictCount++;
      console.log(`[导入导出] 车辆ID冲突：${v.id}，使用导入数据覆盖`);
    }
    vehicleMap.set(v.id, v);
  });

  result.vehicles = Array.from(vehicleMap.values());

  // 2. 合并保养记录
  const maintenanceMap = new Map();

  localData.maintenanceRecords.forEach(r => maintenanceMap.set(r.id, r));

  importData.maintenanceRecords.forEach(r => {
    if (maintenanceMap.has(r.id)) {
      conflictCount++;
    }
    maintenanceMap.set(r.id, r);
  });

  result.maintenanceRecords = Array.from(maintenanceMap.values());

  // 3. 合并加油记录
  const fuelMap = new Map();

  localData.fuelRecords.forEach(r => fuelMap.set(r.id, r));

  importData.fuelRecords.forEach(r => {
    if (fuelMap.has(r.id)) {
      conflictCount++;
    }
    fuelMap.set(r.id, r);
  });

  result.fuelRecords = Array.from(fuelMap.values());

  console.log(`[导入导出] 合并完成，冲突数量：${conflictCount}`);

  return { result, conflictCount };
}

/**
 * 生成数据校验和（简单哈希算法）
 * @param {object} data - 数据对象
 * @returns {string} 校验和字符串
 */
function generateChecksum(data) {
  try {
    // 1. 将数据转为JSON字符串
    const str = JSON.stringify(data);

    // 2. 计算哈希值
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }

    // 3. 转换为36进制字符串
    return Math.abs(hash).toString(36);

  } catch (err) {
    console.error('[导入导出] 生成校验和失败:', err);
    return '';
  }
}

// ========== CSV导入导出相关方法 ==========

/**
 * 选择CSV文件
 * @returns {Promise<{path, size, name}>}
 */
async function chooseCSVFile() {
  try {
    const fileInfo = await file.chooseFile(['csv']);
    console.log('[导入导出] 已选择CSV文件:', fileInfo.name);
    return fileInfo;
  } catch (err) {
    if (err.message === 'USER_CANCEL') {
      throw new Error('已取消导入');
    }
    throw err;
  }
}

/**
 * 解析CSV文件
 * @param {string} filePath - CSV文件路径
 * @returns {Promise<Array<Object>>} CSV数据数组（原始格式，未映射）
 */
async function parseCSVFile(filePath) {
  try {
    console.log('[导入导出] 开始解析CSV文件:', filePath);

    // 1. 读取文件内容
    const csvText = await file.readTextFile(filePath);
    console.log('[导入导出] CSV文件读取成功，长度:', csvText.length, '字符');

    // 2. 使用Papa Parse解析（阶段7实现）
    // TODO: 当前parseCSV返回空数组，需在阶段7实现
    const csvData = await csvParser.parseCSV(csvText);
    console.log('[导入导出] CSV解析成功，共', csvData.length, '行');

    // 3. 验证列名
    const requiredColumns = [
      '日期', '公里数', '油费', '单价', '油量',
      '实际付金额', '优惠金额', '实付单价',
      '是否加满', '是否亮灯', '上次记录了吗'
    ];

    if (csvData.length === 0) {
      // TODO: 阶段7之前会触发此错误
      throw new Error('CSV文件为空或格式错误（parseCSV方法待实现，将在阶段7引入Papa Parse）');
    }

    const actualColumns = Object.keys(csvData[0]);
    const missingColumns = requiredColumns.filter(c => !actualColumns.includes(c));

    if (missingColumns.length > 0) {
      throw new Error(`CSV文件缺少必需列：${missingColumns.join('、')}`);
    }

    console.log('[导入导出] CSV列名验证通过');
    return csvData;

  } catch (err) {
    console.error('[导入导出] CSV解析失败:', err);
    throw err;
  }
}

/**
 * 导入CSV数据
 * @param {Array} csvData - CSV原始数据（未映射）
 * @param {Object} options - 导入选项
 * @param {string} options.vehicleId - 车辆ID
 * @param {Array<string>} options.fuelTypes - 每条记录的油品类型数组
 * @returns {Promise<{success: boolean, stats: Object, errors: Array, duplicates: Array}>}
 */
async function importCSVData(csvData, options) {
  try {
    console.log('[导入导出] 开始导入CSV数据，共', csvData.length, '行');
    console.log('[导入导出] 导入选项:', options);

    // 1. 备份当前数据
    storage.backupData();
    console.log('[导入导出] 已备份当前数据');

    // 2. 映射CSV数据为油耗记录
    const mappedRecords = csvData.map((row, index) => {
      try {
        return csvParser.mapCSVToFuelRecord(
          row,
          options.vehicleId,
          options.fuelTypes[index]  // 每条记录独立的油品类型
        );
      } catch (err) {
        console.error(`[导入导出] 第${index + 2}行映射失败:`, err);
        // 返回错误标记
        return {
          _error: err.message,
          _rowIndex: index + 2,
          ...row
        };
      }
    });

    // 分离成功和失败的记录
    const successRecords = mappedRecords.filter(r => !r._error);
    const mappingErrors = mappedRecords.filter(r => r._error).map(r => ({
      row: r._rowIndex,
      field: '数据映射',
      message: r._error
    }));

    console.log('[导入导出] 映射完成：成功', successRecords.length, '条，失败', mappingErrors.length, '条');

    // 3. 校验数据
    const validationResults = csvValidator.validateAllRecords(successRecords);
    const allErrors = [...mappingErrors, ...validationResults.errors];

    console.log('[导入导出] 校验完成：有效记录', validationResults.validRecords.length, '条，错误', allErrors.length, '条');

    // 4. 检测重复数据
    const existingRecords = storage.getFuelRecords().filter(
      r => r.vehicleId === options.vehicleId
    );
    const { duplicates, safeRecords } = csvValidator.detectDuplicates(
      validationResults.validRecords,
      existingRecords
    );

    console.log('[导入导出] 重复检测完成：重复', duplicates.length, '条，可导入', safeRecords.length, '条');

    // 5. 合并数据（跳过重复记录）
    const allRecords = storage.getFuelRecords();
    const recordsToImport = safeRecords;

    // 合并并按时间排序
    const mergedRecords = [...allRecords, ...recordsToImport].sort((a, b) => {
      return new Date(a.time || a.date) - new Date(b.time || b.date);
    });

    // 6. 重新计算油耗（导入的记录）
    const calculator = require('./calculator');
    recordsToImport.forEach(record => {
      try {
        record.fuelConsumption = calculator.calculateSingleFuelConsumption(
          record,
          mergedRecords
        );
        console.log(`[导入导出] 记录 ${record.time} 油耗计算：${record.fuelConsumption}L/100km`);
      } catch (err) {
        console.error(`[导入导出] 记录 ${record.time} 油耗计算失败:`, err);
        record.fuelConsumption = 0;
      }
    });

    // 7. 保存数据
    storage.setFuelRecords(mergedRecords);
    console.log('[导入导出] 数据已保存，总记录数', mergedRecords.length);

    // 8. 验证导入结果
    const verifyRecords = storage.getFuelRecords();
    if (verifyRecords.length !== mergedRecords.length) {
      throw new Error('导入后数据验证失败：记录数不匹配');
    }

    // 9. 生成报告
    const report = {
      success: true,
      stats: {
        total: csvData.length,
        imported: recordsToImport.length,
        skippedErrors: allErrors.length,
        skippedDuplicates: duplicates.length
      },
      errors: allErrors,
      duplicates: duplicates.map(d => ({
        row: d.row,
        reason: d.reason,
        csvData: {
          date: d.csvRecord.time.split(' ')[0],
          mileage: d.csvRecord.totalMileage,
          cost: d.csvRecord.displayAmount
        }
      }))
    };

    console.log('[导入导出] CSV导入成功:', report.stats);
    return report;

  } catch (err) {
    console.error('[导入导出] CSV导入失败，开始回滚:', err);

    // 自动回滚
    const rollbackSuccess = storage.restoreBackup();
    if (rollbackSuccess) {
      console.log('[导入导出] 已回滚到导入前状态');
      throw new Error(`导入失败，数据已恢复：${err.message}`);
    } else {
      console.error('[导入导出] 回滚失败，数据可能损坏');
      throw new Error('导入失败且回滚失败，请联系开发者');
    }
  }
}

module.exports = {
  exportAllData,
  prepareExportFile,      // 新增：预生成导出文件
  getPreparedFileInfo,    // 新增：获取预生成文件信息
  clearPreparedFile,      // 新增：清除预生成文件
  quickExport,            // 新增：快速导出（shareFileMessage）
  viewAndExport,          // 新增：查看并导出（openDocument）
  chooseImportFile,
  parseImportFile,
  importData,
  validateImportData,
  mergeData,
  generateChecksum,
  // CSV导入导出方法
  chooseCSVFile,          // 新增：选择CSV文件
  parseCSVFile,           // 新增：解析CSV文件
  importCSVData           // 新增：导入CSV数据
};
