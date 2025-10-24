import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ClipboardCheck, Target, Users, ArrowLeft } from 'lucide-react';

/**
 * 审核模式测试组件
 * 用于验证审核功能的参数传递和页面跳转
 */
const ReviewModeTest: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  const taskId = searchParams.get('taskId');
  const mode = searchParams.get('mode');
  const annotatorId = searchParams.get('annotatorId');

  const getModeInfo = () => {
    switch (mode) {
      case 'cross':
        return {
          title: '交叉审核模式',
          description: '审核所有标注师的工作，进行交叉验证',
          icon: Target,
          color: 'bg-blue-100 text-blue-800'
        };
      case 'distributed':
        return {
          title: '分散审核模式',
          description: '审核特定标注师的工作',
          icon: Users,
          color: 'bg-green-100 text-green-800'
        };
      default:
        return {
          title: '未知模式',
          description: '无效的审核模式',
          icon: ClipboardCheck,
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const modeInfo = getModeInfo();
  const ModeIcon = modeInfo.icon;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">审核工作台</h1>
          </div>
          <p className="text-gray-600">
            质量审核和交叉验证工作台 - 确保标注质量和一致性
          </p>
        </div>

        {/* 审核信息卡片 */}
        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                审核任务信息
              </CardTitle>
              <CardDescription>
                当前审核任务的详细信息和配置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">任务ID</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm">{taskId || '未指定'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">审核模式</label>
                  <div className="flex items-center gap-2">
                    <ModeIcon className="w-4 h-4" />
                    <Badge className={modeInfo.color}>
                      {modeInfo.title}
                    </Badge>
                  </div>
                </div>

                {annotatorId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">目标标注师</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-mono text-sm">{annotatorId}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">模式说明</h4>
                <p className="text-sm text-gray-600">{modeInfo.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* 功能状态卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>功能集成状态</CardTitle>
              <CardDescription>
                审核功能的各个组件集成状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">路由配置</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">已完成</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">任务中心集成</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">已完成</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">质量管理中心集成</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">已完成</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">侧边栏导航</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">已完成</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">审核工作台界面</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">已存在</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
              <CardDescription>
                如何使用审核功能的详细说明
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">1. 从任务中心进入</h4>
                  <p className="text-sm text-gray-600">
                    在任务中心的任务卡片右上角点击"更多操作"按钮，选择"交叉审核"或"分散审核"
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">2. 从质量管理中心进入</h4>
                  <p className="text-sm text-gray-600">
                    点击"审核工作台"卡片，在弹出的对话框中选择要审核的任务和审核模式
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">3. 从侧边栏导航进入</h4>
                  <p className="text-sm text-gray-600">
                    点击左侧导航栏的"审核工作台"，会跳转到任务中心选择审核任务
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">4. 直接URL访问</h4>
                  <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    /review-workbench?taskId=1&mode=cross&annotatorId=user1
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReviewModeTest;