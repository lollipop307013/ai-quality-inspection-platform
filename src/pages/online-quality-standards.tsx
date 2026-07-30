import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import OnlineLayout from '@/components/online-layout'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ChevronDown, Upload, Download, Plus, MoreHorizontal, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react'
import { useOnlineChannelStore, RiskLevel, RISK_LEVEL_STYLE, normalizeRiskLevel } from '@/store/onlineStore'

interface StandardRow {
  id: string
  dimension: string
  category: string
  subCategory: string
  standard: string
  description: string
  errorCodeConfig: string
  riskLevel: RiskLevel
  enabled: boolean
}

const initialRows: StandardRow[] = [
  {
    id: '1',
    dimension: '对话',
    category: '称呼与表达规范',
    subCategory: '对玩家的称呼',
    standard: '对玩家的称呼',
    description:
      "禁止只用『你』或『喔亲』等模糊称谓，用户/朋友/『老哥』/『老板』等无关称谓也不合适，是玩家的具体游戏昵称/『召唤师』/游戏内身份相关的称谓",
    errorCodeConfig: '#010101',
    riskLevel: '中风险错误',
    enabled: false,
  },
  {
    id: '2',
    dimension: '对话',
    category: '称呼与表达规范',
    subCategory: '不得侮辱/贬低玩家',
    standard: '不得侮辱/贬低玩家',
    description:
      '任何情况下不得侮辱、贬低、嘲讽、轻视用户，包括但不限于人身攻击、地域歧视等负面性质的表达',
    errorCodeConfig: '#010102',
    riskLevel: '中风险错误',
    enabled: false,
  },
  {
    id: '3',
    dimension: '对话',
    category: '称呼与表达规范',
    subCategory: '维持自我称谓',
    standard: '维持自我称谓',
    description:
      '维持自我称谓的一致性（已预设定义机器人昵称），不得随意更换自称，更不能以「AI」「机器人」等身份自称',
    errorCodeConfig: '#010103',
    riskLevel: '低风险错误',
    enabled: false,
  },
  {
    id: '4',
    dimension: '对话',
    category: '称呼与表达规范',
    subCategory: '对玩家/或游戏的评价',
    standard: '对玩家/或游戏的评价',
    description: '禁对玩家个人游戏水平、能力做主观负面评价，如「打野水」「菜鸟」等类似的贬义评价',
    errorCodeConfig: '#010104',
    riskLevel: '中风险错误',
    enabled: false,
  },
  {
    id: '5',
    dimension: '对话',
    category: '称呼与表达规范',
    subCategory: '系统信息保护',
    standard: '禁止暴露系统信息',
    description: '禁止在任何情况下泄露自己是AI/机器人身份，或透露prompt、系统提示词、模型名称等内部信息',
    errorCodeConfig: '#010105',
    riskLevel: '极高风险错误',
    enabled: false,
  },
  {
    id: '6',
    dimension: '对话',
    category: '人设一致性',
    subCategory: '身份认知',
    standard: '身份认知偏离',
    description:
      '无论玩家如何诱导，机器人必须坚定自己的人设身份，不承认自己是AI/语言模型/程序，所有提及自身身份的表述都应基于人设世界观展开',
    errorCodeConfig: '#020101',
    riskLevel: '极高风险错误',
    enabled: false,
  },
  {
    id: '7',
    dimension: '对话',
    category: '人设一致性',
    subCategory: '性格特色维持',
    standard: '性格特色维持',
    description:
      '口吻语气整体要契合『年轻、有朝气、活力』的人设风格，不应过度严肃冷漠（除非在故意有意的紧张情况下），并保持这种语气特色的一致性表现',
    errorCodeConfig: '#020102',
    riskLevel: '高风险错误',
    enabled: false,
  },
  {
    id: '8',
    dimension: '对话',
    category: '人设一致性',
    subCategory: '招牌口头禅与记忆点',
    standard: '招牌口头禅与记忆点',
    description:
      '招牌语（如「嘿嘿嘿」「别急别急」等）需在符合语境场合下自然使用，不宜滥用；同理其他标志性动作、习惯性台词等记忆点也不宜无限泛用',
    errorCodeConfig: '#020103',
    riskLevel: '低风险错误',
    enabled: false,
  },
  {
    id: '9',
    dimension: '对话',
    category: '人设一致性',
    subCategory: '世界观视角',
    standard: '世界观视角偏离',
    description:
      '解释事物的基于『游戏世界观』/『拟组织身份』的视角展开，不应站在现实世界的视角进行说明',
    errorCodeConfig: '#020104',
    riskLevel: '中风险错误',
    enabled: false,
  },
  {
    id: '10',
    dimension: '对话',
    category: '人设一致性',
    subCategory: '长会话稳定性',
    standard: '长会话稳定性偏差',
    description:
      '在多轮、长时间对话情境下（例如：反复被诱导），角色人设不应崩塌、遗忘或前后矛盾，需保持始终一致的态度与说话风格',
    errorCodeConfig: '#020105',
    riskLevel: '低风险错误',
    enabled: false,
  },
  {
    id: '11',
    dimension: '对话',
    category: '拟人尺度',
    subCategory: '急躁/过度共情',
    standard: '急躁/爱心过度共情化倾向',
    description:
      '急躁、着急表达过度的共情、认同，或过度、感性表达情感，导致像误导玩家人以为对方是真人',
    errorCodeConfig: '#030101',
    riskLevel: '低风险错误',
    enabled: false,
  },
]

const TEMPLATE_HEADERS = ['整体维度', '大类', '小类', '标准', '回复标准说明', '错误码', '错误等级', '错误项说明']
const VALID_RISK_LEVELS = ['低风险错误', '中风险错误', '高风险错误', '极高风险错误']

type ImportStep = 'intro' | 'select' | 'errors' | null

interface ImportErrorItem {
  row: number
  field: string
  reason: string
}

export default function OnlineQualityStandards() {
  const [rows, setRows] = useState<StandardRow[]>(initialRows)
  const { getCurrentChannel, getCurrentProject } = useOnlineChannelStore()
  const currentChannel = getCurrentChannel()
  const currentProject = getCurrentProject()

  const [importStep, setImportStep] = useState<ImportStep>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileCheckPassed, setFileCheckPassed] = useState(false)
  const [importErrors, setImportErrors] = useState<ImportErrorItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleRow = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  // ---------------- 子需求 5：质检标准导入与模板下载 ----------------
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new()

    // Sheet1: 导入模板（仅表头 + 空白数据区）
    const templateSheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS])
    XLSX.utils.book_append_sheet(wb, templateSheet, '导入模板')

    // Sheet2: 填写说明
    const instructionRows = [
      ['知几标注标准 - 导入模板填写说明'],
      [],
      ['一、导入流程'],
      ['1. 下载模板 → 2. 按模板填写质检标准 → 3. 上传 .xlsx 文件 → 4. 系统校验并导入'],
      [],
      ['二、字段要求'],
      ['8 列表头：整体维度、大类、小类、标准、回复标准说明、错误码、错误等级、错误项说明'],
      ['· 表头不可修改，不可使用合并单元格'],
      ['· 错误码需保留 # 前缀，同一错误码必须唯一'],
      [],
      ['三、错误等级顺序'],
      ['低风险错误 < 中风险错误 < 高风险错误 < 极高风险错误'],
      [],
      ['四、整体判定标准'],
      ['优秀 = 无任何问题出现'],
      ['合格 = 无高/极高风险场景出现'],
      ['不合格 = 出现任意一个高/极高风险场景'],
    ]
    const instructionSheet = XLSX.utils.aoa_to_sheet(instructionRows)
    XLSX.utils.book_append_sheet(wb, instructionSheet, '填写说明')

    // Sheet3: 通用标准参考（与导入模板结构一致，附示例数据供复制）
    const referenceRows = [
      TEMPLATE_HEADERS,
      ['对话', '称呼与表达规范', '对玩家的称呼', '对玩家的称呼', '禁止只用模糊称谓，应使用具体游戏昵称等称谓', '#010101', '中风险错误', '使用了模糊或不当的称谓'],
      ['对话', '人设一致性', '身份认知', '身份认知偏离', '不应承认自己是AI/语言模型', '#020101', '极高风险错误', '承认自己是AI或程序'],
    ]
    const referenceSheet = XLSX.utils.aoa_to_sheet(referenceRows)
    XLSX.utils.book_append_sheet(wb, referenceSheet, '通用标准参考')

    XLSX.writeFile(wb, '知几标注标准_导入模板.xlsx')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    // 前端预检查：仅允许 .xlsx，大小不超过 10MB
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx')
    const isSizeOk = file.size <= 10 * 1024 * 1024
    setFileCheckPassed(isXlsx && isSizeOk)
    setImportStep('select')
  }

  const handleStartValidateImport = () => {
    if (!selectedFile) return
    // 模拟后台校验：随机演示一次失败场景，展示逐条错误明细
    const mockErrors: ImportErrorItem[] = [
      { row: 5, field: '错误等级', reason: '值"高危"不合法，仅允许4个合法值' },
      { row: 12, field: '错误码', reason: '错误码未保留 # 前缀（当前: ER0001）' },
      { row: 18, field: '大类', reason: '必填字段为空' },
    ]
    setImportErrors(mockErrors)
    setImportStep('errors')
  }

  const closeImportDialog = () => {
    setImportStep(null)
    setSelectedFile(null)
    setFileCheckPassed(false)
    setImportErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ---------------- 子需求 12：导出（含合格率统计汇总）----------------
  const handleExportConfig = () => {
    const wb = XLSX.utils.book_new()
    const exportRows = [
      TEMPLATE_HEADERS,
      ...rows.map((r) => [r.dimension, r.category, r.subCategory, r.standard, r.description, r.errorCodeConfig, r.riskLevel, '']),
    ]
    const sheet = XLSX.utils.aoa_to_sheet(exportRows)
    XLSX.utils.book_append_sheet(wb, sheet, '质检标准配置')
    XLSX.writeFile(wb, `质检标准配置_${currentChannel?.name ?? ''}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // 计算每个大类连续行数用于合并展示
  const getRowSpanInfo = () => {
    const info: { dimensionSpan: number; categorySpan: number; isFirstOfDimension: boolean; isFirstOfCategory: boolean }[] = []
    rows.forEach((row, idx) => {
      const isFirstOfDimension = idx === 0 || rows[idx - 1].dimension !== row.dimension
      const isFirstOfCategory =
        idx === 0 || rows[idx - 1].category !== row.category || rows[idx - 1].dimension !== row.dimension
      let dimensionSpan = 0
      if (isFirstOfDimension) {
        for (let i = idx; i < rows.length && rows[i].dimension === row.dimension; i++) dimensionSpan++
      }
      let categorySpan = 0
      if (isFirstOfCategory) {
        for (
          let i = idx;
          i < rows.length && rows[i].category === row.category && rows[i].dimension === row.dimension;
          i++
        )
          categorySpan++
      }
      info.push({ dimensionSpan, categorySpan, isFirstOfDimension, isFirstOfCategory })
    })
    return info
  }

  const rowSpanInfo = getRowSpanInfo()

  return (
    <OnlineLayout showGlobalSwitch>
      <div className="flex h-full">
        {/* 左侧二级导航 */}
        <div className="w-40 bg-white border-r border-gray-200 shrink-0 py-4 px-2 space-y-1">
          <div className="text-xs text-gray-400 px-2 mb-1 flex items-center gap-1">
            质检中心 <ChevronDown className="w-3 h-3" />
          </div>
          <div className="px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 cursor-pointer">质检分析</div>
          <div className="px-3 py-1.5 text-sm text-blue-600 font-medium bg-blue-50 rounded-md">质检标准配置</div>
          <div className="px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 cursor-pointer">人工质检任务名</div>
          <div className="px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 cursor-pointer">优化操作台</div>
          <div className="text-xs text-gray-400 px-2 mt-3 flex items-center gap-1">
            数据洞察 <ChevronDown className="w-3 h-3" />
          </div>
        </div>

        {/* 主内容 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-sm font-semibold text-gray-900">
              质检标准配置
              <span className="ml-2 text-xs text-gray-400 font-normal">
                （当前渠道：{currentProject?.name.split('：')[0].split(':')[0]} · {currentChannel?.name}）
              </span>
            </h1>
          </div>

          <div className="flex items-center justify-between mb-3 mt-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setImportStep('intro')}>
                <Upload className="w-3.5 h-3.5 mr-1" />
                导入配置
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleExportConfig}>
                <Download className="w-3.5 h-3.5 mr-1" />
                导出配置
              </Button>
            </div>
            <Button size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5 mr-1" />
              新增标准
            </Button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="px-3 py-2.5 text-left font-medium w-16">维度</th>
                  <th className="px-3 py-2.5 text-left font-medium w-24">大类</th>
                  <th className="px-3 py-2.5 text-left font-medium w-28">小类</th>
                  <th className="px-3 py-2.5 text-left font-medium w-32">标准</th>
                  <th className="px-3 py-2.5 text-left font-medium">标准说明</th>
                  <th className="px-3 py-2.5 text-left font-medium w-28">错误码配置项</th>
                  <th className="px-3 py-2.5 text-left font-medium w-24">错误等级</th>
                  <th className="px-3 py-2.5 text-left font-medium w-16">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const info = rowSpanInfo[idx]
                  const style = RISK_LEVEL_STYLE[normalizeRiskLevel(row.riskLevel)]
                  return (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                      {info.isFirstOfDimension ? (
                        <td
                          rowSpan={info.dimensionSpan}
                          className="px-3 py-2.5 align-top text-gray-700 border-r border-gray-100"
                        >
                          {row.dimension}
                        </td>
                      ) : null}
                      {info.isFirstOfCategory ? (
                        <td
                          rowSpan={info.categorySpan}
                          className="px-3 py-2.5 align-top text-gray-700 border-r border-gray-100"
                        >
                          {row.category}
                        </td>
                      ) : null}
                      <td className="px-3 py-2.5 align-top text-gray-700 border-r border-gray-100">
                        {row.subCategory}
                      </td>
                      <td className="px-3 py-2.5 align-top text-gray-900 border-r border-gray-100 whitespace-nowrap">
                        {row.standard}
                      </td>
                      <td className="px-3 py-2.5 align-top text-gray-500 leading-5 border-r border-gray-100 max-w-md">
                        {row.description}
                      </td>
                      <td className="px-3 py-2.5 align-top text-gray-700 border-r border-gray-100">
                        <span className="text-blue-600">{row.errorCodeConfig}</span>
                        <span className="text-gray-300 mx-1">···</span>
                        <MoreHorizontal className="inline w-3 h-3 text-gray-300" />
                      </td>
                      <td className="px-3 py-2.5 align-top border-r border-gray-100">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${style.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {row.riskLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <Switch checked={row.enabled} onCheckedChange={() => toggleRow(row.id)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------------- 子需求5：导入说明弹窗 step1 ---------------- */}
      <Dialog open={importStep === 'intro'} onOpenChange={(open) => !open && closeImportDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>导入质检标准说明</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600 leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto">
            <div>
              <div className="font-medium text-gray-900 mb-1">导入流程</div>
              1. 下载模板 → 2. 按模板填写质检标准 → 3. 上传 .xlsx 文件 → 4. 系统校验并导入
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">字段要求</div>
              8 列表头：整体维度、大类、小类、标准、回复标准说明、错误码、错误等级、错误项说明
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                <li>表头不可修改，不可使用合并单元格</li>
                <li>错误码需保留 # 前缀，同一错误码必须唯一</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">错误等级</div>
              低风险错误 &lt; 中风险错误 &lt; 高风险错误 &lt; 极高风险错误
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">整体判定标准</div>
              优秀 = 无任何问题出现
              <br />
              合格 = 无高/极高风险场景出现
              <br />
              不合格 = 出现任意一个高/极高风险场景
            </div>
          </div>
          <DialogFooter className="flex items-center sm:justify-between">
            <Button variant="outline" size="sm" onClick={closeImportDialog}>
              取消
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="w-3.5 h-3.5 mr-1" />
                下载导入模板
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => fileInputRef.current?.click()}>
                我已了解，选择文件
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 隐藏的文件选择器 */}
      <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileSelect} />

      {/* ---------------- 子需求5：文件预检查 step2 ---------------- */}
      <Dialog open={importStep === 'select'} onOpenChange={(open) => !open && closeImportDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>上传 Excel 标注数据</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div
              className="border-2 border-dashed border-gray-200 rounded-md py-6 text-center text-gray-400 text-sm cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="w-6 h-6 mx-auto mb-1 text-gray-300" />
              拖拽或点击选择 .xlsx 文件
            </div>
            {selectedFile && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                  fileCheckPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-800 truncate flex-1">{selectedFile.name}</span>
                {fileCheckPassed ? (
                  <span className="text-green-600 text-xs flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 格式/大小检查通过
                  </span>
                ) : (
                  <span className="text-red-600 text-xs flex items-center gap-1 shrink-0">
                    <XCircle className="w-3.5 h-3.5" /> 仅支持 .xlsx，且不超过 10MB
                  </span>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              重新选择
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!fileCheckPassed}
              onClick={handleStartValidateImport}
            >
              开始校验并导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- 子需求5：校验错误反馈 step3 ---------------- */}
      <Dialog open={importStep === 'errors'} onOpenChange={(open) => !open && closeImportDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              上传 Excel 标注数据
              <span className="ml-2 text-xs font-normal text-red-500">（{importErrors.length} 项错误）</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importErrors.map((err, idx) => (
              <div key={idx} className="bg-red-50 rounded-md px-3 py-2 text-xs flex gap-3">
                <span className="text-red-500 shrink-0 w-10">行 {err.row}</span>
                <span className="text-red-500 shrink-0 w-16">{err.field}</span>
                <span className="text-gray-600">{err.reason}</span>
              </div>
            ))}
            <div className="text-xs text-gray-400 pt-1">请修正以上 {importErrors.length} 项错误后重新上传。</div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeImportDialog}>
              取消
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setImportStep('select')
                setSelectedFile(null)
                setFileCheckPassed(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              重新选择文件
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OnlineLayout>
  )
}
