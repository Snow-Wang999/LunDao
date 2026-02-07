import { Response } from 'express';
import { adapters, getRecorderModel } from '../adapters/index.js';
import { ChatMessage, DiscussionRecord, RoundMessage, ParsedCommand } from '../types/index.js';
import { getDiscussantPrompt, buildContextPrompt } from '../prompts/system.js';
import { getRecorderPrompt } from '../prompts/recorder.js';

// SSE 发送辅助函数
function sendSSE(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// 格式化近期轮次摘要
function formatRecentRounds(record: DiscussionRecord): string {
  return record.recentRounds
    .map(round => {
      const msgs = round.messages
        .map(m => `${m.speaker}: ${m.summary}`)
        .join('\n');
      return `Round ${round.roundNumber}:\n${msgs}`;
    })
    .join('\n\n');
}

// 执行一轮讨论
export async function executeRound(
  res: Response,
  sessionId: string,
  userMessage: string,
  command: ParsedCommand,
  participants: string[],
  record: DiscussionRecord,
  currentRound: number
): Promise<{ messages: RoundMessage[]; updatedRecord: DiscussionRecord }> {
  const roundMessages: RoundMessage[] = [];

  // 添加用户消息
  roundMessages.push({
    speaker: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  });

  // 构造上下文
  const contextPrompt = buildContextPrompt(
    record.outline.topic,
    record.outline.keyDecisions,
    record.outline.openQuestions,
    formatRecentRounds(record)
  );

  // 依次调用每个模型
  for (const modelId of participants) {
    const adapter = adapters[modelId];
    if (!adapter) continue;

    sendSSE(res, 'model_start', { model: modelId });

    try {
      // 构造消息历史
      const messages: ChatMessage[] = [
        { role: 'user', content: contextPrompt + formatCurrentRound(roundMessages) }
      ];

      const systemPrompt = getDiscussantPrompt(adapter.displayName, command.promptInjection);
      let fullText = '';

      // 流式获取回复
      for await (const chunk of adapter.sendMessage({
        systemPrompt,
        messages,
        stream: true
      })) {
        fullText += chunk;
        sendSSE(res, 'model_chunk', { model: modelId, text: chunk });
      }

      // 记录完整回复
      roundMessages.push({
        speaker: modelId,
        content: fullText,
        timestamp: new Date().toISOString()
      });

      sendSSE(res, 'model_done', { model: modelId, fullText });

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      sendSSE(res, 'error', { model: modelId, error: errMsg });
      // 继续下一个模型，不中断
    }
  }

  // 调用记录员更新摘要
  const updatedRecord = await updateRecord(record, roundMessages, currentRound);

  sendSSE(res, 'round_done', {
    roundId: currentRound,
    record: updatedRecord
  });

  return { messages: roundMessages, updatedRecord };
}

// 格式化当前轮次的发言
function formatCurrentRound(messages: RoundMessage[]): string {
  return messages
    .map(m => `**${m.speaker}**: ${m.content}`)
    .join('\n\n');
}

// 调用记录员更新讨论记录
async function updateRecord(
  currentRecord: DiscussionRecord,
  roundMessages: RoundMessage[],
  roundNumber: number
): Promise<DiscussionRecord> {
  const recorder = getRecorderModel();
  const roundMessagesText = roundMessages
    .map(m => `${m.speaker}: ${m.content}`)
    .join('\n\n');

  const prompt = getRecorderPrompt(currentRecord, roundMessagesText);

  try {
    let responseText = '';
    for await (const chunk of recorder.sendMessage({
      systemPrompt: '你是一个 JSON 输出助手，只输出有效的 JSON。',
      messages: [{ role: 'user', content: prompt }],
      stream: false
    })) {
      responseText += chunk;
    }

    // 解析 JSON
    const updatedRecord = JSON.parse(responseText) as DiscussionRecord;
    return updatedRecord;

  } catch (error) {
    console.error('Failed to update record:', error);
    // 如果记录员失败，手动添加本轮摘要
    const newRound = {
      roundNumber,
      participants: roundMessages.filter(m => m.speaker !== 'user').map(m => m.speaker),
      messages: roundMessages.map(m => ({
        speaker: m.speaker,
        summary: m.content.slice(0, 200) + (m.content.length > 200 ? '...' : ''),
        keyPoints: []
      }))
    };

    const recentRounds = [...currentRecord.recentRounds, newRound].slice(-5);

    return {
      ...currentRecord,
      recentRounds
    };
  }
}
