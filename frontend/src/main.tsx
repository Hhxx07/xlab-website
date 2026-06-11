// ===========================================================================
// 应用入口 — src/main.tsx
// 
// 初始化：
//   1. React 18 渲染
//   2. React Router（BrowserRouter 包裹）
//   3. 全局样式（Tailwind CSS）
// 
// 认证恢复：在 App 组件挂载时自动调用 fetchMe() 恢复 session
// ===========================================================================

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
)
