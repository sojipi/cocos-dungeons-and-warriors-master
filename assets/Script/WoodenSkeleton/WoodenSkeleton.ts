import { math, Sprite, UITransform, _decorator } from 'cc';
import Entity from '../Base/Entity';
import { DIRECTION_ENUM, ENTITY_STATE_ENUM } from '../Enum';
import { WoodenSkeletonState } from './WoodenSkeletonState';
import Levels from '../Levels';

const { ccclass, property } = _decorator;

@ccclass('WoodenSkeleton')
export class WoodenSkeleton extends Entity {
    async init() {
        const sprite = this.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        const transform = this.getComponent(UITransform);
        transform.contentSize = math.size(4 * 55, 4 * 55);
        transform.anchorPoint = math.v2(0, 1);

        const fsm = await this.addComponent(WoodenSkeletonState).init();

        // 获取当前关卡的敌人初始位置信息
        let parentNode = this.node.parent;
        let gameComponent = null;
        
        // 向上遍历节点树查找Game组件
        while (parentNode) {
            gameComponent = parentNode.getComponent('Game');
            if (gameComponent) {
                break;
            }
            parentNode = parentNode.parent;
        }
        
        if (!gameComponent) {
            console.error('[WoodenSkeleton] Game component not found');
            // 使用默认值
            super.init({ x: 7, y: 8, fsm, direction: DIRECTION_ENUM.TOP, state: ENTITY_STATE_ENUM.IDLE });
        } else {
            const levelIndex = gameComponent.level;
            const levelKey = `level${levelIndex}`;
            const level = Levels[levelKey];
            
            if (!level) {
                console.error('[WoodenSkeleton] Level not found:', levelKey);
                // 使用默认值
                super.init({ x: 7, y: 8, fsm, direction: DIRECTION_ENUM.TOP, state: ENTITY_STATE_ENUM.IDLE });
            } else {
                // 对于第一关，只有一个敌人，使用第一个敌人信息
                // 对于第二关，我们暂时使用第一个敌人信息，实际应该创建多个敌人
                const enemyInfo = level.enemies[0];
                console.log('[WoodenSkeleton] Initializing enemy with info:', enemyInfo);
                super.init({ 
                    x: enemyInfo.x, 
                    y: enemyInfo.y, 
                    fsm, 
                    direction: enemyInfo.direction, 
                    state: enemyInfo.state 
                });
            }
        }

        return this;
    }
}