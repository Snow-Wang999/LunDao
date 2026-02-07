import { MODELS } from '../types';

interface Props {
  currentSpeaker: string | null;
  isLoading: boolean;
}

const MODEL_IDS = ['glm', 'kimi', 'qwen'];

export function StatusBar({ currentSpeaker, isLoading }: Props) {
  return (
    <div className="border-t bg-gray-50 px-4 py-2 flex items-center gap-4">
      <span className="text-xs text-gray-500">模型状态:</span>
      <div className="flex gap-3">
        {MODEL_IDS.map((id) => {
          const model = MODELS[id];
          const isActive = currentSpeaker === id;
          const status = isActive ? '发言中' : isLoading ? '等待' : '就绪';

          return (
            <div
              key={id}
              className={`flex items-center gap-1 text-xs ${
                isActive ? 'font-bold' : 'text-gray-500'
              }`}
            >
              <span>{model.icon}</span>
              <span>{model.displayName}</span>
              {isActive && (
                <span className="animate-pulse text-blue-500">●</span>
              )}
              <span className="text-gray-400">({status})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
