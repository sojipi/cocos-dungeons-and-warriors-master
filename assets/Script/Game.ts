import { _decorator, Component, Node, math, TERRAIN_SOUTH_INDEX } from 'cc';
import { EVENT_ENUM } from './Enum';
import EventManager from './EventManager';
import { MapLoader } from './Map/MapLoader';
import { MazeGenerator } from './Map/MazeGenerator';
import { Player } from './Player/Player';
import { WoodenSkeleton } from './WoodenSkeleton/WoodenSkeleton';
import Levels from './Levels';
const { ccclass, property } = _decorator;

@ccclass('Game')
export class Game extends Component {
    stage: Node;
    map: Node;
    player: Node;
    level = 0;

    protected onLoad(): void {
        console.log('Game onLoad, registering NEXT_LEVEL event listener');
        EventManager.on(
            EVENT_ENUM.NEXT_LEVEL,
            () => {
                console.log('NEXT_LEVEL event received, current level:', this.level);
                this.level++;
                console.log('Level incremented, new level:', this.level);
                this.play();
            },
            this
        );
    }

    protected onDestroy(): void {
        console.log('Game onDestroy, unregistering NEXT_LEVEL event listener');
        EventManager.off(EVENT_ENUM.NEXT_LEVEL, this);
    }

    start() {
        console.log('Game start, initial level:', this.level);
        this.play();
    }

    private async play() {
        console.log('Starting play() method for level:', this.level);
        // 清空上一个舞台
        this.stage && this.stage.destroyAllChildren();
        // 重新生成舞台、地图、玩家
        this.generateStage();
        await this.generateMap();
        this.generatePlayer();
        this.generateWoodenSkeleton();
        console.log('Finished play() method for level:', this.level);
    }

    private generateStage() {
        console.log('Generating stage');
        // 创建一个舞台
        const node = new Node();
        node.parent = this.node;
        node.layer = 1 << 25;
        this.stage = node;
        console.log('Stage generated');
    }

    private async generateMap() {
        console.log('Generating map for level:', this.level);
        const node = new Node();
        node.layer = 1 << 25;
        node.parent = this.stage;
        const loader = node.addComponent(MapLoader);

        // 生成随机迷宫
        const mazeGenerator = new MazeGenerator({ width: 15, height: 15, ensureReachable: true });
        const randomLevel = mazeGenerator.generateLevel();
        await loader.initLevelData(randomLevel);

        const x = loader.row * 55 * 0.5 * -1;
        const y = loader.column * 55 * 0.5 + 80;
        node.position = new math.Vec3(x, y);
        this.map = node;
        console.log('Map generated with position:', x, y);
    }

    private async generatePlayer() {
        console.log('Generating player');
        const node = new Node();
        node.layer = 1 << 25;
        node.parent = this.map;
        await node.addComponent(Player).init();
        this.player = node;
        console.log('Player generated');
    }

    private async generateWoodenSkeleton() {
        console.log('Generating wooden skeleton(s)');
        // 为每个敌人创建一个节点
        // 由于现在使用随机迷宫，我们需要从迷宫数据中获取敌人信息
        // 这里简化处理，直接生成一些随机敌人
        const enemyCount = 3;
        for (let i = 0; i < enemyCount; i++) {
            const node = new Node();
            node.layer = 1 << 25;
            node.parent = this.map;
            await node.addComponent(WoodenSkeleton).init();
        }
        console.log('Wooden skeleton(s) generated');
    }
}