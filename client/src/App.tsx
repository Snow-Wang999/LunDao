import { useState, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { InputBar } from './components/InputBar';
import { RecordPanel } from './components/RecordPanel';
import { StatusBar } from './components/StatusBar';
import { useChat } from './hooks/useChat';
import { Session } from './types';
import { fetchSessions, createSession, getExportUrl } from './utils/api';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const {
    messages,
    record,
    isLoading,
    currentSpeaker,
    send,
    clearMessages,
    setRecord
  } = useChat(currentSession?.id || null);

  // 加载会话列表
  useEffect(() => {
    fetchSessions().then(setSessions);
  }, []);

  // 切换会话时加载记录
  useEffect(() => {
    if (currentSession) {
      setRecord(currentSession.record);
    }
  }, [currentSession, setRecord]);

  // 创建新会话
  const handleCreateSession = async () => {
    if (!newTitle.trim()) return;
    const session = await createSession(newTitle.trim());
    setSessions(prev => [...prev, session]);
    setCurrentSession(session);
    clearMessages();
    setShowNewDialog(false);
    setNewTitle('');
  };

  // 导出
  const handleExport = () => {
    if (currentSession) {
      window.open(getExportUrl(currentSession.id), '_blank');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶栏 */}
      <header className="border-b px-4 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">🧠 论道 LunDao</h1>
          {currentSession && (
            <span className="text-gray-500">| {currentSession.title}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewDialog(true)}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            新讨论
          </button>
          {currentSession && (
            <button
              onClick={handleExport}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              导出
            </button>
          )}
        </div>
      </header>

      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 会话列表 */}
        <div className="w-48 border-r bg-gray-50 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 border-b">会话列表</div>
          {sessions.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">暂无会话</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSession(s);
                  clearMessages();
                }}
                className={`p-3 cursor-pointer hover:bg-gray-100 border-b ${
                  currentSession?.id === s.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-sm font-medium truncate">{s.title}</div>
                <div className="text-xs text-gray-400">
                  Round {s.currentRound}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 聊天区 */}
        <div className="flex-1 flex flex-col">
          {currentSession ? (
            <>
              <ChatPanel messages={messages} />
              <StatusBar currentSpeaker={currentSpeaker} isLoading={isLoading} />
              <InputBar onSend={send} disabled={isLoading} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">🧠</div>
                <p className="text-lg">选择一个会话或创建新讨论</p>
                <button
                  onClick={() => setShowNewDialog(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  开始头脑风暴
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 记录面板 */}
        {currentSession && <RecordPanel record={record} />}
      </div>

      {/* 新建会话对话框 */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">新建讨论</h2>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入讨论主题..."
              className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewDialog(false);
                  setNewTitle('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!newTitle.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
