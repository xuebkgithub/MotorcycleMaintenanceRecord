// CSV 导入预览页面
// 显示 CSV 数据预览、油品类型选择、校验错误、重复数据提示

const importExport = require('../../utils/import-export');
const storage = require('../../utils/storage');

Page({
  data: {
    csvData: [],              // CSV 原始数据（对象数组）
    fuelTypes: [],            // 每条记录的油品类型选择（与 csvData 一一对应）
    errors: [],               // 校验错误列表
    duplicates: [],           // 重复数据列表
    vehicleId: '',            // 当前车辆ID
    vehicleName: '',          // 当前车辆名称

    // 油品类型选项
    fuelTypeOptions: [
      { label: '92#', value: '92#' },
      { label: '95#', value: '95#' },
      { label: '98#', value: '98#' },
      { label: 'E10', value: 'E10' },
      { label: 'E20', value: 'E20' }
    ],

    // Picker 状态
    showFuelTypePicker: false,
    currentRecordIndex: -1,   // 当前选择油品类型的记录索引

    // 统计信息
    totalCount: 0,
    validCount: 0,
    errorCount: 0,
    duplicateCount: 0
  },

  onLoad(options) {
    try {
      // 1. 获取当前车辆信息
      const vehicleId = storage.getCurrentVehicleId();
      if (!vehicleId) {
        wx.showModal({
          title: '提示',
          content: '请先选择车辆',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }

      const vehicleInfo = storage.getVehicleInfo();
      this.setData({
        vehicleId,
        vehicleName: vehicleInfo.model || vehicleInfo.name || '未命名车辆'
      });

      // 2. 从缓存读取 CSV 数据
      const cachedData = wx.getStorageSync('_csv_import_preview');
      if (!cachedData || !cachedData.csvData) {
        wx.showModal({
          title: '错误',
          content: '未找到 CSV 数据，请重新选择文件',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }

      console.log('[CSV Preview] 加载缓存数据:', cachedData);

      // 3. 初始化油品类型数组（默认92#）
      const fuelTypes = new Array(cachedData.csvData.length).fill('92#');

      // 4. 计算统计信息
      const stats = this.calculateStats(
        cachedData.csvData,
        cachedData.errors,
        cachedData.duplicates
      );

      // 5. 设置数据
      this.setData({
        csvData: cachedData.csvData,
        fuelTypes: fuelTypes,
        errors: cachedData.errors,
        duplicates: cachedData.duplicates,
        totalCount: stats.totalCount,
        validCount: stats.validCount,
        errorCount: stats.errorCount,
        duplicateCount: stats.duplicateCount
      });

    } catch (err) {
      console.error('[CSV Preview] 页面加载失败:', err);
      wx.showModal({
        title: '错误',
        content: err.message || '页面加载失败',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  // 计算统计信息
  calculateStats(csvData, errors, duplicates) {
    const totalCount = csvData.length;
    const errorRows = new Set(errors.map(e => e.row));
    const duplicateRows = new Set(duplicates.map(d => d.row));

    // 去重计数（一条记录可能既有错误又重复，只计一次）
    const problemRows = new Set([...errorRows, ...duplicateRows]);
    const errorCount = errorRows.size;
    const duplicateCount = duplicateRows.size;
    const validCount = totalCount - problemRows.size;

    return {
      totalCount,
      validCount,
      errorCount,
      duplicateCount
    };
  },

  // 获取记录状态（正常/错误/重复）
  getRecordStatus(index) {
    const row = index + 2; // CSV 行号（+2 因为：1是表头，index从0开始）

    const hasError = this.data.errors.some(e => e.row === row);
    const isDuplicate = this.data.duplicates.some(d => d.row === row);

    if (hasError) return 'error';
    if (isDuplicate) return 'duplicate';
    return 'valid';
  },

  // 获取记录的错误信息
  getRecordErrors(index) {
    const row = index + 2;
    return this.data.errors.filter(e => e.row === row);
  },

  // 获取记录的重复信息
  getRecordDuplicate(index) {
    const row = index + 2;
    return this.data.duplicates.find(d => d.row === row);
  },

  // 选择油品类型（打开 Picker）
  onSelectFuelType(e) {
    const index = e.currentTarget.dataset.index;

    // 只有有效记录才能选择油品类型
    const status = this.getRecordStatus(index);
    if (status === 'error') {
      wx.showToast({
        title: '此记录有错误，无法导入',
        icon: 'none'
      });
      return;
    }

    this.setData({
      currentRecordIndex: index,
      showFuelTypePicker: true
    });
  },

  // Picker 确认
  onFuelTypeConfirm(e) {
    const selectedValue = e.detail.value;
    const index = this.data.currentRecordIndex;

    if (index >= 0) {
      const fuelTypes = [...this.data.fuelTypes];
      fuelTypes[index] = selectedValue;

      this.setData({
        fuelTypes,
        showFuelTypePicker: false,
        currentRecordIndex: -1
      });
    }
  },

  // Picker 取消
  onFuelTypeCancel() {
    this.setData({
      showFuelTypePicker: false,
      currentRecordIndex: -1
    });
  },

  // 确认导入
  async onConfirmImport() {
    try {
      // 1. 检查是否有可导入的记录
      if (this.data.validCount === 0) {
        wx.showModal({
          title: '无法导入',
          content: '没有有效的记录可以导入',
          showCancel: false
        });
        return;
      }

      // 2. 显示确认对话框
      const confirmed = await this.showConfirmDialog();
      if (!confirmed) return;

      // 3. 执行导入
      wx.showLoading({ title: '正在导入...' });

      const result = await importExport.importCSVData(this.data.csvData, {
        vehicleId: this.data.vehicleId,
        fuelTypes: this.data.fuelTypes
      });

      wx.hideLoading();

      // 4. 清除缓存
      wx.removeStorageSync('_csv_import_preview');

      // 5. 显示结果
      this.showImportResult(result);

    } catch (err) {
      wx.hideLoading();
      console.error('[CSV Preview] 导入失败:', err);

      wx.showModal({
        title: '导入失败',
        content: err.message || '未知错误，请重试',
        showCancel: false
      });
    }
  },

  // 显示确认对话框
  showConfirmDialog() {
    return new Promise((resolve) => {
      let content = `即将导入 ${this.data.validCount} 条有效记录\n`;

      if (this.data.errorCount > 0) {
        content += `跳过 ${this.data.errorCount} 条错误记录\n`;
      }

      if (this.data.duplicateCount > 0) {
        content += `跳过 ${this.data.duplicateCount} 条重复记录\n`;
      }

      content += '\n确认继续？';

      wx.showModal({
        title: '确认导入',
        content,
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          resolve(res.confirm);
        }
      });
    });
  },

  // 显示导入结果
  showImportResult(result) {
    let content = `成功导入 ${result.stats.imported} 条记录\n\n`;

    if (result.stats.skippedErrors > 0) {
      content += `跳过错误：${result.stats.skippedErrors} 条\n`;
    }

    if (result.stats.skippedDuplicates > 0) {
      content += `跳过重复：${result.stats.skippedDuplicates} 条\n`;
    }

    wx.showModal({
      title: '✅ 导入成功',
      content,
      showCancel: false,
      confirmText: '知道了',
      success: () => {
        // 返回上一页并刷新
        wx.navigateBack({
          success: () => {
            // 触发上一页刷新
            const pages = getCurrentPages();
            if (pages.length >= 2) {
              const prevPage = pages[pages.length - 2];
              if (prevPage.loadData) {
                prevPage.loadData();
              }
            }
          }
        });
      }
    });
  },

  // 取消导入
  onCancelImport() {
    wx.showModal({
      title: '取消导入',
      content: '确定要取消导入吗？',
      confirmText: '确定',
      cancelText: '继续导入',
      success: (res) => {
        if (res.confirm) {
          // 清除缓存
          wx.removeStorageSync('_csv_import_preview');
          // 返回上一页
          wx.navigateBack();
        }
      }
    });
  },

  // 查看错误详情
  onViewErrorDetails() {
    if (this.data.errors.length === 0) {
      wx.showToast({
        title: '暂无错误',
        icon: 'none'
      });
      return;
    }

    // 构建错误信息文本
    let content = `共 ${this.data.errors.length} 处错误：\n\n`;

    // 只显示前5个错误
    const displayErrors = this.data.errors.slice(0, 5);
    displayErrors.forEach(error => {
      content += `第${error.row}行 ${error.field}：${error.message}\n`;
    });

    if (this.data.errors.length > 5) {
      content += `\n... 还有 ${this.data.errors.length - 5} 处错误`;
    }

    wx.showModal({
      title: '错误详情',
      content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 查看重复详情
  onViewDuplicateDetails() {
    if (this.data.duplicates.length === 0) {
      wx.showToast({
        title: '暂无重复',
        icon: 'none'
      });
      return;
    }

    // 构建重复信息文本
    let content = `共 ${this.data.duplicates.length} 条重复：\n\n`;

    // 只显示前3条重复
    const displayDuplicates = this.data.duplicates.slice(0, 3);
    displayDuplicates.forEach(dup => {
      content += `第${dup.row}行：${dup.reason}\n`;
    });

    if (this.data.duplicates.length > 3) {
      content += `\n... 还有 ${this.data.duplicates.length - 3} 条重复`;
    }

    wx.showModal({
      title: '重复详情',
      content,
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
