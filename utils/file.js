/**
 * 文件操作工具模块
 * 封装微信小程序文件系统API，提供Promise风格的接口
 */

/**
 * 写入JSON文件
 * @param {string} fileName - 文件名（不含路径）
 * @param {object} data - 要写入的数据对象
 * @returns {Promise<string>} 返回完整文件路径
 */
function writeJSONFile(fileName, data) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();

    try {
      // 将对象转换为格式化的JSON字符串
      const jsonString = JSON.stringify(data, null, 2);

      // 使用正确的临时文件路径
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      fs.writeFile({
        filePath,
        data: jsonString,
        encoding: 'utf8',
        success: () => {
          console.log('[文件工具] JSON文件写入成功:', filePath);
          resolve(filePath);  // 返回文件路径
        },
        fail: (err) => {
          console.error('[文件工具] JSON文件写入失败:', err);
          reject(new Error('文件写入失败，请检查存储空间'));
        }
      });
    } catch (err) {
      console.error('[文件工具] JSON序列化失败:', err);
      reject(new Error('数据格式错误，无法生成文件'));
    }
  });
}

/**
 * 同步写入JSON文件（用于预生成导出文件）
 * @param {string} fileName - 文件名（不含路径）
 * @param {object} data - 要写入的数据对象
 * @returns {string} 返回完整文件路径
 */
function writeJSONFileSync(fileName, data) {
  try {
    const fs = wx.getFileSystemManager();

    // 将对象转换为格式化的JSON字符串
    const jsonString = JSON.stringify(data, null, 2);

    // 使用正确的临时文件路径
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

    // 同步写入文件
    fs.writeFileSync(filePath, jsonString, 'utf8');

    console.log('[文件工具] JSON文件同步写入成功:', filePath);
    return filePath;
  } catch (err) {
    console.error('[文件工具] JSON文件同步写入失败:', err);
    throw new Error('文件同步写入失败：' + err.message);
  }
}

/**
 * 读取JSON文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<object>} 解析后的数据对象
 */
function readJSONFile(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();

    fs.readFile({
      filePath,
      encoding: 'utf8',
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          console.log('[文件工具] JSON文件读取成功:', filePath);
          resolve(data);
        } catch (err) {
          console.error('[文件工具] JSON解析失败:', err);
          reject(new Error('文件内容损坏，无法解析'));
        }
      },
      fail: (err) => {
        console.error('[文件工具] 文件读取失败:', err);
        reject(new Error('文件读取失败，请确认文件是否存在'));
      }
    });
  });
}

/**
 * 分享文件到聊天（优化版：支持降级方案）
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件名（显示在聊天中）
 * @returns {Promise<void>}
 */
function shareFile(filePath, fileName) {
  return new Promise((resolve, reject) => {
    // 方案1：尝试使用 shareFileMessage
    wx.shareFileMessage({
      filePath,
      fileName,
      success: () => {
        console.log('[文件工具] 文件分享成功:', fileName);
        wx.showToast({
          title: '文件已分享',
          icon: 'success',
          duration: 2000
        });
        resolve();
      },
      fail: (err) => {
        console.error('[文件工具] shareFileMessage 失败:', err);

        // 用户取消分享不算失败
        if (err.errMsg && err.errMsg.includes('cancel')) {
          console.log('[文件工具] 用户取消分享');
          resolve();
          return;
        }

        // 方案2：降级使用 saveFile + 提示
        console.log('[文件工具] 尝试降级方案：保存文件到本地');
        wx.saveFile({
          tempFilePath: filePath,
          success: (res) => {
            console.log('[文件工具] 文件已保存到:', res.savedFilePath);

            wx.showModal({
              title: '导出成功',
              content: `文件已保存到小程序存储空间\n\n文件名：${fileName}\n\n请通过"聊天记录 → 文件 → 小程序文件"查看，或点击"打开文件"`,
              confirmText: '打开文件',
              cancelText: '我知道了',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  // 打开文档
                  wx.openDocument({
                    filePath: res.savedFilePath,
                    fileType: 'json',
                    success: () => {
                      console.log('[文件工具] 文档已打开');
                    },
                    fail: (openErr) => {
                      console.error('[文件工具] 打开文档失败:', openErr);
                      wx.showToast({
                        title: '文件已保存，请在聊天记录中查看',
                        icon: 'none',
                        duration: 3000
                      });
                    }
                  });
                }
                resolve();
              }
            });
          },
          fail: (saveErr) => {
            console.error('[文件工具] saveFile 也失败了:', saveErr);
            reject(new Error('文件导出失败，请检查存储权限'));
          }
        });
      }
    });
  });
}

/**
 * 选择文件（从聊天记录）
 * @param {Array<string>} extensions - 允许的文件扩展名，如 ['json']
 * @returns {Promise<object>} 返回 {path: string, size: number, name: string}
 */
function chooseFile(extensions = ['json']) {
  return new Promise((resolve, reject) => {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: extensions,
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          const file = res.tempFiles[0];
          console.log('[文件工具] 文件选择成功:', file.name);
          resolve({
            path: file.path,
            size: file.size,
            name: file.name
          });
        } else {
          reject(new Error('未选择文件'));
        }
      },
      fail: (err) => {
        console.error('[文件工具] 文件选择失败:', err);

        // 用户取消选择不算失败
        if (err.errMsg && err.errMsg.includes('cancel')) {
          console.log('[文件工具] 用户取消选择');
          reject(new Error('USER_CANCEL')); // 特殊错误码，调用方可以忽略
        } else {
          reject(new Error('文件选择失败，请重试'));
        }
      }
    });
  });
}

/**
 * 获取文件信息
 * @param {string} filePath - 文件路径
 * @returns {Promise<object>} 返回 {size: number, createTime: number, modifyTime: number}
 */
function getFileInfo(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();

    fs.stat({
      path: filePath,
      success: (res) => {
        console.log('[文件工具] 获取文件信息成功:', filePath);
        resolve({
          size: res.stats.size,
          createTime: res.stats.lastAccessedTime,
          modifyTime: res.stats.lastModifiedTime
        });
      },
      fail: (err) => {
        console.error('[文件工具] 获取文件信息失败:', err);
        reject(new Error('获取文件信息失败'));
      }
    });
  });
}

/**
 * 删除文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<void>}
 */
function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();

    fs.unlink({
      filePath,
      success: () => {
        console.log('[文件工具] 文件删除成功:', filePath);
        resolve();
      },
      fail: (err) => {
        console.error('[文件工具] 文件删除失败:', err);
        reject(new Error('文件删除失败'));
      }
    });
  });
}

module.exports = {
  writeJSONFile,
  writeJSONFileSync,  // 新增：同步写入
  readJSONFile,
  shareFile,
  chooseFile,
  getFileInfo,
  deleteFile
};
