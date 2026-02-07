import { BaseAdapter } from './base.js';
import { ChatMessage } from '../types/index.js';

export class AnthropicAdapter extends BaseAdapter {
  id = 'claude';
  displayName = 'Claude';

  private model = 'claude-sonnet-4-20250514';
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  async *sendMessage(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    stream: boolean;
  }): AsyncGenerator<string> {
    const { systemPrompt, messages, stream } = params;
    const apiKey = this.requireEnv('ANTHROPIC_API_KEY');

    // 转换消息格式为 Anthropic 格式
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: anthropicMessages,
        stream: stream
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
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
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                yield parsed.delta.text;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } else {
      const data = await response.json();
      yield data.content[0].text;
    }
  }
}
