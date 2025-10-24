import React, { useState, useEffect } from 'react'

// 定义任务类型接口
interface Task {
  id: number
  name: string
  description: string
  status: string
  totalCount: number
  completedCount: number
  errorRate: string
  similarity: string
  channel: string
  annotators: Array<{
    name: string
    assigned: number
    completed: number
  }>
  createdAt: string
  deadline: string
  creator: string
  taskType: string
  botId: string
  replyType: string
  riskLevel: string
  baseName?: string
  periodicHistory?: any[]
  executionDate?: string
}

// 定义统计数据接口
interface TaskStatistics {
  annotationType: string
  statistics: {
    totalAnnotated: number
    highRiskRate?: number
    excellentRate?: number
    qualifiedRate?: number
    averageScore?: number
    errorDistribution?: Record<string, number>
    goodRate?: number
    poorRate?: number
    averageQuality?: number
    sceneDistribution?: Record<string, number>
    accuracyRate?: number
  }
}
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, Search, MoreHorizontal, Play, Pause, Download, BarChart3, Calendar, Users, Clock, CheckCircle, AlertTriangle, ChevronDown, Target, TrendingUp, Activity, FolderOpen, Bell, Trash2, X, Settings, Eye, PieChart, DollarSign, ClipboardCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import TaskCreationDialog from '../components/task-creation-dialog-clean.tsx'

// 生成标注人员数据
function generateAnnotators() {
  const allAnnotators = ['张三', '李四', '王五', '赵六', '小明', '小红', '小刚', '小丽']
  const count = Math.floor(Math.random() * 6) + 1 // 1-6个标注员
  const selected: Array<{name: string, assigned: number, completed: number}> = []
  for (let i = 0; i < count; i++) {
    const annotator = allAnnotators[Math.floor(Math.random() * allAnnotators.length)]
    if (!selected.find(a => a.name === annotator)) {
      selected.push({
        name: annotator,
        assigned: Math.floor(Math.random() * 200) + 50,
        completed: Math.floor(Math.random() * 150) + 20
      })
    }
  }
  return selected
}

// 生成周期任务历史记录
function generatePeriodicTaskHistory(baseName: string, count: number = 5) {
  return Array.from({length: count}, (_, i) => {
    const totalCount = Math.floor(Math.random() * 1000) + 100
    const completedCount = Math.min(Math.floor(Math.random() * totalCount), totalCount)
    const date = new Date(2025, 0, i * 7 + 1) // 每周一次
    
    return {
      id: `${baseName}_${i + 1}`,
      name: `${baseName}${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`,
      description: `周期性质检任务 - 第${i + 1}次执行`,
      status: i === 0 ? 'running' : ['completed', 'paused'][Math.floor(Math.random() * 2)],
      totalCount,
      completedCount,
      errorRate: (Math.random() * 30).toFixed(1),
      similarity: (Math.random() * 20 + 80).toFixed(1),
      channel: ['企微私人好友', 'QQ私人好友', 'SDK', '游戏内H5', '小程序'][Math.floor(Math.random() * 5)],
      annotators: generateAnnotators(),
      createdAt: date.toLocaleDateString(),
      deadline: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      taskType: 'periodic',
      botId: `bot_${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      replyType: ['auto', 'manual', 'mixed'][Math.floor(Math.random() * 3)],
      riskLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      executionDate: date.toLocaleDateString()
    }
  })
}

// 创建人列表
const creators = ['charliazhang', 'admin', 'manager', '张三', '李四', '王五']

// 模拟统计数据 - 基于标注类型的统计信息
const mockTaskStatistics = {
  1: { // 任务ID为1的统计数据
    annotationType: 'error_code',
    statistics: {
      totalAnnotated: 156,
      highRiskRate: 12.8,
      excellentRate: 72.4,
      qualifiedRate: 87.2,
      averageScore: 8.1,
      errorDistribution: {
        '#33001': 8,
        '#33003': 5,
        '#32101': 3,
        '#30201': 4
      }
    }
  },
  2: {
    annotationType: 'dialogue_quality',
    statistics: {
      totalAnnotated: 89,
      excellentRate: 67.4,
      goodRate: 25.8,
      poorRate: 6.8,
      averageQuality: 7.9
    }
  },
  3: {
    annotationType: 'message_scene',
    statistics: {
      totalAnnotated: 234,
      sceneDistribution: {
        '闲聊': 45,
        '攻略': 67,
        '消费': 34,
        '投诉': 12,
        '咨询': 76
      },
      accuracyRate: 94.2
    }
  }
}

// 模拟任务数据 - 根据用户反馈更新
const mockTasks: Task[] = Array.from({length: 156}, (_, i) => {
  const totalCount = Math.floor(Math.random() * 1000) + 100
  const completedCount = Math.min(Math.floor(Math.random() * totalCount), totalCount) // 确保完成数不超过总数
  
  const isPeriodicTask = i % 5 === 0
  const baseName = isPeriodicTask ? `自动质检` : `质检任务${i + 1}`
  
  const task = {
    id: i + 1,
    name: isPeriodicTask ? `${baseName}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}` : baseName,
    baseName: isPeriodicTask ? baseName : undefined, // 周期任务的基础名称
    description: isPeriodicTask ? `周期性质检任务` : `这是第${i + 1}个质检任务的描述`,
    status: ['running', 'completed', 'paused', 'pending'][Math.floor(Math.random() * 4)],
    totalCount,
    completedCount,
    errorRate: (Math.random() * 30).toFixed(1),
    similarity: (Math.random() * 20 + 80).toFixed(1),
    channel: ['企微私人好友', 'QQ私人好友', 'SDK', '游戏内H5', '小程序'][Math.floor(Math.random() * 5)],
    annotators: generateAnnotators(),
    createdAt: new Date(2025, 0, Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
    deadline: new Date(2025, 1, Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
    creator: creators[Math.floor(Math.random() * creators.length)], // 添加创建人信息
    taskType: isPeriodicTask ? 'periodic' : 'single', // 周期性任务或单次任务
    botId: `bot_${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
    replyType: ['auto', 'manual', 'mixed'][Math.floor(Math.random() * 3)],
    riskLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
    // 周期任务的历史记录
    periodicHistory: isPeriodicTask ? generatePeriodicTaskHistory(baseName) : undefined
  }
  
  return task
})

const statusConfig = {
  running: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: Play },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  pending: { label: '待开始', color: 'bg-gray-100 text-gray-800', icon: Clock }
}

// 渠道配置
const channelConfig = {
  '企微私人好友': { color: 'bg-green-100 text-green-800', icon: '💬' },
  'QQ私人好友': { color: 'bg-blue-100 text-blue-800', icon: '🐧' },
  'SDK': { color: 'bg-purple-100 text-purple-800', icon: '⚙️' },
  '游戏内H5': { color: 'bg-orange-100 text-orange-800', icon: '🎮' },
  '小程序': { color: 'bg-pink-100 text-pink-800', icon: '📱' }
}

// 回复类型配置
const replyTypeConfig = {
  auto: { label: '自动回复', color: 'bg-blue-100 text-blue-800' },
  manual: { label: '人工回复', color: 'bg-green-100 text-green-800' },
  mixed: { label: '混合回复', color: 'bg-purple-100 text-purple-800' }
}

// 风险等级配置
const riskLevelConfig = {
  high: { label: '高风险', color: 'bg-red-100 text-red-800' },
  medium: { label: '中风险', color: 'bg-yellow-100 text-yellow-800' },
  low: { label: '低风险', color: 'bg-green-100 text-green-800' }
}

export default function TaskCenter() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState(mockTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [taskTypeFilter, setTaskTypeFilter] = useState('all')
  const [replyTypeFilter, setReplyTypeFilter] = useState('all')
  const [riskLevelFilter, setRiskLevelFilter] = useState('all')
  const [botIdFilter, setBotIdFilter] = useState('')
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [showTaskDetailDialog, setShowTaskDetailDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [expandedPeriodicTask, setExpandedPeriodicTask] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(true) // 模拟管理员权限
  const [hasNotification, setHasNotification] = useState(true) // 模拟通知状态
  
  // 任务配置修改相关状态
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  // 创建任务弹窗状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  // 检测URL参数，自动打开创建任务弹窗
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create') {
      setShowCreateDialog(true)
      // 清除URL参数，避免刷新页面时重复打开弹窗
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  // 处理任务创建
  const handleTaskCreated = (newTask: any) => {
    setTasks(prevTasks => [newTask, ...prevTasks])
  }

  // 处理周期任务展开/收起
  const handleTogglePeriodicTask = (taskId: number) => {
    setExpandedPeriodicTask(expandedPeriodicTask === taskId ? null : taskId)
  }

  // 处理删除任务
  const handleDeleteTask = (taskId: number) => {
    if (!isAdmin) {
      alert('只有管理员可以删除任务')
      return
    }
    if (confirm('确定要删除这个任务吗？')) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    }
  }

  // 处理修改任务配置
  const handleEditTaskConfig = (task: any) => {
    if (!isAdmin) {
      alert('只有管理员可以修改任务配置')
      return
    }
    setEditingTask(task)
    setShowConfigDialog(true)
  }

  // 处理导出历史任务结果
  const handleExportHistoryTask = (historyTask: any, parentTask: any) => {
    console.log('导出历史任务结果:', historyTask.id, '来自周期任务:', parentTask.baseName)
    alert(`正在导出历史任务 "${historyTask.name}" 的标注结果...`)
  }

  // 过滤和搜索
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.annotators.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesChannel = channelFilter === 'all' || task.channel === channelFilter
    
    return matchesSearch && matchesStatus && matchesChannel
  })

  // 分页
  const totalPages = Math.ceil(filteredTasks.length / pageSize)
  const currentTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleCreateTask = (taskData: any) => {
    console.log('创建任务:', taskData)
    // 这里可以添加实际的任务创建逻辑
    alert(`任务 "${taskData.name}" 创建成功！`)
  }

  const handleExportResults = (task: any) => {
    console.log('导出任务结果:', task.id)
    alert(`正在导出任务 "${task.name}" 的标注结果...`)
  }



  const handleChangeTaskStatus = (task: any, newStatus: string) => {
    console.log('修改任务状态:', task.id, newStatus)
    task.status = newStatus
  }

  const handleViewStats = (task: any) => {
    setSelectedTask(task)
    setShowStatsDialog(true)
  }

  const handleViewTaskDetail = (task: any) => {
    setSelectedTask(task)
    setShowTaskDetailDialog(true)
  }

  const canExport = (task: any) => {
    return task.status === 'completed' || task.status === 'paused'
  }

  // 进入审核模式
  const handleEnterReview = (task: any, mode: 'cross' | 'distributed', annotatorId?: string) => {
    const params = new URLSearchParams({
      taskId: task.id.toString(),
      mode: mode
    })
    
    if (annotatorId) {
      params.append('annotatorId', annotatorId)
    }
    
    navigate(`/review-workbench?${params.toString()}`)
  }

  // 判断任务是否可以进入审核
  const canReview = (task: any) => {
    return task.status === 'completed' || task.status === 'paused' || task.status === 'running'
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和操作 */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="page-title">质检任务中心</h1>
            <p className="secondary-text mt-2">管理和监控所有质检任务</p>
          </div>
          
          {/* 任务创建弹窗 */}
          <TaskCreationDialog 
            onTaskCreated={(newTask) => {
              handleTaskCreated(newTask)
              setShowCreateDialog(false)
            }}
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
          >
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm px-6 py-2.5 rounded-lg font-medium">
              <Plus className="w-4 h-4 mr-2" />
              创建任务
            </Button>
          </TaskCreationDialog>
        </div>

        {/* 任务配置修改弹窗 */}
        {showConfigDialog && editingTask && (
          <TaskCreationDialog 
            onTaskCreated={(updatedTask) => {
              // 更新任务配置
              setTasks(prevTasks => prevTasks.map(task => 
                task.id === editingTask.id ? { ...task, ...updatedTask } : task
              ))
              setShowConfigDialog(false)
              setEditingTask(null)
              alert(`任务 "${updatedTask.name}" 配置更新成功！`)
            }}
            editingTask={editingTask}
            isEditMode={true}
            open={showConfigDialog}
            onOpenChange={(open: boolean) => {
              setShowConfigDialog(open)
              if (!open) {
                setEditingTask(null)
              }
            }}
          >
            <div></div>
          </TaskCreationDialog>
        )}

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-12">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索任务名称、描述或标注人员..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="running">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="paused">已暂停</SelectItem>
                <SelectItem value="pending">待开始</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="渠道" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部渠道</SelectItem>
                <SelectItem value="企微私人好友">企微私人好友</SelectItem>
                <SelectItem value="QQ私人好友">QQ私人好友</SelectItem>
                <SelectItem value="SDK">SDK</SelectItem>
                <SelectItem value="游戏内H5">游戏内H5</SelectItem>
                <SelectItem value="小程序">小程序</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-gray-600">
              共 {filteredTasks.length} 个任务
            </div>
          </div>
        </div>

        {/* 任务列表 - 卡片式设计 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentTasks.map((task) => {
            const StatusIcon = statusConfig[task.status as keyof typeof statusConfig].icon
            const progress = Math.min(Math.round((task.completedCount / task.totalCount) * 100), 100)
            const isPeriodicTask = task.taskType === 'periodic'
            
            return (
              <React.Fragment key={task.id}>
                <div 
                  className={`rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${
                    isPeriodicTask 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg' 
                      : 'bg-white border-gray-100 hover:shadow-md'
                  }`}
                >
                  {/* 卡片头部 */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className={`flex items-center space-x-3 ${isPeriodicTask ? 'cursor-pointer hover:bg-blue-100/50 -mx-2 px-2 py-1 rounded-lg transition-colors' : ''}`}
                        onClick={isPeriodicTask ? () => handleTogglePeriodicTask(task.id) : undefined}
                      >
                        {isPeriodicTask && (
                          <FolderOpen className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {isPeriodicTask ? task.baseName : task.name}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-1 rounded-md shrink-0 ${
                            isPeriodicTask 
                              ? 'border-blue-300 text-blue-700 bg-blue-50' 
                              : 'border-gray-200'
                          }`}
                        >
                          {task.taskType === 'periodic' ? '周期任务' : '单次任务'}
                        </Badge>
                        {isPeriodicTask && (
                          <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${expandedPeriodicTask === task.id ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="w-4 h-4 text-gray-500" />
                        <Badge className={`${statusConfig[task.status as keyof typeof statusConfig].color} px-3 py-1 text-xs font-medium rounded-full shrink-0`}>
                          {statusConfig[task.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{task.description}</p>
                    
                    {/* 进度条 */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">完成进度</span>
                        <span className="font-semibold text-gray-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.completedCount} / {task.totalCount} 已完成
                      </div>
                    </div>
                  </div>
                  
                  {/* 卡片信息区域 */}
                  <div className="px-6 pb-4 space-y-3">
                    {/* 渠道信息 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">渠道</span>
                      <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">
                        {task.channel}
                      </Badge>
                    </div>
                    
                    {/* 标注人员 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">标注人员</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-1">
                          {task.annotators.slice(0, 3).map((annotator, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 border-2 border-white"
                              title={annotator.name}
                            >
                              {annotator.name.charAt(0)}
                            </div>
                          ))}
                          {task.annotators.length > 3 && (
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                              +{task.annotators.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {task.annotators.length}人
                        </span>
                      </div>
                    </div>
                    
                    {/* 创建人信息 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">创建人</span>
                      <div className="text-xs text-gray-600 flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{task.creator}</span>
                      </div>
                    </div>
                    
                    {/* 时间信息 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">创建时间</span>
                      <div className="text-xs text-gray-600 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{task.createdAt}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">截止时间</span>
                      <div className="text-xs text-gray-600 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.deadline}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 卡片底部操作区域 */}
                  <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400 font-mono">#{task.id}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTaskDetail(task)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 h-auto p-1"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          查看详情
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-1">

                        
                        {canExport(task) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportResults(task)}
                            className="h-8 w-8 p-0 hover:bg-green-50 rounded-lg"
                            title="导出结果"
                          >
                            <Download className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg">
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-gray-100">
                            {task.status === 'running' && (
                              <DropdownMenuItem onClick={() => handleChangeTaskStatus(task, 'paused')} className="rounded-lg">
                                <Pause className="w-4 h-4 mr-2" />
                                暂停任务
                              </DropdownMenuItem>
                            )}
                            {task.status === 'paused' && (
                              <DropdownMenuItem onClick={() => handleChangeTaskStatus(task, 'running')} className="rounded-lg">
                                <Play className="w-4 h-4 mr-2" />
                                继续任务
                              </DropdownMenuItem>
                            )}
                            {(task.status === 'running' || task.status === 'paused') && (
                              <DropdownMenuItem onClick={() => handleChangeTaskStatus(task, 'completed')} className="rounded-lg">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                标记完成
                              </DropdownMenuItem>
                            )}
                            {canReview(task) && (
                              <>
                                <DropdownMenuItem onClick={() => handleEnterReview(task, 'cross')} className="rounded-lg">
                                  <ClipboardCheck className="w-4 h-4 mr-2" />
                                  交叉审核
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEnterReview(task, 'distributed')} className="rounded-lg">
                                  <ClipboardCheck className="w-4 h-4 mr-2" />
                                  分散审核
                                </DropdownMenuItem>
                              </>
                            )}
                            {isAdmin && (
                              <DropdownMenuItem onClick={() => handleEditTaskConfig(task)} className="rounded-lg">
                                <Settings className="w-4 h-4 mr-2" />
                                修改配置
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTask(task.id)
                              }} 
                              className="rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除任务
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>

                
                {/* 周期任务展开区域 - 苹果风格分组设计 */}
                {isPeriodicTask && expandedPeriodicTask === task.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center p-8 overlay-fade-in" onClick={() => setExpandedPeriodicTask(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden modal-fade-in" onClick={(e) => e.stopPropagation()}>
                      {/* 头部 */}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FolderOpen className="w-6 h-6" />
                            <div>
                              <h3 className="text-xl font-semibold">{task.baseName}</h3>
                              <p className="text-blue-100 text-sm">历史执行记录 ({task.periodicHistory?.length || 0} 个任务)</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setExpandedPeriodicTask(null)}
                            className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* 内容区域 */}
                      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] thin-scrollbar">
                        {/* 网格布局 - 与外部任务列表保持一致的样式 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {task.periodicHistory?.map((historyTask: any, index: number) => {
                            const StatusIcon = statusConfig[historyTask.status as keyof typeof statusConfig].icon
                            const historyProgress = Math.min(Math.round((historyTask.completedCount / historyTask.totalCount) * 100), 100)
                            
                            return (
                              <div 
                                key={historyTask.id} 
                                className="rounded-xl shadow-sm border transition-all duration-300 overflow-hidden bg-white border-gray-100 hover:shadow-md fade-in-up"
                                style={{ 
                                  animationDelay: `${index * 50}ms`
                                }}
                              >
                                {/* 卡片头部 - 与外部任务卡片保持一致 */}
                                <div className="p-6 pb-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                          {historyTask.name}
                                        </h3>
                                        <Badge variant="outline" className="text-xs px-2 py-1 rounded-md shrink-0 border-gray-200 mt-1">
                                          历史任务
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <StatusIcon className="w-4 h-4 text-gray-500" />
                                      <Badge className={`${statusConfig[historyTask.status as keyof typeof statusConfig].color} px-3 py-1 text-xs font-medium rounded-full shrink-0`}>
                                        {statusConfig[historyTask.status as keyof typeof statusConfig].label}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{historyTask.description}</p>
                                  
                                  {/* 进度条 - 与外部任务卡片保持一致 */}
                                  <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500 font-medium">完成进度</span>
                                      <span className="font-semibold text-gray-900">{historyProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${historyProgress}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {historyTask.completedCount} / {historyTask.totalCount} 已完成
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 卡片信息区域 - 与外部任务卡片保持一致 */}
                                <div className="px-6 pb-4 space-y-3">
                                  {/* 渠道信息 */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">渠道</span>
                                    <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">
                                      {historyTask.channel}
                                    </Badge>
                                  </div>
                                  
                                  {/* 标注人员 */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">标注人员</span>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex -space-x-1">
                                        {historyTask.annotators.slice(0, 3).map((annotator: any, aIndex: number) => (
                                          <div
                                            key={aIndex}
                                            className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 border-2 border-white"
                                            title={annotator.name}
                                          >
                                            {annotator.name.charAt(0)}
                                          </div>
                                        ))}
                                        {historyTask.annotators.length > 3 && (
                                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                                            +{historyTask.annotators.length - 3}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {historyTask.annotators.length}人
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* 执行日期 */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">执行日期</span>
                                    <div className="text-xs text-gray-600 flex items-center space-x-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{historyTask.executionDate}</span>
                                    </div>
                                  </div>
                                  
                                  {/* 截止时间 */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">截止时间</span>
                                    <div className="text-xs text-gray-600 flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{historyTask.deadline}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 卡片底部操作区域 - 与外部任务卡片保持一致 */}
                                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-400 font-mono">#{historyTask.id}</span>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center font-medium transition-colors duration-200">
                                            查看详情 <ChevronDown className="w-3 h-3 ml-1" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto thin-scrollbar rounded-xl shadow-lg border-gray-100">
                                          <div className="p-4">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                              <Users className="w-4 h-4 mr-2 text-blue-600" />
                                              标注人员详情
                                            </h4>
                                            <div className="space-y-3">
                                              {historyTask.annotators && historyTask.annotators.map((annotator: any, aIndex: number) => {
                                                const progress = Math.min(Math.round((annotator.completed / annotator.assigned) * 100), 100)
                                                
                                                return (
                                                  <div key={aIndex} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                      <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                          <span className="text-blue-600 font-semibold text-xs">{annotator.name.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                          <h5 className="font-medium text-gray-900 text-xs">{annotator.name}</h5>
                                                        </div>
                                                      </div>
                                                      <Badge className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                                                        {progress}%
                                                      </Badge>
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                      <div className="flex justify-between text-xs">
                                                        <span className="text-gray-600">已分配: {annotator.assigned}</span>
                                                        <span className="text-green-600">已完成: {annotator.completed}</span>
                                                      </div>
                                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div
                                                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                                                          style={{ width: `${progress}%` }}
                                                        ></div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                            
                                            {/* 任务详细信息 */}
                                            <div className="mt-4 pt-3 border-t border-gray-200">
                                              <h5 className="text-sm font-semibold text-gray-900 mb-2">任务信息</h5>
                                              <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Bot ID:</span>
                                                  <span className="font-mono text-gray-900">{historyTask.botId}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">回复类型:</span>
                                                  <Badge className={`${replyTypeConfig[historyTask.replyType as keyof typeof replyTypeConfig].color} px-2 py-1 text-xs rounded-md`}>
                                                    {replyTypeConfig[historyTask.replyType as keyof typeof replyTypeConfig].label}
                                                  </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">风险等级:</span>
                                                  <Badge className={`${riskLevelConfig[historyTask.riskLevel as keyof typeof riskLevelConfig].color} px-2 py-1 text-xs rounded-md`}>
                                                    {riskLevelConfig[historyTask.riskLevel as keyof typeof riskLevelConfig].label}
                                                  </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">错误率:</span>
                                                  <span className="text-red-600 font-medium">{historyTask.errorRate}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">相似度:</span>
                                                  <span className="text-green-600 font-medium">{historyTask.similarity}%</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    
                                    <div className="flex items-center space-x-1">
                                      {(historyTask.status === 'completed' || historyTask.status === 'paused') && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleExportHistoryTask(historyTask, task)
                                          }}
                                          className="h-8 w-8 p-0 hover:bg-green-50 rounded-lg"
                                          title="导出结果"
                                        >
                                          <Download className="w-4 h-4 text-green-600" />
                                        </Button>
                                      )}
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleViewTaskDetail(historyTask)
                                        }}
                                        className="h-8 w-8 p-0 hover:bg-blue-50 rounded-lg"
                                        title="查看详情"
                                      >
                                        <Eye className="w-4 h-4 text-blue-600" />
                                      </Button>
                                      
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg">
                                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-gray-100">
                                          {historyTask.status === 'running' && (
                                            <DropdownMenuItem onClick={() => handleChangeTaskStatus(historyTask, 'paused')} className="rounded-lg">
                                              <Pause className="w-4 h-4 mr-2" />
                                              暂停任务
                                            </DropdownMenuItem>
                                          )}
                                          {historyTask.status === 'paused' && (
                                            <DropdownMenuItem onClick={() => handleChangeTaskStatus(historyTask, 'running')} className="rounded-lg">
                                              <Play className="w-4 h-4 mr-2" />
                                              继续任务
                                            </DropdownMenuItem>
                                          )}
                                          {(historyTask.status === 'running' || historyTask.status === 'paused') && (
                                            <DropdownMenuItem onClick={() => handleChangeTaskStatus(historyTask, 'completed')} className="rounded-lg">
                                              <CheckCircle className="w-4 h-4 mr-2" />
                                              标记完成
                                            </DropdownMenuItem>
                                          )}
                                          {canReview(historyTask) && (
                                            <>
                                              <DropdownMenuItem onClick={() => handleEnterReview(historyTask, 'cross')} className="rounded-lg">
                                                <ClipboardCheck className="w-4 h-4 mr-2" />
                                                交叉审核
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleEnterReview(historyTask, 'distributed')} className="rounded-lg">
                                                <ClipboardCheck className="w-4 h-4 mr-2" />
                                                分散审核
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                          <DropdownMenuItem onClick={() => handleViewStats(historyTask)} className="rounded-lg">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            查看统计
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* 分页 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>每页显示</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>条，共 {filteredTasks.length} 条</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3"
                >
                  上一页
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3"
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 任务详情弹窗 */}
        <Dialog open={showTaskDetailDialog} onOpenChange={setShowTaskDetailDialog}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                任务详情 - {selectedTask?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedTask && (
                <div className="flex h-[70vh] gap-6">
                  {/* 左侧：统计信息 */}
                  <div className="flex-1 overflow-y-auto thin-scrollbar">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                          统计信息
                        </h3>
                        
                        {/* 基础统计 */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          {/* 根据任务ID显示对应的标注结果统计 - 第一个卡片 */}
                          {mockTaskStatistics[selectedTask.id as keyof typeof mockTaskStatistics] ? (() => {
                            const taskStats = mockTaskStatistics[selectedTask.id as keyof typeof mockTaskStatistics] as TaskStatistics
                            
                            if (taskStats.annotationType === 'error_code') {
                              return (
                                <div className="bg-red-50 rounded-xl p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-red-600">高风险率</p>
                                      <p className="text-xl font-bold text-red-900">{taskStats.statistics.highRiskRate}%</p>
                                    </div>
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                      <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                  </div>
                                </div>
                              )
                            } else if (taskStats.annotationType === 'dialogue_quality') {
                              return (
                                <div className="bg-blue-50 rounded-xl p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-blue-600">平均质量</p>
                                      <p className="text-xl font-bold text-blue-900">{taskStats.statistics.averageQuality}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <BarChart3 className="w-5 h-5 text-blue-600" />
                                    </div>
                                  </div>
                                </div>
                              )
                            } else {
                              return (
                                <div className="bg-blue-50 rounded-xl p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-blue-600">已标注</p>
                                      <p className="text-xl font-bold text-blue-900">{taskStats.statistics.totalAnnotated}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <BarChart3 className="w-5 h-5 text-blue-600" />
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                          })() : (
                            <div className="bg-blue-50 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-blue-600">总数量</p>
                                  <p className="text-xl font-bold text-blue-900">{(selectedTask as Task).totalCount}</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <BarChart3 className="w-5 h-5 text-blue-600" />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* 根据任务ID显示对应的标注结果统计 */}
                          {mockTaskStatistics[selectedTask.id as keyof typeof mockTaskStatistics] ? (() => {
                            const taskStats = mockTaskStatistics[selectedTask.id as keyof typeof mockTaskStatistics] as TaskStatistics
                            
                            if (taskStats.annotationType === 'error_code') {
                              return (
                                <>
                                  <div className="bg-green-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-green-600">优秀率</p>
                                        <p className="text-xl font-bold text-green-900">{taskStats.statistics.excellentRate}%</p>
                                      </div>
                                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-emerald-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-emerald-600">合格率</p>
                                        <p className="text-xl font-bold text-emerald-900">{taskStats.statistics.qualifiedRate}%</p>
                                      </div>
                                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Target className="w-5 h-5 text-emerald-600" />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-purple-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-purple-600">平均分</p>
                                        <p className="text-xl font-bold text-purple-900">{taskStats.statistics.averageScore}</p>
                                      </div>
                                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-purple-600" />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )
                            } else if (taskStats.annotationType === 'dialogue_quality') {
                              return (
                                <>
                                  <div className="bg-green-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-green-600">优秀率</p>
                                        <p className="text-xl font-bold text-green-900">{taskStats.statistics.excellentRate}%</p>
                                      </div>
                                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-yellow-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-yellow-600">良好率</p>
                                        <p className="text-xl font-bold text-yellow-900">{taskStats.statistics.goodRate}%</p>
                                      </div>
                                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-yellow-600" />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-red-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-red-600">较差率</p>
                                        <p className="text-xl font-bold text-red-900">{taskStats.statistics.poorRate}%</p>
                                      </div>
                                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )
                            } else {
                              return (
                                <>
                                  <div className="bg-green-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-green-600">准确率</p>
                                        <p className="text-xl font-bold text-green-900">{taskStats.statistics.accuracyRate}%</p>
                                      </div>
                                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-blue-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-blue-600">已标注</p>
                                        <p className="text-xl font-bold text-blue-900">{taskStats.statistics.totalAnnotated}</p>
                                      </div>
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-blue-600" />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )
                            }
                          })() : (
                            <>
                              <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-green-600">已完成</p>
                                    <p className="text-xl font-bold text-green-900">{(selectedTask as Task).completedCount}</p>
                                  </div>
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-orange-50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-orange-600">错误率</p>
                                    <p className="text-xl font-bold text-orange-900">{(selectedTask as Task).errorRate}%</p>
                                  </div>
                                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-purple-50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-purple-600">相似度</p>
                                    <p className="text-xl font-bold text-purple-900">{(selectedTask as Task).similarity}%</p>
                                  </div>
                                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Target className="w-5 h-5 text-purple-600" />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 右侧：人员进度 */}
                  <div className="flex-1 overflow-y-auto thin-scrollbar">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-green-600" />
                          人员进度
                        </h3>
                        
                        <div className="space-y-4">
                          {(selectedTask as Task).annotators.map((annotator: any, index: number) => {
                          const progress = Math.min(Math.round((annotator.completed / annotator.assigned) * 100), 100)
                          
                          return (
                            <div key={index} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                    <span className="text-blue-700 font-bold text-sm">{annotator.name.charAt(0)}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{annotator.name}</h4>
                                    <p className="text-sm text-gray-500">标注人员</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${
                                    progress >= 90 ? 'text-green-600' :
                                    progress >= 70 ? 'text-blue-600' :
                                    progress >= 50 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {progress}%
                                  </div>
                                  <div className="text-xs text-gray-500">完成度</div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">已分配</span>
                                  <span className="font-medium text-gray-900">{annotator.assigned}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">已完成</span>
                                  <span className="font-medium text-green-600">{annotator.completed}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">剩余</span>
                                  <span className="font-medium text-orange-600">{annotator.assigned - annotator.completed}</span>
                                </div>
                                
                                <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                                  <div
                                    className={`h-3 rounded-full transition-all duration-500 ${
                                      progress >= 90 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                      progress >= 70 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                      progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                      'bg-gradient-to-r from-red-500 to-red-600'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 统计弹窗 */}
        <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto thin-scrollbar">
            <DialogHeader>
              <DialogTitle>任务统计详情</DialogTitle>
            </DialogHeader>
            
            {selectedTask && (
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">总数量</p>
                            <p className="text-2xl font-bold text-blue-900">{(selectedTask as Task).totalCount}</p>
                          </div>
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">已完成</p>
                            <p className="text-2xl font-bold text-green-900">{(selectedTask as Task).completedCount}</p>
                          </div>
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-600">错误率</p>
                            <p className="text-2xl font-bold text-orange-900">{(selectedTask as Task).errorRate}%</p>
                          </div>
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                {/* 基于标注类型的高级统计 */}
                {selectedTask && mockTaskStatistics[selectedTask.id as keyof typeof mockTaskStatistics] && (() => {
                  const taskStats = mockTaskStatistics[selectedTask.id as keyof typeof mockTaskStatistics] as TaskStatistics
                  return (
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" />
                        标注质量统计
                      </h4>
                      
                      {taskStats.annotationType === 'error_code' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
                            <div className="text-blue-600 font-medium text-sm mb-1">高风险率</div>
                            <div className="text-blue-900 font-bold text-lg">{taskStats.statistics.highRiskRate}%</div>
                            <div className="text-blue-500 text-xs mt-1">标注为高风险的比例</div>
                          </div>
                          <div className="bg-white/70 p-4 rounded-lg border border-green-100">
                            <div className="text-green-600 font-medium text-sm mb-1">优秀率</div>
                            <div className="text-green-900 font-bold text-lg">{taskStats.statistics.excellentRate}%</div>
                            <div className="text-green-500 text-xs mt-1">质量评分优秀的比例</div>
                          </div>
                          <div className="bg-white/70 p-4 rounded-lg border border-emerald-100">
                            <div className="text-emerald-600 font-medium text-sm mb-1">合格率</div>
                            <div className="text-emerald-900 font-bold text-lg">{taskStats.statistics.qualifiedRate}%</div>
                            <div className="text-emerald-500 text-xs mt-1">达到合格标准的比例</div>
                          </div>
                          <div className="bg-white/70 p-4 rounded-lg border border-purple-100">
                            <div className="text-purple-600 font-medium text-sm mb-1">平均分</div>
                            <div className="text-purple-900 font-bold text-lg">{taskStats.statistics.averageScore}</div>
                            <div className="text-purple-500 text-xs mt-1">所有标注的平均质量分</div>
                          </div>
                        </div>
                      )}
                      
                      {taskStats.annotationType === 'dialogue_quality' && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white/70 p-4 rounded-lg border border-green-100">
                            <div className="text-green-600 font-medium text-sm mb-1">优秀率</div>
                            <div className="text-green-900 font-bold text-lg">{taskStats.statistics.excellentRate}%</div>
                            <div className="text-green-500 text-xs mt-1">评为"好"的对话比例</div>
                          </div>
                          <div className="bg-white/70 p-4 rounded-lg border border-yellow-100">
                            <div className="text-yellow-600 font-medium text-sm mb-1">良好率</div>
                            <div className="text-yellow-900 font-bold text-lg">{taskStats.statistics.goodRate}%</div>
                            <div className="text-yellow-500 text-xs mt-1">评为"中"的对话比例</div>
                          </div>
                          <div className="bg-white/70 p-4 rounded-lg border border-red-100">
                            <div className="text-red-600 font-medium text-sm mb-1">较差率</div>
                            <div className="text-red-900 font-bold text-lg">{taskStats.statistics.poorRate}%</div>
                            <div className="text-red-500 text-xs mt-1">评为"差"的对话比例</div>
                          </div>
                        </div>
                      )}

                      {taskStats.annotationType === 'message_scene' && (
                        <div className="space-y-4">
                          <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
                            <div className="text-blue-600 font-medium text-sm mb-1">准确率</div>
                            <div className="text-blue-900 font-bold text-lg">{taskStats.statistics.accuracyRate}%</div>
                            <div className="text-blue-500 text-xs mt-1">场景分类的准确率</div>
                          </div>
                          <div className="bg-white/70 p-4 rounded-lg border border-gray-100">
                            <h5 className="text-gray-700 font-medium text-sm mb-3">场景分布</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {taskStats.statistics.sceneDistribution && Object.entries(taskStats.statistics.sceneDistribution).map(([scene, count]) => (
                                <div key={scene} className="text-center">
                                  <div className="text-gray-900 font-bold text-sm">{count as number}</div>
                                  <div className="text-gray-500 text-xs">{scene}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
                
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h5 className="font-semibold text-gray-900 mb-4">标注人员进度</h5>
                      <div className="space-y-4">
                        {(selectedTask as Task).annotators.map((annotator: any, index: number) => {
                      const progress = Math.min(Math.round((annotator.completed / annotator.assigned) * 100), 100)
                      
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">{annotator.name.charAt(0)}</span>
                            </div>
                            <span className="font-medium text-gray-900">{annotator.name}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600">
                              {annotator.completed}/{annotator.assigned}
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 w-12 text-right">
                              {progress}%
                            </div>
                          </div>
                        </div>
                          )
                        })}
                      </div>
                    </div>
              </div>
            )}
          </DialogContent>
        </Dialog>



      </div>
    </div>
  )
}