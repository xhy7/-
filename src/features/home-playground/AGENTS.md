# Developer 4 协作说明

## 负责范围
- 独占维护 `src/features/home-playground`。
- 负责玩法入口卡组、创作预览流、内容传播展示模块。

## 接口边界
- 只能消费 `HomePlaygroundSectionProps`。
- 玩法触发通过 `onRequestMode` 向上抛出，创作预览通过 `onPreviewCreation` 向上抛出。
- 不实现二级页面，不偷偷加路由跳转。

## 设计要求
- 四个玩法入口要一眼可区分，并体现“可点但仍是 future intent”。
- 创作预览必须给人传播感和戏剧性，而不是普通资讯列表。
- 页面底部仍然要和卷轴主视觉一致，不能突然变成另一套 UI。
