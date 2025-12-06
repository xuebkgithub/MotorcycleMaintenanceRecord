/**
 * CSV解析工具
 *
 * 使用 Papa Parse 库进行 CSV 解析
 */

const Papa = 'papaparse/index';

/**
 * 解析CSV文本
 * @param {string} csvText - CSV文本内容
 * @returns {Promise<Array<Object>>} 解析后的对象数组
 */
async function parseCSV(csvText) {
  return new Promise((resolve, reject) => {
    try {
      console.log('[CSV Parser] 开始解析CSV，长度:', csvText.length, '字符');

      // 使用 Papa Parse 解析 CSV
      const result = Papa.parse(csvText, {
        header: true,           // 第一行作为表头
        skipEmptyLines: true,   // 跳过空行
        transformHeader: (header) => {
          // 清理表头（去除空格）
          return header.trim();
        },
        transform: (value) => {
          // 清理每个值（去除空格）
          return value.trim();
        },
        encoding: 'UTF-8'
      });

      // 检查解析结果
      if (result.errors && result.errors.length > 0) {
        console.warn('[CSV Parser] Papa Parse 警告:', result.errors);
        // Papa Parse 的错误通常不影响解析，继续处理
      }

      if (!result.data || result.data.length === 0) {
        console.warn('[CSV Parser] CSV解析结果为空');
        resolve([]);
        return;
      }

      console.log('[CSV Parser] CSV解析成功，共', result.data.length, '行');
      console.log('[CSV Parser] 表头字段:', Object.keys(result.data[0]));

      resolve(result.data);

    } catch (err) {
      console.error('[CSV Parser] Papa Parse 解析失败:', err);
      reject(new Error(`CSV解析失败：${err.message}`));
    }
  });
}

/**
 * 灵活解析日期格式
 * 支持多种日期格式，统一转换为标准格式
 *
 * @param {string} dateStr - 日期字符串
 * @returns {string} 标准格式 'YYYY-MM-DD HH:mm'
 * @throws {Error} 日期格式不支持时抛出错误
 *
 * 支持格式：
 * - YYYY/M/D （如 2025/6/27）
 * - YYYY-MM-DD （如 2025-06-27）
 * - YYYY.M.D （如 2025.6.27）
 */
function parseFlexibleDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error('日期不能为空');
  }

  const trimmed = dateStr.trim();

  // 1. 尝试斜杠格式：2025/6/27
  let match = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match) {
    const [_, year, month, day] = match;
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    const result = `${year}-${paddedMonth}-${paddedDay} 00:00`;

    // 验证日期有效性
    const testDate = new Date(result);
    if (isNaN(testDate.getTime())) {
      throw new Error(`日期无效：${dateStr}（月份或日期超出范围）`);
    }

    return result;
  }

  // 2. 尝试标准格式：2025-06-27
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const result = `${trimmed} 00:00`;

    // 验证日期有效性
    const testDate = new Date(result);
    if (isNaN(testDate.getTime())) {
      throw new Error(`日期无效：${dateStr}（月份或日期超出范围）`);
    }

    return result;
  }

  // 3. 尝试点格式：2025.6.27
  match = trimmed.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (match) {
    const [_, year, month, day] = match;
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    const result = `${year}-${paddedMonth}-${paddedDay} 00:00`;

    // 验证日期有效性
    const testDate = new Date(result);
    if (isNaN(testDate.getTime())) {
      throw new Error(`日期无效：${dateStr}（月份或日期超出范围）`);
    }

    return result;
  }

  // 不支持的格式
  throw new Error(`日期格式错误："${dateStr}"。支持格式：YYYY/M/D、YYYY-MM-DD、YYYY.M.D`);
}

/**
 * 解析布尔值（CSV中的文本 → true/false）
 *
 * @param {string} value - CSV中的文本值
 * @param {string} trueText - 代表true的文本（如"加满"）
 * @param {string} falseText - 代表false的文本（如"没加满"）
 * @param {string} fieldName - 字段名（用于错误提示）
 * @returns {boolean}
 * @throws {Error} 值不匹配时抛出错误
 */
function parseCSVBoolean(value, trueText, falseText, fieldName) {
  const trimmed = String(value).trim();

  if (trimmed === trueText) {
    return true;
  }

  if (trimmed === falseText) {
    return false;
  }

  throw new Error(`${fieldName || '布尔值'}格式错误：应为"${trueText}"或"${falseText}"，实际为"${value}"`);
}

/**
 * 将CSV行映射为油耗记录数据模型
 *
 * @param {Object} csvRow - CSV解析后的行对象（列名→值）
 * @param {string} vehicleId - 车辆ID
 * @param {string} fuelType - 油品类型（用户选择）
 * @returns {Object} 油耗记录对象
 * @throws {Error} 映射失败时抛出错误
 */
function mapCSVToFuelRecord(csvRow, vehicleId, fuelType) {
  try {
    // 生成唯一ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const id = `f_${timestamp}_${random}`;

    // 解析日期（灵活格式）
    const time = parseFlexibleDate(csvRow['日期']);
    const date = time.split(' ')[0];  // 提取日期部分

    // 解析布尔值
    const isFull = parseCSVBoolean(csvRow['是否加满'], '加满', '没加满', '是否加满');
    const isLightOn = parseCSVBoolean(csvRow['是否亮灯'], '亮灯', '没亮', '是否亮灯');
    const isLastRecorded = parseCSVBoolean(csvRow['上次记录了吗'], '记录了', '漏记了', '上次记录了吗');

    // 解析数值（保留2位小数）
    const totalMileage = Number(parseFloat(csvRow['公里数']).toFixed(0));  // 公里数为整数
    const displayAmount = Number(parseFloat(csvRow['油费']).toFixed(2));
    const displayUnitPrice = Number(parseFloat(csvRow['单价']).toFixed(2));
    const fuelVolume = Number(parseFloat(csvRow['油量']).toFixed(2));
    const actualAmount = Number(parseFloat(csvRow['实际付金额']).toFixed(2));
    const discount = Number(parseFloat(csvRow['优惠金额']).toFixed(2));
    const actualUnitPrice = Number(parseFloat(csvRow['实付单价']).toFixed(2));

    // 构造完整的数据模型
    return {
      // 基础字段
      id,
      vehicleId,

      // 核心数据字段（新版）
      time,
      date,
      fuelType,
      totalMileage,
      displayAmount,
      displayUnitPrice,
      fuelVolume,
      actualAmount,
      discount,
      actualUnitPrice,
      isFull,
      isLightOn,
      isLastRecorded,
      note: '',  // 备注默认为空

      // 兼容字段（详情页使用）
      mileage: totalMileage,
      volume: fuelVolume,
      cost: actualAmount,

      // 计算字段（导入后重新计算）
      fuelConsumption: 0
    };

  } catch (err) {
    // 捕获任何解析错误，提供详细信息
    console.error('[CSV Parser] 映射失败:', err);
    throw new Error(`数据映射失败：${err.message}`);
  }
}

module.exports = {
  parseCSV,              // TODO: 阶段7实现（依赖Papa Parse）
  parseFlexibleDate,     // ✅ 已实现（独立）
  parseCSVBoolean,       // ✅ 已实现（独立）
  mapCSVToFuelRecord     // ✅ 已实现（独立）
};
