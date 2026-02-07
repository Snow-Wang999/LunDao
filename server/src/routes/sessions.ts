import { Router, Request, Response } from 'express';
import {
  getSessions,
  getSession,
  createSession,
  deleteSession,
  getMarkdownContent
} from '../services/storage.js';

const router = Router();

// GET /api/sessions - 列出所有会话
router.get('/', (_req: Request, res: Response) => {
  const sessions = getSessions();
  res.json(sessions);
});

// POST /api/sessions - 创建新会话
router.post('/', (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const session = createSession(title);
  res.json(session);
});

// GET /api/sessions/:id - 获取会话详情
router.get('/:id', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(session);
});

// DELETE /api/sessions/:id - 删除会话
router.delete('/:id', (req: Request, res: Response) => {
  deleteSession(req.params.id);
  res.json({ success: true });
});

// GET /api/sessions/:id/export - 导出 Markdown
router.get('/:id/export', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const content = getMarkdownContent(req.params.id);
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${session.title}.md"`);
  res.send(content);
});

// GET /api/sessions/:id/record - 获取讨论记录
router.get('/:id/record', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(session.record);
});

export default router;
