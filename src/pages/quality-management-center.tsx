import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  Settings, Target, FileText, BarChart3, Users, 
  ArrowRight, CheckCircle, Clock, AlertCircle,
  Plus, Edit, Eye, TrendingUp, Database, Workflow, ClipboardCheck
} from 'lucide-react'
import { useGlobalStore } from '../store/globalStore'
import ReviewTaskSelector from '../components/ReviewTaskSelector'



const QualityManagementCenter: React.FC = () => {
  const navigate = useNavigate()
  const { 
    annotationTaskTypes, 
    tasks, 
    qualityStandards,
    getCurrentTask 
  } = useGlobalStore()

  // 统计数据
  const stats = {
    taskTypes: annotationTaskTypes.length,
    activeTasks: tasks.filter(task => task.status === 'active').length,
    completedTasks: tasks.filter(task => task.status === 'completed').length,
    qualityStandards: qualityStandards.length,
    totalProgress: tasks.reduce((sum, task) => sum + task.progress.completed, 0),
    totalItems: tasks.reduce((sum, task) => sum + task.progress.total, 0)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 平台概览 */}
      <div>
        <h2 className="page-title mb-4">质检管理中心概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">任务类型</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.taskTypes}</div>
              <p className="text-xs text-gray-500">可用的任务类型</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">活跃任务</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeTasks}</div>
              <p className="text-xs text-gray-500">正在进行的任务</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">质检标准</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.qualityStandards}</div>
              <p className="text-xs text-gray-500">配置的质检标准</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">完成进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalItems > 0 ? Math.round((stats.totalProgress / stats.totalItems) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500">总体完成率</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 功能流程图 */}
      <div>
        <h3 className="text-lg font-medium mb-4">平台功能流程</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">1. 配置管理</div>
                <div className="text-xs text-gray-500">任务类型 + 质检标准</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">2. 创建任务</div>
                <div className="text-xs text-gray-500">选择类型创建任务</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">3. 标注工作</div>
                <div className="text-xs text-gray-500">使用工作台标注</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">4. 结果分析</div>
                <div className="text-xs text-gray-500">质检报告生成</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div>
        <h3 className="text-lg font-medium mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/task-template-management')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                管理任务类型
              </CardTitle>
              <CardDescription>
                创建和管理标注任务类型配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">当前类型: {stats.taskTypes} 个</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/quality-standards')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                质检标准配置
              </CardTitle>
              <CardDescription>
                配置质检标准和错误码
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">标准数: {stats.qualityStandards} 个</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/task-center?action=create')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Plus className="w-5 h-5 mr-2 text-green-600" />
                创建新任务
              </CardTitle>
              <CardDescription>
                基于任务类型创建质检任务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">活跃任务: {stats.activeTasks} 个</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/annotation-workbench'}>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                标注工作台
              </CardTitle>
              <CardDescription>
                进行对话标注和质检工作
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  进度: {stats.totalItems > 0 ? Math.round((stats.totalProgress / stats.totalItems) * 100) : 0}%
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <ReviewTaskSelector 
            trigger={
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <ClipboardCheck className="w-5 h-5 mr-2 text-indigo-600" />
                    审核工作台
                  </CardTitle>
                  <CardDescription>
                    进行质量审核和交叉验证
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">选择任务进入审核</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            }
          />
        </div>
      </div>

      {/* 最近任务 */}
      <div>
        <h3 className="text-lg font-medium mb-4">最近任务</h3>
        <div className="space-y-3">
          {tasks.slice(0, 3).map((task) => (
            <Card key={task.id} className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-sm">{task.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={task.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {task.status === 'active' ? '进行中' : task.status === 'completed' ? '已完成' : '暂停'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        截止: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {task.progress.total > 0 ? Math.round((task.progress.completed / task.progress.total) * 100) : 0}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {task.progress.completed}/{task.progress.total}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">质检管理中心</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                v1.0.0
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderOverview()}
      </div>

      {/* 功能说明浮动面板 */}
      <div className="fixed bottom-6 right-6">
          <Card className="w-80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Workflow className="w-4 h-4 mr-2" />
                功能串联说明
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div>
                  <strong>任务类型管理</strong>：创建包含预定义和自定义标注项的任务类型
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                <div>
                  <strong>质检标准配置</strong>：设置错误码和质检标准，供标注工作台使用
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <div>
                  <strong>任务创建</strong>：选择任务类型创建具体的质检任务
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                <div>
                  <strong>标注工作台</strong>：根据任务配置进行标注，错误码来源于质检标准
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}

export default QualityManagementCenter