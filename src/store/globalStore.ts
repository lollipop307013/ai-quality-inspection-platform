// 全局状态管理 - 用于串联各个功能模块
import { create } from 'zustand'

// 标注任务类型数据结构
export interface AnnotationTaskType {
  id: string
  name: string
  description: string
  category: 'system' | 'custom'
  predefinedTypes: string[]
  customTypes: {
    name: string
    type: 'input' | 'select' | 'textarea' | 'number'
    options?: string[]
    required?: boolean
    description?: string
  }[]
  createdAt: string
  updatedAt: string
  usageCount: number
}

// 质检标准数据结构
export interface QualityStandard {
  id: string
  code: string // 错误码，格式：#XXYYZZ
  dimension: string // 维度
  category: string // 类别
  subcategory: string // 子类别
  standard: string // 标准名称
  description: string
  severity: '高' | '中' | '低'
  channel?: string // 渠道：微信、QQ、App等
  gameType?: string // 适用游戏
  status: '启用' | '禁用'
  createdAt: string
  updatedAt: string
  creator: string
}

// 任务分配配置
export interface AssignmentConfig {
  annotationType: 'cross' | 'distributed' // 交叉标注 | 分散标注
  allocationMethod: 'quota' | 'average' // 定额分配 | 平均分配
  annotators: string[] // 标注员ID列表
  quotaConfig: Record<string, number> // 定额配置 {标注员ID: 数量}
  statisticsMethod?: 'average' | 'median' // 统计方式：平均值 | 中位数（仅交叉标注）
}

// 标注记录（支持多人标注同一数据）
export interface AnnotationRecord {
  id: string
  taskId: string
  dataId: string // 数据项ID
  annotatorId: string // 标注员ID
  annotatorName: string
  annotations: Record<string, any> // 标注结果 {标注类型: 值}
  status: 'completed' | 'pending' | 'reviewed' // 已完成 | 待定 | 已审核
  hasDifference?: boolean // 是否与审核员标注有差异
  createdAt: string
  updatedAt: string
}



// 标注员提交状态
export interface AnnotatorSubmission {
  annotatorId: string
  annotatorName: string
  submitted: boolean // 是否已提交
  submittedAt?: string // 提交时间
  progress: {
    total: number
    completed: number
  }
}

// 任务数据结构
export interface Task {
  id: string
  name: string
  description: string
  taskTypeId: string // 关联标注任务类型
  status: 'active' | 'completed' | 'paused'
  progress: {
    total: number
    completed: number
    pending: number
    remaining: number
  }
  annotationConfig?: {
    predefinedTypes: string[]
    customTypes: any[]
  }
  assignmentConfig?: AssignmentConfig // 任务分配配置
  reviewStatus?: 'not_started' | 'in_progress' | 'completed' // 审核状态
  reviewProgress?: {
    total: number
    reviewed: number
    remaining: number
  }
  submissionStatus?: AnnotatorSubmission[] // 标注员提交状态
  deadline: string
  createdAt: string
  updatedAt: string
}

// 用户角色类型
export type UserRole = 'admin' | 'annotator'

// 用户信息接口
export interface UserInfo {
  id: string
  name: string
  role: UserRole
  avatar?: string
  department?: string
}

// 全局状态接口
interface GlobalState {
  // 用户角色管理
  currentUser: UserInfo
  setCurrentUser: (user: UserInfo) => void
  switchUserRole: (role: UserRole) => void
  
  // 标注任务类型
  annotationTaskTypes: AnnotationTaskType[]
  setAnnotationTaskTypes: (types: AnnotationTaskType[]) => void
  addAnnotationTaskType: (type: AnnotationTaskType) => void
  updateAnnotationTaskType: (id: string, updates: Partial<AnnotationTaskType>) => void
  deleteAnnotationTaskType: (id: string) => void
  getAnnotationTaskTypeById: (id: string) => AnnotationTaskType | undefined

  // 质检标准
  qualityStandards: QualityStandard[]
  setQualityStandards: (standards: QualityStandard[]) => void
  addQualityStandard: (standard: QualityStandard) => void
  updateQualityStandard: (id: string, updates: Partial<QualityStandard>) => void
  deleteQualityStandard: (id: string) => void
  getQualityStandardsByCategory: (category: string) => QualityStandard[]
  getQualityStandardsByChannel: (channel?: string) => QualityStandard[] // 按渠道获取
  getAllErrorCodes: () => string[]
  getErrorCodesByChannel: (channel?: string) => QualityStandard[] // 按渠道获取错误码

  // 任务管理
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTaskById: (id: string) => Task | undefined
  getTasksByType: (taskTypeId: string) => Task[]

  // 当前选中的任务
  currentTaskId: string | null
  setCurrentTaskId: (id: string | null) => void
  getCurrentTask: () => Task | undefined

  // 标注记录管理
  annotationRecords: AnnotationRecord[]
  setAnnotationRecords: (records: AnnotationRecord[]) => void
  addAnnotationRecord: (record: AnnotationRecord) => void
  updateAnnotationRecord: (id: string, updates: Partial<AnnotationRecord>) => void
  getAnnotationRecordsByTask: (taskId: string) => AnnotationRecord[]
  getAnnotationRecordsByData: (taskId: string, dataId: string) => AnnotationRecord[]
  getAnnotationRecordsByAnnotator: (taskId: string, annotatorId: string) => AnnotationRecord[]

  // 标注员提交管理
  submitTaskByAnnotator: (taskId: string, annotatorId: string, annotatorName: string) => void
  checkAndCompleteTask: (taskId: string) => void

}

// 初始用户数据
const initialUser: UserInfo = {
  id: 'user_001',
  name: 'charliazhang',
  role: 'admin'
}

// 初始数据
const initialAnnotationTaskTypes: AnnotationTaskType[] = [
  {
    id: 'system_basic',
    name: '基础质检类型',
    description: '包含错误码、场景和质量评估的基础任务类型',
    category: 'system',
    predefinedTypes: ['error_code', 'message_scene', 'dialogue_quality'],
    customTypes: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    usageCount: 15
  },
  {
    id: 'system_advanced',
    name: '高级质检类型',
    description: '包含情感分析、意图识别等高级功能的任务类型',
    category: 'system',
    predefinedTypes: ['error_code', 'sentiment_analysis', 'intent_recognition', 'response_accuracy'],
    customTypes: [
      { name: '专业度评分', type: 'number', required: true, description: '1-10分评价专业程度' },
      { name: '改进建议', type: 'textarea', required: false, description: '针对回复的改进建议' }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    usageCount: 8
  },
  {
    id: 'custom_service',
    name: '客服专项模板',
    description: '专门用于客服质量评估的自定义模板',
    category: 'custom',
    predefinedTypes: ['service_attitude', 'professional_level', 'response_accuracy'],
    customTypes: [
      { name: '处理结果', type: 'select', options: ['已解决', '转人工', '待跟进'], required: true },
      { name: '客户满意度', type: 'select', options: ['很满意', '满意', '一般', '不满意'], required: false }
    ],
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-20T14:20:00Z',
    usageCount: 3
  }
]

const initialQualityStandards: QualityStandard[] = [
  // 对话维度 - 人设一致性
  { 
    id: '1', 
    code: '#010101', 
    dimension: '对话', 
    category: '人设一致性', 
    subcategory: '称谓使用', 
    standard: '称谓错误', 
    description: '使用了不符合人设的称谓',
    severity: '高',
    channel: '微信',
    gameType: 'CFM',
    status: '启用',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    creator: '管理员'
  },
  { 
    id: '2', 
    code: '#010102', 
    dimension: '对话', 
    category: '人设一致性', 
    subcategory: '语气风格', 
    standard: '语气不符', 
    description: '回复语气与人设设定不符',
    severity: '中',
    channel: '微信',
    gameType: 'CFM',
    status: '启用',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    creator: '管理员'
  },
  // 业务维度 - 准确性
  { 
    id: '3', 
    code: '#020101', 
    dimension: '业务', 
    category: '业务准确性', 
    subcategory: '信息准确', 
    standard: '信息错误', 
    description: '回复中包含错误的业务信息',
    severity: '高',
    channel: 'QQ',
    gameType: 'DNF',
    status: '启用',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    creator: '管理员'
  },
  { 
    id: '4', 
    code: '#020201', 
    dimension: '业务', 
    category: '业务流程', 
    subcategory: '流程指导', 
    standard: '流程错误', 
    description: '提供的业务流程指导有误',
    severity: '高',
    channel: 'App',
    gameType: 'LOL',
    status: '启用',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    creator: '管理员'
  },
  // 技术维度
  { 
    id: '5', 
    code: '#030101', 
    dimension: '技术', 
    category: '技术规范', 
    subcategory: '接口调用', 
    standard: '接口错误', 
    description: '接口调用返回错误信息',
    severity: '高',
    status: '启用',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    creator: '管理员'
  }
]

const initialTasks: Task[] = [
  {
    id: 'task_001',
    name: 'AI客服质量检查',
    description: '系统自动生成的质检任务，需要完成所有对话的标注工作',
    taskTypeId: 'system_basic',
    status: 'active',
    progress: {
      total: 58,
      completed: 23,
      pending: 8,
      remaining: 27
    },
    submissionStatus: [
      {
        annotatorId: 'user_001',
        annotatorName: 'charliazhang',
        submitted: false,
        progress: {
          total: 58,
          completed: 23
        }
      },
      {
        annotatorId: 'user_002',
        annotatorName: '张三',
        submitted: true,
        submittedAt: '2025-08-26T10:30:00Z',
        progress: {
          total: 58,
          completed: 58
        }
      },
      {
        annotatorId: 'user_003',
        annotatorName: '李四',
        submitted: false,
        progress: {
          total: 58,
          completed: 45
        }
      }
    ],
    deadline: '2025-09-05T18:00:00',
    createdAt: '2025-08-20T10:00:00Z',
    updatedAt: '2025-08-25T14:30:00Z'
  },
  {
    id: 'task_002',
    name: '客服质量专项检查',
    description: '针对客服质量的专项检查任务，重点关注服务态度和专业性',
    taskTypeId: 'custom_service',
    status: 'active',
    progress: {
      total: 47,
      completed: 33,
      pending: 2,
      remaining: 12
    },
    submissionStatus: [
      {
        annotatorId: 'user_004',
        annotatorName: '王五',
        submitted: true,
        submittedAt: '2025-08-27T14:20:00Z',
        progress: {
          total: 47,
          completed: 47
        }
      },
      {
        annotatorId: 'user_005',
        annotatorName: '小明',
        submitted: true,
        submittedAt: '2025-08-27T16:45:00Z',
        progress: {
          total: 47,
          completed: 47
        }
      }
    ],
    deadline: '2025-09-08T23:59:59',
    createdAt: '2025-08-15T09:00:00Z',
    updatedAt: '2025-08-28T16:45:00Z'
  }
]

// 创建全局状态管理 - 这里同时导出
const useGlobalStore = create<GlobalState>((set, get) => ({
  // 用户角色状态
  currentUser: initialUser,
  setCurrentUser: (user) => set({ currentUser: user }),
  switchUserRole: (role) => set((state) => ({
    currentUser: { ...state.currentUser, role }
  })),

  // 标注任务类型状态
  annotationTaskTypes: initialAnnotationTaskTypes,
  setAnnotationTaskTypes: (types) => set({ annotationTaskTypes: types }),
  addAnnotationTaskType: (type) => set((state) => ({
    annotationTaskTypes: [...state.annotationTaskTypes, type]
  })),
  updateAnnotationTaskType: (id, updates) => set((state) => ({
    annotationTaskTypes: state.annotationTaskTypes.map(type =>
      type.id === id ? { ...type, ...updates, updatedAt: new Date().toISOString() } : type
    )
  })),
  deleteAnnotationTaskType: (id) => set((state) => ({
    annotationTaskTypes: state.annotationTaskTypes.filter(type => type.id !== id)
  })),
  getAnnotationTaskTypeById: (id) => {
    const state = get()
    return state.annotationTaskTypes.find(type => type.id === id)
  },

  // 质检标准状态
  qualityStandards: initialQualityStandards,
  setQualityStandards: (standards) => set({ qualityStandards: standards }),
  addQualityStandard: (standard) => set((state) => ({
    qualityStandards: [...state.qualityStandards, standard]
  })),
  updateQualityStandard: (id, updates) => set((state) => ({
    qualityStandards: state.qualityStandards.map(standard =>
      standard.id === id ? { ...standard, ...updates } : standard
    )
  })),
  deleteQualityStandard: (id) => set((state) => ({
    qualityStandards: state.qualityStandards.filter(standard => standard.id !== id)
  })),
  getQualityStandardsByCategory: (category) => {
    const state = get()
    return state.qualityStandards.filter(standard => standard.category === category)
  },
  getQualityStandardsByChannel: (channel) => {
    const state = get()
    // 如果没有指定渠道，返回所有标准
    if (!channel) return state.qualityStandards.filter(s => s.status === '启用')
    // 返回指定渠道或通用渠道的标准
    return state.qualityStandards.filter(standard => 
      standard.status === '启用' && (!standard.channel || standard.channel === channel)
    )
  },
  getAllErrorCodes: () => {
    const state = get()
    return state.qualityStandards.map(standard => standard.code)
  },
  getErrorCodesByChannel: (channel) => {
    const state = get()
    // 如果没有指定渠道，返回所有启用的标准
    if (!channel) return state.qualityStandards.filter(s => s.status === '启用')
    // 返回指定渠道或通用渠道的标准
    return state.qualityStandards.filter(standard => 
      standard.status === '启用' && (!standard.channel || standard.channel === channel)
    )
  },

  // 任务状态
  tasks: initialTasks,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
    )
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),
  getTaskById: (id) => {
    const state = get()
    return state.tasks.find(task => task.id === id)
  },
  getTasksByType: (taskTypeId) => {
    const state = get()
    return state.tasks.filter(task => task.taskTypeId === taskTypeId)
  },

  // 当前任务状态
  currentTaskId: null,
  setCurrentTaskId: (id) => set({ currentTaskId: id }),
  getCurrentTask: () => {
    const state = get()
    return state.currentTaskId ? state.getTaskById(state.currentTaskId) : undefined
  },

  // 标注记录状态
  annotationRecords: [],
  setAnnotationRecords: (records) => set({ annotationRecords: records }),
  addAnnotationRecord: (record) => set((state) => ({
    annotationRecords: [...state.annotationRecords, record]
  })),
  updateAnnotationRecord: (id, updates) => set((state) => ({
    annotationRecords: state.annotationRecords.map(record =>
      record.id === id ? { ...record, ...updates, updatedAt: new Date().toISOString() } : record
    )
  })),
  getAnnotationRecordsByTask: (taskId) => {
    const state = get()
    return state.annotationRecords.filter(record => record.taskId === taskId)
  },
  getAnnotationRecordsByData: (taskId, dataId) => {
    const state = get()
    return state.annotationRecords.filter(record => 
      record.taskId === taskId && record.dataId === dataId
    )
  },
  getAnnotationRecordsByAnnotator: (taskId, annotatorId) => {
    const state = get()
    return state.annotationRecords.filter(record => 
      record.taskId === taskId && record.annotatorId === annotatorId
    )
  },

  // 标注员提交任务
  submitTaskByAnnotator: (taskId, annotatorId, annotatorName) => {
    set((state) => {
      const task = state.tasks.find(t => t.id === taskId)
      if (!task) return state

      // 初始化 submissionStatus（如果不存在）
      if (!task.submissionStatus) {
        task.submissionStatus = []
      }

      // 查找或创建该标注员的提交状态
      const existingSubmission = task.submissionStatus.find(s => s.annotatorId === annotatorId)
      
      if (existingSubmission) {
        // 更新已有的提交状态
        existingSubmission.submitted = true
        existingSubmission.submittedAt = new Date().toISOString()
      } else {
        // 添加新的提交状态
        task.submissionStatus.push({
          annotatorId,
          annotatorName,
          submitted: true,
          submittedAt: new Date().toISOString(),
          progress: {
            total: task.progress.total,
            completed: task.progress.completed
          }
        })
      }

      return {
        tasks: state.tasks.map(t => t.id === taskId ? { ...task } : t)
      }
    })

    // 提交后检查是否所有标注员都已提交
    get().checkAndCompleteTask(taskId)
  },

  // 检查并自动完成任务
  checkAndCompleteTask: (taskId) => {
    set((state) => {
      const task = state.tasks.find(t => t.id === taskId)
      if (!task || !task.submissionStatus) return state

      // 检查是否所有标注员都已提交
      const allSubmitted = task.submissionStatus.every(s => s.submitted)

      if (allSubmitted && task.status !== 'completed') {
        // 所有标注员都已提交，自动标记任务为完成
        return {
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { ...t, status: 'completed' as const, updatedAt: new Date().toISOString() }
              : t
          )
        }
      }

      return state
    })
  },

}))

// 导出
export { useGlobalStore }
export type { GlobalState }