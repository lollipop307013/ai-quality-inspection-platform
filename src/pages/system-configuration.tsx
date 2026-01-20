import { useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Download, Upload, MoreHorizontal, FileText, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useGlobalStore, QualityStandard, CategoryDefinition } from '@/store/globalStore'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const severityConfig = {
  '高': { color: 'bg-red-100 text-red-800', label: '高风险错误' },
  '中': { color: 'bg-yellow-100 text-yellow-800', label: '中风险错误' },
  '低': { color: 'bg-green-100 text-green-800', label: '低风险错误' }
}

// 扁平化行数据接口，用于表格渲染
interface FlattenedRow {
  // 层级信息
  dimension: string
  category: string
  subcategory: string
  standard: string
  // 错误码配置项
  item: QualityStandard
  // rowspan 信息
  dimensionRowspan: number
  categoryRowspan: number
  subcategoryRowspan: number
  standardRowspan: number
  // 是否显示该单元格（只有第一行显示）
  showDimension: boolean
  showCategory: boolean
  showSubcategory: boolean
  showStandard: boolean
}

export default function SystemConfiguration() {
  const store = useGlobalStore()
  const allStandards = store.qualityStandards
  const gameChannelConfigs = store.gameChannelConfigs
  const categoryDefinitions = store.categoryDefinitions
  
  // 当前选中的 gameId 和渠道
  const [selectedGameId, setSelectedGameId] = useState('CFM')
  const [selectedChannel, setSelectedChannel] = useState('weixin')
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedStandard, setSelectedStandard] = useState<QualityStandard | null>(null)
  
  // 分类定义说明弹窗状态
  const [showDefinitionDialog, setShowDefinitionDialog] = useState(false)
  const [definitionContext, setDefinitionContext] = useState<{
    level: CategoryDefinition['level']
    dimension: string
    category?: string
    subcategory?: string
    standard?: string
  } | null>(null)
  const [definitionText, setDefinitionText] = useState('')
  const [editingDefinitionId, setEditingDefinitionId] = useState<string | null>(null)
  
  // 新增时的上下文信息（用于同级新增）
  const [addContext, setAddContext] = useState<{
    dimension?: string
    category?: string
    subcategory?: string
    standard?: string
  }>({})
  
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

  // 获取可用的游戏列表
  const availableGames = useMemo(() => {
    const games = new Map<string, string>()
    gameChannelConfigs.forEach(c => games.set(c.gameId, c.gameName))
    return Array.from(games.entries()).map(([id, name]) => ({ id, name }))
  }, [gameChannelConfigs])

  // 获取当前游戏的可用渠道
  const availableChannels = useMemo(() => {
    return gameChannelConfigs
      .filter(c => c.gameId === selectedGameId)
      .map(c => ({ id: c.channel, name: c.channelName }))
  }, [gameChannelConfigs, selectedGameId])

  // 获取指定层级的分类定义
  const getDefinition = (level: CategoryDefinition['level'], dimension: string, category?: string, subcategory?: string, standard?: string): CategoryDefinition | undefined => {
    return store.getCategoryDefinition(selectedGameId, selectedChannel, level, dimension, category, subcategory, standard)
  }

  // 验证错误码格式
  const validateErrorCode = (code: string): boolean => {
    const pattern = /^#([0-9]{2})([0-9]{2})([0-9]{2})$/
    const match = code.match(pattern)
    if (!match) return false
    const [, dim, cat, subcat] = match
    const dimNum = parseInt(dim, 10)
    const catNum = parseInt(cat, 10)
    const subcatNum = parseInt(subcat, 10)
    return dimNum >= 1 && dimNum <= 99 && 
           catNum >= 1 && catNum <= 99 && 
           subcatNum >= 1 && subcatNum <= 99
  }

  // 将扁平数据转换为带 rowspan 信息的行数据
  const flattenedRows = useMemo<FlattenedRow[]>(() => {
    // 先按层级排序
    const sorted = [...allStandards].sort((a, b) => {
      if (a.dimension !== b.dimension) return a.dimension.localeCompare(b.dimension)
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      if (a.subcategory !== b.subcategory) return a.subcategory.localeCompare(b.subcategory)
      if (a.standard !== b.standard) return a.standard.localeCompare(b.standard)
      return a.code.localeCompare(b.code)
    })

    const rows: FlattenedRow[] = []
    
    // 计算每个层级的 rowspan
    const dimensionCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}
    const subcategoryCounts: Record<string, number> = {}
    const standardCounts: Record<string, number> = {}
    
    sorted.forEach(item => {
      const dimKey = item.dimension
      const catKey = `${item.dimension}|${item.category}`
      const subKey = `${item.dimension}|${item.category}|${item.subcategory}`
      const stdKey = `${item.dimension}|${item.category}|${item.subcategory}|${item.standard}`
      
      dimensionCounts[dimKey] = (dimensionCounts[dimKey] || 0) + 1
      categoryCounts[catKey] = (categoryCounts[catKey] || 0) + 1
      subcategoryCounts[subKey] = (subcategoryCounts[subKey] || 0) + 1
      standardCounts[stdKey] = (standardCounts[stdKey] || 0) + 1
    })
    
    // 记录已处理的层级
    const processedDimensions = new Set<string>()
    const processedCategories = new Set<string>()
    const processedSubcategories = new Set<string>()
    const processedStandards = new Set<string>()
    
    sorted.forEach(item => {
      const dimKey = item.dimension
      const catKey = `${item.dimension}|${item.category}`
      const subKey = `${item.dimension}|${item.category}|${item.subcategory}`
      const stdKey = `${item.dimension}|${item.category}|${item.subcategory}|${item.standard}`
      
      const showDimension = !processedDimensions.has(dimKey)
      const showCategory = !processedCategories.has(catKey)
      const showSubcategory = !processedSubcategories.has(subKey)
      const showStandard = !processedStandards.has(stdKey)
      
      if (showDimension) processedDimensions.add(dimKey)
      if (showCategory) processedCategories.add(catKey)
      if (showSubcategory) processedSubcategories.add(subKey)
      if (showStandard) processedStandards.add(stdKey)
      
      rows.push({
        dimension: item.dimension,
        category: item.category,
        subcategory: item.subcategory,
        standard: item.standard,
        item,
        dimensionRowspan: dimensionCounts[dimKey],
        categoryRowspan: categoryCounts[catKey],
        subcategoryRowspan: subcategoryCounts[subKey],
        standardRowspan: standardCounts[stdKey],
        showDimension,
        showCategory,
        showSubcategory,
        showStandard
      })
    })
    
    return rows
  }, [allStandards])

  const handleCreateStandard = () => {
    if (!validateErrorCode(newStandard.code)) {
      alert('错误码格式不正确！格式应为 #XXYYZZ，其中每个部分为01-99之间的数字，例如：#010101')
      return
    }
    
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
    resetForm()
  }

  const handleEditStandard = (standard: QualityStandard) => {
    setSelectedStandard(standard)
    setNewStandard({
      dimension: standard.dimension || '',
      category: standard.category || '',
      subcategory: standard.subcategory || '',
      standard: standard.standard || '',
      code: standard.code || '',
      description: standard.description || '',
      severity: standard.severity || '中',
      channel: standard.channel || '',
      gameType: standard.gameType || '',
      status: standard.status || '启用'
    })
    setShowEditDialog(true)
  }

  const handleUpdateStandard = () => {
    if (!validateErrorCode(newStandard.code)) {
      alert('错误码格式不正确！格式应为 #XXYYZZ，其中每个部分为01-99之间的数字，例如：#010101')
      return
    }

    if (selectedStandard) {
      store.updateQualityStandard(selectedStandard.id, {
        dimension: newStandard.dimension,
        category: newStandard.category,
        subcategory: newStandard.subcategory,
        standard: newStandard.standard,
        code: newStandard.code,
        description: newStandard.description,
        severity: newStandard.severity as '高' | '中' | '低',
        channel: newStandard.channel,
        gameType: newStandard.gameType,
        status: newStandard.status as '启用' | '禁用',
        updatedAt: new Date().toLocaleDateString()
      })
    }
    setShowEditDialog(false)
    setSelectedStandard(null)
    resetForm()
  }

  // 删除单条标准
  const handleDeleteStandard = (standard: QualityStandard) => {
    if (confirm(`确定要删除错误码 "${standard.code}" 吗？`)) {
      store.deleteQualityStandard(standard.id)
    }
  }

  // 级联删除 - 删除指定层级及其下所有数据
  const handleCascadeDelete = (level: 'dimension' | 'category' | 'subcategory' | 'standard', values: {
    dimension: string
    category?: string
    subcategory?: string
    standard?: string
  }) => {
    let message = ''
    let idsToDelete: string[] = []
    
    switch (level) {
      case 'dimension':
        message = `确定要删除维度 "${values.dimension}" 及其下所有数据吗？`
        idsToDelete = allStandards
          .filter(s => s.dimension === values.dimension)
          .map(s => s.id)
        break
      case 'category':
        message = `确定要删除大类 "${values.category}" 及其下所有数据吗？`
        idsToDelete = allStandards
          .filter(s => s.dimension === values.dimension && s.category === values.category)
          .map(s => s.id)
        break
      case 'subcategory':
        message = `确定要删除小类 "${values.subcategory}" 及其下所有数据吗？`
        idsToDelete = allStandards
          .filter(s => s.dimension === values.dimension && s.category === values.category && s.subcategory === values.subcategory)
          .map(s => s.id)
        break
      case 'standard':
        message = `确定要删除标准 "${values.standard}" 及其下所有错误码吗？`
        idsToDelete = allStandards
          .filter(s => s.dimension === values.dimension && s.category === values.category && s.subcategory === values.subcategory && s.standard === values.standard)
          .map(s => s.id)
        break
    }
    
    if (confirm(message)) {
      idsToDelete.forEach(id => store.deleteQualityStandard(id))
    }
  }

  // 同级新增
  const handleAddSameLevel = (context: {
    dimension?: string
    category?: string
    subcategory?: string
    standard?: string
  }) => {
    setAddContext(context)
    setNewStandard({
      dimension: context.dimension || '',
      category: context.category || '',
      subcategory: context.subcategory || '',
      standard: context.standard || '',
      code: '',
      description: '',
      severity: '中',
      channel: '',
      gameType: '',
      status: '启用'
    })
    setShowCreateDialog(true)
  }

  const resetForm = () => {
    setNewStandard({
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
    setAddContext({})
  }

  // 打开分类定义说明弹窗
  const handleOpenDefinitionDialog = (
    level: CategoryDefinition['level'],
    dimension: string,
    category?: string,
    subcategory?: string,
    standard?: string
  ) => {
    const existing = getDefinition(level, dimension, category, subcategory, standard)
    setDefinitionContext({ level, dimension, category, subcategory, standard })
    setDefinitionText(existing?.definition || '')
    setEditingDefinitionId(existing?.id || null)
    setShowDefinitionDialog(true)
  }

  // 保存分类定义说明
  const handleSaveDefinition = () => {
    if (!definitionContext || !definitionText.trim()) return
    
    if (editingDefinitionId) {
      store.updateCategoryDefinition(editingDefinitionId, { definition: definitionText })
    } else {
      const newDef: CategoryDefinition = {
        id: `def_${Date.now()}`,
        gameId: selectedGameId,
        channel: selectedChannel,
        level: definitionContext.level,
        dimension: definitionContext.dimension,
        category: definitionContext.category,
        subcategory: definitionContext.subcategory,
        standard: definitionContext.standard,
        definition: definitionText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: store.currentUser.name
      }
      store.addCategoryDefinition(newDef)
    }
    
    setShowDefinitionDialog(false)
    setDefinitionContext(null)
    setDefinitionText('')
    setEditingDefinitionId(null)
  }

  // 删除分类定义说明
  const handleDeleteDefinition = () => {
    if (editingDefinitionId && confirm('确定要删除这个定义说明吗？')) {
      store.deleteCategoryDefinition(editingDefinitionId)
      setShowDefinitionDialog(false)
      setDefinitionContext(null)
      setDefinitionText('')
      setEditingDefinitionId(null)
    }
  }

  // 获取层级名称
  const getLevelName = (level: CategoryDefinition['level']) => {
    switch (level) {
      case 'dimension': return '维度'
      case 'category': return '大类'
      case 'subcategory': return '小类'
      case 'standard': return '标准'
    }
  }

  // 获取大类定义说明
  const getCategoryDefinitionText = (dimension: string, category: string) => {
    return getDefinition('category', dimension, category)?.definition || ''
  }

  // 获取小类定义说明
  const getSubcategoryDefinitionText = (dimension: string, category: string, subcategory: string) => {
    return getDefinition('subcategory', dimension, category, subcategory)?.definition || ''
  }

  // CSV转义处理
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // 导出为Excel/CSV格式（新增大类定义说明、小类定义说明两列）
  const handleExportStandards = () => {
    // CSV表头
    const headers = [
      '维度', '大类', '大类定义说明', '小类', '小类定义说明', 
      '标准', '错误码', '描述', '严重程度', '状态'
    ]
    
    // 生成CSV数据行
    const rows = allStandards.map(item => [
      escapeCSV(item.dimension),
      escapeCSV(item.category),
      escapeCSV(getCategoryDefinitionText(item.dimension, item.category)),
      escapeCSV(item.subcategory),
      escapeCSV(getSubcategoryDefinitionText(item.dimension, item.category, item.subcategory)),
      escapeCSV(item.standard),
      escapeCSV(item.code),
      escapeCSV(item.description),
      escapeCSV(item.severity),
      escapeCSV(item.status)
    ])
    
    // 添加BOM以支持Excel正确识别UTF-8
    const BOM = '\uFEFF'
    const csvContent = BOM + [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quality-standards.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入CSV/Excel格式（支持大类定义说明、小类定义说明两列）
  const handleImportStandards = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string
            
            // 判断文件类型
            if (file.name.endsWith('.json')) {
              // JSON格式（兼容旧格式）
              const data = JSON.parse(content)
              if (Array.isArray(data)) {
                store.setQualityStandards(data)
                alert('导入成功！')
              }
            } else {
              // CSV格式
              const lines = content.replace(/^\uFEFF/, '').split('\n').filter(line => line.trim())
              if (lines.length < 2) {
                alert('CSV文件格式错误：缺少数据行')
                return
              }
              
              // 解析表头
              const headers = parseCSVLine(lines[0])
              const dimensionIdx = headers.indexOf('维度')
              const categoryIdx = headers.indexOf('大类')
              const categoryDefIdx = headers.indexOf('大类定义说明')
              const subcategoryIdx = headers.indexOf('小类')
              const subcategoryDefIdx = headers.indexOf('小类定义说明')
              const standardIdx = headers.indexOf('标准')
              const codeIdx = headers.indexOf('错误码')
              const descIdx = headers.indexOf('描述')
              const severityIdx = headers.indexOf('严重程度')
              const statusIdx = headers.indexOf('状态')
              
              if (dimensionIdx === -1 || categoryIdx === -1 || subcategoryIdx === -1) {
                alert('CSV文件格式错误：缺少必要列（维度、大类、小类）')
                return
              }
              
              // 解析数据行
              const standards: QualityStandard[] = []
              const categoryDefs: Map<string, string> = new Map() // key: dimension|category
              const subcategoryDefs: Map<string, string> = new Map() // key: dimension|category|subcategory
              
              for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i])
                if (values.length < 3) continue
                
                const dimension = values[dimensionIdx] || ''
                const category = values[categoryIdx] || ''
                const subcategory = values[subcategoryIdx] || ''
                
                // 收集定义说明
                if (categoryDefIdx !== -1 && values[categoryDefIdx]) {
                  const key = `${dimension}|${category}`
                  if (!categoryDefs.has(key)) {
                    categoryDefs.set(key, values[categoryDefIdx])
                  }
                }
                if (subcategoryDefIdx !== -1 && values[subcategoryDefIdx]) {
                  const key = `${dimension}|${category}|${subcategory}`
                  if (!subcategoryDefs.has(key)) {
                    subcategoryDefs.set(key, values[subcategoryDefIdx])
                  }
                }
                
                // 构建质检标准数据
                standards.push({
                  id: `imported-${Date.now()}-${i}`,
                  dimension,
                  category,
                  subcategory,
                  standard: standardIdx !== -1 ? values[standardIdx] || '' : '',
                  code: codeIdx !== -1 ? values[codeIdx] || '' : '',
                  description: descIdx !== -1 ? values[descIdx] || '' : '',
                  severity: (severityIdx !== -1 ? values[severityIdx] : '中') as '高' | '中' | '低',
                  status: (statusIdx !== -1 ? values[statusIdx] : '启用') as '启用' | '禁用',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  creator: 'import'
                })
              }
              
              // 导入质检标准
              store.setQualityStandards(standards)
              
              // 导入定义说明
              categoryDefs.forEach((definition, key) => {
                const [dimension, category] = key.split('|')
                const existing = getDefinition('category', dimension, category)
                if (!existing) {
                  store.addCategoryDefinition({
                    id: `def-${Date.now()}-${Math.random()}`,
                    gameId: selectedGameId,
                    channel: selectedChannel,
                    level: 'category',
                    dimension,
                    category,
                    definition,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    creator: 'import'
                  })
                }
              })
              
              subcategoryDefs.forEach((definition, key) => {
                const [dimension, category, subcategory] = key.split('|')
                const existing = getDefinition('subcategory', dimension, category, subcategory)
                if (!existing) {
                  store.addCategoryDefinition({
                    id: `def-${Date.now()}-${Math.random()}`,
                    gameId: selectedGameId,
                    channel: selectedChannel,
                    level: 'subcategory',
                    dimension,
                    category,
                    subcategory,
                    definition,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    creator: 'import'
                  })
                }
              })
              
              alert(`导入成功！共导入 ${standards.length} 条质检标准，${categoryDefs.size} 个大类定义，${subcategoryDefs.size} 个小类定义`)
            }
          } catch {
            alert('导入失败，请检查文件格式')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  // 解析CSV行（处理引号内的逗号）
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    
    return result
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 面包屑导航 */}
        <div className="text-sm text-gray-500 mb-4">
          首页 / 质检中心 / <span className="text-gray-900">质检标准配置</span>
        </div>

        {/* 页面操作 */}
        <div className="flex justify-between items-center mb-6">
          {/* 左侧：游戏+渠道选择器 */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-600">游戏:</Label>
              <Select value={selectedGameId} onValueChange={(v) => {
                setSelectedGameId(v)
                // 切换游戏时自动选择第一个可用渠道
                const channels = gameChannelConfigs.filter(c => c.gameId === v)
                if (channels.length > 0 && !channels.find(c => c.channel === selectedChannel)) {
                  setSelectedChannel(channels[0].channel)
                }
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableGames.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-600">渠道:</Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableChannels.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="ml-2">
              {categoryDefinitions.filter(d => d.gameId === selectedGameId && d.channel === selectedChannel).length} 个定义
            </Badge>
          </div>
          
          {/* 右侧：导入导出按钮 */}
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleImportStandards}>
              <Upload className="w-4 h-4 mr-2" />
              导入配置
            </Button>
            <Button variant="outline" onClick={handleExportStandards}>
              <Download className="w-4 h-4 mr-2" />
              导出配置
            </Button>
          </div>
        </div>

        {/* 标准列表 - 层级合并表格 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 w-24">维度</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 w-32">大类</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 w-40">小类</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 w-32">标准</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r border-gray-200 min-w-[200px]">错误码配置项</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200 w-24">操作</th>
                </tr>
              </thead>
              <tbody>
                {flattenedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      暂无质检标准数据，请点击导入或手动添加
                    </td>
                  </tr>
                ) : (
                  flattenedRows.map((row, index) => (
                    <tr key={row.item.id} className="hover:bg-gray-50 border-b border-gray-200">
                      {/* 维度列 */}
                      {row.showDimension && (
                        <td 
                          rowSpan={row.dimensionRowspan} 
                          className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 align-top bg-gray-50/50"
                        >
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">{row.dimension}</span>
                              {getDefinition('dimension', row.dimension) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-3 h-3 text-blue-500" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-xs">{getDefinition('dimension', row.dimension)?.definition}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleOpenDefinitionDialog('dimension', row.dimension)}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    {getDefinition('dimension', row.dimension) ? '编辑定义说明' : '添加定义说明'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleCascadeDelete('dimension', { dimension: row.dimension })}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    删除此维度
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleAddSameLevel({ dimension: row.dimension })}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      )}
                      
                      {/* 大类列 */}
                      {row.showCategory && (
                        <td 
                          rowSpan={row.categoryRowspan} 
                          className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 align-top"
                        >
                          <div className="flex items-center justify-between group">
                            <div className="flex-1 min-w-0">
                              <span>{row.category}</span>
                              {/* 定义说明 - 灰色小字备注形式展示在名称下方 */}
                              <div 
                                className="mt-1 text-xs text-gray-400 cursor-pointer hover:text-gray-600 truncate"
                                onClick={() => handleOpenDefinitionDialog('category', row.dimension, row.category)}
                                title={getDefinition('category', row.dimension, row.category)?.definition || '点击添加定义说明'}
                              >
                                {getDefinition('category', row.dimension, row.category)?.definition || (
                                  <span className="italic text-gray-300 hover:text-gray-500">+ 添加定义说明</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 ml-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleOpenDefinitionDialog('category', row.dimension, row.category)}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    {getDefinition('category', row.dimension, row.category) ? '编辑定义说明' : '添加定义说明'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleCascadeDelete('category', { dimension: row.dimension, category: row.category })}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    删除此大类
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleAddSameLevel({ dimension: row.dimension, category: row.category })}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      )}
                      
                      {/* 小类列 */}
                      {row.showSubcategory && (
                        <td 
                          rowSpan={row.subcategoryRowspan} 
                          className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 align-top"
                        >
                          <div className="flex items-center justify-between group">
                            <div className="flex-1 min-w-0">
                              <span>{row.subcategory}</span>
                              {/* 定义说明 - 灰色小字备注形式展示在名称下方 */}
                              <div 
                                className="mt-1 text-xs text-gray-400 cursor-pointer hover:text-gray-600 truncate"
                                onClick={() => handleOpenDefinitionDialog('subcategory', row.dimension, row.category, row.subcategory)}
                                title={getDefinition('subcategory', row.dimension, row.category, row.subcategory)?.definition || '点击添加定义说明'}
                              >
                                {getDefinition('subcategory', row.dimension, row.category, row.subcategory)?.definition || (
                                  <span className="italic text-gray-300 hover:text-gray-500">+ 添加定义说明</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 ml-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleOpenDefinitionDialog('subcategory', row.dimension, row.category, row.subcategory)}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    {getDefinition('subcategory', row.dimension, row.category, row.subcategory) ? '编辑定义说明' : '添加定义说明'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleCascadeDelete('subcategory', { dimension: row.dimension, category: row.category, subcategory: row.subcategory })}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    删除此小类
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleAddSameLevel({ dimension: row.dimension, category: row.category, subcategory: row.subcategory })}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      )}
                      
                      {/* 标准列 */}
                      {row.showStandard && (
                        <td 
                          rowSpan={row.standardRowspan} 
                          className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 align-top"
                        >
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center space-x-1">
                              <span>{row.standard}</span>
                              {getDefinition('standard', row.dimension, row.category, row.subcategory, row.standard) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-3 h-3 text-blue-500" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-xs">{getDefinition('standard', row.dimension, row.category, row.subcategory, row.standard)?.definition}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleOpenDefinitionDialog('standard', row.dimension, row.category, row.subcategory, row.standard)}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    {getDefinition('standard', row.dimension, row.category, row.subcategory, row.standard) ? '编辑定义说明' : '添加定义说明'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleCascadeDelete('standard', { dimension: row.dimension, category: row.category, subcategory: row.subcategory, standard: row.standard })}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    删除此标准
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleAddSameLevel({ dimension: row.dimension, category: row.category, subcategory: row.subcategory, standard: row.standard })}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      )}
                      
                      {/* 错误码配置项 */}
                      <td className="px-4 py-3 text-sm border-r border-gray-200">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {row.item.code}
                            </Badge>
                            <Badge className={severityConfig[row.item.severity as keyof typeof severityConfig]?.color || 'bg-gray-100'}>
                              {severityConfig[row.item.severity as keyof typeof severityConfig]?.label || row.item.severity}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {row.item.description}
                          </div>
                        </div>
                      </td>
                      
                      {/* 操作列 */}
                      <td className="px-4 py-3 text-center border-l border-gray-200">
                        <div className="flex items-center justify-center space-x-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditStandard(row.item)}>
                                <Edit className="w-4 h-4 mr-2" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteStandard(row.item)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleAddSameLevel({ 
                              dimension: row.dimension, 
                              category: row.category, 
                              subcategory: row.subcategory,
                              standard: row.standard
                            })}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 新增标准弹窗 */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新增质检标准</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dimension">维度</Label>
                  <Select 
                    value={newStandard.dimension} 
                    onValueChange={(value) => setNewStandard({...newStandard, dimension: value})}
                    disabled={!!addContext.dimension}
                  >
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
                  <Label htmlFor="category">大类</Label>
                  <Input
                    value={newStandard.category}
                    onChange={(e) => setNewStandard({...newStandard, category: e.target.value})}
                    placeholder="输入大类"
                    disabled={!!addContext.category}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subcategory">小类</Label>
                  <Input
                    value={newStandard.subcategory}
                    onChange={(e) => setNewStandard({...newStandard, subcategory: e.target.value})}
                    placeholder="输入小类"
                    disabled={!!addContext.subcategory}
                  />
                </div>
                <div>
                  <Label htmlFor="standard">标准</Label>
                  <Input
                    value={newStandard.standard}
                    onChange={(e) => setNewStandard({...newStandard, standard: e.target.value})}
                    placeholder="输入标准"
                    disabled={!!addContext.standard}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">错误码</Label>
                  <Input
                    value={newStandard.code}
                    onChange={(e) => setNewStandard({...newStandard, code: e.target.value})}
                    placeholder="格式: #XXYYZZ"
                    maxLength={7}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    格式：#XX(维度)YY(大类)ZZ(小类)，例如：#010101
                  </p>
                </div>
                <div>
                  <Label htmlFor="severity">严重程度</Label>
                  <Select value={newStandard.severity} onValueChange={(value) => setNewStandard({...newStandard, severity: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="高">高风险错误</SelectItem>
                      <SelectItem value="中">中风险错误</SelectItem>
                      <SelectItem value="低">低风险错误</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  value={newStandard.description}
                  onChange={(e) => setNewStandard({...newStandard, description: e.target.value})}
                  placeholder="输入错误码描述"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateStandard} className="bg-blue-600 hover:bg-blue-700">
                  创建
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 编辑标准弹窗 */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑质检标准</DialogTitle>
            </DialogHeader>
            
            {selectedStandard && (
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
                    <Label htmlFor="edit-category">大类</Label>
                    <Input
                      value={newStandard.category}
                      onChange={(e) => setNewStandard({...newStandard, category: e.target.value})}
                      placeholder="输入大类"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-subcategory">小类</Label>
                    <Input
                      value={newStandard.subcategory}
                      onChange={(e) => setNewStandard({...newStandard, subcategory: e.target.value})}
                      placeholder="输入小类"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-standard">标准</Label>
                    <Input
                      value={newStandard.standard}
                      onChange={(e) => setNewStandard({...newStandard, standard: e.target.value})}
                      placeholder="输入标准"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-code">错误码</Label>
                    <Input
                      value={newStandard.code}
                      onChange={(e) => setNewStandard({...newStandard, code: e.target.value})}
                      placeholder="格式: #XXYYZZ"
                      maxLength={7}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-severity">严重程度</Label>
                    <Select value={newStandard.severity} onValueChange={(value) => setNewStandard({...newStandard, severity: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="高">高风险错误</SelectItem>
                        <SelectItem value="中">中风险错误</SelectItem>
                        <SelectItem value="低">低风险错误</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-description">描述</Label>
                  <Textarea
                    value={newStandard.description}
                    onChange={(e) => setNewStandard({...newStandard, description: e.target.value})}
                    placeholder="输入错误码描述"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleUpdateStandard} className="bg-blue-600 hover:bg-blue-700">
                    更新
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 分类定义说明弹窗 */}
        <Dialog open={showDefinitionDialog} onOpenChange={(open) => {
          if (!open) {
            setShowDefinitionDialog(false)
            setDefinitionContext(null)
            setDefinitionText('')
            setEditingDefinitionId(null)
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingDefinitionId ? '编辑' : '添加'}{definitionContext ? getLevelName(definitionContext.level) : ''}定义说明
              </DialogTitle>
            </DialogHeader>
            
            {definitionContext && (
              <div className="space-y-4 py-4">
                {/* 显示当前层级路径 */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">游戏:</span> {selectedGameId}</p>
                    <p><span className="font-medium">渠道:</span> {selectedChannel}</p>
                    <p><span className="font-medium">维度:</span> {definitionContext.dimension}</p>
                    {definitionContext.category && (
                      <p><span className="font-medium">大类:</span> {definitionContext.category}</p>
                    )}
                    {definitionContext.subcategory && (
                      <p><span className="font-medium">小类:</span> {definitionContext.subcategory}</p>
                    )}
                    {definitionContext.standard && (
                      <p><span className="font-medium">标准:</span> {definitionContext.standard}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="definition-text">定义说明</Label>
                  <Textarea
                    id="definition-text"
                    value={definitionText}
                    onChange={(e) => setDefinitionText(e.target.value)}
                    placeholder="输入该分类的定义说明，用于生成质检prompt..."
                    rows={5}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    定义说明将用于生成场景分类prompt和质检prompt
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <div>
                    {editingDefinitionId && (
                      <Button variant="outline" onClick={handleDeleteDefinition} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </Button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setShowDefinitionDialog(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSaveDefinition} className="bg-blue-600 hover:bg-blue-700" disabled={!definitionText.trim()}>
                      保存
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
