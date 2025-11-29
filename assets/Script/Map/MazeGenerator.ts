import { TILE_TYPE_ENUM } from '../Enum';
import { ITile, ILevel, IEntity } from '../Levels';
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM } from '../Enum';

export interface IMazeConfig {
    width: number;
    height: number;
    wallDensity?: number; // 墙体密度 0-1
    ensureReachable?: boolean; // 确保所有区域可达
}

export class MazeGenerator {
    private width: number;
    private height: number;
    private maze: ITile[][];

    constructor(config: IMazeConfig) {
        this.width = config.width;
        this.height = config.height;
        this.maze = [];
    }

    // 生成简单随机迷宫
    generateRandomMaze(wallDensity: number = 0.3): ITile[][] {
        this.maze = [];
        
        for (let x = 0; x < this.width; x++) {
            this.maze[x] = [];
            for (let y = 0; y < this.height; y++) {
                // 边界必须是墙，但留出一些出口
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    // 在边界上随机留出一些出口（空白区域）
                    if (Math.random() < 0.1) { // 10%概率在边界创建出口
                        this.maze[x][y] = { src: null, type: null };
                    } else {
                        this.maze[x][y] = this.createWallTile(x, y);
                    }
                } else {
                    // 随机生成墙或地板
                    if (Math.random() < wallDensity) {
                        this.maze[x][y] = this.createWallTile(x, y);
                    } else {
                        this.maze[x][y] = this.createFloorTile();
                    }
                }
            }
        }
        
        // 确保至少有一个出口（右边界中间位置）
        const exitX = this.width - 1;
        const exitY = Math.floor(this.height / 2);
        this.maze[exitX][exitY] = { src: null, type: null };
        
        return this.maze;
    }

    // 生成递归回溯迷宫（更规整的迷宫）
    generateBacktrackMaze(): ITile[][] {
        // 初始化全墙
        this.maze = [];
        for (let x = 0; x < this.width; x++) {
            this.maze[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.maze[x][y] = this.createWallTile(x, y);
            }
        }

        // 递归挖掘路径
        const visited: boolean[][] = Array(this.width).fill(null).map(() => Array(this.height).fill(false));
        this.carvePassage(1, 1, visited);

        // 确保有入口（左边界中间位置）
        const entranceX = 0;
        const entranceY = Math.floor(this.height / 2);
        this.maze[entranceX][entranceY] = { src: null, type: null };
        
        // 确保入口前有地板连接
        if (entranceX < this.width - 1) {
            this.maze[entranceX + 1][entranceY] = this.createFloorTile();
        }

        // 确保有出口（右边界中间位置）
        const exitX = this.width - 2;
        const exitY = Math.floor(this.height / 2);
        this.maze[exitX][exitY] = { src: null, type: null };
        
        // 确保出口前有地板连接
        if (exitX > 0) {
            this.maze[exitX - 1][exitY] = this.createFloorTile();
        }

        // 清除右边和下边的额外障碍物
        for (let x = 0; x < this.width; x++) {
            this.maze[x][this.height - 1] = { src: null, type: null };
        }
        for (let y = 0; y < this.height; y++) {
            this.maze[this.width - 1][y] = { src: null, type: null };
        }

        return this.maze;
    }

    private carvePassage(x: number, y: number, visited: boolean[][]) {
        visited[x][y] = true;
        this.maze[x][y] = this.createFloorTile();

        // 随机方向顺序
        const directions = [
            [0, 2], [2, 0], [0, -2], [-2, 0]
        ].sort(() => Math.random() - 0.5);

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1 && !visited[nx][ny]) {
                // 挖掘中间的墙
                this.maze[x + dx / 2][y + dy / 2] = this.createFloorTile();
                this.carvePassage(nx, ny, visited);
            }
        }
    }

    private createWallTile(x: number, y: number): ITile {
        // 根据位置选择墙体类型
        if (x === 0 && y === 0) return { src: 16, type: TILE_TYPE_ENUM.WALL_LEFT_TOP };
        if (x === this.width - 2 && y === 0) return { src: 15, type: TILE_TYPE_ENUM.WALL_RIGHT_TOP };
        if (x === 0 && y === this.height - 2) return { src: 13, type: TILE_TYPE_ENUM.WALL_LEFT_BOTTOM };
        if (x === this.width - 2 && y === this.height - 2) return { src: 14, type: TILE_TYPE_ENUM.WALL_RIGHT_BOTTOM };
        if (x === 0 || x === this.width - 2) return { src: 5, type: TILE_TYPE_ENUM.WALL_COLUMN };
        if (y === 0 || y === this.height - 2) return { src: 9, type: TILE_TYPE_ENUM.WALL_ROW };
        
        // 内部墙体
        return { src: Math.floor(Math.random() * 3) + 5, type: TILE_TYPE_ENUM.WALL_COLUMN };
    }

    private createFloorTile(): ITile {
        return { src: 1, type: TILE_TYPE_ENUM.FLOOR };
    }

    // 生成完整关卡（包含玩家、敌人、门）
    generateLevel(): ILevel {
        const config: IMazeConfig = {
            width: 10,
            height: 10,
            ensureReachable: true
        };
        const mapInfo = config.ensureReachable ? 
            this.generateBacktrackMaze() : 
            this.generateRandomMaze(config.wallDensity || 0.3);

        // 寻找可放置实体的地板位置
        const floorPositions = this.findFloorPositions();
        
        // 将玩家放在入口附近，门放在出口附近
        const entranceY = Math.floor(this.height / 2);
        const exitY = Math.floor(this.height / 2);
        
        // 找到入口附近的地板位置（玩家出生点）
        let playerPos = floorPositions.find(pos => pos.x === 1 && pos.y === entranceY);
        if (!playerPos) {
            // 如果没有找到，选择离入口最近的地板
            playerPos = floorPositions.reduce((closest, pos) => {
                const dist = Math.abs(pos.x - 1) + Math.abs(pos.y - entranceY);
                const closestDist = Math.abs(closest.x - 1) + Math.abs(closest.y - entranceY);
                return dist < closestDist ? pos : closest;
            }, floorPositions[0]);
        }
        
        // 找到出口附近的地板位置（门的位置）
        let doorPos = floorPositions.find(pos => pos.x === this.width - 2 && pos.y === exitY);
        if (!doorPos) {
            // 如果没有找到，选择离出口最近的地板
            doorPos = floorPositions.reduce((closest, pos) => {
                const dist = Math.abs(pos.x - (this.width - 2)) + Math.abs(pos.y - exitY);
                const closestDist = Math.abs(closest.x - (this.width - 2)) + Math.abs(closest.y - exitY);
                return dist < closestDist ? pos : closest;
            }, floorPositions[0]);
        }
        
        // 随机选择位置放置敌人
        const enemyPositions = this.selectRandomPositions(floorPositions, 1, [playerPos, doorPos]);

        const player: IEntity = {
            x: playerPos.x,
            y: playerPos.y,
            direction: DIRECTION_ENUM.TOP,
            state: ENTITY_STATE_ENUM.IDLE,
            type: ENTITY_TYPE_ENUM.PLAYER,
        };

        const enemies: IEntity[] = enemyPositions.map(pos => ({
            x: pos.x,
            y: pos.y,
            direction: DIRECTION_ENUM.TOP,
            state: ENTITY_STATE_ENUM.IDLE,
            type: ENTITY_TYPE_ENUM.SKELETON_WOODEN,
        }));

        const door: IEntity = {
            x: doorPos.x,
            y: doorPos.y,
            direction: DIRECTION_ENUM.BOTTOM,
            state: ENTITY_STATE_ENUM.IDLE,
            type: ENTITY_TYPE_ENUM.DOOR,
        };

        return {
            mapInfo,
            player,
            enemies,
            spikes: [],
            bursts: [],
            door,
        };
    }

    private findFloorPositions(): Array<{x: number, y: number}> {
        const positions = [];
        for (let x = 1; x < this.width - 1; x++) {
            for (let y = 1; y < this.height - 1; y++) {
                if (this.maze[x][y].type === TILE_TYPE_ENUM.FLOOR) {
                    positions.push({x, y});
                }
            }
        }
        return positions;
    }

    private selectRandomPositions(
        available: Array<{x: number, y: number}>, 
        count: number, 
        exclude: Array<{x: number, y: number}> = []
    ): Array<{x: number, y: number}> {
        const filtered = available.filter(pos => 
            !exclude.some(ex => ex.x === pos.x && ex.y === pos.y)
        );
        
        const selected = [];
        for (let i = 0; i < Math.min(count, filtered.length); i++) {
            const index = Math.floor(Math.random() * filtered.length);
            selected.push(filtered.splice(index, 1)[0]);
        }
        return selected;
    }
}