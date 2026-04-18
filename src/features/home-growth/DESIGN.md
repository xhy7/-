# Home-Growth 养成中枢模块 — 完整设计文档

> 本文档面向 Developer 3，覆盖前端界面设计、交互设计、功能逻辑、UI 风格、后端技术配置与前后端连接。基于现有实现与项目真实需求，确保视觉惊艳、交互流畅、逻辑闭环。

---

## 一、模块定位与职责边界

### 1.1 产品定位
Home-Growth 是首页三大功能区之一，承担"养成仪表盘"角色。它将设计文档中 **模块二（数字灵魂与性格引擎）** 的核心概念可视化，让玩家在首页就能一眼读懂当前养成状态。

### 1.2 对应设计文档模块
| 简要设计模块 | home-growth 负责部分 | 其他模块负责部分 |
|---|---|---|
| 模块一：数据底座 | 消费 CBDB 导出的静态数据（通过 mock/gateway） | 数据构建由后端/数据层完成 |
| 模块二：性格引擎 | **全部前端展示与交互**：MoodIndex、Trait Vector、历史忠诚度、活跃标签、命运节点 | 性格算法由后端计算 |
| 模块三：交互玩法 | 命运节点预告 → 通过 `onOpenFatePreview` 触发控制台展示 | 实际玩法由 home-playground 负责 |
| 模块四：内容创作 | 不直接涉及 | 由 home-playground 负责 |

### 1.3 接口边界（冻结契约）
- **输入**：仅消费 `HomeGrowthSectionProps`（定义于 `home-growth-section.tsx`）
  ```typescript
  interface HomeGrowthSectionProps {
    nurtureSummary: NurtureSummary;
    fatePreviews: FatePreview[];
    onOpenFatePreview?: (fateId: string) => void | Promise<void>;
  }
  ```
- **输出**：仅通过 `onOpenFatePreview(fateId)` 回传
- **禁止**：自行扩充 props、修改共享 UI token、引入新路由

---

## 二、数据模型详解

### 2.1 NurtureSummary（养成摘要）

```typescript
interface NurtureSummary {
  cultivationStage: string;        // 培养阶段文案，如 "知己未满 · 默契升温中"
  leafBalance: number;             // 金叶子余额
  historicalFidelity: number;      // 历史忠诚度 0-100
  activeTags: string[];            // 活跃标签列表
  traitVector: TraitMetric[];      // 性格向量数组
  moodSnapshot: MoodSnapshot;      // 心情快照
  nextBondMilestone: string;       // 下一羁绊里程碑文案
}
```

### 2.2 MoodSnapshot（心情快照）

```typescript
interface MoodSnapshot {
  label: string;    // 固定为 "MoodIndex"
  value: number;    // 当前心情值 0-100
  delta: number;    // 较上次变化值（正/负）
  statusLabel: string;  // 状态标签（如 "微醺灵感"、"谈兴正盛"）
  summary: string;  // 一句话总结当前心情状态
  cause: string;    // 触发原因（如 "投喂东坡肉 + 减轻乌台诗案压力"）
}
```

### 2.3 TraitMetric（性格向量指标）

```typescript
interface TraitMetric {
  id: string;          // 唯一标识，如 "humor"、"fidelity"、"rebellion"、"empathy"
  label: string;       // 展示名，如 "幽默感"、"历史忠诚度"、"OOC 偏移"、"共情力"
  value: number;       // 当前值 0-100
  max: number;         // 最大值，固定 100
  note: string;        // 一句话解读
  tone: "ink" | "vermilion" | "gold";  // 视觉色调
}
```

### 2.4 FatePreview（命运节点预告）

```typescript
interface FatePreview {
  id: string;           // 唯一标识，如 "wutai-poem-case"
  title: string;        // 节点标题，如 "乌台诗案"
  era: string;          // 时代标签，如 "北宋 · 关键节点"
  statusLabel: string;  // 状态标签，如 "高张力待触发"
  tension: number;      // 张力值 0-100
  description: string;  // 节点描述
  triggerHint: string;  // 触发提示
  rewardLabel: string;  // 奖励标签
}
```

---

## 三、界面设计

### 3.1 整体布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  Section Shell（卷轴容器）                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  SectionHeading: "养成中枢"                              │  │
│  │  "把 MoodIndex、Trait Vector、历史忠诚度和活跃标签集中…" │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────┬──────────────────────────┐ │
│  │  Metrics Card（心情面板）    │  Trait Card（性格向量）   │ │
│  │  ┌───────────────────────┐  │  ┌────────────────────┐  │ │
│  │  │ MoodIndex: 78         │  │  │ 幽默感    ████████░ │  │ │
│  │  │ [微醺灵感]  [+12]     │  │  │ 历史忠诚度 ███████░░ │  │ │
│  │  │ "今日谈兴正盛…"        │  │  │ OOC 偏移  ██████░░░ │  │ │
│  │  │ 触发原因: …            │  │  │ OOC 偏移  ██████░░░ │  │ │
│  │  ├───────────────────────┤  │  │ 共情力    ███████░░░ │  │ │
│  │  │ 培养阶段 │ 金叶子 │ 忠诚度│  │  └────────────────────┘  │ │
│  │  ├───────────────────────┤  │                              │ │
│  │  │ [标签1] [标签2] [标签3] │  │                              │ │
│  │  │ 下一羁绊里程碑…         │  │                              │ │
│  │  └───────────────────────┘  │                              │ │
│  └─────────────────────────────┴──────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Fate Section（命运节点预告）                           │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐        │  │
│  │  │ 乌台诗案    │ │ 鸿门宴复盘  │ │ 夜雨归舟    │        │  │
│  │  │ 张力: 84%   │ │ 张力: 67%   │ │ 张力: 53%   │        │  │
│  │  │ ████████░░  │ │ ███████░░░  │ │ █████░░░░░  │        │  │
│  │  │ [聚焦节点]  │ │ [聚焦节点]  │ │ [聚焦节点]  │        │  │
│  │  └────────────┘ └────────────┘ └────────────┘        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 三区域详细说明

#### 区域 A：心情面板（Metrics Card）

**视觉层次**（从上到下）：

1. **MoodIndex 主数值区**
   - 左侧：红色 eyebrow "MoodIndex" + 超大数值（78）+ 状态标签（如"微醺灵感"）
   - 右侧：朱印色 TagPill 显示 delta（+12 / -5）
   - 数值使用 `var(--font-display)` 字体，`clamp(2.4rem, 4vw, 3.5rem)`

2. **心情摘要区**
   - 正文：`summary` 文案（"今日谈兴正盛，适合触发需要机锋与反转的玩法。"）
   - 灰色 note：`cause` 文案（"触发原因：投喂东坡肉 + 减轻乌台诗案压力"）

3. **三栏摘要网格**
   - 培养阶段 | 金叶子余额 | 历史忠诚度
   - 每栏为半透明白底圆角卡片（`rgba(255,255,255,0.45)`）
   - 上方小字标签，下方加粗数值

4. **活跃标签行**
   - 水平排列的 TagPill 胶囊，支持换行
   - 标签示例：`[嘴硬心软] [乌台余震] [微醺灵感] [适合互评]`

5. **下一羁绊里程碑**
   - 灰色 note 文案，如 "再获得 22 枚金叶子，可解锁'私房手札'语气层。"

#### 区域 B：性格向量面板（Trait Card）

**视觉层次**：

1. **Header**
   - 左侧：红色 eyebrow "Trait Vector" + 标题 "性格向量"
   - 右侧：（留白，无额外元素）

2. **向量列表**
   - 每个 TraitMetric 使用 `ProgressMeter` 组件渲染
   - 包含：标签名 + 数值 + 进度条 + 解读 note
   - 四种 tone 对应不同渐变色：
     - `ink`：墨色渐变 `#5d4535 → #2f241d`
     - `vermilion`：朱红渐变 `#c24c3f → #9b2d24`
     - `gold`：描金渐变 `#d0ab5d → #a67c2d`

#### 区域 C：命运节点预告（Fate Section）

**视觉层次**：

1. **Header**
   - 左侧：红色 eyebrow "Fate Queue" + 标题 "命运节点预告"
   - 右侧：灰色 TagPill "Future Hook Only"

2. **节点卡片列表**（3 列网格）
   - 每张卡片包含：
     - 时代标签（eyebrow）+ 节点标题
     - 状态 TagPill（朱印色）
     - 描述文案
     - 张力值文字 + 进度条（墨→金渐变 `#e0b766 → #9b2d24`）
     - 触发提示（灰色 note）
     - 奖励标签（朱红色高亮）
     - "聚焦节点" 幽灵按钮

### 3.3 响应式断点

| 断点 | 行为 |
|---|---|
| `> 1080px` | 顶部双列布局，命运节点 3 列 |
| `641px - 1080px` | 顶部单列堆叠，命运节点单列 |
| `≤ 640px` | 三栏摘要网格变为单列，header flex 方向改为 column |

---

## 四、交互设计

### 4.1 交互事件流

```
用户点击 "聚焦节点" 按钮
    │
    ▼
onOpenFatePreview(fate.id) 被调用
    │
    ▼
home-page-client.tsx 中的 growthProps.onOpenFatePreview 处理
    │
    ├── setAncestorPreview(null)      ← 清空人物卷预览
    ├── setModePreview(null)           ← 清空模式预览
    └── setActivityNote(...)           ← 在右侧控制台显示命运节点信息
```

### 4.2 按钮交互状态

| 状态 | 样式 | 说明 |
|---|---|---|
| 默认 | 幽灵按钮（半透明背景 + 墨色文字） | `ink-button--ghost` |
| Hover | 上移 2px + 阴影 | 继承全局 `ink-button:hover` |
| Active | 按下态 | 浏览器默认 |
| Disabled | 透明度 0.7 + wait 光标 | 继承全局 `ink-button:disabled` |

### 4.3 进度条动效（建议增强）

当前进度条为静态填充。建议增加以下 CSS 动效（不破坏现有契约）：

```css
/* 页面加载时进度条从 0 动画到目标值 */
@keyframes meter-fill {
  from { width: 0; }
}

.meter__fill,
.tensionFill {
  animation: meter-fill 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* 心情数值入场动画 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.metricsValue {
  animation: fade-in-up 0.6s ease-out;
}
```

### 4.4 卡片 Hover 效果（建议增强）

```css
/* 命运节点卡片 Hover 微浮起 */
.fateCard {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.fateCard:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(88, 58, 36, 0.12);
}
```

### 4.5 控制台联动

点击命运节点后，右侧控制台展示格式：

```
命运节点「乌台诗案」已聚焦。触发提示：需要 MoodIndex ≥ 75，且本周至少一次正向投喂。
```

---

## 五、UI 风格规范

### 5.1 色彩体系（继承全局 Token）

| Token | 色值 | 用途 |
|---|---|---|
| `--paper-base` | `#f6eddc` | 页面底色 |
| `--paper-soft` | `#fbf5ea` | 卡片浅底 |
| `--paper-deep` | `#ecdfc8` | 深色区域 |
| `--ink-strong` | `#2f241d` | 主文字色 |
| `--ink-soft` | `#645247` | 次要文字色 |
| `--seal-red` | `#9b2d24` | 朱印色（标签、eyebrow） |
| `--seal-red-soft` | `#c24c3f` | 朱印浅色 |
| `--gold` | `#b08a40` | 描金色 |
| `--border-soft` | `rgba(88, 58, 36, 0.16)` | 边框色 |
| `--shadow-soft` | `0 20px 48px rgba(77, 50, 30, 0.14)` | 阴影 |

### 5.2 字体体系

| 用途 | 字体 | 字号 |
|---|---|---|
| 标题/题签 | `var(--font-display)` = "ZCOOL XiaoWei" | `clamp(1.8rem, 3vw, 2.7rem)` |
| 大数值 | `var(--font-display)` | `clamp(2.4rem, 4vw, 3.5rem)` |
| 正文 | `var(--font-serif)` = "Noto Serif SC" | 1rem（16px 基准） |
| 标签/eyebrow | `var(--font-serif)` | 0.85rem，`letter-spacing: 0.24em` |
| 注释 | `var(--font-serif)` | 0.92rem |

### 5.3 组件样式约定

| 组件 | 类名 | 视觉特征 |
|---|---|---|
| 卷轴容器 | `section-shell` | 圆角 28px、半透明渐变底、backdrop-filter |
| 纸卡 | `paper-card` | 圆角 22px、半透明白底、1px 边框 |
| 浅色纸卡 | `paper-card--muted` | 更浅的半透明底 |
| 标签胶囊 | `tag-pill` | 圆角 999px、内边距 8px 12px |
| 朱印标签 | `tag-pill--seal` | 朱红渐变底 + 白字 |
| 墨色标签 | `tag-pill--ink` | 墨色半透明底 |
| 灰色标签 | `tag-pill--muted` | 白色半透明底 |
| 主按钮 | `ink-button` | 朱红渐变底 + 白字 + 圆角 999px |
| 幽灵按钮 | `ink-button--ghost` | 半透明底 + 墨色字 |
| 进度条 | `meter` | 10px 高圆角轨道 + 渐变色填充 |

### 5.4 装饰元素（建议增强）

为提升"新国风卷轴"质感，可在模块局部 CSS 中添加：

```css
/* 卷轴纹理叠加 */
.root::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: url("data:image/svg+xml,...") repeat;
  opacity: 0.03;
  mix-blend-mode: multiply;
}

/* 朱印装饰角标 */
.metricsCard::before {
  content: "养";
  position: absolute;
  top: 12px;
  right: 16px;
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--seal-red);
  opacity: 0.15;
  transform: rotate(-12deg);
}
```

---

## 六、功能逻辑

### 6.1 MoodIndex 计算逻辑（前端展示侧）

```
MoodIndex 由后端/数据层计算，前端仅负责展示。
展示逻辑：
  1. value ∈ [0, 100]
  2. delta = value - previousValue（正数显示 "+N"，负数显示 "-N"）
  3. 根据 value 区间映射 statusLabel：
     - [0, 30)   → "闭门谢客"
     - [30, 50)  → "情绪低落"
     - [50, 70)  → "平心静气"
     - [70, 85)  → "谈兴正盛"
     - [85, 100] → "豪情万丈"
  4. 根据 delta 正负决定 TagPill 颜色：
     - delta ≥ 0 → seal tone（朱红，正向）
     - delta < 0 → muted tone（灰色，负向）
```

### 6.2 Trait Vector 展示逻辑

```
每个 TraitMetric 独立渲染为 ProgressMeter：
  1. percentage = (value / max) * 100
  2. 限制 percentage ∈ [0, 100]
  3. tone 映射渐变色：
     - ink → 墨色渐变（稳重属性）
     - vermilion → 朱红渐变（偏移/危险属性）
     - gold → 描金渐变（正面/增益属性）
  4. note 文案在进度条下方以 muted-note 样式展示
```

### 6.3 历史忠诚度展示逻辑

```
historicalFidelity ∈ [0, 100]
  - 在 summaryGrid 中以数值直接展示
  - 同时在 traitVector 中作为 "历史忠诚度" TraitMetric 出现
  - 高忠诚度（≥ 80）→ 角色行为更贴近史实
  - 低忠诚度（< 50）→ 角色可能出现 OOC 行为
```

### 6.4 命运节点张力排序逻辑

```
fatePreviews 数组按 tension 降序排列：
  1. tension ≥ 80 → "高张力待触发"（朱印标签）
  2. 50 ≤ tension < 80 → "可插队围观" / "蓄势中"
  3. tension < 50 → "低烈度蓄势"

前端展示顺序 = 后端返回顺序（建议后端按 tension 降序返回）
```

### 6.5 聚焦节点交互逻辑

```
onOpenFatePreview(fateId) 触发后：
  1. 在 fatePreviews 中查找对应 fate 对象
  2. 如果找到：
     - 清空右侧控制台的其他预览（ancestorPreview、modePreview）
     - 设置 activityNote 为格式化文案：
       `命运节点「${fate.title}」已聚焦。触发提示：${fate.triggerHint}`
  3. 如果未找到：
     - 静默处理（不报错，不展示）
```

### 6.6 空状态规范

| 数据源 | 空值条件 | 降级展示 |
|---|---|---|
| `fatePreviews` | `length === 0` | 显示占位文案："暂无命运节点，继续培养以解锁更多可能。" |
| `traitVector` | `length === 0` | 隐藏 Trait Card 区域，不渲染空面板 |
| `activeTags` | `length === 0` | 隐藏标签行，不渲染空容器 |
| `moodSnapshot.summary` | 空字符串 | 隐藏摘要区，仅保留数值和 delta |
| `moodSnapshot.cause` | 空字符串 | 隐藏触发原因行 |

### 6.7 无障碍降级策略

| 场景 | 策略 |
|---|---|
| `prefers-reduced-motion: reduce` | 禁用所有 CSS `animation` 和 `transition`，进度条直接填充到目标值 |
| 键盘导航 | 所有 "聚焦节点" 按钮可通过 Tab 键访问，Enter/Space 触发回调 |
| 屏幕阅读器 | 进度条使用 `role="meter"` + `aria-valuenow` + `aria-label`，标签按 DOM 顺序朗读 |
| 颜色对比度 | 所有文字与背景对比度 ≥ 4.5:1（WCAG AA 级） |

### 6.8 错误边界与 Fallback 策略

| 错误场景 | Fallback 行为 |
|---|---|
| `nurtureSummary` 为 `undefined` | 渲染空占位，不抛出异常 |
| `moodSnapshot.value` 超出 [0, 100] | 使用 `Math.max(0, Math.min(100, value))` 钳制 |
| `traitVector` 中某项 `value` 缺失 | 该项进度条显示 0%，note 显示 "数据待补充" |
| `fatePreviews` 中某项 `tension` 缺失 | 张力值默认 0%，状态标签显示 "蓄势中" |
| 网关请求失败 | 由上层 `HomePageClient` 处理，本模块不自行捕获 |

---

## 七、后端技术设计

### 7.1 架构说明

本项目为 **MVP 阶段**，采用 **Mock-First** 架构：

```
┌──────────────────────────────────────────────────────┐
│  Next.js App Router (前端)                            │
│  ┌────────────────────────────────────────────────┐  │
│  │  HomePageClient (Client Component)              │  │
│  │  └── HomeGrowthSection                         │  │
│  └────────────────────────────────────────────────┘  │
│                        │                              │
│                        ▼                              │
│  ┌────────────────────────────────────────────────┐  │
│  │  mocks/home-gateway.ts (模拟网关)               │  │
│  │  └── getHomePageData() → Promise<HomePageData> │  │
│  └────────────────────────────────────────────────┘  │
│                        │                              │
│                        ▼                              │
│  ┌────────────────────────────────────────────────┐  │
│  │  mocks/home-data.ts (静态 Mock 数据)            │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 7.2 网关接口定义

```typescript
// src/shared/contracts/gateway.ts
interface HomePageGateway {
  getHomePageData(): Promise<HomePageData>;
  getAncestorDetailPreview(ancestorId: string): Promise<AncestorDetailPreview>;
  prepareModeIntent(modeId: string): Promise<ModeIntentPreview>;
}
```

### 7.3 Mock 网关实现

```typescript
// src/mocks/home-gateway.ts
import { homePageData, ancestorDetailPreviews, modeIntentPreviews } from "./home-data";

export const getHomePageData = async () => {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300));
  return homePageData;
};

export const getAncestorDetailPreview = async (ancestorId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const preview = ancestorDetailPreviews[ancestorId];
  if (!preview) throw new Error(`Ancestor "${ancestorId}" not found`);
  return preview;
};

export const prepareModeIntent = async (modeId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const preview = modeIntentPreviews[modeId];
  if (!preview) throw new Error(`Mode "${modeId}" not found`);
  return preview;
};
```

### 7.4 数据流路径

```
src/app/page.tsx (Server Component)
    │
    ├── import { getHomePageData } from "@/mocks/home-gateway"
    ├── const data = await getHomePageData()
    │
    └── <HomePageClient data={data} />
            │
            ├── <HomeGrowthSection
            │     nurtureSummary={data.nurtureSummary}
            │     fatePreviews={data.fatePreviews}
            │     onOpenFatePreview={...}
            │   />
            │
            └── 右侧控制台（显示 onOpenFatePreview 结果）
```

### 7.5 未来后端接入方案（预留设计）

当需要接入真实后端时，只需替换 `mocks/home-gateway.ts`：

```typescript
// 未来真实网关实现示例
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export const getHomePageData = async () => {
  const res = await fetch(`${API_BASE}/api/home`, {
    next: { revalidate: 60 },  // ISR 60 秒缓存
  });
  if (!res.ok) throw new Error("Failed to fetch home page data");
  return res.json() as Promise<HomePageData>;
};

export const getAncestorDetailPreview = async (ancestorId: string) => {
  const res = await fetch(`${API_BASE}/api/ancestors/${ancestorId}/preview`);
  if (!res.ok) throw new Error(`Ancestor "${ancestorId}" not found`);
  return res.json() as Promise<AncestorDetailPreview>;
};

export const prepareModeIntent = async (modeId: string) => {
  const res = await fetch(`${API_BASE}/api/modes/${modeId}/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Mode "${modeId}" not found`);
  return res.json() as Promise<ModeIntentPreview>;
};
```

### 7.6 后端 API 设计（预留）

| 端点 | 方法 | 说明 | 返回类型 |
|---|---|---|---|
| `/api/home` | GET | 获取首页完整数据 | `HomePageData` |
| `/api/ancestors/:id/preview` | GET | 获取人物详情预览 | `AncestorDetailPreview` |
| `/api/modes/:id/intent` | POST | 获取玩法意图预览 | `ModeIntentPreview` |

### 7.7 性格引擎后端计算（预留）

```python
# 伪代码：后端性格引擎计算逻辑
class PersonalityEngine:
    def calculate_mood_index(self, character_id: str, interactions: list) -> int:
        """计算 MoodIndex"""
        base_mood = self.get_base_mood(character_id)
        interaction_bonus = sum(i.mood_delta for i in interactions[-7:])  # 近 7 天
        return clamp(base_mood + interaction_bonus, 0, 100)

    def calculate_trait_vector(self, character_id: str, history: list) -> list[TraitMetric]:
        """计算性格向量"""
        base_traits = self.get_base_traits(character_id)
        for interaction in history:
            base_traits[interaction.trait_id] += interaction.delta
        return [
            TraitMetric(
                id=trait_id,
                label=self.get_trait_label(trait_id),
                value=clamp(value, 0, 100),
                max=100,
                note=self.generate_trait_note(trait_id, value),
                tone=self.get_trait_tone(trait_id),
            )
            for trait_id, value in base_traits.items()
        ]

    def calculate_fate_tension(self, character_id: str, fate_id: str) -> int:
        """计算命运节点张力"""
        mood = self.calculate_mood_index(character_id, recent_interactions)
        fidelity = self.get_historical_fidelity(character_id)
        traits = self.calculate_trait_vector(character_id, history)
        return self.compute_tension_score(fate_id, mood, fidelity, traits)
```

---

## 八、文件结构

```
src/features/home-growth/
├── AGENTS.md                          # 协作说明（已存在）
├── home-growth-section.tsx            # 主组件（已存在，需增强）
├── home-growth-section.module.css     # 模块样式（已存在，需增强）
├── home-growth-section.test.tsx       # 单元测试（已存在）
├── index.ts                           # 导出入口（新增）
├── constants.ts                       # 模块常量（新增，可选）
└── hooks/                             # 自定义 Hooks（新增，可选）
    └── use-mood-animation.ts          # 心情数值动画 Hook
```

---

## 九、增强实现清单

### 9.1 必须实现（MVP 核心）

- [x] 心情面板完整渲染（MoodIndex + 摘要 + 三栏网格 + 标签 + 里程碑）
- [x] 性格向量面板完整渲染（Trait Vector 列表）
- [x] 命运节点预告完整渲染（3 列卡片 + 张力条 + 聚焦按钮）
- [x] `onOpenFatePreview` 回调正确触发
- [x] 响应式布局（3 断点）
- [x] 单元测试覆盖

### 9.2 建议增强（竞赛级别体验）

- [ ] 进度条入场动画（CSS `@keyframes meter-fill`）
- [ ] 心情数值入场动画（CSS `@keyframes fade-in-up`）
- [ ] 命运节点卡片 Hover 浮起效果
- [ ] 心情面板朱印装饰角标
- [ ] Delta 值正负颜色区分（正→朱红，负→灰色）
- [ ] 张力进度条颜色随值变化（低→中→高对应不同渐变）
- [ ] 空状态处理（fatePreviews 为空时的占位提示）
- [ ] 加载态骨架屏（数据异步加载时的占位）

### 9.3 可选增强（锦上添花）

- [ ] 性格向量雷达图可视化（替代或补充进度条）
- [ ] 心情历史迷你折线图（展示近 7 天 MoodIndex 变化）
- [ ] 命运节点倒计时（距离触发预计时间）
- [ ] 标签点击筛选（点击标签高亮相关命运节点）

---

## 十、测试策略

### 10.1 单元测试（已覆盖）

```typescript
// home-growth-section.test.tsx
describe("HomeGrowthSection", () => {
  it("renders the nurturing data and emits fate callbacks", async () => {
    // 验证 MoodIndex 渲染
    // 验证命运节点渲染
    // 验证点击回调
  });
});
```

### 10.2 建议补充测试

```typescript
// 补充测试用例
describe("HomeGrowthSection", () => {
  it("displays delta with correct sign", () => {
    // 验证 +12 显示为 "+12"，-5 显示为 "-5"
  });

  it("renders trait meters with correct percentages", () => {
    // 验证进度条宽度百分比正确
  });

  it("handles empty fatePreviews gracefully", () => {
    // 验证空数组时不报错
  });

  it("calls onOpenFatePreview with correct fateId", async () => {
    // 验证点击不同节点传递正确 ID
  });

  it("applies correct tone classes to trait meters", () => {
    // 验证 tone 映射正确
  });
});
```

---

## 十一、性能优化

### 11.1 渲染优化

- 心情面板和性格向量面板为纯展示组件，无需 `useMemo`
- 命运节点列表可使用 `React.memo` 包裹单张卡片组件（如果拆分为子组件）

### 11.2 CSS 优化

- 所有动画使用 `transform` 和 `opacity`（GPU 加速）
- 避免使用 `box-shadow` 动画（性能差）
- 进度条动画使用 `will-change: width` 提示浏览器优化

### 11.3 字体加载优化

- 全局已配置 Google Fonts 预加载
- 模块内无需额外字体配置

---

## 十二、无障碍（A11y）

### 12.1 已实现

- `ProgressMeter` 组件使用 `role="meter"` + `aria-label` + `aria-valuemin/max/now`
- 按钮使用语义化 `<button>` 元素

### 12.2 建议补充

- 命运节点卡片添加 `aria-labelledby` 关联标题
- 张力进度条添加 `aria-label="张力值: 84%"`
- 确保所有交互元素有 `:focus-visible` 样式（全局已配置）
- 颜色对比度检查（朱印色 `#9b2d24` 在白色底上对比度 5.2:1，符合 WCAG AA）

---

## 十三、开发工作流

### 13.1 本地开发

```bash
# 1. 切换到开发分支
git checkout codex/dev3-growth

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev

# 4. 访问首页
open http://localhost:3000
```

### 13.2 提交前检查

```bash
# 运行 lint
pnpm lint

# 运行类型检查
pnpm typecheck

# 运行测试
pnpm test
```

### 13.3 合并流程

1. 在 `codex/dev3-growth` 分支完成开发
2. 通过 `pnpm lint`、`pnpm typecheck`、`pnpm test`
3. 提交 PR 到 `main` 分支
4. 由 Developer 1 审查合并

---

## 十四、风险与注意事项

### 14.1 契约冻结风险

- **风险**：自行扩充 `HomeGrowthSectionProps` 导致合并冲突
- **应对**：严格遵守冻结契约，任何 props 变更需先与 Developer 1 同步

### 14.2 样式冲突风险

- **风险**：局部样式与全局主题变量冲突
- **应对**：优先使用 CSS Modules（`.xxx` 类名），避免覆盖全局类名

### 14.3 Mock 数据变更风险

- **风险**：修改 `mocks/home-data.ts` 影响其他模块
- **应对**：删除或修改 mock 数据前确认没有被 home-hero 或 home-playground 引用

### 14.4 视觉一致性风险

- **风险**：新增样式破坏"新国风卷轴"整体风格
- **应对**：严格使用全局 CSS 变量，不引入冲突的视觉元素（如后台风、SaaS 风、霓虹风）

---

## 十五、总结

Home-Growth 模块是首页三大功能区中**数据密度最高**的区域，承担着将抽象的性格引擎数据转化为直观可视化面板的核心职责。设计要点：

1. **视觉**：严格遵循"新国风卷轴"基调，使用墨色、朱印、描金三色体系
2. **交互**：通过 `onOpenFatePreview` 与右侧控制台联动，形成闭环
3. **逻辑**：MoodIndex、Trait Vector、历史忠诚度、命运节点张力四大核心指标清晰展示
4. **架构**：Mock-First 架构，预留真实后端接入接口
5. **边界**：严格遵守契约冻结规则，不越权修改共享资源

本文档覆盖了从界面设计到后端配置的所有必要信息，开发者可据此完整实现 home-growth 模块的所有功能。
