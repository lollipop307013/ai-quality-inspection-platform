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
  name: string
  description: string
  severity: 'high' | 'medium' | 'low'
  points: number
  category: string
  errorCode: string
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

// 审核记录
export interface ReviewRecord {
  id: string
  taskId: string
  dataId: string // 数据项ID
  reviewerId: string // 审核员ID
  reviewerName: string
  annotations: Record<string, any> // 审核员的标注结果
  differences: {
    annotatorId: string
    annotatorName: string
    differenceFields: string[] // 有差异的字段
  }[] // 与哪些标注员有差异
  status: 'completed' | 'pending'
  createdAt: string
  updatedAt: string
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
  deadline: string
  createdAt: string
  updatedAt: string
}

// 用户角色类型
export type UserRole = 'admin' | 'annotator' | 'reviewer'

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
  getAllErrorCodes: () => string[]

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

  // 审核记录管理
  reviewRecords: ReviewRecord[]
  setReviewRecords: (records: ReviewRecord[]) => void
  addReviewRecord: (record: ReviewRecord) => void
  updateReviewRecord: (id: string, updates: Partial<ReviewRecord>) => void
  getReviewRecordsByTask: (taskId: string) => ReviewRecord[]
  getReviewRecordByData: (taskId: string, dataId: string) => ReviewRecord | undefined
}

// 初始用户数据
const initialUser: UserInfo = {
  id: 'user_001',
  name: 'charliazhang',
  role: 'admin',
  department: '质检部门'
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
  // 回复准确性
  { id: 'acc_001', name: '信息错误', description: '回复中包含错误的事实信息', severity: 'high', points: 10, category: '回复准确性', errorCode: '#33001' },
  { id: 'acc_002', name: '理解偏差', description: '对用户问题理解有偏差', severity: 'medium', points: 5, category: '回复准确性', errorCode: '#33002' },
  { id: 'acc_003', name: '答非所问', description: '回复内容与用户问题不符', severity: 'high', points: 8, category: '回复准确性', errorCode: '#33003' },
  
  // 服务态度
  { id: 'att_001', name: '语气生硬', description: '回复语气过于生硬，缺乏亲和力', severity: 'medium', points: 3, category: '服务态度', errorCode: '#32101' },
  { id: 'att_002', name: '不够耐心', description: '对用户问题缺乏耐心', severity: 'medium', points: 4, category: '服务态度', errorCode: '#32102' },
  { id: 'att_003', name: '用词不当', description: '使用不当或不礼貌的词汇', severity: 'high', points: 6, category: '服务态度', errorCode: '#32103' },
  
  // 专业能力
  { id: 'pro_001', name: '专业知识不足', description: '缺乏相关专业知识', severity: 'high', points: 8, category: '专业能力', errorCode: '#31001' },
  { id: 'pro_002', name: '解决方案不完整', description: '提供的解决方案不够完整', severity: 'medium', points: 5, category: '专业能力', errorCode: '#31002' },
  { id: 'pro_003', name: '流程指导错误', description: '提供的操作流程有误', severity: 'high', points: 9, category: '专业能力', errorCode: '#31003' }
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
  getAllErrorCodes: () => {
    const state = get()
    return state.qualityStandards.map(standard => standard.errorCode)
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

  // 审核记录状态
  reviewRecords: [],
  setReviewRecords: (records) => set({ reviewRecords: records }),
  addReviewRecord: (record) => set((state) => ({
    reviewRecords: [...state.reviewRecords, record]
  })),
  updateReviewRecord: (id, updates) => set((state) => ({
    reviewRecords: state.reviewRecords.map(record =>
      record.id === id ? { ...record, ...updates, updatedAt: new Date().toISOString() } : record
    )
  })),
  getReviewRecordsByTask: (taskId) => {
    const state = get()
    return state.reviewRecords.filter(record => record.taskId === taskId)
  },
  getReviewRecordByData: (taskId, dataId) => {
    const state = get()
    return state.reviewRecords.find(record => 
      record.taskId === taskId && record.dataId === dataId
    )
  }
}))

// 导出
export { useGlobalStore }
export type { GlobalState }