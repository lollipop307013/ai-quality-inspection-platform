import OnlineLayout from '@/components/online-layout'
import { ChevronDown } from 'lucide-react'

export default function OnlineQualityAnalysis() {
  return (
    <OnlineLayout showGlobalSwitch>
      <div className="flex h-full">
        <div className="w-40 bg-white border-r border-gray-200 shrink-0 py-4 px-2 space-y-1">
          <div className="text-xs text-gray-400 px-2 mb-1 flex items-center gap-1">
            质检中心 <ChevronDown className="w-3 h-3" />
          </div>
          <div className="px-3 py-1.5 text-sm text-blue-600 font-medium bg-blue-50 rounded-md">质检分析</div>
          <div className="px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 cursor-pointer">质检标准配置</div>
          <div className="px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 cursor-pointer">人工质检任务名</div>
          <div className="px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-50 cursor-pointer">优化操作台</div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          质检分析页面（暂未还原，敬请期待）
        </div>
      </div>
    </OnlineLayout>
  )
}
