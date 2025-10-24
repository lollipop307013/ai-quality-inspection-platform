import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Calendar, Clock, Users, Target, Settings, Plus, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useGlobalStore } from '../store/globalStore'

const TaskCreation: React.FC = () => {
  const { 
    annotationTaskTypes, 
    addTask, 
    getAnnotationTaskTypeById,
    getAllErrorCodes 
  } = useGlobalStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [taskData, setTaskData] = useState({
    name: '',
    description: '',
    taskTypeId: '',
    deadline: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    assignees: [] as string[],
    dataSource: 'auto' as 'auto' | 'manual' | 'import'
  })

  const [selectedTaskType, setSelectedTaskType] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  const steps = [
    { id: 1, name: '基本信息', description: '设置任务名称和描述' },
    { id: 2, name: '选择模板', description: '选择标注任务类型模板' },
    { id: 3, name: '配置参数', description: '配置任务参数和截止时间' },
    { id: 4, name: '确认创建', description: '预览并确认创建任务' }
  ]

  const handleTaskTypeSelect = (taskType: any) => {
    setTaskData(prev => ({ ...prev, taskTypeId: taskType.id }))
    setSelectedTaskType(taskType)
  }

  const handleCreateTask = () => {
    if (!taskData.name || !taskData.description || !taskData.taskTypeId || !taskData.deadline) {
      toast.error('请填写完整的任务信息')
      return
    }

    const taskType = getAnnotationTaskTypeById(taskData.taskTypeId)
    if (!taskType) {
      toast.error('选择的任务类型不存在')
      return
    }

    const newTask = {
      id: `task_${Date.now()}`,
      name: taskData.name,
      description: taskData.description,
      taskTypeId: taskData.taskTypeId,
      status: 'active' as const,
      progress: {
        total: 0,
        completed: 0,
        pending: 0,
        remaining: 0
      },
      annotationConfig: {
        predefinedTypes: taskType.predefinedTypes,
        customTypes: taskType.customTypes
      },
      deadline: taskData.deadline,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    addTask(newTask)
    toast.success('任务创建成功')
    
    // 重置表单
    setTaskData({
      name: '',
      description: '',
      taskTypeId: '',
      deadline: '',
      priority: 'medium',
      assignees: [],
      dataSource: 'auto'
    })
    setSelectedTaskType(null)
    setCurrentStep(1)
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return taskData.name && taskData.description
      case 2:
        return taskData.taskTypeId
      case 3:
        return taskData.deadline
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">创建质检任务</h1>
          <p className="text-gray-600 mt-1">按步骤创建新的质检任务，选择合适的任务类型</p>
        </div>

      {/* 步骤指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.id 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-5 h-5 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 步骤内容 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* 步骤1: 基本信息 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">基本信息</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-name">任务名称 *</Label>
                    <Input
                      id="task-name"
                      value={taskData.name}
                      onChange={(e) => setTaskData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="请输入任务名称"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-description">任务描述 *</Label>
                    <Textarea
                      id="task-description"
                      value={taskData.description}
                      onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="请输入任务描述"
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-priority">任务优先级</Label>
                    <select
                      id="task-priority"
                      value={taskData.priority}
                      onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="high">高优先级</option>
                      <option value="medium">中优先级</option>
                      <option value="low">低优先级</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤2: 选择模板 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">选择标注任务类型模板</h3>
                <p className="text-sm text-gray-600 mb-4">
                  选择一个标注任务类型模板，模板包含预定义的标注项和自定义标注项配置
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {annotationTaskTypes.map((taskType) => (
                    <Card 
                      key={taskType.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        taskData.taskTypeId === taskType.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleTaskTypeSelect(taskType)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base flex items-center">
                            {taskType.name}
                            <Badge 
                              variant={taskType.category === 'system' ? 'default' : 'secondary'}
                              className="ml-2 text-xs"
                            >
                              {taskType.category === 'system' ? '系统' : '自定义'}
                            </Badge>
                          </CardTitle>
                          {taskData.taskTypeId === taskType.id && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {taskType.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600">
                            预定义标注项: {taskType.predefinedTypes.length} 个
                          </div>
                          <div className="text-xs text-gray-600">
                            自定义标注项: {taskType.customTypes.length} 个
                          </div>
                          <div className="text-xs text-gray-600">
                            使用次数: {taskType.usageCount}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 步骤3: 配置参数 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">配置任务参数</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-deadline">截止时间 *</Label>
                    <Input
                      id="task-deadline"
                      type="datetime-local"
                      value={taskData.deadline}
                      onChange={(e) => setTaskData(prev => ({ ...prev, deadline: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="data-source">数据来源</Label>
                    <select
                      id="data-source"
                      value={taskData.dataSource}
                      onChange={(e) => setTaskData(prev => ({ ...prev, dataSource: e.target.value as any }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="auto">自动生成对话数据</option>
                      <option value="manual">手动选择对话</option>
                      <option value="import">导入对话数据</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 显示选中的模板配置预览 */}
              {selectedTaskType && (
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium mb-3">模板配置预览</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">预定义标注项</h5>
                        <div className="space-y-1">
                          {selectedTaskType.predefinedTypes.map((typeId: string) => (
                            <Badge key={typeId} variant="outline" className="text-xs mr-1">
                              {typeId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">自定义标注项</h5>
                        <div className="space-y-1">
                          {selectedTaskType.customTypes.map((customType: any, index: number) => (
                            <div key={index} className="text-xs text-gray-600">
                              {customType.name} ({customType.type})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 步骤4: 确认创建 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">确认创建任务</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">任务信息</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-600">任务名称:</span> {taskData.name}</div>
                        <div><span className="text-gray-600">任务描述:</span> {taskData.description}</div>
                        <div><span className="text-gray-600">优先级:</span> 
                          <Badge variant={taskData.priority === 'high' ? 'destructive' : taskData.priority === 'medium' ? 'default' : 'secondary'} className="ml-1 text-xs">
                            {taskData.priority === 'high' ? '高' : taskData.priority === 'medium' ? '中' : '低'}
                          </Badge>
                        </div>
                        <div><span className="text-gray-600">截止时间:</span> {new Date(taskData.deadline).toLocaleString()}</div>
                        <div><span className="text-gray-600">数据来源:</span> 
                          {taskData.dataSource === 'auto' ? '自动生成' : taskData.dataSource === 'manual' ? '手动选择' : '导入数据'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">标注模板</h4>
                      {selectedTaskType && (
                        <div className="space-y-2 text-sm">
                          <div><span className="text-gray-600">模板名称:</span> {selectedTaskType.name}</div>
                          <div><span className="text-gray-600">模板类型:</span> 
                            <Badge variant={selectedTaskType.category === 'system' ? 'default' : 'secondary'} className="ml-1 text-xs">
                              {selectedTaskType.category === 'system' ? '系统' : '自定义'}
                            </Badge>
                          </div>
                          <div><span className="text-gray-600">预定义标注项:</span> {selectedTaskType.predefinedTypes.length} 个</div>
                          <div><span className="text-gray-600">自定义标注项:</span> {selectedTaskType.customTypes.length} 个</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          上一步
        </Button>
        <div className="space-x-2">
          {currentStep < steps.length ? (
            <Button
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              下一步
            </Button>
          ) : (
            <Button
              onClick={handleCreateTask}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建任务
            </Button>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}

export default TaskCreation