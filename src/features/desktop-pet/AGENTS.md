# Developer 2 · 桌宠 UI（desktop-pet）

## 负责范围

- 独占维护 `src/features/desktop-pet/`。
- 实现桌宠主组件 `DesktopPetHub` 及舞台、精灵、台词、动作 Dock、入口菜单。

## 接口边界

- 仅消费 `DesktopPetHubProps { config: DesktopPetConfig }`。
- 不修改 `src/shared/contracts`、`src/mocks`、`src/app`、`public/pets/`。

## 组件结构

```text
desktop-pet-hub.tsx      # 编排入口
pet-stage.tsx            # 可拖舞台 + 气泡定位
pet-sprite.tsx           # 帧动画 / 占位降级
pet-speech-bubble.tsx    # 台词卷轴气泡
pet-action-dock.tsx      # 轻互动动作
pet-entrance-menu.tsx    # 四条既有网页入口
use-pet-controller.ts    # 状态机与定时器
pet-utils.ts             # 帧集 / 台词 / 拖放工具
```

## 交互约定

- 八态：`idle` `greet` `talk` `poem` `dragging` `happy` `annoyed` `sleep`。
- 入口菜单使用契约 `entranceItems.href`，玩法页带 `source=pet` 由 Dev4 承接。
- 资产未就绪时：`previewImageSrc` → 姓名字形占位。

## 禁止

- 内嵌 AI 对话、新路由、改共享契约。
- 跨目录改动请先同步对应 owner。
