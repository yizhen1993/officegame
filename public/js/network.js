/**
 * ============================================================================
 * Gather.town v2 Virtual Office — Authoritative Network Protocol Manager
 * Handles low-latency Socket.IO communications and event dispatching.
 * ============================================================================
 */

export class NetworkManager {
  constructor() {
    this.socket = null;
    this.selfId = null;
    this.lastMoveTime = 0;
    this.listeners = new Map();
  }

  connect() {
    // Socket.io client connects automatically to the host origin
    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      this.selfId = this.socket.id;
      console.log(`[Gather.town v2 Network] 🟢 Connected with ID: ${this.selfId}`);
      this.emitLocal('connected', { selfId: this.selfId });
    });

    this.socket.on('disconnect', () => {
      console.log(`[Gather.town v2 Network] 🔴 Disconnected from server.`);
      this.emitLocal('disconnected');
    });

    // ------------------------------------------------------------------------
    // Server Event Handlers
    // ------------------------------------------------------------------------
    this.socket.on('init_state', (data) => this.emitLocal('init_state', data));
    this.socket.on('player_joined', (data) => this.emitLocal('player_joined', data));
    this.socket.on('player_left', (data) => this.emitLocal('player_left', data));
    this.socket.on('player_moved', (data) => this.emitLocal('player_moved', data));
    this.socket.on('player_idled', (data) => this.emitLocal('player_idled', data));
    this.socket.on('player_sat', (data) => this.emitLocal('player_sat', data));
    this.socket.on('player_stood', (data) => this.emitLocal('player_stood', data));
    this.socket.on('player_ghost_toggled', (data) => this.emitLocal('player_ghost_toggled', data));
    this.socket.on('player_dance_toggled', (data) => this.emitLocal('player_dance_toggled', data));
    this.socket.on('reaction_broadcast', (data) => this.emitLocal('reaction_broadcast', data));
    this.socket.on('player_space_changed', (data) => this.emitLocal('player_space_changed', data));
    this.socket.on('player_avatar_updated', (data) => this.emitLocal('player_avatar_updated', data));
    this.socket.on('player_status_updated', (data) => this.emitLocal('player_status_updated', data));
    this.socket.on('player_av_updated', (data) => this.emitLocal('player_av_updated', data));

    // Collaborative modules
    this.socket.on('whiteboard_stroke_added', (data) => this.emitLocal('whiteboard_stroke_added', data));
    this.socket.on('whiteboard_cleared', () => this.emitLocal('whiteboard_cleared'));
    this.socket.on('notes_updated', (data) => this.emitLocal('notes_updated', data));
    this.socket.on('media_synced', (data) => this.emitLocal('media_synced', data));
    this.socket.on('arcade_leaderboard_updated', (data) => this.emitLocal('arcade_leaderboard_updated', data));
    this.socket.on('roulette_started', (data) => this.emitLocal('roulette_started', data));
    this.socket.on('roulette_finished', (data) => this.emitLocal('roulette_finished', data));
    this.socket.on('coffee_brewed', (data) => this.emitLocal('coffee_brewed', data));
    this.socket.on('chat_broadcast', (data) => this.emitLocal('chat_broadcast', data));
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emitLocal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  // --------------------------------------------------------------------------
  // Outgoing Client Actions
  // --------------------------------------------------------------------------
  sendMovement(x, y, direction, anim) {
    const now = Date.now();
    if (now - this.lastMoveTime < 45) return; // Throttled to ~22fps for smooth network interpolation
    this.lastMoveTime = now;

    if (this.socket) {
      this.socket.emit('player_move', { x, y, direction, anim });
    }
  }

  sendIdle(x, y, direction) {
    if (this.socket) {
      this.socket.emit('player_idle', { x, y, direction });
    }
  }

  sendSit(chairId, x, y, direction) {
    if (this.socket) {
      this.socket.emit('player_sit', { chairId, x, y, direction });
    }
  }

  sendStand(x, y) {
    if (this.socket) {
      this.socket.emit('player_stand', { x, y });
    }
  }

  toggleGhost(isGhost) {
    if (this.socket) {
      this.socket.emit('toggle_ghost', { isGhost });
    }
  }

  toggleDance(isDancing) {
    if (this.socket) {
      this.socket.emit('toggle_dance', { isDancing });
    }
  }

  sendReaction(emoji) {
    if (this.socket) {
      this.socket.emit('send_reaction', { emoji });
    }
  }

  changeSpace(spaceId) {
    if (this.socket) {
      this.socket.emit('change_space', { spaceId });
    }
  }

  updateAvatar(name, avatar) {
    if (this.socket) {
      this.socket.emit('update_avatar', { name, avatar });
    }
  }

  updateStatus(text, emoji) {
    if (this.socket) {
      this.socket.emit('update_status', { text, emoji });
    }
  }

  updateAVState(avState) {
    if (this.socket) {
      this.socket.emit('update_av_state', avState);
    }
  }

  sendWhiteboardStroke(stroke) {
    if (this.socket) {
      this.socket.emit('whiteboard_draw', stroke);
    }
  }

  clearWhiteboard() {
    if (this.socket) {
      this.socket.emit('whiteboard_clear');
    }
  }

  addNote(title, content, color) {
    if (this.socket) {
      this.socket.emit('notes_add', { title, content, color });
    }
  }

  deleteNote(id) {
    if (this.socket) {
      this.socket.emit('notes_delete', { id });
    }
  }

  changeMedia(url, title) {
    if (this.socket) {
      this.socket.emit('media_change', { url, title });
    }
  }

  submitArcadeScore(score) {
    if (this.socket) {
      this.socket.emit('arcade_submit_score', { score });
    }
  }

  brewCoffee(beverage) {
    if (this.socket) {
      this.socket.emit('coffee_brew', { beverage });
    }
  }

  spinRoulette() {
    if (this.socket) {
      this.socket.emit('roulette_spin');
    }
  }

  sendChat(channel, text, recipientId = null) {
    if (this.socket) {
      this.socket.emit('send_chat', { channel, text, recipientId });
    }
  }
}
