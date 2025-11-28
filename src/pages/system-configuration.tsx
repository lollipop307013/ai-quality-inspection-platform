import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Download, Upload, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useGlobalStore } from '@/store/globalStore'

// 维度映射表 - 用于生成错误码
const dimensionCodeMap: Record<string, string> = {
  '对话': '01',
  '业务': '02',
  '技术': '03',
  '合规': '04'
}

// 生成错误码函数
// 格式: #XXYYZZ (XX=维度, YY=大类, ZZ=小类-错误项序号)
const generateErrorCode = (dimension: string, categoryIndex: number, subcategoryIndex: number): string => {
  const dimensionCode = dimensionCodeMap[dimension] || '99'
  const categoryCode = String(categoryIndex).padStart(2, '0')
  const subcategoryCode = String(subcategoryIndex).padStart(2, '0')
  return `#${dimensionCode}${categoryCode}${subcategoryCode}`
}

const severityConfig = {
  '高': { color: 'bg-red-100 text-red-800' },
  '中': { color: 'bg-yellow-100 text-yellow-800' },
  '低': { color: 'bg-green-100 text-green-800' }
}

const statusConfig = {
  '启用': { color: 'bg-green-100 text-green-800' },
  '禁用': { color: 'bg-gray-100 text-gray-800' }
}

export default function SystemConfiguration() {
  // 从全局 store 获取质检标准
  const store = useGlobalStore()
  const allStandards = store.qualityStandards
  
  const [searchQuery, setSearchQuery] = useState('')
  const [dimensionFilter, setDimensionFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gameTypeFilter, setGameTypeFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedStandard, setSelectedStandard] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedItems, setSelectedItems] = useState<string[]>([]) // 改为string[]以匹配id类型
  
  // 新标准表单状态
  const [newStandard, setNewStandard] = useState({
    dimension: '',
    category: '',
    subcategory: '',
    standard: '',
    code: '',
    description: '',
    severity: '中',
    channel: '',
    gameType: '',
    status: '启用'
  })

  // 验证错误码格式
  const validateErrorCode = (code: string): boolean => {
    // 格式: #XXYYZZ，其中每部分都是01-99
    const pattern = /^#([0-9]{2})([0-9]{2})([0-9]{2})$/
    const match = code.match(pattern)
    
    if (!match) return false
    
    const [, dim, cat, subcat] = match
    // 验证每个部分都在01-99范围内
    const dimNum = parseInt(dim, 10)
    const catNum = parseInt(cat, 10)
    const subcatNum = parseInt(subcat, 10)
    
    return dimNum >= 1 && dimNum <= 99 && 
           catNum >= 1 && catNum <= 99 && 
           subcatNum >= 1 && subcatNum <= 99
  }

  // 过滤和搜索
  const filteredStandards = allStandards.filter(standard => {
    const matchesSearch = standard.dimension.includes(searchQuery) ||
                         standard.category.includes(searchQuery) ||
                         standard.subcategory.includes(searchQuery) ||
                         standard.standard.includes(searchQuery) ||
                         standard.code.includes(searchQuery) ||
                         standard.description.includes(searchQuery)
    const matchesDimension = dimensionFilter === 'all' || standard.dimension === dimensionFilter
    const matchesSeverity = severityFilter === 'all' || standard.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || standard.status === statusFilter
    const matchesGameType = gameTypeFilter === 'all' || standard.gameType === gameTypeFilter
    const matchesChannel = channelFilter === 'all' || (!standard.channel || standard.channel === channelFilter)
    
    return matchesSearch && matchesDimension && matchesSeverity && matchesStatus && matchesGameType && matchesChannel
  })

  // 分页
  const totalPages = Math.ceil(filteredStandards.length / pageSize)
  const currentStandards = filteredStandards.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleCreateStandard = () => {
    // 验证错误码格式
    if (!validateErrorCode(newStandard.code)) {
      alert('错误码格式不正确！格式应为 #XXYYZZ，其中每个部分为01-99之间的数字，例如：#010101')
      return
    }
    
    // 添加到 store
    const newId = `std_${Date.now()}`
    store.addQualityStandard({
      id: newId,
      ...newStandard,
      severity: newStandard.severity as '高' | '中' | '低',
      status: newStandard.status as '启用' | '禁用',
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      creator: store.currentUser.name
    })
    
    setShowCreateDialog(false)
    // 重置表单
    setNewStandard({
      dimension: '',
      category: '',
      subcategory: '',
      standard: '',
      code: '',
      description: '',
      severity: '中',
      channel: '',
      gameType: '通用',
      status: '启用'
    })
  }

  const handleEditStandard = (standard: any) => {
    setSelectedStandard(standard)
    setNewStandard({...standard})
    setShowEditDialog(true)
  }

  const handleUpdateStandard = () => {
    console.log('更新质检标准:', selectedStandard.id, newStandard)
    setShowEditDialog(false)
    setSelectedStandard(null)
  }

  const handleDeleteStandard = (standard: any) => {
    if (confirm(`确定要删除质检标准 "${standard.standard}" 吗？`)) {
      console.log('删除质检标准:', standard.id)
    }
  }

  const handleBatchDelete = () => {
    if (selectedItems.length === 0) {
      alert('请先选择要删除的标准')
      return
    }
    if (confirm(`确定要删除选中的 ${selectedItems.length} 个质检标准吗？`)) {
      console.log('批量删除质检标准:', selectedItems)
      setSelectedItems([])
    }
  }

  const handleExportStandards = () => {
    console.log('导出质检标准')
    alert('正在导出质检标准...')
  }

  const handleImportStandards = () => {
    console.log('导入质检标准')
    alert('请选择要导入的文件...')
  }

  const handleSelectAll = () => {
    if (selectedItems.length === currentStandards.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(currentStandards.map(s => s.id))
    }
  }

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="page-title text-gray-900">质检标准配置</h1>
          <p className="text-gray-600 mt-1">管理和配置质检标准体系</p>
        </div>

        {/* 页面操作 */}
        <div className="flex justify-end items-center mb-6">
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleImportStandards}>
              <Upload className="w-4 h-4 mr-2" />
              导入
            </Button>
            <Button variant="outline" onClick={handleExportStandards}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  新增标准
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>新增质检标准</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dimension">维度</Label>
                      <Select value={newStandard.dimension} onValueChange={(value) => setNewStandard({...newStandard, dimension: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择维度" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="对话">对话</SelectItem>
                          <SelectItem value="业务">业务</SelectItem>
                          <SelectItem value="技术">技术</SelectItem>
                          <SelectItem value="合规">合规</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">类别</Label>
                      <Input
                        value={newStandard.category}
                        onChange={(e) => setNewStandard({...newStandard, category: e.target.value})}
                        placeholder="输入类别"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subcategory">子类别</Label>
                      <Input
                        value={newStandard.subcategory}
                        onChange={(e) => setNewStandard({...newStandard, subcategory: e.target.value})}
                        placeholder="输入子类别"
                      />
                    </div>
                    <div>
                      <Label htmlFor="standard">标准名称</Label>
                      <Input
                        value={newStandard.standard}
                        onChange={(e) => setNewStandard({...newStandard, standard: e.target.value})}
                        placeholder="输入标准名称"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">错误码</Label>
                      <Input
                        value={newStandard.code}
                        onChange={(e) => setNewStandard({...newStandard, code: e.target.value})}
                        placeholder="格式: #XXYYZZ (维度-大类-小类)"
                        maxLength={7}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        格式说明：#XX(维度01-99)YY(大类01-99)ZZ(小类01-99)，例如：#010101
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="severity">严重程度</Label>
                      <Select value={newStandard.severity} onValueChange={(value) => setNewStandard({...newStandard, severity: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="高">高</SelectItem>
                          <SelectItem value="中">中</SelectItem>
                          <SelectItem value="低">低</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="channel">适用渠道</Label>
                      <Select value={newStandard.channel || ''} onValueChange={(value) => setNewStandard({...newStandard, channel: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择渠道(可选)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">通用</SelectItem>
                          <SelectItem value="微信">微信</SelectItem>
                          <SelectItem value="QQ">QQ</SelectItem>
                          <SelectItem value="App">App</SelectItem>
                          <SelectItem value="Web">Web</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="gameType">适用游戏</Label>
                      <Select value={newStandard.gameType || ''} onValueChange={(value) => setNewStandard({...newStandard, gameType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择游戏(可选)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">通用</SelectItem>
                          <SelectItem value="CFM">CFM</SelectItem>
                          <SelectItem value="DNF">DNF</SelectItem>
                          <SelectItem value="LOL">LOL</SelectItem>
                          <SelectItem value="QQ飞车">QQ飞车</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">状态</Label>
                      <Select value={newStandard.status} onValueChange={(value) => setNewStandard({...newStandard, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="启用">启用</SelectItem>
                          <SelectItem value="禁用">禁用</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">详细描述</Label>
                    <Textarea
                      value={newStandard.description}
                      onChange={(e) => setNewStandard({...newStandard, description: e.target.value})}
                      placeholder="输入详细描述"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreateStandard} className="bg-blue-600 hover:bg-blue-700">
                      创建标准
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索维度、类别、标准名称、错误码..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={dimensionFilter} onValueChange={setDimensionFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="维度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部维度</SelectItem>
                <SelectItem value="对话">对话</SelectItem>
                <SelectItem value="业务">业务</SelectItem>
                <SelectItem value="技术">技术</SelectItem>
                <SelectItem value="合规">合规</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="严重程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部程度</SelectItem>
                <SelectItem value="高">高</SelectItem>
                <SelectItem value="中">中</SelectItem>
                <SelectItem value="低">低</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="启用">启用</SelectItem>
                <SelectItem value="禁用">禁用</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={gameTypeFilter} onValueChange={setGameTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="游戏类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部游戏</SelectItem>
                <SelectItem value="通用">通用</SelectItem>
                <SelectItem value="CFM">CFM</SelectItem>
                <SelectItem value="DNF">DNF</SelectItem>
                <SelectItem value="LOL">LOL</SelectItem>
                <SelectItem value="QQ飞车">QQ飞车</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="渠道" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部渠道</SelectItem>
                <SelectItem value="企微私人好友">企微私人好友</SelectItem>
                <SelectItem value="QQ私人好友">QQ私人好友</SelectItem>
                <SelectItem value="SDK">SDK</SelectItem>
                <SelectItem value="游戏内H5">游戏内H5</SelectItem>
                <SelectItem value="小程序">小程序</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                共 {filteredStandards.length} 个标准
              </div>
              {selectedItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  批量删除 ({selectedItems.length})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 标准列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedItems.length === currentStandards.length && currentStandards.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">错误码</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标准层级</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">严重程度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新信息</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentStandards.map((standard) => (
                  <tr key={standard.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedItems.includes(standard.id)}
                        onCheckedChange={() => handleSelectItem(standard.id)}
                      />
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {standard.code}
                        </Badge>
                        <span className="text-xs text-gray-500">#{standard.id}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">{standard.standard}</div>
                        <div className="text-xs text-gray-500">
                          {standard.dimension} {'>'} {standard.category} {'>'} {standard.subcategory}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={standard.description}>
                        {standard.description}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <Badge className={severityConfig[standard.severity as keyof typeof severityConfig].color}>
                        {standard.severity}
                      </Badge>
                    </td>
                    
                    <td className="px-6 py-4">
                      <Badge className={statusConfig[standard.status as keyof typeof statusConfig].color}>
                        {standard.status}
                      </Badge>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs text-gray-500">
                        <div>创建: {standard.createdAt}</div>
                        <div>更新: {standard.updatedAt}</div>
                        <div>创建人: {standard.creator}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStandard(standard)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStandard(standard)}>
                              <Edit className="w-4 h-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteStandard(standard)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 分页控制 */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">每页显示:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(Number(value))
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">
                显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredStandards.length)} 条，共 {filteredStandards.length} 条
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </div>

        {/* 编辑标准弹窗 */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑质检标准</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-dimension">维度</Label>
                  <Select value={newStandard.dimension} onValueChange={(value) => setNewStandard({...newStandard, dimension: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择维度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="对话">对话</SelectItem>
                      <SelectItem value="业务">业务</SelectItem>
                      <SelectItem value="技术">技术</SelectItem>
                      <SelectItem value="合规">合规</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-category">类别</Label>
                  <Input
                    value={newStandard.category}
                    onChange={(e) => setNewStandard({...newStandard, category: e.target.value})}
                    placeholder="输入类别"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-subcategory">子类别</Label>
                  <Input
                    value={newStandard.subcategory}
                    onChange={(e) => setNewStandard({...newStandard, subcategory: e.target.value})}
                    placeholder="输入子类别"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-standard">标准名称</Label>
                  <Input
                    value={newStandard.standard}
                    onChange={(e) => setNewStandard({...newStandard, standard: e.target.value})}
                    placeholder="输入标准名称"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-code">错误码</Label>
                  <Input
                    value={newStandard.code}
                    onChange={(e) => setNewStandard({...newStandard, code: e.target.value})}
                    placeholder="格式: #XXYYZZ (维度-大类-小类)"
                    maxLength={7}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    格式说明：#XX(维度01-99)YY(大类01-99)ZZ(小类01-99)，例如：#010101
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit-severity">严重程度</Label>
                  <Select value={newStandard.severity} onValueChange={(value) => setNewStandard({...newStandard, severity: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="高">高</SelectItem>
                      <SelectItem value="中">中</SelectItem>
                      <SelectItem value="低">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-channel">适用渠道</Label>
                  <Select value={newStandard.channel || ''} onValueChange={(value) => setNewStandard({...newStandard, channel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择渠道(可选)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">通用</SelectItem>
                      <SelectItem value="微信">微信</SelectItem>
                      <SelectItem value="QQ">QQ</SelectItem>
                      <SelectItem value="App">App</SelectItem>
                      <SelectItem value="Web">Web</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-gameType">适用游戏</Label>
                  <Select value={newStandard.gameType || ''} onValueChange={(value) => setNewStandard({...newStandard, gameType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择游戏(可选)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">通用</SelectItem>
                      <SelectItem value="CFM">CFM</SelectItem>
                      <SelectItem value="DNF">DNF</SelectItem>
                      <SelectItem value="LOL">LOL</SelectItem>
                      <SelectItem value="QQ飞车">QQ飞车</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">状态</Label>
                  <Select value={newStandard.status} onValueChange={(value) => setNewStandard({...newStandard, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="启用">启用</SelectItem>
                      <SelectItem value="禁用">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">详细描述</Label>
                <Textarea
                  value={newStandard.description}
                  onChange={(e) => setNewStandard({...newStandard, description: e.target.value})}
                  placeholder="输入详细描述"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdateStandard} className="bg-blue-600 hover:bg-blue-700">
                  更新标准
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
