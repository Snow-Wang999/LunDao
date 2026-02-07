# LunDao 论道

多模型 AI 头脑风暴聊天应用 - 让多个 AI 模型围绕话题展开讨论，碰撞思想火花。

## 特性

- **多模型协作**：智谱 GLM、Kimi、通义千问三个模型依次发言
- **串行执行**：后发言的模型能看到前面模型的回复，形成真正的对话
- **记录员模式**：自动压缩历史上下文，保持讨论连贯性
- **流式输出**：SSE 实时推送，逐字显示回复
- **指令系统**：灵活控制讨论方向

## 指令

| 指令 | 说明 |
|------|------|
| `@all {内容}` | 重置讨论，所有模型回复 |
| `@深入 {内容}` | 深度多维分析 |
| `@挑战 {内容}` | 批判性审视 |
| `@总结` | 记录员输出完整总结 |
| `@跳过 {模型}` | 本轮排除某模型 |
| `@{模型} {内容}` | 仅指定模型回复 |
| 无前缀 | 所有模型回复（默认） |

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Snow-Wang999/LunDao.git
cd LunDao
```

### 2. 配置环境变量

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Key：

```env
# 智谱 GLM
ZHIPU_API_KEY=your_key_here

# Kimi (Moonshot)
MOONSHOT_API_KEY=your_key_here

# 通义千问 (阿里云)
DASHSCOPE_API_KEY=your_key_here
```

### 3. 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd ../client
npm install
```

### 4. 启动开发服务器

需要两个终端：

```bash
# 终端 1 - 后端 (端口 3001)
cd server
npm run dev

# 终端 2 - 前端 (端口 5173)
cd client
npm run dev
```

访问 http://localhost:5173 开始使用。

## 技术栈

**前端**
- React 18 + TypeScript
- Vite
- Tailwind CSS

**后端**
- Express + TypeScript
- Server-Sent Events (SSE)
- tsx (开发热重载)

## 项目结构

```
LunDao/
├── client/                 # 前端
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   └── utils/          # 工具函数
│   └── ...
├── server/                 # 后端
│   ├── src/
│   │   ├── adapters/       # 模型适配器
│   │   ├── services/       # 业务逻辑
│   │   ├── routes/         # API 路由
│   │   └── prompts/        # 提示词模板
│   └── ...
└── CLAUDE.md               # Claude Code 项目指南
```

## 模型配置

可在 `.env` 中选择不同的模型版本：

```env
# 智谱：glm-4-flash(便宜) / glm-4-air / glm-4
ZHIPU_MODEL=glm-4-flash

# Kimi：moonshot-v1-8k / moonshot-v1-32k / moonshot-v1-128k
MOONSHOT_MODEL=moonshot-v1-8k

# 通义：qwen-turbo(便宜) / qwen-plus / qwen-max
QWEN_MODEL=qwen-turbo
```

## License

MIT
