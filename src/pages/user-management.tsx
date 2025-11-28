import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Label } from '../components/ui/label'
import { Plus, Edit, Trash2, Users, Settings, UserPlus, X, Save, Shield, Search, Key, UserCheck, Building2 } from 'lucide-react'
import { toast } from 'sonner'

// 权限分组数据结构
interface PermissionGroup {
  id: string
  name: string
  description: string
  color: string
  permissions: string[]
  createdAt: string
}

// 内部员工数据结构
interface InternalEmployee {
  id: string
  rtxAccount: string
  name: string
  groupId: string
  status: 'active' | 'inactive'
  addedAt: string
}

// 外部账号数据结构
interface ExternalAccount {
  id: string
  username: string
  password: string
  realName: string
  groupId: string
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
}

// 菜单权限配置
interface MenuPermission {
  id: string
  name: string
  path: string
  icon?: string
}

// 可用的导航菜单列表
const availableMenus: MenuPermission[] = [
  { id: 'dashboard', name: '数据概览', path: '/' },
  { id: 'annotation-workbench', name: '标注工作台', path: '/annotation-workbench' },
  { id: 'task-center', name: '标注任务中心', path: '/task-center' },
  { id: 'task-creation', name: '创建任务', path: '/task-creation' },
  { id: 'quality-standards', name: '质检规则', path: '/quality-standards' },
  { id: 'task-template-management', name: '任务模板管理', path: '/task-template-management' },
  { id: 'annotation-type-management', name: '标注类型管理', path: '/annotation-type-management' },
  { id: 'user-management', name: '用户管理', path: '/user-management' },
  { id: 'system-config', name: '系统配置', path: '/system-configuration' },
]

const UserManagement: React.FC = () => {
  // Tab状态
  const [activeTab, setActiveTab] = useState('groups')

  // ========== 权限分组相关状态 ==========
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([
    {
      id: 'admin',
      name: '系统管理员',
      description: '拥有系统所有权限',
      color: 'bg-red-500',
      permissions: ['dashboard', 'annotation-workbench', 'task-center', 'task-creation', 'quality-standards', 'task-template-management', 'annotation-type-management', 'user-management', 'system-config'],
      createdAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'manager',
      name: '项目经理',
      description: '可以创建和管理任务',
      color: 'bg-blue-500',
      permissions: ['dashboard', 'annotation-workbench', 'task-center', 'task-creation', 'quality-standards', 'task-template-management'],
      createdAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'annotator',
      name: '标注员',
      description: '负责数据标注工作',
      color: 'bg-green-500',
      permissions: ['dashboard', 'annotation-workbench'],
      createdAt: '2025-01-01T00:00:00Z'
    }
  ])

  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500',
    permissions: [] as string[]
  })

  // ========== 内部员工相关状态 ==========
  const [internalEmployees, setInternalEmployees] = useState<InternalEmployee[]>([
    {
      id: '1',
      rtxAccount: 'zhangsan',
      name: '张三',
      groupId: 'admin',
      status: 'active',
      addedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      rtxAccount: 'lisi',
      name: '李四',
      groupId: 'manager',
      status: 'active',
      addedAt: '2025-01-02T00:00:00Z'
    },
    {
      id: '3',
      rtxAccount: 'wangwu',
      name: '王五',
      groupId: 'annotator',
      status: 'active',
      addedAt: '2025-01-03T00:00:00Z'
    }
  ])

  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    rtxAccount: '',
    name: '',
    groupId: 'annotator'
  })
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('')

  // ========== 外部账号相关状态 ==========
  const [externalAccounts, setExternalAccounts] = useState<ExternalAccount[]>([
    {
      id: '1',
      username: 'external001',
      password: '******',
      realName: '赵六',
      groupId: 'annotator',
      status: 'active',
      createdAt: '2025-01-05T00:00:00Z',
      lastLogin: '2025-01-10T14:30:00Z'
    },
    {
      id: '2',
      username: 'external002',
      password: '******',
      realName: '孙七',
      groupId: 'annotator',
      status: 'active',
      createdAt: '2025-01-06T00:00:00Z',
      lastLogin: '2025-01-09T10:15:00Z'
    }
  ])

  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ExternalAccount | null>(null)
  const [newAccount, setNewAccount] = useState({
    username: '',
    password: '',
    realName: '',
    groupId: 'annotator'
  })
  const [accountSearchTerm, setAccountSearchTerm] = useState('')

  // ========== 权限分组管理函数 ==========
  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast.error('请输入分组名称')
      return
    }

    const group: PermissionGroup = {
      id: `group_${Date.now()}`,
      name: newGroup.name,
      description: newGroup.description,
      color: newGroup.color,
      permissions: newGroup.permissions,
      createdAt: new Date().toISOString()
    }

    setPermissionGroups(prev => [...prev, group])
    setNewGroup({ name: '', description: '', color: 'bg-blue-500', permissions: [] })
    setShowCreateGroupDialog(false)
    toast.success('权限分组创建成功')
  }

  const handleEditGroup = (group: PermissionGroup) => {
    setEditingGroup(group)
    setNewGroup({
      name: group.name,
      description: group.description,
      color: group.color,
      permissions: group.permissions
    })
    setShowCreateGroupDialog(true)
  }

  const handleUpdateGroup = () => {
    if (!editingGroup) return

    setPermissionGroups(prev => prev.map(g => 
      g.id === editingGroup.id 
        ? { ...g, ...newGroup }
        : g
    ))
    
    setEditingGroup(null)
    setNewGroup({ name: '', description: '', color: 'bg-blue-500', permissions: [] })
    setShowCreateGroupDialog(false)
    toast.success('权限分组更新成功')
  }

  const handleDeleteGroup = (groupId: string) => {
    // 检查是否有用户使用该分组
    const hasEmployees = internalEmployees.some(e => e.groupId === groupId)
    const hasAccounts = externalAccounts.some(a => a.groupId === groupId)
    
    if (hasEmployees || hasAccounts) {
      toast.error('该分组下还有用户，无法删除')
      return
    }

    setPermissionGroups(prev => prev.filter(g => g.id !== groupId))
    toast.success('权限分组删除成功')
  }

  const handlePermissionToggle = (permissionId: string) => {
    setNewGroup(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  // ========== 内部员工管理函数 ==========
  const handleAddEmployee = () => {
    if (!newEmployee.rtxAccount.trim() || !newEmployee.name.trim()) {
      toast.error('请填写RTX账号和姓名')
      return
    }

    // 检查RTX账号是否已存在
    if (internalEmployees.some(e => e.rtxAccount === newEmployee.rtxAccount)) {
      toast.error('该RTX账号已存在')
      return
    }

    const employee: InternalEmployee = {
      id: `emp_${Date.now()}`,
      rtxAccount: newEmployee.rtxAccount,
      name: newEmployee.name,
      groupId: newEmployee.groupId,
      status: 'active',
      addedAt: new Date().toISOString()
    }

    setInternalEmployees(prev => [...prev, employee])
    setNewEmployee({ rtxAccount: '', name: '', groupId: 'annotator' })
    setShowAddEmployeeDialog(false)
    toast.success('内部员工添加成功')
  }

  const handleDeleteEmployee = (employeeId: string) => {
    setInternalEmployees(prev => prev.filter(e => e.id !== employeeId))
    toast.success('员工已移除')
  }

  const handleToggleEmployeeStatus = (employeeId: string) => {
    setInternalEmployees(prev => prev.map(e => 
      e.id === employeeId 
        ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' }
        : e
    ))
  }

  const filteredEmployees = internalEmployees.filter(e => 
    e.rtxAccount.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    e.name.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  )

  // ========== 外部账号管理函数 ==========
  const handleCreateAccount = () => {
    if (!newAccount.username.trim() || !newAccount.password.trim() || !newAccount.realName.trim()) {
      toast.error('请填写完整的账号信息')
      return
    }

    // 检查用户名是否已存在
    if (externalAccounts.some(a => a.username === newAccount.username)) {
      toast.error('该用户名已存在')
      return
    }

    const account: ExternalAccount = {
      id: `ext_${Date.now()}`,
      username: newAccount.username,
      password: newAccount.password,
      realName: newAccount.realName,
      groupId: newAccount.groupId,
      status: 'active',
      createdAt: new Date().toISOString()
    }

    setExternalAccounts(prev => [...prev, account])
    setNewAccount({ username: '', password: '', realName: '', groupId: 'annotator' })
    setShowCreateAccountDialog(false)
    toast.success('外部账号创建成功')
  }

  const handleEditAccount = (account: ExternalAccount) => {
    setEditingAccount(account)
    setNewAccount({
      username: account.username,
      password: account.password,
      realName: account.realName,
      groupId: account.groupId
    })
    setShowCreateAccountDialog(true)
  }

  const handleUpdateAccount = () => {
    if (!editingAccount) return

    setExternalAccounts(prev => prev.map(a => 
      a.id === editingAccount.id 
        ? { ...a, ...newAccount }
        : a
    ))
    
    setEditingAccount(null)
    setNewAccount({ username: '', password: '', realName: '', groupId: 'annotator' })
    setShowCreateAccountDialog(false)
    toast.success('外部账号更新成功')
  }

  const handleDeleteAccount = (accountId: string) => {
    setExternalAccounts(prev => prev.filter(a => a.id !== accountId))
    toast.success('外部账号删除成功')
  }

  const handleToggleAccountStatus = (accountId: string) => {
    setExternalAccounts(prev => prev.map(a => 
      a.id === accountId 
        ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' }
        : a
    ))
  }

  const handleResetPassword = (accountId: string) => {
    const newPassword = Math.random().toString(36).slice(-8)
    setExternalAccounts(prev => prev.map(a => 
      a.id === accountId 
        ? { ...a, password: newPassword }
        : a
    ))
    toast.success(`密码已重置为: ${newPassword}`)
  }

  const filteredAccounts = externalAccounts.filter(a => 
    a.username.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
    a.realName.toLowerCase().includes(accountSearchTerm.toLowerCase())
  )

  // 获取分组名称
  const getGroupName = (groupId: string) => {
    return permissionGroups.find(g => g.id === groupId)?.name || '未知分组'
  }

  // 获取分组颜色
  const getGroupColor = (groupId: string) => {
    return permissionGroups.find(g => g.id === groupId)?.color || 'bg-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="page-title text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-1">管理内外部人员权限和账号</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              分组权限管理
            </TabsTrigger>
            <TabsTrigger value="internal" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              内部员工白名单
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              外部账号管理
            </TabsTrigger>
          </TabsList>

          {/* ========== 分组权限管理 ========== */}
          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>权限分组</CardTitle>
                    <CardDescription>创建和管理权限分组，为不同角色配置相应权限</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEditingGroup(null)
                    setNewGroup({ name: '', description: '', color: 'bg-blue-500', permissions: [] })
                    setShowCreateGroupDialog(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    新建分组
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissionGroups.map(group => (
                    <Card key={group.id} className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${group.color}`} />
                            <div>
                              <CardTitle className="text-base">{group.name}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {group.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditGroup(group)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id)}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">
                            可访问菜单: {group.permissions.length}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {group.permissions.slice(0, 3).map(menuId => {
                              const menu = availableMenus.find(m => m.id === menuId)
                              return menu ? (
                                <Badge key={menuId} variant="secondary" className="text-xs">
                                  {menu.name}
                                </Badge>
                              ) : null
                            })}
                            {group.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.permissions.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== 内部员工白名单 ========== */}
          <TabsContent value="internal" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>内部员工白名单</CardTitle>
                    <CardDescription>管理使用RTX账号登录的内部员工</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="搜索RTX账号或姓名"
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button onClick={() => setShowAddEmployeeDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加员工
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RTX账号</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>权限分组</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>添加时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map(employee => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.rtxAccount}</TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>
                          <Badge className={getGroupColor(employee.groupId)}>
                            {getGroupName(employee.groupId)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status === 'active' ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(employee.addedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleEmployeeStatus(employee.id)}
                            >
                              {employee.status === 'active' ? '禁用' : '启用'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== 外部账号管理 ========== */}
          <TabsContent value="external" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>外部账号管理</CardTitle>
                    <CardDescription>创建和管理外部人员的登录账号</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="搜索用户名、姓名或组织"
                        value={accountSearchTerm}
                        onChange={(e) => setAccountSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button onClick={() => {
                      setEditingAccount(null)
                      setNewAccount({ username: '', password: '', realName: '', groupId: 'annotator' })
                      setShowCreateAccountDialog(true)
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      创建账号
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户名</TableHead>
                      <TableHead>使用者姓名</TableHead>
                      <TableHead>权限分组</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>最后登录</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map(account => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.username}</TableCell>
                        <TableCell>{account.realName}</TableCell>
                        <TableCell>
                          <Badge className={getGroupColor(account.groupId)}>
                            {getGroupName(account.groupId)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                            {account.status === 'active' ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {account.lastLogin ? new Date(account.lastLogin).toLocaleDateString() : '从未登录'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPassword(account.id)}
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAccountStatus(account.id)}
                            >
                              {account.status === 'active' ? '禁用' : '启用'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ========== 创建/编辑权限分组对话框 ========== */}
        <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGroup ? '编辑权限分组' : '创建权限分组'}</DialogTitle>
              <DialogDescription>
                配置分组的基本信息和权限
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">分组名称</Label>
                <Input
                  id="group-name"
                  placeholder="例如：标注员、质检员"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">分组描述</Label>
                <Input
                  id="group-description"
                  placeholder="描述该分组的职责"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>分组颜色</Label>
                <div className="flex gap-2">
                  {['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${color} ${newGroup.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      onClick={() => setNewGroup({ ...newGroup, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>菜单权限配置</Label>
                <p className="text-xs text-gray-500 mb-2">选择该分组可以访问的导航菜单</p>
                <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                  {availableMenus.map(menu => (
                    <div key={menu.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={menu.id}
                        checked={newGroup.permissions.includes(menu.id)}
                        onCheckedChange={() => handlePermissionToggle(menu.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={menu.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {menu.name}
                        </label>
                        <p className="text-xs text-gray-500">{menu.path}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                取消
              </Button>
              <Button onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}>
                {editingGroup ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========== 添加内部员工对话框 ========== */}
        <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加内部员工</DialogTitle>
              <DialogDescription>
                添加使用RTX账号登录的内部员工到白名单
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rtx-account">RTX账号 *</Label>
                <Input
                  id="rtx-account"
                  placeholder="输入RTX账号"
                  value={newEmployee.rtxAccount}
                  onChange={(e) => setNewEmployee({ ...newEmployee, rtxAccount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee-name">姓名 *</Label>
                <Input
                  id="employee-name"
                  placeholder="输入员工姓名"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee-group">权限分组</Label>
                <Select
                  value={newEmployee.groupId}
                  onValueChange={(value) => setNewEmployee({ ...newEmployee, groupId: value })}
                >
                  <SelectTrigger id="employee-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddEmployeeDialog(false)}>
                取消
              </Button>
              <Button onClick={handleAddEmployee}>
                添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========== 创建/编辑外部账号对话框 ========== */}
        <Dialog open={showCreateAccountDialog} onOpenChange={setShowCreateAccountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? '编辑外部账号' : '创建外部账号'}</DialogTitle>
              <DialogDescription>
                为外部人员创建登录账号
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名 *</Label>
                <Input
                  id="username"
                  placeholder="输入登录用户名"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                  disabled={!!editingAccount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="输入登录密码"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="real-name">使用者姓名 *</Label>
                <Input
                  id="real-name"
                  placeholder="输入使用者真实姓名"
                  value={newAccount.realName}
                  onChange={(e) => setNewAccount({ ...newAccount, realName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-group">权限分组</Label>
                <Select
                  value={newAccount.groupId}
                  onValueChange={(value) => setNewAccount({ ...newAccount, groupId: value })}
                >
                  <SelectTrigger id="account-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateAccountDialog(false)}>
                取消
              </Button>
              <Button onClick={editingAccount ? handleUpdateAccount : handleCreateAccount}>
                {editingAccount ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default UserManagement
