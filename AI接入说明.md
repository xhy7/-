# AI 接入说明

## 当前能力
- 目前只接入“单角色文字回复生成能力”。
- 输出固定为结构化 JSON，字段为 `reply`、`subtext`、`nextAction`、`styleTags`。
- 支持 `prototype` / `ooc` 两种模式。
- 生成会受到 `moodIndex`、`traitVector`、`sceneType` 影响。
- 首页当前把 AI 嵌入在古人角色交互里，由当前聚焦祖宗直接开口。

## 你需要填的 AI 接口位置
- 在项目根目录创建 `.env.local`。
- 然后把下面几个环境变量手动填进去。

按你当前项目这套配置，推荐直接这样写：

```env
AI_PROVIDER=remote
AI_API_URL=https://api.onelinkai.cloud
AI_API_KEY=你的真实key
AI_MODEL=gpt-4o
```

## 字段说明
- `AI_PROVIDER`
  - `mock`：走本地 mock adapter，不会请求真实 AI。
  - `remote`：走真实远程 AI 接口。
- `AI_API_URL`
  - 这里填你的 AI 接口基础地址或完整 `chat/completions` 地址都可以。
  - 当前代码会自动补成 OpenAI-compatible 的 `/v1/chat/completions`。
- `AI_API_KEY`
  - 这里填你的 API Key。
- `AI_MODEL`
  - 这里必须填提供方实际支持的模型代码，不一定等于产品展示名。

## 代码入口
- 合同定义：`src/shared/contracts/home.ts`
- Gateway 接口：`src/shared/contracts/gateway.ts`
- Persona 配置：`src/shared/ai/personas.ts`
- Prompt Builder：`src/shared/ai/prompt-builder.ts`
- Mock Adapter：`src/mocks/ai-reply-adapter.ts`
- Remote Adapter：`src/shared/ai/remote-ai-adapter.ts`
- Gateway 实现：`src/shared/ai/ai-reply-gateway.ts`
- API Route：`src/app/api/ai-reply/route.ts`
- 角色内嵌 AI 交互：`src/features/home-hero/home-hero-section.tsx`

## 当前请求格式
路由：`POST /api/ai-reply`

请求体示例：

```json
{
  "ancestorId": "su-shi",
  "userMessage": "今天事情很多，我有点想摆烂。",
  "mode": "prototype",
  "sceneType": "daily-chat",
  "moodIndex": 78,
  "traitVector": [
    {
      "id": "humor",
      "label": "幽默感",
      "value": 92,
      "max": 100,
      "note": "再大的史诗事故，也能被他圆成一句俏皮话。",
      "tone": "gold"
    }
  ],
  "contextNote": "现代职场语境"
}
```

返回体示例：

```json
{
  "requestId": "mock-123456",
  "ancestorId": "su-shi",
  "mode": "prototype",
  "sceneType": "daily-chat",
  "output": {
    "reply": "先把心定下来，再慢慢说。",
    "subtext": "他在先安抚你，再准备给判断。",
    "nextAction": "补一句你最担心的点。",
    "styleTags": ["prototype", "daily-chat", "幽默感"]
  },
  "debug": {
    "provider": "mock",
    "model": "mock-single-role-writer",
    "personaId": "su-shi",
    "moodSummary": "情绪稳定偏积极，适合正常发挥 persona。",
    "dominantTraits": ["幽默感", "历史忠诚度"]
  }
}
```

## 常见问题
- 如果你把 `AI_API_URL` 只写成根域名，旧实现会直接打错地址；当前实现已自动补全。
- 如果返回“模型不存在”，说明 `AI_MODEL` 填的不是提供方真正支持的模型代码，需要去服务商控制台或文档里查准确名称。
- 你当前 `.env.local` 这套形式已经和代码对齐，实际会请求到 `https://api.onelinkai.cloud/v1/chat/completions`。

## 使用建议
- 本地联调时先保持 `AI_PROVIDER=mock`，确认首页 sandbox 流程通了再切 `remote`。
- 如果你的提供方不是 OpenAI-compatible 返回格式，需要改 `src/shared/ai/remote-ai-adapter.ts` 的请求体或解析逻辑。
