import { useState, useCallback } from 'react';
import { ChatMessage, DiscussionRecord } from '../types';
import { sendMessage } from '../utils/api';

interface SSEModelStart {
  model: string;
}

interface SSEModelChunk {
  model: string;
  text: string;
}

interface SSEModelDone {
  model: string;
  fullText: string;
}

interface SSERoundDone {
  roundId: number;
  record: DiscussionRecord;
}

interface SSEError {
  model?: string;
  error: string;
}

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [record, setRecord] = useState<DiscussionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);

  const send = useCallback((text: string) => {
    if (!sessionId || !text.trim()) return;

    setIsLoading(true);

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    // 当前流式消息的临时存储
    const streamingMessages: Record<string, string> = {};

    const cancel = sendMessage(
      sessionId,
      text,
      (event, data) => {
        switch (event) {
          case 'model_start': {
            const { model } = data as SSEModelStart;
            setCurrentSpeaker(model);
            streamingMessages[model] = '';
            // 添加空消息占位
            setMessages(prev => [
              ...prev,
              {
                id: `${model}-${Date.now()}`,
                speaker: model,
                content: '',
                timestamp: new Date().toISOString(),
                isStreaming: true
              }
            ]);
            break;
          }
          case 'model_chunk': {
            const { model, text: chunk } = data as SSEModelChunk;
            streamingMessages[model] = (streamingMessages[model] || '') + chunk;
            // 更新消息内容
            setMessages(prev =>
              prev.map(msg =>
                msg.speaker === model && msg.isStreaming
                  ? { ...msg, content: streamingMessages[model] }
                  : msg
              )
            );
            break;
          }
          case 'model_done': {
            const { model, fullText } = data as SSEModelDone;
            // 标记消息完成
            setMessages(prev =>
              prev.map(msg =>
                msg.speaker === model && msg.isStreaming
                  ? { ...msg, content: fullText, isStreaming: false }
                  : msg
              )
            );
            setCurrentSpeaker(null);
            break;
          }
          case 'round_done': {
            const { record: newRecord } = data as SSERoundDone;
            setRecord(newRecord);
            break;
          }
          case 'error': {
            const { model, error } = data as SSEError;
            console.error(`Error from ${model}:`, error);
            if (model) {
              setMessages(prev =>
                prev.map(msg =>
                  msg.speaker === model && msg.isStreaming
                    ? { ...msg, content: `⚠️ 错误: ${error}`, isStreaming: false }
                    : msg
                )
              );
            }
            break;
          }
        }
      },
      (error) => {
        console.error('Chat error:', error);
        setIsLoading(false);
        setCurrentSpeaker(null);
      },
      () => {
        setIsLoading(false);
        setCurrentSpeaker(null);
      }
    );

    return cancel;
  }, [sessionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setRecord(null);
  }, []);

  return {
    messages,
    record,
    isLoading,
    currentSpeaker,
    send,
    clearMessages,
    setRecord
  };
}
