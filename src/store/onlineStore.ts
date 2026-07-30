// 线上标注平台原型 - 全局状态（渠道管理 + 风险等级映射）
// 对应 PRD《质检平台优化与标注体验升级》子需求 1/2/3/4/7
import { create } from 'zustand'

// ---------------- 子需求 7：风险等级命名优化 ----------------
// 新命名：低风险错误 < 中风险错误 < 高风险错误(原"严重错误") < 极高风险错误(原"高风险错误")
export type RiskLevel = '低风险错误' | '中风险错误' | '高风险错误' | '极高风险错误'

export const RISK_LEVELS: RiskLevel[] = ['低风险错误', '中风险错误', '高风险错误', '极高风险错误']

// 存量旧命名 -> 新命名 映射表（向后兼容）
export const LEGACY_RISK_LEVEL_MAP: Record<string, RiskLevel> = {
  低风险错误: '低风险错误',
  中风险错误: '中风险错误',
  严重错误: '高风险错误', // 旧"严重错误" -> 新"高风险错误"
  高风险错误: '极高风险错误', // 旧"高风险错误" -> 新"极高风险错误"
  // 兼容旧版"低/中/高风严谨"策略命名
  低风严谨: '低风险错误',
  中风严谨: '中风险错误',
  高风严谨: '高风险错误',
  严重违规: '高风险错误',
}

export function normalizeRiskLevel(raw: string): RiskLevel {
  return LEGACY_RISK_LEVEL_MAP[raw] ?? '低风险错误'
}

export const RISK_LEVEL_STYLE: Record<RiskLevel, { badge: string; dot: string; text: string }> = {
  低风险错误: { badge: 'bg-green-50 text-green-600 border-green-200', dot: 'bg-green-500', text: 'text-green-600' },
  中风险错误: { badge: 'bg-yellow-50 text-yellow-600 border-yellow-200', dot: 'bg-yellow-500', text: 'text-yellow-600' },
  高风险错误: { badge: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-500', text: 'text-orange-600' },
  极高风险错误: { badge: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500', text: 'text-red-600' },
}

export const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  低风险错误: 1,
  中风险错误: 2,
  高风险错误: 3,
  极高风险错误: 4,
}

// ---------------- 子需求 1/2/3：gbot 渠道数据源 ----------------
export interface GbotChannel {
  id: string
  name: string
  projectId: string // 所属项目/游戏
}

export interface GbotProject {
  id: string
  name: string
  channels: GbotChannel[]
}

// mock gbot 接口返回的渠道数据（模拟从 gbot 拉取，替代本地静态维护）
export const MOCK_GBOT_PROJECTS: GbotProject[] = [
  {
    id: 'p_21116',
    name: 'CodeV 无我要玩助手：测量行动(21116)',
    channels: [
      { id: 'sdk', name: 'SDK', projectId: 'p_21116' },
      { id: 'weixin', name: '微信', projectId: 'p_21116' },
      { id: 'qq', name: 'QQ', projectId: 'p_21116' },
    ],
  },
  {
    id: 'p_21200',
    name: '甄选离线质检agent(21200)',
    channels: [
      { id: 'sdk', name: 'SDK', projectId: 'p_21200' },
      { id: 'app', name: 'App', projectId: 'p_21200' },
    ],
  },
  {
    id: 'p_1116',
    name: 'Codixir:测试平台(1116)',
    channels: [
      { id: 'sdk', name: 'SDK', projectId: 'p_1116' },
      { id: 'web', name: 'Web', projectId: 'p_1116' },
      { id: 'mini_program', name: '小程序', projectId: 'p_1116' },
    ],
  },
]

const CURRENT_USER = 'yzhinan'
const CHANNEL_STORAGE_KEY = 'online_channel_memory_v1'

interface ChannelMemoryMap {
  [userKey: string]: {
    [projectId: string]: string // projectId -> channelId
  }
}

function loadChannelMemory(): ChannelMemoryMap {
  try {
    const raw = localStorage.getItem(CHANNEL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveChannelMemory(map: ChannelMemoryMap) {
  try {
    localStorage.setItem(CHANNEL_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

interface OnlineChannelState {
  projects: GbotProject[]
  currentProjectId: string
  currentChannelId: string
  channelLoading: boolean
  channelUpdatedAt: number
  setProject: (projectId: string) => void
  setChannel: (channelId: string) => void
  refreshChannels: () => void
  getCurrentProject: () => GbotProject | undefined
  getCurrentChannel: () => GbotChannel | undefined
}

function getInitialSelection(): { projectId: string; channelId: string } {
  const memory = loadChannelMemory()
  const userMemory = memory[CURRENT_USER] || {}
  const firstProject = MOCK_GBOT_PROJECTS[0]
  // 优先恢复最近一次选择的项目+渠道；否则用第一个项目的第一个渠道
  const rememberedProjectId = Object.keys(userMemory)[0]
  if (rememberedProjectId) {
    const project = MOCK_GBOT_PROJECTS.find((p) => p.id === rememberedProjectId)
    if (project) {
      const rememberedChannelId = userMemory[rememberedProjectId]
      const channel = project.channels.find((c) => c.id === rememberedChannelId)
      return { projectId: project.id, channelId: channel ? channel.id : project.channels[0].id }
    }
  }
  return { projectId: firstProject.id, channelId: firstProject.channels[0].id }
}

const initialSelection = getInitialSelection()

export const useOnlineChannelStore = create<OnlineChannelState>((set, get) => ({
  projects: MOCK_GBOT_PROJECTS,
  currentProjectId: initialSelection.projectId,
  currentChannelId: initialSelection.channelId,
  channelLoading: false,
  channelUpdatedAt: Date.now(),

  // 子需求 3：切换项目时保留当前渠道（若新项目下不存在同名渠道，则回退到该项目下第一个渠道）
  setProject: (projectId: string) => {
    const state = get()
    const project = state.projects.find((p) => p.id === projectId)
    if (!project) return
    const currentChannel = state.projects
      .find((p) => p.id === state.currentProjectId)
      ?.channels.find((c) => c.id === state.currentChannelId)
    const sameNameChannel = currentChannel
      ? project.channels.find((c) => c.name === currentChannel.name)
      : undefined
    const nextChannelId = sameNameChannel ? sameNameChannel.id : project.channels[0].id

    set({ currentProjectId: projectId, currentChannelId: nextChannelId })

    // 子需求 2：记住该用户在该项目下的渠道选择
    const memory = loadChannelMemory()
    memory[CURRENT_USER] = { ...(memory[CURRENT_USER] || {}), [projectId]: nextChannelId }
    saveChannelMemory(memory)
  },

  setChannel: (channelId: string) => {
    const state = get()
    set({ currentChannelId: channelId })
    const memory = loadChannelMemory()
    memory[CURRENT_USER] = { ...(memory[CURRENT_USER] || {}), [state.currentProjectId]: channelId }
    saveChannelMemory(memory)
  },

  // 子需求 1：模拟从 gbot 拉取渠道列表（5 分钟内可见新增渠道，无跨域错误）
  refreshChannels: () => {
    set({ channelLoading: true })
    setTimeout(() => {
      set({ channelLoading: false, channelUpdatedAt: Date.now() })
    }, 600)
  },

  getCurrentProject: () => {
    const state = get()
    return state.projects.find((p) => p.id === state.currentProjectId)
  },
  getCurrentChannel: () => {
    const state = get()
    const project = state.projects.find((p) => p.id === state.currentProjectId)
    return project?.channels.find((c) => c.id === state.currentChannelId)
  },
}))
