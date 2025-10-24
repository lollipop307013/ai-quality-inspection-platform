import { useEffect, useState } from 'react';
import keepAlive, { KeepAliveConfig } from '../utils/keepAlive';

/**
 * 保活服务 Hook
 * 提供保活服务的状态管理和控制功能
 */
export const useKeepAlive = (config?: Partial<KeepAliveConfig>) => {
  const [status, setStatus] = useState(keepAlive.getStatus());

  useEffect(() => {
    // 如果提供了配置，更新配置
    if (config) {
      keepAlive.updateConfig(config);
    }

    // 启动保活服务
    keepAlive.start();

    // 定期更新状态
    const statusInterval = setInterval(() => {
      setStatus(keepAlive.getStatus());
    }, 5000);

    // 清理函数
    return () => {
      clearInterval(statusInterval);
      keepAlive.stop();
    };
  }, []);

  // 手动控制函数
  const start = () => {
    keepAlive.start();
    setStatus(keepAlive.getStatus());
  };

  const stop = () => {
    keepAlive.stop();
    setStatus(keepAlive.getStatus());
  };

  const updateConfig = (newConfig: Partial<KeepAliveConfig>) => {
    keepAlive.updateConfig(newConfig);
    setStatus(keepAlive.getStatus());
  };

  return {
    status,
    start,
    stop,
    updateConfig,
    isRunning: status.running,
    isCloudStudio: status.isCloudStudio
  };
};

export default useKeepAlive;