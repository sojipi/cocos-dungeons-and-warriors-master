import { CONTROLLER_ENUM, DIRECTION_ENUM, DIRECTION_ORDER_ENUM, ENTITY_STATE_ENUM, EVENT_ENUM } from '../Enum';
import EventManager from '../EventManager';
import States from './States';
import Entity from './Entity';

export default abstract class MoveableEntity extends Entity {
    protected target_x = 0;
    protected target_y = 0;
    private spped = 1 / 10;
    private isMoving = false;

    protected async init(params: {
        x: number;
        y: number;
        fsm: States;
        state: ENTITY_STATE_ENUM;
        direction: DIRECTION_ENUM;
        spped?: number;
    }) {
        super.init(params);
        this.target_x = this.x;
        this.target_y = this.y;
        !!params.spped && (this.spped = params.spped);

        EventManager.on<CONTROLLER_ENUM>(EVENT_ENUM.PLAYER_CTRL, (type) => this.move(type), this);
    }

    protected async move(ctrl: CONTROLLER_ENUM) {
        // 如果正在移动，则忽略新的移动指令
        if (this.isMoving) {
            return;
        }
        
        switch (ctrl) {
            case CONTROLLER_ENUM.TOP:
                this.target_y -= 1;
                break;
            case CONTROLLER_ENUM.BOTTOM:
                this.target_y += 1;
                break;
            case CONTROLLER_ENUM.LEFT:
                this.target_x -= 1;
                break;
            case CONTROLLER_ENUM.RIGHT:
                this.target_x += 1;
                break;
            case CONTROLLER_ENUM.TURNLEFT:
                this.state = ENTITY_STATE_ENUM.TURNLEFT;
                var direction = DIRECTION_ORDER_ENUM[this.direction];
                direction = Math.abs(direction + 4 - 1) % 4;
                this.direction = DIRECTION_ORDER_ENUM[direction] as DIRECTION_ENUM;
                return; // 转向不触发移动结束事件
            case CONTROLLER_ENUM.TURNRIGHT:
                this.state = ENTITY_STATE_ENUM.TURNRIGHT;
                var direction = DIRECTION_ORDER_ENUM[this.direction];
                direction = (direction + 1) % 4;
                this.direction = DIRECTION_ORDER_ENUM[direction] as DIRECTION_ENUM;
                return; // 转向不触发移动结束事件
        }
        
        // 标记为正在移动
        this.isMoving = true;
    }

    protected update(dt: number): void {
        // 将当前转换本地坐标对准移动坐标
        if (this.target_x < this.x) {
            this.x -= this.spped;
        } else if (this.target_x > this.x) {
            this.x += this.spped;
        }

        if (this.target_y < this.y) {
            this.y -= this.spped;
        } else if (this.target_y > this.y) {
            this.y += this.spped;
        }

        // 防止移动鬼畜
        if (Math.abs(this.target_x - this.x) <= this.spped && Math.abs(this.target_y - this.y) <= this.spped) {
            this.x = this.target_x;
            this.y = this.target_y;
            
            // 如果之前在移动，现在停止了，则触发移动结束事件
            if (this.isMoving) {
                this.isMoving = false;
                console.log('[MoveableEntity] Player move end, emitting PLAYER_MOVE_END event');
                EventManager.emit(EVENT_ENUM.PLAYER_MOVE_END);
            }
        }

        // 将游戏坐标转换位实际坐标
        const x = this.x * 55 - 55 * 1.5;
        const y = -this.y * 55 + 55 * 1.5;
        this.node.setPosition(x, y);
    }

    protected onDestroy(): void {
        EventManager.off(EVENT_ENUM.PLAYER_CTRL, this);
    }
}