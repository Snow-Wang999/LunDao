import { BaseAdapter } from './base.js';
import { ChatMessage } from '../types/index.js';

export class KimiAdapter extends BaseAdapter {
  id = 'kimi';
  displayName = 'Kimi';

  private baseUrl = 'https://api.moonshot.cn/v1/chat/completions';

  async *sendMessage(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    stream: boolean;
  }): AsyncGenerator<string> {
    const { systemPrompt, messages, stream } = params;
    const apiKey = this.requireEnv('MOONSHOT_API_KEY');
    const model = this.getEnv('MOONSHOT_MODEL') || 'moonshot-v1-8k';

    // Kimi 兼容 OpenAI 格式
    const kimiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: kimiMessages,
        stream: stream
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${error}`);
    }

    if (stream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } else {
      const data = await response.json();
      yield data.choices[0].message.content;
    }
  }
}
