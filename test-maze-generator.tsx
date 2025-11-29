import { MazeGenerator } from './assets/Script/Map/MazeGenerator';
import { ILevel } from './assets/Script/Levels';

// 测试MazeGenerator
const mazeGenerator = new MazeGenerator({ width: 15, height: 15, ensureReachable: true });
const level: ILevel = mazeGenerator.generateLevel();

console.log('Maze generated successfully!');
console.log('Map size:', level.mapInfo.length, 'x', level.mapInfo[0].length);
console.log('Player position:', level.player.x, level.player.y);
console.log('Door position:', level.door.x, level.door.y);
console.log('Enemies count:', level.enemies.length);

// 打印迷宫地图
console.log('Maze map:');
for (let y = 0; y < level.mapInfo[0].length; y++) {
    let row = '';
    for (let x = 0; x < level.mapInfo.length; x++) {
        const tile = level.mapInfo[x][y];
        if (tile.type === 'WALL_ROW' || tile.type === 'WALL_COLUMN') {
            row += '# ';
        } else if (x === level.player.x && y === level.player.y) {
            row += 'P ';
        } else if (x === level.door.x && y === level.door.y) {
            row += 'D ';
        } else {
            row += '. ';
        }
    }
    console.log(row);
}