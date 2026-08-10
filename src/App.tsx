import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import OnlineQualityAnalysis from './pages/online-quality-analysis'
import OnlineQualityStandards from './pages/online-quality-standards'
import OnlineTaskList from './pages/online-task-list'
import OnlineAnnotationWorkbench from './pages/online-annotation-workbench'
import OnlineOptimization from './pages/online-optimization'
import keepAlive from './utils/keepAlive'
import './globals.css'
import './styles/typography.css'

function App() {
  useEffect(() => {
    keepAlive.start()
    return () => {
      keepAlive.stop()
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/online-task-list" replace />} />
        <Route path="/online-quality-analysis" element={<OnlineQualityAnalysis />} />
        <Route path="/online-quality-standards" element={<OnlineQualityStandards />} />
        <Route path="/online-task-list" element={<OnlineTaskList />} />
        <Route path="/online-annotation-workbench/:taskId" element={<OnlineAnnotationWorkbench />} />
        <Route path="/online-optimization" element={<OnlineOptimization />} />
        <Route path="*" element={<Navigate to="/online-task-list" replace />} />
      </Routes>
    </Router>
  )
}

export default App
