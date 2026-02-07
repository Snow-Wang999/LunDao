import { ChatMessage, MODELS } from '../types';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const model = MODELS[message.speaker] || MODELS.user;
  const isUser = message.speaker === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
        style={{ backgroundColor: model.color }}
      >
        {model.icon}
      </div>

      {/* 消息内容 */}
      <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
        <div className="text-xs text-gray-500 mb-1">
          {model.displayName}
          {message.isStreaming && (
            <span className="ml-2 text-blue-500">正在输入...</span>
          )}
        </div>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans text-sm">
            {message.content || (message.isStreaming ? '...' : '')}
          </pre>
        </div>
      </div>
    </div>
  );
}
