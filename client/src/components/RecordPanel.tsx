import { DiscussionRecord } from '../types';

interface Props {
  record: DiscussionRecord | null;
}

export function RecordPanel({ record }: Props) {
  if (!record) {
    return (
      <div className="w-80 border-l bg-gray-50 p-4 flex flex-col">
        <h2 className="font-bold text-lg mb-4">📋 讨论记录</h2>
        <div className="text-gray-400 text-sm">
          讨论开始后，这里会显示摘要
        </div>
      </div>
    );
  }

  const { outline, recentRounds } = record;

  return (
    <div className="w-80 border-l bg-gray-50 p-4 flex flex-col overflow-y-auto">
      <h2 className="font-bold text-lg mb-4">📋 讨论记录</h2>

      {/* 大纲 */}
      <div className="mb-6">
        <h3 className="font-semibold text-sm text-gray-600 mb-2">📍 主题</h3>
        <p className="text-sm">{outline.topic || '(未设定)'}</p>
      </div>

      {outline.keyDecisions.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm text-gray-600 mb-2">✅ 关键结论</h3>
          <ul className="text-sm space-y-1">
            {outline.keyDecisions.map((d, i) => (
              <li key={i} className="text-gray-700">• {d}</li>
            ))}
          </ul>
        </div>
      )}

      {outline.openQuestions.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm text-gray-600 mb-2">❓ 待解决</h3>
          <ul className="text-sm space-y-1">
            {outline.openQuestions.map((q, i) => (
              <li key={i} className="text-gray-700">• {q}</li>
            ))}
          </ul>
        </div>
      )}

      {outline.directionChanges.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm text-gray-600 mb-2">🔄 方向变化</h3>
          <ul className="text-sm space-y-1">
            {outline.directionChanges.map((c, i) => (
              <li key={i} className="text-gray-700">• {c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 近期轮次 */}
      {recentRounds.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-2">📝 近期讨论</h3>
          <div className="space-y-3">
            {recentRounds.slice().reverse().map((round) => (
              <div key={round.roundNumber} className="bg-white rounded p-2 text-xs">
                <div className="font-semibold text-gray-600 mb-1">
                  Round {round.roundNumber}
                </div>
                {round.messages.map((msg, i) => (
                  <div key={i} className="text-gray-600 mb-1">
                    <span className="font-medium">{msg.speaker}:</span>{' '}
                    {msg.summary}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
