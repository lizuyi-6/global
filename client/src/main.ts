import Phaser from 'phaser';
import { gameState } from './GameState';
import { GameOverScene } from './scenes/GameOverScene';
import { ImprovedOfficeScene } from './scenes/ImprovedOfficeScene';
import { InterviewScene } from './scenes/InterviewScene';
import { JobHuntScene } from './scenes/JobHuntScene';
import { PhoneScene } from './scenes/PhoneScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResumeEditScene } from './scenes/ResumeEditScene';
import { StockScene } from './scenes/StockScene';
import { TaskGameScene } from './scenes/TaskGameScene';
import { WorkplaceEventScene } from './scenes/WorkplaceEventScene';
import { stockMarket } from './StockMarket';

// 游戏配置
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL, // 使用 WebGL 提高渲染质量
  width: 1280,
  height: 720,
  parent: 'app',
  backgroundColor: '#2d2d2d',
  // 不使用 pixelArt 模式，因为我们主要使用文字 UI
  pixelArt: false,
  roundPixels: false,
  antialias: true, // 开启抗锯齿使文字更清晰
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [PreloadScene, ResumeEditScene, JobHuntScene, InterviewScene, ImprovedOfficeScene, PhoneScene, StockScene, TaskGameScene, WorkplaceEventScene, GameOverScene],
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
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
