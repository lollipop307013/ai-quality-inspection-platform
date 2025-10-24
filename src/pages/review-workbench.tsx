/**
 * 审核工作台
 * 
 * 功能：
 * 1. 审核员可以查看标注师的标注结果
 * 2. 支持交叉标注和分散标注两种模式
 * 3. 可以亲自标注并标记差异
 * 4. 保存审核记录
 */

import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, ArrowLeft, CheckCircle, AlertTriangle, User } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import { useGlobalStore } from '../store/globalStore'
import ReviewModeTest from '../components/ReviewModeTest'

interface ReviewWorkbenchProps {
  taskId: string
  annotatorId?: string // 如果是分散标注，需要指定审核哪位标注师
}

const ReviewWorkbench: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const taskId = searchParams.get('taskId')
  const annotatorId = searchParams.get('annotatorId') // 分散标注模式下的标注师ID
  const mode = searchParams.get('mode') || 'cross' // cross | distributed
  
  const { 
    getTaskById, 
    annotationRecords,
    getAnnotationRecordsByData,
    getAnnotationRecordsByAnnotator,
    addReviewRecord,
    updateAnnotationRecord,
    currentUser
  } = useGlobalStore()

  const [currentDataIndex, setCurrentDataIndex] = useState(0)
  const [reviewAnnotations, setReviewAnnotations] = useState<Record<string, any>>({})
  const [dataList, setDataList] = useState<any[]>([])
  
  const task = taskId ? getTaskById(taskId) : undefined

  // 如果没有 taskId，显示测试页面
  if (!taskId) {
    return <ReviewModeTest />
  }

  useEffect(() => {
    if (!task) {
      toast.error('任务不存在')
      navigate('/task-center')
      return
    }

    // 加载数据列表（这里应该从后端获取）
    // 暂时使用模拟数据
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      id: `data_${i + 1}`,
      content: `数据项 ${i + 1}`,
      // 其他数据字段...
    }))
    setDataList(mockData)
  }, [taskId, task, navigate])

  const currentData = dataList[currentDataIndex]
  
  // 获取当前数据的所有标注记录
  const currentAnnotations = currentData 
    ? getAnnotationRecordsByData(taskId!, currentData.id)
    : []

  // 如果是分散标注模式，只显示指定标注师的记录
  const displayAnnotations = mode === 'distributed' && annotatorId
    ? currentAnnotations.filter(record => record.annotatorId === annotatorId)
    : currentAnnotations

  // 处理审核提交
  const handleSubmitReview = () => {
    if (!currentData || !taskId) return

    // 创建审核记录
    const reviewRecord = {
      id: `review_${Date.now()}`,
      taskId,
      dataId: currentData.id,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      annotations: reviewAnnotations,
      differences: [] as any[],
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 对比审核结论与标注师的标注，标记差异
    displayAnnotations.forEach(record => {
      const differences: string[] = []
      
      Object.keys(reviewAnnotations).forEach(key => {
        if (record.annotations[key] !== reviewAnnotations[key]) {
          differences.push(key)
        }
      })

      if (differences.length > 0) {
        reviewRecord.differences.push({
          annotatorId: record.annotatorId,
          annotatorName: record.annotatorName,
          differenceFields: differences
        })

        // 更新标注记录，标记有差异
        updateAnnotationRecord(record.id, {
          hasDifference: true,
          status: 'reviewed'
        })
      } else {
        // 无差异，也标记为已审核
        updateAnnotationRecord(record.id, {
          hasDifference: false,
          status: 'reviewed'
        })
      }
    })

    // 保存审核记录
    addReviewRecord(reviewRecord)

    toast.success('审核完成')
    
    // 跳转到下一条
    if (currentDataIndex < dataList.length - 1) {
      setCurrentDataIndex(currentDataIndex + 1)
      setReviewAnnotations({})
    } else {
      toast.success('所有数据审核完成')
      navigate(`/task-center?taskId=${taskId}`)
    }
  }

  if (!task || !currentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/task-center?taskId=${taskId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回任务详情
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{task.name}</h1>
              <p className="text-sm text-gray-600">
                审核模式：{mode === 'cross' ? '交叉标注' : '分散标注'}
                {mode === 'distributed' && annotatorId && (
                  <span className="ml-2">
                    | 审核对象：{displayAnnotations[0]?.annotatorName || annotatorId}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline">
              {currentDataIndex + 1} / {dataList.length}
            </Badge>
            <Badge variant={currentUser.role === 'reviewer' ? 'default' : 'secondary'}>
              审核员：{currentUser.name}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：数据展示区 */}
          <div className="col-span-7">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">数据内容</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">{currentData.content}</p>
                </div>
                {/* 这里应该展示实际的对话内容、图片等 */}
              </div>
            </div>

            {/* 其他标注师的标注结果 */}
            {displayAnnotations.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">
                  标注师的标注结果
                  {mode === 'cross' && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      （共 {displayAnnotations.length} 位标注师）
                    </span>
                  )}
                </h2>
                <div className="space-y-4">
                  {displayAnnotations.map((record, index) => (
                    <div 
                      key={record.id}
                      className={`p-4 rounded-lg border-2 ${
                        record.hasDifference 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {record.annotatorName}
                          </span>
                          {record.hasDifference && (
                            <Badge variant="destructive" className="text-xs">
                              有差异
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(record.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(record.annotations).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium text-gray-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：审核标注区 */}
          <div className="col-span-5">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">审核员标注</h2>
              <p className="text-sm text-gray-600 mb-4">
                请根据标准进行标注，系统将自动对比并标记差异
              </p>

              {/* 标注表单 */}
              <div className="space-y-4">
                {/* 这里应该根据任务的标注类型动态生成表单 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    示例标注项
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="请输入标注结果"
                    value={reviewAnnotations['example'] || ''}
                    onChange={(e) => setReviewAnnotations({
                      ...reviewAnnotations,
                      example: e.target.value
                    })}
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-6 space-y-3">
                <Button
                  onClick={handleSubmitReview}
                  className="w-full"
                  disabled={Object.keys(reviewAnnotations).length === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  确认审核
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentDataIndex > 0) {
                        setCurrentDataIndex(currentDataIndex - 1)
                        setReviewAnnotations({})
                      }
                    }}
                    disabled={currentDataIndex === 0}
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    上一条
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentDataIndex < dataList.length - 1) {
                        setCurrentDataIndex(currentDataIndex + 1)
                        setReviewAnnotations({})
                      }
                    }}
                    disabled={currentDataIndex === dataList.length - 1}
                    className="flex-1"
                  >
                    下一条
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* 进度提示 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-900 font-medium">审核进度</span>
                  <span className="text-blue-700">
                    {currentDataIndex + 1} / {dataList.length}
                  </span>
                </div>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentDataIndex + 1) / dataList.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewWorkbench
