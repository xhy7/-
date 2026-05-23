# 四人并行分工：桌宠化全站内容集成版

## Final Goal

最终 `/` 不再是传统导航首页，而是“苏轼桌宠带你使用整个网站”的主界面。

用户打开首页后，核心体验应该是：

- 苏轼 Q 版桌宠在主舞台中待机、说话、吟诗、开心、小憩。
- 用户优先通过桌宠打开人物档案、养成状态、玩法工坊和聊天，而不是先看到一组普通入口卡片。
- “古人资料”“养成状态”“玩法工坊”“和苏轼聊天”都可以先在桌宠旁边的内容面板中轻量使用。
- 原有完整页面仍保留：

```text
/ancestors
/growth
/playground
/chat/[ancestorId]
```

这些页面作为“展开完整页面”入口存在，不删除、不降级。

一句话：最终成果不是“首页放了一个桌宠组件”，而是“桌宠成为全站内容中枢”。

## Summary

- 继续采用“Developer 1 先冻结契约，然后四人并行”的方式。
- 本阶段目标是把网页内容都挂到桌宠上：桌宠舞台 + 内容面板 + 深层页面入口。
- 每个人仍只改自己负责目录，避免多人同时碰 `src/app`、`src/shared/contracts`、`homePageData`、`src/features/desktop-pet`。
- 最终由 Developer 1 负责 `/` 首页总装和集成收口。

## Developer 1：桌宠内容契约、Mock、首页总装

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

- 在 `DesktopPetConfig` 中新增桌宠内容面板契约。
- 建议新增最小概念：

```text
DesktopPetPanelId = "profile" | "growth" | "playground" | "chat"
DesktopPetPanelItem
DesktopPetQuickIntent
defaultPanelId
```

- 在 `homePageData.desktopPet` 中补齐苏轼桌宠面板 mock：
  - 人物档案面板：苏轼身份、时代、简介、完整页入口。
  - 养成状态面板：情绪、羁绊、性格向量摘要、完整页入口。
  - 玩法面板：吵架、拉架、吟诗、创作、现代命题入口。
  - 聊天面板：轻量对话入口和完整聊天页入口。
- 将 `/` 从“桌宠 + 下方入口卡片”改成“桌宠主舞台 + 内容面板区”。
- 保留传统入口，但降低权重，作为“展开完整页面”。
- 保证现有 `/ancestors`、`/growth`、`/playground`、`/chat/[ancestorId]` 仍可访问。
- 最终收口时跑：

```text
pnpm lint
pnpm typecheck
pnpm test
```

禁止修改：

```text
src/features/home-hero/
src/features/home-growth/
src/features/home-playground/
src/features/desktop-pet/
public/pets/
```

## Developer 2：桌宠内容面板 UI 与交互编排

负责目录：

```text
src/features/desktop-pet/
```

建议新增或调整结构：

```text
src/features/desktop-pet/
  pet-content-panel.tsx
  pet-profile-panel.tsx
  pet-growth-panel.tsx
  pet-playground-panel.tsx
  pet-chat-panel.tsx
  pet-panel-tabs.tsx
```

任务：

- 在 `DesktopPetHub` 内支持内容面板。
- 面板来源只消费 Developer 1 定义的 `DesktopPetConfig` props，不自行扩展共享契约。
- 入口菜单从纯跳转升级为：
  - 优先在桌宠内容面板中打开对应内容。
  - 面板内提供“展开完整页面”链接。
- 桌宠动作和面板联动：
  - 打开人物档案：`greet`
  - 打开养成状态：`happy`
  - 打开玩法工坊：`talk` 或 `poem`
  - 打开聊天面板：`talk`
- 保留现有点击、拖动、动作 Dock、台词气泡、入口菜单能力。
- 保持资产读取逻辑：优先使用 manifest 帧；缺帧时 fallback 到 preview 或姓氏占位。

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

## Developer 3：桌宠资产补强

负责目录：

```text
public/pets/
```

任务：

- 继续维护 `public/pets/su-shi`。
- 基于现有八态资产，补强适合“全站中枢”的视觉表现。
- 优先补充或规划这些动作语义：

```text
reading
thinking
writing
presenting
```

- 如果共享契约暂未扩展新状态，可以先在 `source-notes.md` 中记录映射建议：
  - reading -> idle
  - thinking -> talk
  - writing -> poem
  - presenting -> greet
- 保持资产规范：
  - 透明背景。
  - 尺寸统一。
  - 角色一致。
  - 无文字水印。
  - 无明显风格漂移。
- 新资产必须更新 `manifest.json` 或记录为待接入状态。

禁止修改：

```text
src/app/
src/shared/
src/mocks/
src/features/
```

## Developer 4：玩法与聊天能力桌宠化

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

- 保留现有 `/playground?ancestorId=su-shi&source=pet` 支持。
- 抽出最小可复用玩法入口能力，供桌宠玩法面板使用。
- 玩法面板应能表达：
  - 当前角色是苏轼。
  - 可选择吵架、拉架、吟诗、创作、现代命题。
  - 可以进入完整 `/playground` 页面继续深度操作。
- 保留现有 AI reply、interaction-memory、玩法生成流程。
- 不改首页，不改共享契约，不直接改桌宠 UI。

后续如果要把聊天也嵌进桌宠：

- 先由 Developer 1 协调新增 chat owner 范围。
- 不直接跨改 `src/app/chat/[ancestorId]/`，除非 AGENTS 明确更新。

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

### 第 0 步，仅 Developer 1

- 冻结桌宠内容面板最小契约。
- 更新 `homePageData.desktopPet` mock。
- 提交后通知其他人拉最新 `main`。

### 第 1 步，四人并行

- Developer 1：改 `/` 首页布局壳层，预留桌宠内容面板装配位置。
- Developer 2：实现 `DesktopPetHub` 内的面板切换、面板 UI、动作联动。
- Developer 3：补强苏轼桌宠资产和 manifest/source-notes。
- Developer 4：抽玩法入口能力，保证桌宠入口上下文可复用。

### 第 2 步，Developer 1 收口

- 将桌宠内容面板、苏轼资产、玩法入口统一接进 `/`。
- 保证传统完整页面仍可访问。
- 跑：

```text
pnpm lint
pnpm typecheck
pnpm test
```

## Acceptance Criteria

- 打开 `/` 后，第一主体验是桌宠舞台和桌宠内容面板。
- 用户可以通过桌宠面板查看：
  - 苏轼人物档案。
  - 苏轼养成状态。
  - 苏轼相关玩法入口。
  - 苏轼聊天入口。
- 用户仍可以从面板进入完整页面：

```text
/ancestors
/growth
/playground?ancestorId=su-shi&source=pet
/chat/su-shi?source=pet
```

- 桌宠动作会随面板切换变化。
- 桌宠资产仍来自 `public/pets/su-shi/manifest.json`。
- 全量检查通过：

```text
pnpm lint
pnpm typecheck
pnpm test
```

## Assumptions

- 共享契约只由 Developer 1 修改。
- 桌宠 UI 只由 Developer 2 修改。
- 资产只由 Developer 3 修改。
- 玩法入口只由 Developer 4 修改。
- 现阶段先以苏轼为样板角色，后续角色按同一协议追加。
- 如果某人需要跨目录改动，先同步 owner，不直接改。
