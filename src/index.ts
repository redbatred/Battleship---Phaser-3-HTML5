import Phaser from 'phaser';
import './styles.css';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';

// Import scenes
import { 
    BootScene,
    PreloadScene,
    MainMenuScene,
    GameScene,
    GameOverScene,
    Player1SetupScene,
    Player2SetupScene,
    BattleScene,
    CPUBattleScene
} from './scenes';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        PreloadScene,
        MainMenuScene,
        GameScene,
        GameOverScene,
        Player1SetupScene,
        Player2SetupScene,
        BattleScene,
        CPUBattleScene
    ],
    backgroundColor: '#0c4076',
    audio: {
        disableWebAudio: false,
        noAudio: false
    },
    plugins: {
        scene: [
            {
                key: 'rexUI',
                plugin: RexUIPlugin,
                mapping: 'rexUI'
            }
        ]
    }
};

// Create and start the game
window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
}); 