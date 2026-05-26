# 苏轼 (su-shi) 桌宠资产说明

## 角色 ID
`su-shi`

## 参考来源
- 历史人物：苏轼（东坡居士），PersonID: 7337
- Q 版设计基于项目提供的 image2 Q 版苏轼参考图

## 资产规范

### 通用要求
- **格式**：PNG，透明背景
- **尺寸**：128 x 128 px（统一）
- **命名**：`{state}/{state}-{序号}.png`，序号两位补零（01, 02, ...）
- **风格**：Q 版 chibi 风格，大头小身，圆线条
- **禁止**：文字水印、风格漂移、非透明背景

### 状态说明

| 状态 | 目录 | 帧数 | 循环 | 描述 |
|------|------|------|------|------|
| idle | `idle/` | 6 | 是 | 待机呼吸，轻微上下浮动 |
| greet | `greet/` | 6 | 否 | 挥手打招呼，播完切回 idle |
| talk | `talk/` | 6 | 是 | 嘴巴张合，说话中 |
| poem | `poem/` | 6 | 否 | 仰头吟诗，播完切回 idle |
| dragging | `dragging/` | 6 | 是 | 被拖拽时惊慌表情 |
| happy | `happy/` | 6 | 否 | 开心蹦跳，播完切回 idle |
| annoyed | `annoyed/` | 6 | 否 | 撇嘴/翻白眼，播完切回 idle |
| sleep | `sleep/` | 6 | 是 | 闭眼打呼噜 |

### 苏轼角色特征要点
- 头戴乌纱帽或东坡巾（标志性帽子）
- 圆脸微胖，短须
- 服饰：宋代文人长袍，建议青/白色调
- 表情丰富，符合"豪放旷达"性格
- 可选道具：酒杯、毛笔、东坡肉（happy 状态）

## 文件清单

```
public/pets/su-shi/
├── manifest.json          # 状态与帧映射
├── preview.png            # 角色预览图（静态）
├── source-notes.md        # 本文件
├── idle/
│   ├── idle-01.png ~ idle-06.png
├── greet/
│   ├── greet-01.png ~ greet-06.png
├── talk/
│   ├── talk-01.png ~ talk-06.png
├── poem/
│   ├── poem-01.png ~ poem-06.png
├── dragging/
│   ├── dragging-01.png ~ dragging-06.png
├── happy/
│   ├── happy-01.png ~ happy-06.png
├── annoyed/
│   ├── annoyed-01.png ~ annoyed-06.png
└── sleep/
    ├── sleep-01.png ~ sleep-06.png
```

## QA 检查清单
- [ ] 所有帧为 128x128 PNG 透明背景
- [ ] 角色外观一致，无风格漂移
- [ ] 无文字水印
- [ ] anchor 点对齐脚底
- [ ] manifest.json 中路径与实际文件一一对应
- [ ] preview.png 已生成

## 后续角色扩展
新增角色时复制此目录结构，修改 manifest.json 中的 id/name，遵循相同命名规范。
