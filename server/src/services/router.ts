import { ParsedCommand } from '../types/index.js';
import { COMMAND_INJECTIONS } from '../prompts/system.js';

// 解析用户消息中的控场指令
export function parseCommand(message: string): ParsedCommand {
  // @all 新话题
  if (message.startsWith('@all ')) {
    return {
      type: 'all',
      content: message.slice(5).replace(/^新话题[：:]\s*/, ''),
      promptInjection: COMMAND_INJECTIONS.all
    };
  }

  // @深入
  if (message.startsWith('@深入')) {
    return {
      type: 'deep',
      content: message.slice(3).trim(),
      promptInjection: COMMAND_INJECTIONS.deep
    };
  }

  // @挑战
  if (message.startsWith('@挑战')) {
    return {
      type: 'challenge',
      content: message.slice(3).trim(),
      promptInjection: COMMAND_INJECTIONS.challenge
    };
  }

  // @总结
  if (message.trim() === '@总结') {
    return {
      type: 'summary',
      content: '',
      promptInjection: COMMAND_INJECTIONS.summary
    };
  }

  // @跳过
  if (message.startsWith('@跳过')) {
    return {
      type: 'skip',
      content: '',
      targetModel: message.slice(3).trim().toLowerCase()
    };
  }

  // @模型名 格式（指定模型回复）
  const directMatch = message.match(/^@(glm|kimi|qwen)\s+(.*)/i);
  if (directMatch) {
    return {
      type: 'direct',
      content: directMatch[2],
      targetModel: directMatch[1].toLowerCase()
    };
  }

  // 普通消息
  return {
    type: 'normal',
    content: message
  };
}

// 根据指令确定参与模型
export function getParticipants(
  command: ParsedCommand,
  defaultOrder: string[]
): string[] {
  switch (command.type) {
    case 'summary':
      // 总结只需要记录员
      return [];
    case 'skip':
      // 跳过指定模型
      return defaultOrder.filter(m => m !== command.targetModel);
    case 'direct':
      // 只有指定模型回复
      return command.targetModel ? [command.targetModel] : defaultOrder;
    default:
      // 所有模型参与
      return defaultOrder;
  }
}
