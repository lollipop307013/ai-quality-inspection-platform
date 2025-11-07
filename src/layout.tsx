import { useState, ReactNode, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  Users,
  ClipboardList,
  Database,
  Target,
  FileText,
  User,
  Bell,
  Badge as BadgeIcon,
  UserCheck
} from 'lucide-react'
import { useGlobalStore } from './store/globalStore'
import KeepAliveStatus from './components/KeepAliveStatus'

interface LayoutProps {
  children: ReactNode
}

// 通知数据类型
interface Notification {
  id: string
  type: 'new_task' | 'completed_task' | 'task_assigned'
  title: string
  message: string
  time: string
  isRead: boolean
  taskId?: string
  creator?: string
}

// 模拟通知数据
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'new_task',
    title: '新标注任务',
    message: '您有一个新的标注任务：客服质量专项检查',
    time: '2分钟前',
    isRead: false,
    taskId: 'task_001',
    creator: 'admin'
  },
  {
    id: '2',
    type: 'task_assigned',
    title: '任务分配',
    message: '管理员为您分配了标注任务：CFM游戏对话质检',
    time: '1小时前',
    isRead: false,
    taskId: 'task_002',
    creator: 'manager'
  },
  {
    id: '3',
    type: 'completed_task',
    title: '任务完成',
    message: '标注任务"用户反馈质检"已完成，等待审核',
    time: '3小时前',
    isRead: false,
    taskId: 'task_003',
    creator: 'charliazhang'
  }
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['quality-center'])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const roleDropdownRef = useRef<HTMLDivElement>(null)
  
  // 使用全局状态管理用户角色
  const { currentUser, switchUserRole } = useGlobalStore()

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  const isActive = (path: string) => location.pathname === path
  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId)

  // 通知相关函数
  const getFilteredNotifications = () => {
    const userName = currentUser.name
    
    if (currentUser.role === 'admin') {
      // 管理员：显示所有相关通知
      return notifications.filter(n => 
        (n.type === 'new_task' && (n.creator === userName || !n.creator)) ||
        (n.type === 'completed_task' && n.creator === userName) ||
        n.type === 'task_assigned'
      )
    } else {
      // 标注师：只显示分配给自己的新任务
      return notifications.filter(n => 
        n.type === 'new_task' || n.type === 'task_assigned'
      )
    }
  }

  const getUnreadCount = () => {
    return getFilteredNotifications().filter(n => !n.isRead).length
  }

  const handleNotificationHover = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    )
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const toggleRoleDropdown = () => {
    setShowRoleDropdown(!showRoleDropdown)
  }

  const handleRoleSwitch = (role: 'admin' | 'annotator') => {
    switchUserRole(role)
    setShowRoleDropdown(false)
  }

  // 点击外部关闭下拉面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_task':
        return <ClipboardList className="h-4 w-4 text-blue-500" />
      case 'completed_task':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'task_assigned':
        return <Target className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 thin-scrollbar">
      {/* 左侧导航栏 */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        {/* Logo区域 */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-semibold">私域机器人营销管理</h1>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {/* 质检中心 */}
            <div>
              <button
                onClick={() => toggleMenu('quality-center')}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
              >
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-4 w-4" />
                  质检中心
                </div>
                {isMenuExpanded('quality-center') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isMenuExpanded('quality-center') && (
                <div className="ml-6 mt-2 space-y-1">
                  
                  <Link
                    to="/"
                    className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      isActive('/') 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="mr-3 h-4 w-4" />
                    管理中心
                  </Link>
                  
                  <Link
                    to="/annotation-workbench"
                    className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      isActive('/annotation-workbench') 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Target className="mr-3 h-4 w-4" />
                    标注工作台
                  </Link>

                  {/* 审核相关功能已移除 */}
                  
                  {/* 管理员专用菜单项 */}
                  {currentUser.role === 'admin' && (
                    <>
                      <Link
                        to="/task-center"
                        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          isActive('/task-center') 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <ClipboardList className="mr-3 h-4 w-4" />
                        标注任务中心
                      </Link>
                      
                      <Link
                        to="/quality-standards"
                        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          isActive('/quality-standards') 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <FileText className="mr-3 h-4 w-4" />
                        质检标准配置
                      </Link>
                      
                      <Link
                        to="/auto-quality-inspection"
                        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          isActive('/auto-quality-inspection') 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        自动质检配置
                      </Link>
                      
                      <Link
                        to="/task-template-management"
                        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          isActive('/task-template-management') 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <BadgeIcon className="mr-3 h-4 w-4" />
                        任务模板管理
                      </Link>
                      
                      <Link
                        to="/annotation-type-management"
                        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          isActive('/annotation-type-management') 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        标注类型管理
                      </Link>
                    </>
                  )}

                </div>
              )}
            </div>

            {/* 管理员专用的其他菜单项 */}
            {currentUser.role === 'admin' && (
              <>
                <Link
                  to="/user-management"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/user-management') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Users className="mr-3 h-4 w-4" />
                  用户管理
                </Link>
                
                <Link
                  to="/data-management"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/data-management') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Database className="mr-3 h-4 w-4" />
                  数据管理
                </Link>
                
                <Link
                  to="/system-settings"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/system-settings') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  系统设置
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                <option>穿越火线 (1197)</option>
                <option>王者荣耀 (2341)</option>
                <option>和平精英 (1856)</option>
              </select>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                <option>腾讯QQ渠道</option>
                <option>微信渠道</option>
                <option>官网渠道</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              {/* 通知图标 */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={toggleNotifications}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Bell className="h-5 w-5" />
                </button>
                {/* 通知红点 */}
                {getUnreadCount() > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{getUnreadCount()}</span>
                  </div>
                )}
                
                {/* 通知下拉面板 */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">
                        通知消息 ({currentUser.role === 'admin' ? '管理员' : '标注师'})
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {getFilteredNotifications().length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          暂无通知消息
                        </div>
                      ) : (
                        getFilteredNotifications().map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                            onMouseEnter={() => handleNotificationHover(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 ml-2"></div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200 text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                        查看全部通知
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 用户信息 */}
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">{currentUser.name}</span>
                  <div className="flex items-center space-x-1">
                    <BadgeIcon className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-gray-500">
                      {currentUser.role === 'admin' ? '质检管理员' : '标注师'}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                
                {/* 角色切换下拉菜单 */}
                <div className="relative" ref={roleDropdownRef}>
                  <button 
                    onClick={toggleRoleDropdown}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {showRoleDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                          切换身份
                        </div>
                        <button
                          onClick={() => handleRoleSwitch('admin')}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                            currentUser.role === 'admin'
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          管理员
                          {currentUser.role === 'admin' && (
                            <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </button>
                        <button
                          onClick={() => handleRoleSwitch('annotator')}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                            currentUser.role === 'annotator'
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Target className="mr-2 h-4 w-4" />
                          标注师
                          {currentUser.role === 'annotator' && (
                            <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      
      {/* CloudStudio 保活状态指示器 */}
      <KeepAliveStatus />
    </div>
  )
}