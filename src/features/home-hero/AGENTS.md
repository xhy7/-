# Developer 2 协作说明

## 负责范围
- 独占维护 `src/features/home-hero`。
- 负责首屏英雄区、祖宗轮播/切换、语录区、人物信息抽屉壳。

## 接口边界
- 只能消费 `HomeHeroSectionProps`。
- 交互事件通过 `onSelectAncestor`、`onOpenAncestorDetail` 向上抛出。
- 不直接请求真实后端，不新增共享合同字段。

## 设计要求
- 第一眼必须能看出“当前主推祖宗”和“可以切换其他祖宗”。
- 语录、题签、标签、印章感是这个模块的重点。
- 保持移动端单列可读，不要做复杂 hover 依赖。

