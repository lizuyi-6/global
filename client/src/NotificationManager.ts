/**
 * 全局通知系统
 * Windows 风格的右下角弹窗通知
 */

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: number;
    duration?: number;  // 显示时长（毫秒），默认5000
}

class NotificationManager {
    private notifications: Notification[] = [];
    private maxNotifications = 5;
    private listeners: ((notifications: Notification[]) => void)[] = [];
    private scene: Phaser.Scene | null = null;
    private notificationContainers: Map<string, Phaser.GameObjects.Container> = new Map();

    /**
     * 绑定到 Phaser 场景
     */
    bindScene(scene: Phaser.Scene): void {
        this.scene = scene;
        // 清除旧的通知容器
        this.notificationContainers.forEach(container => container.destroy());
        this.notificationContainers.clear();
    }

    /**
     * 添加通知
     */
    notify(title: string, message: string, type: Notification['type'] = 'info', duration = 8000): string {
        const notification: Notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            message,
            type,
            timestamp: Date.now(),
            duration
        };

        this.notifications.unshift(notification);

        // 限制最大通知数量
        if (this.notifications.length > this.maxNotifications) {
            const removed = this.notifications.pop();
            if (removed) {
                this.removeNotificationUI(removed.id);
            }
        }

        // 显示通知 UI
        this.showNotificationUI(notification);

        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(notification.id);
            }, duration);
        }

        // 通知监听者
        this.listeners.forEach(cb => cb([...this.notifications]));

        return notification.id;
    }

    /**
     * 快捷方法 - 默认显示 8 秒
     */
    info(title: string, message: string, duration = 8000): string {
        return this.notify(title, message, 'info', duration);
    }

    success(title: string, message: string, duration = 10000): string {
        return this.notify(title, message, 'success', duration);
    }

    warning(title: string, message: string, duration = 10000): string {
        return this.notify(title, message, 'warning', duration);
    }

    error(title: string, message: string, duration = 12000): string {
        return this.notify(title, message, 'error', duration);
    }

    /**
     * 关闭通知
     */
    dismiss(id: string): void {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notifications.splice(index, 1);
            this.removeNotificationUI(id);
            this.repositionNotifications();
            this.listeners.forEach(cb => cb([...this.notifications]));
        }
    }

    /**
     * 清除所有通知
     */
    clearAll(): void {
        this.notifications.forEach(n => this.removeNotificationUI(n.id));
        this.notifications = [];
        this.listeners.forEach(cb => cb([]));
    }

    /**
     * 监听通知变化
     */
    onUpdate(callback: (notifications: Notification[]) => void): void {
        this.listeners.push(callback);
    }

    /**
     * 显示通知 UI（右下角弹窗）
     */
    private showNotificationUI(notification: Notification): void {
        if (!this.scene) return;

        const scene = this.scene;
        const index = this.notifications.findIndex(n => n.id === notification.id);
        const y = 680 - index * 90;

        // 创建通知容器
        const container = scene.add.container(1280, y);
        container.setDepth(20000);
        container.setScrollFactor(0);

        // 背景颜色
        const bgColors: { [key: string]: number } = {
            'info': 0x2a4a6a,
            'success': 0x2a5a2a,
            'warning': 0x5a4a2a,
            'error': 0x5a2a2a
        };

        const borderColors: { [key: string]: number } = {
            'info': 0x4a90d9,
            'success': 0x00ff88,
            'warning': 0xffaa00,
            'error': 0xff4444
        };

        // 背景
        const bg = scene.add.rectangle(0, 0, 320, 80, bgColors[notification.type], 0.95);
        bg.setStrokeStyle(2, borderColors[notification.type]);
        bg.setOrigin(1, 1);
        container.add(bg);

        // 图标
        const icons: { [key: string]: string } = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        const icon = scene.add.text(-300, -65, icons[notification.type], {
            fontSize: '20px'
        });
        container.add(icon);

        // 标题
        const title = scene.add.text(-270, -70, notification.title, {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(title);

        // 消息
        const message = scene.add.text(-300, -45, notification.message, {
            fontSize: '12px',
            color: '#cccccc',
            wordWrap: { width: 280 }
        });
        container.add(message);

        // 关闭按钮
        const closeBtn = scene.add.text(-15, -75, '×', {
            fontSize: '18px',
            color: '#888888'
        });
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#888888'));
        closeBtn.on('pointerdown', () => this.dismiss(notification.id));
        container.add(closeBtn);

        // 时间戳
        const timeText = scene.add.text(-300, -15, '刚刚', {
            fontSize: '10px',
            color: '#666666'
        });
        container.add(timeText);

        // 存储容器
        this.notificationContainers.set(notification.id, container);

        // 入场动画：从右侧滑入
        scene.tweens.add({
            targets: container,
            x: 1270,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    /**
     * 移除通知 UI
     */
    private removeNotificationUI(id: string): void {
        const container = this.notificationContainers.get(id);
        if (container && this.scene) {
            // 淡出动画
            this.scene.tweens.add({
                targets: container,
                x: 1400,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    container.destroy();
                    this.notificationContainers.delete(id);
                }
            });
        }
    }

    /**
     * 重新定位所有通知
     */
    private repositionNotifications(): void {
        if (!this.scene) return;

        this.notifications.forEach((notification, index) => {
            const container = this.notificationContainers.get(notification.id);
            if (container) {
                const y = 680 - index * 90;
                this.scene!.tweens.add({
                    targets: container,
                    y: y,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });
    }
}

// 全局单例
export const notificationManager = new NotificationManager();
