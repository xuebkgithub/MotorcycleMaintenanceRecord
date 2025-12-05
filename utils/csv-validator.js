/**
 * CSV数据校验工具
 * 用于校验CSV导入的数据是否符合油耗记录模型要求
 */

/**
 * 校验单条CSV记录
 * @param {Object} record - CSV记录（已映射为数据模型）
 * @param {number} rowIndex - 行号（用于错误报告，从2开始，1是表头）
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateCSVRecord(record, rowIndex) {
  const errors = [];

  // 1. 必填字段检查
  const requiredFields = [
    { field: 'time', label: '日期' },
    { field: 'totalMileage', label: '公里数' },
    { field: 'displayAmount', label: '油费' },
    { field: 'fuelVolume', label: '油量' },
    { field: 'displayUnitPrice', label: '单价' },
    { field: 'actualAmount', label: '实付金额' },
    { field: 'discount', label: '优惠金额' },
    { field: 'actualUnitPrice', label: '实付单价' },
    { field: 'isFull', label: '是否加满' },
    { field: 'isLightOn', label: '是否亮灯' },
    { field: 'isLastRecorded', label: '上次记录了吗' }
  ];

  requiredFields.forEach(({ field, label }) => {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push({
        row: rowIndex,
        field: label,
        value: record[field],
        message: `${label}不能为空`
      });
    }
  });

  // 2. 数值合理性验证
  const numericFields = [
    { field: 'totalMileage', label: '公里数', min: 0, max: 999999 },
    { field: 'displayAmount', label: '油费', min: 0, max: 99999 },
    { field: 'fuelVolume', label: '油量', min: 0, max: 999 },
    { field: 'displayUnitPrice', label: '单价', min: 0, max: 999 },
    { field: 'actualAmount', label: '实付金额', min: 0, max: 99999 },
    { field: 'actualUnitPrice', label: '实付单价', min: 0, max: 999 }
    // discount 可为负，不验证最小值
  ];

  numericFields.forEach(({ field, label, min, max }) => {
    const value = record[field];

    // 检查是否为数字
    if (value !== undefined && value !== null && value !== '') {
      const numValue = Number(value);

      if (isNaN(numValue)) {
        errors.push({
          row: rowIndex,
          field: label,
          value: value,
          message: `${label}必须是数字（当前值："${value}"）`
        });
      } else {
        // 检查范围
        if (numValue < min) {
          errors.push({
            row: rowIndex,
            field: label,
            value: value,
            message: `${label}不能小于${min}（当前值：${numValue}）`
          });
        }
        if (numValue > max) {
          errors.push({
            row: rowIndex,
            field: label,
            value: value,
            message: `${label}不能大于${max}（当前值：${numValue}）`
          });
        }
      }
    }
  });

  // 3. 日期有效性验证
  if (record.time) {
    const date = new Date(record.time);
    if (isNaN(date.getTime())) {
      errors.push({
        row: rowIndex,
        field: '日期',
        value: record.time,
        message: '日期无效或格式错误'
      });
    }
  }

  // 4. 布尔值类型验证
  const booleanFields = [
    { field: 'isFull', label: '是否加满' },
    { field: 'isLightOn', label: '是否亮灯' },
    { field: 'isLastRecorded', label: '上次记录了吗' }
  ];

  booleanFields.forEach(({ field, label }) => {
    if (record[field] !== undefined && typeof record[field] !== 'boolean') {
      errors.push({
        row: rowIndex,
        field: label,
        value: record[field],
        message: `${label}必须是布尔值（当前值："${record[field]}"）`
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * 批量校验所有记录
 * @param {Array} records - 记录数组
 * @returns {Object} { validRecords: Array, errors: Array }
 */
function validateAllRecords(records) {
  const validRecords = [];
  const allErrors = [];

  records.forEach((record, index) => {
    // 跳过映射失败的记录（已有_error标记）
    if (record._error) {
      return;
    }

    const result = validateCSVRecord(record, index + 2);  // +2因为：1是表头，index从0开始

    if (result.valid) {
      validRecords.push(record);
    } else {
      allErrors.push(...result.errors);
    }
  });

  console.log(`[CSV Validator] 校验完成：总计${records.length}条，有效${validRecords.length}条，错误${allErrors.length}条`);

  return {
    validRecords,
    errors: allErrors
  };
}

/**
 * 检测重复数据（精确匹配：相同日期+公里数）
 * @param {Array} csvRecords - CSV导入的记录
 * @param {Array} existingRecords - 现有的加油记录
 * @returns {Object} { duplicates: Array, safeRecords: Array }
 */
function detectDuplicates(csvRecords, existingRecords) {
  const duplicates = [];
  const safeRecords = [];

  // 构建现有记录的索引（优化查找性能）
  const existingIndex = new Map();
  existingRecords.forEach(existing => {
    // 提取日期部分（忽略时间）
    const existingDate = (existing.time || existing.date).split(' ')[0];
    const existingMileage = existing.totalMileage || existing.mileage;
    const key = `${existingDate}_${existingMileage}`;

    // 存储记录（如果有多个相同key，保留最新的）
    if (!existingIndex.has(key)) {
      existingIndex.set(key, existing);
    }
  });

  console.log(`[CSV Validator] 现有记录索引构建完成，共${existingIndex.size}个唯一键`);

  // 检查CSV记录是否重复
  csvRecords.forEach((csvRecord, index) => {
    // 提取日期部分（忽略时间）
    const csvDate = csvRecord.time.split(' ')[0];
    const csvMileage = csvRecord.totalMileage;
    const key = `${csvDate}_${csvMileage}`;

    const existingMatch = existingIndex.get(key);

    if (existingMatch) {
      // 发现重复
      duplicates.push({
        row: index + 2,  // +2因为：1是表头，index从0开始
        csvRecord: csvRecord,
        existingRecord: existingMatch,
        reason: `日期和公里数完全相同（${csvDate}, ${csvMileage}km）`
      });
      console.log(`[CSV Validator] 发现重复：第${index + 2}行 - ${csvDate} ${csvMileage}km`);
    } else {
      // 安全记录
      safeRecords.push(csvRecord);
    }
  });

  console.log(`[CSV Validator] 重复检测完成：重复${duplicates.length}条，可导入${safeRecords.length}条`);

  return {
    duplicates,
    safeRecords
  };
}

/**
 * 生成导入报告
 * @param {Object} validationResults - 校验结果 { validRecords, errors }
 * @param {Array} duplicates - 重复记录列表
 * @param {Array} safeRecords - 可安全导入的记录列表
 * @returns {Object} 报告对象
 */
function generateImportReport(validationResults, duplicates, safeRecords) {
  const totalRecords = validationResults.validRecords.length + validationResults.errors.length;

  const report = {
    summary: {
      total: totalRecords,
      valid: validationResults.validRecords.length,
      error: validationResults.errors.length,
      duplicate: duplicates.length,
      toImport: safeRecords.length
    },
    errors: validationResults.errors,
    duplicates: duplicates.map(d => ({
      row: d.row,
      reason: d.reason,
      csvData: {
        date: d.csvRecord.time.split(' ')[0],
        mileage: d.csvRecord.totalMileage,
        cost: d.csvRecord.displayAmount
      },
      existingData: {
        date: (d.existingRecord.time || d.existingRecord.date).split(' ')[0],
        mileage: d.existingRecord.totalMileage || d.existingRecord.mileage,
        cost: d.existingRecord.displayAmount || d.existingRecord.cost
      }
    }))
  };

  console.log('[CSV Validator] 导入报告生成完成:', report.summary);

  return report;
}

module.exports = {
  validateCSVRecord,
  validateAllRecords,
  detectDuplicates,
  generateImportReport
};
