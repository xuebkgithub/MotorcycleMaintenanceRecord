import gulpError from './utils/gulpError';
const storage = require('./utils/storage');
const fuelMigration = require('./utils/migrate-fuel-consumption');

App({
    onLaunch() {
        // 执行多车辆数据迁移（只在首次运行时执行）
        const result = storage.migrateToMultiVehicle();
        if (result.success && !result.skipped) {
            console.log('多车辆数据迁移成功', result);
        }

        // 执行油耗计算迁移（自动检测并执行一次）
        fuelMigration.autoMigrate();
    },

    onShow() {
        if (gulpError !== 'gulpErrorPlaceHolder') {
            wx.redirectTo({
                url: `/pages/gulp-error/index?gulpError=${gulpError}`,
            });
        }
    },
});
