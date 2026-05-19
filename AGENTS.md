# 四人并行分工：目录与任务边界清晰版

## Summary
- 采用“Developer 1 先冻结最小契约，然后四人并行”的方式。
- 每个人只改自己负责目录，避免多人同时碰 `src/app`、`src/shared/contracts`、`homePageData`。
- 最终由 Developer 1 负责首页装配和集成收口。

## Developer 1：契约、Mock、首页装配

负责目录：

```text
src/app/
src/shared/contracts/
src/mocks/
```

可以修改的具体文件范围：

```text
src/shared/contracts/home.ts
src/shared/contracts/gateway.ts
src/mocks/home-data.ts
src/mocks/home-gateway.ts
src/app/page.tsx
src/app/home-page-client.tsx
src/app/page-shell.module.css
src/app/page.test.tsx
src/app/route-pages.test.tsx
```

任务：

- 先提交最小桌宠契约，供其他人并行开发。
- 在 `HomePageData` 中新增桌宠配置字段。
- 在 `homePageData` 中加入苏轼桌宠 mock 数据。
- 将 `/` 改造成桌宠中枢页面，接入 Developer 2 的 `DesktopPetHub`。
- 负责最终集成 Developer 2 组件、Developer 3 资产、Developer 4 入口参数。
- 保证现有 `/ancestors`、`/growth`、`/playground`、`/chat/[ancestorId]` 仍可访问。

禁止修改：

```text
src/features/home-hero/
src/features/home-growth/
src/features/home-playground/
public/pets/
```

## Developer 2：桌宠 UI 与轻互动组件

负责目录：

```text
src/features/desktop-pet/
```

需要新增的建议结构：

```text
src/features/desktop-pet/
  AGENTS.md
  index.ts
  desktop-pet-hub.tsx
  desktop-pet-hub.module.css
  pet-stage.tsx
  pet-sprite.tsx
  pet-speech-bubble.tsx
  pet-action-dock.tsx
  pet-entrance-menu.tsx
  desktop-pet-hub.test.tsx
```

任务：

- 实现桌宠主组件 `DesktopPetHub`。
- 实现桌宠舞台、动作按钮、台词气泡、入口菜单。
- 支持状态：`idle`、`greet`、`talk`、`poem`、`dragging`、`happy`、`annoyed`、`sleep`。
- 支持点击、拖动、切换动作、显示台词。
- 只消费 Developer 1 定义好的 props，不自行扩展共享契约。
- 资产路径先按 manifest 读取；没有真实动作帧时显示占位图或第一帧。

禁止修改：

```text
src/app/
src/shared/
src/mocks/
src/features/home-hero/
src/features/home-growth/
src/features/home-playground/
public/pets/
```

## Developer 3：Q 版角色资产与动作帧

负责目录：

```text
public/pets/
```

需要新增的建议结构：

```text
public/pets/
  su-shi/
    manifest.json
    idle/
    greet/
    talk/
    poem/
    dragging/
    happy/
    annoyed/
    sleep/
    preview.png
    source-notes.md
```

任务：

- 根据用户提供的 image2 Q 版苏轼图，制作苏轼第一套桌宠动作帧。
- 建立资产命名规范，例如：

```text
public/pets/su-shi/idle/idle-01.png
public/pets/su-shi/idle/idle-02.png
public/pets/su-shi/talk/talk-01.png
public/pets/su-shi/poem/poem-01.png
```

- 编写 `manifest.json`，映射每个状态对应哪些帧、帧率、是否循环。
- 做资产 QA：透明背景、尺寸统一、角色一致、没有文字水印、没有明显风格漂移。
- 先完成苏轼样板，后续角色按同一规范追加。

禁止修改：

```text
src/app/
src/shared/
src/mocks/
src/features/
```

## Developer 4：玩法页与桌宠入口衔接

负责目录：

```text
src/app/playground/
src/features/home-playground/
```

可以修改的具体文件范围：

```text
src/app/playground/page.tsx
src/app/playground/playground-page-client.tsx
src/app/playground/playground-page-client.test.tsx
src/features/home-playground/
```

任务：

- 让 `/playground` 支持桌宠入口参数，例如：

```text
/playground?ancestorId=su-shi&source=pet
/playground?ancestorId=su-shi&source=pet&mode=cross-time-quarrel
```

- 进入玩法页后默认选中桌宠当前角色。
- 保留现有吵架、拉架、吟诗、创作、现代命题逻辑。
- 增加“来自桌宠入口”的上下文展示，但不改首页。
- 确认现有 AI reply、interaction-memory、玩法生成流程不被破坏。

禁止修改：

```text
src/shared/contracts/
src/mocks/home-data.ts
src/app/page.tsx
src/app/home-page-client.tsx
src/features/desktop-pet/
public/pets/
```

## Parallel Order

- 第 0 步，仅 Developer 1：
  - 冻结最小桌宠契约和 mock 占位数据。
  - 提交后通知其他人拉最新 `main`。

- 第 1 步，四人并行：
  - Developer 1：做首页装配壳层。
  - Developer 2：做 `src/features/desktop-pet`。
  - Developer 3：做 `public/pets/su-shi`。
  - Developer 4：做 `/playground` 参数衔接。

- 第 2 步，Developer 1 收口：
  - 将桌宠组件、苏轼资产、玩法入口统一接进 `/`。
  - 跑 `pnpm lint`、`pnpm typecheck`、`pnpm test`。

## Assumptions
- 共享契约只由 Developer 1 修改。
- 桌宠 UI 只由 Developer 2 修改。
- 资产只由 Developer 3 修改。
- 玩法入口只由 Developer 4 修改。
- 如果某人需要跨目录改动，先同步 owner，不直接改。
