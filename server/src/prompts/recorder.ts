import { DiscussionRecord } from '../types/index.js';

// 记录员的 system prompt
export function getRecorderPrompt(
  currentRecord: DiscussionRecord,
  roundMessages: string,
  recentRoundsLimit: number = 5
): string {
  return `你是本次头脑风暴的记录员。你的任务是在每轮讨论结束后更新讨论记录。

当前讨论记录：
${JSON.stringify(currentRecord, null, 2)}

本轮所有发言：
${roundMessages}

请根据本轮讨论更新记录，输出更新后的完整 JSON。规则：
1. outline.topic: 如果是新话题则更新，否则保持
2. outline.keyDecisions: 记录已形成共识的结论
3. outline.openQuestions: 记录尚未解决或有争议的问题
4. outline.directionChanges: 记录讨论方向的重大转变
5. recentRounds: 保留最近 ${recentRoundsLimit} 轮，新增本轮摘要
6. 如果 recentRounds 超出 ${recentRoundsLimit} 轮，将最早的一轮要点合并进 outline
7. 每条发言摘要控制在 1-3 句话，提取核心观点

请只输出有效的 JSON，不要有其他内容，不要用 markdown 代码块包裹。`;
}

// 初始化空的讨论记录
export function createEmptyRecord(topic: string = ''): DiscussionRecord {
  return {
    outline: {
      topic,
      keyDecisions: [],
      openQuestions: [],
      directionChanges: []
    },
    recentRounds: []
  };
}
