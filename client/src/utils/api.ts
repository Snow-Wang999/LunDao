import { Session } from '../types';

const API_BASE = '/api';

// 获取所有会话
export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  return res.json();
}

// 创建新会话
export async function createSession(title: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  return res.json();
}

// 获取会话详情
export async function fetchSession(id: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions/${id}`);
  return res.json();
}

// 删除会话
export async function deleteSession(id: string): Promise<void> {
  await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
}

// 发送消息（返回 EventSource 用于接收 SSE）
export function sendMessage(
  sessionId: string,
  message: string,
  onEvent: (event: string, data: unknown) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): () => void {
  const controller = new AbortController();

  fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
    signal: controller.signal
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7);
        } else if (line.startsWith('data: ') && currentEvent) {
          try {
            const data = JSON.parse(line.slice(6));
            onEvent(currentEvent, data);
          } catch {
            // 忽略解析错误
          }
          currentEvent = '';
        }
      }
    }

    onComplete();
  }).catch((error) => {
    if (error.name !== 'AbortError') {
      onError(error);
    }
  });

  // 返回取消函数
  return () => controller.abort();
}

// 导出 Markdown
export function getExportUrl(sessionId: string): string {
  return `${API_BASE}/sessions/${sessionId}/export`;
}
