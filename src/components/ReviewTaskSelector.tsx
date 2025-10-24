import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ClipboardCheck, Users, Target, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

// 模拟任务数据
const mockTasks = [
  {
    id: 1,
    name: '客服对话质检任务',
    description: '对客服与用户的对话进行质量检查',
    status: 'running',
    totalCount: 1000,
    completedCount: 750,
    annotators: [
      { id: 'user1', name: '张三', completed: 250 },
      { id: 'user2', name: '李四', completed: 300 },
      { id: 'user3', name: '王五', completed: 200 }
    ],
    createdAt: '2024-01-15',
    deadline: '2024-02-15'
  },
  {
    id: 2,
    name: '智能客服回复审核',
    description: '审核AI客服的自动回复质量',
    status: 'completed',
    totalCount: 500,
    completedCount: 500,
    annotators: [
      { id: 'user4', name: '赵六', completed: 200 },
      { id: 'user5', name: '钱七', completed: 300 }
    ],
    createdAt: '2024-01-10',
    deadline: '2024-01-30'
  },
  {
    id: 3,
    name: '多轮对话标注任务',
    description: '对复杂多轮对话进行标注和质检',
    status: 'paused',
    totalCount: 800,
    completedCount: 400,
    annotators: [
      { id: 'user1', name: '张三', completed: 150 },
      { id: 'user6', name: '孙八', completed: 250 }
    ],
    createdAt: '2024-01-20',
    deadline: '2024-03-01'
  }
];

const statusConfig = {
  running: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: Clock },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
};

interface ReviewTaskSelectorProps {
  trigger?: React.ReactNode;
}

const ReviewTaskSelector: React.FC<ReviewTaskSelectorProps> = ({ trigger }) => {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [reviewMode, setReviewMode] = useState<'cross' | 'distributed'>('cross');
  const [selectedAnnotator, setSelectedAnnotator] = useState<string>('');
  const [open, setOpen] = useState(false);

  const handleStartReview = () => {
    if (!selectedTask) return;

    const params = new URLSearchParams({
      taskId: selectedTask.id.toString(),
      mode: reviewMode
    });

    if (reviewMode === 'distributed' && selectedAnnotator) {
      params.append('annotatorId', selectedAnnotator);
    }

    navigate(`/review-workbench?${params.toString()}`);
    setOpen(false);
  };

  const canReview = (task: any) => {
    return task.status === 'completed' || task.status === 'paused' || task.status === 'running';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            进入审核模式
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            选择审核任务
          </DialogTitle>
          <DialogDescription>
            选择要进行质量审核的任务，支持交叉审核和分散审核两种模式
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 任务列表 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">可审核任务</h3>
            <div className="grid gap-4">
              {mockTasks.filter(canReview).map((task) => {
                const StatusIcon = statusConfig[task.status as keyof typeof statusConfig].icon;
                const progress = Math.round((task.completedCount / task.totalCount) * 100);
                const isSelected = selectedTask?.id === task.id;

                return (
                  <Card 
                    key={task.id} 
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{task.name}</CardTitle>
                          <CardDescription className="mt-1">{task.description}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="w-4 h-4 text-gray-500" />
                          <Badge className={`${statusConfig[task.status as keyof typeof statusConfig].color} px-3 py-1 text-xs font-medium rounded-full`}>
                            {statusConfig[task.status as keyof typeof statusConfig].label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* 进度条 */}
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>完成进度</span>
                            <span>{task.completedCount}/{task.totalCount} ({progress}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* 标注师信息 */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>标注师: {task.annotators.length}人</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>截止: {task.deadline}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 审核配置 */}
          {selectedTask && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">审核配置</h3>
              
              {/* 审核模式选择 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">审核模式</label>
                <Select value={reviewMode} onValueChange={(value: 'cross' | 'distributed') => setReviewMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cross">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <div>
                          <div className="font-medium">交叉审核</div>
                          <div className="text-xs text-gray-500">审核所有标注师的工作，进行交叉验证</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="distributed">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <div>
                          <div className="font-medium">分散审核</div>
                          <div className="text-xs text-gray-500">审核特定标注师的工作</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 标注师选择（分散审核模式） */}
              {reviewMode === 'distributed' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">选择标注师</label>
                  <Select value={selectedAnnotator} onValueChange={setSelectedAnnotator}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择要审核的标注师" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTask.annotators.map((annotator: any) => (
                        <SelectItem key={annotator.id} value={annotator.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{annotator.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              已完成: {annotator.completed}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 开始审核按钮 */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button 
                  onClick={handleStartReview}
                  disabled={reviewMode === 'distributed' && !selectedAnnotator}
                  className="flex items-center gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  开始审核
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewTaskSelector;