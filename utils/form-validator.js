/**
 * 表单验证工具
 * 提供统一的字段验证和错误提示
 */

/**
 * 必填验证
 * @param {*} value - 待验证的值
 * @param {string} fieldName - 字段名称（用于错误提示）
 * @returns {{valid: boolean, message?: string}} 验证结果
 */
function validateRequired(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  return { valid: true };
}

/**
 * 数字范围验证
 * @param {*} value - 待验证的值
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @param {string} fieldName - 字段名称
 * @returns {{valid: boolean, message?: string}} 验证结果
 */
function validateNumberRange(value, min, max, fieldName) {
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName}必须是数字` };
  }
  if (num < min || num > max) {
    return { valid: false, message: `${fieldName}范围：${min}-${max}` };
  }
  return { valid: true };
}

/**
 * 字符串长度验证
 * @param {string} value - 待验证的字符串
 * @param {number} maxLength - 最大长度
 * @param {string} fieldName - 字段名称
 * @returns {{valid: boolean, message?: string}} 验证结果
 */
function validateStringLength(value, maxLength, fieldName) {
  if (value && value.length > maxLength) {
    return { valid: false, message: `${fieldName}最多${maxLength}个字符` };
  }
  return { valid: true };
}

/**
 * 小数位数验证
 * @param {*} value - 待验证的值
 * @param {number} decimalPlaces - 小数位数
 * @param {string} fieldName - 字段名称
 * @returns {{valid: boolean, message?: string}} 验证结果
 */
function validateDecimalPlaces(value, decimalPlaces, fieldName) {
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName}必须是数字` };
  }

  const parts = String(value).split('.');
  if (parts.length > 1 && parts[1].length > decimalPlaces) {
    return { valid: false, message: `${fieldName}最多${decimalPlaces}位小数` };
  }

  return { valid: true };
}

/**
 * 数组非空验证
 * @param {Array} value - 待验证的数组
 * @param {string} fieldName - 字段名称
 * @returns {{valid: boolean, message?: string}} 验证结果
 */
function validateArrayNotEmpty(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    return { valid: false, message: `请至少选择一项${fieldName}` };
  }
  return { valid: true };
}

/**
 * 保养记录完整验证
 * @param {Object} formData - 表单数据
 * @returns {{valid: boolean, errors: Object}} 验证结果
 */
function validateMaintenanceForm(formData) {
  const errors = {};
  let valid = true;

  // 验证保养类型（必填）
  const typeResult = validateRequired(formData.type, '保养类型');
  if (!typeResult.valid) {
    errors.type = typeResult.message;
    valid = false;
  }

  // 验证保养日期（必填）
  const dateResult = validateRequired(formData.date, '保养日期');
  if (!dateResult.valid) {
    errors.date = dateResult.message;
    valid = false;
  }

  // 验证里程（必填，0-999999）
  const mileageRequiredResult = validateRequired(formData.mileage, '里程');
  if (!mileageRequiredResult.valid) {
    errors.mileage = mileageRequiredResult.message;
    valid = false;
  } else {
    const mileageRangeResult = validateNumberRange(formData.mileage, 0, 999999, '里程');
    if (!mileageRangeResult.valid) {
      errors.mileage = mileageRangeResult.message;
      valid = false;
    }
  }

  // 验证费用（必填，≥0，2位小数）
  const costRequiredResult = validateRequired(formData.cost, '费用');
  if (!costRequiredResult.valid) {
    errors.cost = costRequiredResult.message;
    valid = false;
  } else {
    const costRangeResult = validateNumberRange(formData.cost, 0, 999999, '费用');
    if (!costRangeResult.valid) {
      errors.cost = costRangeResult.message;
      valid = false;
    } else {
      const costDecimalResult = validateDecimalPlaces(formData.cost, 2, '费用');
      if (!costDecimalResult.valid) {
        errors.cost = costDecimalResult.message;
        valid = false;
      }
    }
  }

  // 验证保养项目（必填，至少选一项）
  const itemsResult = validateArrayNotEmpty(formData.items, '保养项目');
  if (!itemsResult.valid) {
    errors.items = itemsResult.message;
    valid = false;
  }

  // 验证备注（可选，最多200字符）
  if (formData.notes) {
    const notesResult = validateStringLength(formData.notes, 200, '备注');
    if (!notesResult.valid) {
      errors.notes = notesResult.message;
      valid = false;
    }
  }

  return { valid, errors };
}

/**
 * 油耗记录完整验证
 * @param {Object} formData - 表单数据
 * @returns {{valid: boolean, errors: Object}} 验证结果
 */
function validateFuelForm(formData) {
  const errors = {};
  let valid = true;

  // 验证加油时间（必填）
  const timeResult = validateRequired(formData.time, '加油时间');
  if (!timeResult.valid) {
    errors.time = timeResult.message;
    valid = false;
  }

  // 验证油品类型（必填）
  const fuelTypeResult = validateRequired(formData.fuelType, '油品类型');
  if (!fuelTypeResult.valid) {
    errors.fuelType = fuelTypeResult.message;
    valid = false;
  }

  // 验证总里程（必填，≥0）
  const totalMileageRequiredResult = validateRequired(formData.totalMileage, '总里程');
  if (!totalMileageRequiredResult.valid) {
    errors.totalMileage = totalMileageRequiredResult.message;
    valid = false;
  } else {
    const totalMileageRangeResult = validateNumberRange(formData.totalMileage, 0, 999999, '总里程');
    if (!totalMileageRangeResult.valid) {
      errors.totalMileage = totalMileageRangeResult.message;
      valid = false;
    }
  }

  // 验证显示金额（必填，≥0，2位小数）
  const displayAmountRequiredResult = validateRequired(formData.displayAmount, '显示金额');
  if (!displayAmountRequiredResult.valid) {
    errors.displayAmount = displayAmountRequiredResult.message;
    valid = false;
  } else {
    const displayAmountRangeResult = validateNumberRange(formData.displayAmount, 0, 99999, '显示金额');
    if (!displayAmountRangeResult.valid) {
      errors.displayAmount = displayAmountRangeResult.message;
      valid = false;
    } else {
      const displayAmountDecimalResult = validateDecimalPlaces(formData.displayAmount, 2, '显示金额');
      if (!displayAmountDecimalResult.valid) {
        errors.displayAmount = displayAmountDecimalResult.message;
        valid = false;
      }
    }
  }

  // 验证加油量（必填，≥0，2位小数）
  const fuelVolumeRequiredResult = validateRequired(formData.fuelVolume, '加油量');
  if (!fuelVolumeRequiredResult.valid) {
    errors.fuelVolume = fuelVolumeRequiredResult.message;
    valid = false;
  } else {
    const fuelVolumeRangeResult = validateNumberRange(formData.fuelVolume, 0, 999, '加油量');
    if (!fuelVolumeRangeResult.valid) {
      errors.fuelVolume = fuelVolumeRangeResult.message;
      valid = false;
    } else {
      const fuelVolumeDecimalResult = validateDecimalPlaces(formData.fuelVolume, 2, '加油量');
      if (!fuelVolumeDecimalResult.valid) {
        errors.fuelVolume = fuelVolumeDecimalResult.message;
        valid = false;
      }
    }
  }

  // 验证显示单价（必填，≥0，2位小数）
  const displayUnitPriceRequiredResult = validateRequired(formData.displayUnitPrice, '显示单价');
  if (!displayUnitPriceRequiredResult.valid) {
    errors.displayUnitPrice = displayUnitPriceRequiredResult.message;
    valid = false;
  } else {
    const displayUnitPriceRangeResult = validateNumberRange(formData.displayUnitPrice, 0, 999, '显示单价');
    if (!displayUnitPriceRangeResult.valid) {
      errors.displayUnitPrice = displayUnitPriceRangeResult.message;
      valid = false;
    } else {
      const displayUnitPriceDecimalResult = validateDecimalPlaces(formData.displayUnitPrice, 2, '显示单价');
      if (!displayUnitPriceDecimalResult.valid) {
        errors.displayUnitPrice = displayUnitPriceDecimalResult.message;
        valid = false;
      }
    }
  }

  // 验证实付金额（必填，≥0，2位小数）
  const actualAmountRequiredResult = validateRequired(formData.actualAmount, '实付金额');
  if (!actualAmountRequiredResult.valid) {
    errors.actualAmount = actualAmountRequiredResult.message;
    valid = false;
  } else {
    const actualAmountRangeResult = validateNumberRange(formData.actualAmount, 0, 99999, '实付金额');
    if (!actualAmountRangeResult.valid) {
      errors.actualAmount = actualAmountRangeResult.message;
      valid = false;
    } else {
      const actualAmountDecimalResult = validateDecimalPlaces(formData.actualAmount, 2, '实付金额');
      if (!actualAmountDecimalResult.valid) {
        errors.actualAmount = actualAmountDecimalResult.message;
        valid = false;
      }
    }
  }

  // 验证优惠金额（必填，≥0，2位小数）
  const discountRequiredResult = validateRequired(formData.discount, '优惠金额');
  if (!discountRequiredResult.valid) {
    errors.discount = discountRequiredResult.message;
    valid = false;
  } else {
    const discountRangeResult = validateNumberRange(formData.discount, 0, 99999, '优惠金额');
    if (!discountRangeResult.valid) {
      errors.discount = discountRangeResult.message;
      valid = false;
    } else {
      const discountDecimalResult = validateDecimalPlaces(formData.discount, 2, '优惠金额');
      if (!discountDecimalResult.valid) {
        errors.discount = discountDecimalResult.message;
        valid = false;
      }
    }
  }

  // 验证实际单价（必填，≥0，2位小数）
  const actualUnitPriceRequiredResult = validateRequired(formData.actualUnitPrice, '实际单价');
  if (!actualUnitPriceRequiredResult.valid) {
    errors.actualUnitPrice = actualUnitPriceRequiredResult.message;
    valid = false;
  } else {
    const actualUnitPriceRangeResult = validateNumberRange(formData.actualUnitPrice, 0, 999, '实际单价');
    if (!actualUnitPriceRangeResult.valid) {
      errors.actualUnitPrice = actualUnitPriceRangeResult.message;
      valid = false;
    } else {
      const actualUnitPriceDecimalResult = validateDecimalPlaces(formData.actualUnitPrice, 2, '实际单价');
      if (!actualUnitPriceDecimalResult.valid) {
        errors.actualUnitPrice = actualUnitPriceDecimalResult.message;
        valid = false;
      }
    }
  }

  // 验证布尔值字段（必填）
  if (formData.isFull === null || formData.isFull === undefined) {
    errors.isFull = '请选择是否加满';
    valid = false;
  }

  if (formData.isLightOn === null || formData.isLightOn === undefined) {
    errors.isLightOn = '请选择油灯是否亮';
    valid = false;
  }

  if (formData.isLastRecorded === null || formData.isLastRecorded === undefined) {
    errors.isLastRecorded = '请选择上次是否记录';
    valid = false;
  }

  return { valid, errors };
}

module.exports = {
  validateRequired,
  validateNumberRange,
  validateStringLength,
  validateDecimalPlaces,
  validateArrayNotEmpty,
  validateMaintenanceForm,
  validateFuelForm
};
