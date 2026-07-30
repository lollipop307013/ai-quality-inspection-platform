import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  Sparkles,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Wrench,
  Settings,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useOnlineChannelStore } from '@/store/onlineStore'

interface OnlineLayoutProps {
  children: ReactNode
  subHeader?: ReactNode
  showGlobalSwitch?: boolean
}

// -------------------------------------------------------------------------
// 最左侧：整体平台模块图标栏（AI应用/知识库/质检优化/数据中心/运营工具/系统管理）
// -------------------------------------------------------------------------
const PLATFORM_MODULES = [
  { key: 'ai', icon: Sparkles, label: 'AI 应用' },
  { key: 'kb', icon: BookOpen, label: '知识库' },
  { key: 'quality', icon: ClipboardCheck, label: '质检优化' },
  { key: 'data', icon: BarChart3, label: '数据中心' },
  { key: 'ops', icon: Wrench, label: '运营工具' },
  { key: 'sys', icon: Settings, label: '系统管理' },
]

function PlatformModuleRail() {
  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center shrink-0 py-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 mb-3 shrink-0" />
      <nav className="flex-1 flex flex-col items-center gap-1 w-full">
        {PLATFORM_MODULES.map((m) => {
          const active = m.key === 'quality'
          const Icon = m.icon
          return (
            <button
              key={m.key}
              className={`w-14 flex flex-col items-center gap-1 py-2 rounded-md transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                  active ? 'bg-blue-50' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] leading-none">{m.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

// -------------------------------------------------------------------------
// 右侧：当前模块（质检优化）的功能菜单，渠道选择放在此栏顶部
// -------------------------------------------------------------------------
function ChannelSelector() {
  const [open, setOpen] = useState(false)
  const {
    projects,
    currentProjectId,
    currentChannelId,
    setProject,
    setChannel,
  } = useOnlineChannelStore()

  const currentProject = projects.find((p) => p.id === currentProjectId)
  const currentChannel = currentProject?.channels.find((c) => c.id === currentChannelId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors min-w-0">
          <span className="truncate max-w-[140px]" title={currentProject?.name}>
            {currentProject?.name}
          </span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium shrink-0">{currentChannel?.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="text-[11px] text-gray-400 px-1 pb-1">选择项目</div>
        <div className="space-y-0.5 mb-2 max-h-32 overflow-y-auto">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setProject(project.id)}
              className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                project.id === currentProjectId
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{project.name}</span>
              {project.id === currentProjectId && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-2">
          <div className="text-[11px] text-gray-400 px-1 pb-1">
            选择渠道 <span className="text-gray-300">(来自 gbot，实时同步)</span>
          </div>
          <div className="space-y-0.5">
            {currentProject?.channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setChannel(channel.id)
                  setOpen(false)
                }}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                  channel.id === currentChannelId
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{channel.name}</span>
                {channel.id === currentChannelId && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SidebarLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`block px-3 py-2 text-sm rounded-md transition-colors ${
        active
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )
}

function CollapsibleGroup({
  label,
  defaultOpen,
  children,
}: {
  label: string
  defaultOpen?: boolean
  children?: ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>{label}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  )
}

export default function OnlineLayout({ children, subHeader, showGlobalSwitch }: OnlineLayoutProps) {
  const location = useLocation()
  const [globalSwitchOn, setGlobalSwitchOn] = useState(true)
  const path = location.pathname

  return (
    <div className="flex h-screen bg-gray-50 text-sm overflow-hidden">
      {/* 最左侧：整体平台模块图标栏 */}
      <PlatformModuleRail />

      {/* 右侧：当前模块(质检优化)功能菜单 */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-gray-100 gap-2 min-w-0">
          <span className="text-base font-bold text-gray-900 shrink-0">质检优化</span>
          <span className="text-gray-200 shrink-0">|</span>
          <ChannelSelector />
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          <CollapsibleGroup label="质检中心" defaultOpen>
            <SidebarLink to="/online-quality-analysis" label="质检分析" active={path === '/online-quality-analysis'} />
            <SidebarLink to="/online-quality-standards" label="质检标准配置" active={path === '/online-quality-standards'} />
            <SidebarLink
              to="/online-task-list"
              label="人工质检任务"
              active={path === '/online-task-list' || path.startsWith('/online-annotation-workbench')}
            />
            <SidebarLink to="/online-optimization" label="优化操作台" active={path === '/online-optimization'} />
          </CollapsibleGroup>
          <CollapsibleGroup label="数据洞察" />
          <CollapsibleGroup label="运营工具" />
          <CollapsibleGroup label="系统管理" />
        </nav>
      </aside>

      {/* 主体内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航栏：仅保留全局开关 + 用户信息 */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-4 shrink-0 gap-5">
          {showGlobalSwitch && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>全局质检开关（高危词汇自动检测标准生效）</span>
              <Switch checked={globalSwitchOn} onCheckedChange={setGlobalSwitchOn} />
            </div>
          )}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
              y
            </div>
            <span className="text-gray-700">yzhinan</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </header>

        {subHeader}

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
