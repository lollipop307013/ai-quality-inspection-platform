import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { CalendarIcon, Plus, Settings, Users, Clock, Filter, Target, Upload, Database, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface TaskCreationDialogProps {
  children: React.ReactNode
  onTaskCreated?: (taskData: any) => void
  editingTask?: any
  isEditMode?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function TaskCreationDialog({ 
  children, 
  onTaskCreated, 
  editingTask, 
  isEditMode = false, 
  open: controlledOpen, 
  onOpenChange 
}: TaskCreationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [currentStep, setCurrentStep] = useState(0)

  // 编辑模式初始化
  React.useEffect(() => {
    if (isEditMode && editingTask) {
      // 从编辑任务中初始化表单数据
      setTaskName(editingTask.name || '')
      setTaskDescription(editingTask.description || '')
      
      // 根据编辑任务的配置初始化其他状态
      if (editingTask.config) {
        const config = editingTask.config
        setExecutionType(config.executionType || 'single')
        setExecuteImmediately(config.executeImmediately || false)
        
        if (config.singleExecutionDate) {
          setSingleExecutionDate(new Date(config.singleExecutionDate))
        }
        
        if (config.periodicConfig) {
          setPeriodicConfig(config.periodicConfig)
        }
        
        if (config.filterConfig) {
          setFilterConfig(config.filterConfig)
        }
        
        if (config.assignmentConfig) {
          setAssignmentConfig(config.assignmentConfig)
        }
        
        if (config.annotationTypes) {
          setAnnotationTypeConfig(prev => ({
            ...prev,
            selectedTypes: config.annotationTypes
          }))
        }
      }
    }
  }, [isEditMode, editingTask])
  
  // 基本信息
  const [taskName, setTaskName] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [executionType, setExecutionType] = useState<'single' | 'periodic'>('single')
  const [executeImmediately, setExecuteImmediately] = useState(false)
  
  // 单次任务配置
  const [singleExecutionDate, setSingleExecutionDate] = useState<Date>()
  
  // 周期性任务配置
  const [periodicConfig, setPeriodicConfig] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    weekdays: [] as number[], // 0-6 表示周日到周六
    executionTime: '15:00'
  })
  
  // 筛选条件
  const [filterConfig, setFilterConfig] = useState({
    // 数据源配置
    dataSource: 'online' as 'online' | 'import', // 线上日志拉取 | 导入标注数据
    
    // 线上日志拉取配置
    onlineConfig: {
      targetDB: '', // 目标拉取DB
      botId: '',
      replyTypes: [] as string[], // MQA, Agent, Manual
      riskLevels: [] as string[], // high, medium, low, none
      taskQuantity: 100,
      // 单次任务的时间范围
      singleTimeRange: {
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined
      },
      // 周期性任务的拉取范围（小时）
      periodicDataRangeHours: 24,
      enableSampling: false,
      samplingConfig: {
        quantity: 50,
        method: 'random' as 'random' | 'systematic'
      },
      enableFiltering: false,
      filteringConfig: {
        keywordFilter: '',
        noReplyFilter: false,
        botOnlyFilter: false,
        customFilters: [] as string[]
      }
    },
    
    // 导入数据配置
    importConfig: {
      file: null as File | null,
      uploadProgress: 0,
      uploadStatus: 'idle' as 'idle' | 'uploading' | 'success' | 'error',
      sessionCount: 0,
      errorMessage: ''
    }
  })
  
  // 标注类型配置
  const [annotationTypeConfig, setAnnotationTypeConfig] = useState({
    selectedTypes: [] as string[], // 选中的标注类型ID
    customTypes: [] as any[], // 自定义标注类型
    selectedTemplate: '' as string, // 选中的任务模板ID
    useTemplate: false // 是否使用模板
  })

  // 任务分配
  const [assignmentConfig, setAssignmentConfig] = useState({
    annotationType: 'cross' as 'cross' | 'distributed', // 交叉标注 | 分散标注
    allocationMethod: 'quota' as 'quota' | 'average', // 定额分配 | 平均分配
    annotators: [] as string[],
    quotaConfig: {} as Record<string, number>, // 标注员ID -> 配额
    statisticsMethod: 'average' as 'average' | 'median', // 统计方式：平均值 | 中位数（仅交叉标注）
    deadline: {
      type: 'absolute' as 'absolute' | 'relative', // 绝对时间 | 相对时间
      absoluteDate: undefined as Date | undefined,
      relativeDays: 0,
      relativeHours: 10
    }
  })

  // 模拟数据
  const dbOptions = [
    { id: 'full_message_table', name: '全量消息表' },
    { id: 'uo_gray_message_table', name: 'UO灰度消息表' },
    { id: 'test_message_table', name: '测试消息表' },
    { id: 'backup_message_table', name: '备份消息表' }
  ]

  const botOptions = [
    { id: 'bot_001', name: 'CF客服机器人' },
    { id: 'bot_002', name: '王者荣耀助手' },
    { id: 'bot_003', name: '和平精英客服' }
  ]

  // 预定义标注类型
  const availableAnnotationTypes = [
    {
      id: 'error_code',
      name: '错误码标注',
      description: '基于质检标准配置中的错误码进行标注',
      options: ['将使用质检标准配置中的错误码'],
      type: 'select',
      color: 'bg-red-100 text-red-800',
      isSystem: true
    },
    {
      id: 'message_scene',
      name: '场景分类标注',
      description: '对消息场景进行分类',
      options: ['闲聊', '攻略', '消费', '投诉', '咨询', '其他'],
      type: 'select',
      color: 'bg-blue-100 text-blue-800',
      isSystem: true
    },
    {
      id: 'dialogue_quality',
      name: '对话质量标注',
      description: '评估人设对话的质量',
      options: ['好', '中', '差'],
      type: 'select',
      color: 'bg-green-100 text-green-800',
      isSystem: true
    },
    {
      id: 'sentiment',
      name: '情感倾向标注',
      description: '分析对话的情感倾向',
      options: ['正面', '中性', '负面'],
      type: 'select',
      color: 'bg-purple-100 text-purple-800',
      isSystem: true
    }
  ]

  const annotatorOptions = [
    { id: 'user1', name: '张三', role: '高级质检员', workload: 85 },
    { id: 'user2', name: '李四', role: '质检员', workload: 72 },
    { id: 'user3', name: '王五', role: '质检员', workload: 68 },
    { id: 'user4', name: '赵六', role: '初级质检员', workload: 45 }
  ]

  // 任务模板定义
  const taskTemplates = [
    {
      id: 'customer_service_quality',
      name: '客服质量检测模板',
      description: '适用于客服对话质量检测，包含错误码、场景分类、质量评分等标注类型',
      category: '客服质检',
      annotationTypes: ['error_code', 'message_scene', 'dialogue_quality'],
      customTypes: [
        {
          name: '服务态度评分',
          type: 'input',
          inputType: 'number',
          placeholder: '1-10分',
          validation: { min: 1, max: 10 }
        },
        {
          name: '处理结果',
          type: 'select',
          options: ['已解决', '转人工', '待跟进', '无需处理']
        }
      ],
      defaultAssignment: {
        annotationType: 'cross',
        allocationMethod: 'quota'
      },
      tags: ['客服', '质量', '评分'],
      usageCount: 156,
      lastUsed: '2025-01-15',
      creator: 'admin'
    },
    {
      id: 'game_consultation_template',
      name: '游戏咨询标注模板',
      description: '专门用于游戏相关咨询对话的标注，包含场景分类、情感分析等',
      category: '游戏咨询',
      annotationTypes: ['message_scene', 'sentiment'],
      customTypes: [
        {
          name: '游戏类型',
          type: 'select',
          options: ['穿越火线', '王者荣耀', '和平精英', '其他']
        },
        {
          name: '问题复杂度',
          type: 'select',
          options: ['简单', '中等', '复杂']
        },
        {
          name: '满意度评分',
          type: 'input',
          inputType: 'number',
          placeholder: '1-5分',
          validation: { min: 1, max: 5 }
        }
      ],
      defaultAssignment: {
        annotationType: 'distributed',
        allocationMethod: 'average'
      },
      tags: ['游戏', '咨询', '满意度'],
      usageCount: 89,
      lastUsed: '2025-01-12',
      creator: 'manager'
    },
    {
      id: 'comprehensive_quality_template',
      name: '综合质量评估模板',
      description: '全面的对话质量评估模板，包含多维度标注指标',
      category: '综合评估',
      annotationTypes: ['error_code', 'message_scene', 'dialogue_quality', 'sentiment'],
      customTypes: [
        {
          name: '专业度评分',
          type: 'input',
          inputType: 'number',
          placeholder: '1-10分',
          validation: { min: 1, max: 10 }
        },
        {
          name: '响应及时性',
          type: 'select',
          options: ['及时', '较及时', '延迟', '严重延迟']
        },
        {
          name: '问题解决程度',
          type: 'select',
          options: ['完全解决', '部分解决', '未解决', '需要跟进']
        }
      ],
      defaultAssignment: {
        annotationType: 'cross',
        allocationMethod: 'quota'
      },
      tags: ['综合', '质量', '多维度'],
      usageCount: 234,
      lastUsed: '2025-01-16',
      creator: 'charliazhang'
    }
  ]

  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  // 生成任务名称（周期性任务自动添加日期）
  const generateTaskName = () => {
    if (executionType === 'periodic' && taskName && !taskName.includes('20')) {
      const today = format(new Date(), 'yyyyMMdd')
      return `${taskName}${today}`
    }
    return taskName
  }

  // 处理标注类型选择
  const handleAnnotationTypeChange = (typeId: string, checked: boolean) => {
    const newSelectedTypes = checked
      ? [...annotationTypeConfig.selectedTypes, typeId]
      : annotationTypeConfig.selectedTypes.filter(id => id !== typeId)
    
    setAnnotationTypeConfig({
      ...annotationTypeConfig,
      selectedTypes: newSelectedTypes
    })
  }

  // 处理模板选择
  const handleTemplateSelection = (templateId: string) => {
    const template = taskTemplates.find(t => t.id === templateId)
    if (template) {
      setAnnotationTypeConfig({
        ...annotationTypeConfig,
        selectedTemplate: templateId,
        selectedTypes: template.annotationTypes,
        customTypes: template.customTypes,
        useTemplate: true
      })
      
      // 同时更新任务分配的默认配置
      setAssignmentConfig({
        ...assignmentConfig,
        annotationType: template.defaultAssignment.annotationType as "cross" | "distributed",
        allocationMethod: template.defaultAssignment.allocationMethod as "average" | "quota"
      })
    }
  }

  // 清除模板选择
  const clearTemplateSelection = () => {
    setAnnotationTypeConfig({
      ...annotationTypeConfig,
      selectedTemplate: '',
      useTemplate: false
    })
  }

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFilterConfig({
        ...filterConfig,
        importConfig: {
          ...filterConfig.importConfig,
          file,
          uploadStatus: 'uploading',
          uploadProgress: 0
        }
      })

      // 模拟上传进度
      const interval = setInterval(() => {
        setFilterConfig(prev => {
          const newProgress = prev.importConfig.uploadProgress + 10
          if (newProgress >= 100) {
            clearInterval(interval)
            return {
              ...prev,
              importConfig: {
                ...prev.importConfig,
                uploadProgress: 100,
                uploadStatus: 'success',
                sessionCount: Math.floor(Math.random() * 1000) + 100 // 模拟会话数量
              }
            }
          }
          return {
            ...prev,
            importConfig: {
              ...prev.importConfig,
              uploadProgress: newProgress
            }
          }
        })
      }, 200)
    }
  }

  // 下载导入模板
  const downloadTemplate = () => {
    // 模拟下载模板文件
    const templateData = `会话ID,用户消息,机器人回复,时间戳,风险等级
session_001,你好,您好！有什么可以帮助您的吗？,2024-01-01 10:00:00,low
session_002,我想咨询游戏问题,请问您遇到了什么具体问题？,2024-01-01 10:01:00,none`
    
    const blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '标注数据导入模板.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 步骤配置
  const steps = [
    { id: 'basic', title: '基本信息', description: '设置任务名称和执行方式' },
    { id: 'annotation-types', title: '标注类型', description: '选择标注任务的类型' },
    { id: 'filter', title: '筛选条件', description: '配置数据筛选和拉取范围' },
    { id: 'assignment', title: '任务分配', description: '设置标注人员和分配方式' },
    { id: 'deadline', title: '完成期限', description: '设置任务完成时限' }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // 基本信息
        if (!taskName) return false
        if (executionType === 'single' && !executeImmediately && !singleExecutionDate) return false
        if (executionType === 'periodic') {
          const { startDate, endDate, weekdays } = periodicConfig
          if (!startDate || !endDate || weekdays.length === 0) return false
        }
        return true
      case 1: // 标注类型
        return annotationTypeConfig.selectedTypes.length > 0
      case 2: // 筛选条件
        if (filterConfig.dataSource === 'online') {
          return filterConfig.onlineConfig.targetDB && filterConfig.onlineConfig.botId
        } else {
          return filterConfig.importConfig.uploadStatus === 'success'
        }
      case 3: // 任务分配
        return assignmentConfig.annotators.length > 0
      default:
        return true
    }
  }

  // 处理周期性配置
  const handleWeekdayChange = (day: number, checked: boolean) => {
    const newWeekdays = checked 
      ? [...periodicConfig.weekdays, day]
      : periodicConfig.weekdays.filter(d => d !== day)
    setPeriodicConfig({ ...periodicConfig, weekdays: newWeekdays })
  }

  // 处理回复类型选择
  const handleReplyTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filterConfig.onlineConfig.replyTypes, type]
      : filterConfig.onlineConfig.replyTypes.filter(t => t !== type)
    setFilterConfig({ 
      ...filterConfig, 
      onlineConfig: { ...filterConfig.onlineConfig, replyTypes: newTypes }
    })
  }

  // 处理风险等级选择
  const handleRiskLevelChange = (level: string, checked: boolean) => {
    const newLevels = checked
      ? [...filterConfig.onlineConfig.riskLevels, level]
      : filterConfig.onlineConfig.riskLevels.filter(l => l !== level)
    setFilterConfig({ 
      ...filterConfig, 
      onlineConfig: { ...filterConfig.onlineConfig, riskLevels: newLevels }
    })
  }

  // 处理标注员选择
  const handleAnnotatorChange = (annotatorId: string, checked: boolean) => {
    const newAnnotators = checked
      ? [...assignmentConfig.annotators, annotatorId]
      : assignmentConfig.annotators.filter(id => id !== annotatorId)
    
    // 如果是定额分配，初始化配额
    const newQuotaConfig = { ...assignmentConfig.quotaConfig }
    if (checked && assignmentConfig.allocationMethod === 'quota') {
      const taskQuantity = filterConfig.dataSource === 'online' 
        ? filterConfig.onlineConfig.taskQuantity 
        : filterConfig.importConfig.sessionCount
      newQuotaConfig[annotatorId] = Math.floor(taskQuantity / (newAnnotators.length || 1))
    } else if (!checked) {
      delete newQuotaConfig[annotatorId]
    }
    
    setAssignmentConfig({ 
      ...assignmentConfig, 
      annotators: newAnnotators,
      quotaConfig: newQuotaConfig
    })
  }

  // 处理配额变更
  const handleQuotaChange = (annotatorId: string, quota: number) => {
    setAssignmentConfig({
      ...assignmentConfig,
      quotaConfig: {
        ...assignmentConfig.quotaConfig,
        [annotatorId]: quota
      }
    })
  }

  // 计算总配额
  const getTotalQuota = () => {
    return Object.values(assignmentConfig.quotaConfig).reduce((sum, quota) => sum + quota, 0)
  }

  // 获取任务总数
  const getTaskQuantity = () => {
    return filterConfig.dataSource === 'online' 
      ? filterConfig.onlineConfig.taskQuantity 
      : filterConfig.importConfig.sessionCount
  }

  // 生成配置预览 - 自然语言描述
  const generateConfigPreview = () => {
    // 检查是否有任何配置
    const hasAnyConfig = taskName || taskDescription || 
      annotationTypeConfig.selectedTypes.length > 0 ||
      (filterConfig.dataSource === 'online' && (filterConfig.onlineConfig.targetDB || filterConfig.onlineConfig.botId)) ||
      (filterConfig.dataSource === 'import' && filterConfig.importConfig.uploadStatus === 'success') ||
      assignmentConfig.annotators.length > 0 ||
      (executionType === 'single' && (executeImmediately || singleExecutionDate)) ||
      (executionType === 'periodic' && periodicConfig.startDate && periodicConfig.weekdays.length > 0)

    // 如果没有任何配置，显示默认提示
    if (!hasAnyConfig) {
      return "您的所有配置将在此处生成预览"
    }

    let description = ""
    
    // 基本信息
    if (taskName) {
      description += `将创建名为"${generateTaskName()}"的质检任务`
    } else {
      // 如果没有标题但有其他配置，显示通用描述
      description += "将创建一个新的标注任务"
    }
    
    // 执行配置
    if (executionType === 'single') {
      if (executeImmediately) {
        description += "，立即执行"
      } else if (singleExecutionDate) {
        description += `，将于${format(singleExecutionDate, 'yyyy年MM月dd日 HH:mm')}执行`
      }
    } else if (executionType === 'periodic' && periodicConfig.startDate && periodicConfig.weekdays.length > 0) {
      const startStr = format(periodicConfig.startDate, 'yyyy-M-d')
      const endStr = periodicConfig.endDate ? format(periodicConfig.endDate, 'yyyy-M-d') : ''
      const weekdayStr = periodicConfig.weekdays.map(day => weekdayNames[day]).join('、')
      description += `，${startStr}到${endStr} 每${weekdayStr}，每天${periodicConfig.executionTime}执行`
    }
    
    // 标注类型
    if (annotationTypeConfig.selectedTypes.length > 0) {
      const typeNames = annotationTypeConfig.selectedTypes.map(typeId => {
        const type = availableAnnotationTypes.find(t => t.id === typeId)
        return type?.name
      }).filter(Boolean).join('、')
      description += `。将进行${typeNames}等标注`
    }
    
    // 数据源
    if (filterConfig.dataSource === 'online') {
      if (filterConfig.onlineConfig.targetDB || filterConfig.onlineConfig.botId) {
        description += `。数据来源：从${filterConfig.onlineConfig.targetDB || '数据库'}拉取`
        if (filterConfig.onlineConfig.botId) {
          const bot = botOptions.find(b => b.id === filterConfig.onlineConfig.botId)
          description += `${bot?.name || filterConfig.onlineConfig.botId}的对话数据`
        }
        if (filterConfig.onlineConfig.taskQuantity) {
          description += `，共${filterConfig.onlineConfig.taskQuantity}条`
        }
      }
    } else if (filterConfig.importConfig.uploadStatus === 'success') {
      description += `。数据来源：导入的本地文件，共${filterConfig.importConfig.sessionCount}条会话`
    }
    
    // 任务分配
    if (assignmentConfig.annotators.length > 0) {
      description += `。分配给${assignmentConfig.annotators.length}位标注员`
      if (assignmentConfig.annotationType === 'cross') {
        description += "进行交叉标注"
      } else {
        description += "进行分散标注"
      }
    }
    
    // 完成期限
    if (assignmentConfig.deadline.type === 'absolute' && assignmentConfig.deadline.absoluteDate) {
      description += `，需在${format(assignmentConfig.deadline.absoluteDate, 'yyyy年MM月dd日 HH:mm')}前完成`
    } else if (assignmentConfig.deadline.type === 'relative') {
      const { relativeDays, relativeHours } = assignmentConfig.deadline
      if (relativeDays > 0 || relativeHours > 0) {
        description += `，需在任务生成后${relativeDays}天${relativeHours}小时内完成`
      }
    }
    
    if (taskDescription) {
      description += `。任务要求：${taskDescription}`
    }
    
    if (description && !description.endsWith('。')) {
      description += "。"
    }
    
    return description
  }

  // 处理任务创建
  const handleSubmit = () => {
    const taskQuantity = getTaskQuantity()
    
    // 生成符合任务中心数据结构的任务数据
    const newTask = {
      id: Date.now(), // 使用时间戳作为临时ID
      name: generateTaskName(),
      description: taskDescription || `这是一个${executionType === 'periodic' ? '周期性' : '单次'}质检任务`,
      status: executeImmediately ? 'running' : 'pending',
      totalCount: taskQuantity,
      completedCount: 0,
      errorRate: '0.0',
      similarity: '100.0',
      annotators: assignmentConfig.annotators.map(id => {
        const annotator = annotatorOptions.find(a => a.id === id)
        return {
          name: annotator?.name || id,
          assigned: assignmentConfig.allocationMethod === 'quota' 
            ? (assignmentConfig.quotaConfig[id] || 0)
            : Math.floor(taskQuantity / assignmentConfig.annotators.length),
          completed: 0
        }
      }),
      createdAt: new Date().toLocaleDateString(),
      deadline: assignmentConfig.deadline.type === 'absolute' && assignmentConfig.deadline.absoluteDate
        ? assignmentConfig.deadline.absoluteDate.toLocaleDateString()
        : new Date(Date.now() + (assignmentConfig.deadline.relativeDays * 24 + assignmentConfig.deadline.relativeHours) * 60 * 60 * 1000).toLocaleDateString(),
      taskType: executionType,
      botId: filterConfig.dataSource === 'online' ? filterConfig.onlineConfig.botId : 'imported_data',
      replyType: filterConfig.dataSource === 'online' && filterConfig.onlineConfig.replyTypes.length > 0 
        ? (filterConfig.onlineConfig.replyTypes.length === 1 ? 'auto' : 'mixed')
        : 'mixed',
      riskLevel: filterConfig.dataSource === 'online' && filterConfig.onlineConfig.riskLevels.length > 0
        ? filterConfig.onlineConfig.riskLevels[0]
        : 'medium',
      // 额外的配置信息
      config: {
        executionType,
        executeImmediately,
        singleExecutionDate,
        periodicConfig,
        filterConfig,
        assignmentConfig,
        annotationTypes: annotationTypeConfig.selectedTypes
      }
    }
    
    console.log('创建任务:', newTask)
    
    // 调用回调函数将任务添加到任务列表
    if (onTaskCreated) {
      onTaskCreated(newTask)
    }
    
    setOpen(false)
    
    // 重置表单
    setCurrentStep(0)
    setTaskName('')
    setTaskDescription('')
    setExecutionType('single')
    setExecuteImmediately(false)
    setSingleExecutionDate(undefined)
    setPeriodicConfig({
      startDate: undefined,
      endDate: undefined,
      weekdays: [],
      executionTime: '15:00'
    })
    setFilterConfig({
      dataSource: 'online',
      onlineConfig: {
        targetDB: '',
        botId: '',
        replyTypes: [],
        riskLevels: [],
        taskQuantity: 100,
        singleTimeRange: {
          startDate: undefined,
          endDate: undefined
        },
        periodicDataRangeHours: 24,
        enableSampling: false,
        samplingConfig: {
          quantity: 50,
          method: 'random'
        },
        enableFiltering: false,
        filteringConfig: {
          keywordFilter: '',
          noReplyFilter: false,
          botOnlyFilter: false,
          customFilters: []
        }
      },
      importConfig: {
        file: null,
        uploadProgress: 0,
        uploadStatus: 'idle',
        sessionCount: 0,
        errorMessage: ''
      }
    })
    setAnnotationTypeConfig({
      selectedTypes: [],
      customTypes: [],
      selectedTemplate: '',
      useTemplate: false
    })
    setAssignmentConfig({
      annotationType: 'cross',
      allocationMethod: 'quota',
      annotators: [],
      quotaConfig: {},
      deadline: {
        type: 'absolute',
        absoluteDate: undefined,
        relativeDays: 0,
        relativeHours: 10
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            {isEditMode ? '编辑质检任务' : '创建质检任务'}
          </DialogTitle>
        </DialogHeader>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index === currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : index < currentStep 
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 text-gray-400'
              }`}>
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  index === currentStep ? 'text-blue-600' : index < currentStep ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* 步骤内容 */}
        <div className="min-h-[500px]">
          {/* 基本信息 */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">任务基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="task-name">任务名称 *</Label>
                    <Input
                      id="task-name"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder="请输入任务名称"
                    />
                    {executionType === 'periodic' && taskName && (
                      <p className="text-sm text-gray-600 mt-1">
                        周期性任务将自动生成：{generateTaskName()}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="task-description">任务简介</Label>
                    <Textarea
                      id="task-description"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="请描述任务的具体要求和目标（可选）"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>执行频次 *</Label>
                    <RadioGroup 
                      value={executionType} 
                      onValueChange={(value: 'single' | 'periodic') => setExecutionType(value)}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single">单次</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="periodic" id="periodic" />
                        <Label htmlFor="periodic">周期</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 单次任务配置 */}
                  {executionType === 'single' && (
                    <Card className="border-blue-200 bg-blue-50/30">
                      <CardContent className="pt-4">
                        <div className="flex items-center space-x-4 mb-4">
                          <Checkbox
                            id="execute-immediately"
                            checked={executeImmediately}
                            onCheckedChange={(checked) => setExecuteImmediately(checked as boolean)}
                          />
                          <Label htmlFor="execute-immediately">立即执行</Label>
                        </div>
                        
                        {!executeImmediately && (
                          <div>
                            <Label>执行时间</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal mt-2",
                                    !singleExecutionDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {singleExecutionDate ? format(singleExecutionDate, "yyyy-MM-dd HH:mm") : "选择执行时间"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={singleExecutionDate}
                                  onSelect={setSingleExecutionDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 周期性任务配置 */}
                  {executionType === 'periodic' && (
                    <Card className="border-green-200 bg-green-50/30">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Clock className="w-5 h-5 mr-2" />
                          周期性配置
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>开始日期</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal mt-2",
                                    !periodicConfig.startDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {periodicConfig.startDate ? format(periodicConfig.startDate, "yyyy-MM-dd") : "选择开始日期"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={periodicConfig.startDate}
                                  onSelect={(date) => setPeriodicConfig({...periodicConfig, startDate: date})}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div>
                            <Label>结束日期</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal mt-2",
                                    !periodicConfig.endDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {periodicConfig.endDate ? format(periodicConfig.endDate, "yyyy-MM-dd") : "选择结束日期"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={periodicConfig.endDate}
                                  onSelect={(date) => setPeriodicConfig({...periodicConfig, endDate: date})}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <div>
                          <Label>执行星期（可多选）</Label>
                          <div className="grid grid-cols-7 gap-2 mt-2">
                            {weekdayNames.map((name, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`weekday-${index}`}
                                  checked={periodicConfig.weekdays.includes(index)}
                                  onCheckedChange={(checked) => handleWeekdayChange(index, checked as boolean)}
                                />
                                <Label htmlFor={`weekday-${index}`} className="text-sm">
                                  {name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label>执行时间点</Label>
                          <Input
                            type="time"
                            value={periodicConfig.executionTime}
                            onChange={(e) => setPeriodicConfig({...periodicConfig, executionTime: e.target.value})}
                            className="mt-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
              
              {/* 配置预览 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Settings className="w-4 h-4 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">配置预览</h3>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {generateConfigPreview()}
                </p>
              </div>
            </div>
          )}

          {/* 标注类型选择 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* 任务模板选择 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    任务模板（可选）
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    {/* 任务模板开关 */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label className="text-base font-medium">使用任务模板</Label>
                        {annotationTypeConfig.useTemplate ? (
                          <p className="text-sm text-gray-600 mt-1">
                            选择适合的任务模板，系统将自动配置相应的标注类型和分配方式
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1">
                            开启后可选择预设模板快速配置标注类型和分配方式
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="use-template-switch"
                          checked={annotationTypeConfig.useTemplate}
                          onChange={(e) => {
                            const useTemplate = e.target.checked
                            setAnnotationTypeConfig({
                              ...annotationTypeConfig,
                              useTemplate,
                              selectedTemplate: useTemplate ? annotationTypeConfig.selectedTemplate : '',
                              selectedTypes: useTemplate ? annotationTypeConfig.selectedTypes : [],
                              customTypes: useTemplate ? annotationTypeConfig.customTypes : []
                            })
                          }}
                          className="sr-only"
                        />
                        <label
                          htmlFor="use-template-switch"
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            annotationTypeConfig.useTemplate ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              annotationTypeConfig.useTemplate ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </label>
                      </div>
                    </div>

                    {/* 模板选择区域 - 只有开启开关后才显示 */}
                    {annotationTypeConfig.useTemplate && (
                      <div>
                        
                        {/* 模板选择网格 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {taskTemplates.map((template) => (
                        <div 
                          key={template.id} 
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            annotationTypeConfig.selectedTemplate === template.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleTemplateSelection(template.id)}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{template.name}</h4>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {template.category}
                                </Badge>
                              </div>
                              {annotationTypeConfig.selectedTemplate === template.id && (
                                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {template.description}
                            </p>
                            
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {template.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>使用次数: {template.usageCount}</span>
                                <span>最近使用: {template.lastUsed}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 已选择模板的详细信息 */}
                    {annotationTypeConfig.selectedTemplate && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        {(() => {
                          const selectedTemplate = taskTemplates.find(t => t.id === annotationTypeConfig.selectedTemplate)
                          return selectedTemplate ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                                  <h4 className="font-medium text-blue-900">已选择: {selectedTemplate.name}</h4>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={clearTemplateSelection}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  清除选择
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-blue-800">包含标注类型:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedTemplate.annotationTypes.map((typeId) => {
                                      const type = availableAnnotationTypes.find(t => t.id === typeId)
                                      return type ? (
                                        <Badge key={typeId} className={type.color}>
                                          {type.name}
                                        </Badge>
                                      ) : null
                                    })}
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-blue-800">自定义字段:</span>
                                  <div className="mt-1">
                                    {selectedTemplate.customTypes.length > 0 ? (
                                      <ul className="text-xs text-blue-700 space-y-1">
                                        {selectedTemplate.customTypes.map((custom, index) => (
                                          <li key={index}>• {custom.name} ({custom.type})</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-xs text-blue-600">无</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-xs text-blue-700">
                                <span className="font-medium">默认分配方式:</span> 
                                {selectedTemplate.defaultAssignment.annotationType === 'cross' ? '交叉标注' : '分散标注'} - 
                                {selectedTemplate.defaultAssignment.allocationMethod === 'quota' ? '定额分配' : '平均分配'}
                              </div>
                            </div>
                          ) : null
                        })()}
                      </div>
                      )}
                    </div>
                  )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    {annotationTypeConfig.useTemplate ? '确认标注类型' : '选择标注类型'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {annotationTypeConfig.useTemplate ? (
                    /* 使用模板时的确认界面 */
                    <div>
                      <Label>模板标注类型确认</Label>
                      <p className="text-sm text-gray-600 mt-1 mb-3">
                        当您选择模板后，在此处配置标注项目
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableAnnotationTypes.filter(type => 
                          taskTemplates.find(t => t.id === annotationTypeConfig.selectedTemplate)?.annotationTypes.includes(type.id)
                        ).map((type) => (
                          <div key={type.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={`annotation-type-${type.id}`}
                                checked={annotationTypeConfig.selectedTypes.includes(type.id)}
                                onCheckedChange={(checked) => handleAnnotationTypeChange(type.id, checked as boolean)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label 
                                  htmlFor={`annotation-type-${type.id}`} 
                                  className="font-medium cursor-pointer"
                                >
                                  {type.name}
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {type.options.slice(0, 3).map((option, index) => (
                                    <Badge key={index} className={type.color}>
                                      {option}
                                    </Badge>
                                  ))}
                                  {type.options.length > 3 && (
                                    <Badge variant="outline">
                                      +{type.options.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* 显示模板的自定义字段 */}
                      {(() => {
                        const selectedTemplate = taskTemplates.find(t => t.id === annotationTypeConfig.selectedTemplate)
                        return selectedTemplate && selectedTemplate.customTypes.length > 0 ? (
                          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center mb-2">
                              <Plus className="w-4 h-4 mr-2 text-green-600" />
                              <h4 className="font-medium text-green-900">模板自定义字段</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {selectedTemplate.customTypes.map((custom, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <div>
                                    <span className="font-medium text-sm">{custom.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">({custom.type})</span>
                                  </div>
                                  {custom.type === 'select' && custom.options && (
                                    <div className="flex gap-1">
                                      {custom.options.slice(0, 2).map((option: string, optIndex: number) => (
                                        <Badge key={optIndex} variant="outline" className="text-xs">
                                          {option}
                                        </Badge>
                                      ))}
                                      {custom.options.length > 2 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{custom.options.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null
                      })()}
                    </div>
                  ) : (
                    /* 手动选择标注类型 */
                    <div>
                      <Label>标注类型（可多选）</Label>
                      <p className="text-sm text-gray-600 mt-1 mb-3">
                        选择本次标注任务需要进行的标注类型，可以选择多个类型进行组合标注
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableAnnotationTypes.map((type) => (
                          <div key={type.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={`annotation-type-${type.id}`}
                                checked={annotationTypeConfig.selectedTypes.includes(type.id)}
                                onCheckedChange={(checked) => handleAnnotationTypeChange(type.id, checked as boolean)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label 
                                  htmlFor={`annotation-type-${type.id}`} 
                                  className="font-medium cursor-pointer"
                                >
                                  {type.name}
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {type.options.slice(0, 3).map((option, index) => (
                                    <Badge key={index} className={type.color}>
                                      {option}
                                    </Badge>
                                  ))}
                                  {type.options.length > 3 && (
                                    <Badge variant="outline">
                                      +{type.options.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                </CardContent>
              </Card>
              
              {/* 配置预览 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Settings className="w-4 h-4 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">配置预览</h3>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {generateConfigPreview()}
                </p>
              </div>
            </div>
          )}

          {/* 筛选条件 - 数据源配置 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    数据筛选条件
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 数据源选择 */}
                  <div>
                    <Label className="text-base font-medium">数据源选择 *</Label>
                    <RadioGroup 
                      value={filterConfig.dataSource} 
                      onValueChange={(value: 'online' | 'import') => setFilterConfig({...filterConfig, dataSource: value})}
                      className="flex space-x-6 mt-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="flex items-center">
                          <Database className="w-4 h-4 mr-2" />
                          从线上日志中拉取
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="import" id="import" />
                        <Label htmlFor="import" className="flex items-center">
                          <Upload className="w-4 h-4 mr-2" />
                          导入标注数据
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 线上日志拉取配置 */}
                  {filterConfig.dataSource === 'online' && (
                    <Card className="border-blue-200 bg-blue-50/30">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <Database className="w-4 h-4 mr-2" />
                          线上日志拉取配置
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 目标数据库选择 */}
                        <div>
                          <Label>目标拉取DB *</Label>
                          <Select 
                            value={filterConfig.onlineConfig.targetDB} 
                            onValueChange={(value) => setFilterConfig({
                              ...filterConfig, 
                              onlineConfig: { ...filterConfig.onlineConfig, targetDB: value }
                            })}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="选择目标数据库" />
                            </SelectTrigger>
                            <SelectContent>
                              {dbOptions.map(db => (
                                <SelectItem key={db.id} value={db.id}>{db.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 显示当前配置项 */}
                        {filterConfig.onlineConfig.targetDB && (
                          <div className="space-y-4 p-4 bg-white rounded-lg border">
                            <h4 className="font-medium text-gray-900">当前配置项</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Bot ID *</Label>
                                <Select 
                                  value={filterConfig.onlineConfig.botId} 
                                  onValueChange={(value) => setFilterConfig({
                                    ...filterConfig, 
                                    onlineConfig: { ...filterConfig.onlineConfig, botId: value }
                                  })}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="选择Bot" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {botOptions.map(bot => (
                                      <SelectItem key={bot.id} value={bot.id}>{bot.name} ({bot.id})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label>任务数量</Label>
                                <Input
                                  type="number"
                                  value={filterConfig.onlineConfig.taskQuantity}
                                  onChange={(e) => setFilterConfig({
                                    ...filterConfig, 
                                    onlineConfig: { 
                                      ...filterConfig.onlineConfig, 
                                      taskQuantity: parseInt(e.target.value) || 0 
                                    }
                                  })}
                                  className="mt-2"
                                  min="1"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>回复类型（可多选）</Label>
                              <div className="grid grid-cols-3 gap-3 mt-2">
                                {[
                                  { id: 'MQA', name: 'MQA' },
                                  { id: 'Agent', name: 'Agent（LLM）' },
                                  { id: 'Manual', name: '人工' }
                                ].map(type => (
                                  <div key={type.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`reply-${type.id}`}
                                      checked={filterConfig.onlineConfig.replyTypes.includes(type.id)}
                                      onCheckedChange={(checked) => handleReplyTypeChange(type.id, checked as boolean)}
                                    />
                                    <Label htmlFor={`reply-${type.id}`}>{type.name}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <Label>风险程度（可多选）</Label>
                              <div className="grid grid-cols-5 gap-3 mt-2">
                                {[
                                  { id: 'high', name: '高', color: 'text-red-800' },
                                  { id: 'critical', name: '严重', color: 'text-red-600' },
                                  { id: 'medium', name: '中', color: 'text-yellow-600' },
                                  { id: 'low', name: '低', color: 'text-green-600' },
                                  { id: 'none', name: '无', color: 'text-gray-600' }
                                ].map(level => (
                                  <div key={level.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`risk-${level.id}`}
                                      checked={filterConfig.onlineConfig.riskLevels.includes(level.id)}
                                      onCheckedChange={(checked) => handleRiskLevelChange(level.id, checked as boolean)}
                                    />
                                    <Label htmlFor={`risk-${level.id}`} className={level.color}>{level.name}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 时间范围配置 */}
                            {executionType === 'single' ? (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>时间范围 - 开始时间</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal mt-2",
                                          !filterConfig.onlineConfig.singleTimeRange.startDate && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filterConfig.onlineConfig.singleTimeRange.startDate 
                                          ? format(filterConfig.onlineConfig.singleTimeRange.startDate, "yyyy-MM-dd") 
                                          : "选择开始时间"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={filterConfig.onlineConfig.singleTimeRange.startDate}
                                        onSelect={(date) => setFilterConfig({
                                          ...filterConfig,
                                          onlineConfig: {
                                            ...filterConfig.onlineConfig,
                                            singleTimeRange: { 
                                              ...filterConfig.onlineConfig.singleTimeRange, 
                                              startDate: date 
                                            }
                                          }
                                        })}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                
                                <div>
                                  <Label>时间范围 - 结束时间</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal mt-2",
                                          !filterConfig.onlineConfig.singleTimeRange.endDate && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filterConfig.onlineConfig.singleTimeRange.endDate 
                                          ? format(filterConfig.onlineConfig.singleTimeRange.endDate, "yyyy-MM-dd") 
                                          : "选择结束时间"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={filterConfig.onlineConfig.singleTimeRange.endDate}
                                        onSelect={(date) => setFilterConfig({
                                          ...filterConfig,
                                          onlineConfig: {
                                            ...filterConfig.onlineConfig,
                                            singleTimeRange: { 
                                              ...filterConfig.onlineConfig.singleTimeRange, 
                                              endDate: date 
                                            }
                                          }
                                        })}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <Label>周期性拉取范围（小时）</Label>
                                <Input
                                  type="number"
                                  value={filterConfig.onlineConfig.periodicDataRangeHours}
                                  onChange={(e) => setFilterConfig({
                                    ...filterConfig,
                                    onlineConfig: {
                                      ...filterConfig.onlineConfig,
                                      periodicDataRangeHours: parseInt(e.target.value) || 24
                                    }
                                  })}
                                  className="mt-2"
                                  min="1"
                                  max="168"
                                />
                                <p className="text-sm text-gray-600 mt-1">
                                  每次执行时拉取过去{filterConfig.onlineConfig.periodicDataRangeHours}小时的数据
                                </p>
                              </div>
                            )}

                            {/* 抽样配置 */}
                            <Card className="border-purple-200 bg-purple-50/30">
                              <CardContent className="pt-4">
                                <div className="flex items-center space-x-2 mb-4">
                                  <Checkbox
                                    id="enable-sampling"
                                    checked={filterConfig.onlineConfig.enableSampling}
                                    onCheckedChange={(checked) => setFilterConfig({
                                      ...filterConfig,
                                      onlineConfig: {
                                        ...filterConfig.onlineConfig,
                                        enableSampling: checked as boolean
                                      }
                                    })}
                                  />
                                  <Label htmlFor="enable-sampling">启用抽样</Label>
                                </div>
                                
                                {filterConfig.onlineConfig.enableSampling && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>抽样数量</Label>
                                      <Input
                                        type="number"
                                        value={filterConfig.onlineConfig.samplingConfig.quantity}
                                        onChange={(e) => setFilterConfig({
                                          ...filterConfig,
                                          onlineConfig: {
                                            ...filterConfig.onlineConfig,
                                            samplingConfig: {
                                              ...filterConfig.onlineConfig.samplingConfig,
                                              quantity: parseInt(e.target.value) || 0
                                            }
                                          }
                                        })}
                                        className="mt-2"
                                        min="1"
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label>抽样形式</Label>
                                      <Select 
                                        value={filterConfig.onlineConfig.samplingConfig.method}
                                        onValueChange={(value: 'random' | 'systematic') => setFilterConfig({
                                          ...filterConfig,
                                          onlineConfig: {
                                            ...filterConfig.onlineConfig,
                                            samplingConfig: { 
                                              ...filterConfig.onlineConfig.samplingConfig, 
                                              method: value 
                                            }
                                          }
                                        })}
                                      >
                                        <SelectTrigger className="mt-2">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="random">随机抽样</SelectItem>
                                          <SelectItem value="systematic">系统抽样</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* 过滤配置 */}
                            <Card className="border-orange-200 bg-orange-50/30">
                              <CardContent className="pt-4">
                                <div className="flex items-center space-x-2 mb-4">
                                  <Checkbox
                                    id="enable-filtering"
                                    checked={filterConfig.onlineConfig.enableFiltering}
                                    onCheckedChange={(checked) => setFilterConfig({
                                      ...filterConfig,
                                      onlineConfig: {
                                        ...filterConfig.onlineConfig,
                                        enableFiltering: checked as boolean
                                      }
                                    })}
                                  />
                                  <Label htmlFor="enable-filtering">启用过滤</Label>
                                </div>
                                
                                {filterConfig.onlineConfig.enableFiltering && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label>关键词过滤</Label>
                                      <Input
                                        value={filterConfig.onlineConfig.filteringConfig.keywordFilter}
                                        onChange={(e) => setFilterConfig({
                                          ...filterConfig,
                                          onlineConfig: {
                                            ...filterConfig.onlineConfig,
                                            filteringConfig: {
                                              ...filterConfig.onlineConfig.filteringConfig,
                                              keywordFilter: e.target.value
                                            }
                                          }
                                        })}
                                        placeholder="输入关键词，用逗号分隔"
                                        className="mt-2"
                                      />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="no-reply-filter"
                                          checked={filterConfig.onlineConfig.filteringConfig.noReplyFilter}
                                          onCheckedChange={(checked) => setFilterConfig({
                                            ...filterConfig,
                                            onlineConfig: {
                                              ...filterConfig.onlineConfig,
                                              filteringConfig: {
                                                ...filterConfig.onlineConfig.filteringConfig,
                                                noReplyFilter: checked as boolean
                                              }
                                            }
                                          })}
                                        />
                                        <Label htmlFor="no-reply-filter">无回复过滤</Label>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="bot-only-filter"
                                          checked={filterConfig.onlineConfig.filteringConfig.botOnlyFilter}
                                          onCheckedChange={(checked) => setFilterConfig({
                                            ...filterConfig,
                                            onlineConfig: {
                                              ...filterConfig.onlineConfig,
                                              filteringConfig: {
                                                ...filterConfig.onlineConfig.filteringConfig,
                                                botOnlyFilter: checked as boolean
                                              }
                                            }
                                          })}
                                        />
                                        <Label htmlFor="bot-only-filter">纯bot消息过滤</Label>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 导入数据配置 */}
                  {filterConfig.dataSource === 'import' && (
                    <Card className="border-green-200 bg-green-50/30">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <Upload className="w-4 h-4 mr-2" />
                          导入标注数据
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 导入模板下载 */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 mr-3 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">导入模板</p>
                              <p className="text-sm text-blue-700">下载标准格式的导入模板文件</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={downloadTemplate}
                            className="flex items-center"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下载模板
                          </Button>
                        </div>

                        {/* 文件上传 */}
                        <div>
                          <Label>上传文件 *</Label>
                          <div className="mt-2">
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              onChange={handleFileUpload}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="text-sm text-gray-600 mt-1">
                              支持 CSV、Excel 格式，文件大小不超过 10MB
                            </p>
                          </div>
                        </div>

                        {/* 上传进度和结果 */}
                        {filterConfig.importConfig.uploadStatus !== 'idle' && (
                          <div className="space-y-3">
                            {filterConfig.importConfig.uploadStatus === 'uploading' && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">上传进度</span>
                                  <span className="text-sm text-gray-600">{filterConfig.importConfig.uploadProgress}%</span>
                                </div>
                                <Progress value={filterConfig.importConfig.uploadProgress} className="h-2" />
                              </div>
                            )}

                            {filterConfig.importConfig.uploadStatus === 'success' && (
                              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center mb-2">
                                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                  <span className="font-medium text-green-900">上传成功</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">文件名：</span>
                                    <span className="font-medium">{filterConfig.importConfig.file?.name}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">会话数量：</span>
                                    <span className="font-medium text-green-700">{filterConfig.importConfig.sessionCount} 条</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">文件大小：</span>
                                    <span className="font-medium">{(filterConfig.importConfig.file?.size || 0 / 1024 / 1024).toFixed(2)} MB</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">状态：</span>
                                    <Badge className="bg-green-100 text-green-800">解析完成</Badge>
                                  </div>
                                </div>
                              </div>
                            )}

                            {filterConfig.importConfig.uploadStatus === 'error' && (
                              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center mb-2">
                                  <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                                  <span className="font-medium text-red-900">上传失败</span>
                                </div>
                                <p className="text-sm text-red-700">
                                  {filterConfig.importConfig.errorMessage || '文件格式不正确或数据解析失败，请检查文件格式'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
              
              {/* 配置预览 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Settings className="w-4 h-4 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">配置预览</h3>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {generateConfigPreview()}
                </p>
              </div>
            </div>
          )}

          {/* 任务分配 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    任务分配设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>标注形式</Label>
                    <RadioGroup 
                      value={assignmentConfig.annotationType} 
                      onValueChange={(value: 'cross' | 'distributed') => setAssignmentConfig({...assignmentConfig, annotationType: value})}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cross" id="cross" />
                        <Label htmlFor="cross">交叉标注</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="distributed" id="distributed" />
                        <Label htmlFor="distributed">分散标注</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-sm text-gray-600 mt-1">
                      {assignmentConfig.annotationType === 'cross' 
                        ? '多人标注同一批数据，提高标注质量' 
                        : '数据分配给不同人员，提高标注效率'}
                    </p>
                  </div>

                  <div>
                    <Label>分配方式</Label>
                    <RadioGroup 
                      value={assignmentConfig.allocationMethod} 
                      onValueChange={(value: 'quota' | 'average') => setAssignmentConfig({...assignmentConfig, allocationMethod: value})}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="quota" id="quota" />
                        <Label htmlFor="quota">定额分配</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="average" id="average" />
                        <Label htmlFor="average">平均分配</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 统计方式选择 - 仅交叉标注时显示 */}
                  {assignmentConfig.annotationType === 'cross' && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <Label className="text-blue-900 font-medium">统计方式</Label>
                      <p className="text-sm text-blue-700 mt-1 mb-3">
                        交叉标注模式下，多位标注员会标注相同的数据，需要选择如何聚合统计结果
                      </p>
                      <RadioGroup 
                        value={assignmentConfig.statisticsMethod} 
                        onValueChange={(value: 'average' | 'median') => setAssignmentConfig({...assignmentConfig, statisticsMethod: value})}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3 p-3 bg-white rounded-md border border-blue-100 hover:border-blue-300 transition-colors">
                          <RadioGroupItem value="average" id="average-stats" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="average-stats" className="font-medium cursor-pointer">平均值</Label>
                            <p className="text-sm text-gray-600 mt-1">
                              对所有标注员的数值型指标取平均值，适合数据分布较均匀的场景
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-white rounded-md border border-blue-100 hover:border-blue-300 transition-colors">
                          <RadioGroupItem value="median" id="median-stats" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="median-stats" className="font-medium cursor-pointer">中位数</Label>
                            <p className="text-sm text-gray-600 mt-1">
                              对所有标注员的数值型指标取中位数，可以减少极端值的影响
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <div>
                    <Label>选择标注员</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {annotatorOptions.map((annotator) => (
                        <div key={annotator.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={annotator.id}
                              checked={assignmentConfig.annotators.includes(annotator.id)}
                              onCheckedChange={(checked) => handleAnnotatorChange(annotator.id, checked as boolean)}
                            />
                            <div>
                              <Label htmlFor={annotator.id} className="font-medium cursor-pointer">
                                {annotator.name}
                              </Label>
                              <p className="text-sm text-gray-600">{annotator.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={annotator.workload > 80 ? 'destructive' : annotator.workload > 60 ? 'secondary' : 'default'}>
                              工作量 {annotator.workload}%
                            </Badge>
                            {assignmentConfig.allocationMethod === 'quota' && assignmentConfig.annotators.includes(annotator.id) && (
                              <Input
                                type="number"
                                value={assignmentConfig.quotaConfig[annotator.id] || 0}
                                onChange={(e) => handleQuotaChange(annotator.id, parseInt(e.target.value) || 0)}
                                className="w-20"
                                min="0"
                                max={assignmentConfig.annotationType === 'distributed' ? getTaskQuantity() : undefined}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 配额统计 */}
                  {assignmentConfig.allocationMethod === 'quota' && assignmentConfig.annotationType === 'distributed' && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>配额统计：</strong>
                        已分配 {getTotalQuota()} / {getTaskQuantity()}
                        {getTotalQuota() > getTaskQuantity() && (
                          <span className="text-red-600 ml-2">⚠️ 超出任务总数</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* 平均分配预览 */}
                  {assignmentConfig.allocationMethod === 'average' && assignmentConfig.annotators.length > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>平均分配预览：</strong>
                        每人约 {Math.floor(getTaskQuantity() / assignmentConfig.annotators.length)} 个任务
                        {getTaskQuantity() % assignmentConfig.annotators.length > 0 && (
                          <span className="ml-2">（余 {getTaskQuantity() % assignmentConfig.annotators.length} 个随机分配）</span>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* 配置预览 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Settings className="w-4 h-4 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">配置预览</h3>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {generateConfigPreview()}
                </p>
              </div>
            </div>
          )}

          {/* 完成期限 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    完成期限设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {executionType === 'single' ? (
                    <div>
                      <Label>截止日期时间</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-2",
                              !assignmentConfig.deadline.absoluteDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {assignmentConfig.deadline.absoluteDate 
                              ? format(assignmentConfig.deadline.absoluteDate, "yyyy-MM-dd HH:mm") 
                              : "选择截止时间"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={assignmentConfig.deadline.absoluteDate}
                            onSelect={(date) => setAssignmentConfig({
                              ...assignmentConfig,
                              deadline: { ...assignmentConfig.deadline, absoluteDate: date }
                            })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div>
                      <Label>生成任务后完成时限</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label className="text-sm">天数</Label>
                          <Input
                            type="number"
                            value={assignmentConfig.deadline.relativeDays}
                            onChange={(e) => setAssignmentConfig({
                              ...assignmentConfig,
                              deadline: {
                                ...assignmentConfig.deadline,
                                relativeDays: parseInt(e.target.value) || 0
                              }
                            })}
                            min="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">小时</Label>
                          <Input
                            type="number"
                            value={assignmentConfig.deadline.relativeHours}
                            onChange={(e) => setAssignmentConfig({
                              ...assignmentConfig,
                              deadline: {
                                ...assignmentConfig.deadline,
                                relativeHours: parseInt(e.target.value) || 0
                              }
                            })}
                            min="0"
                            max="23"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        例如：{assignmentConfig.deadline.relativeDays}日{assignmentConfig.deadline.relativeHours}时，
                        在形成新任务时自动按照配置计算截止日期时间
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* 配置预览 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Settings className="w-4 h-4 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">配置预览</h3>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {generateConfigPreview()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 导航按钮 */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            上一步
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={handleSubmit} 
                disabled={!canProceedToNext()}
              >
                {isEditMode ? '更新任务' : '创建任务'}
              </Button>
            ) : (
              <Button 
                onClick={nextStep}
                disabled={!canProceedToNext()}
              >
                下一步
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}