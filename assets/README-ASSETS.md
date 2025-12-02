# 资源文件说明

本文档说明需要准备的图标和图片资源。

## 📦 TabBar 图标（共8张）

**目录**：`assets/tabbar/`

**要求**：
- **尺寸**：81x81 像素（微信小程序 TabBar 标准尺寸）
- **格式**：PNG（支持透明背景）
- **文件大小**：每张图标 < 40KB

**文件清单**：

### 1. 首页图标
- `home.png` - 首页未选中状态（灰色）
- `home-active.png` - 首页选中状态（蓝色 #0052d9）

### 2. 保养列表图标
- `maintenance.png` - 保养列表未选中状态（灰色）
- `maintenance-active.png` - 保养列表选中状态（蓝色 #0052d9）

### 3. 油耗列表图标
- `fuel.png` - 油耗列表未选中状态（灰色）
- `fuel-active.png` - 油耗列表选中状态（蓝色 #0052d9）

### 4. 我的图标
- `profile.png` - 我的未选中状态（灰色）
- `profile-active.png` - 我的选中状态（蓝色 #0052d9）

**参考图标名称**（可在 TDesign 图标库或 iconfont 查找）：
- 首页：`home` / `home-fill`
- 保养列表：`tools` / `setting`
- 油耗列表：`chart` / `dashboard`
- 我的：`user` / `user-circle`

---

## 🖼️ 背景图片（共2张）

**目录**：`assets/`

**要求**：
- **尺寸**：750x720 像素（2:1.92 比例，适配小程序屏幕）
- **格式**：JPG（压缩后的高质量图片）
- **文件大小**：每张图片 < 100KB

**文件清单**：

### 1. 亮色主题背景
- **文件名**：`bike-bg.jpg`
- **用途**：首页横幅背景（亮色模式）
- **建议内容**：摩托车侧面或正面，明亮色调，清晰度高

### 2. 深色主题背景
- **文件名**：`bike-bg-dark.jpg`
- **用途**：首页横幅背景（深色模式）
- **建议内容**：与亮色主题同一车辆，暗色调或夜间场景

---

## 🎨 设计建议

### TabBar 图标设计规范
- **样式**：线性图标（stroke）风格，线宽 2-3px
- **未选中色值**：#8a8a8a（灰色）
- **选中色值**：#0052d9（TDesign 主题蓝）
- **对齐方式**：图标居中，留白充足

### 背景图设计规范
- **构图**：车辆占画面 60-70%，留白区域用于显示文字
- **色彩**：亮色主题建议蓝色/橙色暖色调，深色主题建议灰色/黑色冷色调
- **对比度**：确保白色文字在背景上清晰可见
- **压缩**：使用 TinyPNG 或 Squoosh 压缩至 <100KB

---

## 📝 替换步骤

### 1. 准备图标文件
1. 创建目录：`assets/tabbar/`
2. 将 8 张图标文件放入该目录
3. 确认文件名与上述清单一致

### 2. 准备背景图片
1. 将 2 张背景图放入 `assets/` 目录
2. 确认文件名为 `bike-bg.jpg` 和 `bike-bg-dark.jpg`

### 3. 更新代码（如需自定义路径）
如果更改了文件路径或名称，需更新以下文件：

**app.json**（TabBar 图标路径）：
```json
"tabBar": {
  "list": [
    {
      "iconPath": "assets/tabbar/home.png",
      "selectedIconPath": "assets/tabbar/home-active.png"
    }
  ]
}
```

**utils/mock-data.js**（背景图路径）：
```javascript
backgroundImage: '/assets/bike-bg.jpg',
backgroundImageDark: '/assets/bike-bg-dark.jpg'
```

---

## 🚀 临时占位方案

如果暂时没有图标，可以使用以下方案：

### 方案1：使用纯色占位（当前方案）
- TabBar 会显示纯色背景 + 文字
- 首页横幅使用纯色背景（`background-color: var(--td-primary-color-7)`）

### 方案2：使用在线图标生成工具
- [Iconfont](https://www.iconfont.cn/) - 阿里巴巴图标库
- [IconFont Generator](https://gauger.io/fonticon/) - 在线图标生成器
- 选择合适图标，下载为 PNG 格式

---

## ✅ 检查清单

上传资源后，请检查以下事项：

- [ ] TabBar 图标尺寸正确（81x81px）
- [ ] TabBar 图标格式为 PNG
- [ ] 背景图尺寸适配（750x720px）
- [ ] 背景图文件大小 <100KB
- [ ] 文件名与代码中的路径一致
- [ ] 在微信开发者工具中预览正常
- [ ] 深色模式切换测试通过

---

**生成时间**：2025-12-02
**更新人**：Claude Code AI
