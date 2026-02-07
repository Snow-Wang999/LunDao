# BrainStorm Arena — 多模型头脑风暴聊天室

## 产品文档 v1.0

---

## 1. 项目概述

### 1.1 产品定位

BrainStorm Arena 是一个自用的多模型头脑风暴聊天室。用户（即"主持人"）发起话题，多个 AI 模型依次参与讨论，其中一个模型担任"记录员"角色，负责维护讨论摘要。所有模型基于压缩后的历史上下文 + 最新一轮发言进行输出，模拟真实的头脑风暴会议。

### 1.2 核心目标

- 让多个不同厂商的 AI 模型围绕同一话题进行依次发言式的头脑风暴
- 通过 compact 策略控制上下文长度和成本
- 用户通过控场指令引导讨论方向
- 一个专门的"记录员"模型实时维护讨论记录

### 1.3 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | React + TypeScript | Vite 构建，聊天界面 |
| 后端 | Node.js + Express + TypeScript | 消息路由、模型调用、compact 逻辑 |
| 通信 | SSE (Server-Sent Events) | 流式输出模型回复 |
| 存储 | SQLite (better-sqlite3) | 本地持久化聊天记录 |
| 样式 | Tailwind CSS | 快速搭建 UI |

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────┐
│                  Frontend (React)            │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ ChatRoom │  │ Controls │  │  Sidebar   │  │
│  │  Panel   │  │  Panel   │  │ (记录面板) │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       └──────────────┼─────────────┘        │
│                      │ SSE + REST           │
└──────────────────────┼──────────────────────┘
                       │
┌──────────────────────┼──────────────────────┐
│                  Backend (Node.js)           │
│                      │                      │
│  ┌───────────────────▼───────────────────┐  │
│  │          Message Router               │  │
│  │  - 解析控场指令                        │  │
│  │  - 决定发言顺序                        │  │
│  │  - 构造 prompt                        │  │
│  └───────┬───────────────────┬───────────┘  │
│          │                   │              │
│  ┌───────▼───────┐  ┌───────▼───────────┐  │
│  │ Model Adapter │  │ Compact Engine    │  │
│  │  Layer        │  │ (记录员逻辑)       │  │
│  └───────┬───────┘  └───────────────────┘  │
│          │                                  │
│  ┌───────▼──────────────────────────────┐  │
│  │         API Adapters                  │  │
│  │  Claude | GPT | Gemini | GLM |       │  │
│  │  Kimi   | Qwen                       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │         SQLite Storage                │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 2.2 核心模块说明

#### Message Router（消息路由器）

职责：
- 接收用户消息
- 解析控场指令前缀（如 `@all`、`@深入`、`@挑战` 等）
- 根据指令决定哪些模型参与本轮、以什么 prompt 模板发言
- 按顺序依次调用模型，将前一个模型的回复加入后续模型的输入

#### Model Adapter Layer（模型适配层）

职责：
- 统一封装各厂商 API 的调用方式
- 统一输入输出格式
- 处理流式响应
- 错误处理和重试

#### Compact Engine（压缩引擎）

职责：
- 每轮讨论结束后，调用记录员模型生成/更新摘要
- 维护两层结构：大纲 + 近期详情
- 为下一轮发言构造上下文

---

## 3. 接入模型清单

| 模型 | API Provider | Base URL | 模型标识符 | 备注 |
|------|-------------|----------|-----------|------|
| Claude | Anthropic | https://api.anthropic.com/v1/messages | claude-sonnet-4-20250514 | Anthropic Messages API 格式 |
| GPT-5.2 | OpenAI | https://api.openai.com/v1/chat/completions | gpt-5.2 | OpenAI Chat Completions 格式 |
| Gemini | Google | https://generativelanguage.googleapis.com/v1beta | gemini-2.5-pro | Google Gemini API 格式 |
| GLM-4.7 | 智谱 | https://open.bigmodel.cn/api/paas/v4/chat/completions | glm-4.7 | 兼容 OpenAI 格式 |
| Kimi K2.5 | Moonshot | https://api.moonshot.cn/v1/chat/completions | moonshot-v1-128k | 兼容 OpenAI 格式 |
| Qwen Plus | 阿里 | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions | qwen-plus | 兼容 OpenAI 格式 |

> **重要说明**：上表中的模型标识符和 Base URL 可能随厂商更新而变化。请在实际开发时查阅各厂商最新文档确认。配置应从 `.env` 文件读取，方便随时修改。

### 3.1 API 适配器设计

由于 GLM、Kimi、Qwen 均兼容 OpenAI Chat Completions 格式，适配器只需实现两种：

```
ModelAdapter (interface)
├── AnthropicAdapter   → Claude (Messages API)
├── OpenAIAdapter      → GPT-5.2 (Chat Completions API)
├── GeminiAdapter      → Gemini (Google Gemini API)
└── OpenAICompatAdapter → GLM / Kimi / Qwen (复用 OpenAI 格式，仅换 base_url 和 model)
```

每个 Adapter 实现统一接口：

```typescript
interface ModelAdapter {
  id: string;               // 如 "claude", "gpt", "gemini"
  displayName: string;      // 如 "Claude", "GPT-5.2"
  sendMessage(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    stream: boolean;
  }): AsyncGenerator<string>;  // 流式输出 yield 文本片段
}
```

---

## 4. Compact 策略（方案 B：分层记录）

### 4.1 数据结构

记录员维护一个 JSON 结构：

```typescript
interface DiscussionRecord {
  // 第一层：大纲（核心结论和方向）
  outline: {
    topic: string;                    // 当前讨论主题
    keyDecisions: string[];           // 已达成的关键结论
    openQuestions: string[];           // 尚未解决的问题
    directionChanges: string[];       // 讨论方向的重大转变
  };

  // 第二层：近期详情（最近 N 轮的详细记录）
  recentRounds: {
    roundNumber: number;
    participants: string[];            // 本轮发言的模型
    messages: {
      speaker: string;                // "user" | 模型名
      summary: string;                // 该发言的摘要（1-3句话）
      keyPoints: string[];            // 关键观点提取
    }[];
    controlCommand?: string;          // 本轮使用的控场指令
  }[];
}
```

### 4.2 Compact 规则

- `recentRounds` 保留最近 **5 轮**的详细记录
- 当第 6 轮结束时，最早的一轮被合并进 `outline`：
  - 关键结论 → `keyDecisions`
  - 未解决问题 → `openQuestions`
  - 方向变化 → `directionChanges`
- 每轮结束后，记录员模型被调用一次，输入为当前 `DiscussionRecord` + 本轮所有发言全文，输出为更新后的 `DiscussionRecord`

### 4.3 上下文构造

每个非记录员模型收到的 prompt 结构：

```
[System Prompt]
你是 {模型名}，正在参与一个头脑风暴讨论。
当前讨论主题：{topic}
{控场指令对应的额外指示，如有}

[Discussion Context]
## 讨论大纲
- 已达成结论：{keyDecisions}
- 待解决问题：{openQuestions}

## 近期讨论（最近 5 轮摘要）
{recentRounds 的格式化文本}

## 本轮最新发言
{本轮已经发言的内容（用户 + 前面已回复的模型）}

请基于以上上下文给出你的想法。
```

### 4.4 记录员模型选择

建议使用 **Claude** 或 **GPT** 作为记录员（摘要能力强）。记录员也可以参与讨论——先作为讨论者发言，轮次结束后再执行记录职责。

---

## 5. 控场指令系统

### 5.1 指令列表

| 指令 | 格式 | 作用 | Prompt 注入内容 |
|------|------|------|----------------|
| 新话题 | `@all 新话题：{内容}` | 开启全新讨论方向 | "请围绕以下新话题展开讨论：{内容}" |
| 深入 | `@深入 {内容}` | 对某个点展开深入讨论 | "请深入分析以下观点，给出更详细的思考：{内容}" |
| 挑战 | `@挑战 {内容}` | 让模型找漏洞和问题 | "请从批判性角度审视以下想法，找出潜在问题、风险和漏洞：{内容}" |
| 总结 | `@总结` | 记录员输出完整讨论成果 | 仅触发记录员，输出完整的 DiscussionRecord 的可读版本 |
| 投票 | `@投票 {方案描述}` | 每个模型给出支持/反对 | "请对以下方案明确表态（支持/反对/中立），并给出理由：{方案描述}" |
| 跳过 | `@跳过 {模型名}` | 本轮某模型不发言 | 路由器跳过该模型 |
| 指定 | `@{模型名} {内容}` | 只让某个模型回复 | 仅调用该模型 |
| 普通消息 | 无前缀 | 所有模型依次回复 | 无额外注入 |

### 5.2 指令解析逻辑

```typescript
interface ParsedCommand {
  type: 'all' | 'deep' | 'challenge' | 'summary' | 'vote' | 'skip' | 'direct' | 'normal';
  content: string;
  targetModel?: string;      // 用于 skip 和 direct
  promptInjection?: string;  // 注入到模型 system prompt 的额外指示
}

function parseCommand(message: string): ParsedCommand {
  if (message.startsWith('@all 新话题：')) return { type: 'all', content: message.slice(8), promptInjection: '...' };
  if (message.startsWith('@深入')) return { type: 'deep', content: message.slice(3).trim(), promptInjection: '...' };
  if (message.startsWith('@挑战')) return { type: 'challenge', content: message.slice(3).trim(), promptInjection: '...' };
  if (message === '@总结') return { type: 'summary', content: '' };
  if (message.startsWith('@投票')) return { type: 'vote', content: message.slice(3).trim(), promptInjection: '...' };
  if (message.startsWith('@跳过')) return { type: 'skip', content: '', targetModel: message.slice(3).trim() };
  // @模型名 格式
  const directMatch = message.match(/^@(claude|gpt|gemini|glm|kimi|qwen)\s+(.*)/i);
  if (directMatch) return { type: 'direct', content: directMatch[2], targetModel: directMatch[1] };
  return { type: 'normal', content: message };
}
```

---

## 6. 发言流程（核心循环）

### 6.1 单轮流程

```
1. 用户输入消息
     │
2. Message Router 解析控场指令
     │
3. 确定本轮参与模型列表和顺序
     │
4. 构造上下文 = compact历史(DiscussionRecord) + 本轮已有发言
     │
5. 依次调用模型（串行）：
     │  ├─ Model A 收到：上下文 + 用户消息
     │  │  → Model A 回复（流式输出到前端）
     │  │
     │  ├─ Model B 收到：上下文 + 用户消息 + Model A 的回复
     │  │  → Model B 回复（流式输出到前端）
     │  │
     │  └─ Model C 收到：上下文 + 用户消息 + A 和 B 的回复
     │     → Model C 回复（流式输出到前端）
     │
6. 本轮结束，调用记录员模型更新 DiscussionRecord
     │
7. 保存到 SQLite，等待下一轮
```

### 6.2 模型默认发言顺序

可在设置中调整，默认：
1. Claude
2. GPT-5.2
3. Gemini
4. GLM-4.7
5. Kimi K2.5
6. Qwen Plus

> 依次发言的好处：排在后面的模型能看到前面模型的观点，讨论更有层次感。建议用户也可以通过前端拖拽调整顺序。

---

## 7. 前端设计

### 7.1 页面布局

```
┌────────────────────────────────────────────────────┐
│  BrainStorm Arena                    [设置] [导出]  │
├──────────────────────────────┬─────────────────────┤
│                              │                     │
│     主聊天区域                │   讨论记录面板       │
│                              │                     │
│  ┌────────────────────────┐  │  ┌───────────────┐  │
│  │ 👤 User                │  │  │ 📋 大纲       │  │
│  │ 我想做一个多模型聊天室   │  │  │               │  │
│  ├────────────────────────┤  │  │ 关键结论：     │  │
│  │ 🟣 Claude              │  │  │ - xxx         │  │
│  │ 我觉得可以从...        │  │  │ - xxx         │  │
│  ├────────────────────────┤  │  │               │  │
│  │ 🟢 GPT-5.2             │  │  │ 待解决：       │  │
│  │ 补充一点...            │  │  │ - xxx         │  │
│  ├────────────────────────┤  │  ├───────────────┤  │
│  │ 🔵 Gemini              │  │  │ 📝 近期详情   │  │
│  │ 另一个角度...          │  │  │               │  │
│  ├────────────────────────┤  │  │ Round 5:      │  │
│  │ ...                    │  │  │ Round 4:      │  │
│  └────────────────────────┘  │  │ Round 3:      │  │
│                              │  └───────────────┘  │
│  ┌────────────────────────┐  │                     │
│  │ 输入框          [发送]  │  │                     │
│  │ 支持 @ 指令自动补全     │  │                     │
│  └────────────────────────┘  │                     │
├──────────────────────────────┴─────────────────────┤
│  模型状态栏：🟣Claude ✅ 🟢GPT ⏳ 🔵Gemini 🔘...   │
└────────────────────────────────────────────────────┘
```

### 7.2 前端组件结构

```
src/
├── App.tsx                    # 主布局
├── components/
│   ├── ChatPanel/
│   │   ├── ChatPanel.tsx      # 主聊天区域
│   │   ├── MessageBubble.tsx  # 单条消息气泡（区分用户/不同模型）
│   │   └── StreamingText.tsx  # 流式文本渲染组件
│   ├── InputBar/
│   │   ├── InputBar.tsx       # 输入框 + 发送按钮
│   │   └── CommandHint.tsx    # @ 指令自动补全提示
│   ├── RecordPanel/
│   │   ├── RecordPanel.tsx    # 右侧讨论记录面板
│   │   ├── OutlineView.tsx    # 大纲视图
│   │   └── RecentDetail.tsx   # 近期详情视图
│   ├── StatusBar/
│   │   └── ModelStatusBar.tsx # 底部模型状态指示
│   └── Settings/
│       ├── SettingsModal.tsx  # 设置弹窗
│       ├── ModelConfig.tsx    # 模型配置（API key、启用/禁用）
│       └── OrderConfig.tsx    # 发言顺序拖拽调整
├── hooks/
│   ├── useChat.ts             # 聊天核心逻辑
│   ├── useSSE.ts              # SSE 连接管理
│   └── useCommands.ts         # 控场指令解析
├── types/
│   └── index.ts               # 全局类型定义
└── utils/
    └── api.ts                 # 后端 API 调用封装
```

### 7.3 关键交互

- **消息气泡**：每个模型有独特的颜色和图标，便于区分
- **流式输出**：模型回复时实时显示文字，底部状态栏显示当前正在发言的模型
- **@ 指令补全**：输入 `@` 时弹出指令/模型名选择菜单
- **记录面板**：实时更新，展示当前 DiscussionRecord 的可读版本
- **导出**：支持将完整讨论记录导出为 Markdown 文件

---

## 8. 后端设计

### 8.1 目录结构

```
server/
├── src/
│   ├── index.ts               # Express 入口
│   ├── routes/
│   │   ├── chat.ts            # POST /api/chat — 发送消息，触发模型依次回复
│   │   ├── sessions.ts        # CRUD /api/sessions — 讨论会话管理
│   │   ├── stream.ts          # GET /api/stream/:sessionId — SSE 端点
│   │   └── export.ts          # GET /api/export/:sessionId — 导出讨论记录
│   ├── services/
│   │   ├── router.ts          # Message Router 核心逻辑
│   │   ├── compact.ts         # Compact Engine（调用记录员）
│   │   └── orchestrator.ts    # 编排模型依次发言
│   ├── adapters/
│   │   ├── base.ts            # ModelAdapter 接口定义
│   │   ├── anthropic.ts       # Claude 适配器
│   │   ├── openai.ts          # GPT 适配器
│   │   ├── gemini.ts          # Gemini 适配器
│   │   └── openai-compat.ts   # GLM / Kimi / Qwen 通用适配器
│   ├── prompts/
│   │   ├── system.ts          # 各角色的 system prompt 模板
│   │   ├── commands.ts        # 控场指令对应的 prompt 注入模板
│   │   └── recorder.ts        # 记录员专用 prompt
│   ├── db/
│   │   ├── schema.ts          # SQLite 表结构
│   │   └── queries.ts         # 数据库操作
│   └── types/
│       └── index.ts           # 后端类型定义
├── .env                       # API keys 和配置
└── package.json
```

### 8.2 API 端点

```
POST   /api/sessions                   # 创建新讨论会话
GET    /api/sessions                   # 列出所有会话
GET    /api/sessions/:id               # 获取会话详情（含消息历史）
DELETE /api/sessions/:id               # 删除会话

POST   /api/chat                       # 发送用户消息，触发模型回复流程
       Body: { sessionId, message }
       Response: { roundId }           # 返回轮次ID，前端通过 SSE 接收回复

GET    /api/stream/:sessionId          # SSE 端点，推送模型回复
       Events:
         - model_start: { model: string }
         - model_chunk: { model: string, text: string }
         - model_done: { model: string, fullText: string }
         - round_done: { roundId, record: DiscussionRecord }
         - error: { model: string, error: string }

GET    /api/export/:sessionId          # 导出讨论记录为 Markdown
GET    /api/record/:sessionId          # 获取当前 DiscussionRecord
```

### 8.3 环境变量 (.env)

```env
# Server
PORT=3001

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AI...
ZHIPU_API_KEY=...
MOONSHOT_API_KEY=sk-...
DASHSCOPE_API_KEY=sk-...

# Model Config
RECORDER_MODEL=claude          # 记录员使用的模型
DEFAULT_MODEL_ORDER=claude,gpt,gemini,glm,kimi,qwen

# Compact Config
RECENT_ROUNDS_LIMIT=5          # 近期详情保留轮数
```

---

## 9. 数据库设计 (SQLite)

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,          -- UUID
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rounds (
  id TEXT PRIMARY KEY,          -- UUID
  session_id TEXT NOT NULL REFERENCES sessions(id),
  round_number INTEGER NOT NULL,
  command_type TEXT,            -- 'normal' | 'all' | 'deep' | 'challenge' | 'vote' | ...
  command_raw TEXT,             -- 用户原始输入
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,          -- UUID
  round_id TEXT NOT NULL REFERENCES rounds(id),
  session_id TEXT NOT NULL REFERENCES sessions(id),
  speaker TEXT NOT NULL,        -- 'user' | 'claude' | 'gpt' | 'gemini' | ...
  content TEXT NOT NULL,
  sequence INTEGER NOT NULL,   -- 本轮内的发言顺序
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discussion_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  round_id TEXT NOT NULL REFERENCES rounds(id),  -- 哪一轮之后生成的
  record_json TEXT NOT NULL,   -- DiscussionRecord JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 10. Prompt 模板

### 10.1 讨论者 System Prompt

```
你是 {displayName}，正在参与一场多 AI 模型的头脑风暴讨论。

规则：
1. 直接给出你的想法和观点，不要客套寒暄
2. 如果你同意之前的观点，简要说明并补充新的角度，不要重复
3. 如果你有不同意见，明确指出并说明理由
4. 保持回复简洁有力，每次发言控制在 200-400 字
5. 聚焦在可落地的具体建议上

{commandInjection}
```

### 10.2 记录员 Prompt

```
你是本次头脑风暴的记录员。你的任务是在每轮讨论结束后更新讨论记录。

当前讨论记录：
{currentRecord}

本轮所有发言：
{roundMessages}

请根据本轮讨论更新记录，输出更新后的完整 JSON。规则：
1. outline.keyDecisions: 记录已形成共识的结论
2. outline.openQuestions: 记录尚未解决或有争议的问题
3. outline.directionChanges: 记录讨论方向的重大转变
4. recentRounds: 保留最近 {RECENT_ROUNDS_LIMIT} 轮，新增本轮摘要
5. 如果 recentRounds 超出限制，将最早的一轮合并进 outline
6. 每条发言摘要控制在 1-3 句话，提取核心观点

请只输出 JSON，不要有其他内容。
```

### 10.3 控场指令 Prompt 注入

```typescript
const COMMAND_INJECTIONS: Record<string, string> = {
  all:       "这是一个全新的讨论话题，请围绕它展开讨论，不要受之前讨论的限制。",
  deep:      "请深入分析以下观点，从多个维度（技术可行性、成本、时间、风险等）给出详细思考。",
  challenge: "请从批判性角度审视以下想法，找出潜在的问题、风险、漏洞和不切实际的假设。请直言不讳。",
  vote:      "请对以下方案明确表态（✅ 支持 / ❌ 反对 / ⚖️ 中立），先给出立场，再给出理由（3句话以内）。",
};
```

---

## 11. MVP 功能范围

### 11.1 Phase 1 — MVP（目标：可运行的头脑风暴）

必须实现：
- [ ] 前端聊天界面（主聊天区 + 输入框 + 模型状态栏）
- [ ] 6 个模型的 API 适配器
- [ ] 依次发言的核心流程（串行调用 + 流式输出）
- [ ] Compact Engine（方案 B 分层记录）
- [ ] 基础控场指令：`@all`、`@深入`、`@挑战`、`@总结`、`@跳过`
- [ ] 右侧讨论记录面板
- [ ] SQLite 持久化
- [ ] `.env` 配置管理

### 11.2 Phase 2 — 增强体验

后续迭代：
- [ ] @ 指令自动补全
- [ ] 发言顺序拖拽调整
- [ ] `@投票` 指令 + 投票结果可视化
- [ ] `@{模型名}` 指定模型回复
- [ ] 讨论记录导出为 Markdown
- [ ] 多会话管理（历史会话列表）
- [ ] 记录员模型可切换
- [ ] 单个模型的启用/禁用

### 11.3 Phase 3 — 高级功能

远期考虑：
- [ ] 模型回复的 token 用量和成本统计
- [ ] 自定义 prompt 模板
- [ ] 讨论分支（从某一轮 fork 出新讨论线）
- [ ] 更多模型接入（DeepSeek 等）

---

## 12. 开发指引

### 12.1 启动步骤

```bash
# 1. 克隆项目
git clone <repo>
cd brainstorm-arena

# 2. 安装依赖
cd server && npm install
cd ../client && npm install

# 3. 配置环境变量
cp server/.env.example server/.env
# 编辑 .env 填入各模型的 API Key

# 4. 启动开发服务器
# Terminal 1:
cd server && npm run dev
# Terminal 2:
cd client && npm run dev
```

### 12.2 关键实现注意事项

1. **流式输出**：使用 SSE 而非 WebSocket，更简单且足够用。每个模型的流式 chunk 通过 `model_chunk` 事件推送，前端按 model 字段分别渲染。

2. **串行调用**：模型必须严格串行调用（不是并行），因为后一个模型需要看到前面模型的完整回复。使用 `for...of` 循环配合 `await`。

3. **错误处理**：单个模型调用失败不应阻塞整轮。捕获异常后发送 `error` SSE 事件，跳过该模型继续下一个。

4. **记录员调用时机**：在所有模型回复完成后、下一轮开始前调用。这是一次独立的 API 调用，不通过 SSE 流式输出（摘要结果直接更新到右侧面板）。

5. **Token 控制**：每个模型的回复建议限制 max_tokens = 800-1000，避免单次发言过长影响讨论节奏。

---

## 13. 风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| 某模型 API 不可用 | 该模型无法发言 | 跳过并在状态栏提示，不阻塞讨论 |
| 记录员输出非法 JSON | Compact 失败 | 重试一次，仍失败则保留原 record 不更新 |
| 上下文超出模型限制 | 调用失败 | compact 后的上下文应控制在 4000 token 以内 |
| API 成本过高 | 费用失控 | max_tokens 限制 + 控制参与模型数量 |

---

*文档版本: v1.0*
*最后更新: 2026-02-06*
*状态: MVP 阶段*

---

## 14. 简化方案 (v1.1)

- 存储：Markdown 文件替代 SQLite，记录员摘要后自动追加
- 模型：GLM + Kimi + Qwen（国产模型，API 便宜，无需代理）
- 保留记录员功能和右侧记录面板
- 本地运行，不对外暴露
