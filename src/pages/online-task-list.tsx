import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom'
import OnlineLayout from '@/components/online-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ChevronDown, Search, MoreHorizontal, Download } from 'lucide-react'
import { RISK_LEVELS, RiskLevel } from '@/store/onlineStore'

interface OnlineTask {
  id: string
  name: string
  status: '进行中' | '待分配' | '待处理'
  sourceScene: string
  sourceEvent: string
  channel: string
  scope: string
  createdAt: string
  progressDone: number
  progressTotal: number
}

const statusStyle: Record<OnlineTask['status'], string> = {
  进行中: 'bg-blue-100 text-blue-600 border-blue-200',
  待分配: 'bg-orange-100 text-orange-600 border-orange-200',
  待处理: 'bg-gray-100 text-gray-500 border-gray-200',
}

const mockTasks: OnlineTask[] = [
  {
    id: 'test',
    name: 'test',
    status: '进行中',
    sourceScene: 'CodeV 无我要玩助手',
    sourceEvent: '测量行动(21116)',
    channel: 'SDK',
    scope: '简介: -',
    createdAt: '2026/07/22',
    progressDone: 2,
    progressTotal: 587,
  },
  {
    id: 'test2',
    name: 'test',
    status: '待处理',
    sourceScene: 'CodeV 无我要玩助手',
    sourceEvent: '测量行动(21116)',
    channel: 'SDK',
    scope: '简介: -',
    createdAt: '2026/07/22',
    progressDone: 0,
    progressTotal: 587,
  },
  {
    id: 'wsst5',
    name: '瓦手试点5',
    status: '待分配',
    sourceScene: 'CodeV 无我要玩助手',
    sourceEvent: '测量打行动(21116)',
    channel: 'SDK',
    scope: '简介: -',
    createdAt: '2026/04/17',
    progressDone: 0,
    progressTotal: 498,
  },
  {
    id: 'wsst5-2',
    name: '瓦手试点5',
    status: '待分配',
    sourceScene: 'CodeV 无我要玩助手',
    sourceEvent: '测量打行动(21116)',
    channel: 'SDK',
    scope: '简介: -',
    createdAt: '2026/04/17',
    progressDone: 0,
    progressTotal: 498,
  },
]

// mock 标注结果原始数据，用于导出筛选/去重演示（子需求 6、12）
interface AnnotationRecord {
  taskId: string
  recordId: string
  question: string
  riskLevel: RiskLevel | null
  errorCode: string
  annotator: string
  annotatedAt: string // ISO date
}

const MOCK_ANNOTATORS = ['张三', '李四', '王五']

function buildMockAnnotationRecords(): AnnotationRecord[] {
  const records: AnnotationRecord[] = []
  const baseQuestions = ['充值没到账怎么办', '怎么下载游戏', '我的角色被误封了', '这个副本怎么打', '最近有什么活动']
  const levels: (RiskLevel | null)[] = ['极高风险错误', '低风险错误', '高风险错误', '中风险错误', null]
  const codes = ['#010105', '#020103', '#020101', '#020104', '']
  let seq = 0
  for (const task of mockTasks) {
    for (let i = 0; i < 5; i++) {
      seq++
      // 模拟同一条数据被同一标注人多次标注（用于去重演示）
      const times = i === 0 ? 2 : 1
      for (let t = 0; t < times; t++) {
        records.push({
          taskId: task.id,
          recordId: `${task.id}-${i}`,
          question: baseQuestions[i],
          riskLevel: levels[i],
          errorCode: codes[i],
          annotator: MOCK_ANNOTATORS[seq % MOCK_ANNOTATORS.length],
          annotatedAt: `2026-07-${String(10 + (seq % 20)).padStart(2, '0')}`,
        })
      }
    }
  }
  return records
}

const MOCK_ANNOTATION_RECORDS = buildMockAnnotationRecords()

export default function OnlineTaskList() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')

  // ---------------- 子需求 12：导出筛选面板 ----------------
  const [exportOpen, setExportOpen] = useState(false)
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<RiskLevel[]>([])
  const [errorCodeQuery, setErrorCodeQuery] = useState('')
  const [annotatorQuery, setAnnotatorQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const toggleRiskLevel = (level: RiskLevel) => {
    setSelectedRiskLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
  }

  // 去重：同一标注人对同一数据的多次标注仅保留最后一次
  const dedupedRecords = useMemo(() => {
    const map = new Map<string, AnnotationRecord>()
    for (const rec of MOCK_ANNOTATION_RECORDS) {
      const key = `${rec.recordId}__${rec.annotator}`
      // 由于数组已按顺序追加，后写入的即为"最后一次"，直接覆盖
      map.set(key, rec)
    }
    return Array.from(map.values())
  }, [])

  const filteredForExport = useMemo(() => {
    return dedupedRecords.filter((rec) => {
      if (selectedRiskLevels.length > 0) {
        if (!rec.riskLevel || !selectedRiskLevels.includes(rec.riskLevel)) return false
      }
      if (errorCodeQuery.trim()) {
        if (!rec.errorCode.toLowerCase().includes(errorCodeQuery.trim().toLowerCase())) return false
      }
      if (annotatorQuery.trim()) {
        if (!rec.annotator.includes(annotatorQuery.trim())) return false
      }
      if (dateFrom) {
        if (rec.annotatedAt < dateFrom) return false
      }
      if (dateTo) {
        if (rec.annotatedAt > dateTo) return false
      }
      return true
    })
  }, [dedupedRecords, selectedRiskLevels, errorCodeQuery, annotatorQuery, dateFrom, dateTo])

  const handleConfirmExport = () => {
    // ---------------- 子需求 6：导出文件包含合格率统计汇总 ----------------
    const total = filteredForExport.length
    const levelCounts: Record<string, number> = {}
    RISK_LEVELS.forEach((lv) => (levelCounts[lv] = 0))
    let unqualifiedCount = 0
    filteredForExport.forEach((rec) => {
      if (rec.riskLevel) {
        levelCounts[rec.riskLevel] = (levelCounts[rec.riskLevel] || 0) + 1
        if (rec.riskLevel === '高风险错误' || rec.riskLevel === '极高风险错误') unqualifiedCount++
      }
    })
    const qualifiedCount = total - unqualifiedCount
    const qualifiedRate = total > 0 ? ((qualifiedCount / total) * 100).toFixed(1) : '0.0'

    const wb = XLSX.utils.book_new()

    // Sheet1: 统计汇总
    const summaryRows: (string | number)[][] = [
      ['标注结果统计汇总'],
      [],
      ['总标注数', total],
      ['合格数', qualifiedCount],
      ['不合格数', unqualifiedCount],
      ['合格率', `${qualifiedRate}%`],
      [],
      ['风险等级分布', '数量', '占比'],
      ...RISK_LEVELS.map((lv) => [lv, levelCounts[lv] || 0, total > 0 ? `${(((levelCounts[lv] || 0) / total) * 100).toFixed(1)}%` : '0.0%']),
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, summarySheet, '统计汇总')

    // Sheet2: 原始标注数据（筛选+去重后）
    const dataRows = [
      ['任务ID', '数据ID', '问题内容', '风险等级', '错误码', '标注人', '标注时间'],
      ...filteredForExport.map((rec) => [
        rec.taskId,
        rec.recordId,
        rec.question,
        rec.riskLevel ?? '未标注',
        rec.errorCode,
        rec.annotator,
        rec.annotatedAt,
      ]),
    ]
    const dataSheet = XLSX.utils.aoa_to_sheet(dataRows)
    XLSX.utils.book_append_sheet(wb, dataSheet, '标注结果明细')

    XLSX.writeFile(wb, `标注结果导出_${new Date().toISOString().slice(0, 10)}.xlsx`)
    setExportOpen(false)
  }

  return (
    <OnlineLayout>
      <div className="flex h-full">
        {/* 主内容 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-semibold text-gray-900">人工质检任务</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setExportOpen(true)}>
                <Download className="w-3.5 h-3.5 mr-1" />
                导出标注结果
              </Button>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                触发器列表 <ChevronDown className="w-3 h-3" />
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mb-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="progress">进行中</SelectItem>
                <SelectItem value="pending">待分配</SelectItem>
                <SelectItem value="todo">待处理</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务名称"
                className="h-8 pl-8 text-xs w-48"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {mockTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-semibold">
                      i
                    </div>
                    <span className="text-sm font-medium text-gray-900">{task.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[11px] px-2 py-0.5 rounded-full ${statusStyle[task.status]}`}
                  >
                    {task.status}
                  </Badge>
                </div>

                <div className="text-[11px] text-gray-400 space-y-1 mb-3">
                  <div>
                    源自: {task.sourceScene} · {task.sourceEvent} · 渠道: {task.channel} · 简介: -
                  </div>
                  <div>创建时间: {task.createdAt}</div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                    <span>任务进度:</span>
                    <span>
                      {task.progressDone}/{task.progressTotal}条
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${
                          task.progressTotal > 0
                            ? Math.max(2, (task.progressDone / task.progressTotal) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 px-3"
                    onClick={() => navigate(`/online-annotation-workbench/${task.id}`)}
                  >
                    进入任务
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-3">
                    下载
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 ml-auto">
                    更多
                    <MoreHorizontal className="w-3.5 h-3.5 ml-0.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 text-xs text-gray-400">
            <span>共 4 条</span>
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 flex items-center justify-center rounded bg-blue-600 text-white">
                1
              </button>
            </div>
            <span className="flex items-center gap-1">
              21 条/页 <ChevronDown className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- 子需求 12：导出筛选弹窗 ---------------- */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>导出标注结果</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-1.5">风险等级</div>
              <div className="flex flex-wrap gap-3">
                {RISK_LEVELS.map((level) => (
                  <label key={level} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedRiskLevels.includes(level)}
                      onCheckedChange={() => toggleRiskLevel(level)}
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1.5">错误码</div>
                <Input
                  value={errorCodeQuery}
                  onChange={(e) => setErrorCodeQuery(e.target.value)}
                  placeholder="支持多选搜索，如 #0101"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1.5">标注人</div>
                <Input
                  value={annotatorQuery}
                  onChange={(e) => setAnnotatorQuery(e.target.value)}
                  placeholder="支持多选搜索，如 张三"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1.5">标注时间</div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-xs"
                />
                <span className="text-gray-400">—</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-md px-3 py-2 text-xs text-blue-600">
              预计导出 {filteredForExport.length} 条（去重后，原始 {MOCK_ANNOTATION_RECORDS.length} 条）
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setExportOpen(false)}>
              取消
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmExport}>
              导出 .xlsx
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OnlineLayout>
  )
}
