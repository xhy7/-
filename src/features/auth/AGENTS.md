# 认证模块协作说明

## 负责范围
- 独占维护 `src/features/auth`。
- 负责登录、注册、用户会话管理相关组件。
- 提供认证网关实现（Mock + 真实 API 适配）。

## 接口边界
- 只能消费 `src/shared/contracts/home` 中定义的认证类型。
- 不修改共享契约，只使用 `AuthGateway`、`AuthCredentials` 等接口。
- 用户状态通过 `HomePageDataWithAuth` 传递给首页。

## 设计要求
- 保持"新国风卷轴"视觉基调，使用朱印、描金、墨色元素。
- 文案古风化：名讳、密语、展开卷轴等。
- 输入框、按钮动效细腻，体现卷轴展开感。
- 移动端单列可读，不依赖复杂 hover 效果。

## 依赖关系
- UI 原子组件：`src/shared/ui/primitives.tsx`
- 全局样式：`src/app/globals.css`
- 类型定义：`src/shared/contracts/home.ts`

## 测试要求
- 表单验证逻辑需要单元测试覆盖。
- Mock 网关需要测试各种错误场景。
- 组件需要测试用户交互流程。

## 扩展说明
- 后续可扩展找回密码、第三方登录等功能。
- 邀请码系统预留扩展接口。
