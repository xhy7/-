# 老祖宗养成计划协作总则

## 项目目标
- 本仓库当前只实现首页 MVP，路径固定为 `/`。
- 产品定位是“古人互动”游戏首页中枢，不扩展登录、二级页面、真实后端。
- 技术栈固定为 `Next.js App Router + React + TypeScript + pnpm`。

## 视觉基调
- 整体风格必须保持“新国风卷轴”，关键词是卷轴、墨色、朱印、描金、题签。
- 正文字体以 `Noto Serif SC` 为准，标题/题签以 `ZCOOL XiaoWei` 为准。
- 不允许引入与现有视觉冲突的通用后台风、卡片 SaaS 风或纯黑紫霓虹风。

## 目录 Ownership
- `src/app`、`src/shared`、`src/mocks` 由 Developer 1 维护。
- `src/features/home-hero` 由 Developer 2 维护。
- `src/features/home-growth` 由 Developer 3 维护。
- `src/features/home-playground` 由 Developer 4 维护。
- 非 owner 不修改他人目录；确需改动时先同步，再由 owner 合并。

## 契约冻结规则
- 首页唯一数据真源固定为 `src/shared/contracts/home.ts`。
- 网关接口固定为 `src/shared/contracts/gateway.ts`。
- 共享契约只允许 Developer 1 修改。其他开发者只能消费，不得自行扩充组件入参。
- 首页三个功能区对外 props 视为冻结接口，任何变更都要先统一。

## 分支规范
- 基线分支固定为 `main`。
- 四个协作分支固定为：
  - `codex/dev1-shell`
  - `codex/dev2-hero`
  - `codex/dev3-growth`
  - `codex/dev4-playground`
- Developer 1 先提交骨架与契约，其他人再从最新 `main` 分支切出各自分支。

## 合并规则
- 合并前必须通过 `pnpm lint`、`pnpm typecheck`、`pnpm test`。
- 合并时优先保留共享契约和视觉 token 的稳定性，不以“先能跑”为理由破坏边界。
- 遇到样式冲突时，优先回收局部样式，不直接改写全局主题变量。

## 安全约束
- 永远不许使用 `rm -rf` 删除文件。
- 禁止破坏性 Git 命令，例如 `git reset --hard`、`git checkout --`。
- 任何 mock 数据删除前都要确认没有被首页模块引用。

