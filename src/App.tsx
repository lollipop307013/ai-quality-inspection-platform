import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, ReactNode } from 'react'
import Layout from './layout'
import QualityManagementCenter from './pages/quality-management-center'
import AnnotationWorkbench from './pages/annotation-workbench'
import TaskCenter from './pages/task-center'
import SystemConfiguration from './pages/system-configuration'
import AutoQualityInspection from './pages/auto-quality-inspection'
import AnnotationTypeManagement from './pages/annotation-type-management'
import AnnotationTaskTypeManagement from './pages/annotation-task-type-management'
import TaskCreation from './pages/task-creation'
import UserPermissionManagement from './pages/user-permission-management'
import UserManagement from './pages/user-management'
import OnlineQualityAnalysis from './pages/online-quality-analysis'
import OnlineQualityStandards from './pages/online-quality-standards'
import OnlineTaskList from './pages/online-task-list'
import OnlineAnnotationWorkbench from './pages/online-annotation-workbench'
import OnlineOptimization from './pages/online-optimization'
import keepAlive from './utils/keepAlive'
import './globals.css'
import './styles/typography.css'

// online-* 系列页面拥有独立的全屏布局（顶部导航+左侧图标栏），不复用旧版 Layout
const STANDALONE_LAYOUT_PREFIXES = ['/online-']

function ConditionalLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isStandalone = STANDALONE_LAYOUT_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))
  if (isStandalone) {
    return <>{children}</>
  }
  return <Layout>{children}</Layout>
}

function App() {
  // 启动保活服务
  useEffect(() => {
    keepAlive.start();
    
    // 组件卸载时停止保活服务
    return () => {
      keepAlive.stop();
    };
  }, []);

  return (
    <Router>
      <ConditionalLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/online-task-list" replace />} />
          <Route path="/legacy" element={<QualityManagementCenter />} />
          <Route path="/annotation-workbench" element={<AnnotationWorkbench />} />
          <Route path="/task-center" element={<TaskCenter />} />
          <Route path="/quality-standards" element={<SystemConfiguration />} />
          <Route path="/auto-quality-inspection" element={<AutoQualityInspection />} />
          <Route path="/task-template-management" element={<AnnotationTaskTypeManagement />} />
          <Route path="/annotation-type-management" element={<AnnotationTypeManagement />} />
          <Route path="/task-creation" element={<TaskCreation />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/user-permission-management" element={<UserPermissionManagement />} />
          <Route path="/online-quality-analysis" element={<OnlineQualityAnalysis />} />
          <Route path="/online-quality-standards" element={<OnlineQualityStandards />} />
          <Route path="/online-task-list" element={<OnlineTaskList />} />
          <Route path="/online-annotation-workbench/:taskId" element={<OnlineAnnotationWorkbench />} />
          <Route path="/online-optimization" element={<OnlineOptimization />} />
        </Routes>
      </ConditionalLayout>
    </Router>
  )
}

export default App
