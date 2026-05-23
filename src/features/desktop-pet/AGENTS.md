# Developer 2 · 桌宠 UI（desktop-pet）

## 负责范围

- 独占维护 `src/features/desktop-pet/`。
- 实现桌宠主组件 `DesktopPetHub`、舞台、精灵、台词、动作 Dock、入口菜单与 **内容面板**。

## 接口边界

- 仅消费 `DesktopPetHubProps { config: DesktopPetConfig }`。
- 面板数据来自 `config.panelItems`、`config.quickIntents`、`config.defaultPanelId`。
- 不修改 `src/shared/contracts`、`src/mocks`、`src/app`、`public/pets/`。

## 组件结构

```text
desktop-pet-hub.tsx           # 编排入口（舞台 + 面板双栏）
pet-stage.tsx                 # 可拖舞台 + 气泡定位
pet-sprite.tsx                # 帧动画 / 占位降级
pet-speech-bubble.tsx         # 台词卷轴气泡（支持面板语境）
pet-action-dock.tsx           # 轻互动动作
pet-entrance-menu.tsx         # 轻量入口 pill（面板优先）
pet-panel-tabs.tsx            # 四面板 Tab
pet-content-panel.tsx         # 面板容器（metrics / actions / CTA）
pet-profile-panel.tsx         # profile 别名导出
pet-growth-panel.tsx          # growth 别名导出
pet-playground-panel.tsx      # playground 别名导出
pet-chat-panel.tsx            # chat 别名导出
pet-quick-intents.tsx         # 快捷意图 chips
pet-content-panel.module.css  # 面板 / Tab / 入口 pill 样式
use-pet-controller.ts         # 状态机、面板状态与定时器
pet-utils.ts                  # 帧集 / 台词 / 面板映射工具
```

## 交互约定

- 八态：`idle` `greet` `talk` `poem` `dragging` `happy` `annoyed` `sleep`。
- 入口菜单 **面板优先**：点击 pill 打开对应面板；完整页跳转在面板 primary CTA / actions 内。
- 面板动作联动：profile→greet，growth→happy，playground/chat→talk（或契约 `panelItem.actionState`）。
- 玩法 / 聊天深度能力通过 `href` 跳转，不在 Hub 内嵌业务逻辑。
- 资产未就绪时：`previewImageSrc` → 姓名字形占位。

## 禁止

- 内嵌 AI 对话、新路由、改共享契约。
- 跨目录改动请先同步对应 owner。
