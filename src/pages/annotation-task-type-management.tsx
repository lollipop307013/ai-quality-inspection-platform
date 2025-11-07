import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Plus, Edit, Trash2, Copy, Settings, Tag, List, Save, X } from 'lucide-react'
import { toast } from 'sonner'

// 统计规则相关接口（预留功能，暂未实现）
// interface StatisticParameter {
//   id: string
//   field: string
//   source: 'annotation_data' | 'annotation_item'
//   sourceItem?: string // 选择的标注项目
//   unit: string
// }

// interface StatisticMetric {
//   id: string
//   name: string
//   formula: string
//   unit: string
//   format: 'decimal' | 'percentage'
//   decimalPlaces?: number
// }

// interface StatisticRule {
//   id: string
//   taskTypeId: string
//   parameters: StatisticParameter[]
//   metrics: StatisticMetric[]
//   createdAt: string
//   updatedAt: string
// }

// 标注任务类型数据结构
interface AnnotationTaskType {
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

// 预定义标注类型选项
const availablePredefinedTypes = {
  error_code: { name: '错误码标注', description: '标注AI回复中的错误类型' },
  message_scene: { name: '消息场景标注', description: '标注对话的场景类型' },
  dialogue_quality: { name: '对话质量标注', description: '评估对话整体质量' },
  sentiment_analysis: { name: '情感分析', description: '分析用户情感倾向' },
  intent_recognition: { name: '意图识别', description: '识别用户真实意图' },
  response_accuracy: { name: '回复准确性', description: '评估AI回复的准确程度' },
  service_attitude: { name: '服务态度', description: '评估客服服务态度' },
  professional_level: { name: '专业水平', description: '评估回复的专业程度' }
}

const AnnotationTaskTypeManagement: React.FC = () => {
  // 状态管理
  const [taskTypes, setTaskTypes] = useState<AnnotationTaskType[]>([
    {
      id: 'system_basic',
      name: '基础质检模板',
      description: '包含错误码、场景和质量评估的基础标注模板',
      category: 'system',
      predefinedTypes: ['error_code', 'message_scene', 'dialogue_quality'],
      customTypes: [],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      usageCount: 15
    },
    {
      id: 'system_advanced',
      name: '高级质检模板',
      description: '包含情感分析、意图识别等高级功能的标注模板',
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
  ])

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTaskType, setEditingTaskType] = useState<AnnotationTaskType | null>(null)
  const [newTaskType, setNewTaskType] = useState<Partial<AnnotationTaskType>>({
    name: '',
    description: '',
    category: 'custom',
    predefinedTypes: [],
    customTypes: []
  })

  // 统计规则配置相关状态（预留功能，暂未实现）
  // const [showStatisticRuleDialog, setShowStatisticRuleDialog] = useState(false)
  // const [currentTaskType, setCurrentTaskType] = useState<AnnotationTaskType | null>(null)
  // const [statisticRules, setStatisticRules] = useState<StatisticRule[]>([])
  // const [currentRule, setCurrentRule] = useState<StatisticRule>({
  //   id: '',
  //   taskTypeId: '',
  //   parameters: [],
  //   metrics: [],
  //   createdAt: '',
  //   updatedAt: ''
  // })
  // const [ruleStep, setRuleStep] = useState<'parameters' | 'metrics'>('parameters')

  // 参数配置（预留功能，暂未实现）
  // const [newParameter, setNewParameter] = useState<Partial<StatisticParameter>>({
  //   field: '',
  //   source: 'annotation_data',
  //   sourceItem: '',
  //   unit: ''
  // })

  // 指标配置（预留功能，暂未实现）
  // const [newMetric, setNewMetric] = useState<Partial<StatisticMetric>>({
  //   name: '',
  //   formula: '',
  //   unit: '',
  //   format: 'decimal',
  //   decimalPlaces: 2
  // })

  // 创建新的自定义标注项
  const [newCustomType, setNewCustomType] = useState({
    name: '',
    type: 'input' as 'input' | 'select' | 'textarea' | 'number',
    options: [''],
    required: false,
    description: ''
  })

  // 处理函数
  const handleCreateTaskType = () => {
    if (!newTaskType.name || !newTaskType.description) {
      toast.error('请填写完整的任务类型信息')
      return
    }

    const taskType: AnnotationTaskType = {
      id: `custom_${Date.now()}`,
      name: newTaskType.name!,
      description: newTaskType.description!,
      category: 'custom',
      predefinedTypes: newTaskType.predefinedTypes || [],
      customTypes: newTaskType.customTypes || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    }

    setTaskTypes(prev => [...prev, taskType])
    setNewTaskType({ name: '', description: '', category: 'custom', predefinedTypes: [], customTypes: [] })
    setShowCreateDialog(false)
    toast.success('标注任务类型创建成功')
  }

  const handleEditTaskType = (taskType: AnnotationTaskType) => {
    if (taskType.category === 'system') {
      toast.error('系统预设模板不可编辑')
      return
    }
    setEditingTaskType(taskType)
    setNewTaskType({ ...taskType })
    setShowCreateDialog(true)
  }

  const handleUpdateTaskType = () => {
    if (!editingTaskType || !newTaskType.name || !newTaskType.description) {
      toast.error('请填写完整的任务类型信息')
      return
    }

    setTaskTypes(prev => prev.map(type => 
      type.id === editingTaskType.id 
        ? { ...type, ...newTaskType, updatedAt: new Date().toISOString() }
        : type
    ))
    
    setEditingTaskType(null)
    setNewTaskType({ name: '', description: '', category: 'custom', predefinedTypes: [], customTypes: [] })
    setShowCreateDialog(false)
    toast.success('标注任务类型更新成功')
  }

  const handleDeleteTaskType = (id: string) => {
    const taskType = taskTypes.find(t => t.id === id)
    if (taskType?.category === 'system') {
      toast.error('系统预设模板不可删除')
      return
    }
    if (taskType?.usageCount && taskType.usageCount > 0) {
      toast.error('该类型正在使用中，无法删除')
      return
    }

    setTaskTypes(prev => prev.filter(type => type.id !== id))
    toast.success('标注任务类型删除成功')
  }

  const handleCopyTaskType = (taskType: AnnotationTaskType) => {
    const copiedTaskType: AnnotationTaskType = {
      ...taskType,
      id: `custom_${Date.now()}`,
      name: `${taskType.name} - 副本`,
      category: 'custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    }
    setTaskTypes(prev => [...prev, copiedTaskType])
    toast.success('类型复制成功')
  }

  const togglePredefinedType = (typeId: string) => {
    setNewTaskType(prev => ({
      ...prev,
      predefinedTypes: prev.predefinedTypes?.includes(typeId)
        ? prev.predefinedTypes.filter(id => id !== typeId)
        : [...(prev.predefinedTypes || []), typeId]
    }))
  }

  const addCustomType = () => {
    if (!newCustomType.name) {
      toast.error('请输入自定义标注项名称')
      return
    }

    const customType = {
      name: newCustomType.name,
      type: newCustomType.type,
      required: newCustomType.required,
      description: newCustomType.description,
      ...(newCustomType.type === 'select' && { 
        options: newCustomType.options.filter(opt => opt.trim() !== '') 
      })
    }

    setNewTaskType(prev => ({
      ...prev,
      customTypes: [...(prev.customTypes || []), customType]
    }))

    setNewCustomType({
      name: '',
      type: 'input',
      options: [''],
      required: false,
      description: ''
    })
    toast.success('自定义标注项添加成功')
  }

  const removeCustomType = (index: number) => {
    setNewTaskType(prev => ({
      ...prev,
      customTypes: prev.customTypes?.filter((_, i) => i !== index) || []
    }))
  }

  const addCustomTypeOption = () => {
    setNewCustomType(prev => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }

  const updateCustomTypeOption = (index: number, value: string) => {
    setNewCustomType(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }))
  }

  const removeCustomTypeOption = (index: number) => {
    setNewCustomType(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 页面标题区域 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="page-title text-gray-900">任务模板管理</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">管理标注任务模板配置，用于快速创建标准化的标注任务</p>
            </div>
            <div className="flex-shrink-0">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    创建任务模板
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTaskType ? '编辑任务模板' : '创建任务模板'}
                    </DialogTitle>
                    <DialogDescription>
                      配置任务模板的标注设置，包括预定义标注项和自定义标注项
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6 p-1">
                    {/* 基本信息 */}
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-sm font-medium">基本信息</h3>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            模板名称 *
                          </label>
                          <Input
                            value={newTaskType.name || ''}
                            onChange={(e) => setNewTaskType(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="请输入模板名称"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            模板描述 *
                          </label>
                          <Textarea
                            value={newTaskType.description || ''}
                            onChange={(e) => setNewTaskType(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="请输入模板描述"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    <Tabs defaultValue="predefined" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-auto">
                        <TabsTrigger value="predefined" className="text-xs sm:text-sm py-2">预定义标注项</TabsTrigger>
                        <TabsTrigger value="custom" className="text-xs sm:text-sm py-2">自定义标注项</TabsTrigger>
                      </TabsList>

                      {/* 预定义标注项 */}
                      <TabsContent value="predefined" className="space-y-3 sm:space-y-4">
                        <div>
                          <h4 className="text-sm sm:text-base font-medium mb-2 sm:mb-3">选择预定义标注项</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            {Object.entries(availablePredefinedTypes).map(([typeId, typeInfo]) => (
                              <div
                                key={typeId}
                                className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                                  newTaskType.predefinedTypes?.includes(typeId)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => togglePredefinedType(typeId)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-xs sm:text-sm truncate">{typeInfo.name}</h5>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{typeInfo.description}</p>
                                  </div>
                                  <div className={`w-4 h-4 rounded border-2 ${
                                    newTaskType.predefinedTypes?.includes(typeId)
                                      ? 'bg-blue-500 border-blue-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {newTaskType.predefinedTypes?.includes(typeId) && (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-sm"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      {/* 自定义标注项 */}
                      <TabsContent value="custom" className="space-y-4">
                        <div>
                          <h4 className="text-md font-medium mb-3">自定义标注项</h4>
                          
                          {/* 已添加的自定义标注项 */}
                          {newTaskType.customTypes && newTaskType.customTypes.length > 0 && (
                            <div className="space-y-2 mb-4">
                              {newTaskType.customTypes.map((customType, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <span className="font-medium text-sm">{customType.name}</span>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {customType.type}
                                    </Badge>
                                    {customType.required && (
                                      <Badge variant="destructive" className="ml-1 text-xs">必填</Badge>
                                    )}
                                    {customType.description && (
                                      <p className="text-xs text-gray-600 mt-1">{customType.description}</p>
                                    )}
                                    {customType.options && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        选项: {customType.options.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCustomType(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 添加新的自定义标注项 */}
                          <div className="border border-dashed border-gray-300 rounded-lg p-4">
                            <h5 className="font-medium text-sm mb-3">添加新的自定义标注项</h5>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    标注项名称 *
                                  </label>
                                  <Input
                                    value={newCustomType.name}
                                    onChange={(e) => setNewCustomType(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="请输入标注项名称"
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    输入类型
                                  </label>
                                  <select
                                    value={newCustomType.type}
                                    onChange={(e) => setNewCustomType(prev => ({ 
                                      ...prev, 
                                      type: e.target.value as any,
                                      options: e.target.value === 'select' ? [''] : []
                                    }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="input">文本输入</option>
                                    <option value="textarea">多行文本</option>
                                    <option value="number">数字输入</option>
                                    <option value="select">下拉选择</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  描述说明
                                </label>
                                <Input
                                  value={newCustomType.description}
                                  onChange={(e) => setNewCustomType(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="请输入标注项的描述说明"
                                  className="text-sm"
                                />
                              </div>

                              {/* 选择类型的选项配置 */}
                              {newCustomType.type === 'select' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    选项配置
                                  </label>
                                  <div className="space-y-2">
                                    {newCustomType.options.map((option, index) => (
                                      <div key={index} className="flex items-center space-x-2">
                                        <Input
                                          value={option}
                                          onChange={(e) => updateCustomTypeOption(index, e.target.value)}
                                          placeholder={`选项 ${index + 1}`}
                                          className="text-sm"
                                        />
                                        {newCustomType.options.length > 1 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeCustomTypeOption(index)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={addCustomTypeOption}
                                      className="text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      添加选项
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={newCustomType.required}
                                    onChange={(e) => setNewCustomType(prev => ({ ...prev, required: e.target.checked }))}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-xs text-gray-700">必填项</span>
                                </label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addCustomType}
                                  className="text-xs"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  添加标注项
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* 操作按钮 */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateDialog(false)
                          setEditingTaskType(null)
                          setNewTaskType({ name: '', description: '', category: 'custom', predefinedTypes: [], customTypes: [] })
                        }}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={editingTaskType ? handleUpdateTaskType : handleCreateTaskType}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {editingTaskType ? '更新' : '创建'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* 模板列表标题 */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-900">模板配置</h2>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* 任务类型列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {taskTypes.map((taskType) => (
              <Card key={taskType.id} className="hover:shadow-md transition-shadow h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg flex items-start flex-wrap gap-2">
                        <span className="truncate">{taskType.name}</span>
                        <Badge 
                          variant={taskType.category === 'system' ? 'default' : 'secondary'}
                          className="text-xs flex-shrink-0"
                        >
                          {taskType.category === 'system' ? '系统' : '自定义'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm line-clamp-2">
                        {taskType.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyTaskType(taskType)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {taskType.category === 'custom' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTaskType(taskType)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTaskType(taskType.id)}
                            className="text-red-600 hover:text-red-800"
                            disabled={taskType.usageCount > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {/* 预定义标注项 */}
                    {taskType.predefinedTypes.length > 0 && (
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 flex items-center">
                          <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          预定义标注项 ({taskType.predefinedTypes.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {taskType.predefinedTypes.map((typeId) => (
                            <Badge key={typeId} variant="outline" className="text-xs">
                              {availablePredefinedTypes[typeId as keyof typeof availablePredefinedTypes]?.name || typeId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 自定义标注项 */}
                    {taskType.customTypes.length > 0 && (
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 flex items-center">
                          <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          自定义标注项 ({taskType.customTypes.length})
                        </h4>
                        <div className="space-y-1">
                          {taskType.customTypes.map((customType, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-center justify-between gap-2">
                              <span className="truncate flex-1">{customType.name}</span>
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                <Badge variant="outline" className="text-xs">
                                  {customType.type}
                                </Badge>
                                {customType.required && (
                                  <Badge variant="destructive" className="text-xs">必填</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 使用统计 */}
                    <div className="pt-2 border-t border-gray-100 mt-auto">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs text-gray-500">
                        <span>使用次数: {taskType.usageCount}</span>
                        <span className="text-right">更新: {new Date(taskType.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {taskTypes.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <List className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">暂无任务模板</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">创建第一个任务模板</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建任务模板
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnnotationTaskTypeManagement