import { _decorator, Component, Node, Label, labelAssembler, Color, LabelComponent } from 'cc';
import * as Common from '../Common';
import Levels, { ILevel } from '../Levels';
import MapTitles from './MapTiles';
import Tile from './Tile';
import { MazeGenerator, IMazeConfig } from './MazeGenerator';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = MapLoader
 * DateTime = Sun Apr 24 2022 11:58:58 GMT+0800 (中国标准时间)
 * Author = sharlier
 * FileBasename = MapLoader.ts
 * FileBasenameNoExtension = MapLoader
 * URL = db://assets/Script/MapLoader.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('MapLoader')
export class MapLoader extends Component {
    row = 0;
    column = 0;

    start() {
        // [3]
    }

    private probability(percent: number) {
        return (Math.random() * 100) / percent > 1;
    }

    async initLevel(level = 1) {
        // 总是加载随机迷宫
        return this.initRandomMaze();
    }

    async initRandomMaze(config?: IMazeConfig) {
        console.log('[MapLoader] Initializing random maze');
        MapTitles.clean();
        // 加载地图
        const imgs = await Common.loadResDir('texture/tile/tile');
        console.log('[MapLoader] Loaded tile images, count:', imgs.length);
        
        // 使用默认配置或传入的配置
        const mazeConfig = {
            width: 10, // 与level1相同的宽度
            height: 10, // 与level1相同的高度
            ensureReachable: true, // 确保所有区域可达
            ...config
        };
        
        // 生成随机迷宫
        const mazeGenerator = new MazeGenerator(mazeConfig);
        const randomLevel = mazeGenerator.generateLevel();
        const { mapInfo } = randomLevel;
        
        // 保存生成的关卡以便其他组件使用
        (globalThis as any).currentLevel = randomLevel;
        console.log('[MapLoader] Map info size:', mapInfo.length, 'x', (mapInfo[0] || []).length);
        for (let x = 0; x < mapInfo.length; x++) {
            const column = mapInfo[x];
            for (let y = 0; y < column.length; y++) {
                const element = column[y];
                MapTitles.setTitle(null, { x, y });
                if (element.type === null) continue;
                if (element.src == 1) {
                    element.src = this.probability(80) ? Math.floor(Math.random() * 3 + 1) : 1;
                }
                const name = `tile (${element.src})`;
                const frame = imgs.find((val) => val.name === name);
                const node = new Node();
                const tile = node.addComponent(Tile).init(element.src, element.type, frame, { x, y });
                // const label = node.addComponent(Label);
                // label.string = `${x}, ${y}`;
                // label.fontSize = 20;
                // label.overflow = Label.Overflow.RESIZE_HEIGHT;
                node.parent = this.node;
                MapTitles.setTitle(tile, { x, y });
            }
        }

        this.row = mapInfo.length || 0;
        this.column = mapInfo[0].length || 0;
        console.log('[MapLoader] Finished initializing level, map size:', this.row, 'x', this.column);
        return this;
    }
}