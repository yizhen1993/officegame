/**
 * ============================================================================
 * Gather.town v2 Virtual Office — Main Game Scene (Phaser 3)
 * Handles Map Rendering, Physics Colliders, Avatar Movement, Animations,
 * Chair Sitting Snapping, Private Space Boundaries, and Object Interactions.
 * ============================================================================
 */

import { GATHER_CONFIG } from './config.js';
import { TextureGenerator } from './textures.js';
import { AvatarGenerator } from './avatar.js';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.localPlayer = null;
    this.remotePlayers = new Map();
    this.cursors = null;
    this.keys = null;
    this.interactiveGroup = null;
    this.chairsGroup = null;
    this.wallsGroup = null;
    this.activeInteraction = null;
    this.currentSpace = 'open_office';
    this.speedBuffTimer = 0;
  }

  preload() {
    // Generate all procedural canvas textures into Phaser TextureManager
    TextureGenerator.generateAll(this);
  }

  create() {
    // 1. Build the Gather.town Office Floorplan
    this.buildOfficeMap();

    // 2. Setup Input Keys (WASD + Arrows + Action keys X, E, G, Z, 1-6)
    this.setupInputControls();

    // 3. Emit ready event to Network Manager
    if (window.GatherApp && window.GatherApp.onSceneReady) {
      window.GatherApp.onSceneReady(this);
    }
  }

  // ==========================================================================
  // MAP BUILDING: Gather.town v2 Aesthetic Floorplan
  // ==========================================================================
  buildOfficeMap() {
    const W = GATHER_CONFIG.MAP_WIDTH_TILES;
    const H = GATHER_CONFIG.MAP_HEIGHT_TILES;
    const T = GATHER_CONFIG.TILE_SIZE;

    this.wallsGroup = this.physics.add.staticGroup();
    this.chairsGroup = this.physics.add.staticGroup();
    this.interactiveGroup = this.physics.add.staticGroup();

    // 1. Base Flooring
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const px = x * T + T / 2;
        const py = y * T + T / 2;
        let tileKey = 'floor_wood_light';

        // Boardroom (Top-Left)
        if (x >= 1 && x <= 16 && y >= 1 && y <= 14) {
          tileKey = 'floor_wood_dark';
        }
        // Brainstorm Lab (Top-Right)
        else if (x >= 34 && x <= 48 && y >= 1 && y <= 14) {
          tileKey = 'floor_carpet_slate';
        }
        // Focus Pods (Top-Center)
        else if (x >= 17 && x <= 33 && y >= 1 && y <= 8) {
          tileKey = 'floor_pod_carpet';
        }
        // Cozy Lounge (Bottom-Left)
        else if (x >= 1 && x <= 16 && y >= 24 && y <= 36) {
          tileKey = 'floor_carpet_navy';
        }
        // Cafeteria & Arcade (Bottom-Right)
        else if (x >= 34 && x <= 48 && y >= 22 && y <= 36) {
          tileKey = 'floor_tile_bistro';
        }
        // Texas Hold'em Poker Club (Bottom-Center)
        else if (x >= 18 && x <= 32 && y >= 27 && y <= 36) {
          tileKey = 'floor_carpet_casino';
        }

        this.add.image(px, py, tileKey);
      }
    }

    // 2. Area Rugs
    this.add.image(288, 992, 'floor_rug_ornate').setScale(2); // In Lounge
    this.add.image(800, 992, 'floor_rug_ornate').setScale(1.5); // In Welcome Foyer

    // 3. Perimeter Boundary Walls
    for (let x = 0; x < W; x++) {
      this.placeWall(x * T + T / 2, T / 2, 'wall_top');
      this.placeWall(x * T + T / 2, (H - 1) * T + T / 2, 'wall_top');
    }
    for (let y = 0; y < H; y++) {
      this.placeWall(T / 2, y * T + T / 2, 'wall_top');
      this.placeWall((W - 1) * T + T / 2, y * T + T / 2, 'wall_top');
    }

    // 4. Room Partition Walls & Glass Dividers (Wide doorways & Zero Hidden Obstacles)
    // 4A. Boardroom Walls (Bottom boundary at y=14, Right boundary at x=16)
    for (let x = 1; x <= 16; x++) {
      if (x < 6 || x > 10) { // Wide 5-tile doorway at x: 6..10
        this.placeWall(x * T + T / 2, 14 * T + T / 2, 'wall_glass');
      }
    }
    for (let y = 1; y < 14; y++) {
      if (y < 6 || y > 8) { // 3-tile side doorway at y: 6..8
        this.placeWall(16 * T + T / 2, y * T + T / 2, 'wall_glass');
      }
    }

    // 4B. Brainstorm Lab Walls (Bottom boundary at y=14, Left boundary at x=34)
    for (let x = 34; x <= 48; x++) {
      if (x < 39 || x > 43) { // Wide 5-tile doorway at x: 39..43
        this.placeWall(x * T + T / 2, 14 * T + T / 2, 'wall_glass');
      }
    }
    for (let y = 1; y < 14; y++) {
      if (y < 6 || y > 8) { // 3-tile side doorway at y: 6..8
        this.placeWall(34 * T + T / 2, y * T + T / 2, 'wall_glass');
      }
    }

    // 4C. Focus Pods Dividers (Spacious 3-tile doorways into hallway)
    for (let x = 17; x <= 33; x++) {
      if ((x < 18 || x > 20) && (x < 24 || x > 26) && (x < 30 || x > 32)) {
        this.placeWall(x * T + T / 2, 8 * T + T / 2, 'wall_glass');
      }
    }
    for (let y = 1; y <= 8; y++) {
      this.placeWall(17 * T + T / 2, y * T + T / 2, 'wall_top');
      this.placeWall(22 * T + T / 2, y * T + T / 2, 'wall_top');
      this.placeWall(28 * T + T / 2, y * T + T / 2, 'wall_top');
      this.placeWall(33 * T + T / 2, y * T + T / 2, 'wall_top');
    }

    // 4D. Lounge Walls (Top boundary at y=24, Right boundary at x=16)
    for (let x = 1; x <= 16; x++) {
      if (x < 6 || x > 10) { // Wide 5-tile doorway at x: 6..10
        this.placeWall(x * T + T / 2, 24 * T + T / 2, 'wall_glass');
      }
    }
    for (let y = 25; y <= 36; y++) {
      if (y < 28 || y > 30) { // 3-tile side doorway at y: 28..30
        this.placeWall(16 * T + T / 2, y * T + T / 2, 'wall_glass');
      }
    }

    // 4E. Cafeteria Walls (Top boundary at y=22, Left boundary at x=34)
    for (let x = 34; x <= 48; x++) {
      if (x < 39 || x > 43) { // Wide 5-tile doorway at x: 39..43
        this.placeWall(x * T + T / 2, 22 * T + T / 2, 'wall_glass');
      }
    }
    for (let y = 23; y <= 36; y++) {
      if (y < 28 || y > 30) { // 3-tile side doorway at y: 28..30
        this.placeWall(34 * T + T / 2, y * T + T / 2, 'wall_glass');
      }
    }

    // 4F. Texas Hold'em Poker Club Partitions (Bottom-Center)
    // Left divider (matching Lounge right wall with doorway at y: 28..30)
    for (let y = 27; y <= 36; y++) {
      if (y < 28 || y > 30) {
        this.placeWall(17 * T + T / 2, y * T + T / 2, 'wall_glass');
      }
    }
    // Right divider (matching Cafeteria left wall with doorway at y: 28..30)
    for (let y = 27; y <= 36; y++) {
      if (y < 28 || y > 30) {
        this.placeWall(33 * T + T / 2, y * T + T / 2, 'wall_glass');
      }
    }
    // Top entrance pillars at x=18 and x=32 - leaving the entire hallway (x: 19..31) completely open into Poker room
    this.placeWall(18 * T + T / 2, 26 * T + T / 2, 'wall_glass');
    this.placeWall(32 * T + T / 2, 26 * T + T / 2, 'wall_glass');

    // 5. Furniture Placement
    // 5A. Boardroom Conference Table
    this.placeFurniture(240, 240, 'boardroom_table_piece', true);
    this.placeFurniture(304, 240, 'boardroom_table_piece', true);

    // 5B. Brainstorm Collaboration Table
    this.placeFurniture(1328, 256, 'round_collab_table', true);

    // 5C. Focus Pod Desks
    this.placeFurniture(640, 112, 'desk_single', true);
    this.placeFurniture(800, 112, 'desk_single', true);
    this.placeFurniture(960, 112, 'desk_single', true);

    // 5D. Open Office Desks (4 Clusters)
    this.placeFurniture(640, 512, 'desk_workstation', true);
    this.placeFurniture(960, 512, 'desk_workstation', true);
    this.placeFurniture(640, 768, 'desk_workstation', true);
    this.placeFurniture(960, 768, 'desk_workstation', true);

    // 5E. Lounge Sofas & Coffee Table (Sofa non-solid so seats are completely unblocked)
    this.placeFurniture(256, 880, 'couch_lounge_h', false);
    this.placeFurniture(256, 940, 'coffee_table', true);
    this.placeFurniture(96, 832, 'bookshelf', true);

    // 5F. Cafeteria Bistro Furniture
    this.placeFurniture(1296, 928, 'coffee_table', true);
    this.placeFurniture(1296, 1056, 'coffee_table', true);

    // 5G. Kosmi Texas Hold'em Poker Table
    this.placeFurniture(800, 1024, 'poker_table_felt', true);

    // 5H. Office Plants (Passable so no corner traps)
    this.placeFurniture(80, 80, 'plant_ficus', false);
    this.placeFurniture(464, 80, 'plant_monstera', false);
    this.placeFurniture(1120, 80, 'plant_ficus', false);
    this.placeFurniture(1520, 80, 'plant_monstera', false);

    // 6. Chairs Placement (with exact orientations)
    GATHER_CONFIG.CHAIRS.forEach(chair => {
      const chairTex = `chair_${chair.direction}`;
      const sprite = this.add.image(chair.x, chair.y, chairTex);
      sprite.setDepth(chair.direction === 'up' ? 55 : 40);
      sprite.setData('chairId', chair.id);
      sprite.setData('direction', chair.direction);
      sprite.setData('spaceId', chair.spaceId);
      if (chair.seatIndex !== undefined) sprite.setData('seatIndex', chair.seatIndex);
    });

    // 7. Interactive Objects (Kept outside wallsGroup so they never create hidden obstacles)
    GATHER_CONFIG.INTERACTIVE_OBJECTS.forEach(obj => {
      const texKey = obj.type === 'whiteboard' ? 'obj_whiteboard' :
        obj.type === 'media' ? 'obj_projector' :
        obj.type === 'arcade' ? 'obj_arcade' :
        obj.type === 'coffee' ? 'obj_coffee' :
        obj.type === 'watercooler' ? 'obj_watercooler' :
        obj.type === 'notes' ? 'obj_bulletin' :
        obj.type === 'poker' ? 'obj_poker' :
        obj.type === 'wheel' ? 'obj_wheel' : 'obj_whiteboard';

      const item = this.interactiveGroup.create(obj.x, obj.y, texKey);
      item.setData('config', obj);
      if (typeof item.refreshBody === 'function') {
        item.refreshBody();
      }
    });

    // Floating interaction prompt text (Gather v2 style: "[X] Press X to...")
    this.promptContainer = this.add.container(0, 0);
    this.promptContainer.setDepth(100);
    this.promptContainer.setVisible(false);

    const promptBg = this.add.graphics();
    promptBg.fillStyle(0x1e293b, 0.9);
    promptBg.fillRoundedRect(-140, -18, 280, 36, 18);
    promptBg.lineStyle(2, 0xf59e0b, 1);
    promptBg.strokeRoundedRect(-140, -18, 280, 36, 18);

    const promptText = this.add.text(0, 0, '', {
      fontSize: '12px',
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    this.promptContainer.add([promptBg, promptText]);
    this.promptText = promptText;
  }

  placeWall(x, y, textureKey) {
    const wall = this.wallsGroup.create(x, y, textureKey);
    return wall;
  }

  placeFurniture(x, y, textureKey, solid = true) {
    if (solid) {
      const item = this.wallsGroup.create(x, y, textureKey);
      // Precision hitboxes to prevent trapping players near chairs
      if (item.body) {
        if (textureKey === 'desk_workstation') {
          item.body.setSize(56, 16);
          item.body.setOffset(4, 8);
        } else if (textureKey === 'boardroom_table_piece') {
          item.body.setSize(56, 18);
          item.body.setOffset(4, 7);
        } else if (textureKey === 'round_collab_table') {
          item.body.setSize(34, 34);
          item.body.setOffset(7, 7);
        } else if (textureKey === 'poker_table_felt') {
          item.body.setSize(80, 36);
          item.body.setOffset(16, 14);
        } else if (textureKey === 'coffee_table') {
          item.body.setSize(30, 14);
          item.body.setOffset(5, 5);
        }
      }
      return item;
    } else {
      return this.add.image(x, y, textureKey);
    }
  }

  isTyping() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  // ==========================================================================
  // INPUT CONTROLS
  // ==========================================================================
  setupInputControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      X: Phaser.Input.Keyboard.KeyCodes.X,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      G: Phaser.Input.Keyboard.KeyCodes.G,
      Z: Phaser.Input.Keyboard.KeyCodes.Z,
      ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
      TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
      THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
      FOUR: Phaser.Input.Keyboard.KeyCodes.FOUR,
      FIVE: Phaser.Input.Keyboard.KeyCodes.FIVE,
      SIX: Phaser.Input.Keyboard.KeyCodes.SIX
    });

    // Clear default keyboard captures so Space and Arrow keys work inside text inputs
    this.input.keyboard.clearCaptures();

    // Interaction key (X or E)
    this.keys.X.on('down', () => {
      if (this.isTyping() || window.GatherApp?.isModalOpen()) return;
      this.handleActionKey();
    });
    this.keys.E.on('down', () => {
      if (this.isTyping() || window.GatherApp?.isModalOpen()) return;
      this.handleActionKey();
    });

    // Ghost Mode (G)
    this.keys.G.on('down', () => {
      if (this.isTyping() || window.GatherApp?.isModalOpen()) return;
      if (window.GatherApp) window.GatherApp.toggleGhost();
    });

    // Dance Mode (Z)
    this.keys.Z.on('down', () => {
      if (this.isTyping() || window.GatherApp?.isModalOpen()) return;
      if (window.GatherApp) window.GatherApp.toggleDance();
    });

    // Quick Emotes (1-6)
    const EMOTE_MAP = {
      ONE: '👋',
      TWO: '❤️',
      THREE: '👍',
      FOUR: '😂',
      FIVE: '👏',
      SIX: '❓'
    };
    Object.keys(EMOTE_MAP).forEach(keyName => {
      this.keys[keyName].on('down', () => {
        if (this.isTyping() || window.GatherApp?.isModalOpen()) return;
        if (window.GatherApp) window.GatherApp.sendReaction(EMOTE_MAP[keyName]);
      });
    });
  }

  // ==========================================================================
  // LOCAL PLAYER INITIALIZATION
  // ==========================================================================
  initLocalPlayer(playerData) {
    const key = `avatar_${playerData.id}`;
    AvatarGenerator.generateSpritesheet(this, key, playerData.avatar);

    // Create Animations
    this.createAvatarAnimations(key);

    // Physics Sprite
    this.localPlayer = this.physics.add.sprite(playerData.x, playerData.y, key, 0);
    this.localPlayer.setCollideWorldBounds(true);
    this.localPlayer.setSize(18, 14);
    this.localPlayer.setOffset(7, 18);
    this.localPlayer.setDepth(50);
    this.localPlayer.setData('info', playerData);

    // Name tag & Status pill above head
    this.localNameContainer = this.createPlayerHUD(playerData.name, playerData.status);

    // Physical collisions with walls & furniture
    this.playerCollider = this.physics.add.collider(this.localPlayer, this.wallsGroup);

    // Camera follow with deadzone
    this.cameras.main.setBounds(0, 0, GATHER_CONFIG.MAP_WIDTH_PX, GATHER_CONFIG.MAP_HEIGHT_PX);
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);
  }

  createPlayerHUD(name, status) {
    const container = this.add.container(0, 0);
    container.setDepth(60);

    const nameText = this.add.text(0, -22, name, {
      fontSize: '11px',
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5);

    container.add(nameText);
    container.nameText = nameText;
    return container;
  }

  createAvatarAnimations(key) {
    const anims = this.anims;
    const dirs = ['down', 'up', 'left', 'right'];

    dirs.forEach((dir, row) => {
      const start = row * 6;

      // Walk animation
      if (!anims.exists(`${key}_walk_${dir}`)) {
        anims.create({
          key: `${key}_walk_${dir}`,
          frames: anims.generateFrameNumbers(key, { frames: [start, start + 1, start + 2, start + 3] }),
          frameRate: 8,
          repeat: -1
        });
      }

      // Idle frame
      if (!anims.exists(`${key}_idle_${dir}`)) {
        anims.create({
          key: `${key}_idle_${dir}`,
          frames: [{ key, frame: start }],
          frameRate: 1
        });
      }

      // Sit frame
      if (!anims.exists(`${key}_sit_${dir}`)) {
        anims.create({
          key: `${key}_sit_${dir}`,
          frames: [{ key, frame: start + 4 }],
          frameRate: 1
        });
      }

      // Dance frame
      if (!anims.exists(`${key}_dance_${dir}`)) {
        anims.create({
          key: `${key}_dance_${dir}`,
          frames: anims.generateFrameNumbers(key, { frames: [start + 5, start] }),
          frameRate: 5,
          repeat: -1
        });
      }
    });
  }

  // ==========================================================================
  // UPDATE LOOP: Movement & Proximity
  // ==========================================================================
  update(time, delta) {
    if (!this.localPlayer || !this.localPlayer.body) return;

    // 1. Update Name HUD position
    if (this.localNameContainer) {
      this.localNameContainer.setPosition(this.localPlayer.x, this.localPlayer.y);
    }

    // 2. Handle Movement (if not seated and not in modal)
    if (!window.GatherApp || !window.GatherApp.isModalOpen()) {
      this.handlePlayerMovement();
    }

    // 3. Check Nearest Chair or Interactive Object
    this.checkNearbyInteractions();

    // 4. Check Current Private Space
    this.updateCurrentSpace();
  }

  handlePlayerMovement() {
    const player = this.localPlayer;
    const info = player.getData('info');
    if (!info) return;

    if (this.isTyping() || window.GatherApp?.isModalOpen()) {
      player.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    // If seated and player pressed movement keys, stand up!
    if (info.isSitting && (vx !== 0 || vy !== 0)) {
      this.standUp();
    }

    if (info.isSitting) {
      player.setVelocity(0, 0);
      return;
    }

    // Calculate speed (boosted if coffee buff active)
    let speed = GATHER_CONFIG.WALK_SPEED;
    if (this.speedBuffTimer > Date.now()) {
      speed = GATHER_CONFIG.BOOST_SPEED;
    }

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    player.setVelocity(vx * speed, vy * speed);

    const key = `avatar_${info.id}`;
    let dir = info.direction || 'down';

    if (vx < 0) dir = 'left';
    else if (vx > 0) dir = 'right';
    else if (vy < 0) dir = 'up';
    else if (vy > 0) dir = 'down';

    info.direction = dir;

    if (vx !== 0 || vy !== 0) {
      info.anim = 'walk';
      player.anims.play(`${key}_walk_${dir}`, true);

      // Emit movement to server (throttled by NetworkManager)
      if (window.GatherApp) {
        window.GatherApp.sendMovement(player.x, player.y, dir, 'walk');
      }
    } else {
      if (info.isDancing) {
        player.anims.play(`${key}_dance_${dir}`, true);
      } else {
        info.anim = 'idle';
        player.anims.play(`${key}_idle_${dir}`, true);
        if (window.GatherApp) {
          window.GatherApp.sendIdle(player.x, player.y, dir);
        }
      }
    }
  }

  // ==========================================================================
  // CHAIR SITTING & STANDING
  // ==========================================================================
  sitOnChair(chair) {
    const player = this.localPlayer;
    const info = player.getData('info');
    if (!info) return;

    info.isSitting = true;
    info.chairId = chair.id;
    info.direction = chair.direction;
    info.anim = 'sit';

    // Snap player position onto chair
    player.setPosition(chair.x, chair.y);
    player.setVelocity(0, 0);

    const key = `avatar_${info.id}`;
    player.anims.play(`${key}_sit_${chair.direction}`, true);

    if (window.GatherApp) {
      window.GatherApp.sendSit(chair.id, chair.x, chair.y, chair.direction);
      // Poker table integration: When sitting on a poker chair, open the Kosmi poker table!
      if (chair.spaceId === 'poker_room' || chair.id?.startsWith('poker_chair')) {
        const seatIdx = chair.seatIndex !== undefined ? chair.seatIndex : 0;
        window.GatherApp.joinPokerSeat(seatIdx, chair.id);
      }
    }
  }

  standUp() {
    const player = this.localPlayer;
    const info = player.getData('info');
    if (!info) return;

    const prevChairId = info.chairId;
    info.isSitting = false;
    info.chairId = null;
    info.anim = 'idle';

    const key = `avatar_${info.id}`;
    player.anims.play(`${key}_idle_${info.direction}`, true);

    if (window.GatherApp) {
      window.GatherApp.sendStand(player.x, player.y);
      if (prevChairId && (prevChairId.startsWith('poker_chair') || this.currentSpace === 'poker_room')) {
        window.GatherApp.leavePokerSeat();
      }
    }
  }

  // ==========================================================================
  // ACTION KEY HANDLER (X or E)
  // ==========================================================================
  handleActionKey() {
    const info = this.localPlayer?.getData('info');
    if (info && info.isSitting) {
      this.standUp();
      return;
    }

    if (this.activeInteraction) {
      if (this.activeInteraction.type === 'chair') {
        this.sitOnChair(this.activeInteraction.chair);
      } else if (this.activeInteraction.type === 'object') {
        const obj = this.activeInteraction.object;
        if (window.GatherApp) {
          window.GatherApp.openObjectModal(obj.modalId, obj);
        }
      }
    }
  }

  // ==========================================================================
  // NEARBY CHECKS (Gather.town [X] Tooltip)
  // ==========================================================================
  checkNearbyInteractions() {
    if (!this.localPlayer) return;

    const px = this.localPlayer.x;
    const py = this.localPlayer.y;
    const info = this.localPlayer.getData('info');

    // 1. If currently seated, show "[X] Stand Up"
    if (info && info.isSitting) {
      this.promptContainer.setVisible(true);
      this.promptContainer.setPosition(px, py - 36);
      this.promptText.setText('Press X to Stand Up');
      this.activeInteraction = { type: 'stand' };
      return;
    }

    let closestDist = Infinity;
    let closestItem = null;

    // 2. Check chairs
    GATHER_CONFIG.CHAIRS.forEach(chair => {
      const d = Phaser.Math.Distance.Between(px, py, chair.x, chair.y);
      if (d < 36 && d < closestDist) {
        closestDist = d;
        closestItem = {
          type: 'chair',
          chair: chair,
          prompt: 'Press X to Sit'
        };
      }
    });

    // 3. Check interactive objects
    GATHER_CONFIG.INTERACTIVE_OBJECTS.forEach(obj => {
      const d = Phaser.Math.Distance.Between(px, py, obj.x, obj.y);
      if (d < GATHER_CONFIG.INTERACTION_DISTANCE && d < closestDist) {
        closestDist = d;
        closestItem = {
          type: 'object',
          object: obj,
          prompt: obj.prompt
        };
      }
    });

    if (closestItem) {
      this.activeInteraction = closestItem;
      this.promptContainer.setVisible(true);
      this.promptContainer.setPosition(px, py - 38);
      this.promptText.setText(closestItem.prompt);
    } else {
      this.activeInteraction = null;
      this.promptContainer.setVisible(false);
    }
  }

  // ==========================================================================
  // PRIVATE SPACE DETECTION
  // ==========================================================================
  updateCurrentSpace() {
    if (!this.localPlayer) return;
    const px = this.localPlayer.x;
    const py = this.localPlayer.y;

    let detectedSpace = 'open_office';

    for (const [spaceId, space] of Object.entries(GATHER_CONFIG.SPACES)) {
      if (space.bounds) {
        const { x1, y1, x2, y2 } = space.bounds;
        if (px >= x1 && px <= x2 && py >= y1 && py <= y2) {
          detectedSpace = spaceId;
          break;
        }
      }
    }

    if (detectedSpace !== this.currentSpace) {
      this.currentSpace = detectedSpace;
      if (window.GatherApp) {
        window.GatherApp.onSpaceChanged(detectedSpace, GATHER_CONFIG.SPACES[detectedSpace]);
      }
    }
  }

  // ==========================================================================
  // REMOTE PLAYERS MANAGEMENT
  // ==========================================================================
  addRemotePlayer(playerData) {
    if (this.remotePlayers.has(playerData.id)) return;

    const key = `avatar_${playerData.id}`;
    AvatarGenerator.generateSpritesheet(this, key, playerData.avatar);
    this.createAvatarAnimations(key);

    const sprite = this.physics.add.sprite(playerData.x, playerData.y, key, 0);
    sprite.setDepth(45);
    sprite.setData('info', playerData);

    const hud = this.createPlayerHUD(playerData.name, playerData.status);

    this.remotePlayers.set(playerData.id, { sprite, hud });
  }

  updateRemotePlayerMove(data) {
    const entry = this.remotePlayers.get(data.id);
    if (!entry) return;

    const { sprite, hud } = entry;
    sprite.setPosition(data.x, data.y);
    hud.setPosition(data.x, data.y);

    const info = sprite.getData('info');
    if (info) {
      info.direction = data.direction;
      info.anim = data.anim;
      info.isSitting = data.isSitting;
    }

    const key = `avatar_${data.id}`;
    if (data.isSitting) {
      sprite.anims.play(`${key}_sit_${data.direction}`, true);
    } else if (data.anim === 'walk') {
      sprite.anims.play(`${key}_walk_${data.direction}`, true);
    } else {
      sprite.anims.play(`${key}_idle_${data.direction}`, true);
    }
  }

  removeRemotePlayer(id) {
    const entry = this.remotePlayers.get(id);
    if (entry) {
      entry.sprite.destroy();
      entry.hud.destroy();
      this.remotePlayers.delete(id);
    }
  }

  // ==========================================================================
  // VFX: REACTION EMOTE ANIMATION
  // ==========================================================================
  spawnReactionEmote(x, y, emoji) {
    const emoteText = this.add.text(x, y - 20, emoji, {
      fontSize: '22px'
    }).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: emoteText,
      y: y - 70,
      alpha: 0,
      scale: 1.4,
      duration: 1800,
      ease: 'Power2',
      onComplete: () => emoteText.destroy()
    });
  }

  // Coffee Speed Boost Buff
  applySpeedBuff(durationMs = 30000) {
    this.speedBuffTimer = Date.now() + durationMs;
  }
}
