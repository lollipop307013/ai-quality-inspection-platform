/**
 * 统计辅助工具
 * 
 * 功能：
 * 1. 多人标注结果聚合（平均值/中位数）
 * 2. 标注错误率计算
 */

import { AnnotationRecord, Task } from '../store/globalStore'

/**
 * 计算数值数组的平均值
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

/**
 * 计算数值数组的中位数
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  } else {
    return sorted[mid]
  }
}

/**
 * 聚合多人标注结果
 * 
 * @param records 同一数据的多条标注记录
 * @param method 聚合方法：'average' | 'median'
 * @returns 聚合后的标注结果
 */
export function aggregateAnnotations(
  records: AnnotationRecord[],
  method: 'average' | 'median' = 'average'
): Record<string, any> {
  if (records.length === 0) return {}
  if (records.length === 1) return records[0].annotations

  const result: Record<string, any> = {}
  
  // 获取所有标注字段
  const allKeys = new Set<string>()
  records.forEach(record => {
    Object.keys(record.annotations).forEach(key => allKeys.add(key))
  })

  // 对每个字段进行聚合
  allKeys.forEach(key => {
    const values = records
      .map(record => record.annotations[key])
      .filter(val => val !== undefined && val !== null)

    if (values.length === 0) {
      result[key] = null
      return
    }

    // 判断值的类型
    const firstValue = values[0]
    
    if (typeof firstValue === 'number') {
      // 数值型：计算平均值或中位数
      const numericValues = values.filter(v => typeof v === 'number') as number[]
      result[key] = method === 'average' 
        ? calculateAverage(numericValues)
        : calculateMedian(numericValues)
    } else if (typeof firstValue === 'string') {
      // 字符串型：取众数（出现次数最多的值）
      const frequency: Record<string, number> = {}
      values.forEach(val => {
        const strVal = String(val)
        frequency[strVal] = (frequency[strVal] || 0) + 1
      })
      
      let maxCount = 0
      let mostFrequent = firstValue
      Object.entries(frequency).forEach(([val, count]) => {
        if (count > maxCount) {
          maxCount = count
          mostFrequent = val
        }
      })
      
      result[key] = mostFrequent
    } else if (Array.isArray(firstValue)) {
      // 数组型：合并去重
      const allItems = values.flat()
      result[key] = Array.from(new Set(allItems))
    } else {
      // 其他类型：取第一个值
      result[key] = firstValue
    }
  })

  return result
}



/**
 * 计算标注师的错误率
 * 
 * @param annotatorId 标注师ID
 * @param annotationRecords 所有标注记录
 * @param taskId 任务ID
 * @returns 错误率（0-100）
 */
export function calculateAnnotatorErrorRate(
  annotatorId: string,
  annotationRecords: AnnotationRecord[],
  taskId: string
): number {
  const annotatorRecords = annotationRecords.filter(
    r => r.taskId === taskId && r.annotatorId === annotatorId
  )

  if (annotatorRecords.length === 0) return 0

  const errorCount = annotatorRecords.filter(r => r.hasDifference === true).length
  return (errorCount / annotatorRecords.length) * 100
}

/**
 * 生成标注错误率报告
 * 
 * @param task 任务信息
 * @param annotationRecords 所有标注记录
 * @returns 错误率报告
 */
export function generateErrorRateReport(
  task: Task,
  annotationRecords: AnnotationRecord[]
): {
  annotatorId: string
  annotatorName: string
  totalAnnotated: number
  errorCount: number
  errorRate: number
  errorFields: Record<string, number> // 各字段的错误次数
}[] {
  if (!task.assignmentConfig) return []

  const report = task.assignmentConfig.annotators.map(annotatorId => {
    const records = annotationRecords.filter(
      r => r.taskId === task.id && r.annotatorId === annotatorId
    )

    const errorRecords = records.filter(r => r.hasDifference === true)
    const errorCount = errorRecords.length
    const errorRate = records.length > 0 ? (errorCount / records.length) * 100 : 0

    // 统计各字段的错误次数
    const errorFields: Record<string, number> = {}
    errorRecords.forEach(record => {
      Object.keys(record.annotations).forEach(field => {
        errorFields[field] = (errorFields[field] || 0) + 1
      })
    })

    return {
      annotatorId,
      annotatorName: records[0]?.annotatorName || annotatorId,
      totalAnnotated: records.length,
      errorCount,
      errorRate: Math.round(errorRate * 100) / 100, // 保留两位小数
      errorFields
    }
  })

  // 按错误率降序排序
  return report.sort((a, b) => b.errorRate - a.errorRate)
}

/**
 * 计算任务的整体统计数据
 * 
 * @param task 任务信息
 * @param annotationRecords 所有标注记录
 * @returns 统计数据
 */
export function calculateTaskStatistics(
  task: Task,
  annotationRecords: AnnotationRecord[]
): {
  totalData: number
  annotatedData: number
  aggregatedResults: Record<string, any>[]
  errorRateReport: ReturnType<typeof generateErrorRateReport>
} {
  const taskRecords = annotationRecords.filter(r => r.taskId === task.id)

  // 按数据ID分组
  const dataGroups = new Map<string, AnnotationRecord[]>()
  taskRecords.forEach(record => {
    if (!dataGroups.has(record.dataId)) {
      dataGroups.set(record.dataId, [])
    }
    dataGroups.get(record.dataId)!.push(record)
  })

  // 聚合每组数据的标注结果
  const aggregatedResults: Record<string, any>[] = []
  const statisticsMethod = task.assignmentConfig?.statisticsMethod || 'average'

  dataGroups.forEach((records, dataId) => {
    const aggregated = aggregateAnnotations(records, statisticsMethod)
    aggregatedResults.push({
      dataId,
      ...aggregated
    })
  })

  // 生成错误率报告
  const errorRateReport = generateErrorRateReport(task, annotationRecords)

  return {
    totalData: dataGroups.size,
    annotatedData: dataGroups.size,
    aggregatedResults,
    errorRateReport
  }
}
