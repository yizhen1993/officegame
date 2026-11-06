/**
 * ============================================================================
 * Gather.town v2 Virtual Office — Application Bootstrap & Game Entry Point
 * Configures Phaser 3 Engine, Network Manager, and UI Controller
 * ============================================================================
 */

import { GATHER_CONFIG } from './config.js';
import { MainScene } from './mainScene.js';
import { NetworkManager } from './network.js';
import { UIManager } from './uiManager.js';
import { WebRTCManager } from './webrtcManager.js';
import { PokerManager } from './pokerManager.js';

class GatherAppController {
  constructor() {
    this.network = new NetworkManager();
    this.scene = null;
    this.ui = null;
    this.webrtc = null;
    this.poker = null;
    this.game = null;

    this.localPlayerState = null;
    this.allPlayers = new Map();

    window.GatherApp = this;
    this.init();
  }

  init() {
    // 1. Initialize Phaser 3 Game Config (ENVELOP mode to fulfill screen without blank side bars)
    const config = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: GATHER_CONFIG.MAP_WIDTH_PX,
      height: GATHER_CONFIG.MAP_HEIGHT_PX,
      pixelArt: true,
      roundPixels: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GATHER_CONFIG.MAP_WIDTH_PX,
        height: GATHER_CONFIG.MAP_HEIGHT_PX
      }
    };

    this.game = new Phaser.Game(config);

    // Keep scale responsive on window resize
    window.addEventListener('resize', () => {
      if (this.game && this.game.scale) {
        this.game.scale.refresh();
      }
    });

    // 2. Setup Network Event Listeners
    this.setupNetworkListeners();

    // 3. Connect to Server
    this.network.connect();
  }

  onSceneReady(scene) {
    this.scene = scene;
    this.ui = new UIManager(this.network, this.scene);
    this.webrtc = new WebRTCManager(this.network, this.ui);
    this.ui.webrtc = this.webrtc;
    this.poker = new PokerManager(this.network, this.ui);
    this.ui.poker = this.poker;

    if (this.pendingInitState) {
      this.handleInitState(this.pendingInitState);
      this.pendingInitState = null;
    }
  }

  setupNetworkListeners() {
    this.network.on('init_state', (data) => {
      if (!this.scene) {
        this.pendingInitState = data;
        return;
      }
      this.handleInitState(data);
    });

    this.network.on('player_joined', (player) => {
      this.allPlayers.set(player.id, player);
      if (this.scene) this.scene.addRemotePlayer(player);
      if (this.ui) {
        this.ui.allPlayers = this.allPlayers;
        this.ui.updateParticipantsList();
        this.ui.renderVideoGrid();
      }
    });

    this.network.on('player_left', (data) => {
      this.allPlayers.delete(data.id);
      if (this.scene) this.scene.removeRemotePlayer(data.id);
      if (this.ui) {
        this.ui.allPlayers = this.allPlayers;
        this.ui.updateParticipantsList();
        this.ui.renderVideoGrid();
      }
    });

    this.network.on('player_moved', (data) => {
      const p = this.allPlayers.get(data.id);
      if (p) {
        p.x = data.x;
        p.y = data.y;
        p.direction = data.direction;
        p.anim = data.anim;
        p.isSitting = data.isSitting;
      }
      if (this.scene) this.scene.updateRemotePlayerMove(data);
    });

    this.network.on('player_idled', (data) => {
      const p = this.allPlayers.get(data.id);
      if (p) {
        p.x = data.x;
        p.y = data.y;
        p.direction = data.direction;
        p.anim = 'idle';
      }
      if (this.scene) this.scene.updateRemotePlayerMove({ ...data, anim: 'idle' });
    });

    this.network.on('player_sat', (data) => {
      const p = this.allPlayers.get(data.id);
      if (p) {
        p.x = data.x;
        p.y = data.y;
        p.isSitting = true;
        p.chairId = data.chairId;
        p.direction = data.direction;
      }
      if (this.scene) {
        this.scene.updateRemotePlayerMove({ ...data, isSitting: true, anim: 'sit' });
      }
    });

    this.network.on('player_stood', (data) => {
      const p = this.allPlayers.get(data.id);
      if (p) {
        p.isSitting = false;
        p.chairId = null;
        p.x = data.x;
        p.y = data.y;
      }
      if (this.scene) {
        this.scene.updateRemotePlayerMove({ ...data, isSitting: false, anim: 'idle' });
      }
    });

    this.network.on('player_ghost_toggled', (data) => {
      const p = this.allPlayers.get(data.id);
      if (p) p.isGhost = data.isGhost;
      if (this.scene) {
        const entry = this.scene.remotePlayers.get(data.id);
        if (entry) entry.sprite.setAlpha(data.isGhost ? 0.45 : 1.0);
      }
    });

    this.network.on('player_dance_toggled', (data) => {
      const p = this.allPlayers.get(data.id);
      if (p) p.isDancing = data.isDancing;
      if (this.scene) {
        const entry = this.scene.remotePlayers.get(data.id);
        if (entry) {
          const key = `avatar_${data.id}`;
          if (data.isDancing) {
            entry.sprite.anims.play(`${key}_dance_${p.direction || 'down'}`, true);
          } else {
            entry.sprite.anims.play(`${key}_idle_${p.direction || 'down'}`, true);
          }
        }
      }
    });

    this.network.on('reaction_broadcast', (data) => {
      if (this.scene) {
        this.scene.spawnReactionEmote(data.x, data.y, data.emoji);
      }
    });

    this.network.on('player_space_changed', (data) => {
      const p = this.allPlayers.get(data.id);
      if (p) p.activeSpace = data.newSpace;
      if (this.ui) {
        this.ui.updateParticipantsList();
        this.ui.renderVideoGrid();
      }
    });

    this.network.on('player_avatar_updated', (data) => {
      const p = this.allPlayers.get(data.id);
      if (p) {
        p.name = data.name;
        p.avatar = data.avatar;
      }
      if (this.scene) {
        const key = `avatar_${data.id}`;
        import('./avatar.js').then(({ AvatarGenerator }) => {
          AvatarGenerator.generateSpritesheet(this.scene, key, data.avatar);
          const entry = this.scene.remotePlayers.get(data.id);
          if (entry) entry.hud.nameText.setText(data.name);
        });
      }
      if (this.ui) {
        this.ui.updateParticipantsList();
        this.ui.renderVideoGrid();
      }
    });

    this.network.on('player_av_updated', (data) => {
      const p = this.allPlayers.get(data.id);
      if (p) p.avState = data.avState;
      if (this.ui) this.ui.renderVideoGrid();
    });

    // Modules
    this.network.on('whiteboard_stroke_added', (stroke) => {
      if (this.ui && this.ui.whiteboardMgr) {
        this.ui.whiteboardMgr.renderStroke(stroke);
      }
    });

    this.network.on('whiteboard_cleared', () => {
      if (this.ui && this.ui.whiteboardMgr) {
        this.ui.whiteboardMgr.clearCanvasLocally();
      }
    });

    this.network.on('notes_updated', (notes) => {
      if (this.ui) this.ui.renderBulletinNotes(notes);
    });

    this.network.on('media_synced', (media) => {
      if (this.ui) this.ui.updateMediaScreen(media);
    });

    this.network.on('media_error', (data) => {
      if (this.ui) this.ui.showToast(`⚠️ ${data?.message || 'Invalid YouTube video'}`, '#EF4444');
    });

    this.network.on('arcade_leaderboard_updated', (leaderboard) => {
      if (this.ui) this.ui.updateArcadeLeaderboard(leaderboard);
    });

    this.network.on('coffee_brewed', (data) => {
      if (this.ui) {
        this.ui.showToast(`☕ ${data.playerName} brewed a delicious ${data.beverage}!`, '#10B981');
      }
    });

    this.network.on('roulette_started', (data) => {
      if (this.ui) this.ui.handleRouletteStarted(data);
    });

    this.network.on('roulette_finished', (data) => {
      if (this.ui) this.ui.handleRouletteFinished(data);
    });

    this.network.on('chat_broadcast', (msg) => {
      if (this.ui) this.ui.appendChatMessage(msg);
    });
  }

  handleInitState(data) {
    this.localPlayerState = data.players[data.selfId];
    this.allPlayers = new Map(Object.entries(data.players));

    // Initialize local player in Phaser
    if (this.scene && this.localPlayerState) {
      this.scene.initLocalPlayer(this.localPlayerState);

      // Add other players
      this.allPlayers.forEach(p => {
        if (p.id !== data.selfId) {
          this.scene.addRemotePlayer(p);
        }
      });
    }

    // Initialize UI Manager state
    if (this.ui) {
      this.ui.localPlayerState = this.localPlayerState;
      this.ui.allPlayers = this.allPlayers;
      this.ui.spaces = data.spaces;

      this.ui.updateDockProfile();
      this.ui.updateDockAVButtons();
      this.ui.updateParticipantsList();
      this.ui.renderVideoGrid();
      this.ui.renderBulletinNotes(data.bulletinNotes);
      this.ui.updateMediaScreen(data.media);
      this.ui.updateArcadeLeaderboard(data.arcade?.leaderboard);

      if (this.ui.whiteboardMgr && data.whiteboard?.strokes) {
        this.ui.whiteboardMgr.loadInitialStrokes(data.whiteboard.strokes);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Bridge Methods called from Scene & UI
  // --------------------------------------------------------------------------
  sendMovement(x, y, dir, anim) {
    if (this.localPlayerState) {
      this.localPlayerState.x = x;
      this.localPlayerState.y = y;
      this.localPlayerState.direction = dir;
    }
    this.network.sendMovement(x, y, dir, anim);
    if (this.ui) this.ui.renderVideoGrid();
    if (this.webrtc) {
      this.webrtc.updateProximityVolumes(this.localPlayerState, this.allPlayers);
    }
  }

  joinPokerSeat(seatIndex, chairId) {
    if (this.poker) {
      this.poker.joinSeat(seatIndex, chairId);
    }
  }

  leavePokerSeat() {
    if (this.poker) {
      this.poker.leaveTable();
    }
  }

  sendIdle(x, y, dir) {
    if (this.localPlayerState) {
      this.localPlayerState.x = x;
      this.localPlayerState.y = y;
      this.localPlayerState.direction = dir;
    }
    this.network.sendIdle(x, y, dir);
  }

  sendSit(chairId, x, y, dir) {
    if (this.localPlayerState) {
      this.localPlayerState.isSitting = true;
      this.localPlayerState.chairId = chairId;
      this.localPlayerState.x = x;
      this.localPlayerState.y = y;
      this.localPlayerState.direction = dir;
    }
    this.network.sendSit(chairId, x, y, dir);
  }

  sendStand(x, y) {
    if (this.localPlayerState) {
      this.localPlayerState.isSitting = false;
      this.localPlayerState.chairId = null;
      this.localPlayerState.x = x;
      this.localPlayerState.y = y;
    }
    this.network.sendStand(x, y);
  }

  toggleGhost() {
    if (!this.localPlayerState) return;
    const cur = !this.localPlayerState.isGhost;
    this.localPlayerState.isGhost = cur;
    if (this.scene && this.scene.localPlayer) {
      this.scene.localPlayer.setAlpha(cur ? 0.45 : 1.0);
      if (this.scene.playerCollider) {
        this.scene.playerCollider.active = !cur; // Can pass through objects in ghost mode!
      }
    }
    this.network.toggleGhost(cur);
    if (this.ui) {
      this.ui.showToast(cur ? '👻 Ghost Mode ON (Walk through walls)' : 'Ghost Mode OFF', '#6366F1');
    }
  }

  toggleDance() {
    if (!this.localPlayerState) return;
    const cur = !this.localPlayerState.isDancing;
    this.localPlayerState.isDancing = cur;
    if (this.scene && this.scene.localPlayer) {
      const key = `avatar_${this.localPlayerState.id}`;
      if (cur) {
        this.scene.localPlayer.anims.play(`${key}_dance_${this.localPlayerState.direction || 'down'}`, true);
      } else {
        this.scene.localPlayer.anims.play(`${key}_idle_${this.localPlayerState.direction || 'down'}`, true);
      }
    }
    this.network.toggleDance(cur);
  }

  sendReaction(emoji) {
    if (!this.localPlayerState || !this.scene) return;
    this.scene.spawnReactionEmote(this.localPlayerState.x, this.localPlayerState.y, emoji);
    this.network.sendReaction(emoji);
  }

  onSpaceChanged(spaceId, spaceInfo) {
    if (this.localPlayerState) {
      this.localPlayerState.activeSpace = spaceId;
    }
    this.network.changeSpace(spaceId);
    if (this.ui) {
      this.ui.updateSpaceHUD(spaceId, spaceInfo);
      this.ui.updateParticipantsList();
    }
  }

  openObjectModal(modalId, objConfig) {
    if (!this.ui) return;
    const keyMap = {
      'modal-whiteboard': 'whiteboard',
      'modal-media': 'media',
      'modal-arcade': 'arcade',
      'modal-bulletin': 'bulletin',
      'modal-coffee': 'coffee',
      'modal-wheel': 'wheel',
      'modal-poker': 'poker'
    };
    const key = keyMap[modalId] || modalId;
    this.ui.openModal(key, objConfig);
  }

  isModalOpen() {
    return this.ui ? this.ui.isModalOpen() : false;
  }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
  new GatherAppController();
});
