// 我的页面
// 个人设置、数据管理、车辆信息

const storage = require('../../utils/storage');
const importExport = require('../../utils/import-export');
const fuelMigration = require('../../utils/migrate-fuel-consumption');

Page({
  data: {
    vehicleInfo: {},
    showImportExportGuide: false,  // 引导对话框显示状态
    preparedFileInfo: null         // 预生成文件信息
  },

  onLoad() {
    this.loadData();

    // 检查是否首次使用导入导出功能
    const hasSeenGuide = wx.getStorageSync('_import_export_guide_seen');
    if (!hasSeenGuide) {
      this.setData({ showImportExportGuide: true });
    }

    // 预生成导出文件
    this.prepareCachedExportFile();
  },

  onShow() {
    // 每次显示时刷新车辆信息
    this.loadData();

    // 检查缓存文件有效性
    this.checkCachedFileValidity();
  },

  // 加载数据
  loadData() {
    const vehicleInfo = storage.getVehicleInfo();
    this.setData({ vehicleInfo });
  },

  // 准备缓存的导出文件
  async prepareCachedExportFile() {
    try {
      console.log('[Profile] 开始预生成导出文件...');
      const fileInfo = await importExport.prepareExportFile();

      if (fileInfo) {
        this.setData({ preparedFileInfo: fileInfo });
        console.log('[Profile] 预生成文件成功:', fileInfo.fileName);
      } else {
        console.log('[Profile] 暂无数据，跳过预生成');
      }
    } catch (err) {
      console.error('[Profile] 预生成文件失败:', err);
      // 预生成失败不影响页面正常使用
    }
  },

  // 检查缓存文件有效性
  async checkCachedFileValidity() {
    try {
      const currentData = storage.getAllData();
      const currentChecksum = importExport.generateChecksum(currentData);

      const cachedInfo = this.data.preparedFileInfo;

      // 如果缓存文件存在且数据有变更，重新生成
      if (cachedInfo && cachedInfo.dataChecksum !== currentChecksum) {
        console.log('[Profile] 数据已变更，重新生成导出文件');
        await this.prepareCachedExportFile();
      }
    } catch (err) {
      console.error('[Profile] 检查缓存文件失败:', err);
    }
  },

  // 导出数据（统一入口）
  async onExportData() {
    try {
      // 1. 显示格式选择对话框
      const format = await this.showExportFormatDialog();
      if (!format) return; // 用户取消

      // 2. 根据格式执行不同的导出流程
      if (format === 'json') {
        // JSON格式：再选择快速导出或实时导出
        const mode = await this.showJSONExportModeDialog();
        if (!mode) return; // 用户取消

        if (mode === 'quick') {
          await this.exportJSONQuick();
        } else if (mode === 'realtime') {
          await this.exportJSONRealtime();
        }
      } else if (format === 'csv') {
        // CSV格式：直接导出
        await this.exportCSVData();
      }

    } catch (err) {
      console.error('[Profile] 导出数据失败:', err);
      // 已在具体方法中处理错误，这里不重复提示
    }
  },

  // 显示导出格式选择对话框
  showExportFormatDialog() {
    return new Promise((resolve) => {
      wx.showActionSheet({
        itemList: ['JSON 格式（完整备份）', 'CSV 格式（油耗记录）'],
        success: (res) => {
          if (res.tapIndex === 0) {
            resolve('json');
          } else if (res.tapIndex === 1) {
            resolve('csv');
          }
        },
        fail: () => {
          resolve(null); // 用户取消
        }
      });
    });
  },

  // 显示 JSON 导出模式选择对话框
  showJSONExportModeDialog() {
    return new Promise((resolve) => {
      wx.showActionSheet({
        itemList: ['快速导出（推荐）', '实时导出'],
        success: (res) => {
          if (res.tapIndex === 0) {
            resolve('quick');
          } else if (res.tapIndex === 1) {
            resolve('realtime');
          }
        },
        fail: () => {
          resolve(null); // 用户取消
        }
      });
    });
  },

  // 快速导出 JSON（重命名方法）
  async exportJSONQuick() {
    try {
      // 1. 检查预生成文件（同步检查）
      const fileInfo = this.data.preparedFileInfo;

      if (!fileInfo || !fileInfo.filePath) {
        wx.showModal({
          title: '快速导出失败',
          content: '导出文件未准备好，请稍后重试。\n\n错误码：QUICK_EXPORT_NO_FILE\n\n建议：请尝试使用"实时导出"功能',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }

      // 2. 直接同步调用 shareFileMessage（必须在手势上下文中）
      wx.shareFileMessage({
        filePath: fileInfo.filePath,
        fileName: fileInfo.fileName,
        success: () => {
          console.log('[Profile] 快速导出成功');
          wx.showToast({
            title: '文件已分享',
            icon: 'success',
            duration: 2000
          });

          // 分享成功后重新生成（为下次做准备）
          this.prepareCachedExportFile();
        },
        fail: (err) => {
          console.error('[Profile] shareFileMessage 失败:', err);

          // 用户取消不提示
          if (err.errMsg && err.errMsg.includes('cancel')) {
            console.log('[Profile] 用户取消分享');
            return;
          }

          // 显示详细错误
          wx.showModal({
            title: '快速导出失败',
            content: `wx.shareFileMessage 调用失败\n\n原因：${err.errMsg}\n\n错误码：QUICK_EXPORT_API_FAIL\n\n建议：请尝试使用"实时导出"功能`,
            showCancel: false,
            confirmText: '知道了'
          });
        }
      });

    } catch (err) {
      console.error('[Profile] 快速导出异常:', err);
      wx.showModal({
        title: '快速导出失败',
        content: err.message || '未知错误',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 实时导出 JSON（重命名方法）
  async exportJSONRealtime() {
    try {
      // 1. 收集所有数据（同步）
      const storage = require('../../utils/storage');
      const allData = storage.getAllData();

      // 检查是否有数据
      if (!allData.vehicles || allData.vehicles.length === 0) {
        wx.showModal({
          title: '提示',
          content: '暂无数据可导出，请先添加车辆和记录',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }

      // 2. 构造导出对象（同步）
      const exportData = {
        version: '1.0.0',
        appName: '摩托车维护记录',
        exportTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        data: allData,
        checksum: importExport.generateChecksum(allData)
      };

      // 3. 生成文件名（同步）
      const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '');
      const fileName = `摩托车维护记录_${dateStr}.csv`;

      // 4. 同步写入文件（关键：使用同步方法）
      const file = require('../../utils/file');
      const filePath = file.writeJSONFileSync(fileName, exportData);

      console.log('[Profile] 实时导出文件已生成:', filePath);

      // 5. 立即调用 shareFileMessage（仍在手势上下文中）
      wx.shareFileMessage({
        filePath,
        fileName,
        success: () => {
          console.log('[Profile] 实时导出成功');
          wx.showToast({
            title: '文件已分享',
            icon: 'success',
            duration: 2000
          });

          // 导出成功后重新生成缓存文件（异步，不影响分享）
          this.prepareCachedExportFile();
        },
        fail: (err) => {
          console.error('[Profile] shareFileMessage 失败:', err);

          // 用户取消不提示
          if (err.errMsg && err.errMsg.includes('cancel')) {
            console.log('[Profile] 用户取消分享');
            return;
          }

          // 显示详细错误，提示文件已保存
          wx.showModal({
            title: '分享失败',
            content: `wx.shareFileMessage 调用失败\n\n原因：${err.errMsg}\n\n错误码：VIEW_EXPORT_SHARE_FAIL\n\n文件已生成并保存：\n${fileName}`,
            showCancel: false,
            confirmText: '知道了'
          });
        }
      });

    } catch (err) {
      console.error('[Profile] 实时导出失败:', err);
      wx.showModal({
        title: '实时导出失败',
        content: `文件生成失败\n\n原因：${err.message}\n\n错误码：VIEW_EXPORT_GENERATE_FAIL`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 导出 CSV 数据（重命名方法）
  async exportCSVData() {
    try {
      // 1. 检查当前车辆
      const vehicleId = storage.getCurrentVehicleId();
      if (!vehicleId) {
        wx.showModal({
          title: '提示',
          content: '请先选择车辆',
          showCancel: false
        });
        return;
      }

      // 2. 检查是否有数据
      const allRecords = storage.getFuelRecords();
      const vehicleRecords = allRecords.filter(r => r.vehicleId === vehicleId);

      if (vehicleRecords.length === 0) {
        wx.showModal({
          title: '提示',
          content: '当前车辆暂无油耗记录',
          showCancel: false
        });
        return;
      }

      // 3. 调用导出函数
      wx.showLoading({ title: '正在生成CSV...' });
      const csvExporter = require('../../utils/csv-exporter');
      const result = await csvExporter.exportFuelRecordsAsCSV();
      wx.hideLoading();

      // 4. 处理结果
      if (result.success) {
        console.log('[Profile] CSV导出成功');
        // wx.shareFileMessage 成功后会自动显示 Toast
      } else if (result.userCancel) {
        console.log('[Profile] 用户取消CSV分享');
        // 用户取消不提示
      } else {
        throw new Error('CSV导出失败');
      }

    } catch (err) {
      wx.hideLoading();
      console.error('[Profile] CSV导出失败:', err);

      wx.showModal({
        title: 'CSV导出失败',
        content: err.message || '未知错误，请重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 导入数据（入口）
  async onImportData() {
    try {
      // 1. 显示格式选择对话框
      const format = await this.showFormatSelectionDialog();
      if (!format) return; // 用户取消

      // 2. 根据格式执行不同的导入流程
      if (format === 'json') {
        await this.importJSONData();
      } else if (format === 'csv') {
        await this.importCSVData();
      }

    } catch (err) {
      wx.hideLoading();

      // 用户取消不提示
      if (err.message === '已取消导入') {
        return;
      }

      // 显示错误提示
      wx.showModal({
        title: '导入失败',
        content: err.message || '未知错误，请重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 显示格式选择对话框
  showFormatSelectionDialog() {
    return new Promise((resolve) => {
      wx.showActionSheet({
        itemList: ['JSON 格式（完整备份）', 'CSV 格式（油耗记录）'],
        success: (res) => {
          if (res.tapIndex === 0) {
            resolve('json');
          } else if (res.tapIndex === 1) {
            resolve('csv');
          }
        },
        fail: () => {
          resolve(null); // 用户取消
        }
      });
    });
  },

  // 导入 JSON 数据（原有流程）
  async importJSONData() {
    try {
      // 1. 选择文件
      const fileInfo = await importExport.chooseImportFile();

      // 2. 解析并验证文件
      wx.showLoading({ title: '正在读取文件...' });
      const importData = await importExport.parseImportFile(fileInfo.path);
      wx.hideLoading();

      // 3. 显示确认对话框
      const confirmed = await this.showImportConfirmDialog(importData);
      if (!confirmed) return;

      // 4. 执行导入
      wx.showLoading({ title: '正在导入数据...' });
      const result = await importExport.importData(
        fileInfo.path,
        confirmed.mode
      );
      wx.hideLoading();

      // 5. 提示成功并刷新页面
      const stats = result.stats;
      let message = `导入成功！\n\n`;
      message += `• 车辆：${stats.vehicles} 辆\n`;
      message += `• 保养记录：${stats.maintenanceRecords} 条\n`;
      message += `• 加油记录：${stats.fuelRecords} 条`;

      if (stats.mode === 'merge' && stats.conflicts > 0) {
        message += `\n• 冲突覆盖：${stats.conflicts} 条`;
      }

      wx.showModal({
        title: '导入成功',
        content: message,
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          // 刷新页面数据
          this.loadData();
          // 数据已变更，重新生成预生成文件
          this.prepareCachedExportFile();
        }
      });

    } catch (err) {
      throw err; // 向上抛出错误
    }
  },

  // 导入 CSV 数据（新流程）
  async importCSVData() {
    try {
      // 1. 检查当前车辆
      const vehicleId = storage.getCurrentVehicleId();
      if (!vehicleId) {
        wx.showModal({
          title: '提示',
          content: 'CSV 导入需要先选择车辆，请在首页选择车辆后再试',
          showCancel: false
        });
        return;
      }

      // 2. 选择 CSV 文件
      const fileInfo = await importExport.chooseCSVFile();

      // 3. 解析 CSV 文件
      wx.showLoading({ title: '正在解析 CSV...' });
      const csvData = await importExport.parseCSVFile(fileInfo.path);
      wx.hideLoading();

      // 4. 校验数据
      const csvValidator = require('../../utils/csv-validator');
      const csvParser = require('../../utils/csv-parser');

      // 映射 CSV 数据为油耗记录（使用默认油品类型，后续在预览页可修改）
      const tempFuelTypes = new Array(csvData.length).fill('92#');
      const mappedRecords = csvData.map((row, index) => {
        try {
          return csvParser.mapCSVToFuelRecord(row, vehicleId, tempFuelTypes[index]);
        } catch (err) {
          console.error(`[Profile] CSV 第${index + 2}行映射失败:`, err);
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

      // 校验所有记录
      const validationResults = csvValidator.validateAllRecords(successRecords);

      // 检测重复
      const existingRecords = storage.getFuelRecords().filter(r => r.vehicleId === vehicleId);
      const { duplicates, safeRecords } = csvValidator.detectDuplicates(
        validationResults.validRecords,
        existingRecords
      );

      // 合并所有错误
      const allErrors = [...mappingErrors, ...validationResults.errors];

      console.log('[Profile] CSV 解析完成:', {
        总记录: csvData.length,
        映射错误: mappingErrors.length,
        校验错误: validationResults.errors.length,
        重复记录: duplicates.length,
        可导入: safeRecords.length
      });

      // 5. 缓存数据并跳转到预览页面
      wx.setStorageSync('_csv_import_preview', {
        csvData,
        errors: allErrors,
        duplicates,
        safeRecords
      });

      wx.navigateTo({
        url: '/pages/csv-import-preview/index'
      });

    } catch (err) {
      throw err; // 向上抛出错误
    }
  },

  // 显示导入确认对话框
  showImportConfirmDialog(importData) {
    return new Promise((resolve) => {
      const { vehicles, maintenanceRecords, fuelRecords } = importData.data;

      wx.showModal({
        title: '确认导入数据？',
        content: `即将导入：\n• 车辆：${vehicles.length} 辆\n• 保养记录：${maintenanceRecords.length} 条\n• 加油记录：${fuelRecords.length} 条\n\n请选择导入模式：`,
        confirmText: '覆盖导入',
        cancelText: '合并导入',
        confirmColor: '#FA5151',  // 覆盖模式使用警告色
        success: (res) => {
          if (res.confirm) {
            // 用户点击"覆盖导入" - 再次确认
            wx.showModal({
              title: '⚠️ 覆盖模式确认',
              content: '覆盖模式会清空现有数据，导入备份文件中的数据。\n\n此操作无法撤销，确认继续？',
              confirmText: '确认覆盖',
              cancelText: '取消',
              confirmColor: '#FA5151',
              success: (res2) => {
                if (res2.confirm) {
                  resolve({ mode: 'overwrite' });
                } else {
                  resolve(null); // 用户取消
                }
              }
            });
          } else if (res.cancel) {
            // 用户点击"合并导入" - 说明合并规则
            wx.showModal({
              title: '合并模式确认',
              content: '合并模式会保留现有数据，并添加导入的数据。ID 冲突时，导入数据将覆盖本地数据。\n\n确认继续？',
              confirmText: '确认合并',
              cancelText: '取消',
              confirmColor: '#0052D9',  // 主题色
              success: (res2) => {
                if (res2.confirm) {
                  resolve({ mode: 'merge' });
                } else {
                  resolve(null); // 用户取消
                }
              }
            });
          }
        }
      });
    });
  },

  // 重新计算油耗
  onRecalculateFuelConsumption() {
    wx.showModal({
      title: '重新计算油耗',
      content: '将使用新的精确算法重新计算所有加油记录的油耗数据。\n\n此操作会覆盖现有的油耗数据，确认继续？',
      confirmText: '确认',
      cancelText: '取消',
      confirmColor: '#0052D9',
      success: (res) => {
        if (res.confirm) {
          this.executeRecalculate();
        }
      }
    });
  },

  // 执行重新计算
  executeRecalculate() {
    try {
      wx.showLoading({ title: '正在计算...' });

      // 调用迁移函数重新计算油耗
      const result = fuelMigration.migrate();

      wx.hideLoading();

      if (result.success) {
        // 显示成功提示
        let message = `计算完成！\n\n`;
        message += `• 总记录数：${result.total} 条\n`;
        message += `• 更新记录：${result.updated} 条\n`;
        message += `• 未变化：${result.unchanged} 条`;

        if (result.failed > 0) {
          message += `\n• 计算失败：${result.failed} 条`;
        }

        wx.showModal({
          title: '✅ 计算成功',
          content: message,
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        throw new Error(result.message || '计算失败');
      }

    } catch (err) {
      wx.hideLoading();
      console.error('[Profile] 重新计算油耗失败:', err);

      wx.showModal({
        title: '计算失败',
        content: err.message || '未知错误，请重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 引导确认
  onGuideConfirm() {
    this.setData({ showImportExportGuide: false });
    wx.setStorageSync('_import_export_guide_seen', true);
  },

  // 车辆信息
  onVehicleInfo() {
    wx.navigateTo({
      url: '/pages/vehicle-manage/index'
    });
  },

  // 关于我们
  onAbout() {
    wx.showModal({
      title: '关于我们',
      content: '摩托车维护记录小程序\n版本：1.0.0\n\n帮助您轻松管理摩托车维护和油耗记录',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 清空所有数据（第1次点击）
  onClearAllData() {
    wx.showModal({
      title: '⚠️ 清空所有数据',
      content: '将清空以下数据：\n\n• 所有车辆信息\n• 所有保养记录\n• 所有加油记录\n• 导入导出临时数据\n\n此操作无法撤销！',
      confirmText: '继续',
      cancelText: '取消',
      confirmColor: '#FA5151',
      success: (res) => {
        if (res.confirm) {
          // 用户点击"继续"，进入第2次确认
          this.onConfirmClearFirst();
        }
      }
    });
  },

  // 第2次确认
  onConfirmClearFirst() {
    wx.showModal({
      title: '🔴 最终确认',
      content: '确定要清空所有数据吗？\n\n此操作无法恢复！',
      confirmText: '确认清空',
      cancelText: '取消',
      confirmColor: '#FA5151',
      success: (res) => {
        if (res.confirm) {
          // 用户最终确认，执行清空
          this.executeClearAll();
        }
      }
    });
  },

  // 执行清空操作
  async executeClearAll() {
    try {
      wx.showLoading({ title: '正在清空数据...' });

      // 1. 清空本地存储数据
      const storage = require('../../utils/storage');
      const clearSuccess = storage.clearAllData();

      if (!clearSuccess) {
        throw new Error('清空本地数据失败');
      }

      // 2. 清除导出临时文件
      const importExport = require('../../utils/import-export');
      await importExport.clearPreparedFile();

      // 3. 清除页面缓存数据
      this.setData({
        vehicleInfo: {},
        preparedFileInfo: null
      });

      wx.hideLoading();

      // 4. 显示成功提示
      wx.showModal({
        title: '清空成功',
        content: '所有数据已清空',
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          // 刷新页面数据
          this.loadData();
        }
      });

    } catch (err) {
      wx.hideLoading();
      console.error('[Profile] 清空数据失败:', err);

      wx.showModal({
        title: '清空失败',
        content: err.message || '未知错误，请重试',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  }
});
