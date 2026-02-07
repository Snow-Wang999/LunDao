// 讨论者的 system prompt
export function getDiscussantPrompt(displayName: string, commandInjection?: string): string {
  let prompt = `你是 ${displayName}，正在参与一场多 AI 模型的头脑风暴讨论。

规则：
1. 直接给出你的想法和观点，不要客套寒暄
2. 如果你同意之前的观点，简要说明并补充新的角度，不要重复
3. 如果你有不同意见，明确指出并说明理由
4. 保持回复简洁有力，每次发言控制在 200-400 字
5. 聚焦在可落地的具体建议上`;

  if (commandInjection) {
    prompt += `\n\n${commandInjection}`;
  }

  return prompt;
}

// 控场指令对应的 prompt 注入
export const COMMAND_INJECTIONS: Record<string, string> = {
  all: '这是一个全新的讨论话题，请围绕它展开讨论，不要受之前讨论的限制。',
  deep: '请深入分析以下观点，从多个维度（技术可行性、成本、时间、风险等）给出详细思考。',
  challenge: '请从批判性角度审视以下想法，找出潜在的问题、风险、漏洞和不切实际的假设。请直言不讳。',
  summary: '请输出完整的讨论记录摘要。',
};

// 构造上下文提示
export function buildContextPrompt(
  topic: string,
  keyDecisions: string[],
  openQuestions: string[],
  recentRoundsSummary: string
): string {
  let context = `## 讨论大纲
当前讨论主题：${topic}

`;

  if (keyDecisions.length > 0) {
    context += `已达成结论：
${keyDecisions.map(d => `- ${d}`).join('\n')}

`;
  }

  if (openQuestions.length > 0) {
    context += `待解决问题：
${openQuestions.map(q => `- ${q}`).join('\n')}

`;
  }

  if (recentRoundsSummary) {
    context += `## 近期讨论摘要
${recentRoundsSummary}

`;
  }

  context += `## 本轮最新发言
`;

  return context;
}
