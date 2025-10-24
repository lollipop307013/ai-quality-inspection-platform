/**
 * CloudStudio 沙箱保活工具
 * 定期发送请求防止沙箱休眠
 */

interface KeepAliveConfig {
  interval: number; // 间隔时间（毫秒）
  endpoint?: string; // 自定义端点
  enabled: boolean; // 是否启用
  debug?: boolean; // 调试模式
}

class KeepAliveManager {
  private config: KeepAliveConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isCloudStudio: boolean = false;

  constructor(config: Partial<KeepAliveConfig> = {}) {
    this.config = {
      interval: 4 * 60 * 1000, // 默认4分钟
      endpoint: '/api/health',
      enabled: true,
      debug: false,
      ...config
    };

    // 检测是否在 CloudStudio 环境
    this.detectCloudStudio();
  }

  /**
   * 检测是否在 CloudStudio 环境
   */
  private detectCloudStudio(): void {
    const hostname = window.location.hostname;
    this.isCloudStudio = hostname.includes('cloudstudio') || 
                        hostname.includes('codebuddy') ||
                        hostname.includes('.run');
    
    if (this.config.debug) {
      console.log('[KeepAlive] CloudStudio环境检测:', this.isCloudStudio);
    }
  }

  /**
   * 发送保活请求
   */
  private async sendKeepAliveRequest(): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // 尝试多种保活方式
      const requests = [
        // 1. 发送到自定义健康检查端点
        this.sendHealthCheck(),
        // 2. 发送到根路径
        this.sendRootRequest(),
        // 3. 发送到当前页面
        this.sendCurrentPageRequest()
      ];

      await Promise.allSettled(requests);

      if (this.config.debug) {
        console.log(`[KeepAlive] 保活请求已发送 - ${new Date().toLocaleTimeString()}`);
      }

      // 在页面标题中显示最后保活时间（仅调试模式）
      if (this.config.debug) {
        const originalTitle = document.title.replace(/ \[保活: \d+:\d+:\d+\]/, '');
        document.title = `${originalTitle} [保活: ${new Date().toLocaleTimeString()}]`;
      }

    } catch (error) {
      if (this.config.debug) {
        console.warn('[KeepAlive] 保活请求失败:', error);
      }
    }
  }

  /**
   * 发送健康检查请求
   */
  private async sendHealthCheck(): Promise<void> {
    const response = await fetch(this.config.endpoint!, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'X-Keep-Alive': 'true',
        'Cache-Control': 'no-cache'
      }
    }).catch(() => null);

    // 如果健康检查端点不存在，创建一个虚拟的
    if (!response || !response.ok) {
      // 发送到一个不存在的路径，但仍然会保持连接活跃
      await fetch(`/keep-alive?t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-cache'
      }).catch(() => null);
    }
  }

  /**
   * 发送根路径请求
   */
  private async sendRootRequest(): Promise<void> {
    await fetch(`/?keep-alive=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-cache'
    }).catch(() => null);
  }

  /**
   * 发送当前页面请求
   */
  private async sendCurrentPageRequest(): Promise<void> {
    const currentPath = window.location.pathname;
    await fetch(`${currentPath}?keep-alive=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-cache'
    }).catch(() => null);
  }

  /**
   * 启动保活服务
   */
  public start(): void {
    if (!this.config.enabled) {
      console.log('[KeepAlive] 保活服务已禁用');
      return;
    }

    if (!this.isCloudStudio) {
      if (this.config.debug) {
        console.log('[KeepAlive] 非CloudStudio环境，跳过保活');
      }
      return;
    }

    if (this.intervalId) {
      console.warn('[KeepAlive] 保活服务已在运行');
      return;
    }

    console.log(`[KeepAlive] 启动保活服务，间隔: ${this.config.interval / 1000}秒`);

    // 立即发送一次
    this.sendKeepAliveRequest();

    // 设置定时器
    this.intervalId = setInterval(() => {
      this.sendKeepAliveRequest();
    }, this.config.interval);

    // 页面可见性变化时的处理
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // 页面重新可见时立即发送保活请求
        this.sendKeepAliveRequest();
      }
    });

    // 页面卸载前清理
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
  }

  /**
   * 停止保活服务
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[KeepAlive] 保活服务已停止');
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<KeepAliveConfig>): void {
    const wasRunning = this.intervalId !== null;
    
    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning) {
      this.start();
    }
  }

  /**
   * 获取当前状态
   */
  public getStatus(): { running: boolean; isCloudStudio: boolean; config: KeepAliveConfig } {
    return {
      running: this.intervalId !== null,
      isCloudStudio: this.isCloudStudio,
      config: this.config
    };
  }
}

// 创建全局实例
const keepAlive = new KeepAliveManager({
  interval: 4 * 60 * 1000, // 4分钟
  enabled: true,
  debug: process.env.NODE_ENV === 'development' // 开发环境启用调试
});

// 导出实例和类
export default keepAlive;
export { KeepAliveManager };
export type { KeepAliveConfig };