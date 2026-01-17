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

// 设计基准尺寸 (2K 分辨率)
const DESIGN_WIDTH = 2560;
const DESIGN_HEIGHT = 1440;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  parent: 'app',
  transparent: true,
  // backgroundColor: '#050505',
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
    mode: Phaser.Scale.FIT,              // 自动缩放以适应屏幕，保持比例
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'app',
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT
  },
  render: {
    antialias: true,
    antialiasGL: true,
    powerPreference: 'high-performance'
  }
};

// 启动游戏
const game = new Phaser.Game(config);

// 移除手动 Resize 监听，完全依赖 Phaser Scale.FIT
// window.addEventListener('resize', () => {
//   const { width, height, dpr } = getActualSize();
//   // 通知 Phaser 调整游戏尺寸
//   game.scale.resize(width, height);
//   console.log(`[Resolution] Resized to ${width}x${height} @ ${dpr}x DPR`);
// });

// 尝试加载存档
if (gameState.hasSaveData()) {
  console.log('发现存档，尝试加载...');
  gameState.loadGame();
}

// 启动股市行情
stockMarket.startMarket();

export default game;

