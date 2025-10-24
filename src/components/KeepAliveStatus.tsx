import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import keepAlive from '../utils/keepAlive';

/**
 * 保活状态指示器组件
 * 显示 CloudStudio 保活服务的运行状态
 */
const KeepAliveStatus: React.FC = () => {
  const [status, setStatus] = useState(keepAlive.getStatus());
  const [lastPing, setLastPing] = useState<Date | null>(null);

  useEffect(() => {
    // 定期更新状态
    const updateStatus = () => {
      setStatus(keepAlive.getStatus());
      if (status.running) {
        setLastPing(new Date());
      }
    };

    // 立即更新一次
    updateStatus();

    // 每30秒更新一次状态
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, [status.running]);

  // 如果不在 CloudStudio 环境，不显示组件
  if (!status.isCloudStudio) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm
        ${status.running 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
        }
      `}>
        {status.running ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>保活中</span>
            {lastPing && (
              <span className="text-xs opacity-75">
                {lastPing.toLocaleTimeString()}
              </span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>已断开</span>
          </>
        )}
        
        {/* 运行指示器 */}
        {status.running && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default KeepAliveStatus;