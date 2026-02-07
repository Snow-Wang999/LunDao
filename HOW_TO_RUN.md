# LunDao 启动指南

## 每次启动步骤

需要打开 **两个** PowerShell 窗口，分别运行前端和后端。

### 1. 启动后端服务器

```powershell
cd D:\HandDeepResearch_AI\LunDao\server
npm run dev
```

看到以下输出表示成功：
```
🚀 LunDao server running at http://localhost:3001
📝 API endpoints:
   POST /api/sessions - Create session
   GET  /api/sessions - List sessions
   POST /api/chat - Send message (SSE)
```

### 2. 启动前端服务器

打开另一个 PowerShell 窗口：

```powershell
cd D:\HandDeepResearch_AI\LunDao\client
npm run dev
```

看到以下输出表示成功：
```
VITE v5.x.x  ready

➜  Local:   http://localhost:5173/
```

### 3. 访问应用

打开浏览器访问 Vite 显示的地址（通常是 http://localhost:5173）

## 常见问题

### 端口被占用

如果提示 `EADDRINUSE: address already in use`：

```powershell
# 查找占用端口的进程（以3001为例）
netstat -ano | findstr :3001

# 杀掉进程（替换 PID 为实际进程号）
taskkill /F /PID <PID>
```

### 前端端口变化

如果 5173 被占用，Vite 会自动使用 5174、5175 等端口，看终端输出即可。

### API 报错 401

检查 `server/.env` 文件中的 API Key 是否正确，注意：
- 每个 Key 独占一行
- 注释要另起一行，不能写在 Key 后面

## 停止服务

在对应的 PowerShell 窗口按 `Ctrl + C` 即可停止。
