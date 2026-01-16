import { useMemo, useState } from 'react'
import {
  Settings,
  Calendar,
  Pause,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Download,
  Upload,
  Eye,
  Save,
  ChevronDown,
  ChevronRight,
  Info,
  MoreHorizontal,
  RotateCcw,
  StopCircle,
  PlayCircle,
  FolderOpen,
  Gamepad2,
  Radio,
  Bell,
  Activity,
  Mail,
  MessageSquare,
  Edit,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { useGlobalStore } from '@/store/globalStore'

// 计划组接口
interface PlanGroup {
  id: string
  name: string
  description?: string
  enabled: boolean
  cycle: 'daily' | 'weekly' | 'custom'
  executeTime: string
  weekDays?: number[]
  mode: 'session' | 'single'
  maxCount: number
  samplingScope: 'total' | 'perGame' // 抽样范围：整体抽样 或 每个游戏单独抽样
  samplingMethod: 'random' | 'latest' | 'all'
  filter: {
    keywordBlacklist: string[]
    excludeBotOnly: boolean
    excludeNoUserReply: boolean
    minMessageCount: number
    maxMessageCount: number
  }
  monitoring: MonitoringConfig
  alert: AlertConfig
  gameChannels: GameChannelItem[]
  createdAt: string
  updatedAt: string
}

// 游戏渠道项
interface GameChannelItem {
  id: string
  gameId: string
  gameName: string
  channel: string
  channelName: string
  enabled: boolean
  status: 'running' | 'normal' | 'error' | 'stopped'
  errorInfo?: ErrorInfo // 异常信息
  lastExecution?: ExecutionRecord
  executions: ExecutionRecord[]
}

// 异常信息
interface ErrorInfo {
  type: 'dataMissing' | 'modelError' | 'resourceInsufficient' | 'progressAbnormal' | 'executionFailed'
  message: string
  detail?: string
  occurredAt: string
  resolvedAt?: string
}

// 执行记录
interface ExecutionRecord {
  id: string
  time: string
  total: number
  completed: number
  failed: number
  hasError: number
  status: 'completed' | 'running' | 'error'
  mode?: 'all' | 'failed'
  errorMessage?: string // 执行错误信息
}

// 监控配置
interface MonitoringConfig {
  enabled: boolean
  metrics: {
    dataMissing: { enabled: boolean; threshold: number } // 缺数据：连续N次无数据
    modelError: { enabled: boolean; threshold: number } // 模型报错：错误率超过N%
    resourceInsufficient: { enabled: boolean; threshold: number } // 资源不足：队列堆积超过N条
    progressAbnormal: { enabled: boolean; threshold: number } // 进度异常：预计超时N小时
  }
}

// 告警配置
interface AlertConfig {
  enabled: boolean
  channels: {
    wechat: { enabled: boolean; webhookUrl: string }
    email: { enabled: boolean; recipients: string[] }
  }
  receivers: { rtx: string; name: string }[]
}

// 初始计划组数据
const initialPlanGroups: PlanGroup[] = [
  {
    id: 'group_001',
    name: '甄选日常质检计划',
    description: '每日自动执行的质检任务，覆盖主要游戏和渠道',
    enabled: true,
    cycle: 'daily',
    executeTime: '09:00',
    mode: 'session',
    maxCount: 500,
    samplingScope: 'perGame',
    samplingMethod: 'random',
    filter: {
      keywordBlacklist: ['测试', '你好'],
      excludeBotOnly: true,
      excludeNoUserReply: true,
      minMessageCount: 2,
      maxMessageCount: 50,
    },
    monitoring: {
      enabled: true,
      metrics: {
        dataMissing: { enabled: true, threshold: 3 },
        modelError: { enabled: true, threshold: 10 },
        resourceInsufficient: { enabled: true, threshold: 1000 },
        progressAbnormal: { enabled: true, threshold: 2 },
      },
    },
    alert: {
      enabled: true,
      channels: {
        wechat: { enabled: true, webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx' },
        email: { enabled: true, recipients: ['xiaohuwang@tencent.com'] },
      },
      receivers: [
        { rtx: 'xiaohuwang', name: '王小虎' },
        { rtx: 'zhangsan', name: '张三' },
      ],
    },
    gameChannels: [
      {
        id: 'gc_001',
        gameId: 'CFM',
        gameName: '穿越火线手游',
        channel: 'weixin',
        channelName: '微信',
        enabled: true,
        status: 'running',
        executions: [
          { id: 'exec_001', time: '2026-01-15 09:00:00', total: 500, completed: 485, failed: 15, hasError: 8, status: 'completed' },
          { id: 'exec_002', time: '2026-01-14 09:00:00', total: 500, completed: 500, failed: 0, hasError: 5, status: 'completed' },
        ],
      },
      {
        id: 'gc_002',
        gameId: 'CFM',
        gameName: '穿越火线手游',
        channel: 'qq',
        channelName: 'QQ',
        enabled: true,
        status: 'normal',
        executions: [
          { id: 'exec_003', time: '2026-01-15 09:00:00', total: 300, completed: 300, failed: 0, hasError: 3, status: 'completed' },
        ],
      },
      {
        id: 'gc_003',
        gameId: 'DNF',
        gameName: '地下城与勇士',
        channel: 'qq',
        channelName: 'QQ',
        enabled: true,
        status: 'error',
        errorInfo: {
          type: 'modelError',
          message: '模型调用失败率超过阈值',
          detail: '最近1小时内模型调用失败率达到 35%，超过设定阈值 10%。\n\n错误详情：\n- 超时错误: 28次\n- 服务不可用: 12次\n- 参数错误: 5次\n\n影响范围：约 200 条会话未完成质检',
          occurredAt: '2026-01-15 10:30:00',
        },
        executions: [
          { id: 'exec_004', time: '2026-01-15 09:00:00', total: 400, completed: 200, failed: 100, hasError: 50, status: 'error', errorMessage: '模型服务响应超时，部分任务执行失败' },
        ],
      },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-15',
  },
  {
    id: 'group_002',
    name: '周末专项质检',
    description: '周末执行的专项质检，关注高峰期数据',
    enabled: false,
    cycle: 'weekly',
    executeTime: '10:00',
    weekDays: [6, 0],
    mode: 'session',
    maxCount: 1000,
    samplingScope: 'total',
    samplingMethod: 'latest',
    filter: {
      keywordBlacklist: [],
      excludeBotOnly: true,
      excludeNoUserReply: true,
      minMessageCount: 3,
      maxMessageCount: 100,
    },
    monitoring: {
      enabled: false,
      metrics: {
        dataMissing: { enabled: false, threshold: 3 },
        modelError: { enabled: false, threshold: 10 },
        resourceInsufficient: { enabled: false, threshold: 1000 },
        progressAbnormal: { enabled: false, threshold: 2 },
      },
    },
    alert: {
      enabled: false,
      channels: {
        wechat: { enabled: false, webhookUrl: '' },
        email: { enabled: false, recipients: [] },
      },
      receivers: [],
    },
    gameChannels: [
      {
        id: 'gc_004',
        gameId: 'LOL',
        gameName: '英雄联盟',
        channel: 'weixin',
        channelName: '微信',
        enabled: true,
        status: 'stopped',
        executions: [],
      },
    ],
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
]

// 视图类型
type ViewType = 'group' | 'game' | 'channel'

export default function AutoQualityInspection() {
  const store = useGlobalStore()
  const gameChannelConfigs = store.gameChannelConfigs

  const [activeTab, setActiveTab] = useState('plans')
  const [viewType, setViewType] = useState<ViewType>('group')
  const [planGroups, setPlanGroups] = useState<PlanGroup[]>(initialPlanGroups)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  
  // 弹窗状态
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false)
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false)
  const [showAddGameChannelDialog, setShowAddGameChannelDialog] = useState(false)
  const [showErrorDetailDialog, setShowErrorDetailDialog] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<PlanGroup | null>(null)
  const [selectedErrorInfo, setSelectedErrorInfo] = useState<{ gc: GameChannelItem; group: PlanGroup } | null>(null)
  
  // 新建/编辑计划组表单
  const [groupForm, setGroupForm] = useState<Partial<PlanGroup>>({
    name: '',
    description: '',
    enabled: true,
    cycle: 'daily',
    executeTime: '09:00',
    weekDays: [1, 2, 3, 4, 5],
    mode: 'session',
    maxCount: 500,
    samplingScope: 'perGame',
    samplingMethod: 'random',
    filter: {
      keywordBlacklist: [],
      excludeBotOnly: true,
      excludeNoUserReply: true,
      minMessageCount: 2,
      maxMessageCount: 50,
    },
    monitoring: {
      enabled: true,
      metrics: {
        dataMissing: { enabled: true, threshold: 3 },
        modelError: { enabled: true, threshold: 10 },
        resourceInsufficient: { enabled: true, threshold: 1000 },
        progressAbnormal: { enabled: true, threshold: 2 },
      },
    },
    alert: {
      enabled: false,
      channels: {
        wechat: { enabled: false, webhookUrl: '' },
        email: { enabled: false, recipients: [] },
      },
      receivers: [],
    },
  })

  // 添加游戏渠道表单
  const [gameChannelForm, setGameChannelForm] = useState({
    gameId: '',
    channel: '',
  })

  // 临时输入状态
  const [newKeyword, setNewKeyword] = useState('')
  const [newReceiver, setNewReceiver] = useState('')

  // 计算视图数据
  const viewData = useMemo(() => {
    if (viewType === 'group') {
      return planGroups.map(group => ({
        id: group.id,
        name: group.name,
        type: 'group' as const,
        group,
        items: group.gameChannels,
        status: group.enabled ? (group.gameChannels.some(gc => gc.status === 'error') ? 'error' : 'normal') : 'stopped',
      }))
    } else if (viewType === 'game') {
      const gameMap = new Map<string, { gameId: string; gameName: string; items: Array<{ group: PlanGroup; gc: GameChannelItem }> }>()
      planGroups.forEach(group => {
        group.gameChannels.forEach(gc => {
          if (!gameMap.has(gc.gameId)) {
            gameMap.set(gc.gameId, { gameId: gc.gameId, gameName: gc.gameName, items: [] })
          }
          gameMap.get(gc.gameId)!.items.push({ group, gc })
        })
      })
      return Array.from(gameMap.values()).map(g => ({
        id: g.gameId,
        name: g.gameName,
        type: 'game' as const,
        items: g.items,
        status: g.items.some(i => i.gc.status === 'error') ? 'error' : 'normal',
      }))
    } else {
      const channelMap = new Map<string, { channel: string; channelName: string; items: Array<{ group: PlanGroup; gc: GameChannelItem }> }>()
      planGroups.forEach(group => {
        group.gameChannels.forEach(gc => {
          if (!channelMap.has(gc.channel)) {
            channelMap.set(gc.channel, { channel: gc.channel, channelName: gc.channelName, items: [] })
          }
          channelMap.get(gc.channel)!.items.push({ group, gc })
        })
      })
      return Array.from(channelMap.values()).map(c => ({
        id: c.channel,
        name: c.channelName,
        type: 'channel' as const,
        items: c.items,
        status: c.items.some(i => i.gc.status === 'error') ? 'error' : 'normal',
      }))
    }
  }, [planGroups, viewType])

  // 状态配置
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: JSX.Element; text: string }> = {
      running: { color: 'bg-blue-100 text-blue-800', icon: <Loader2 className="w-3 h-3 animate-spin" />, text: '执行中' },
      normal: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" />, text: '正常' },
      error: { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" />, text: '异常' },
      stopped: { color: 'bg-gray-100 text-gray-500', icon: <StopCircle className="w-3 h-3" />, text: '已停止' },
    }
    return configs[status] || configs.stopped
  }

  // 异常类型配置
  const getErrorTypeConfig = (type: ErrorInfo['type']) => {
    const configs: Record<ErrorInfo['type'], { label: string; color: string }> = {
      dataMissing: { label: '缺数据', color: 'bg-orange-100 text-orange-800' },
      modelError: { label: '模型报错', color: 'bg-red-100 text-red-800' },
      resourceInsufficient: { label: '资源不足', color: 'bg-yellow-100 text-yellow-800' },
      progressAbnormal: { label: '进度异常', color: 'bg-purple-100 text-purple-800' },
      executionFailed: { label: '执行失败', color: 'bg-red-100 text-red-800' },
    }
    return configs[type] || { label: '未知异常', color: 'bg-gray-100 text-gray-800' }
  }

  // 查看异常详情
  const handleViewError = (gc: GameChannelItem, group: PlanGroup) => {
    setSelectedErrorInfo({ gc, group })
    setShowErrorDetailDialog(true)
  }

  // 切换展开状态
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // 创建计划组
  const handleCreateGroup = () => {
    const newGroup: PlanGroup = {
      id: `group_${Date.now()}`,
      name: groupForm.name || '新计划组',
      description: groupForm.description,
      enabled: groupForm.enabled ?? true,
      cycle: groupForm.cycle || 'daily',
      executeTime: groupForm.executeTime || '09:00',
      weekDays: groupForm.weekDays,
      mode: groupForm.mode || 'session',
      maxCount: groupForm.maxCount || 500,
      samplingScope: groupForm.samplingScope || 'perGame',
      samplingMethod: groupForm.samplingMethod || 'random',
      filter: groupForm.filter || {
        keywordBlacklist: [],
        excludeBotOnly: true,
        excludeNoUserReply: true,
        minMessageCount: 2,
        maxMessageCount: 50,
      },
      monitoring: groupForm.monitoring || {
        enabled: true,
        metrics: {
          dataMissing: { enabled: true, threshold: 3 },
          modelError: { enabled: true, threshold: 10 },
          resourceInsufficient: { enabled: true, threshold: 1000 },
          progressAbnormal: { enabled: true, threshold: 2 },
        },
      },
      alert: groupForm.alert || {
        enabled: false,
        channels: {
          wechat: { enabled: false, webhookUrl: '' },
          email: { enabled: false, recipients: [] },
        },
        receivers: [],
      },
      gameChannels: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setPlanGroups(prev => [...prev, newGroup])
    setShowCreateGroupDialog(false)
    resetGroupForm()
  }

  // 更新计划组
  const handleUpdateGroup = () => {
    if (!selectedGroup) return
    setPlanGroups(prev => prev.map(g => 
      g.id === selectedGroup.id 
        ? { ...g, ...groupForm, updatedAt: new Date().toISOString().split('T')[0] }
        : g
    ))
    setShowEditGroupDialog(false)
    setSelectedGroup(null)
    resetGroupForm()
  }

  // 删除计划组
  const handleDeleteGroup = (groupId: string) => {
    if (confirm('确定要删除这个计划组吗？所有关联的质检计划都将被删除。')) {
      setPlanGroups(prev => prev.filter(g => g.id !== groupId))
    }
  }

  // 添加游戏渠道到计划组
  const handleAddGameChannel = () => {
    if (!selectedGroup || !gameChannelForm.gameId || !gameChannelForm.channel) return
    
    const config = gameChannelConfigs.find(c => c.gameId === gameChannelForm.gameId && c.channel === gameChannelForm.channel)
    if (!config) return

    const newGC: GameChannelItem = {
      id: `gc_${Date.now()}`,
      gameId: config.gameId,
      gameName: config.gameName,
      channel: config.channel,
      channelName: config.channelName,
      enabled: true,
      status: 'normal',
      executions: [],
    }

    setPlanGroups(prev => prev.map(g =>
      g.id === selectedGroup.id
        ? { ...g, gameChannels: [...g.gameChannels, newGC], updatedAt: new Date().toISOString().split('T')[0] }
        : g
    ))
    setShowAddGameChannelDialog(false)
    setGameChannelForm({ gameId: '', channel: '' })
  }

  // 删除游戏渠道
  const handleRemoveGameChannel = (groupId: string, gcId: string) => {
    if (confirm('确定要从计划组中移除这个游戏渠道吗？')) {
      setPlanGroups(prev => prev.map(g =>
        g.id === groupId
          ? { ...g, gameChannels: g.gameChannels.filter(gc => gc.id !== gcId) }
          : g
      ))
    }
  }

  // 切换计划组启用状态
  const toggleGroupEnabled = (groupId: string) => {
    setPlanGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, enabled: !g.enabled } : g
    ))
  }

  // 切换游戏渠道启用状态
  const toggleGameChannelEnabled = (groupId: string, gcId: string) => {
    setPlanGroups(prev => prev.map(g =>
      g.id === groupId
        ? {
            ...g,
            gameChannels: g.gameChannels.map(gc =>
              gc.id === gcId ? { ...gc, enabled: !gc.enabled, status: !gc.enabled ? 'normal' : 'stopped' } : gc
            ),
          }
        : g
    ))
  }

  // 重跑任务
  const handleRerun = (groupId: string, gcId: string, mode: 'all' | 'failed') => {
    setPlanGroups(prev => prev.map(g =>
      g.id === groupId
        ? {
            ...g,
            gameChannels: g.gameChannels.map(gc =>
              gc.id === gcId
                ? {
                    ...gc,
                    status: 'running',
                    executions: [
                      {
                        id: `exec_${Date.now()}`,
                        time: new Date().toISOString().replace('T', ' ').slice(0, 19),
                        total: g.maxCount,
                        completed: 0,
                        failed: 0,
                        hasError: 0,
                        status: 'running' as const,
                        mode,
                      },
                      ...gc.executions,
                    ],
                  }
                : gc
            ),
          }
        : g
    ))
  }

  // 重置表单
  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      description: '',
      enabled: true,
      cycle: 'daily',
      executeTime: '09:00',
      weekDays: [1, 2, 3, 4, 5],
      mode: 'session',
      maxCount: 500,
      samplingMethod: 'random',
      filter: {
        keywordBlacklist: [],
        excludeBotOnly: true,
        excludeNoUserReply: true,
        minMessageCount: 2,
        maxMessageCount: 50,
      },
      monitoring: {
        enabled: true,
        metrics: {
          dataMissing: { enabled: true, threshold: 3 },
          modelError: { enabled: true, threshold: 10 },
          resourceInsufficient: { enabled: true, threshold: 1000 },
          progressAbnormal: { enabled: true, threshold: 2 },
        },
      },
      alert: {
        enabled: false,
        channels: {
          wechat: { enabled: false, webhookUrl: '' },
          email: { enabled: false, recipients: [] },
        },
        receivers: [],
      },
    })
    setNewKeyword('')
    setNewReceiver('')
  }

  // 打开编辑弹窗
  const openEditDialog = (group: PlanGroup) => {
    setSelectedGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description,
      enabled: group.enabled,
      cycle: group.cycle,
      executeTime: group.executeTime,
      weekDays: group.weekDays,
      mode: group.mode,
      maxCount: group.maxCount,
      samplingScope: group.samplingScope,
      samplingMethod: group.samplingMethod,
      filter: { ...group.filter },
      monitoring: JSON.parse(JSON.stringify(group.monitoring)),
      alert: JSON.parse(JSON.stringify(group.alert)),
    })
    setShowEditGroupDialog(true)
  }

  // 添加关键词
  const handleAddKeyword = () => {
    if (newKeyword.trim() && groupForm.filter) {
      setGroupForm(prev => ({
        ...prev,
        filter: {
          ...prev.filter!,
          keywordBlacklist: [...(prev.filter?.keywordBlacklist || []), newKeyword.trim()],
        },
      }))
      setNewKeyword('')
    }
  }

  // 删除关键词
  const handleRemoveKeyword = (keyword: string) => {
    setGroupForm(prev => ({
      ...prev,
      filter: {
        ...prev.filter!,
        keywordBlacklist: prev.filter?.keywordBlacklist?.filter(k => k !== keyword) || [],
      },
    }))
  }

  // 解析接收人
  const parseReceiver = (input: string) => {
    const match = input.match(/^(\w+)(?:\((.+)\))?$/)
    if (match) {
      return { rtx: match[1], name: match[2] || match[1] }
    }
    return null
  }

  // 添加接收人
  const handleAddReceiver = () => {
    const parsed = parseReceiver(newReceiver.trim())
    if (parsed && groupForm.alert) {
      setGroupForm(prev => ({
        ...prev,
        alert: {
          ...prev.alert!,
          receivers: [...(prev.alert?.receivers || []), parsed],
        },
      }))
      setNewReceiver('')
    }
  }

  // 删除接收人
  const handleRemoveReceiver = (rtx: string) => {
    setGroupForm(prev => ({
      ...prev,
      alert: {
        ...prev.alert!,
        receivers: prev.alert?.receivers?.filter(r => r.rtx !== rtx) || [],
      },
    }))
  }

  // 获取可用渠道
  const getAvailableChannels = (gameId: string) => {
    return gameChannelConfigs.filter(c => c.gameId === gameId)
  }

  // 渲染计划组视图
  const renderGroupView = () => (
    <div className="space-y-4">
      {viewData.map(item => {
        if (item.type !== 'group') return null
        const group = item.group!
        const isExpanded = expandedItems.has(group.id)
        const statusCfg = getStatusConfig(item.status)

        return (
          <div key={group.id} className="border rounded-lg bg-white">
            {/* 计划组头部 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleExpand(group.id)}>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{group.name}</span>
                    <Badge className={`${statusCfg.color} flex items-center gap-1`}>
                      {statusCfg.icon}{statusCfg.text}
                    </Badge>
                    <Badge variant="outline">{group.gameChannels.length} 个游戏渠道</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    周期：{group.cycle === 'daily' ? '每天' : group.cycle === 'weekly' ? '每周' : '自定义'} · 
                    时间 {group.executeTime} · 
                    模式 {group.mode === 'session' ? '会话' : '单轮'} · 
                    抽样 {group.maxCount} 条/{group.samplingScope === 'total' ? '整体' : '每游戏'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={group.enabled} onCheckedChange={() => toggleGroupEnabled(group.id)} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(group)}>
                      <Edit className="w-4 h-4 mr-2" />编辑配置
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSelectedGroup(group); setShowAddGameChannelDialog(true) }}>
                      <Plus className="w-4 h-4 mr-2" />添加游戏渠道
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteGroup(group.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />删除计划组
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* 展开内容 */}
            {isExpanded && (
              <div className="p-4 space-y-4">
                {/* 配置概览 */}
                <div className="grid grid-cols-4 gap-4 text-sm p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">过滤规则</p>
                    <p className="text-gray-700">黑名单：{group.filter.keywordBlacklist.length ? group.filter.keywordBlacklist.join('、') : '无'}</p>
                    <p className="text-gray-700">消息数：{group.filter.minMessageCount}-{group.filter.maxMessageCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">监控配置</p>
                    <p className="text-gray-700">状态：{group.monitoring.enabled ? '已启用' : '未启用'}</p>
                    {group.monitoring.enabled && (
                      <p className="text-gray-700">
                        指标：{[
                          group.monitoring.metrics.dataMissing.enabled && '缺数据',
                          group.monitoring.metrics.modelError.enabled && '模型报错',
                          group.monitoring.metrics.resourceInsufficient.enabled && '资源不足',
                          group.monitoring.metrics.progressAbnormal.enabled && '进度异常',
                        ].filter(Boolean).join('、') || '无'}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">告警配置</p>
                    <p className="text-gray-700">状态：{group.alert.enabled ? '已启用' : '未启用'}</p>
                    {group.alert.enabled && (
                      <p className="text-gray-700">
                        通道：{[
                          group.alert.channels.wechat.enabled && '企微',
                          group.alert.channels.email.enabled && '邮件',
                        ].filter(Boolean).join('、') || '无'}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">接收人</p>
                    <p className="text-gray-700">
                      {group.alert.receivers.length > 0 
                        ? group.alert.receivers.map(r => r.name).join('、')
                        : '无'
                      }
                    </p>
                  </div>
                </div>

                {/* 游戏渠道列表 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">游戏渠道列表</p>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedGroup(group); setShowAddGameChannelDialog(true) }}>
                      <Plus className="w-3 h-3 mr-1" />添加
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">游戏</th>
                          <th className="px-3 py-2 text-left">渠道</th>
                          <th className="px-3 py-2 text-left">状态</th>
                          <th className="px-3 py-2 text-left">最近执行</th>
                          <th className="px-3 py-2 text-left">进度</th>
                          <th className="px-3 py-2 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {group.gameChannels.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                              暂无游戏渠道，点击上方"添加"按钮添加
                            </td>
                          </tr>
                        ) : (
                          group.gameChannels.map(gc => {
                            const gcStatus = getStatusConfig(gc.status)
                            const lastExec = gc.executions[0]
                            const progress = lastExec ? Math.round(((lastExec.completed + lastExec.failed) / lastExec.total) * 100) : 0

                            return (
                              <tr key={gc.id}>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <Gamepad2 className="w-4 h-4 text-gray-400" />
                                    <span>{gc.gameName}</span>
                                    <Badge variant="outline" className="text-xs">{gc.gameId}</Badge>
                                  </div>
                                </td>
                                <td className="px-3 py-2">{gc.channelName}</td>
                                <td className="px-3 py-2">
                                  {gc.status === 'error' && gc.errorInfo ? (
                                    <button 
                                      onClick={() => handleViewError(gc, group)}
                                      className="flex items-center gap-1 hover:underline"
                                    >
                                      <Badge className={`${gcStatus.color} flex items-center gap-1 w-fit cursor-pointer`}>
                                        {gcStatus.icon}{gcStatus.text}
                                      </Badge>
                                      <span className="text-xs text-red-600">查看</span>
                                    </button>
                                  ) : (
                                    <Badge className={`${gcStatus.color} flex items-center gap-1 w-fit`}>
                                      {gcStatus.icon}{gcStatus.text}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  {lastExec ? lastExec.time : '—'}
                                </td>
                                <td className="px-3 py-2 w-32">
                                  {lastExec ? (
                                    <div className="flex items-center gap-2">
                                      <Progress value={progress} className="flex-1" />
                                      <span className="text-xs text-gray-500 w-8">{progress}%</span>
                                    </div>
                                  ) : '—'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Switch 
                                      checked={gc.enabled} 
                                      onCheckedChange={() => toggleGameChannelEnabled(group.id, gc.id)}
                                    />
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleRerun(group.id, gc.id, 'all')}>
                                          <RotateCcw className="w-4 h-4 mr-2" />全量重跑
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRerun(group.id, gc.id, 'failed')}>
                                          <RefreshCw className="w-4 h-4 mr-2" />重跑失败
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleRemoveGameChannel(group.id, gc.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />移除
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // 辅助函数：按计划组分组
  const groupByPlanGroup = (items: Array<{ group: PlanGroup; gc: GameChannelItem }>) => {
    const groupMap = new Map<string, { group: PlanGroup; gcList: GameChannelItem[] }>()
    items.forEach(({ group, gc }) => {
      if (!groupMap.has(group.id)) {
        groupMap.set(group.id, { group, gcList: [] })
      }
      groupMap.get(group.id)!.gcList.push(gc)
    })
    return Array.from(groupMap.values())
  }

  // 渲染游戏/渠道视图 - 按计划组分组展示
  const renderGameOrChannelView = () => (
    <div className="space-y-4">
      {viewData.map(item => {
        if (item.type === 'group') return null
        const isExpanded = expandedItems.has(item.id)
        const statusCfg = getStatusConfig(item.status)
        const items = item.items as Array<{ group: PlanGroup; gc: GameChannelItem }>

        // 按计划组分组
        const groupedByPlanGroup = groupByPlanGroup(items)

        // 计算计划组数量
        const planGroupCount = groupedByPlanGroup.length

        return (
          <div key={item.id} className="border rounded-lg bg-white">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleExpand(item.id)}>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex items-center gap-2">
                  {item.type === 'game' ? <Gamepad2 className="w-4 h-4 text-gray-500" /> : <Radio className="w-4 h-4 text-gray-500" />}
                  <span className="font-medium">{item.name}</span>
                  <Badge className={`${statusCfg.color} flex items-center gap-1`}>
                    {statusCfg.icon}{statusCfg.text}
                  </Badge>
                  <Badge variant="outline">{planGroupCount} 个计划组</Badge>
                  <Badge variant="outline" className="text-gray-500">{items.length} 个任务</Badge>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 space-y-3">
                {groupedByPlanGroup.map(({ group, gcList }) => {
                  const subExpandKey = `${item.id}-${group.id}`
                  const isSubExpanded = expandedItems.has(subExpandKey)
                  const groupStatus = group.enabled ? (gcList.some(gc => gc.status === 'running') ? 'running' : gcList.some(gc => gc.status === 'error') ? 'error' : 'idle') : 'disabled'
                  const groupStatusCfg = getStatusConfig(groupStatus)

                  return (
                    <div key={group.id} className="border rounded-lg">
                      {/* 计划组头部 */}
                      <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleExpand(subExpandKey)}>
                            {isSubExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                          <FolderOpen className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-sm">{group.name}</span>
                          <Badge className={`${groupStatusCfg.color} flex items-center gap-1 text-xs`}>
                            {groupStatusCfg.icon}{groupStatusCfg.text}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{gcList.length} 个{viewType === 'game' ? '渠道' : '游戏'}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {group.cycle === 'daily' ? '每天' : group.cycle === 'weekly' ? '每周' : '自定义'} {group.executeTime}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(group)}>
                                <Edit className="w-4 h-4 mr-2" />编辑配置
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* 计划组内的游戏渠道列表 */}
                      {isSubExpanded && (
                        <div className="p-3">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                {viewType === 'game' && <th className="px-3 py-2 text-left">渠道</th>}
                                {viewType === 'channel' && <th className="px-3 py-2 text-left">游戏</th>}
                                <th className="px-3 py-2 text-left">状态</th>
                                <th className="px-3 py-2 text-left">最近执行</th>
                                <th className="px-3 py-2 text-left">进度</th>
                                <th className="px-3 py-2 text-center">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {gcList.map(gc => {
                                const gcStatus = getStatusConfig(gc.status)
                                const lastExec = gc.executions[0]
                                const progress = lastExec ? Math.round(((lastExec.completed + lastExec.failed) / lastExec.total) * 100) : 0

                                return (
                                  <tr key={gc.id}>
                                    {viewType === 'game' && <td className="px-3 py-2">{gc.channelName}</td>}
                                    {viewType === 'channel' && (
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                          <span>{gc.gameName}</span>
                                          <Badge variant="outline" className="text-xs">{gc.gameId}</Badge>
                                        </div>
                                      </td>
                                    )}
                                    <td className="px-3 py-2">
                                      {gc.status === 'error' && gc.errorInfo ? (
                                        <button 
                                          onClick={() => handleViewError(gc, group)}
                                          className="flex items-center gap-1 hover:underline"
                                        >
                                          <Badge className={`${gcStatus.color} flex items-center gap-1 w-fit cursor-pointer`}>
                                            {gcStatus.icon}{gcStatus.text}
                                          </Badge>
                                          <span className="text-xs text-red-600">查看</span>
                                        </button>
                                      ) : (
                                        <Badge className={`${gcStatus.color} flex items-center gap-1 w-fit`}>
                                          {gcStatus.icon}{gcStatus.text}
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-500">
                                      {lastExec ? lastExec.time : '—'}
                                    </td>
                                    <td className="px-3 py-2 w-32">
                                      {lastExec ? (
                                        <div className="flex items-center gap-2">
                                          <Progress value={progress} className="flex-1" />
                                          <span className="text-xs text-gray-500 w-8">{progress}%</span>
                                        </div>
                                      ) : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                            <MoreHorizontal className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleRerun(group.id, gc.id, 'all')}>
                                            <RotateCcw className="w-4 h-4 mr-2" />全量重跑
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleRerun(group.id, gc.id, 'failed')}>
                                            <RefreshCw className="w-4 h-4 mr-2" />重跑失败
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">自动质检计划</h1>
            <p className="text-gray-600 mt-1">创建计划组，批量管理多个游戏+渠道的质检任务</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              导出配置
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              导入配置
            </Button>
            <Button size="sm" onClick={() => setShowCreateGroupDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              新建计划组
            </Button>
          </div>
        </div>
      </div>

      {/* 视图切换 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">视图：</span>
            <div className="flex rounded-lg border overflow-hidden">
              <button
                className={`px-4 py-2 text-sm flex items-center gap-1 ${viewType === 'group' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setViewType('group')}
              >
                <FolderOpen className="w-4 h-4" />
                计划组
              </button>
              <button
                className={`px-4 py-2 text-sm flex items-center gap-1 border-l ${viewType === 'game' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setViewType('game')}
              >
                <Gamepad2 className="w-4 h-4" />
                按游戏
              </button>
              <button
                className={`px-4 py-2 text-sm flex items-center gap-1 border-l ${viewType === 'channel' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setViewType('channel')}
              >
                <Radio className="w-4 h-4" />
                按渠道
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>计划组：{planGroups.length}</span>
            <span>游戏渠道：{planGroups.reduce((sum, g) => sum + g.gameChannels.length, 0)}</span>
            <span className="text-green-600">运行中：{planGroups.reduce((sum, g) => sum + g.gameChannels.filter(gc => gc.status === 'running').length, 0)}</span>
            <span className="text-red-600">异常：{planGroups.reduce((sum, g) => sum + g.gameChannels.filter(gc => gc.status === 'error').length, 0)}</span>
          </div>
        </div>
      </div>

      {/* 列表内容 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {viewType === 'group' ? renderGroupView() : renderGameOrChannelView()}
        
        {viewData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>暂无计划组</p>
            <p className="text-sm mt-1">点击右上角"新建计划组"开始创建</p>
          </div>
        )}
      </div>

      {/* 新建计划组弹窗 */}
      <Dialog open={showCreateGroupDialog} onOpenChange={(open) => { setShowCreateGroupDialog(open); if (!open) resetGroupForm() }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建计划组</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>计划组名称</Label>
                  <Input
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：甄选日常质检计划"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>描述</Label>
                  <Input
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="可选"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 执行配置 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">执行配置</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>执行周期</Label>
                  <Select value={groupForm.cycle} onValueChange={(v: 'daily' | 'weekly' | 'custom') => setGroupForm(prev => ({ ...prev, cycle: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">每天</SelectItem>
                      <SelectItem value="weekly">每周</SelectItem>
                      <SelectItem value="custom">自定义</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>执行时间</Label>
                  <Input
                    type="time"
                    value={groupForm.executeTime}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, executeTime: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>质检模式</Label>
                  <Select value={groupForm.mode} onValueChange={(v: 'session' | 'single') => setGroupForm(prev => ({ ...prev, mode: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">会话标注</SelectItem>
                      <SelectItem value="single">单轮标注</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>抽样数量</Label>
                  <Input
                    type="number"
                    value={groupForm.maxCount}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, maxCount: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>抽样范围</Label>
                  <Select value={groupForm.samplingScope} onValueChange={(v: 'total' | 'perGame') => setGroupForm(prev => ({ ...prev, samplingScope: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perGame">每个游戏抽取该数量</SelectItem>
                      <SelectItem value="total">所有游戏共抽取该数量</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 过滤规则 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">过滤规则</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label>关键词黑名单</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="输入关键词"
                        className="w-32 h-8"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                      />
                      <Button size="sm" variant="outline" onClick={handleAddKeyword}>添加</Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {groupForm.filter?.keywordBlacklist?.map(k => (
                      <Badge key={k} variant="secondary" className="flex items-center gap-1">
                        {k}
                        <button onClick={() => handleRemoveKeyword(k)}>
                          <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-500" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={groupForm.filter?.excludeBotOnly}
                      onCheckedChange={(c) => setGroupForm(prev => ({ ...prev, filter: { ...prev.filter!, excludeBotOnly: !!c } }))}
                    />
                    <span className="text-sm">过滤纯Bot会话</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={groupForm.filter?.excludeNoUserReply}
                      onCheckedChange={(c) => setGroupForm(prev => ({ ...prev, filter: { ...prev.filter!, excludeNoUserReply: !!c } }))}
                    />
                    <span className="text-sm">过滤用户未回复会话</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>消息数量</span>
                    <Input
                      type="number"
                      value={groupForm.filter?.minMessageCount}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, filter: { ...prev.filter!, minMessageCount: parseInt(e.target.value) || 0 } }))}
                      className="w-16 h-8"
                    />
                    <span>至</span>
                    <Input
                      type="number"
                      value={groupForm.filter?.maxMessageCount}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, filter: { ...prev.filter!, maxMessageCount: parseInt(e.target.value) || 0 } }))}
                      className="w-16 h-8"
                    />
                    <span>条</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 异常监控 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  异常监控
                </h3>
                <Switch
                  checked={groupForm.monitoring?.enabled}
                  onCheckedChange={(c: boolean) => setGroupForm(prev => ({ ...prev, monitoring: { ...prev.monitoring!, enabled: c } }))}
                />
              </div>
              {groupForm.monitoring?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={groupForm.monitoring?.metrics.dataMissing.enabled}
                        onCheckedChange={(c) => setGroupForm(prev => ({
                          ...prev,
                          monitoring: {
                            ...prev.monitoring!,
                            metrics: { ...prev.monitoring!.metrics, dataMissing: { ...prev.monitoring!.metrics.dataMissing, enabled: !!c } }
                          }
                        }))}
                      />
                      <span className="text-sm">缺数据监控</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">连续</span>
                      <Input
                        type="number"
                        value={groupForm.monitoring?.metrics.dataMissing.threshold}
                        onChange={(e) => setGroupForm(prev => ({
                          ...prev,
                          monitoring: {
                            ...prev.monitoring!,
                            metrics: { ...prev.monitoring!.metrics, dataMissing: { ...prev.monitoring!.metrics.dataMissing, threshold: parseInt(e.target.value) || 0 } }
                          }
                        }))}
                        className="w-16 h-7"
                        disabled={!groupForm.monitoring?.metrics.dataMissing.enabled}
                      />
                      <span className="text-xs text-gray-500">次</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={groupForm.monitoring?.metrics.modelError.enabled}
                        onCheckedChange={(c) => setGroupForm(prev => ({
                          ...prev,
                          monitoring: {
                            ...prev.monitoring!,
                            metrics: { ...prev.monitoring!.metrics, modelError: { ...prev.monitoring!.metrics.modelError, enabled: !!c } }
                          }
                        }))}
                      />
                      <span className="text-sm">模型报错监控</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">错误率 &gt;</span>
                      <Input
                        type="number"
                        value={groupForm.monitoring?.metrics.modelError.threshold}
                        onChange={(e) => setGroupForm(prev => ({
                          ...prev,
                          monitoring: {
                            ...prev.monitoring!,
                            metrics: { ...prev.monitoring!.metrics, modelError: { ...prev.monitoring!.metrics.modelError, threshold: parseInt(e.target.value) || 0 } }
                          }
                        }))}
                        className="w-16 h-7"
                        disabled={!groupForm.monitoring?.metrics.modelError.enabled}
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={groupForm.monitoring?.metrics.resourceInsufficient.enabled}
                        onCheckedChange={(c) => setGroupForm(prev => ({
                          ...prev,
                          monitoring: {
                            ...prev.monitoring!,
                            metrics: { ...prev.monitoring!.metrics, resourceInsufficient: { ...prev.monitoring!.metrics.resourceInsufficient, enabled: !!c } }
                          }
                        }))}
                      />
                      <span className="text-sm">资源不足监控</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">堆积 &gt;</span>
                      <Input
                        type="number"
                        value={groupForm.monitoring?.metrics.resourceInsufficient.threshold}
                        onChange={(e) => setGroupForm(prev => ({
                          ...prev,
                          monitoring: {
                            ...prev.monitoring!,
                            metrics: { ...prev.monitoring!.metrics, resourceInsufficient: { ...prev.monitoring!.metrics.resourceInsufficient, threshold: parseInt(e.target.value) || 0 } }
                          }
                        }))}
                        className="w-16 h-7"
                        disabled={!groupForm.monitoring?.metrics.resourceInsufficient.enabled}
                      />
                      <span className="text-xs text-gray-500">条</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={groupForm.monitoring?.metrics.progressAbnormal.enabled}
                        onCheckedChange={(c) => setGroupForm(prev => ({
                          ...prev,
                          monitoring: {
                            ...prev.monitoring!,
                            metrics: { ...prev.monitoring!.metrics, progressAbnormal: { ...prev.monitoring!.metrics.progressAbnormal, enabled: !!c } }
                          }
                        }))}
                      />
                      <span className="text-sm">进度异常监控</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">预计超时</span>
                      <Input
                        type="number"
                        value={groupForm.monitoring?.metrics.progressAbnormal.threshold}
                        onChange={(e) => setGroupForm(prev => ({
                          ...prev,
                          monitoring: {
                            ...prev.monitoring!,
                            metrics: { ...prev.monitoring!.metrics, progressAbnormal: { ...prev.monitoring!.metrics.progressAbnormal, threshold: parseInt(e.target.value) || 0 } }
                          }
                        }))}
                        className="w-16 h-7"
                        disabled={!groupForm.monitoring?.metrics.progressAbnormal.enabled}
                      />
                      <span className="text-xs text-gray-500">小时</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 告警配置 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  告警配置
                </h3>
                <Switch
                  checked={groupForm.alert?.enabled}
                  onCheckedChange={(c: boolean) => setGroupForm(prev => ({ ...prev, alert: { ...prev.alert!, enabled: c } }))}
                />
              </div>
              {groupForm.alert?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  {/* 告警通道 */}
                  <div className="space-y-3">
                    <Label>告警通道</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={groupForm.alert?.channels.wechat.enabled}
                          onCheckedChange={(c) => setGroupForm(prev => ({
                            ...prev,
                            alert: { ...prev.alert!, channels: { ...prev.alert!.channels, wechat: { ...prev.alert!.channels.wechat, enabled: !!c } } }
                          }))}
                        />
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <span className="text-sm">企业微信机器人</span>
                      </div>
                      {groupForm.alert?.channels.wechat.enabled && (
                        <Input
                          value={groupForm.alert?.channels.wechat.webhookUrl}
                          onChange={(e) => setGroupForm(prev => ({
                            ...prev,
                            alert: { ...prev.alert!, channels: { ...prev.alert!.channels, wechat: { ...prev.alert!.channels.wechat, webhookUrl: e.target.value } } }
                          }))}
                          placeholder="Webhook URL"
                          className="ml-6"
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={groupForm.alert?.channels.email.enabled}
                          onCheckedChange={(c) => setGroupForm(prev => ({
                            ...prev,
                            alert: { ...prev.alert!, channels: { ...prev.alert!.channels, email: { ...prev.alert!.channels.email, enabled: !!c } } }
                          }))}
                        />
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">邮件通知</span>
                      </div>
                    </div>
                  </div>
                  {/* 接收人 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>告警接收人</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={newReceiver}
                          onChange={(e) => setNewReceiver(e.target.value)}
                          placeholder="rtx(姓名)"
                          className="w-32 h-8"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddReceiver()}
                        />
                        <Button size="sm" variant="outline" onClick={handleAddReceiver}>添加</Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupForm.alert?.receivers?.map(r => (
                        <Badge key={r.rtx} variant="secondary" className="flex items-center gap-1">
                          {r.name}({r.rtx})
                          <button onClick={() => handleRemoveReceiver(r.rtx)}>
                            <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-500" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    {groupForm.alert?.channels.email.enabled && groupForm.alert?.receivers && groupForm.alert.receivers.length > 0 && (
                      <p className="text-xs text-gray-500">
                        邮件将发送至：{groupForm.alert.receivers.map(r => `${r.rtx}@tencent.com`).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>取消</Button>
              <Button onClick={handleCreateGroup} disabled={!groupForm.name}>
                <Save className="w-4 h-4 mr-1" />创建计划组
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑计划组弹窗 - 复用创建弹窗的表单结构 */}
      <Dialog open={showEditGroupDialog} onOpenChange={(open) => { setShowEditGroupDialog(open); if (!open) { setSelectedGroup(null); resetGroupForm() } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑计划组</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>计划组名称</Label>
                  <Input
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>描述</Label>
                  <Input
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 执行配置 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">执行配置</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>执行周期</Label>
                  <Select value={groupForm.cycle} onValueChange={(v: 'daily' | 'weekly' | 'custom') => setGroupForm(prev => ({ ...prev, cycle: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">每天</SelectItem>
                      <SelectItem value="weekly">每周</SelectItem>
                      <SelectItem value="custom">自定义</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>执行时间</Label>
                  <Input type="time" value={groupForm.executeTime} onChange={(e) => setGroupForm(prev => ({ ...prev, executeTime: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>质检模式</Label>
                  <Select value={groupForm.mode} onValueChange={(v: 'session' | 'single') => setGroupForm(prev => ({ ...prev, mode: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">会话标注</SelectItem>
                      <SelectItem value="single">单轮标注</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>抽样数量</Label>
                  <Input type="number" value={groupForm.maxCount} onChange={(e) => setGroupForm(prev => ({ ...prev, maxCount: parseInt(e.target.value) || 0 }))} className="mt-1" />
                </div>
                <div>
                  <Label>抽样范围</Label>
                  <Select value={groupForm.samplingScope} onValueChange={(v: 'total' | 'perGame') => setGroupForm(prev => ({ ...prev, samplingScope: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perGame">每个游戏抽取该数量</SelectItem>
                      <SelectItem value="total">所有游戏共抽取该数量</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditGroupDialog(false)}>取消</Button>
              <Button onClick={handleUpdateGroup}>
                <Save className="w-4 h-4 mr-1" />保存更改
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加游戏渠道弹窗 */}
      <Dialog open={showAddGameChannelDialog} onOpenChange={(open) => { setShowAddGameChannelDialog(open); if (!open) setGameChannelForm({ gameId: '', channel: '' }) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加游戏渠道</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">将游戏渠道添加到计划组：{selectedGroup?.name}</p>
            <div>
              <Label>选择游戏</Label>
              <Select value={gameChannelForm.gameId} onValueChange={(v) => setGameChannelForm(prev => ({ ...prev, gameId: v, channel: '' }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="选择游戏" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Map(gameChannelConfigs.map(c => [c.gameId, c])).values()).map(c => (
                    <SelectItem key={c.gameId} value={c.gameId}>{c.gameName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>选择渠道</Label>
              <Select 
                value={gameChannelForm.channel} 
                onValueChange={(v) => setGameChannelForm(prev => ({ ...prev, channel: v }))}
                disabled={!gameChannelForm.gameId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="选择渠道" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableChannels(gameChannelForm.gameId).map(c => (
                    <SelectItem key={c.channel} value={c.channel}>{c.channelName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddGameChannelDialog(false)}>取消</Button>
              <Button onClick={handleAddGameChannel} disabled={!gameChannelForm.gameId || !gameChannelForm.channel}>
                <Plus className="w-4 h-4 mr-1" />添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 异常详情弹窗 */}
      <Dialog open={showErrorDetailDialog} onOpenChange={setShowErrorDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              异常详情
            </DialogTitle>
          </DialogHeader>
          {selectedErrorInfo && (
            <div className="space-y-4 py-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="text-gray-500 text-xs">计划组</p>
                  <p className="font-medium">{selectedErrorInfo.group.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">游戏渠道</p>
                  <p className="font-medium">{selectedErrorInfo.gc.gameName} - {selectedErrorInfo.gc.channelName}</p>
                </div>
              </div>

              {/* 异常信息 */}
              {selectedErrorInfo.gc.errorInfo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getErrorTypeConfig(selectedErrorInfo.gc.errorInfo.type).color}>
                      {getErrorTypeConfig(selectedErrorInfo.gc.errorInfo.type).label}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      发生时间：{selectedErrorInfo.gc.errorInfo.occurredAt}
                    </span>
                  </div>
                  
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-red-800 text-sm">{selectedErrorInfo.gc.errorInfo.message}</p>
                    {selectedErrorInfo.gc.errorInfo.detail && (
                      <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap font-mono">
                        {selectedErrorInfo.gc.errorInfo.detail}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* 最近执行记录 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">最近执行记录</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs">执行时间</th>
                        <th className="px-3 py-2 text-left text-xs">状态</th>
                        <th className="px-3 py-2 text-left text-xs">完成/失败/异常</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedErrorInfo.gc.executions.slice(0, 5).map(exec => (
                        <tr key={exec.id}>
                          <td className="px-3 py-2 text-xs">{exec.time}</td>
                          <td className="px-3 py-2">
                            <Badge className={exec.status === 'error' ? 'bg-red-100 text-red-800' : exec.status === 'running' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                              {exec.status === 'error' ? '失败' : exec.status === 'running' ? '执行中' : '完成'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <span className="text-green-600">{exec.completed}</span> / 
                            <span className="text-red-600 mx-1">{exec.failed}</span> / 
                            <span className="text-orange-600">{exec.hasError}</span>
                            {exec.errorMessage && (
                              <p className="text-red-500 text-xs mt-1">{exec.errorMessage}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-between pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleRerun(selectedErrorInfo.group.id, selectedErrorInfo.gc.id, 'failed')
                    setShowErrorDetailDialog(false)
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />重跑失败任务
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowErrorDetailDialog(false)}>关闭</Button>
                  <Button 
                    onClick={() => {
                      handleRerun(selectedErrorInfo.group.id, selectedErrorInfo.gc.id, 'all')
                      setShowErrorDetailDialog(false)
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />全量重跑
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
