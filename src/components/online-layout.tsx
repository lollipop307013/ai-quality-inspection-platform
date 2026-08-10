import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Bot,
  BookOpenText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Compass,
  Database,
  Flag,
  LayoutGrid,
  ScanSearch,
  Sparkles,
  Wrench,
  Settings,
  Check,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useOnlineChannelStore } from '@/store/onlineStore'

interface OnlineLayoutProps {
  children: ReactNode
  subHeader?: ReactNode
  showGlobalSwitch?: boolean
}

function SecondaryNavLink({
  to,
  label,
  active,
}: {
  to: string
  label: string
  active: boolean
}) {
  return (
    <Link
      to={to}
      className={`block h-10 rounded-xl px-4 leading-10 text-[28px] tracking-[0.3px] transition-colors ${
        active
          ? 'bg-[#f5f8ff] text-[#111827] font-semibold'
          : 'text-[#1f2937] hover:bg-[#f7f8fa]'
      }`}
      style={{ fontSize: '28px', transform: 'scale(0.5)', transformOrigin: 'left center', width: '200%' }}
    >
      {label}
    </Link>
  )
}

function PrimaryNavItem({
  icon,
  label,
  active,
}: {
  icon: ReactNode
  label: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      className="w-full flex flex-col items-center gap-1.5 py-2 rounded-xl transition-colors hover:bg-[#edf1f5]"
      title={label}
    >
      <span
        className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
          active ? 'bg-white border-[#dbe3ff] text-[#4f6bff]' : 'bg-white border-[#e8edf3] text-[#3f4a59]'
        }`}
      >
        {icon}
      </span>
      <span className={`text-[12px] ${active ? 'text-[#111827] font-medium' : 'text-[#374151]'}`}>{label}</span>
    </button>
  )
}

function ProjectSelector() {
  const [open, setOpen] = useState(false)
  const { projects, currentProjectId, setProject } = useOnlineChannelStore()
  const currentProject = projects.find((p) => p.id === currentProjectId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-xs hover:border-blue-300 transition-colors">
          <span className="truncate text-gray-900" title={currentProject?.name}>
            {currentProject?.name ?? '选择项目'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="text-[11px] text-gray-400 px-1 pb-1">选择项目</div>
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => {
                setProject(project.id)
                setOpen(false)
              }}
              className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                project.id === currentProjectId ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{project.name}</span>
              {project.id === currentProjectId && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ChannelSelector() {
  const [open, setOpen] = useState(false)
  const { projects, currentProjectId, currentChannelId, setChannel } = useOnlineChannelStore()

  const currentProject = projects.find((p) => p.id === currentProjectId)
  const currentChannel = currentProject?.channels.find((c) => c.id === currentChannelId)

  return (
    <div className="px-2 pb-2">
      <div className="text-[11px] text-[#9ca3af] px-1 mb-1">当前渠道</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[#dbe7ff] bg-[#f5f8ff] text-xs hover:border-[#c9d9ff] transition-colors">
            <span className="truncate text-[#111827]" title={currentChannel?.name}>
              {currentChannel?.name ?? '选择渠道'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5b7cff] shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="text-[11px] text-gray-400 px-1 pb-1">选择渠道</div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {currentProject?.channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setChannel(channel.id)
                  setOpen(false)
                }}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                  channel.id === currentChannelId ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="truncate">{channel.name}</span>
                {channel.id === currentChannelId && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default function OnlineLayout({ children, subHeader, showGlobalSwitch }: OnlineLayoutProps) {
  const location = useLocation()
  const [globalSwitchOn, setGlobalSwitchOn] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const refreshChannels = useOnlineChannelStore((state) => state.refreshChannels)
  const path = location.pathname

  useEffect(() => {
    void refreshChannels()
  }, [refreshChannels])

  const qualityActive =
    path === '/online-quality-analysis' ||
    path === '/online-quality-standards' ||
    path === '/online-task-list' ||
    path.startsWith('/online-annotation-workbench') ||
    path === '/online-optimization'

  return (
    <div className="flex h-screen bg-[#f7f8fa] text-sm overflow-hidden">
      <aside className="h-full bg-white border-r border-[#e9edf2] flex shrink-0">
        <div className="w-[78px] bg-[#f5f7fa] border-r border-[#edf0f3] flex flex-col items-center py-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#e7ebf2] shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center text-[#5b7cff] mb-4">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="w-full px-2 space-y-2">
            <PrimaryNavItem icon={<Bot className="w-4 h-4" />} label="AI 应用" />
            <PrimaryNavItem icon={<BookOpenText className="w-4 h-4" />} label="知识库" />
            <PrimaryNavItem icon={<Flag className="w-4 h-4" />} label="质检优化" active={qualityActive} />
            <PrimaryNavItem icon={<Database className="w-4 h-4" />} label="数据中心" />
            <PrimaryNavItem icon={<Wrench className="w-4 h-4" />} label="运营工具" />
            <PrimaryNavItem icon={<Settings className="w-4 h-4" />} label="系统管理" />
          </div>

          <div className="mt-auto">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="w-9 h-9 rounded-full bg-white border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[#4b5563] hover:bg-[#f9fafb] flex items-center justify-center"
              title={sidebarCollapsed ? '展开导航' : '收起导航'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="w-[236px] bg-white flex flex-col">
            <div className="h-16 px-5 flex items-center justify-between border-b border-[#f0f2f5]">
              <span className="text-[34px] font-semibold text-[#111827]" style={{ fontSize: '34px', transform: 'scale(0.5)', transformOrigin: 'left center', width: '200%' }}>
                质检优化
              </span>
            </div>

            <nav className="px-4 py-4 space-y-2 overflow-y-auto">
              <ChannelSelector />

              <div className="flex items-center justify-between h-9 px-3 text-[#1f2937]">
                <span className="inline-flex items-center gap-2 text-sm">
                  <LayoutGrid className="w-4 h-4 text-[#9aa3af]" />
                  <span className="text-[13px]">质检中心</span>
                </span>
                <ChevronDown className="w-4 h-4 text-[#6b7280]" />
              </div>

              <div className="space-y-1">
                <SecondaryNavLink to="/online-quality-analysis" label="质检分析" active={path === '/online-quality-analysis'} />
                <SecondaryNavLink to="/online-quality-standards" label="质检标准配置" active={path === '/online-quality-standards'} />
                <SecondaryNavLink
                  to="/online-task-list"
                  label="人工质检任务"
                  active={path === '/online-task-list' || path.startsWith('/online-annotation-workbench')}
                />
                <SecondaryNavLink to="/online-optimization" label="优化操作台" active={path === '/online-optimization'} />
              </div>

              <div className="flex items-center justify-between h-9 px-3 mt-3 text-[#1f2937] rounded-lg hover:bg-[#f7f8fa] cursor-pointer">
                <span className="inline-flex items-center gap-2 text-[13px]">
                  <ScanSearch className="w-4 h-4 text-[#9aa3af]" />
                  溯源调优
                </span>
                <ChevronRight className="w-4 h-4 text-[#6b7280]" />
              </div>

              <div className="flex items-center justify-between h-9 px-3 text-[#1f2937] rounded-lg hover:bg-[#f7f8fa] cursor-pointer">
                <span className="inline-flex items-center gap-2 text-[13px]">
                  <Compass className="w-4 h-4 text-[#9aa3af]" />
                  质量洞察
                </span>
                <ChevronRight className="w-4 h-4 text-[#6b7280]" />
              </div>

              <div className="flex items-center justify-between h-9 px-3 text-[#1f2937] rounded-lg hover:bg-[#f7f8fa] cursor-pointer">
                <span className="inline-flex items-center gap-2 text-[13px]">
                  <CircleDashed className="w-4 h-4 text-[#9aa3af]" />
                  工具能力
                </span>
                <ChevronRight className="w-4 h-4 text-[#6b7280]" />
              </div>
            </nav>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="w-64 max-w-full">
            <ProjectSelector />
          </div>
          <div className="flex items-center gap-5">
            {showGlobalSwitch && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>全局质检开关（高危词汇自动检测标准生效）</span>
                <Switch checked={globalSwitchOn} onCheckedChange={setGlobalSwitchOn} />
              </div>
            )}
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">y</div>
              <span className="text-gray-700">yzhinan</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </header>

        {subHeader}

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
