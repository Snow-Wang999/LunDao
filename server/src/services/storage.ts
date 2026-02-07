import fs from 'fs';
import path from 'path';
import { Session, DiscussionRecord, RoundMessage } from '../types/index.js';
import { createEmptyRecord } from '../prompts/recorder.js';

// 存储目录
const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 生成简单 ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// 获取所有会话
export function getSessions(): Session[] {
  ensureDataDir();
  if (!fs.existsSync(SESSIONS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
  return JSON.parse(data);
}

// 保存会话列表
function saveSessions(sessions: Session[]) {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// 创建新会话
export function createSession(title: string): Session {
  const sessions = getSessions();
  const session: Session = {
    id: generateId(),
    title,
    createdAt: new Date().toISOString(),
    record: createEmptyRecord(title),
    currentRound: 0
  };
  sessions.push(session);
  saveSessions(sessions);

  // 创建对应的 Markdown 文件
  const mdPath = getMarkdownPath(session.id);
  const mdContent = `# 讨论：${title}

创建时间：${new Date().toLocaleString('zh-CN')}

---

`;
  fs.writeFileSync(mdPath, mdContent, 'utf-8');

  return session;
}

// 获取会话
export function getSession(id: string): Session | undefined {
  return getSessions().find(s => s.id === id);
}

// 更新会话
export function updateSession(session: Session) {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index !== -1) {
    sessions[index] = session;
    saveSessions(sessions);
  }
}

// 删除会话
export function deleteSession(id: string) {
  const sessions = getSessions().filter(s => s.id !== id);
  saveSessions(sessions);

  // 删除 Markdown 文件
  const mdPath = getMarkdownPath(id);
  if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
  }
}

// 获取 Markdown 文件路径
function getMarkdownPath(sessionId: string): string {
  return path.join(DATA_DIR, `${sessionId}.md`);
}

// 追加一轮讨论到 Markdown
export function appendRoundToMarkdown(
  sessionId: string,
  roundNumber: number,
  messages: RoundMessage[],
  record: DiscussionRecord
) {
  const mdPath = getMarkdownPath(sessionId);
  if (!fs.existsSync(mdPath)) return;

  let content = `\n## Round ${roundNumber}\n\n`;

  // 添加每条发言
  for (const msg of messages) {
    const speaker = msg.speaker === 'user' ? '👤 用户' : `🤖 ${msg.speaker.toUpperCase()}`;
    content += `**${speaker}**\n\n${msg.content}\n\n`;
  }

  // 添加本轮摘要
  const currentRoundSummary = record.recentRounds.find(r => r.roundNumber === roundNumber);
  if (currentRoundSummary) {
    content += `> 📝 **本轮摘要**：`;
    const keyPoints = currentRoundSummary.messages
      .filter(m => m.keyPoints.length > 0)
      .flatMap(m => m.keyPoints);
    if (keyPoints.length > 0) {
      content += keyPoints.join('；');
    } else {
      content += currentRoundSummary.messages.map(m => m.summary).join(' ');
    }
    content += '\n';
  }

  content += '\n---\n';

  fs.appendFileSync(mdPath, content, 'utf-8');
}

// 读取 Markdown 文件内容
export function getMarkdownContent(sessionId: string): string {
  const mdPath = getMarkdownPath(sessionId);
  if (!fs.existsSync(mdPath)) return '';
  return fs.readFileSync(mdPath, 'utf-8');
}
