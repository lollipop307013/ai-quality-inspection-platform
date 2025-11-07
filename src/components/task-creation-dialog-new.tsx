import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { CalendarIcon, Plus, Settings, CheckCircle, AlertCircle, X } from 'lucide-react'
import { format } from 'date-fns'

// 简单的 className 合并函数
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

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

  // Step1：任务基本信息
  const [taskName, setTaskName] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [dataType, setDataType] = useState<'dialogue'>('dialogue') // 一期仅支持对话质检
  
  // Step2：标注项配置
  const [selectedAnnotationTypes, setSelectedAnnotationTypes] = useState<string[]>([])
  
  // Step3：数据来源配置
  const [executionType, setExecutionType] = useState<'single' | 'periodic'>('single')
  const [dataSource, setDataSource] = useState<'online' | 'import'>('online')
  
  // 数据来源配置
  const [onlineConfig, setOnlineConfig] = useState({
    database: '', // 数据库选择
    dataSources: [] as Array<{ channel: string; gameId: string }>, // 数据组合
    taskQuantity: 0, // 会话数量（选填）
  })
  
  // 周期任务配置
  const [periodicConfig, setPeriodicConfig] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    scheduleType: 'daily' as 'daily' | 'weekly', // 节点类型：每天或每周
    selectedWeekdays: [] as number[], // 选中的星期几（周日=0, 周一=1, ...）
    weekdayDataRanges: {} as Record<number, number>, // 每个星期几的数据范围配置（默认1天）
    executionTime: '23:59'
  })
  
  // 单次任务时间范围
  const [singleTimeRange, setSingleTimeRange] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined
  })
  
  // Step4：任务分配
  const [assignmentConfig, setAssignmentConfig] = useState({
    annotationType: 'cross' as 'cross' | 'distributed',
    allocationMethod: 'quota' as 'quota' | 'average',
    annotators: [] as string[],
    quotaConfig: {} as Record<string, number>
  })

  // 模拟数据
  const databaseOptions = [
    { id: 'quality_inspection_message_table', name: '质检消息表' }
  ]

  const channelOptions = [
    { id: 'enterprise_wechat', name: '企业微信渠道' },
    { id: 'qq_channel', name: 'QQ甄选渠道' },
    { id: 'game_sdk', name: '游戏内SDK渠道' },
    { id: 'mini_program', name: '小程序渠道' }
  ]

  const gameOptions = [
    { id: '1197', name: '【SDK3】火影忍者-手游 (and 火影忍者公众号)' },
    { id: '1180', name: '拳皇98终极之战OL(1180)' },
    { id: '1187', name: '英雄杀（手游）(1187)' },
    { id: '1191', name: '王者荣耀(1191)' },
    { id: '1194', name: 'CFM 穿越火线手游(1194)' },
    { id: '1211', name: '御龙在天手游(1211)' },
    { id: '1217', name: '新剑侠情缘(1217)' },
    { id: '1243', name: '【H5】魂斗罗:归来(1243)' }
  ]

  const availableAnnotationTypes = [
    {
      id: 'error_code',
      name: '错误码标注',
      description: '基于质检标准配置中的错误码进行标注',
      color: 'bg-red-100 text-red-800'
    }
  ]

  const annotatorOptions = [
    { id: 'user1', name: '张三', role: '高级质检员', workload: 85 },
    { id: 'user2', name: '李四', role: '质检员', workload: 72 },
    { id: 'user3', name: '王五', role: '质检员', workload: 68 },
    { id: 'user4', name: '赵六', role: '初级质检员', workload: 45 }
  ]

  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  // 步骤配置
  const steps = [
    { id: 'basic', title: '选择数据类型', description: '选择数据类型，填写描述' },
    { id: 'annotation-types', title: '选择标注项', description: '一期仅提供错误码标注类别' },
    { id: 'data-source', title: '选择数据来源', description: '数据库导入或手动导入' },
    { id: 'assignment', title: '人员分配', description: '标注人员选择和分配方式' },
    { id: 'preview', title: '最终预览', description: '确认任务配置信息' }
  ]

  // 处理函数
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
      case 0: // Step1：选择数据类型，填写描述
        return taskName.trim() !== '' && dataType !== ''
      case 1: // Step2：选择标注项
        return selectedAnnotationTypes.length > 0
      case 2: // Step3：选择数据来源
        if (dataSource === 'online') {
          // 必须选择数据库
          if (!onlineConfig.database) return false
          // 至少需要一个数据源组合
          if (onlineConfig.dataSources.length === 0) return false
          // 验证每个数据源的渠道和游戏ID都已填写
          if (onlineConfig.dataSources.some(ds => !ds.channel || !ds.gameId)) return false
          
          if (executionType === 'single') {
            return singleTimeRange.startDate && singleTimeRange.endDate
          }
          if (executionType === 'periodic') {
            // 周期任务验证
            if (!periodicConfig.startDate || !periodicConfig.endDate) return false
            if (periodicConfig.scheduleType === 'daily') {
              return true // 每天不需要额外配置
            }
            if (periodicConfig.scheduleType === 'weekly') {
              return periodicConfig.selectedWeekdays.length > 0 // 至少选择一个星期几
            }
            return true
          }
          return true
        } else {
          // 手动导入暂不支持（一期）
          return false
        }
      case 3: // Step4：人员分配
        return assignmentConfig.annotators.length > 0
      case 4: // Step5：最终预览
        return true
      default:
        return true
    }
  }

  const handleAnnotationTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setSelectedAnnotationTypes([...selectedAnnotationTypes, typeId])
    } else {
      setSelectedAnnotationTypes(selectedAnnotationTypes.filter(id => id !== typeId))
    }
  }

  const handleAnnotatorChange = (annotatorId: string, checked: boolean) => {
    if (checked) {
      setAssignmentConfig({
        ...assignmentConfig,
        annotators: [...assignmentConfig.annotators, annotatorId]
      })
    } else {
      setAssignmentConfig({
        ...assignmentConfig,
        annotators: assignmentConfig.annotators.filter(id => id !== annotatorId)
      })
    }
  }

  // 计算某个星期几可以配置的最大数据范围（单向回溯，避免重叠）
  const getMaxDataRangeForWeekday = (weekday: number) => {
    const sortedWeekdays = [...periodicConfig.selectedWeekdays].sort((a, b) => a - b)
    const currentIndex = sortedWeekdays.indexOf(weekday)
    
    if (currentIndex === -1) return 7 // 未选中的情况
    
    if (currentIndex === 0) {
      // 第一个节点，需要计算到前一周最后一个节点的距离
      const lastWeekday = sortedWeekdays[sortedWeekdays.length - 1]
      const distance = (weekday - lastWeekday + 7) % 7
      return distance === 0 ? 7 : distance
    } else {
      // 其他节点，计算到前一个节点的距离
      const prevWeekday = sortedWeekdays[currentIndex - 1]
      const distance = (weekday - prevWeekday + 7) % 7
      return distance === 0 ? 7 : distance
    }
  }

  // 切换星期几的选中状态
  const toggleWeekday = (weekday: number) => {
    const newSelectedWeekdays = periodicConfig.selectedWeekdays.includes(weekday)
      ? periodicConfig.selectedWeekdays.filter(w => w !== weekday)
      : [...periodicConfig.selectedWeekdays, weekday].sort((a, b) => a - b)
    
    // 如果取消选中，清除该星期几的数据范围配置
    const newWeekdayDataRanges = { ...periodicConfig.weekdayDataRanges }
    if (!newSelectedWeekdays.includes(weekday)) {
      delete newWeekdayDataRanges[weekday]
    } else if (!newWeekdayDataRanges[weekday]) {
      // 新选中的星期几，默认1天
      newWeekdayDataRanges[weekday] = 1
    }
    
    setPeriodicConfig({
      ...periodicConfig,
      selectedWeekdays: newSelectedWeekdays,
      weekdayDataRanges: newWeekdayDataRanges
    })
  }

  // 更新某个星期几的数据范围
  const updateWeekdayDataRange = (weekday: number, days: number) => {
    setPeriodicConfig({
      ...periodicConfig,
      weekdayDataRanges: {
        ...periodicConfig.weekdayDataRanges,
        [weekday]: days
      }
    })
  }

  const addDataSource = () => {
    setOnlineConfig({
      ...onlineConfig,
      dataSources: [...onlineConfig.dataSources, { channel: '', gameId: '' }]
    })
  }

  const removeDataSource = (index: number) => {
    const newSources = onlineConfig.dataSources.filter((_, i) => i !== index)
    setOnlineConfig({ ...onlineConfig, dataSources: newSources })
  }

  const updateDataSource = (index: number, field: 'channel' | 'gameId', value: string) => {
    const newSources = [...onlineConfig.dataSources]
    newSources[index][field] = value
    setOnlineConfig({ ...onlineConfig, dataSources: newSources })
  }

  const generateConfigPreview = () => {
    let description = ""
    
    if (taskName) {
      description += `将创建名为"${taskName}"的质检任务`
    } else {
      description += "将创建一个新的标注任务"
    }
    
    if (executionType === 'single') {
      description += "，单次执行"
    } else if (executionType === 'periodic') {
      description += "，周期执行"
    }
    
    if (selectedAnnotationTypes.length > 0) {
      const typeNames = selectedAnnotationTypes.map(typeId => {
        const type = availableAnnotationTypes.find(t => t.id === typeId)
        return type?.name
      }).filter(Boolean).join('、')
      description += `。将进行${typeNames}等标注`
    }
    
    if (dataSource === 'online' && onlineConfig.dataSources.length > 0) {
      description += `。数据来源：${onlineConfig.dataSources.length}组数据源组合`
      if (onlineConfig.taskQuantity && onlineConfig.taskQuantity > 0) {
        description += `，共${onlineConfig.taskQuantity}条会话`
      }
    }
    
    if (assignmentConfig.annotators.length > 0) {
      description += `。分配给${assignmentConfig.annotators.length}位标注员`
      if (assignmentConfig.annotationType === 'cross') {
        description += "进行交叉标注"
      } else {
        description += "进行分散标注"
      }
    }
    
    if (taskDescription) {
      description += `。任务要求：${taskDescription}`
    }
    
    if (description && !description.endsWith('。')) {
      description += "。"
    }
    
    return description || "您的所有配置将在此处生成预览"
  }

  const handleSubmit = () => {
    const taskQuantity = onlineConfig.taskQuantity || 100
    
    const newTask = {
      id: Date.now(),
      name: taskName,
      description: taskDescription || `这是一个${executionType === 'periodic' ? '周期性' : '单次'}质检任务`,
      status: 'pending',
      totalCount: taskQuantity,
      completedCount: 0,
      errorRate: '0.0',
      similarity: '100.0',
      annotators: assignmentConfig.annotators.map(id => {
        const annotator = annotatorOptions.find(a => a.id === id)
        return {
          name: annotator?.name || id,
          assigned: Math.floor(taskQuantity / assignmentConfig.annotators.length),
          completed: 0
        }
      }),
      createdAt: new Date().toLocaleDateString(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      taskType: executionType,
      config: {
        dataType,
        executionType,
        dataSource,
        onlineConfig,
        periodicConfig,
        singleTimeRange,
        selectedAnnotationTypes,
        assignmentConfig
      }
    }
    
    console.log('创建任务:', newTask)
    
    if (onTaskCreated) {
      onTaskCreated(newTask)
    }
    
    setOpen(false)
    
    // 重置表单
    resetForm()
  }

  const resetForm = () => {
    setCurrentStep(0)
    setTaskName('')
    setTaskDescription('')
    setDataType('dialogue')
    setExecutionType('single')
    setDataSource('online')
    setOnlineConfig({
      database: '',
      dataSources: [],
      taskQuantity: 0
    })
    setPeriodicConfig({
      startDate: undefined,
      endDate: undefined,
      scheduleType: 'daily',
      selectedWeekdays: [],
      weekdayDataRanges: {},
      executionTime: '23:59'
    })
    setSingleTimeRange({
      startDate: undefined,
      endDate: undefined
    })
    setSelectedAnnotationTypes([])
    setAssignmentConfig({
      annotationType: 'cross',
      allocationMethod: 'quota',
      annotators: [],
      quotaConfig: {}
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium flex items-center">
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
          {/* Step1：选择数据类型，填写描述 */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Step1：选择数据类型，填写描述</CardTitle>
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
                  </div>

                  <div>
                    <Label>数据类型 *</Label>
                    <Select value={dataType} onValueChange={(value: 'dialogue') => setDataType(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="选择数据类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dialogue">对话标注</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      *一期仅支持对话标注
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="task-description">任务描述（选填）</Label>
                    <Textarea
                      id="task-description"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="请描述任务的具体要求和目标（可选）"
                      rows={3}
                    />
                  </div>
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

          {/* Step2：选择标注项 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Step2：选择标注项</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>标注项选择 *</Label>
                    <p className="text-sm text-gray-600 mt-1 mb-4">
                      一期仅提供错误码标注类别，后续支持任务模板快速配置
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableAnnotationTypes.map((type) => (
                        <div 
                          key={type.id} 
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            selectedAnnotationTypes.includes(type.id) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleAnnotationTypeChange(type.id, !selectedAnnotationTypes.includes(type.id))}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={selectedAnnotationTypes.includes(type.id)}
                                  onChange={() => {}} // 由父级div的onClick处理
                                />
                                <h4 className="font-medium text-gray-900">{type.name}</h4>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">{type.description}</p>
                            </div>
                            
                            {selectedAnnotationTypes.includes(type.id) && (
                              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedAnnotationTypes.length === 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                          <span className="text-sm text-amber-800">
                            请至少选择一种标注类型
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
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

          {/* Step3：选择数据来源 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Step3：选择数据来源</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>数据来源 *</Label>
                    <RadioGroup 
                      value={dataSource} 
                      onValueChange={(value: 'online' | 'import') => setDataSource(value)}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online">数据库导入</Label>
                      </div>
                      <div className="flex items-center space-x-2 opacity-50">
                        <RadioGroupItem value="import" id="import" disabled />
                        <Label htmlFor="import">手动导入（一期不做）</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 数据库导入配置 */}
                  {dataSource === 'online' && dataType === 'dialogue' && (
                    <Card className="border-blue-200 bg-blue-50/30">
                      <CardHeader>
                        <CardTitle className="text-base">数据库导入配置</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 选择数据库 */}
                        <div>
                          <Label>选择数据库 *</Label>
                          <Select 
                            value={onlineConfig.database} 
                            onValueChange={(value) => setOnlineConfig({...onlineConfig, database: value})}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="选择数据库" />
                            </SelectTrigger>
                            <SelectContent>
                              {databaseOptions.map(db => (
                                <SelectItem key={db.id} value={db.id}>{db.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-500 mt-1">
                            一期仅提供质检消息表
                          </p>
                        </div>

                        {/* 数据源列表 */}
                        {onlineConfig.database && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>数据源配置（渠道 + 游戏ID组合）*</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addDataSource}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                添加数据源
                              </Button>
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-3">
                              支持多组来源合并生成同一份数据（不论先后顺序）
                            </p>
                            
                            {onlineConfig.dataSources.length === 0 && (
                              <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                                请点击"添加数据源"按钮添加至少一个渠道+游戏ID组合
                              </div>
                            )}

                            {onlineConfig.dataSources.map((source, index) => (
                              <div key={index} className="flex items-center gap-2 mb-2">
                                <Select 
                                  value={source.channel} 
                                  onValueChange={(value) => updateDataSource(index, 'channel', value)}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="选择渠道" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {channelOptions.map(channel => (
                                      <SelectItem key={channel.id} value={channel.id}>{channel.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <span className="text-gray-500">+</span>

                                <Select 
                                  value={source.gameId} 
                                  onValueChange={(value) => updateDataSource(index, 'gameId', value)}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="选择游戏ID" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gameOptions.map(game => (
                                      <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDataSource(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 任务创建方式 */}
                        <div>
                          <Label>任务创建方式 *</Label>
                          <RadioGroup 
                            value={executionType} 
                            onValueChange={(value: 'single' | 'periodic') => setExecutionType(value)}
                            className="flex space-x-4 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="single" id="single-exec" />
                              <Label htmlFor="single-exec">单次任务</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="periodic" id="periodic-exec" />
                              <Label htmlFor="periodic-exec">周期任务</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* 单次任务时间范围 */}
                        {executionType === 'single' && (
                          <div>
                            <Label>数据时间范围 *</Label>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                <Label className="text-sm">起始日期</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal mt-1",
                                        !singleTimeRange.startDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {singleTimeRange.startDate ? 
                                        format(singleTimeRange.startDate, "yyyy-MM-dd") : 
                                        "选择起始日期"
                                      }
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={singleTimeRange.startDate}
                                      onSelect={(date) => setSingleTimeRange({
                                        ...singleTimeRange,
                                        startDate: date
                                      })}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              
                              <div>
                                <Label className="text-sm">结束日期</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal mt-1",
                                        !singleTimeRange.endDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {singleTimeRange.endDate ? 
                                        format(singleTimeRange.endDate, "yyyy-MM-dd") : 
                                        "选择结束日期"
                                      }
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={singleTimeRange.endDate}
                                      onSelect={(date) => setSingleTimeRange({
                                        ...singleTimeRange,
                                        endDate: date
                                      })}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              支持同一天起止
                            </p>
                          </div>
                        )}

                        {/* 周期任务配置 */}
                        {executionType === 'periodic' && (
                          <div className="space-y-4">
                            <div>
                              <Label>周期范围 *</Label>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <Label className="text-sm">起始日期</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal mt-1",
                                          !periodicConfig.startDate && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {periodicConfig.startDate ? format(periodicConfig.startDate, "yyyy-MM-dd") : "选择起始日期"}
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
                                  <Label className="text-sm">结束日期</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal mt-1",
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
                            </div>

                            <div>
                              <Label>生成节点配置 *</Label>
                              <p className="text-sm text-gray-500 mt-1 mb-3">
                                先选择节点类型，如果选择"每周"则需要选择在哪几天跑任务，然后为每个节点配置向前获取几天的数据（默认1天，避免数据重叠）
                              </p>
                              
                              {/* 步骤1：选择节点类型 */}
                              <Card className="border-gray-300 bg-gray-50/50 mb-3">
                                <CardContent className="pt-4 space-y-3">
                                  <div>
                                    <Label className="text-sm">节点类型 *</Label>
                                    <RadioGroup 
                                      value={periodicConfig.scheduleType} 
                                      onValueChange={(value: 'daily' | 'weekly') => 
                                        setPeriodicConfig({...periodicConfig, scheduleType: value, selectedWeekdays: [], weekdayDataRanges: {}})
                                      }
                                      className="flex space-x-4 mt-2"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="daily" id="schedule-daily" />
                                        <Label htmlFor="schedule-daily">每天（固定获取前1天数据）</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="weekly" id="schedule-weekly" />
                                        <Label htmlFor="schedule-weekly">每周（自定义星期几和数据范围）</Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                </CardContent>
                              </Card>
                              
                              {/* 步骤2：如果选择每周，配置星期几 */}
                              {periodicConfig.scheduleType === 'weekly' && (
                                <>
                                  <Card className="border-blue-200 bg-blue-50/30 mb-3">
                                    <CardContent className="pt-4 space-y-3">
                                      <div>
                                        <Label className="text-sm">选择执行日期 *</Label>
                                        <p className="text-xs text-gray-500 mb-2">
                                          请选择每周哪几天执行任务
                                        </p>
                                        <div className="grid grid-cols-7 gap-2">
                                          {[1, 2, 3, 4, 5, 6, 0].map(weekday => (
                                            <div
                                              key={weekday}
                                              onClick={() => toggleWeekday(weekday)}
                                              className={`
                                                border-2 rounded-lg p-3 cursor-pointer text-center transition-all
                                                ${periodicConfig.selectedWeekdays.includes(weekday)
                                                  ? 'border-blue-500 bg-blue-100 text-blue-700'
                                                  : 'border-gray-300 bg-white hover:border-gray-400'
                                                }
                                              `}
                                            >
                                              <div className="text-sm font-medium">{weekdayNames[weekday]}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  {/* 步骤3：为每个选中的星期几配置数据范围 */}
                                  {periodicConfig.selectedWeekdays.length > 0 && (
                                    <Card className="border-green-200 bg-green-50/30">
                                      <CardContent className="pt-4 space-y-3">
                                        <div>
                                          <Label className="text-sm">配置数据范围</Label>
                                          <p className="text-xs text-gray-500 mb-3">
                                            为每个执行日配置向前获取几天的数据（不配置默认1天）
                                          </p>
                                          
                                          {[...periodicConfig.selectedWeekdays].sort((a, b) => a - b).map(weekday => {
                                            const maxDays = getMaxDataRangeForWeekday(weekday)
                                            const currentDays = periodicConfig.weekdayDataRanges[weekday] || 1
                                            return (
                                              <div key={weekday} className="flex items-center gap-3 mb-2 p-3 bg-white rounded-lg border border-gray-200">
                                                <div className="flex-shrink-0 w-16 text-sm font-medium text-gray-700">
                                                  {weekdayNames[weekday]}
                                                </div>
                                                <div className="flex-1">
                                                  <Select 
                                                    value={currentDays.toString()} 
                                                    onValueChange={(value) => updateWeekdayDataRange(weekday, parseInt(value))}
                                                  >
                                                    <SelectTrigger className="w-full">
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {Array.from({ length: maxDays }, (_, i) => i + 1).map(day => (
                                                        <SelectItem key={day} value={day.toString()}>
                                                          获取前{day}天数据
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="flex-shrink-0 text-xs text-gray-500">
                                                  最多{maxDays}天
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 会话数量（选填） */}
                        <div>
                          <Label htmlFor="task-quantity">会话数量（选填）</Label>
                          <Input
                            id="task-quantity"
                            type="number"
                            min="0"
                            value={onlineConfig.taskQuantity || ''}
                            onChange={(e) => setOnlineConfig({
                              ...onlineConfig,
                              taskQuantity: parseInt(e.target.value) || 0
                            })}
                            placeholder="不填写则拉取全部数据"
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

          {/* Step4：人员分配 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Step4：人员分配</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>选择标注人员 *</Label>
                    <p className="text-sm text-gray-600 mt-1 mb-4">
                      从权限管理分组的标注人员列表中勾选，最终创建的任务会出现在被选中的标注师任务列表中
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {annotatorOptions.map((annotator) => (
                        <div 
                          key={annotator.id} 
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            assignmentConfig.annotators.includes(annotator.id) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleAnnotatorChange(annotator.id, !assignmentConfig.annotators.includes(annotator.id))}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={assignmentConfig.annotators.includes(annotator.id)}
                                onChange={() => {}} // 由父级div的onClick处理
                              />
                              <div>
                                <h4 className="font-medium text-gray-900">{annotator.name}</h4>
                                <p className="text-sm text-gray-600">{annotator.role}</p>
                                <p className="text-xs text-gray-500">当前工作量: {annotator.workload}%</p>
                              </div>
                            </div>
                            
                            {assignmentConfig.annotators.includes(annotator.id) && (
                              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {assignmentConfig.annotators.length === 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                          <span className="text-sm text-amber-800">
                            请至少选择一位标注人员
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 分配方式选择 */}
                  {assignmentConfig.annotators.length >= 2 && (
                    <div className="pt-4 border-t border-gray-200">
                      <Label>分配方式 *</Label>
                      <p className="text-sm text-gray-600 mt-1 mb-4">
                        当标注师≥2名时，需要选择分配形式
                      </p>
                      
                      <RadioGroup 
                        value={assignmentConfig.annotationType} 
                        onValueChange={(value: 'cross' | 'distributed') => setAssignmentConfig({
                          ...assignmentConfig, 
                          annotationType: value
                        })}
                        className="space-y-4"
                      >
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="cross" id="cross-annotation" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="cross-annotation" className="font-medium">
                              交叉标注
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                              多人标注同一数据
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="distributed" id="distributed-annotation" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="distributed-annotation" className="font-medium">
                              分散标注
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                              不同人标注，瓜分整份数据
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
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

          {/* Step5：最终预览 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Step5：最终预览</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">任务配置总览</h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">任务名称：</span>
                        <span className="text-gray-900">{taskName}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">数据类型：</span>
                        <span className="text-gray-900">对话标注</span>
                      </div>
                      
                      {taskDescription && (
                        <div className="flex">
                          <span className="font-medium text-gray-700 w-32">任务描述：</span>
                          <span className="text-gray-900">{taskDescription}</span>
                        </div>
                      )}
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">标注类型：</span>
                        <span className="text-gray-900">
                          {selectedAnnotationTypes.map(id => 
                            availableAnnotationTypes.find(t => t.id === id)?.name
                          ).join('、')}
                        </span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">任务类型：</span>
                        <span className="text-gray-900">{executionType === 'single' ? '单次任务' : '周期任务'}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">数据源数量：</span>
                        <span className="text-gray-900">{onlineConfig.dataSources.length}组</span>
                      </div>
                      
                      {onlineConfig.taskQuantity > 0 && (
                        <div className="flex">
                          <span className="font-medium text-gray-700 w-32">会话数量：</span>
                          <span className="text-gray-900">{onlineConfig.taskQuantity}条</span>
                        </div>
                      )}
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">标注人员：</span>
                        <span className="text-gray-900">
                          {assignmentConfig.annotators.map(id => 
                            annotatorOptions.find(a => a.id === id)?.name
                          ).join('、')} 
                          ({assignmentConfig.annotators.length}人)
                        </span>
                      </div>
                      
                      {assignmentConfig.annotators.length >= 2 && (
                        <div className="flex">
                          <span className="font-medium text-gray-700 w-32">分配方式：</span>
                          <span className="text-gray-900">
                            {assignmentConfig.annotationType === 'cross' ? '交叉标注' : '分散标注'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        配置已完成，点击"创建任务"按钮即可创建
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            上一步
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceedToNext()}
              >
                下一步
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceedToNext()}
              >
                创建任务
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
