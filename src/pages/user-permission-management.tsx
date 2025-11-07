import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Plus, Trash2, Users, Settings, UserPlus, Save, Shield, Menu } from 'lucide-react'
import { toast } from 'sonner'

// 权限分组数据结构
interface PermissionGroup {
  id: string
  name: string
  description: string
  color: string
  userCount: number
  permissions: string[]
  createdAt: string
}

// 用户数据结构
interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  groupId: string
  status: 'active' | 'inactive'
  lastLogin: string
  createdAt: string
}

// 菜单权限配置
interface MenuPermission {
  id: string
  name: string
  path: string
  icon: string
  parentId?: string
  children?: MenuPermission[]
}

// 可用的菜单权限
const availableMenus: MenuPermission[] = [
  {
    id: 'dashboard',
    name: '数据概览',
    path: '/dashboard',
    icon: 'BarChart3'
  },
  {
    id: 'tasks',
    name: '任务管理',
    path: '/tasks',
    icon: 'CheckSquare',
    children: [
      { id: 'task-create', name: '创建任务', path: '/tasks/create', icon: 'Plus' },
      { id: 'task-templates', name: '任务模板', path: '/tasks/templates', icon: 'Template' }
    ]
  },
  {
    id: 'annotation',
    name: '标注工作台',
    path: '/annotation',
    icon: 'Edit3'
  },
  {
    id: 'quality',
    name: '质检管理',
    path: '/quality',
    icon: 'Shield',
    children: [
      { id: 'quality-rules', name: '质检规则', path: '/quality/rules', icon: 'Settings' },
      { id: 'quality-reports', name: '质检报告', path: '/quality/reports', icon: 'FileText' }
    ]
  },
  {
    id: 'users',
    name: '用户管理',
    path: '/users',
    icon: 'Users'
  },
  {
    id: 'system',
    name: '系统设置',
    path: '/system',
    icon: 'Settings'
  }
]

const UserPermissionManagement: React.FC = () => {
  // 权限分组数据
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([
    {
      id: 'admin',
      name: '系统管理员',
      description: '拥有系统所有权限，可以管理用户和系统配置',
      color: 'bg-red-500',
      userCount: 2,
      permissions: ['dashboard', 'tasks', 'task-create', 'task-templates', 'annotation', 'quality', 'quality-rules', 'quality-reports', 'users', 'system'],
      createdAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'manager',
      name: '项目经理',
      description: '可以创建和管理任务，查看质检报告',
      color: 'bg-blue-500',
      userCount: 5,
      permissions: ['dashboard', 'tasks', 'task-create', 'task-templates', 'quality', 'quality-reports'],
      createdAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'annotator',
      name: '标注员',
      description: '主要负责数据标注工作',
      color: 'bg-green-500',
      userCount: 15,
      permissions: ['dashboard', 'annotation'],
      createdAt: '2025-01-01T00:00:00Z'
    }
  ])

  // 用户数据  
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      role: '系统管理员',
      groupId: 'admin',
      status: 'active',
      lastLogin: '2025-01-10T14:30:00Z',
      createdAt: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: '李四',
      email: 'lisi@example.com',
      role: '项目经理',
      groupId: 'manager',
      status: 'active',
      lastLogin: '2025-01-10T10:15:00Z',
      createdAt: '2025-01-02T00:00:00Z'
    },
    {
      id: '3',
      name: '王五',
      email: 'wangwu@example.com',
      role: '标注员',
      groupId: 'annotator',
      status: 'active',
      lastLogin: '2025-01-10T16:45:00Z',
      createdAt: '2025-01-03T00:00:00Z'
    }
  ])

  // 状态管理
  const [selectedGroupId, setSelectedGroupId] = useState<string>('admin')
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false)
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null)

  // 新建分组表单
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500',
    permissions: [] as string[]
  })

  // 新建用户表单
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    groupId: selectedGroupId
  })

  // 获取当前选中分组
  const selectedGroup = permissionGroups.find(g => g.id === selectedGroupId)
  
  // 获取当前分组的用户
  const groupUsers = users.filter(u => u.groupId === selectedGroupId)

  // 处理权限变更
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (!selectedGroup) return

    const updatedPermissions = checked 
      ? [...selectedGroup.permissions, permissionId]
      : selectedGroup.permissions.filter(p => p !== permissionId)

    setPermissionGroups(prev => prev.map(group => 
      group.id === selectedGroupId 
        ? { ...group, permissions: updatedPermissions }
        : group
    ))
  }

  // 创建权限分组
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
      userCount: 0,
      permissions: newGroup.permissions,
      createdAt: new Date().toISOString()
    }

    setPermissionGroups(prev => [...prev, group])
    setNewGroup({ name: '', description: '', color: 'bg-blue-500', permissions: [] })
    setShowCreateGroupDialog(false)
    toast.success('权限分组创建成功')
  }

  // 删除权限分组
  const handleDeleteGroup = (groupId: string) => {
    const group = permissionGroups.find(g => g.id === groupId)
    if (group?.userCount && group.userCount > 0) {
      toast.error('该分组下还有用户，无法删除')
      return
    }

    setPermissionGroups(prev => prev.filter(g => g.id !== groupId))
    if (selectedGroupId === groupId) {
      setSelectedGroupId(permissionGroups[0]?.id || '')
    }
    toast.success('权限分组删除成功')
  }

  // 创建用户
  const handleCreateUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error('请填写完整的用户信息')
      return
    }

    const user: User = {
      id: `user_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || '普通用户',
      groupId: newUser.groupId,
      status: 'active',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    setUsers(prev => [...prev, user])
    
    // 更新分组用户数量
    setPermissionGroups(prev => prev.map(group => 
      group.id === newUser.groupId 
        ? { ...group, userCount: group.userCount + 1 }
        : group
    ))

    setNewUser({ name: '', email: '', role: '', groupId: selectedGroupId })
    setShowCreateUserDialog(false)
    toast.success('用户创建成功')
  }

  // 删除用户
  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    setUsers(prev => prev.filter(u => u.id !== userId))
    
    // 更新分组用户数量
    setPermissionGroups(prev => prev.map(group => 
      group.id === user.groupId 
        ? { ...group, userCount: Math.max(0, group.userCount - 1) }
        : group
    ))

    toast.success('用户删除成功')
  }

  // 渲染菜单权限树
  const renderMenuTree = (menus: MenuPermission[], level = 0) => {
    return menus.map(menu => (
      <div key={menu.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id={menu.id}
            checked={selectedGroup?.permissions.includes(menu.id) || false}
            onCheckedChange={(checked: boolean | 'indeterminate') => handlePermissionChange(menu.id, checked === true)}
          />
          <label htmlFor={menu.id} className="text-sm font-medium cursor-pointer">
            {menu.name}
          </label>
          <Badge variant="outline" className="text-xs">
            {menu.path}
          </Badge>
        </div>
        {menu.children && renderMenuTree(menu.children, level + 1)}
      </div>
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="page-title text-gray-900">用户权限管理</h1>
          <p className="text-gray-600 mt-1">管理用户分组和权限配置</p>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* 左栏 - 权限分组 */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    权限分组
                  </CardTitle>
                  <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>创建权限分组</DialogTitle>
                        <DialogDescription>
                          创建新的权限分组并配置基础信息
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            分组名称 *
                          </label>
                          <Input
                            value={newGroup.name}
                            onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="请输入分组名称"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            分组描述
                          </label>
                          <Input
                            value={newGroup.description}
                            onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="请输入分组描述"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            分组颜色
                          </label>
                          <div className="flex space-x-2">
                            {['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'].map(color => (
                              <div
                                key={color}
                                className={`w-6 h-6 rounded cursor-pointer border-2 ${color} ${
                                  newGroup.color === color ? 'border-gray-800' : 'border-gray-300'
                                }`}
                                onClick={() => setNewGroup(prev => ({ ...prev, color }))}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                            取消
                          </Button>
                          <Button onClick={handleCreateGroup}>
                            <Save className="w-4 h-4 mr-2" />
                            创建
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {permissionGroups.map(group => (
                    <div
                      key={group.id}
                      className={`p-3 mx-3 rounded-lg cursor-pointer transition-colors ${
                        selectedGroupId === group.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${group.color}`} />
                          <span className="font-medium text-sm">{group.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge variant="secondary" className="text-xs">
                            {group.userCount}
                          </Badge>
                          {group.id !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteGroup(group.id)
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {group.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 中栏 - 分组用户 */}
          <div className="col-span-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    分组用户
                    {selectedGroup && (
                      <Badge variant="outline" className="ml-2">
                        {selectedGroup.name}
                      </Badge>
                    )}
                  </CardTitle>
                  <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加用户</DialogTitle>
                        <DialogDescription>
                          向当前分组添加新用户
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            用户姓名 *
                          </label>
                          <Input
                            value={newUser.name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="请输入用户姓名"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            邮箱地址 *
                          </label>
                          <Input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="请输入邮箱地址"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            用户角色
                          </label>
                          <Input
                            value={newUser.role}
                            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                            placeholder="请输入用户角色"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            所属分组
                          </label>
                          <Select 
                            value={newUser.groupId} 
                            onValueChange={(value) => setNewUser(prev => ({ ...prev, groupId: value }))}
                          >
                            <SelectTrigger>
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
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowCreateUserDialog(false)}>
                            取消
                          </Button>
                          <Button onClick={handleCreateUser}>
                            <Save className="w-4 h-4 mr-2" />
                            添加
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {groupUsers.length > 0 ? (
                    groupUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 mx-3 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-gray-600">{user.email}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {user.role}
                              </Badge>
                              <Badge 
                                variant={user.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {user.status === 'active' ? '活跃' : '停用'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>该分组暂无用户</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右栏 - 菜单权限 */}
          <div className="col-span-5">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Menu className="w-5 h-5 mr-2" />
                  菜单权限配置
                  {selectedGroup && (
                    <Badge variant="outline" className="ml-2">
                      {selectedGroup.permissions.length} 项已选择
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  选择该分组用户可以访问的菜单页面
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedGroup ? (
                  <div className="space-y-1 max-h-[calc(100vh-350px)] overflow-y-auto">
                    {renderMenuTree(availableMenus)}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>请先选择一个权限分组</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserPermissionManagement