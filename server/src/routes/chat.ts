import { Router, Request, Response } from 'express';
import { parseCommand, getParticipants } from '../services/router.js';
import { executeRound } from '../services/orchestrator.js';
import { getModelOrder } from '../adapters/index.js';
import { getSession, updateSession, appendRoundToMarkdown } from '../services/storage.js';

const router = Router();

// POST /api/chat - 发送消息，触发模型回复
router.post('/', async (req: Request, res: Response) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    res.status(400).json({ error: 'sessionId and message are required' });
    return;
  }

  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // 解析控场指令
    const command = parseCommand(message);

    // 如果是新话题，更新记录的主题
    if (command.type === 'all' || (session.currentRound === 0 && command.type === 'normal')) {
      session.record.outline.topic = command.content || message;
    }

    // 确定参与模型
    const modelOrder = getModelOrder();
    const participants = getParticipants(command, modelOrder);

    // 增加轮次
    session.currentRound += 1;

    // 执行本轮讨论
    const { messages, updatedRecord } = await executeRound(
      res,
      sessionId,
      message,
      command,
      participants,
      session.record,
      session.currentRound
    );

    // 更新会话
    session.record = updatedRecord;
    updateSession(session);

    // 追加到 Markdown 文件
    appendRoundToMarkdown(sessionId, session.currentRound, messages, updatedRecord);

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.write(`event: error\ndata: ${JSON.stringify({ error: errMsg })}\n\n`);
  }

  res.end();
});

export default router;
