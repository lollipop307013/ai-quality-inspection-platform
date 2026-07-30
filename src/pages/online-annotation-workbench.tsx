import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import OnlineLayout from '@/components/online-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Search, X, ArrowLeftRight } from 'lucide-react'
import { RiskLevel, RISK_LEVEL_STYLE } from '@/store/onlineStore'

interface RecordItem {
  // 子需求10：originalOrder 记录导入模板中的原始行序，标注顺序/导出顺序均需按该字段排序
  originalOrder: number
  id: number
  time: string
  summary: string
  rawContent: string
  playerMsg: string
  desc: string
  riskLevel: RiskLevel | null // 子需求11：标注完成后自动计算的风险等级，未标注为 null
  isArabic?: boolean // 用于演示子需求8的阿语场景
}

const mockRecords: RecordItem[] = Array.from({ length: 20 }).map((_, idx) => ({
  originalOrder: idx,
  id: idx + 1,
  time: `2026-04-16 ${String(22 - Math.floor(idx / 3)).padStart(2, '0')}:${String(
    26 - (idx % 6) * 4
  ).padStart(2, '0')}:36`,
  summary:
    idx === 0
      ? '事件: 断线重连成功'
      : idx === 1
        ? '充值没到账怎么办'
        : idx === 2
          ? '我的角色被误封了'
          : idx === 3
            ? 'مرحبا، أحتاج مساعدة في الشحن' // 阿语示例问题
            : idx % 5 === 0
              ? '事件: 玩家进入房间'
              : '事件: 玩家发起对局请求',
  rawContent:
    '[{"tpl_type":1,"content":[{"desc_type":"question","content":"[{\\"resource_id\\":\\"2211160196400\\",\\"name\\":\\"card_image\\",\\"image\\":\\"https://cdn.gbot.qq.com/platform/20251029_1761718689_ltcm2p\\",\\"content_type\\":\\"image\\",\\"id\\":null,\\"tool_data\\":null,\\"question\\":null,\\"question_id\\":null,\\"role_list\\":null,\\"isTip\\":0,\\"flag\\":0,\\"url_type\\":\\"duration\\",\\"success_msg\\":null,\\"failed_msg\\":null,\\"package_id\\":null,\\"hot_new_time\\":null,\\"act_type\\":\\"body\\",\\"desc\\":\\"已解锁装甲皮肤\\"}]"}]}]',
  playerMsg: idx === 3 ? 'مرحبا، أحتاج مساعدة في الشحن الخاص بي من فضلك' : '弊你活水',
  desc:
    idx === 3
      ? 'يمكنني مساعدتك في مشكلة الشحن، هل يمكنك تزويدي برقم الطلب؟'
      : '[{"tpl_type":1,"content":[{"desc_type":"question","content":"[{\\"resource_id\\":\\"2211160196400\\",\\"name\\":\\"card_image\\",\\"image\\":\\"https://cdn.gbot.qq.com/platform/20251029_1761718689_ltcm2p\\",\\"content_type\\":\\"image\\",\\"id\\":null,\\"tool_data\\":null,\\"question\\":null,\\"question_id\\":null,\\"role_list\\":null,\\"isTip\\":0,\\"flag\\":0,\\"url_type\\":\\"duration\\",\\"success_msg\\":null,\\"failed_msg\\":null,\\"package_id\\":null,\\"hot_new_time\\":null,\\"act_type\\":\\"body\\",\\"desc\\":\\"已解锁装甲皮肤\\"}]\\",\\"desc\\":\\"","role_list":null,"isTip":0,"flag":0,"url_type":"duration","success_msg":null,"failed_msg":null,"package_id":null,"hot_new_time":null}],"link_list":[{"isTip":0,"flag":0,"url_type":"duration","success_msg":null,"failed_msg":null,"package_id":null,"hot_new_time":null,"word":14}],"role_list":[{"isTip":0,"flag":0,"url_type":"duration","success_msg":null,"failed_msg":null,"package_id":null,"hot_new_time":null,"word":10}]}]',
  // 前 8 条已标注，展示不同风险等级标签；其余未标注
  riskLevel: idx === 0 ? '极高风险错误' : idx === 1 ? '极高风险错误' : idx === 2 ? '高风险错误' : idx === 3 ? '中风险错误' : idx < 8 ? (idx % 2 === 0 ? '低风险错误' : '中风险错误') : null,
  isArabic: idx === 3,
}))

const RISK_BADGE = (level: RiskLevel | null) => {
  if (!level) {
    return <span className="text-[10px] text-gray-300">— 未标注 —</span>
  }
  const style = RISK_LEVEL_STYLE[level]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] shrink-0 ${style.badge}`}>
      <span className={`w-1 h-1 rounded-full ${style.dot}`} />
      {level}
    </span>
  )
}

export default function OnlineAnnotationWorkbench() {
  const { taskId } = useParams()
  const navigate = useNavigate()

  // 子需求10：始终按 originalOrder 排序展示，保证与导入模板行序一致
  const orderedRecords = useMemo(() => [...mockRecords].sort((a, b) => a.originalOrder - b.originalOrder), [])

  const [selectedId, setSelectedId] = useState(orderedRecords[7]?.id ?? orderedRecords[0].id)
  const [tab, setTab] = useState<'all' | 'unmarked' | 'marked'>('unmarked')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const [errorCode, setErrorCode] = useState('')
  const [violationLevel, setViolationLevel] = useState('')
  const [remark, setRemark] = useState('')

  // 子需求8：阿语阅读方向切换（LTR ↔ RTL），刷新前保持，刷新后恢复默认 LTR（不做持久化）
  const [isRtl, setIsRtl] = useState(false)

  const selectedRecord = orderedRecords.find((r) => r.id === selectedId) ?? orderedRecords[0]
  const selectedIndex = orderedRecords.findIndex((r) => r.id === selectedId)

  const goPrev = () => {
    if (selectedIndex > 0) setSelectedId(orderedRecords[selectedIndex - 1].id)
  }
  const goNext = () => {
    if (selectedIndex < orderedRecords.length - 1) setSelectedId(orderedRecords[selectedIndex + 1].id)
  }

  // 子需求9：问题列表模糊搜索（对问题内容/对话文本模糊匹配，实时过滤，不刷新页面）
  const tabFilteredRecords = useMemo(() => {
    if (tab === 'all') return orderedRecords
    if (tab === 'unmarked') return orderedRecords.filter((r) => !r.riskLevel)
    return orderedRecords.filter((r) => !!r.riskLevel)
  }, [orderedRecords, tab])

  const searchedRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return tabFilteredRecords
    return tabFilteredRecords.filter(
      (r) => r.summary.toLowerCase().includes(q) || r.playerMsg.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q)
    )
  }, [tabFilteredRecords, searchQuery])

  const allCount = orderedRecords.length
  const unmarkedCount = orderedRecords.filter((r) => !r.riskLevel).length
  const markedCount = orderedRecords.filter((r) => !!r.riskLevel).length

  return (
    <OnlineLayout showGlobalSwitch={false}>
      <div className="flex flex-col h-full">
        {/* 面包屑/标题栏 */}
        <div className="h-11 bg-white border-b border-gray-200 flex items-center px-4 gap-2 shrink-0">
          <button
            onClick={() => navigate('/online-task-list')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {taskId === 'wsst5' || taskId === 'wsst5-2' ? '瓦手试点5' : 'test'}
          </span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左侧问题列表 */}
          <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-2 border-b border-gray-100 flex items-center gap-1 text-xs">
              {(
                [
                  { key: 'all', label: `全部 ${allCount}` },
                  { key: 'unmarked', label: `待标注 ${unmarkedCount}` },
                  { key: 'marked', label: `已标注 ${markedCount}` },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                    tab === t.key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* 子需求9：搜索框 + 一键清空 */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-7 pr-7 text-[11px]"
                  placeholder="搜索问题内容/对话文本"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {searchedRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-300 text-xs gap-2">
                  <Search className="w-6 h-6" />
                  未找到匹配问题
                </div>
              ) : (
                searchedRecords.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => setSelectedId(record.id)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-50 transition-colors ${
                      selectedId === record.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`text-[11px] truncate ${
                          selectedId === record.id ? 'text-blue-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {record.time}
                      </div>
                      {/* 子需求11：风险等级标签 */}
                      {RISK_BADGE(record.riskLevel)}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate mt-0.5">{record.summary}</div>
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center justify-center gap-1 py-2 border-t border-gray-100 text-[11px] text-gray-400">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-5 h-5 flex items-center justify-center rounded ${
                    page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <span>···</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
              <span className="ml-1">25条/页</span>
            </div>
          </div>

          {/* 中间内容区 */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* 子需求8：对话区域上方变向按钮 */}
            <div className="h-10 border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
              <span className="text-xs text-gray-400">对话详情</span>
              <button
                onClick={() => setIsRtl((v) => !v)}
                title="切换阅读方向 (LTR / RTL)，适用于阿语等从右往左阅读的场景"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-colors ${
                  isRtl
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                变向 {isRtl ? '(RTL)' : ''}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
              <div>
                <pre
                  dir="ltr"
                  className="text-[11px] leading-5 text-gray-500 whitespace-pre-wrap break-all bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto"
                >
                  {selectedRecord.rawContent}
                </pre>
              </div>

              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-xs text-orange-500 font-medium mb-1">玩家:</div>
                <div className="text-sm text-gray-900 bg-orange-50 inline-block px-3 py-1.5 rounded-md">
                  {selectedRecord.playerMsg}
                </div>
                <div className="text-[11px] text-gray-300 mt-1">{selectedRecord.time}</div>
              </div>

              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="text-xs text-blue-500 font-medium mb-1">客服（描述）:</div>
                <div className="text-[11px] leading-5 text-gray-600 whitespace-pre-wrap break-all bg-blue-50/60 rounded-md p-3">
                  {selectedRecord.desc}
                </div>
                <div className="text-[11px] text-gray-300 mt-1">{selectedRecord.time}</div>
              </div>
            </div>

            <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
              <span>open_id: 8698850042786625888</span>
              <span>game_id: 21116</span>
            </div>
          </div>

          {/* 右侧标注面板 */}
          <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0">
            <div className="h-11 flex items-center justify-between px-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">标注</span>
              {/* 子需求11：当前数据风险等级标签展示 */}
              {RISK_BADGE(selectedRecord.riskLevel)}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">错误码</label>
                <Input
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  placeholder="请输入错误码/关键字"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">风险等级选择</label>
                <Select value={violationLevel} onValueChange={setViolationLevel}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="请选择风险等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="低风险错误">低风险错误</SelectItem>
                    <SelectItem value="中风险错误">中风险错误</SelectItem>
                    <SelectItem value="高风险错误">高风险错误</SelectItem>
                    <SelectItem value="极高风险错误">极高风险错误</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">备注</label>
                <Textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="请输入备注(选填)"
                  className="text-xs min-h-24 resize-none"
                  maxLength={200}
                />
                <div className="text-right text-[11px] text-gray-300 mt-1">{remark.length} / 200</div>
              </div>
            </div>
            <div className="border-t border-gray-100 p-3 flex items-center gap-2 shrink-0">
              <Button variant="outline" className="flex-1 h-8 text-xs" onClick={goPrev}>
                上一条
              </Button>
              <Button className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={goNext}>
                下一条
              </Button>
            </div>
          </div>
        </div>
      </div>
    </OnlineLayout>
  )
}
