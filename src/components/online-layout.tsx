import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  PieChart,
  Wrench,
  Settings,
  Check,
  RefreshCw,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useOnlineChannelStore } from '@/store/onlineStore'

interface OnlineLayoutProps {
  children: ReactNode
  subHeader?: ReactNode
  showGlobalSwitch?: boolean
}

function SidebarLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
        active
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  )
}

function SidebarGroupStatic({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
    </button>
  )
}

// 子需求 4：渠道选择器 —— 从顶部移入左侧"质检中心"菜单区域上方
function ChannelSelector() {
  const [open, setOpen] = useState(false)
  const {
    projects,
    currentProjectId,
    currentChannelId,
    channelLoading,
    setProject,
    setChannel,
    refreshChannels,
  } = useOnlineChannelStore()

  const currentProject = projects.find((p) => p.id === currentProjectId)
  const currentChannel = currentProject?.channels.find((c) => c.id === currentChannelId)

  return (
    <div className="px-1 mb-2">
      <div className="text-[11px] text-gray-400 px-2 mb-1 flex items-center justify-between">
        <span>当前渠道</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            refreshChannels()
          }}
          title="从 gbot 刷新渠道列表"
          className="text-gray-300 hover:text-blue-500 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${channelLoading ? 'animate-spin text-blue-500' : ''}`} />
        </button>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-xs hover:border-blue-300 transition-colors">
            <span className="truncate text-gray-900" title={currentChannel?.name}>
              {currentChannel?.name ?? '选择渠道'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
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
    </div>
  )
}

export default function OnlineLayout({ children, subHeader, showGlobalSwitch }: OnlineLayoutProps) {
  const location = useLocation()
  const [globalSwitchOn, setGlobalSwitchOn] = useState(true)
  const path = location.pathname

  return (
    <div className="flex h-screen bg-gray-50 text-sm overflow-hidden">
      {/* 左侧图标导航 */}
      <aside className="w-48 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-gray-100">
          <span className="text-base font-bold text-gray-900">质检优化</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {/* 子需求4：当前渠道选择入口，位于质检中心菜单区域上方 */}
          <ChannelSelector />

          <div>
            <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400">
              <span className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                质检中心
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 mt-0.5">
              <SidebarLink to="/online-quality-analysis" label="质检分析" active={path === '/online-quality-analysis'} />
              <SidebarLink to="/online-quality-standards" label="质检标准配置" active={path === '/online-quality-standards'} />
              <SidebarLink
                to="/online-task-list"
                label="人工质检任务名"
                active={path === '/online-task-list' || path.startsWith('/online-annotation-workbench')}
              />
              <SidebarLink to="/online-optimization" label="优化操作台" active={path === '/online-optimization'} />
            </div>
          </div>
          <SidebarGroupStatic icon={<PieChart className="w-4 h-4" />} label="数据洞察" />
          <SidebarGroupStatic icon={<Wrench className="w-4 h-4" />} label="运营工具" />
          <SidebarGroupStatic icon={<Settings className="w-4 h-4" />} label="系统管理" />
        </nav>
        <div className="p-2 border-t border-gray-100 flex justify-end">
          <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 右侧主体 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航栏：子需求4改造后仅保留 logo + 用户头像，不再承担渠道选择 */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-900">质检优化</span>
          </div>
          <div className="flex items-center gap-5">
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
          </div>
        </header>

        {subHeader}

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
