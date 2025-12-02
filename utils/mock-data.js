/**
 * Mock 数据生成器
 * 用于生成摩托车维护记录的模拟数据
 */

// 生成车辆信息
function generateVehicleInfo() {
  return {
    model: '光阳 X350',
    mileage: 11518,
    backgroundImage: '/assets/bike-bg.jpg',
    backgroundImageDark: '/assets/bike-bg-dark.jpg'
  };
}

// 生成维护记录
function generateMaintenanceRecords() {
  return [
    {
      id: '1',
      date: '2024-12-01',
      mileage: 11518,
      type: '常规保养',
      cost: 350,
      items: ['更换机油', '更换机滤', '清洁空滤']
    },
    {
      id: '2',
      date: '2024-11-15',
      mileage: 12300,
      type: '链条保养',
      cost: 80,
      items: ['清洁链条', '润滑链条', '调整张紧度']
    },
    {
      id: '3',
      date: '2024-10-20',
      mileage: 12100,
      type: '换刹车片',
      cost: 450,
      items: ['前刹车片', '后刹车片']
    },
    {
      id: '4',
      date: '2024-09-10',
      mileage: 11800,
      type: '更换火花塞',
      cost: 280,
      items: ['火花塞x4']
    },
    {
      id: '5',
      date: '2024-08-05',
      mileage: 11500,
      type: '更换轮胎',
      cost: 1200,
      items: ['前轮轮胎', '后轮轮胎']
    }
  ];
}

// 生成加油记录
function generateFuelRecords() {
  return [
    {
      id: '1',
      date: '2024-11-28',
      mileage: 12550,
      volume: 12.5,
      cost: 125,
      fuelConsumption: 4.5
    },
    {
      id: '2',
      date: '2024-11-20',
      mileage: 12350,
      volume: 11.8,
      cost: 118,
      fuelConsumption: 4.3
    },
    {
      id: '3',
      date: '2024-11-12',
      mileage: 12150,
      volume: 12.2,
      cost: 122,
      fuelConsumption: 4.6
    },
    {
      id: '4',
      date: '2024-11-05',
      mileage: 11950,
      volume: 12.0,
      cost: 120,
      fuelConsumption: 4.4
    },
    {
      id: '5',
      date: '2024-10-28',
      mileage: 11750,
      volume: 11.5,
      cost: 115,
      fuelConsumption: 4.2
    }
  ];
}

// 初始化所有 Mock 数据到 Storage
function initMockData() {
  wx.setStorageSync('vehicleInfo', generateVehicleInfo());
  wx.setStorageSync('maintenanceRecords', generateMaintenanceRecords());
  wx.setStorageSync('fuelRecords', generateFuelRecords());
}

module.exports = {
  generateVehicleInfo,
  generateMaintenanceRecords,
  generateFuelRecords,
  initMockData
};
