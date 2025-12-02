import gulpError from './utils/gulpError';
const storage = require('./utils/storage');

App({
    onLaunch() {
        // 执行数据迁移（只在首次运行时执行）
        const result = storage.migrateToMultiVehicle();
        if (result.success && !result.skipped) {
            console.log('数据迁移成功', result);
        }
    },

    onShow() {
        if (gulpError !== 'gulpErrorPlaceHolder') {
            wx.redirectTo({
                url: `/pages/gulp-error/index?gulpError=${gulpError}`,
            });
        }
    },
});
