/**
 * CSV导出工具
 *
 * 注意：当前使用简单实现（join方法），阶段7可优化为Papa Parse的unparse方法
 * 简单实现能满足基本需求，Papa Parse提供更健壮的引号、逗号转义处理
 */

/**
 * 将油耗记录转换为CSV文本
 * @param {Array} fuelRecords - 油耗记录数组
 * @returns {string} CSV文本内容
 */
function convertFuelRecordsToCSV(fuelRecords) {
  try {
    console.log('[CSV Exporter] 开始转换', fuelRecords.length, '条记录为CSV');

    // 1. 定义表头
    const headers = [
      '日期', '公里数', '油费', '单价', '油量',
      '实际付金额', '优惠金额', '实付单价',
      '是否加满', '是否亮灯', '上次记录了吗'
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));  // 添加表头

    // 2. 转换每条记录
    fuelRecords.forEach((record, index) => {
      try {
        // 日期格式转换：2025-06-27 00:00 → 2025/6/27
        const dateStr = (record.time || record.date).split(' ')[0];  // 去除时间部分
        const dateParts = dateStr.split('-');
        const formattedDate = `${dateParts[0]}/${parseInt(dateParts[1])}/${parseInt(dateParts[2])}`;

        // 构造数据行
        const row = [
          formattedDate,                                                      // 日期
          record.totalMileage || record.mileage,                              // 公里数
          (record.displayAmount || record.cost).toFixed(2),                   // 油费
          record.displayUnitPrice.toFixed(2),                                 // 单价
          (record.fuelVolume || record.volume).toFixed(2),                    // 油量
          record.actualAmount.toFixed(2),                                     // 实付金额
          record.discount.toFixed(2),                                         // 优惠金额
          record.actualUnitPrice.toFixed(2),                                  // 实付单价
          record.isFull ? '加满' : '没加满',                                  // 是否加满
          record.isLightOn ? '亮灯' : '没亮',                                 // 是否亮灯
          record.isLastRecorded ? '记录了' : '漏记了'                          // 上次记录了吗
        ];

        csvRows.push(row.join(','));

      } catch (err) {
        console.error(`[CSV Exporter] 第${index + 1}条记录转换失败:`, err);
        // 跳过错误记录，继续处理其他记录
      }
    });

    const csvText = csvRows.join('\n');

    console.log('[CSV Exporter] CSV转换成功，共', csvRows.length - 1, '条数据（含表头共', csvRows.length, '行）');

    // TODO: 阶段7可优化为使用Papa Parse的unparse方法
    // 优势：自动处理引号、逗号转义、特殊字符等
    console.log('[CSV Exporter] 当前使用简单实现，阶段7可优化为Papa Parse');

    return csvText;

  } catch (err) {
    console.error('[CSV Exporter] CSV转换失败:', err);
    throw new Error(`CSV转换失败：${err.message}`);
  }
}

/**
 * 导出油耗记录为CSV文件
 * @returns {Promise<{success: boolean, fileName: string, userCancel: boolean}>}
 */
async function exportFuelRecordsAsCSV() {
  try {
    console.log('[CSV Exporter] 开始导出油耗记录为CSV文件');

    const storage = require('./storage');

    // 1. 获取当前车辆的加油记录
    const vehicleId = storage.getCurrentVehicleId();
    if (!vehicleId) {
      throw new Error('请先选择车辆');
    }

    const allRecords = storage.getFuelRecords();
    const vehicleRecords = allRecords.filter(r => r.vehicleId === vehicleId);

    if (vehicleRecords.length === 0) {
      throw new Error('暂无数据可导出，请先添加加油记录');
    }

    console.log('[CSV Exporter] 找到', vehicleRecords.length, '条油耗记录');

    // 2. 按日期排序（最新在前）
    vehicleRecords.sort((a, b) => {
      return new Date(b.time || b.date) - new Date(a.time || a.date);
    });

    // 3. 转换为CSV
    const csvText = convertFuelRecordsToCSV(vehicleRecords);

    // 4. 生成文件名
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '');
    const fileName = `油耗记录_${dateStr}.csv`;

    console.log('[CSV Exporter] CSV文件生成完成:', fileName);

    // 5. 写入文件到用户数据目录
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

    try {
      fs.writeFileSync(filePath, csvText, 'utf8');
      console.log('[CSV Exporter] 文件已写入:', filePath);
    } catch (writeErr) {
      console.error('[CSV Exporter] 文件写入失败:', writeErr);
      throw new Error('文件写入失败，请检查存储权限');
    }

    // 6. 分享文件
    return new Promise((resolve, reject) => {
      wx.shareFileMessage({
        filePath,
        fileName,
        success: () => {
          console.log('[CSV Exporter] 文件已分享成功');
          wx.showToast({
            title: 'CSV已分享',
            icon: 'success',
            duration: 2000
          });
          resolve({ success: true, fileName, userCancel: false });
        },
        fail: (err) => {
          // 用户取消分享不算失败
          if (err.errMsg && err.errMsg.includes('cancel')) {
            console.log('[CSV Exporter] 用户取消分享');
            resolve({ success: false, fileName, userCancel: true });
            return;
          }

          // 其他错误
          console.error('[CSV Exporter] 文件分享失败:', err);
          reject(new Error(`分享失败：${err.errMsg || '未知错误'}`));
        }
      });
    });

  } catch (err) {
    console.error('[CSV Exporter] CSV导出失败:', err);
    throw err;
  }
}

module.exports = {
  convertFuelRecordsToCSV,   // ✅ 已实现（简单版，可优化）
  exportFuelRecordsAsCSV     // ✅ 已实现
};
