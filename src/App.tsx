import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
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
import keepAlive from './utils/keepAlive'
import './globals.css'
import './styles/typography.css'

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
      <Layout>
        <Routes>
          <Route path="/" element={<QualityManagementCenter />} />
          <Route path="/annotation-workbench" element={<AnnotationWorkbench />} />
          <Route path="/task-center" element={<TaskCenter />} />
          <Route path="/quality-standards" element={<SystemConfiguration />} />
          <Route path="/auto-quality-inspection" element={<AutoQualityInspection />} />
          <Route path="/task-template-management" element={<AnnotationTaskTypeManagement />} />
          <Route path="/annotation-type-management" element={<AnnotationTypeManagement />} />
          <Route path="/task-creation" element={<TaskCreation />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/user-permission-management" element={<UserPermissionManagement />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App