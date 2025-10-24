import React, { useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Settings, ExternalLink, BarChart3, Calculator, Target, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useGlobalStore } from '../store/globalStore'
import { useNavigate } from 'react-router-dom'

// 预定义的标注类型
const initialAnnotationTypes = [
  {
    id: 'error_code',
    name: '错误码标注',
    description: '对对话中的错误进行分类标注，使用#错误码格式',
    options: ['#12345', '#12346', '#12347', '#12348', '#12349', '#12350', '#12351', '#12352'],
    type: 'searchable_select',
    color: 'bg-red-100 text-red-800',
    isSystem: true,
    searchable: true
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

// 统计规则相关接口
interface StatisticParameter {
  id: string
  name: string // 参数名称
  field: string // 字段
  source: 'annotation_data' | 'annotation_item' // 数据来源
  sourceItem?: string // 选择的标注项目ID
  sourceItemValue?: string // 选择的标注项目中的具体值
  statisticMethod: 'distinct_count' | 'count' | 'max' | 'min' | 'avg' | 'sum' // 统计方式
  valueFilter: 'all' | 'custom' // 值筛选：全部或自定义
  customValues?: string[] // 自定义值列表（当valueFilter为custom时）
  unit: string
}

interface StatisticMetric {
  id: string
  name: string
  formula: string
  unit: string
  format: 'decimal' | 'percentage'
  decimalPlaces?: number
}

interface StatisticRule {
  id: string
  typeId: string
  parameters: StatisticParameter[]
  metrics: StatisticMetric[]
  createdAt: string
  updatedAt: string
}

type AnnotationType = {
  id: string;
  name: string;
  description: string;
  options: string[];
  type: 'select' | 'text';
  color: string;
  isSystem: boolean;
}

export default function AnnotationTypeManagement() {
  const navigate = useNavigate()
  const [annotationTypes, setAnnotationTypes] = useState<AnnotationType[]>(initialAnnotationTypes as AnnotationType[])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<AnnotationType | null>(null)
  const [isQualityStandardDialogOpen, setIsQualityStandardDialogOpen] = useState(false)
  const [newType, setNewType] = useState<Partial<AnnotationType>>({
    name: '',
    description: '',
    options: [],
    type: 'select',
    color: 'bg-gray-100 text-gray-800',
    isSystem: false
  })

  // 统计规则配置相关状态
  const [showStatisticRuleDialog, setShowStatisticRuleDialog] = useState(false)
  const [currentType, setCurrentType] = useState<AnnotationType | null>(null)
  const [statisticRules, setStatisticRules] = useState<StatisticRule[]>([])
  const [currentRule, setCurrentRule] = useState<StatisticRule>({
    id: '',
    typeId: '',
    parameters: [],
    metrics: [],
    createdAt: '',
    updatedAt: ''
  })
  const [ruleStep, setRuleStep] = useState<'parameters' | 'metrics'>('parameters')

  // 参数配置
  const [newParameter, setNewParameter] = useState<Partial<StatisticParameter>>({
    name: '',
    field: '',
    source: 'annotation_data',
    sourceItem: '',
    sourceItemValue: '',
    statisticMethod: 'distinct_count',
    valueFilter: 'all',
    customValues: [],
    unit: ''
  })

  // 指标配置
  const [newMetric, setNewMetric] = useState<Partial<StatisticMetric>>({
    name: '',
    formula: '',
    unit: '',
    format: 'decimal',
    decimalPlaces: 2
  })

  const addAnnotationType = () => {
    if (!newType.name || !newType.description) {
      toast.error('请填写完整的标注类型信息')
      return
    }

    const annotationType: AnnotationType = {
      id: `custom_${Date.now()}`,
      name: newType.name!,
      description: newType.description!,
      options: newType.options || [],
      type: newType.type || 'select',
      color: newType.color || 'bg-gray-100 text-gray-800',
      isSystem: false
    }

    setAnnotationTypes([...annotationTypes, annotationType])
    setNewType({
      name: '',
      description: '',
      options: [],
      type: 'select',
      color: 'bg-gray-100 text-gray-800',
      isSystem: false
    })
    setIsCreateDialogOpen(false)
    toast.success('标注类型创建成功')
  }

  const startEditType = (type: AnnotationType) => {
    // 如果是错误码标注，显示跳转提示
    if (type.id === 'error_code') {
      setIsQualityStandardDialogOpen(true)
      return
    }
    
    setEditingType({ ...type })
    setIsEditDialogOpen(true)
  }

  const saveEditType = () => {
    if (!editingType || !editingType.name || !editingType.description) {
      toast.error('请填写完整的标注类型信息')
      return
    }

    setAnnotationTypes(annotationTypes.map(type =>
      type.id === editingType.id ? editingType : type
    ))
    setEditingType(null)
    setIsEditDialogOpen(false)
    toast.success('标注类型更新成功')
  }

  const handleNavigateToQualityStandard = () => {
    setIsQualityStandardDialogOpen(false)
    // 这里可以根据实际的路由路径调整
    navigate('/quality-management-center')
    toast.info('正在跳转到质检标准配置页面')
  }

  const updateAnnotationType = (id: string, updates: Partial<AnnotationType>) => {
    setAnnotationTypes(annotationTypes.map(type =>
      type.id === id ? { ...type, ...updates } : type
    ))
    toast.success('标注类型更新成功')
  }

  const deleteAnnotationType = (id: string) => {
    const type = annotationTypes.find(t => t.id === id)
    if (type?.isSystem) {
      toast.error('系统预设类型不能删除')
      return
    }
    setAnnotationTypes(annotationTypes.filter(type => type.id !== id))
    toast.success('标注类型删除成功')
  }

  const addOption = (typeId: string, option: string) => {
    if (!option.trim()) return
    
    updateAnnotationType(typeId, {
      options: [...(annotationTypes.find(t => t.id === typeId)?.options || []), option.trim()]
    })
  }

  const removeOption = (typeId: string, optionIndex: number) => {
    const type = annotationTypes.find(t => t.id === typeId)
    if (!type) return
    
    const newOptions = type.options.filter((_, index) => index !== optionIndex)
    updateAnnotationType(typeId, { options: newOptions })
  }

  // 处理打开统计规则配置
  const handleOpenStatisticRule = (type: AnnotationType) => {
    setCurrentType(type)
    // 查找现有的统计规则
    const existingRule = statisticRules.find(rule => rule.typeId === type.id)
    if (existingRule) {
      setCurrentRule(existingRule)
    } else {
      // 创建新的统计规则
      setCurrentRule({
        id: `rule-${Date.now()}`,
        typeId: type.id,
        parameters: [],
        metrics: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    setRuleStep('parameters')
    setShowStatisticRuleDialog(true)
  }

  // 添加参数
  const handleAddParameter = () => {
    if (!newParameter.name || !newParameter.field || !newParameter.source || !newParameter.statisticMethod || !newParameter.valueFilter) return
    
    const parameter: StatisticParameter = {
      id: `param-${Date.now()}`,
      name: newParameter.name!,
      field: newParameter.field!,
      source: newParameter.source!,
      sourceItem: newParameter.sourceItem || '',
      sourceItemValue: newParameter.sourceItemValue || '',
      statisticMethod: newParameter.statisticMethod!,
      valueFilter: newParameter.valueFilter!,
      customValues: newParameter.customValues || [],
      unit: newParameter.unit || ''
    }
    
    setCurrentRule(prev => ({
      ...prev,
      parameters: [...prev.parameters, parameter]
    }))
    
    setNewParameter({
      name: '',
      field: '',
      source: 'annotation_data',
      sourceItem: '',
      sourceItemValue: '',
      statisticMethod: 'distinct_count',
      valueFilter: 'all',
      customValues: [],
      unit: ''
    })
  }

  // 删除参数
  const handleDeleteParameter = (id: string) => {
    setCurrentRule(prev => ({
      ...prev,
      parameters: prev.parameters.filter(p => p.id !== id)
    }))
  }

  // 添加指标
  const handleAddMetric = () => {
    if (!newMetric.name || !newMetric.formula) return
    
    const metric: StatisticMetric = {
      id: `metric-${Date.now()}`,
      name: newMetric.name!,
      formula: newMetric.formula!,
      unit: newMetric.unit || '',
      format: newMetric.format!,
      decimalPlaces: newMetric.decimalPlaces
    }
    
    setCurrentRule(prev => ({
      ...prev,
      metrics: [...prev.metrics, metric]
    }))
    
    setNewMetric({
      name: '',
      formula: '',
      unit: '',
      format: 'decimal',
      decimalPlaces: 2
    })
  }

  // 删除指标
  const handleDeleteMetric = (id: string) => {
    setCurrentRule(prev => ({
      ...prev,
      metrics: prev.metrics.filter(m => m.id !== id)
    }))
  }

  // 保存统计规则
  const handleSaveStatisticRule = () => {
    setStatisticRules(prev => {
      const existingIndex = prev.findIndex(rule => rule.typeId === currentRule.typeId)
      if (existingIndex >= 0) {
        // 更新现有规则
        const updated = [...prev]
        updated[existingIndex] = { ...currentRule, updatedAt: new Date().toISOString() }
        return updated
      } else {
        // 添加新规则
        return [...prev, currentRule]
      }
    })
    setShowStatisticRuleDialog(false)
    toast.success('统计规则保存成功')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">标注类型管理</h1>
          <p className="text-gray-600 mt-1">管理标注任务的类型配置</p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">标注类型配置</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  添加标注类型
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>创建标注类型</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">类型名称</Label>
                    <Input
                      id="name"
                      value={newType.name || ''}
                      onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                      placeholder="输入标注类型名称"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">描述</Label>
                    <Textarea
                      id="description"
                      value={newType.description || ''}
                      onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                      placeholder="输入标注类型描述"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">输入类型</Label>
                    <select
                      id="type"
                      value={newType.type || 'select'}
                      onChange={(e) => setNewType({ ...newType, type: e.target.value as 'select' | 'text' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="select">选择框</option>
                      <option value="text">文本输入</option>
                    </select>
                  </div>
                  {newType.type === 'select' && (
                    <div className="space-y-2">
                      <Label>选项配置</Label>
                      <div className="space-y-2">
                        {(newType.options || []).map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input value={option} readOnly />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = [...(newType.options || [])]
                                newOptions.splice(index, 1)
                                setNewType({ ...newType, options: newOptions })
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="输入新选项"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = (e.target as HTMLInputElement).value.trim()
                                if (value) {
                                  setNewType({
                                    ...newType,
                                    options: [...(newType.options || []), value]
                                  });
                                  (e.target as HTMLInputElement).value = ''
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                              const value = input?.value.trim()
                              if (value) {
                                setNewType({
                                  ...newType,
                                  options: [...(newType.options || []), value]
                                })
                                input.value = ''
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={addAnnotationType}>
                      创建
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {annotationTypes.map((type) => (
              <Card key={type.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={type.color}>
                        {type.isSystem ? '系统' : '自定义'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenStatisticRule(type)}
                        className="text-green-600 hover:text-green-800"
                        title="统计规则配置"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditType(type)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!type.isSystem && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAnnotationType(type.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">输入类型：</span>
                      <Badge variant="outline" className="ml-2">
                        {type.type === 'select' ? '选择框' : '文本输入'}
                      </Badge>
                    </div>
                    {type.type === 'select' && type.options.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">选项：</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {type.options.map((option, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 编辑标注类型对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑标注类型</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">类型名称</Label>
              <Input
                id="edit-name"
                value={editingType?.name || ''}
                onChange={(e) => setEditingType(prev => prev ? {...prev, name: e.target.value} : null)}
                placeholder="输入标注类型名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={editingType?.description || ''}
                onChange={(e) => setEditingType(prev => prev ? {...prev, description: e.target.value} : null)}
                placeholder="输入标注类型描述"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">输入类型</Label>
              <select
                id="edit-type"
                value={editingType?.type || 'select'}
                onChange={(e) => setEditingType(prev => prev ? {...prev, type: e.target.value as 'select' | 'text'} : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="select">选择框</option>
                <option value="text">文本输入</option>
              </select>
            </div>
            {editingType?.type === 'select' && (
              <div className="space-y-2">
                <Label>选项配置</Label>
                <div className="space-y-2">
                  {(editingType.options || []).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input 
                        value={option} 
                        onChange={(e) => {
                          const newOptions = [...(editingType.options || [])]
                          newOptions[index] = e.target.value
                          setEditingType(prev => prev ? {...prev, options: newOptions} : null)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOptions = [...(editingType.options || [])]
                          newOptions.splice(index, 1)
                          setEditingType(prev => prev ? {...prev, options: newOptions} : null)
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="输入新选项"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim()
                          if (value && editingType) {
                            setEditingType({
                              ...editingType,
                              options: [...(editingType.options || []), value]
                            });
                            (e.target as HTMLInputElement).value = ''
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                        const value = input?.value.trim()
                        if (value && editingType) {
                          setEditingType({
                            ...editingType,
                            options: [...(editingType.options || []), value]
                          })
                          input.value = ''
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={saveEditType}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 错误码标注跳转确认对话框 */}
      <Dialog open={isQualityStandardDialogOpen} onOpenChange={setIsQualityStandardDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>跳转到质检标准配置</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start space-x-3">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  错误码标注需要在质检标准配置页面进行管理。
                </p>
                <p className="text-sm text-gray-600">
                  是否跳转到质检标准配置页面进行编辑？
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsQualityStandardDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleNavigateToQualityStandard} className="bg-blue-600 hover:bg-blue-700">
              确认跳转
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 统计规则配置弹窗 */}
      <Dialog open={showStatisticRuleDialog} onOpenChange={setShowStatisticRuleDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              统计规则配置 - {currentType?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 步骤导航 */}
            <div className="flex items-center space-x-4 border-b pb-4">
              <Button
                variant={ruleStep === 'parameters' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRuleStep('parameters')}
                className={ruleStep === 'parameters' ? '' : 'text-gray-600'}
              >
                <Database className="w-4 h-4 mr-2" />
                1. 参数配置
              </Button>
              <div className="w-8 h-px bg-gray-300"></div>
              <Button
                variant={ruleStep === 'metrics' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRuleStep('metrics')}
                className={ruleStep === 'metrics' ? '' : 'text-gray-600'}
              >
                <Target className="w-4 h-4 mr-2" />
                2. 指标配置
              </Button>
            </div>

            {/* 参数配置步骤 */}
            {ruleStep === 'parameters' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">参数配置</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    定义统计计算所需的参数，这些参数将用于后续的指标计算公式中
                  </p>

                  {/* 已配置的参数列表 */}
                  {currentRule.parameters.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium mb-3">已配置参数</h4>
                      <div className="space-y-2">
                        {currentRule.parameters.map((param) => (
                          <div key={param.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div>
                                <span className="font-medium text-sm">{param.name}</span>
                                <span className="text-xs text-gray-600 ml-2">({param.field})</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {param.source === 'annotation_data' ? '标注数据' : '标注项目'}
                                </Badge>
                                <Badge variant="secondary" className="ml-1 text-xs">
                                  {param.statisticMethod === 'distinct_count' ? '去重计数' : 
                                   param.statisticMethod === 'count' ? '计数' :
                                   param.statisticMethod === 'max' ? '最大值' :
                                   param.statisticMethod === 'min' ? '最小值' :
                                   param.statisticMethod === 'avg' ? '平均值' : '求和'}
                                </Badge>
                                {param.sourceItem && (
                                  <span className="text-xs text-gray-600 ml-2">
                                    -{annotationTypes.find(type => type.id === param.sourceItem)?.name}
                                    {param.sourceItemValue && (
                                      <span className="text-blue-600">({param.sourceItemValue})</span>
                                    )}
                                  </span>
                                )}
                                {param.valueFilter === 'custom' && param.customValues && (
                                  <span className="text-xs text-blue-600 ml-2">筛选: {param.customValues.join(', ')}</span>
                                )}
                              </div>
                              {param.unit && (
                                <Badge variant="secondary" className="text-xs">
                                  {param.unit}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteParameter(param.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 添加新参数 */}
                  <div className="border border-dashed border-gray-300 rounded-lg p-4">
                    <h4 className="text-md font-medium mb-3">添加新参数</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* 第一行：基础信息 */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-1">
                          参数名称 *
                        </Label>
                        <Input
                          value={newParameter.name || ''}
                          onChange={(e) => setNewParameter(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="如：人工回复数量"
                          className="text-sm h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-1">
                          字段 *
                        </Label>
                        <Input
                          value={newParameter.field || ''}
                          onChange={(e) => setNewParameter(prev => ({ ...prev, field: e.target.value }))}
                          placeholder="如：openid、reply_type"
                          className="text-sm h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-1">
                          数据来源 *
                        </Label>
                        <select
                          value={newParameter.source}
                          onChange={(e) => setNewParameter(prev => ({ 
                            ...prev, 
                            source: e.target.value as 'annotation_data' | 'annotation_item',
                            sourceItem: '', // 重置标注项目选择
                            sourceItemValue: '' // 重置具体值选择
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                        >
                          <option value="annotation_data">标注数据</option>
                          <option value="annotation_item">标注项目类别</option>
                        </select>
                      </div>
                      
                      {/* 标注项目选择 */}
                      {newParameter.source === 'annotation_item' ? (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">
                            选择标注项目 *
                          </Label>
                          <select
                            value={newParameter.sourceItem || ''}
                            onChange={(e) => setNewParameter(prev => ({ 
                              ...prev, 
                              sourceItem: e.target.value,
                              sourceItemValue: '' // 重置具体值选择
                            }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                          >
                            <option value="">请选择标注项目</option>
                            {annotationTypes.map((type) => (
                              <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div></div>
                      )}
                      
                      {/* 第二行：统计配置 */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-1">
                          统计方式 *
                        </Label>
                        <select
                          value={newParameter.statisticMethod}
                          onChange={(e) => setNewParameter(prev => ({ 
                            ...prev, 
                            statisticMethod: e.target.value as StatisticParameter['statisticMethod']
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                        >
                          <option value="distinct_count">去重计数</option>
                          <option value="count">计数</option>
                          <option value="max">最大值</option>
                          <option value="min">最小值</option>
                          <option value="avg">平均值</option>
                          <option value="sum">求和</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-1">
                          值筛选 *
                        </Label>
                        <select
                          value={newParameter.valueFilter}
                          onChange={(e) => setNewParameter(prev => ({ 
                            ...prev, 
                            valueFilter: e.target.value as 'all' | 'custom'
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                        >
                          <option value="all">全部值</option>
                          <option value="custom">自定义值</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-1">
                          单位
                        </Label>
                        <Input
                          value={newParameter.unit || ''}
                          onChange={(e) => setNewParameter(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="如：个、次、分"
                          className="text-sm h-10"
                        />
                      </div>
                    </div>
                    
                    {/* 第二行：预设值和自定义值配置 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {newParameter.source === 'annotation_item' && newParameter.sourceItem && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">
                            选择预设值
                          </Label>
                          <select
                            value={newParameter.sourceItemValue || ''}
                            onChange={(e) => setNewParameter(prev => ({ ...prev, sourceItemValue: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                          >
                            <option value="">全部值</option>
                            {annotationTypes.find(type => type.id === newParameter.sourceItem)?.options?.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {newParameter.valueFilter === 'custom' && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">
                            自定义值 (用分号分隔)
                          </Label>
                          <Input
                            value={newParameter.customValues?.join(';') || ''}
                            onChange={(e) => setNewParameter(prev => ({ 
                              ...prev, 
                              customValues: e.target.value.split(';').filter(v => v.trim()) 
                            }))}
                            placeholder="如：人工回复;智能回复"
                            className="text-sm h-10"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            多个值请用分号分隔，如：人工回复;智能回复
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddParameter}
                        disabled={!newParameter.name || !newParameter.field || !newParameter.source || !newParameter.statisticMethod || !newParameter.valueFilter}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        添加参数
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 指标配置步骤 */}
            {ruleStep === 'metrics' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">指标配置</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    基于已定义的参数创建统计指标，设置计算公式和显示格式
                  </p>

                  {/* 可用参数提示 */}
                  {currentRule.parameters.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">可用参数：</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentRule.parameters.map((param) => (
                          <Badge key={param.id} variant="outline" className="text-xs text-blue-700 border-blue-300">
                            {param.name}
                            <span className="text-blue-500 ml-1">({param.field})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 已配置的指标列表 */}
                  {currentRule.metrics.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium mb-3">已配置指标</h4>
                      <div className="space-y-2">
                        {currentRule.metrics.map((metric) => (
                          <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div>
                                <span className="font-medium text-sm">{metric.name}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {metric.format === 'percentage' ? '百分比' : '小数'}
                                </Badge>
                                {metric.unit && (
                                  <Badge variant="secondary" className="ml-1 text-xs">
                                    {metric.unit}
                                  </Badge>
                                )}
                                <p className="text-xs text-gray-600 mt-1">公式: {metric.formula}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMetric(metric.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 添加新指标 */}
                  <div className="border border-dashed border-gray-300 rounded-lg p-4">
                    <h4 className="text-md font-medium mb-3">添加新指标</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">
                            指标名称 *
                          </Label>
                          <Input
                            value={newMetric.name || ''}
                            onChange={(e) => setNewMetric(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="如：高风险率"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">
                            单位
                          </Label>
                          <Input
                            value={newMetric.unit || ''}
                            onChange={(e) => setNewMetric(prev => ({ ...prev, unit: e.target.value }))}
                            placeholder="如：%、分、个"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-1">
                          计算公式 *
                        </Label>
                        <Input
                          value={newMetric.formula || ''}
                          onChange={(e) => setNewMetric(prev => ({ ...prev, formula: e.target.value }))}
                          placeholder="如：高风险数量 / 总数量 * 100"
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          使用已定义的参数名称构建公式，支持基本数学运算（+、-、*、/）
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">
                            数据格式
                          </Label>
                          <select
                            value={newMetric.format}
                            onChange={(e) => setNewMetric(prev => ({ 
                              ...prev, 
                              format: e.target.value as 'decimal' | 'percentage' 
                            }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="decimal">小数</option>
                            <option value="percentage">百分比</option>
                          </select>
                        </div>
                        {newMetric.format === 'decimal' && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1">
                              小数位数
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={newMetric.decimalPlaces || 2}
                              onChange={(e) => setNewMetric(prev => ({ 
                                ...prev, 
                                decimalPlaces: parseInt(e.target.value) || 2 
                              }))}
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddMetric}
                        disabled={!newMetric.name || !newMetric.formula}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        添加指标
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex space-x-2">
                {ruleStep === 'metrics' && (
                  <Button
                    variant="outline"
                    onClick={() => setRuleStep('parameters')}
                  >
                    上一步
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStatisticRuleDialog(false)}
                >
                  取消
                </Button>
                {ruleStep === 'parameters' ? (
                  <Button
                    onClick={() => setRuleStep('metrics')}
                    disabled={currentRule.parameters.length === 0}
                  >
                    下一步
                  </Button>
                ) : (
                  <Button
                    onClick={handleSaveStatisticRule}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={currentRule.metrics.length === 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存规则
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}