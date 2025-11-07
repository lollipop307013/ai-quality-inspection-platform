import React, { useState } from 'react'
import { ChevronRight, ChevronDown, ChevronUp, ChevronLeft, Search, X, Eye, CheckCircle, Clock, ArrowRight, ArrowLeft, Calendar, ExternalLink, FileText, Edit } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { toast, Toaster } from 'sonner'
import { useGlobalStore } from '../store/globalStore'

// 初始任务数据
const initialTaskHierarchy = {
  'charliazhang的所有质检任务': {
    '20250828自动生成任务': {
      '全部': { 
        count: 76, 
        items: Array.from({length: 76}, (_, i) => ({ 
          id: i + 1, 
          content: `对话${i + 1}`,
          status: i < 45 ? 'unannotated' : i < 68 ? 'annotated' : 'pending'
        })) 
      },
      '未标注': { 
        count: 45, 
        items: Array.from({length: 45}, (_, i) => ({ 
          id: i + 1, 
          content: `对话${i + 1}`,
          status: 'unannotated'
        })) 
      },
      '已标注': { 
        count: 23, 
        items: Array.from({length: 23}, (_, i) => ({ 
          id: i + 46, 
          content: `对话${i + 46}`,
          status: 'annotated'
        })) 
      },
      '待定': { 
        count: 8, 
        items: Array.from({length: 8}, (_, i) => ({ 
          id: i + 69, 
          content: `对话${i + 69}`,
          status: 'pending'
        })) 
      },
      deadline: '2025-09-05T18:00:00',
      description: '系统自动生成的质检任务，需要完成所有对话的标注工作',
      dataType: 'dialogue', // 数据类型：dialogue-对话标注, image-图片标注, video-视频标注, text-文本标注
      isNew: false,
      annotationConfig: {
        predefinedTypes: ['error_code', 'message_scene', 'dialogue_quality'],
        customTypes: [
          { name: '专业度评分', type: 'input', inputType: 'number' },
          { name: '处理结果', type: 'select', options: ['已解决', '转人工', '待跟进'] }
        ]
      }
    },
    '客服质量专项检查': {
      '全部': { 
        count: 47, 
        items: Array.from({length: 47}, (_, i) => ({ 
          id: i + 77, 
          content: `专项对话${i + 1}`,
          status: i < 12 ? 'unannotated' : i < 45 ? 'annotated' : 'pending'
        })) 
      },
      '未标注': { 
        count: 12, 
        items: Array.from({length: 12}, (_, i) => ({ 
          id: i + 77, 
          content: `专项对话${i + 1}`,
          status: 'unannotated'
        })) 
      },
      '已标注': { 
        count: 33, 
        items: Array.from({length: 33}, (_, i) => ({ 
          id: i + 89, 
          content: `专项对话${i + 13}`,
          status: 'annotated'
        })) 
      },
      '待定': { 
        count: 2, 
        items: Array.from({length: 2}, (_, i) => ({ 
          id: i + 122, 
          content: `专项对话${i + 46}`,
          status: 'pending'
        })) 
      },
      deadline: '2025-09-08T23:59:59',
      description: '针对客服质量的专项检查任务，重点关注服务态度和专业性',
      dataType: 'dialogue',
      isNew: true
    }
  }
}

const mockConversation = [
  { id: 1, sender: 'user', content: '你好，我想了解一下CFM游戏的最新活动', timestamp: '14:30', date: '2025-01-27', openid: 'user_12345' },
  { id: 2, sender: 'ai', content: '你好呀！最近CFM确实有很多精彩活动呢～本小姐来给你详细介绍一下吧！', timestamp: '14:30', date: '2025-01-27', replyType: 'MQA' },
  { id: 3, sender: 'user', content: '好的，谢谢', timestamp: '14:31', date: '2025-01-27', openid: 'user_12345' },
  { id: 4, sender: 'ai', content: '不客气哦～有什么其他问题随时问本小姐！', timestamp: '14:31', date: '2025-01-27', replyType: 'LLM' },
  { id: 5, sender: 'user', content: '还有其他活动吗？', timestamp: '09:15', date: '2025-01-28', openid: 'user_12345' },
  { id: 6, sender: 'ai', content: '当然有啦！还有很多精彩活动等着你呢！', timestamp: '09:16', date: '2025-01-28', replyType: '人工客服' }
]

// 知识参考数据
const mockKnowledgeReferences: Record<number, any> = {
  2: { // message id 2
    type: 'MQA',
    questionId: 'Q_CFM_001',
    answerId: 'A_CFM_001_V2',
    question: '用户询问CFM游戏最新活动',
    answer: '你好呀！最近CFM确实有很多精彩活动呢～本小姐来给你详细介绍一下吧！',
    score: 0.95,
    matchedKeywords: ['CFM', '最新活动', '了解']
  },
  4: { // message id 4
    type: 'LLM',
    // 联网搜索结果
    webSearchResults: [
      {
        url: 'https://cf.qq.com/act/2025/spring-festival',
        title: 'CFM春节活动官方页面',
        snippet: '2025年春节期间，CFM推出多项精彩活动，包括新春签到、限时抽奖等，玩家可获得丰厚奖励...',
        matchedText: ['春节活动', '限时抽奖', '丰厚奖励']
      },
      {
        url: 'https://cf.qq.com/news/latest-events',
        title: 'CFM最新活动资讯',
        snippet: '最新活动包括武器皮肤限时兑换、排位赛季奖励翻倍等，活动时间有限，请及时参与...',
        matchedText: ['武器皮肤', '排位赛季', '奖励翻倍']
      }
    ],
    // 检索库文档结果
    retrievalResults: [
      {
        title: 'CFM活动运营手册',
        abstract: '包含CFM游戏各类活动的详细说明和操作指南',
        content: '春节活动是CFM每年的重要运营节点，通常包括签到奖励、充值返利、限时商城等多个子活动...',
        matchedText: ['春节活动', '签到奖励', '充值返利']
      }
    ],
    // 内容库检索结果
    contentResults: [
      {
        documentId: 'DOC_CFM_2025_001',
        title: 'CFM 2025年活动规划文档',
        abstract: '2025年全年活动规划，包括春节、五一、国庆等重要节点的活动安排',
        content: '春节活动将于1月20日-2月10日举行，主要包括：1.每日签到送好礼 2.充值返利最高200% 3.限时武器皮肤兑换...',
        summary: '春节活动为期22天，包含签到、充值、兑换三大玩法',
        matchedText: ['春节活动', '每日签到', '充值返利', '武器皮肤']
      }
    ],
    model: 'GPT-4',
    temperature: 0.7,
    tokens: 156
  },
  6: { // message id 6
    type: '人工客服',
    operatorId: 'CS_001',
    operatorName: '客服小王',
    replyTime: '2025-01-28 09:16:00',
    sessionId: 'session_20250128_001'
  }
}

// 预定义标注类型配置
interface AnnotationType {
  name: string;
  type: 'error_code_search' | 'select' | 'input';
  description?: string;
  options?: string[];
}

const predefinedAnnotationTypes: Record<string, AnnotationType> = {
  error_code: {
    name: '错误码标注',
    type: 'error_code_search',
    description: '通过搜索质检标准选择错误码'
  },
  message_scene: {
    name: '消息场景分类',
    type: 'select',
    options: ['闲聊', '攻略', '消费', '投诉', '咨询', '其他']
  },
  dialogue_quality: {
    name: '人设对话质量',
    type: 'select',
    options: ['好', '中', '差']
  },
  sentiment: {
    name: '情感倾向',
    type: 'select',
    options: ['正面', '中性', '负面']
  }
}

// 相似会话模拟数据
const mockSimilarConversations = Array.from({length: 2500}, (_, i) => {
  const similarity = Math.floor(Math.random() * 30) + 70 // 70-99%
  const templates = [
    {
      userQuestion: `你好，我想了解CFM的活动`,
      aiResponse: `你好！CFM活动的详细信息如下`,
      similarKeywords: ['CFM活动', '了解', '详细信息']
    },
    {
      userQuestion: `请问有什么优惠活动吗`,
      aiResponse: `当前有多种优惠活动供您选择`,
      similarKeywords: ['优惠活动', '请问', '选择']
    },
    {
      userQuestion: `怎么参与这个活动`,
      aiResponse: `参与活动的步骤很简单`,
      similarKeywords: ['参与活动', '怎么', '步骤']
    }
  ]
  
  const template = templates[i % templates.length]
  
  return {
    id: i + 1,
    similarity,
    preview: `用户：${template.userQuestion}... AI：${template.aiResponse}...`,
    similarKeywords: template.similarKeywords,
    fullContent: [
      { sender: 'user', content: `${template.userQuestion}${i + 1}` },
      { sender: 'ai', content: `${template.aiResponse}，具体包括...` }
    ]
  }
})

// 获取相似会话（≥80%），优先显示≥90%
const getSimilarConversations = (conversations: typeof mockSimilarConversations) => {
  const filtered = conversations.filter(c => c.similarity >= 80)
  // 按相似度排序，≥90%的排在前面
  return filtered.sort((a, b) => {
    if (a.similarity >= 90 && b.similarity < 90) return -1
    if (a.similarity < 90 && b.similarity >= 90) return 1
    return b.similarity - a.similarity
  }).slice(0, 15) // 限制显示数量
}

// 知识参考数据
const mockKnowledgeReferences2 = {
  2: { // message id 2
    type: 'MQA',
    questionId: 'Q_CFM_001',
    question: '用户询问CFM游戏最新活动',
    answer: '你好呀！最近CFM确实有很多精彩活动呢～本小姐来给你详细介绍一下吧！',
    confidence: 0.95,
    matchedKeywords: ['CFM', '最新活动', '了解']
  },
  4: { // message id 4
    type: 'LLM',
    prompt: '用户表示感谢，需要礼貌回复并提供进一步帮助',
    response: '不客气哦～有什么其他问题随时问本小姐！',
    model: 'GPT-4',
    temperature: 0.7,
    tokens: 156
  },
  6: { // message id 6
    type: '人工推送',
    operatorId: 'OP_001',
    operatorName: '客服小王',
    pushTime: '2025-01-28 09:15:30',
    reason: '用户继续询问活动，推送标准回复',
    template: 'TEMPLATE_ACTIVITY_MORE'
  }
}

// 历史标注参考数据
const mockHistoricalAnnotations = [
  {
    id: 1,
    similarity: 95,
    preview: '用户：你好，我想了解CFM活动... AI：你好呀！最近CFM确实有很多精彩活动...',
    errorCodes: ['#33001', '#32101'],
    annotationResult: '有问题'
  },
  {
    id: 2,
    similarity: 92,
    preview: '用户：请问有什么优惠活动... AI：当前有多种优惠活动供您选择...',
    errorCodes: ['#33003'],
    annotationResult: '有问题'
  },
  {
    id: 3,
    similarity: 88,
    preview: '用户：怎么参与这个活动... AI：参与活动的步骤很简单...',
    errorCodes: [],
    annotationResult: '无问题'
  }
]

// 按标注类型分类的历史数据
const mockAnnotationTypeHistoricalData: Record<string, any[]> = {
  'message_scene': [
    {
      id: 4,
      similarity: 96,
      preview: '用户：你好，我想了解CFM活动... AI：你好呀！最近CFM确实有很多精彩活动...',
      annotationValue: '咨询',
      errorCodes: [],
      fullContent: [
        { sender: 'user', content: '你好，我想了解CFM活动' },
        { sender: 'ai', content: '你好呀！最近CFM确实有很多精彩活动呢～本小姐来给你详细介绍一下吧！' }
      ]
    },
    {
      id: 5,
      similarity: 89,
      preview: '用户：请问有什么优惠活动... AI：当前有多种优惠活动供您选择...',
      annotationValue: '消费',
      errorCodes: [],
      fullContent: [
        { sender: 'user', content: '请问有什么优惠活动' },
        { sender: 'ai', content: '当前有多种优惠活动供您选择' }
      ]
    }
  ],
  'dialogue_quality': [
    {
      id: 6,
      similarity: 93,
      preview: '用户：你好，我想了解CFM活动... AI：你好呀！最近CFM确实有很多精彩活动...',
      annotationValue: '好',
      errorCodes: [],
      fullContent: [
        { sender: 'user', content: '你好，我想了解CFM活动' },
        { sender: 'ai', content: '你好呀！最近CFM确实有很多精彩活动呢～本小姐来给你详细介绍一下吧！' }
      ]
    },
    {
      id: 7,
      similarity: 85,
      preview: '用户：请问有什么优惠活动... AI：当前有多种优惠活动供您选择...',
      annotationValue: '中',
      errorCodes: [],
      fullContent: [
        { sender: 'user', content: '请问有什么优惠活动' },
        { sender: 'ai', content: '当前有多种优惠活动供您选择' }
      ]
    }
  ],
  'custom_0': [
    {
      id: 8,
      similarity: 90,
      preview: '用户：你好，我想了解CFM活动... AI：你好呀！最近CFM确实有很多精彩活动...',
      annotationValue: '8',
      errorCodes: [],
      fullContent: [
        { sender: 'user', content: '你好，我想了解CFM活动' },
        { sender: 'ai', content: '你好呀！最近CFM确实有很多精彩活动呢～本小姐来给你详细介绍一下吧！' }
      ]
    }
  ],
  'custom_1': [
    {
      id: 9,
      similarity: 88,
      preview: '用户：你好，我想了解CFM活动... AI：你好呀！最近CFM确实有很多精彩活动...',
      annotationValue: '已解决',
      errorCodes: [],
      fullContent: [
        { sender: 'user', content: '你好，我想了解CFM活动' },
        { sender: 'ai', content: '你好呀！最近CFM确实有很多精彩活动呢～本小姐来给你详细介绍一下吧！' }
      ]
    }
  ]
}

const mockStandards = [
  { id: 1, dimension: '对话', category: '人设一致性', subcategory: '人设相关维度', standard: '称谓', code: '#33001', description: '自称错误' },
  { id: 2, dimension: '对话', category: '人设一致性', subcategory: '人设相关维度', standard: '悠悠人设', code: '#33003', description: '承认自己是AI' },
  { id: 3, dimension: '对话', category: '对话细节维度', subcategory: '对话情绪适配', standard: '情绪适配', code: '#32101', description: '语气词使用不符合场景' }
]

// 圆形点阵列表组件
const CircleDotList = ({ items, onItemClick, currentItemId }: { 
  items: Array<{ id: number; content: string; status: string }>, 
  onItemClick: (id: number) => void,
  currentItemId?: number 
}) => {
  const getStatusColor = (status: string, isActive: boolean) => {
    // 当前选中的圆圈使用白色，只有蓝色描边
    if (isActive) {
      return 'bg-white border-blue-400 text-gray-800 shadow-lg'
    }
    
    switch (status) {
      case 'annotated':
        return 'bg-blue-500 border-blue-500 text-white'
      case 'unannotated':
        return 'bg-gray-200 border-gray-300 text-gray-600'
      case 'pending':
        return 'bg-orange-400 border-orange-400 text-white'
      default:
        return 'bg-gray-200 border-gray-300 text-gray-600'
    }
  }

  return (
    <div className="grid grid-cols-8 gap-2 justify-items-center">
      {items.map((item) => {
        const isActive = currentItemId === item.id
        const colorClass = getStatusColor(item.status, isActive)
        
        return (
          <div
            key={item.id}
            className={`
              w-10 h-10 rounded-full border-2 flex items-center justify-center
              cursor-pointer transition-all duration-200 hover:scale-110
              ${colorClass}
              ${isActive ? 'relative z-10' : ''}
            `}
            onClick={() => onItemClick(item.id)}
            title={`${item.content} - ${
              item.status === 'annotated' ? '已标注' : 
              item.status === 'pending' ? '待定' : '未标注'
            }`}
          >
            <span className="text-xs font-medium">{item.id}</span>
          </div>
        )
      })}
    </div>
  )
}

// 计算倒计时的函数
const calculateTimeRemaining = (deadline: string) => {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const timeDiff = deadlineDate.getTime() - now.getTime()
  
  if (timeDiff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isOverdue: true }
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { days, hours, minutes, isOverdue: false }
}

export default function AnnotationWorkbench() {
  // 全局状态
  const store = useGlobalStore()

  // 任务层级数据状态
  const [taskHierarchy, setTaskHierarchy] = useState(initialTaskHierarchy)
  
  // 基础状态
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'charliazhang的所有质检任务': true,
    'charliazhang的所有质检任务 > 20250828自动生成任务': true
  })
  const [selectedPath, setSelectedPath] = useState<string[]>(['charliazhang的所有质检任务', '20250828自动生成任务', '未标注'])
  const [selectedErrorCodes, setSelectedErrorCodes] = useState<string[]>([])
  const [annotationValues, setAnnotationValues] = useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [autoConfirm, setAutoConfirm] = useState(false)
  const [skipAnnotated, setSkipAnnotated] = useState(false)

  const [showTaskOverview, setShowTaskOverview] = useState(false)
  
  // 收起展开状态
  const [isHistoricalAnnotationsExpanded, setIsHistoricalAnnotationsExpanded] = useState(true)
  const [isSimilarConversationsExpanded, setIsSimilarConversationsExpanded] = useState(true)
  
  // 选中消息和知识参考状态
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null)
  const [knowledgeReference, setKnowledgeReference] = useState<any>(null)
  const [showSimilarDialog, setShowSimilarDialog] = useState(false)
  const [selectedSimilarConversation, setSelectedSimilarConversation] = useState<any>(null)
  const [showSimilarReminder, setShowSimilarReminder] = useState(false)
  const [selectedSimilarItems, setSelectedSimilarItems] = useState<number[]>([])
  const [similarPageSize, setSimilarPageSize] = useState(50)
  const [similarCurrentPage, setSimilarCurrentPage] = useState(1)
  const [currentConversationIndex, setCurrentConversationIndex] = useState(0)
  
  // 相似会话相关状态
  const [expandedSimilarGroups, setExpandedSimilarGroups] = useState<Record<string, boolean>>({
    high: true,
    medium: false,
    low: false
  })
  const [currentSimilarGroup, setCurrentSimilarGroup] = useState<string>('')
  
  const [isUnAnnotatedSimilarExpanded, setIsUnAnnotatedSimilarExpanded] = useState(true)
  
  // 快速应用相关状态
  const [quickApplyItems, setQuickApplyItems] = useState<number[]>([])
  const [showQuickApply, setShowQuickApply] = useState(false)
  const [hasAnnotated, setHasAnnotated] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  // 相似会话选中状态 - 与当前标注保持一致
  const [selectedSimilarForSync, setSelectedSimilarForSync] = useState<number[]>([])
  
  // 跟踪已点击的新任务
  const [clickedNewTasks, setClickedNewTasks] = useState<Set<string>>(new Set())

  // 标注类型参考相关状态
  const [showAnnotationTypeReference, setShowAnnotationTypeReference] = useState(false)
  const [currentAnnotationType, setCurrentAnnotationType] = useState<{id: string, name: string} | null>(null)
  const [annotationTypeHistoricalData, setAnnotationTypeHistoricalData] = useState<any[]>([])

  // 全文查看和跳转相关状态
  const [showFullTextDialog, setShowFullTextDialog] = useState(false)
  const [fullTextContent, setFullTextContent] = useState<any>(null)
  const [showJumpConfirmDialog, setShowJumpConfirmDialog] = useState(false)
  const [jumpTarget, setJumpTarget] = useState<{type: 'mqa' | 'content', data: any} | null>(null)
  
  // 圆形点阵列表相关状态
  const [currentDialogId, setCurrentDialogId] = useState<number>(1)
  
  // 回复参考知识收起/展开状态
  const [isKnowledgeCollapsed, setIsKnowledgeCollapsed] = useState<boolean>(false)
  
  // 存储所有对话的标注数据
  const [dialogAnnotations, setDialogAnnotations] = useState<Record<number, {
    errorCodes: string[]
    annotationValues: Record<string, any>
    status: 'annotated' | 'pending'
  }>>({})

  // 基础处理函数
  const toggleNode = (path: string, taskData?: any) => {
    setExpandedNodes(prev => ({
      ...prev,
      [path]: !prev[path]
    }))
    
    // 如果是新任务且首次点击，标记为已点击
    if (taskData && taskData.isNew && !clickedNewTasks.has(path)) {
      setClickedNewTasks(prev => new Set([...prev, path]))
      // 同时更新任务数据，将isNew设为false
      setTaskHierarchy(prevHierarchy => {
        const newHierarchy = JSON.parse(JSON.stringify(prevHierarchy))
        const pathParts = path.split(' > ')
        if (pathParts.length === 2) {
          const rootKey = pathParts[0]
          const taskKey = pathParts[1]
          if (newHierarchy[rootKey] && newHierarchy[rootKey][taskKey]) {
            newHierarchy[rootKey][taskKey].isNew = false
          }
        }
        return newHierarchy
      })
    }
  }

  const selectPath = (path: string[]) => {
    setSelectedPath(path)
    
    // 当切换到新的状态分类时，自动选中该状态的第一个对话
    if (path.length >= 3) {
      const taskName = path[1]
      const statusName = path[2]
      const rootKey = Object.keys(taskHierarchy)[0]
      const taskData = taskHierarchy[rootKey as keyof typeof taskHierarchy] as any
      const statusData = taskData[taskName]?.[statusName]
      
      if (statusData && statusData.items && statusData.items.length > 0) {
        const firstItem = statusData.items[0]
        setCurrentDialogId(firstItem.id)
        
        // 加载该对话的标注数据（如果存在）
        const savedAnnotation = dialogAnnotations[firstItem.id]
        if (savedAnnotation) {
          setSelectedErrorCodes(savedAnnotation.errorCodes)
          setAnnotationValues(savedAnnotation.annotationValues)
          setHasAnnotated(true)
          setIsPending(savedAnnotation.status === 'pending')
        } else {
          // 重置标注状态
          setSelectedErrorCodes([])
          setAnnotationValues({})
          setHasAnnotated(false)
          setIsPending(false)
        }
        
        setShowQuickApply(false)
      }
    }
  }
  
  // 处理圆点点击
  const handleDotClick = (id: number) => {
    setCurrentDialogId(id)
    
    // 加载该对话的标注数据（如果存在）
    const savedAnnotation = dialogAnnotations[id]
    if (savedAnnotation) {
      setSelectedErrorCodes(savedAnnotation.errorCodes)
      setAnnotationValues(savedAnnotation.annotationValues)
      setHasAnnotated(true)
      setIsPending(savedAnnotation.status === 'pending')
      console.log('加载已保存的标注数据:', savedAnnotation)
    } else {
      // 重置标注状态
      setSelectedErrorCodes([])
      setAnnotationValues({})
      setHasAnnotated(false)
      setIsPending(false)
    }
    
    setShowQuickApply(false)
    console.log('切换到对话:', id)
    toast.info(`已切换到对话 ${id}`)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setShowSuggestions(query.length > 0)
  }

  const addErrorCode = (code: string) => {
    if (!selectedErrorCodes.includes(code)) {
      setSelectedErrorCodes([...selectedErrorCodes, code])
    }
    setSearchQuery('')
    setShowSuggestions(false)
  }

  const removeErrorCode = (code: string) => {
    setSelectedErrorCodes(selectedErrorCodes.filter(c => c !== code))
  }

  // 更新任务计数和item状态的函数
  const updateTaskCounts = (fromStatus: string, toStatus: string, itemId?: number) => {
    if (selectedPath.length >= 2) {
      const taskName = selectedPath[1]
      const targetItemId = itemId || currentDialogId
      
      setTaskHierarchy(prev => {
        const newHierarchy = JSON.parse(JSON.stringify(prev))
        const rootKey = Object.keys(newHierarchy)[0] // 获取动态的根键名
        const taskData = newHierarchy[rootKey][taskName]
        
        if (taskData) {
          // 状态映射
          const statusMap: Record<string, string> = {
            '已标注': 'annotated',
            '未标注': 'unannotated',
            '待定': 'pending'
          }
          
          const newStatusValue = statusMap[toStatus]
          
          // 1. 更新"全部"列表中对应item的状态
          if (taskData['全部'] && taskData['全部'].items) {
            const allItem = taskData['全部'].items.find((item: any) => item.id === targetItemId)
            if (allItem) {
              allItem.status = newStatusValue || allItem.status
            }
          }
          
          // 2. 根据"全部"列表重新构建各个状态列表
          if (taskData['全部'] && taskData['全部'].items) {
            const allItems = taskData['全部'].items
            
            // 重建"未标注"列表
            if (taskData['未标注']) {
              taskData['未标注'].items = allItems.filter((item: any) => item.status === 'unannotated')
              taskData['未标注'].count = taskData['未标注'].items.length
            }
            
            // 重建"已标注"列表
            if (taskData['已标注']) {
              taskData['已标注'].items = allItems.filter((item: any) => item.status === 'annotated')
              taskData['已标注'].count = taskData['已标注'].items.length
            }
            
            // 重建"待定"列表
            if (taskData['待定']) {
              taskData['待定'].items = allItems.filter((item: any) => item.status === 'pending')
              taskData['待定'].count = taskData['待定'].items.length
            }
          }
        }
        
        return newHierarchy
      })
    }
  }

  // 标注处理函数
  const handleConfirmAnnotation = () => {
    // 检查是否有标注内容
    const hasErrorCodes = selectedErrorCodes.length > 0
    const hasAnnotationValues = Object.keys(annotationValues).some(key => annotationValues[key])
    
    if (!hasErrorCodes && !hasAnnotationValues) {
      console.log('标注为无问题')
      toast.success('标注完成：无问题')
    } else {
      const annotationData = {
        errorCodes: selectedErrorCodes,
        annotations: annotationValues,
        timestamp: new Date().toISOString()
      }
      console.log('确认标注数据:', annotationData)
      toast.success(`标注完成：已保存标注数据`)
    }
    
    // 保存当前对话的标注数据
    setDialogAnnotations(prev => ({
      ...prev,
      [currentDialogId]: {
        errorCodes: selectedErrorCodes,
        annotationValues: annotationValues,
        status: 'annotated'
      }
    }))
    
    // 更新任务计数：从当前状态到已标注
    if (!hasAnnotated && selectedPath.length >= 3) {
      const currentStatus = selectedPath[2]
      updateTaskCounts(currentStatus, '已标注', currentDialogId)
    }
    
    // 同步选中的相似会话标注结果
    if (selectedSimilarForSync.length > 0) {
      console.log('同步相似会话标注:', selectedSimilarForSync, '错误码:', selectedErrorCodes)
      // 批量更新相似会话的任务计数
      if (selectedPath.length >= 3) {
        const currentStatus = selectedPath[2]
        for (let i = 0; i < selectedSimilarForSync.length; i++) {
          updateTaskCounts(currentStatus, '已标注')
        }
      }
      toast.success(`已同步 ${selectedSimilarForSync.length} 条相似会话的标注结果`)
    }
    
    setHasAnnotated(true)
    
    if (autoConfirm && !hasAnnotated) {
      // 延迟执行，确保状态更新完成
      setTimeout(() => {
        handleNextConversation()
      }, 100)
    }
  }

  const handleRefreshAnnotation = () => {
    console.log('刷新标注结果:', selectedErrorCodes)
    
    // 更新保存的标注数据
    setDialogAnnotations(prev => ({
      ...prev,
      [currentDialogId]: {
        errorCodes: selectedErrorCodes,
        annotationValues: annotationValues,
        status: 'annotated'
      }
    }))
    
    // 如果之前是待定状态，刷新标注时需要更新计数
    if (isPending && selectedPath.length >= 3) {
      updateTaskCounts('待定', '已标注', currentDialogId)
    }
    
    // 同步选中的相似会话标注结果
    if (selectedSimilarForSync.length > 0) {
      console.log('刷新时同步相似会话标注:', selectedSimilarForSync, '错误码:', selectedErrorCodes)
      toast.success(`已同步 ${selectedSimilarForSync.length} 条相似会话的标注结果`)
    }
    
    // 重置待定状态，保持已标注状态
    setIsPending(false)
    setHasAnnotated(true)
    
    if (selectedErrorCodes.length === 0) {
      toast.success('标注已刷新：无问题')
    } else {
      toast.success(`标注已刷新：已标记 ${selectedErrorCodes.length} 个错误码`)
    }
  }

  const handlePendingAnnotation = () => {
    // 保存当前对话的标注数据为待定状态
    setDialogAnnotations(prev => ({
      ...prev,
      [currentDialogId]: {
        errorCodes: selectedErrorCodes,
        annotationValues: annotationValues,
        status: 'pending'
      }
    }))
    
    // 更新任务计数：从当前状态到待定
    if (!hasAnnotated && selectedPath.length >= 3) {
      const currentStatus = selectedPath[2]
      updateTaskCounts(currentStatus, '待定', currentDialogId)
    }
    
    setHasAnnotated(true) // 更新标注状态
    setIsPending(true) // 设置为待定状态
    toast.success('已设为待定状态')
    console.log('设为待定状态')
  }

  const handleNextConversation = () => {
    let nextDialogId: number | null = null
    
    // 获取当前选中状态的所有对话items
    if (selectedPath.length >= 3) {
      const taskName = selectedPath[1]
      const statusName = selectedPath[2]
      const rootKey = Object.keys(taskHierarchy)[0]
      const taskData = taskHierarchy[rootKey as keyof typeof taskHierarchy] as any
      const statusData = taskData[taskName]?.[statusName]
      
      if (statusData && statusData.items) {
        const currentIndex = statusData.items.findIndex((item: any) => item.id === currentDialogId)
        
        // 如果当前对话不在列表中（可能被移走了），选择第一个对话
        if (currentIndex < 0) {
          if (statusData.items.length > 0) {
            const firstItem = statusData.items[0]
            nextDialogId = firstItem.id
          } else {
            toast.info(`当前"${statusName}"列表已空，请切换到其他状态`)
            return
          }
        } else {
          // 从当前位置开始查找下一个对话
          let searchIndex = currentIndex + 1
          
          // 如果启用了跳过已标注，则查找下一个未标注的对话
          if (skipAnnotated) {
            while (searchIndex < statusData.items.length) {
              const candidateItem = statusData.items[searchIndex]
              const savedAnnotation = dialogAnnotations[candidateItem.id]
              
              // 如果该对话没有标注数据，或者状态不是已标注，则选择它
              if (!savedAnnotation || savedAnnotation.status !== 'annotated') {
                nextDialogId = candidateItem.id
                break
              }
              searchIndex++
            }
            
            // 如果没有找到未标注的对话
            if (nextDialogId === null) {
              toast.info('后续对话都已标注，已到达最后')
              return
            }
          } else {
            // 不跳过已标注，直接选择下一个
            if (searchIndex < statusData.items.length) {
              const nextItem = statusData.items[searchIndex]
              nextDialogId = nextItem.id
            } else {
              toast.info('已经是最后一条对话了')
              return
            }
          }
        }
      }
    }
    
    // 更新对话ID
    if (nextDialogId !== null) {
      setCurrentDialogId(nextDialogId)
      
      // 加载该对话的标注数据（如果存在）
      const savedAnnotation = dialogAnnotations[nextDialogId]
      if (savedAnnotation) {
        setSelectedErrorCodes(savedAnnotation.errorCodes)
        setAnnotationValues(savedAnnotation.annotationValues)
        setHasAnnotated(true)
        setIsPending(savedAnnotation.status === 'pending')
      } else {
        setSelectedErrorCodes([])
        setAnnotationValues({})
        setHasAnnotated(false)
        setIsPending(false)
      }
    }
    
    setCurrentConversationIndex(prev => prev + 1)
    setShowQuickApply(false)
    // 保持相似会话的勾选状态，不重置
  }

  const handlePrevConversation = () => {
    let prevDialogId: number | null = null
    
    // 获取当前选中状态的所有对话items
    if (selectedPath.length >= 3) {
      const taskName = selectedPath[1]
      const statusName = selectedPath[2]
      const rootKey = Object.keys(taskHierarchy)[0]
      const taskData = taskHierarchy[rootKey as keyof typeof taskHierarchy] as any
      const statusData = taskData[taskName]?.[statusName]
      
      if (statusData && statusData.items) {
        const currentIndex = statusData.items.findIndex((item: any) => item.id === currentDialogId)
        if (currentIndex > 0) {
          // 切换到上一个对话
          const prevItem = statusData.items[currentIndex - 1]
          prevDialogId = prevItem.id
        } else {
          toast.info('已经是第一条对话了')
          return
        }
      }
    }
    
    // 更新对话ID
    if (prevDialogId !== null) {
      setCurrentDialogId(prevDialogId)
      
      // 加载该对话的标注数据（如果存在）
      const savedAnnotation = dialogAnnotations[prevDialogId]
      if (savedAnnotation) {
        setSelectedErrorCodes(savedAnnotation.errorCodes)
        setAnnotationValues(savedAnnotation.annotationValues)
        setHasAnnotated(true)
        setIsPending(savedAnnotation.status === 'pending')
      } else {
        setSelectedErrorCodes([])
        setAnnotationValues({})
        setHasAnnotated(false)
        setIsPending(false)
      }
    }
    
    setCurrentConversationIndex(prev => Math.max(0, prev - 1))
    setShowQuickApply(false)
    // 保持相似会话的勾选状态，不重置
  }

  // 处理查看全文
  const handleViewFullText = (content: any, type: 'mqa' | 'content' | 'retrieval') => {
    const targetType = type === 'retrieval' ? 'content' : type
    setFullTextContent({ ...content, type: targetType })
    setShowFullTextDialog(true)
  }

  // 处理跳转到平台页面
  const handleJumpToPlatform = (data: any, type: 'mqa' | 'content' | 'retrieval') => {
    const targetType = type === 'retrieval' ? 'content' : type
    setJumpTarget({ type: targetType, data })
    setShowJumpConfirmDialog(true)
  }

  // 确认跳转
  const confirmJump = () => {
    if (jumpTarget) {
      if (jumpTarget.type === 'mqa') {
        // 跳转到MQA管理页面
        window.open(`/mqa-management?questionId=${jumpTarget.data.questionId}`, '_blank')
        toast.success('正在跳转到MQA管理页面')
      } else if (jumpTarget.type === 'content') {
        // 跳转到内容库管理页面
        window.open(`/content-management?documentId=${jumpTarget.data.documentId}`, '_blank')
        toast.success('正在跳转到内容库管理页面')
      }
    }
    setShowJumpConfirmDialog(false)
    setJumpTarget(null)
  }

  // 历史标注参考处理函数
  const handleApplyHistoricalAnnotation = (errorCodes: string[]) => {
    setSelectedErrorCodes(errorCodes)
    toast.success(`已应用历史标注：${errorCodes.length > 0 ? errorCodes.join(', ') : '无问题'}`)
  }

  // 标注类型参考处理函数
  const handleShowAnnotationTypeReference = (typeId: string, typeName: string) => {
    setCurrentAnnotationType({ id: typeId, name: typeName })
    const historicalData = mockAnnotationTypeHistoricalData[typeId] || []
    setAnnotationTypeHistoricalData(historicalData)
    setShowAnnotationTypeReference(true)
  }

  const handleApplyAnnotationTypeValue = (typeId: string, value: string, errorCodes: string[] = []) => {
    setAnnotationValues(prev => ({
      ...prev,
      [typeId]: value
    }))
    if (errorCodes.length > 0) {
      setSelectedErrorCodes(prev => [...new Set([...prev, ...errorCodes])])
    }
    toast.success(`已应用标注值：${value || '无'}`)
  }



  // 相似会话同步处理函数
  const toggleSimilarForSync = (id: number) => {
    setSelectedSimilarForSync(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  // 获取未标注的相似会话
  const getUnAnnotatedSimilarConversations = () => {
    return getSimilarConversations(mockSimilarConversations)
      .filter(c => c.similarity >= 90) // 只显示高相似度的
      .slice(0, 5) // 限制显示数量
  }

  // 相似会话处理函数
  const handleApplyToSimilar = () => {
    if (selectedSimilarItems.length === 0) {
      alert('请先选择要应用的相似对话')
      return
    }
    
    console.log('应用标注到相似对话:', selectedSimilarItems)
    
    // 批量更新任务计数
    if (selectedPath.length >= 3) {
      const currentStatus = selectedPath[2]
      for (let i = 0; i < selectedSimilarItems.length; i++) {
        updateTaskCounts(currentStatus, '已标注')
      }
    }
    
    toast.success(`已将标注应用到 ${selectedSimilarItems.length} 条相似对话`)
    setSelectedSimilarItems([])
  }

  const handleViewGroupSimilar = (groupKey: string) => {
    setCurrentSimilarGroup(groupKey)
    setSimilarCurrentPage(1)
    setSelectedSimilarItems([])
    setShowSimilarDialog(true)
  }

  const getGroupTitle = (groupKey: string) => {
    const titles = {
      high: '高度相似 (90-100%)',
      medium: '比较相似 (80-90%)', 
      low: '可能相关 (70-80%)'
    }
    return titles[groupKey as keyof typeof titles] || '相似会话'
  }

  const toggleSimilarGroup = (groupKey: string) => {
    setExpandedSimilarGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  // 数据处理
  const filteredStandards = mockStandards.filter(standard =>
    standard.dimension.includes(searchQuery) ||
    standard.category.includes(searchQuery) ||
    standard.subcategory.includes(searchQuery) ||
    standard.standard.includes(searchQuery) ||
    standard.code.includes(searchQuery) ||
    standard.description.includes(searchQuery)
  )

  const getCurrentTaskInfo = () => {
    if (selectedPath.length >= 2) {
      const taskName = selectedPath[1]
      const rootKey = Object.keys(taskHierarchy)[0] // 获取动态的根键名
      const rootData = taskHierarchy[rootKey as keyof typeof taskHierarchy] as any
      const taskData = rootData[taskName]
      if (taskData) {
        const total = Object.values(taskData).reduce((sum: number, item: any) => {
          return typeof item === 'object' && item !== null && 'count' in item ? sum + item.count : sum
        }, 0)
        const completed = taskData['已标注'] && taskData['已标注'].count || 0
        const pending = taskData['待定'] && taskData['待定'].count || 0
        const remaining = taskData['未标注'] && taskData['未标注'].count || 0
        
        return {
          name: taskName,
          total,
          completed,
          pending,
          remaining,
          progress: Math.round((completed / (total as number)) * 100),
          // 包含完整的任务数据，包括标注配置
          ...taskData
        }
      }
    }
    return null
  }

  // 按相似度分组
  const getSimilarityGroups = (conversations: typeof mockSimilarConversations) => {
    const groups = {
      high: conversations.filter(c => c.similarity >= 90).sort((a, b) => b.similarity - a.similarity),
      medium: conversations.filter(c => c.similarity >= 80 && c.similarity < 90).sort((a, b) => b.similarity - a.similarity),
      low: conversations.filter(c => c.similarity >= 70 && c.similarity < 80).sort((a, b) => b.similarity - a.similarity)
    }
    return groups
  }

  const similarityGroups = getSimilarityGroups(mockSimilarConversations)

  const taskInfo = getCurrentTaskInfo()
  
  // 当前任务配置
  const currentTask = taskInfo

  // 相似会话分页处理
  const getCurrentGroupConversations = () => {
    if (!currentSimilarGroup) {
      // 如果没有选择特定分组，返回所有会话并按相似度降序排序
      return mockSimilarConversations.sort((a, b) => b.similarity - a.similarity)
    }
    const groups = getSimilarityGroups(mockSimilarConversations)
    return groups[currentSimilarGroup as keyof typeof groups] || []
  }
  
  const currentGroupConversations = getCurrentGroupConversations()
  const totalSimilarPages = Math.ceil(currentGroupConversations.length / similarPageSize)
  const currentSimilarItems = currentGroupConversations.slice(
    (similarCurrentPage - 1) * similarPageSize,
    similarCurrentPage * similarPageSize
  )

  const handleSelectAllSimilar = () => {
    const currentPageIds = currentSimilarItems.map(item => item.id)
    if (currentPageIds.every(id => selectedSimilarForSync.includes(id))) {
      // 取消选择当前页的所有项目
      setSelectedSimilarForSync(prev => prev.filter(id => !currentPageIds.includes(id)))
    } else {
      // 选择当前页的所有项目
      setSelectedSimilarForSync(prev => [...new Set([...prev, ...currentPageIds])])
    }
  }

  // 渲染函数
  const renderTaskTree = (data: any, parentPath: string[] = []) => {
    return Object.entries(data)
      .filter(([key]) => !['annotationConfig', 'isNew', 'deadline', 'description', 'dataType'].includes(key))
      .map(([key, value]) => {
      const currentPath = [...parentPath, key]
      const pathString = currentPath.join(' > ')
      const isExpanded = expandedNodes[pathString]
      const isSelected = JSON.stringify(selectedPath) === JSON.stringify(currentPath)
      
      if (typeof value === 'object' && value !== null && 'count' in value) {
        const hasItems = (value as any).items && (value as any).items.length > 0
        const dotListPath = currentPath.join(' > ')
        const isDotListExpanded = expandedNodes[dotListPath + '_dotlist']
        
        return (
          <div key={key} className="mx-3 mb-2">
            {/* 状态分类标签和点阵列表合并在一个圆角矩形框内 */}
            <div className={`bg-white border rounded-lg shadow-sm transition-colors ${
              isSelected ? 'border-blue-200' : 'border-gray-200'
            }`}>
              {/* 状态分类标签 */}
              <div
                className={`px-3 py-2 cursor-pointer transition-colors rounded-t-lg ${
                  isSelected 
                    ? 'bg-blue-50 text-blue-800' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  selectPath(currentPath)
                  // 切换点阵列表的展开状态
                  if (hasItems) {
                    setExpandedNodes(prev => ({
                      ...prev,
                      [dotListPath + '_dotlist']: !prev[dotListPath + '_dotlist']
                    }))
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{key}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(value as { count: number }).count}
                  </Badge>
                </div>
              </div>
              
              {/* 浅色分隔线 */}
              {isSelected && hasItems && isDotListExpanded && (
                <div className="border-t border-gray-100"></div>
              )}
              
              {/* 圆形点阵列表 - 只在选中该状态且展开时显示 */}
              {isSelected && hasItems && isDotListExpanded && (
                <div className="px-3 py-3 max-h-96 overflow-y-scroll ultra-thin-scrollbar" style={{ scrollbarGutter: 'stable' }}>
                  <CircleDotList 
                    items={(value as any).items}
                    onItemClick={handleDotClick}
                    currentItemId={currentDialogId}
                  />
                </div>
              )}
            </div>
          </div>
        )
      } else if (typeof value === 'object' && value !== null && 'deadline' in value) {
        // 任务信息卡片
        const taskData = value as any
        // 总数应该使用"全部"列表的count，而不是所有状态count的总和
        const total = taskData['全部'] && taskData['全部'].count || 0
        const completed = taskData['已标注'] && taskData['已标注'].count || 0
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0
        const timeRemaining = calculateTimeRemaining(taskData.deadline)
        
        // 检查是否为当前选中的任务
        const isCurrentTask = selectedPath.length >= 2 && selectedPath[1] === key
        
        return (
          <div key={key} className="mb-3">
            {/* 任务信息卡片 */}
            <div className={`mx-3 mb-2 p-3 border rounded-lg shadow-sm relative ${
              isCurrentTask 
                ? 'bg-slate-50 border-slate-200' 
                : 'bg-white border-gray-200'
            }`}>
              <div
                className="flex items-center cursor-pointer hover:bg-blue-100/50 -m-1 p-1 rounded"
                onClick={() => toggleNode(pathString, taskData)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-2 text-blue-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2 text-blue-600" />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-semibold text-gray-800">{key}</h3>
                    <div className="flex items-center gap-2">
                      {taskData.isNew && !clickedNewTasks.has(pathString) && (
                        <span className="text-red-500 text-xs font-medium">NEW</span>
                      )}
                      {isCurrentTask && (
                        <span className="text-blue-600 text-xs font-medium">当前</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{taskData.description}</p>
                  
                  {/* 数据类型标签 */}
                  {taskData.dataType && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        taskData.dataType === 'dialogue' ? 'bg-purple-100 text-purple-800' :
                        taskData.dataType === 'image' ? 'bg-green-100 text-green-800' :
                        taskData.dataType === 'video' ? 'bg-blue-100 text-blue-800' :
                        taskData.dataType === 'text' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {taskData.dataType === 'dialogue' ? '对话标注' :
                         taskData.dataType === 'image' ? '图片标注' :
                         taskData.dataType === 'video' ? '视频标注' :
                         taskData.dataType === 'text' ? '文本标注' :
                         '未知类型'}
                      </span>
                    </div>
                  )}
                  
                  {/* 进度条 */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">完成进度</span>
                      <span className="text-xs font-medium text-gray-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress >= 80 ? 'bg-emerald-500' : 
                          progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>已完成: {completed}</span>
                      <span>总计: {total}</span>
                    </div>
                  </div>
                  
                  {/* 倒计时 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">截止时间</span>
                    </div>
                    <div className={`text-xs font-medium ${
                      timeRemaining.isOverdue 
                        ? 'text-red-600' 
                        : timeRemaining.days <= 1 
                        ? 'text-amber-600' 
                        : 'text-emerald-600'
                    }`}>
                      {timeRemaining.isOverdue 
                        ? '已逾期' 
                        : `还有 ${timeRemaining.days}天 ${timeRemaining.hours}时`
                      }
                    </div>
                  </div>


                </div>
              </div>
            </div>
            
            {/* 任务列表和状态分类 */}
            {isExpanded && (
              <div className="ml-4">
                {/* 任务列表标题和图例 */}
                <div className="mx-3 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">任务列表</h4>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>已标注</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></div>
                      <span>未标注</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                      <span>待定</span>
                    </div>
                  </div>
                </div>
                
                {/* 状态分类标签 */}
                {renderTaskTree(value, currentPath)}
              </div>
            )}
          </div>
        )
      } else if (typeof value === 'object' && value !== null && !('deadline' in value) && !('description' in value) && !('isNew' in value) && !('dataType' in value)) {
        // 只渲染真正的任务层级，跳过内部属性
        return (
          <div key={key}>
            <div
              className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                isSelected ? 'bg-slate-50 text-slate-700' : ''
              }`}
              onClick={() => toggleNode(pathString)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm font-medium">{key}</span>
            </div>
            {isExpanded && (
              <div className="ml-4">
                {renderTaskTree(value, currentPath)}
              </div>
            )}
          </div>
        )
      } else {
        // 跳过内部属性，不渲染
        return null
      }
    })
  }

  const renderConversationMessages = () => {
    let lastDate = ''
    const messages = []
    
    for (const message of mockConversation) {
      if (message.date && message.date !== lastDate) {
        messages.push(
          <div key={`date-${message.date}`} className="flex justify-center my-4">
            <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {message.date}
            </div>
          </div>
        )
        lastDate = message.date
      }
      
      messages.push(
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}
        >
          <div className={`max-w-xs lg:max-w-md ${message.sender === 'user' ? 'mr-8' : 'ml-8'}`}>
            {/* AI回复类型标注 */}
            {message.sender === 'ai' && message.replyType && (
              <div className="mb-1 flex justify-end">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  message.replyType === 'MQA' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : message.replyType === 'LLM'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : message.replyType === '人工客服'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : message.replyType === '人工推送'
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {message.replyType}
                </span>
              </div>
            )}
            
            <div
              className={`px-4 py-2 rounded-lg cursor-pointer transition-all group ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : selectedMessageId === message.id
                  ? 'bg-blue-100 text-gray-800 border-2 border-blue-400'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              onClick={() => {
                if (message.sender === 'ai') {
                  setSelectedMessageId(message.id)
                  setKnowledgeReference(mockKnowledgeReferences[message.id] || null)
                }
              }}
            >
              <div className="text-sm">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp}
                {message.sender === 'ai' && (
                  <span className="ml-2 text-xs opacity-0 group-hover:opacity-70 transition-opacity duration-200">点击查看参考知识</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    return messages
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧任务层级目录 */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col" style={{ scrollbarGutter: 'stable' }}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">标注任务</h2>
        </div>
        
        <div className="flex-1 overflow-y-scroll thin-scrollbar">
          {renderTaskTree(taskHierarchy)}
        </div>
      </div>

      {/* 知识点参考栏 - 支持收起/展开 */}
      {!isKnowledgeCollapsed ? (
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col relative">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">回复参考知识</h2>
          </div>
          {/* 收起按钮 - 居中显示，只显示一半 */}
          <button
            onClick={() => setIsKnowledgeCollapsed(true)}
            className="absolute -right-5 top-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition-all group z-10"
            title="收起参考知识"
          >
            <div className="flex flex-col items-center gap-1">
              <ChevronLeft className="w-3 h-3 text-gray-600 group-hover:text-blue-600" />
              <span className="text-xs text-gray-600 group-hover:text-blue-600 whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                参考知识
              </span>
            </div>
          </button>
        
        <div className="flex-1 overflow-y-auto p-4 thin-scrollbar">
          {selectedMessageId && knowledgeReference ? (
            <div className="space-y-4">
              {/* 回复类型标识 */}
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  knowledgeReference.type === 'MQA' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : knowledgeReference.type === 'LLM'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : knowledgeReference.type === '人工推送'
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : knowledgeReference.type === '人工回复'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {knowledgeReference.type}
                </span>
              </div>

              {/* MQA类型的参考信息 */}
              {knowledgeReference.type === 'MQA' && (
                <div className="space-y-2">
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <div className="grid grid-cols-2 gap-2 mb-2 pb-2 border-b border-blue-200">
                      <div>
                        <h3 className="text-xs font-medium text-blue-800 mb-1">Question ID</h3>
                        <p className="text-xs text-blue-700 font-mono">{knowledgeReference.questionId}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-blue-800 mb-1">Answer ID</h3>
                        <p className="text-xs text-blue-700 font-mono">{knowledgeReference.answerId}</p>
                      </div>
                    </div>
                    
                    <div className="mb-2 pb-2 border-b border-blue-200">
                      <h3 className="text-xs font-medium text-blue-800 mb-1">标准问法</h3>
                      <p className="text-xs text-blue-700 leading-tight">{knowledgeReference.question}</p>
                    </div>
                    
                    <div className="mb-2 pb-2 border-b border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-medium text-blue-800">答案</h3>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewFullText(knowledgeReference, 'mqa')}
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            全文
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleJumpToPlatform(knowledgeReference, 'mqa')}
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            修改
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 leading-tight line-clamp-3">{knowledgeReference.answer}</p>
                    </div>
                    
                    <div className="mb-2 pb-2 border-b border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-medium text-blue-800">Score</h3>
                        <span className="text-xs text-blue-700 font-medium">{knowledgeReference.score.toFixed(2)}</span>
                      </div>
                      <div className="bg-blue-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${knowledgeReference.score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-medium text-blue-800 mb-1">匹配关键词</h3>
                      <div className="flex flex-wrap gap-1">
                        {knowledgeReference.matchedKeywords.map((keyword: string, index: number) => (
                          <span key={index} className="px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LLM类型的参考信息 */}
              {knowledgeReference.type === 'LLM' && (
                <div className="space-y-2">
                  {/* 联网搜索结果 */}
                  {knowledgeReference.webSearchResults && knowledgeReference.webSearchResults.length > 0 && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <h3 className="text-xs font-medium text-green-800 mb-2">联网搜索结果</h3>
                      <div className="space-y-1">
                        {knowledgeReference.webSearchResults.map((result: any, index: number) => (
                          <div key={index} className="bg-white p-2 rounded border border-green-300">
                            <div className="mb-1 pb-1 border-b border-gray-100">
                              <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 underline line-clamp-1"
                              >
                                {result.title}
                              </a>
                              <p className="text-xs text-gray-500 truncate">{result.url}</p>
                            </div>
                            <div className="text-xs text-gray-700 mb-1 leading-tight pb-1 border-b border-gray-100">
                              {result.snippet.split(new RegExp(`(${result.matchedText.join('|')})`, 'gi')).map((part: string, i: number) => 
                                result.matchedText.some((match: string) => match.toLowerCase() === part.toLowerCase()) ? (
                                  <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {result.matchedText.map((text: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                                  {text}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 检索库文档结果 */}
                  {knowledgeReference.retrievalResults && knowledgeReference.retrievalResults.length > 0 && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <h3 className="text-xs font-medium text-green-800 mb-2">检索库文档结果</h3>
                      <div className="space-y-1">
                        {knowledgeReference.retrievalResults.map((result: any, index: number) => (
                          <div key={index} className="bg-white p-2 rounded border border-green-300">
                            <div className="mb-1 pb-1 border-b border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-1 flex-1 min-w-0">
                                  <h4 className="text-xs font-medium text-gray-800 line-clamp-1">{result.title}</h4>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewFullText(result, 'retrieval')}
                                    className="h-5 px-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleJumpToPlatform(result, 'retrieval')}
                                    className="h-5 px-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-1">{result.abstract}</p>
                            </div>
                            <div className="text-xs text-gray-700 mb-1 leading-tight pb-1 border-b border-gray-100">
                              {result.content.split(new RegExp(`(${result.matchedText.join('|')})`, 'gi')).map((part: string, i: number) => 
                                result.matchedText.some((match: string) => match.toLowerCase() === part.toLowerCase()) ? (
                                  <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {result.matchedText.map((text: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                                  {text}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 内容库检索结果 */}
                  {knowledgeReference.contentResults && knowledgeReference.contentResults.length > 0 && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <h3 className="text-xs font-medium text-green-800 mb-2">内容库检索结果</h3>
                      <div className="space-y-1">
                        {knowledgeReference.contentResults.map((result: any, index: number) => (
                          <div key={index} className="bg-white p-2 rounded border border-green-300">
                            <div className="mb-1 pb-1 border-b border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-1 flex-1 min-w-0">
                                  <span className="text-xs font-mono text-gray-500">{result.documentId}</span>
                                  <h4 className="text-xs font-medium text-gray-800 line-clamp-1">{result.title}</h4>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewFullText(result, 'content')}
                                    className="h-5 px-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleJumpToPlatform(result, 'content')}
                                    className="h-5 px-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-1">{result.abstract}</p>
                            </div>
                            <div className="text-xs text-gray-700 mb-1 pb-1 border-b border-gray-100">
                              <div className="mb-1">
                                <span className="text-xs font-medium text-gray-600">内容：</span>
                                <span className="text-xs text-gray-700 leading-tight">
                                  {result.content.split(new RegExp(`(${result.matchedText.join('|')})`, 'gi')).map((part: string, i: number) => 
                                    result.matchedText.some((match: string) => match.toLowerCase() === part.toLowerCase()) ? (
                                      <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
                                    ) : (
                                      <span key={i}>{part}</span>
                                    )
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-600">摘要：</span>
                                <span className="text-xs text-gray-700">{result.summary}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {result.matchedText.map((text: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                                  {text}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 模型信息 */}
                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-green-800">模型：</span>
                        <span className="text-green-700">{knowledgeReference.model}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Temp：</span>
                        <span className="text-green-700">{knowledgeReference.temperature}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Token：</span>
                        <span className="text-green-700">{knowledgeReference.tokens}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 人工客服类型的参考信息 */}
              {knowledgeReference.type === '人工客服' && (
                <div className="space-y-2">
                  <div className="bg-purple-50 p-2 rounded border border-purple-200">
                    <div className="grid grid-cols-2 gap-2 mb-2 pb-2 border-b border-purple-200">
                      <div>
                        <h3 className="text-xs font-medium text-purple-800 mb-1">坐席ID</h3>
                        <p className="text-xs text-purple-700 font-mono">{knowledgeReference.operatorId}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-purple-800 mb-1">坐席姓名</h3>
                        <p className="text-xs text-purple-700">{knowledgeReference.operatorName}</p>
                      </div>
                    </div>
                    
                    <div className="mb-2 pb-2 border-b border-purple-200">
                      <h3 className="text-xs font-medium text-purple-800 mb-1">回复时间</h3>
                      <p className="text-xs text-purple-700">{knowledgeReference.replyTime}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-medium text-purple-800 mb-1">会话ID</h3>
                      <p className="text-xs text-purple-700 font-mono">{knowledgeReference.sessionId}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">💡</div>
                <p className="text-sm">点击AI回复查看参考知识</p>
              </div>
            </div>
          )}
        </div>
        </div>
      ) : (
        /* 收起状态 - 显示展开按钮，居中显示，只显示一半 */
        <div className="relative bg-white border-r border-gray-200 flex items-center justify-center" style={{ width: '1px' }}>
          <button
            onClick={() => setIsKnowledgeCollapsed(false)}
            className="absolute -left-5 top-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition-all group"
            title="展开参考知识"
          >
            <div className="flex flex-col items-center gap-1">
              <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-blue-600" />
              <span className="text-xs text-gray-600 group-hover:text-blue-600 whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                参考知识
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 中间对话展示区域 */}
      <div className="flex-1 flex flex-col bg-white">
        {/* 标题区域 - 与其他栏目保持一致的高度 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">对话详情</h2>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              isPending 
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : hasAnnotated 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {isPending ? '待定' : hasAnnotated ? '已标注' : '未标注'}
            </div>
          </div>
        </div>
        
        {/* 信息区域 - Session ID 和 Open ID */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-gray-500 font-medium whitespace-nowrap">OpenID:</span>
              <code 
                className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-800 font-mono text-xs cursor-pointer hover:bg-gray-200 transition-colors truncate flex-1"
                onClick={() => {
                  navigator.clipboard.writeText('7E6BA5BBB94D75535F0668429F3677C6')
                  toast.success('已复制 Open ID: 7E6BA5BBB94D75535F0668429F3677C6')
                }}
                title="7E6BA5BBB94D75535F0668429F3677C6 (点击复制)"
              >
                7E6BA5BBB94D75535F0668429F3677C6
              </code>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-500 font-medium whitespace-nowrap">SessionID:</span>
              <code 
                className="px-1.5 py-0.5 bg-blue-50 rounded text-blue-800 font-mono text-xs cursor-pointer hover:bg-blue-100 transition-colors truncate flex-1"
                onClick={() => {
                  navigator.clipboard.writeText('session_1194_xy_wxwork_oMtbqt8v6Md4YTuxpeKru3yjHS8o_20250912041714')
                  toast.success('已复制 Session ID: session_1194_xy_wxwork_oMtbqt8v6Md4YTuxpeKru3yjHS8o_20250912041714')
                }}
                title="session_1194_xy_wxwork_oMtbqt8v6Md4YTuxpeKru3yjHS8o_20250912041714 (点击复制)"
              >
                session_1194_xy_wxwork_oMtbqt8v6Md4YTuxpeKru3yjHS8o_20250912041714
              </code>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-scroll p-4">
          <div className="space-y-4">
            {renderConversationMessages()}
          </div>
        </div>
      </div>

      {/* 右侧标注区域 */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">标注操作</h2>
        </div>
        
        {/* 标注项目滚动区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 modern-scrollbar">

          {/* 相似会话管理 - 已隐藏，功能移至各类标注项目的"参考"中 */}
          <div className="space-y-3 hidden">
            <h3 className="text-sm font-medium text-gray-800">相似会话管理</h3>
            
            {/* 历史标注参考 */}
            <div className="border border-gray-200 rounded-lg">
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="annotation-section-title">历史标注参考</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      点击快速应用标注结果
                    </span>
                    <button
                      onClick={() => setIsHistoricalAnnotationsExpanded(!isHistoricalAnnotationsExpanded)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {isHistoricalAnnotationsExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {isHistoricalAnnotationsExpanded && (
                  <div className="space-y-1">
                    {mockHistoricalAnnotations.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-2 border rounded text-xs hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleApplyHistoricalAnnotation(item.errorCodes)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-xs text-emerald-600">
                            相似度: {item.similarity}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            item.annotationResult === '无问题' 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}>
                            {item.annotationResult}
                          </span>
                          <Eye 
                            className="w-3 h-3 text-gray-500 hover:text-gray-700 cursor-pointer"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              setSelectedSimilarConversation({
                                ...item,
                                fullContent: [
                                  { sender: 'user', content: item.preview.split('AI：')[0].replace('用户：', '') },
                                  { sender: 'ai', content: item.preview.split('AI：')[1] }
                                ]
                              })
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-gray-600 line-clamp-1 mb-1">
                        {item.preview}
                      </div>
                      {item.errorCodes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.errorCodes.map((code) => (
                            <Badge key={code} variant="outline" className="text-xs">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 未标注相似会话 */}
            <div className="border border-gray-200 rounded-lg">
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="annotation-section-title">未标注相似会话</span>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">
                      90%+ ({getUnAnnotatedSimilarConversations().length}条)
                    </span>
                    <button
                      onClick={() => setIsSimilarConversationsExpanded(!isSimilarConversationsExpanded)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {isSimilarConversationsExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {isSimilarConversationsExpanded && (
                  <div className="space-y-1">
                    {getUnAnnotatedSimilarConversations().slice(0, 3).map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-2 border rounded text-xs cursor-pointer transition-colors ${
                        selectedSimilarForSync.includes(conv.id)
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                      onClick={() => toggleSimilarForSync(conv.id)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedSimilarForSync.includes(conv.id)}
                            onChange={() => {}}
                            className="w-3 h-3"
                          />
                          <span className="font-medium text-xs text-blue-600">
                            相似度: {conv.similarity}%
                          </span>
                        </div>
                        <Eye 
                          className="w-3 h-3 text-gray-500 hover:text-gray-700 cursor-pointer"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            setSelectedSimilarConversation(conv)
                          }}
                        />
                      </div>
                      <div className="text-gray-600 line-clamp-1 mb-1">
                        {conv.preview}
                      </div>
                    </div>
                    ))}
                  </div>
                )}
                
                {selectedSimilarForSync.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <div className="text-xs text-indigo-600 text-center bg-indigo-50 py-1 px-2 rounded border border-indigo-200">
                      选中的 {selectedSimilarForSync.length} 条会话将与当前会话的标注结果保持一致
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => setShowSimilarDialog(true)}
                  className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 border-t border-gray-100 mt-2"
                >
                  查看全部相似会话
                </button>
              </div>
            </div>
          </div>



          {/* 动态标注类型 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">标注项目</h3>
            
            {/* 预定义标注类型 */}
            {currentTask && (currentTask as any).annotationConfig && (currentTask as any).annotationConfig.predefinedTypes && (currentTask as any).annotationConfig.predefinedTypes.map((typeId: keyof typeof predefinedAnnotationTypes) => {
              const typeConfig = predefinedAnnotationTypes[typeId]
              if (!typeConfig) return null
              
              return (
                <div key={typeId} className={`space-y-2 p-3 border border-gray-200 rounded-lg ${
                  typeConfig.type === 'error_code_search' 
                    ? (selectedErrorCodes.length > 0 ? 'bg-blue-50' : 'bg-gray-50')
                    : (annotationValues[typeId] ? 'bg-blue-50' : 'bg-gray-50')
                }`}>
                  <div className="flex justify-between items-center">
                    <label className="annotation-label">
                      {typeConfig.name}
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-3 py-1 h-7"
                      onClick={() => handleShowAnnotationTypeReference(typeId as string, typeConfig.name)}
                    >
                      参考
                    </Button>
                  </div>
                  {typeConfig.type === 'select' ? (
                    <select
                      value={annotationValues[typeId] || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAnnotationValues(prev => ({
                        ...prev,
                        [typeId]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择...</option>
                      {typeConfig.options && typeConfig.options.length > 0 && typeConfig.options.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : typeConfig.type === 'error_code_search' ? (
                    <div className="space-y-3">
                      {/* 质检标准搜索 */}
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                            placeholder="输入关键字搜索标准..."
                            className="pl-10"
                          />
                        </div>
                        
                        {showSuggestions && filteredStandards.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                            {filteredStandards.map((standard) => (
                              <div
                                key={standard.id}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => addErrorCode(standard.code)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-800">
                                      {standard.standard}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {standard.category} &gt; {standard.subcategory}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {standard.description}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs ml-2">
                                    {standard.code}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 已选择的错误码 */}
                      {selectedErrorCodes.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-800">已选择的错误码</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedErrorCodes.map((code) => (
                              <Badge
                                key={code}
                                variant="destructive"
                                className="flex items-center gap-1"
                              >
                                {code}
                                <X
                                  className="w-3 h-3 cursor-pointer"
                                  onClick={() => removeErrorCode(code)}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : typeConfig.type === 'input' ? (
                    <Input
                      type="text"
                      value={annotationValues[typeId] || ''}
                      onChange={(e) => setAnnotationValues(prev => ({
                        ...prev,
                        [typeId]: e.target.value
                      }))}
                      placeholder={`请输入${typeConfig.name}`}
                    />
                  ) : null}
                </div>
              )
            })}
            
            {/* 自定义标注类型 */}
            {(currentTask as any) && (currentTask as any).annotationConfig && (currentTask as any).annotationConfig.customTypes && (currentTask as any).annotationConfig.customTypes.map((customType: any, index: number) => (
              <div key={`custom_${index}`} className={`space-y-2 p-3 border border-gray-200 rounded-lg ${annotationValues[`custom_${index}`] ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <label className="annotation-label">
                    {customType.name}
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1 h-7"
                    onClick={() => handleShowAnnotationTypeReference(`custom_${index}`, customType.name)}
                  >
                    参考
                  </Button>
                </div>
                {customType.type === 'select' ? (
                  <select
                    value={annotationValues[`custom_${index}`] || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAnnotationValues(prev => ({
                      ...prev,
                      [`custom_${index}`]: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择...</option>
                    {customType.options && customType.options.length > 0 && customType.options.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    value={annotationValues[`custom_${index}`] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnotationValues(prev => ({
                      ...prev,
                      [`custom_${index}`]: e.target.value
                    }))}
                    placeholder={`请输入${customType.name}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* 固定在底部的操作按钮区域 */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-confirm"
                checked={autoConfirm}
                onCheckedChange={(checked: boolean | 'indeterminate') => setAutoConfirm(checked === true)}
              />
              <label htmlFor="auto-confirm" className="text-sm text-gray-700">
                确认标注后自动跳转下一条
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-annotated"
                checked={skipAnnotated}
                onCheckedChange={(checked: boolean | 'indeterminate') => setSkipAnnotated(checked === true)}
              />
              <label htmlFor="skip-annotated" className="text-sm text-gray-700">
                跳过已标注对话
              </label>
            </div>

            <Button
              onClick={hasAnnotated ? handleRefreshAnnotation : handleConfirmAnnotation}
              className={`w-full ${
                hasAnnotated 
                  ? 'bg-gray-600 hover:bg-gray-900 text-white transition-colors duration-200' 
                  : ''
              }`}
              variant={hasAnnotated ? 'default' : 'default'}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {hasAnnotated ? '刷新标注' : '确认标注'}
            </Button>

            <Button
              onClick={handlePendingAnnotation}
              variant="outline"
              className={`w-full ${
                isPending 
                  ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-sm' 
                  : 'hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              {isPending ? '已设为待定' : '设为待定'}
            </Button>

            {/* 导航按钮 */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <Button
                onClick={handlePrevConversation}
                disabled={(() => {
                  if (selectedPath.length >= 3) {
                    const taskName = selectedPath[1]
                    const statusName = selectedPath[2]
                    const rootKey = Object.keys(taskHierarchy)[0]
                    const taskData = taskHierarchy[rootKey as keyof typeof taskHierarchy] as any
                    const statusData = taskData[taskName]?.[statusName]
                    if (statusData && statusData.items) {
                      const currentIndex = statusData.items.findIndex((item: any) => item.id === currentDialogId)
                      return currentIndex <= 0
                    }
                  }
                  return currentConversationIndex === 0
                })()}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                上一条
              </Button>
              
              <div className="text-xs text-gray-600">
                {(() => {
                  if (selectedPath.length >= 3) {
                    const taskName = selectedPath[1]
                    const statusName = selectedPath[2]
                    const rootKey = Object.keys(taskHierarchy)[0]
                    const taskData = taskHierarchy[rootKey as keyof typeof taskHierarchy] as any
                    const statusData = taskData[taskName]?.[statusName]
                    if (statusData && statusData.items) {
                      const currentIndex = statusData.items.findIndex((item: any) => item.id === currentDialogId)
                      return `${currentIndex + 1} / ${statusData.items.length}`
                    }
                  }
                  return `${currentConversationIndex + 1} / ${mockConversation.length}`
                })()}
              </div>
              
              <Button
                onClick={handleNextConversation}
                disabled={(() => {
                  if (selectedPath.length >= 3) {
                    const taskName = selectedPath[1]
                    const statusName = selectedPath[2]
                    const rootKey = Object.keys(taskHierarchy)[0]
                    const taskData = taskHierarchy[rootKey as keyof typeof taskHierarchy] as any
                    const statusData = taskData[taskName]?.[statusName]
                    if (statusData && statusData.items) {
                      const currentIndex = statusData.items.findIndex((item: any) => item.id === currentDialogId)
                      return currentIndex >= statusData.items.length - 1
                    }
                  }
                  return currentConversationIndex >= mockConversation.length - 1
                })()}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                下一条
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 相似会话详情弹窗 */}
      <Dialog open={showSimilarDialog} onOpenChange={setShowSimilarDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              相似会话管理 (共 {mockSimilarConversations.length} 条)
            </DialogTitle>
          </DialogHeader>
        
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleSelectAllSimilar}
                  variant="outline"
                  size="sm"
                >
                  {currentSimilarItems.every(item => selectedSimilarForSync.includes(item.id)) ? '取消全选' : '全选当前页'}
                </Button>
                <span className="text-sm text-gray-600">
                  已选择 {selectedSimilarForSync.length} 条
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">每页显示:</span>
                <select
                  value={similarPageSize}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setSimilarPageSize(Number(e.target.value))
                    setSimilarCurrentPage(1)
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded thin-scrollbar">
              <div className="space-y-1 p-2">
                {currentSimilarItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedSimilarForSync.includes(item.id)
                        ? 'border-blue-500 bg-blue-50'
                        : item.similarity >= 90
                        ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (selectedSimilarForSync.includes(item.id)) {
                        setSelectedSimilarForSync(prev => prev.filter(id => id !== item.id))
                      } else {
                        setSelectedSimilarForSync(prev => [...prev, item.id])
                      }
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedSimilarForSync.includes(item.id)}
                          onChange={() => {}}
                        />
                        <span className={`font-medium text-sm ${
                          item.similarity >= 90 ? 'text-orange-700' : 'text-blue-700'
                        }`}>
                          相似度: {item.similarity}%
                        </span>
                      </div>
                      <Eye 
                        className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          setSelectedSimilarConversation(item)
                        }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {item.preview}
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {selectedSimilarForSync.length > 0 && (
              <div className="flex justify-center items-center pt-3 border-t border-gray-200">
                <div className="text-sm text-blue-600 text-center">
                  已选择 {selectedSimilarForSync.length} 条会话，将与当前会话的标注结果保持一致
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 相似会话预览弹窗 */}
      {selectedSimilarConversation && (
        <Dialog open={!!selectedSimilarConversation} onOpenChange={() => setSelectedSimilarConversation(null)}>
          <DialogContent className="max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                相似会话详情 (相似度: {selectedSimilarConversation.similarity}%)
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space极-y-3 p-4 thin-scrollbar">
              {selectedSimilarConversation.fullContent.map((message: any, index: number) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedSimilarConversation(null)}
              >
                关闭
              </Button>
              <Button
                onClick={() => {
                  if (!selectedSimilarItems.includes(selectedSimilarConversation.id)) {
                    setSelectedSimilarItems(prev => [...prev, selectedSimilarConversation.id])
                  }
                  setSelectedSimilarConversation(null)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                选择应用
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 标注类型参考弹窗 */}
      <Dialog open={showAnnotationTypeReference} onOpenChange={setShowAnnotationTypeReference}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {currentAnnotationType?.name} - 历史标注参考
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex space-x-4">
            {/* 左侧：历史标注参考 */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-sm font-medium mb-3">历史标注参考 ({annotationTypeHistoricalData.length} 条)</h3>
              <div className="flex-1 overflow-y-auto space-y-2 thin-scrollbar">
                {annotationTypeHistoricalData.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleApplyAnnotationTypeValue(
                      currentAnnotationType?.id || '', 
                      item.annotationValue,
                      item.errorCodes
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-600">
                          相似度: {item.similarity}%
                        </span>
                        <Badge 
                          variant={item.annotationValue ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {item.annotationValue || '无标注'}
                        </Badge>
                      </div>
                      <Eye 
                        className="w-4 h-4 text-gray-500 hover:text-gray-700"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          setSelectedSimilarConversation(item)
                        }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {item.preview}
                    </div>
                    {item.errorCodes && item.errorCodes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.errorCodes.map((code: string) => (
                          <Badge key={code} variant="outline" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* 右侧：快速应用操作 */}
            <div className="w-80 flex flex-col">
              <h3 className="annotation-section-title mb-3">快速应用</h3>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg bg-blue-50">
                  <h4 className="annotation-label text-blue-800 mb-2">历史标注参考</h4>
                  <p className="annotation-content text-blue-600 mb-3">
                    点击左侧历史记录可快速应用标注值到当前会话
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-blue-600">
                      • 选择相似的历史标注案例
                    </div>
                    <div className="text-xs text-blue-600">
                      • 一键应用标注结果
                    </div>
                    <div className="text-xs text-blue-600">
                      • 提高标注效率和一致性
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg bg-green-50">
                  <h4 className="annotation-label text-green-800 mb-2">操作提示</h4>
                  <div className="space-y-1">
                    <p className="annotation-content text-green-600">
                      1. 浏览左侧历史标注记录
                    </p>
                    <p className="annotation-content text-green-600">
                      2. 点击"应用"按钮快速复用
                    </p>
                    <p className="annotation-content text-green-600">
                      3. 根据需要调整标注内容
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 p-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAnnotationTypeReference(false)}
            >
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 全文查看对话框 */}
      <Dialog open={showFullTextDialog} onOpenChange={setShowFullTextDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>
                {fullTextContent?.type === 'mqa' ? 'MQA完整内容' : '内容库完整内容'}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 space-y-4">
            {fullTextContent && (
              <div className="space-y-4">
                {fullTextContent.type === 'mqa' ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="text-sm font-medium text-blue-800 mb-2">Question ID</h3>
                          <p className="text-sm text-blue-700 font-mono bg-white p-2 rounded border">
                            {fullTextContent.questionId}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-blue-800 mb-2">Answer ID</h3>
                          <p className="text-sm text-blue-700 font-mono bg-white p-2 rounded border">
                            {fullTextContent.answerId}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">标准问法</h3>
                        <div className="bg-white p-3 rounded border text-sm text-blue-700 leading-relaxed">
                          {fullTextContent.question}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">完整答案</h3>
                        <div className="bg-white p-3 rounded border text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">
                          {fullTextContent.answer}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-blue-800 mb-2">匹配得分</h3>
                          <div className="bg-white p-2 rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-blue-700">{fullTextContent.score?.toFixed(2) || 'N/A'}</span>
                              <div className="bg-blue-200 rounded-full h-2 w-20">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(fullTextContent.score || 0) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-blue-800 mb-2">匹配关键词</h3>
                          <div className="bg-white p-2 rounded border">
                            <div className="flex flex-wrap gap-1">
                              {fullTextContent.matchedKeywords?.map((keyword: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-green-800 mb-2">文档信息</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-green-600">文档ID：</span>
                            <span className="text-sm font-mono text-green-700">{fullTextContent.documentId}</span>
                          </div>
                          <div>
                            <span className="text-xs text-green-600">标题：</span>
                            <span className="text-sm text-green-700">{fullTextContent.title}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-green-800 mb-2">摘要</h3>
                        <div className="bg-white p-3 rounded border text-sm text-green-700 leading-relaxed">
                          {fullTextContent.abstract}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-green-800 mb-2">完整内容</h3>
                        <div className="bg-white p-3 rounded border text-sm text-green-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                          {fullTextContent.content}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-green-800 mb-2">总结</h3>
                        <div className="bg-white p-3 rounded border text-sm text-green-700 leading-relaxed">
                          {fullTextContent.summary}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-green-800 mb-2">匹配关键词</h3>
                        <div className="bg-white p-2 rounded border">
                          <div className="flex flex-wrap gap-1">
                            {fullTextContent.matchedText?.map((text: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                                {text}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 p-4 border-t">
            <Button variant="outline" onClick={() => setShowFullTextDialog(false)}>
              关闭
            </Button>
            {fullTextContent && (
              <Button 
                onClick={() => {
                  setShowFullTextDialog(false)
                  handleJumpToPlatform(fullTextContent, fullTextContent.type)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                跳转修改
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 跳转确认对话框 */}
      <Dialog open={showJumpConfirmDialog} onOpenChange={setShowJumpConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <span>跳转到平台页面</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {jumpTarget?.type === 'mqa' ? (
                  <FileText className="w-5 h-5 text-blue-600" />
                ) : (
                  <Edit className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-2">
                  {jumpTarget?.type === 'mqa' 
                    ? '即将跳转到MQA管理页面进行编辑修改。' 
                    : '即将跳转到内容库管理页面进行编辑修改。'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  确认要在新窗口中打开编辑页面吗？
                </p>
                {jumpTarget?.data && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {jumpTarget.type === 'mqa' 
                      ? `Question ID: ${jumpTarget.data.questionId}`
                      : `Document ID: ${jumpTarget.data.documentId}`
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowJumpConfirmDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmJump} className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              确认跳转
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" />
    </div>
  )
}