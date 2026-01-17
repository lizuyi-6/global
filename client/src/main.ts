import Phaser from 'phaser';
import { gameState } from './GameState';
import { GameOverScene } from './scenes/GameOverScene';
import { ImprovedOfficeScene } from './scenes/ImprovedOfficeScene';
import { InterviewScene } from './scenes/InterviewScene';
import { JobHuntScene } from './scenes/JobHuntScene';
import { LandingScene } from './scenes/LandingScene';
import { PhoneScene } from './scenes/PhoneScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResumeEditScene } from './scenes/ResumeEditScene';
import { StockScene } from './scenes/StockScene';
import { TaskGameScene } from './scenes/TaskGameScene';
import { WorkplaceEventScene } from './scenes/WorkplaceEventScene';
import { stockMarket } from './StockMarket';

// 设计基准尺寸
const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;

// 游戏配置 - 使用 FIT 模式保持布局稳定
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  parent: 'app',
  backgroundColor: '#050505',
  pixelArt: false,
  roundPixels: false,
  antialias: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [PreloadScene, LandingScene, ResumeEditScene, JobHuntScene, InterviewScene, ImprovedOfficeScene, PhoneScene, StockScene, TaskGameScene, WorkplaceEventScene, GameOverScene],
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.FIT,           // 保持比例填充
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT
  },
  // 提高渲染分辨率，解决模糊问题 (1280 * 1.5 = 1920, * 2 = 2560)
  // 提高渲染分辨率，解决模糊问题 (Force ultra high res)
  resolution: Math.max(window.devicePixelRatio || 1, 3),
  render: {
    antialias: true,
    antialiasGL: true,
    powerPreference: 'high-performance'
  }
};

// 启动游戏
const game = new Phaser.Game(config);

// 尝试加载存档
if (gameState.hasSaveData()) {
  console.log('发现存档，尝试加载...');
  gameState.loadGame();
}

// 启动股市行情
stockMarket.startMarket();

export default game;
