// 聊天消息
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 模型适配器接口
export interface ModelAdapter {
  id: string;
  displayName: string;
  sendMessage(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    stream: boolean;
  }): AsyncGenerator<string>;
}

// 讨论记录结构
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

// 控场指令
export interface ParsedCommand {
  type: 'all' | 'deep' | 'challenge' | 'summary' | 'skip' | 'direct' | 'normal';
  content: string;
  targetModel?: string;
  promptInjection?: string;
}

// 会话
export interface Session {
  id: string;
  title: string;
  createdAt: string;
  record: DiscussionRecord;
  currentRound: number;
}

// 单轮发言
export interface RoundMessage {
  speaker: string;
  content: string;
  timestamp: string;
}
