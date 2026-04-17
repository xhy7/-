# Developer 3 协作说明

## 负责范围
- 独占维护 `src/features/home-growth`。
- 负责养成仪表盘、心情面板、性格向量、命运节点预告。

## 接口边界
- 只能消费 `HomeGrowthSectionProps`。
- 对外动作只通过 `onOpenFatePreview` 回传。
- 不修改共享 UI 的基础 token，优先用现有组件和全局变量。

## 设计要求
- 用户必须能快速读懂 `MoodIndex`、`Trait Vector`、历史忠诚度、活跃标签。
- 命运节点必须有“将要发生什么”的紧张感，但不能做成独立页面。
- 数据密度可以高，但层次要清晰。

