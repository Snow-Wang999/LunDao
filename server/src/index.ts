// 加载环境变量 - 必须在其他 import 之前！
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import sessionsRoutes from './routes/sessions.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/chat', chatRoutes);
app.use('/api/sessions', sessionsRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 LunDao server running at http://localhost:${PORT}`);
  console.log(`📝 API endpoints:`);
  console.log(`   POST /api/sessions - Create session`);
  console.log(`   GET  /api/sessions - List sessions`);
  console.log(`   POST /api/chat - Send message (SSE)`);
});
