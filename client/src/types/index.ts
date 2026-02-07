// 会话
export interface Session {
  id: string;
  title: string;
  createdAt: string;
  record: DiscussionRecord;
  currentRound: number;
}

// 讨论记录
export interface DiscussionRecord {
  outline: {
    topic: string;
    keyDecisions: string[];
    openQuestions: string[];
    directionChanges: string[];
  };
  recentRounds: RoundSummary[];
}

export interface RoundSummary {
  roundNumber: number;
  participants: string[];
  messages: {
    speaker: string;
    summary: string;
    keyPoints: string[];
  }[];
  controlCommand?: string;
}

// 聊天消息（前端显示用）
export interface ChatMessage {
  id: string;
  speaker: string;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// 模型配置
export interface ModelInfo {
  id: string;
  displayName: string;
  color: string;
  icon: string;
}

// 模型信息（国产模型）
export const MODELS: Record<string, ModelInfo> = {
  user: { id: 'user', displayName: '用户', color: '#6B7280', icon: '👤' },
  glm: { id: 'glm', displayName: 'GLM', color: '#3B82F6', icon: '🔵' },
  kimi: { id: 'kimi', displayName: 'Kimi', color: '#8B5CF6', icon: '🟣' },
  qwen: { id: 'qwen', displayName: 'Qwen', color: '#F59E0B', icon: '🟠' },
};
