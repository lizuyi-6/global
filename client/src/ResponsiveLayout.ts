/**
 * 响应式布局工具
 * 提供相对于当前 Camera 尺寸的坐标计算
 */

export interface LayoutHelper {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
}

/**
 * 获取当前场景的布局参数
 * @param scene Phaser 场景对象
 * @returns 布局参数对象
 */
export function getLayout(scene: Phaser.Scene): LayoutHelper {
    const cam = scene.cameras.main;
    return {
        centerX: cam.width / 2,
        centerY: cam.height / 2,
        width: cam.width,
        height: cam.height,
        left: 0,
        right: cam.width,
        top: 0,
        bottom: cam.height
    };
}

// 设计基准尺寸 (用于计算缩放比例)
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

/**
 * 根据设计稿尺寸计算缩放比例
 * 用于相对定位和尺寸缩放
 */
export function getScaleFactors(scene: Phaser.Scene): { scaleX: number; scaleY: number; scale: number } {
    const cam = scene.cameras.main;
    const scaleX = cam.width / DESIGN_WIDTH;
    const scaleY = cam.height / DESIGN_HEIGHT;
    // 使用较小的缩放值以保持纵横比
    const scale = Math.min(scaleX, scaleY);
    return { scaleX, scaleY, scale };
}
