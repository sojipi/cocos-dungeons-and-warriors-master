import { TILE_TYPE_ENUM, DIRECTION_ENUM, ENTITY_TYPE_ENUM, ENTITY_STATE_ENUM } from '../Enum';
import { ILevel, ITile, IEntity, ISpikes } from '../Levels';

interface MazeOptions {
    width: number;
    height: number;
    ensureReachable?: boolean;
}

interface Cell {
    x: number;
    y: number;
    visited: boolean;
    walls: boolean[]; // 上、右、下、左
}

export class MazeGenerator {
    private width: number;
    private height: number;
    private ensureReachable: boolean;
    private maze: Cell[][];
    private startX: number;
    private startY: number;
    private endX: number;
    private endY: number;

    constructor(options: MazeOptions) {
        this.width = options.width;
        this.height = options.height;
        this.ensureReachable = options.ensureReachable || false;
        this.maze = [];
        this.startX = 0;
        this.startY = 0;
        this.endX = this.width - 1;
        this.endY = this.height - 1;
    }

    generateLevel(): ILevel {
        console.log('[MazeGenerator] Generating maze with size:', this.width, 'x', this.height);
        this.initializeMaze();
        this.generateMaze();
        return this.convertToLevel();
    }

    private initializeMaze() {
        // 初始化迷宫，所有单元格都有墙壁
        for (let x = 0; x < this.width; x++) {
            this.maze[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.maze[x][y] = {
                    x,
                    y,
                    visited: false,
                    walls: [true, true, true, true] // 上、右、下、左
                };
            }
        }
    }

    private generateMaze() {
        // 使用深度优先搜索算法生成迷宫
        const stack: Cell[] = [];
        const startCell = this.maze[0][0];
        startCell.visited = true;
        stack.push(startCell);

        while (stack.length > 0) {
            const current = stack.pop()!;
            const neighbors = this.getUnvisitedNeighbors(current);

            if (neighbors.length > 0) {
                stack.push(current);
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.removeWallBetween(current, next);
                next.visited = true;
                stack.push(next);
            }
        }

        // 如果需要确保连通性，确保从起点到终点有路径
        if (this.ensureReachable && !this.isReachable()) {
            this.ensurePath();
        }
    }

    private getUnvisitedNeighbors(cell: Cell): Cell[] {
        const neighbors: Cell[] = [];
        const { x, y } = cell;

        // 上
        if (y > 0 && !this.maze[x][y - 1].visited) {
            neighbors.push(this.maze[x][y - 1]);
        }
        // 右
        if (x < this.width - 1 && !this.maze[x + 1][y].visited) {
            neighbors.push(this.maze[x + 1][y]);
        }
        // 下
        if (y < this.height - 1 && !this.maze[x][y + 1].visited) {
            neighbors.push(this.maze[x][y + 1]);
        }
        // 左
        if (x > 0 && !this.maze[x - 1][y].visited) {
            neighbors.push(this.maze[x - 1][y]);
        }

        return neighbors;
    }

    private removeWallBetween(cell1: Cell, cell2: Cell) {
        const dx = cell2.x - cell1.x;
        const dy = cell2.y - cell1.y;

        if (dx === 1) {
            // cell2在cell1右边
            cell1.walls[1] = false;
            cell2.walls[3] = false;
        } else if (dx === -1) {
            // cell2在cell1左边
            cell1.walls[3] = false;
            cell2.walls[1] = false;
        } else if (dy === 1) {
            // cell2在cell1下边
            cell1.walls[2] = false;
            cell2.walls[0] = false;
        } else if (dy === -1) {
            // cell2在cell1上边
            cell1.walls[0] = false;
            cell2.walls[2] = false;
        }
    }

    private isReachable(): boolean {
        // 使用BFS检查起点到终点是否可达
        const visited: boolean[][] = [];
        for (let x = 0; x < this.width; x++) {
            visited[x] = [];
            for (let y = 0; y < this.height; y++) {
                visited[x][y] = false;
            }
        }

        const queue: { x: number; y: number }[] = [];
        queue.push({ x: this.startX, y: this.startY });
        visited[this.startX][this.startY] = true;

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.x === this.endX && current.y === this.endY) {
                return true;
            }

            // 上
            if (
                current.y > 0 && 
                !visited[current.x][current.y - 1] && 
                !this.maze[current.x][current.y].walls[0]
            ) {
                visited[current.x][current.y - 1] = true;
                queue.push({ x: current.x, y: current.y - 1 });
            }
            // 右
            if (
                current.x < this.width - 1 && 
                !visited[current.x + 1][current.y] && 
                !this.maze[current.x][current.y].walls[1]
            ) {
                visited[current.x + 1][current.y] = true;
                queue.push({ x: current.x + 1, y: current.y });
            }
            // 下
            if (
                current.y < this.height - 1 && 
                !visited[current.x][current.y + 1] && 
                !this.maze[current.x][current.y].walls[2]
            ) {
                visited[current.x][current.y + 1] = true;
                queue.push({ x: current.x, y: current.y + 1 });
            }
            // 左
            if (
                current.x > 0 && 
                !visited[current.x - 1][current.y] && 
                !this.maze[current.x][current.y].walls[3]
            ) {
                visited[current.x - 1][current.y] = true;
                queue.push({ x: current.x - 1, y: current.y });
            }
        }

        return false;
    }

    private ensurePath() {
        // 确保起点到终点有路径，这里简化处理
        let x = this.startX;
        let y = this.startY;

        while (x < this.endX || y < this.endY) {
            // 随机选择向右或向下移动
            if (x < this.endX && (y >= this.endY || Math.random() > 0.5)) {
                this.removeWallBetween(this.maze[x][y], this.maze[x + 1][y]);
                x++;
            } else if (y < this.endY) {
                this.removeWallBetween(this.maze[x][y], this.maze[x][y + 1]);
                y++;
            }
        }
    }

    private convertToLevel(): ILevel {
        // 将迷宫转换为ILevel格式
        const mapInfo: ITile[][] = [];

        // 创建外层边界墙
        const outerWidth = this.width * 2 + 1;
        const outerHeight = this.height * 2 + 1;

        // 初始化地图
        for (let x = 0; x < outerWidth; x++) {
            mapInfo[x] = [];
            for (let y = 0; y < outerHeight; y++) {
                mapInfo[x][y] = {
                    src: null,
                    type: null
                };
            }
        }

        // 设置外层边界
        for (let x = 0; x < outerWidth; x++) {
            mapInfo[x][0] = {
                src: 16,
                type: TILE_TYPE_ENUM.WALL_ROW
            };
            mapInfo[x][outerHeight - 1] = {
                src: 9,
                type: TILE_TYPE_ENUM.WALL_ROW
            };
        }

        for (let y = 0; y < outerHeight; y++) {
            mapInfo[0][y] = {
                src: 5,
                type: TILE_TYPE_ENUM.WALL_COLUMN
            };
            mapInfo[outerWidth - 1][y] = {
                src: 5,
                type: TILE_TYPE_ENUM.WALL_COLUMN
            };
        }

        // 设置四个角
        mapInfo[0][0] = {
            src: 16,
            type: TILE_TYPE_ENUM.WALL_LEFT_TOP
        };
        mapInfo[outerWidth - 1][0] = {
            src: 14,
            type: TILE_TYPE_ENUM.WALL_RIGHT_TOP
        };
        mapInfo[0][outerHeight - 1] = {
            src: 13,
            type: TILE_TYPE_ENUM.WALL_LEFT_BOTTOM
        };
        mapInfo[outerWidth - 1][outerHeight - 1] = {
            src: 14,
            type: TILE_TYPE_ENUM.WALL_RIGHT_BOTTOM
        };

        // 设置迷宫内部
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const cell = this.maze[x][y];
                const outerX = x * 2 + 1;
                const outerY = y * 2 + 1;

                // 设置地面
                mapInfo[outerX][outerY] = {
                    src: 1,
                    type: TILE_TYPE_ENUM.FLOOR
                };

                // 设置墙壁
                if (cell.walls[0]) { // 上
                    mapInfo[outerX][outerY - 1] = {
                        src: 16,
                        type: TILE_TYPE_ENUM.WALL_ROW
                    };
                }
                if (cell.walls[1]) { // 右
                    mapInfo[outerX + 1][outerY] = {
                        src: 5,
                        type: TILE_TYPE_ENUM.WALL_COLUMN
                    };
                }
                if (cell.walls[2]) { // 下
                    mapInfo[outerX][outerY + 1] = {
                        src: 9,
                        type: TILE_TYPE_ENUM.WALL_ROW
                    };
                }
                if (cell.walls[3]) { // 左
                    mapInfo[outerX - 1][outerY] = {
                        src: 5,
                        type: TILE_TYPE_ENUM.WALL_COLUMN
                    };
                }
            }
        }

        // 设置入口（左上角）
        mapInfo[1][0] = {
            src: null,
            type: null
        };

        // 设置出口（右下角）
        mapInfo[outerWidth - 2][outerHeight - 1] = {
            src: null,
            type: null
        };

        // 添加玩家、门和一些敌人
        const level: ILevel = {
            mapInfo,
            player: {
                x: 1,
                y: 1,
                direction: DIRECTION_ENUM.RIGHT,
                state: ENTITY_STATE_ENUM.IDLE,
                type: ENTITY_TYPE_ENUM.PLAYER
            },
            door: {
                x: outerWidth - 2,
                y: outerHeight - 2,
                direction: DIRECTION_ENUM.LEFT,
                state: ENTITY_STATE_ENUM.IDLE,
                type: ENTITY_TYPE_ENUM.DOOR
            },
            enemies: [],
            spikes: [],
            bursts: []
        };

        // 添加一些随机敌人
        const enemyCount = Math.max(1, Math.floor(this.width * this.height / 20));
        for (let i = 0; i < enemyCount; i++) {
            const x = Math.floor(Math.random() * this.width) * 2 + 1;
            const y = Math.floor(Math.random() * this.height) * 2 + 1;
            level.enemies.push({
                x,
                y,
                direction: DIRECTION_ENUM[Object.values(DIRECTION_ENUM)[Math.floor(Math.random() * 4)]],
                state: ENTITY_STATE_ENUM.IDLE,
                type: ENTITY_TYPE_ENUM.SKELETON_WOODEN
            });
        }

        console.log('[MazeGenerator] Maze generated successfully!');
        return level;
    }
}
