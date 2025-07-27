# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 2D pixel-style dungeon crawler game built with Cocos Creator 3.4.2. The game is inspired by "Dungeons & Dragons" and implements a turn-based combat system with a player character fighting enemies like wooden skeletons in grid-based levels.

## Development Commands

The project uses Cocos Creator's built-in build system. All builds and tests should be performed through the Cocos Creator IDE rather than command-line tools.

- **Build**: Use Cocos Creator IDE → Project → Build
- **Preview**: Use Cocos Creator IDE → Project → Preview or F5
- **TypeScript Compilation**: Handled automatically by Cocos Creator

## Core Architecture

### Entity System
The game uses an inheritance-based entity system:
- `Entity` (base class): Core positioning and state management
- `MoveableEntity`: Adds movement capabilities for characters
- `Player`: Player-specific logic including collision detection
- `WoodenSkeleton`: Enemy AI and behavior

### State Management
- **Finite State Machine (FSM)**: Each entity uses a state machine for animations and behaviors
- **Event System**: Centralized EventManager for decoupled communication between components
- **Global Store**: Centralized state management in `Store/index.ts`

### Map System
- **Grid-based**: Game uses a tile-based coordinate system (55px per tile)
- **MapLoader**: Dynamically loads level data and creates tile components
- **MapTiles**: Static utility for tile collision detection and pathfinding
- **Tile**: Individual tile components with collision properties

### Game Flow
1. **Game.ts**: Main game controller, manages level progression
2. **Level progression**: Handled through EventManager events (NEXT_LEVEL)
3. **Controls**: Input handling through UI buttons that emit events

## File Structure

```
assets/Script/
├── Base/           # Core entity classes
├── Common/         # Shared utilities and resources
├── Enum/           # Game constants and enumerations
├── Levels/         # Level data configurations
├── Map/            # Map loading and tile management
├── Player/         # Player character and states
├── Store/          # Global state management
├── WoodenSkeleton/ # Enemy implementation
├── EventManager.ts # Event system
├── Controls.ts     # Input handling
└── Game.ts         # Main game controller
```

## Key Conventions

### Coordinate System
- Game coordinates: Grid-based (x, y) integers
- World coordinates: Pixel-based, converted via `x * 55 - 55 * 1.5` formula
- Anchor point: (0, 1) for proper sprite positioning

### Event-Driven Architecture
Use EventManager for all cross-component communication:
```typescript
EventManager.on(EVENT_ENUM.PLAYER_CTRL, this.handlePlayerControl, this);
EventManager.emit(EVENT_ENUM.NEXT_LEVEL);
```

### State Management
Entities use FSM pattern with trigger-based state transitions:
```typescript
this.fsm.trigger(PARAMS_NAME_ENUM.BLOCKFRONT, true);
```

### Asset Loading
Resources loaded through Common utilities:
```typescript
const imgs = await Common.loadResDir('texture/tile/tile');
```

## TypeScript Configuration

- Target: ES2015
- Strict mode disabled for Cocos Creator compatibility
- Experimental decorators enabled for Cocos components
- Module resolution through Cocos Creator's asset database paths

## Testing and Debugging

- Use Cocos Creator's built-in preview for testing
- Console logging available through standard `console.log()`
- Visual debugging through Cocos Creator's scene inspector