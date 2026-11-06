/**
 * ============================================================================
 * Gather.town v2 Virtual Office — Authoritative Multiplayer Game Server
 * Port: 3000 (Internal Docker container) -> Reverse Proxied to office2.kopipeng.online
 * Features:
 *  - Full Gather.town v2 private space audio/video/chat isolation
 *  - Synchronized collaborative whiteboard with vector strokes
 *  - Synchronized YouTube media presentation screen
 *  - Synchronized team bulletin board / sticky notes
 *  - Retro arcade cabinet with global leaderboard
 *  - Coffee machine speed buff mechanic
 *  - Ghost mode (G key) & Dance mode (Z key)
 *  - 4-way chair sitting mechanics with proper seat alignment
 *  - Proximity and multi-channel chat (Global, Space, Nearby, Direct)
 * ============================================================================
 */

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000;

// ============================================================================
// 1. IN-MEMORY STATE DATABASE
// ============================================================================

const GATHER_OFFICE_STATE = {
  players: {}, // socket.id -> player object
  spaces: {
    open_office: { name: 'Open Office Hallway', maxCapacity: 50, isPrivate: false },
    boardroom: { name: 'Boardroom Alpha', maxCapacity: 10, isPrivate: true },
    brainstorm: { name: 'Brainstorm Lab', maxCapacity: 8, isPrivate: true },
    lounge: { name: 'Cozy Lounge & Fireplace', maxCapacity: 12, isPrivate: true },
    cafeteria: { name: 'Cafeteria & Arcade Bar', maxCapacity: 16, isPrivate: true },
    pod_1: { name: 'Quiet Focus Pod 1', maxCapacity: 2, isPrivate: true },
    pod_2: { name: 'Quiet Focus Pod 2', maxCapacity: 2, isPrivate: true },
    pod_3: { name: 'Quiet Focus Pod 3', maxCapacity: 2, isPrivate: true },
    pod_4: { name: 'Quiet Focus Pod 4', maxCapacity: 2, isPrivate: true }
  },
  whiteboard: {
    strokes: [
      {
        id: 'init_1',
        type: 'text',
        x: 60,
        y: 60,
        text: '🚀 Welcome to Gather.town v2 HQ!',
        color: '#4F46E5',
        size: 18
      },
      {
        id: 'init_2',
        type: 'text',
        x: 60,
        y: 100,
        text: 'Draw collaboratively in real-time or leave notes.',
        color: '#6B7280',
        size: 14
      }
    ]
  },
  bulletinNotes: [
    {
      id: 'note_1',
      title: '🌟 Welcome to KopiPeng Virtual Office v2',
      content: 'Authentic Gather.town v2 experience! Use WASD/Arrows to walk, X to interact, G for Ghost mode, Z to dance, and 1-6 for quick reactions.',
      color: '#FEF08A', // Yellow
      author: 'Alex (Lead)',
      date: 'Today'
    },
    {
      id: 'note_2',
      title: '☕ Coffee Station Ready',
      content: 'Fresh espresso and boba tea available at the cafeteria bar. Enjoy +50% sprint speed boost for 30s!',
      color: '#BAE6FD', // Blue
      author: 'Barista Bot',
      date: 'Today'
    },
    {
      id: 'note_3',
      title: '🔒 Private Space Feature',
      content: 'Step into meeting rooms (Boardroom, Brainstorm, Lounge, Focus Pods) to isolate audio/video and chat exclusively to participants inside.',
      color: '#BBF7D0', // Green
      author: 'Security',
      date: 'Today'
    }
  ],
  media: {
    videoId: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio 📚 - beats to relax/study to',
    embedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0&loop=1&playlist=jfKfPfyJRdk&controls=1',
    playing: true,
    setBy: 'System',
    startedAt: Date.now()
  },
  arcade: {
    leaderboard: [
      { name: 'PixelMaster', score: 1240, date: 'Nov 05' },
      { name: 'KopiPeng', score: 980, date: 'Nov 06' },
      { name: 'GatherPro', score: 750, date: 'Nov 06' }
    ]
  },
  roulette: {
    active: false,
    result: null,
    topic: 'What is your favorite coffee or tea?'
  }
};

// Preset Avatar generation options
const DEFAULT_SKIN_TONES = ['#FDDFB5', '#F5C698', '#D69B67', '#A66A38', '#633B18', '#FFE7D1'];
const DEFAULT_HAIR_STYLES = ['buzz', 'part', 'curly', 'bob', 'messy', 'ponytail', 'wavy', 'afro'];
const DEFAULT_HAIR_COLORS = ['#1E1E24', '#3E2723', '#6D4C41', '#E0A96D', '#A52A2A', '#9E9E9E', '#3B82F6', '#8B5CF6'];
const DEFAULT_OUTFIT_STYLES = ['suit', 'hoodie', 'polo', 'jacket', 'turtleneck', 'tee', 'cardigan', 'labcoat'];
const DEFAULT_OUTFIT_COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#1E293B', '#14B8A6'];
const DEFAULT_ACCESSORIES = ['none', 'glasses', 'sunglasses', 'headphones', 'beanie', 'cap', 'cat_ears'];
const NAME_LIST = ['Jordan', 'Taylor', 'Morgan', 'Sam', 'Casey', 'Riley', 'Avery', 'Dakota', 'Quinn', 'Harper', 'Kopi', 'Boba'];

function generateRandomAvatar() {
  const skin = DEFAULT_SKIN_TONES[Math.floor(Math.random() * DEFAULT_SKIN_TONES.length)];
  const hair = DEFAULT_HAIR_STYLES[Math.floor(Math.random() * DEFAULT_HAIR_STYLES.length)];
  const hairColor = DEFAULT_HAIR_COLORS[Math.floor(Math.random() * DEFAULT_HAIR_COLORS.length)];
  const outfit = DEFAULT_OUTFIT_STYLES[Math.floor(Math.random() * DEFAULT_OUTFIT_STYLES.length)];
  const outfitColor = DEFAULT_OUTFIT_COLORS[Math.floor(Math.random() * DEFAULT_OUTFIT_COLORS.length)];
  const accessory = DEFAULT_ACCESSORIES[Math.floor(Math.random() * DEFAULT_ACCESSORIES.length)];
  const name = NAME_LIST[Math.floor(Math.random() * NAME_LIST.length)] + '_' + Math.floor(10 + Math.random() * 90);
  return {
    name,
    avatar: {
      skin,
      hair,
      hairColor,
      outfit,
      outfitColor,
      accessory,
      accessoryColor: '#334155'
    }
  };
}

function sanitizeText(str, maxLen = 150) {
  if (typeof str !== 'string') return '';
  return str
    .slice(0, maxLen)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let videoId = null;
  const match1 = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match1) videoId = match1[1];
  if (!videoId) {
    const match2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match2) videoId = match2[1];
  }
  if (!videoId) {
    const match3 = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (match3) videoId = match3[1];
  }
  if (videoId) {
    return {
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}&controls=1`
    };
  }
  return null;
}

// ============================================================================
// 2. SOCKET.IO EVENT HANDLING
// ============================================================================

io.on('connection', (socket) => {
  console.log(`[Gather.town v2] 🟢 Player connected: ${socket.id}`);

  const defaultSetup = generateRandomAvatar();

  const newPlayer = {
    id: socket.id,
    name: defaultSetup.name,
    avatar: defaultSetup.avatar,
    x: 800, // Center of Reception/Main Hallway
    y: 980,
    direction: 'down',
    anim: 'idle',
    isSitting: false,
    chairId: null,
    isGhost: false,
    isDancing: false,
    activeSpace: 'open_office',
    avState: {
      mic: false,
      camera: false,
      screenShare: false
    },
    status: {
      text: 'Available to chat',
      emoji: '💬'
    },
    heldItem: 'none',
    joinedAt: Date.now()
  };

  GATHER_OFFICE_STATE.players[socket.id] = newPlayer;

  // Send initial state to the connecting player
  socket.emit('init_state', {
    selfId: socket.id,
    players: GATHER_OFFICE_STATE.players,
    spaces: GATHER_OFFICE_STATE.spaces,
    whiteboard: GATHER_OFFICE_STATE.whiteboard,
    bulletinNotes: GATHER_OFFICE_STATE.bulletinNotes,
    media: GATHER_OFFICE_STATE.media,
    arcade: GATHER_OFFICE_STATE.arcade,
    roulette: GATHER_OFFICE_STATE.roulette
  });

  // Broadcast new player to everyone else
  socket.broadcast.emit('player_joined', newPlayer);

  // Broadcast system chat notification
  io.emit('chat_broadcast', {
    id: 'sys_' + Date.now(),
    channel: 'global',
    senderId: 'system',
    senderName: 'HQ System',
    avatarColor: '#5E6AD2',
    text: `👋 ${newPlayer.name} has entered the Gather office!`,
    timestamp: Date.now()
  });

  // --------------------------------------------------------------------------
  // Movement & Orientation
  // --------------------------------------------------------------------------
  socket.on('player_move', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    player.x = data.x;
    player.y = data.y;
    player.direction = data.direction || player.direction;
    player.anim = data.anim || 'walk';
    player.isSitting = false;
    player.chairId = null;

    socket.broadcast.emit('player_moved', {
      id: socket.id,
      x: player.x,
      y: player.y,
      direction: player.direction,
      anim: player.anim,
      isSitting: false
    });
  });

  socket.on('player_idle', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    player.x = data.x !== undefined ? data.x : player.x;
    player.y = data.y !== undefined ? data.y : player.y;
    player.direction = data.direction || player.direction;
    player.anim = 'idle';

    socket.broadcast.emit('player_idled', {
      id: socket.id,
      x: player.x,
      y: player.y,
      direction: player.direction
    });
  });

  // --------------------------------------------------------------------------
  // Sitting Mechanics
  // --------------------------------------------------------------------------
  socket.on('player_sit', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    player.isSitting = true;
    player.chairId = data.chairId;
    player.x = data.x;
    player.y = data.y;
    player.direction = data.direction || 'down';
    player.anim = 'sit';

    io.emit('player_sat', {
      id: socket.id,
      chairId: data.chairId,
      x: data.x,
      y: data.y,
      direction: player.direction
    });
  });

  socket.on('player_stand', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    player.isSitting = false;
    player.chairId = null;
    player.anim = 'idle';
    if (data && data.x !== undefined && data.y !== undefined) {
      player.x = data.x;
      player.y = data.y;
    }

    io.emit('player_stood', {
      id: socket.id,
      x: player.x,
      y: player.y
    });
  });

  // --------------------------------------------------------------------------
  // Ghost Mode & Dance Mode
  // --------------------------------------------------------------------------
  socket.on('toggle_ghost', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    player.isGhost = typeof data.isGhost === 'boolean' ? data.isGhost : !player.isGhost;
    io.emit('player_ghost_toggled', {
      id: socket.id,
      isGhost: player.isGhost
    });
  });

  socket.on('toggle_dance', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    player.isDancing = typeof data.isDancing === 'boolean' ? data.isDancing : !player.isDancing;
    player.anim = player.isDancing ? 'dance' : 'idle';

    io.emit('player_dance_toggled', {
      id: socket.id,
      isDancing: player.isDancing
    });
  });

  // --------------------------------------------------------------------------
  // Floating Reaction Emotes (1-6)
  // --------------------------------------------------------------------------
  socket.on('send_reaction', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    const emoji = sanitizeText(data.emoji, 10) || '👋';
    io.emit('reaction_broadcast', {
      id: socket.id,
      emoji: emoji,
      x: player.x,
      y: player.y
    });
  });

  // --------------------------------------------------------------------------
  // Space Enter / Leave (Private Space Isolation)
  // --------------------------------------------------------------------------
  socket.on('change_space', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    const newSpace = data.spaceId || 'open_office';
    const oldSpace = player.activeSpace;
    player.activeSpace = newSpace;

    io.emit('player_space_changed', {
      id: socket.id,
      oldSpace: oldSpace,
      newSpace: newSpace,
      spaceName: GATHER_OFFICE_STATE.spaces[newSpace]?.name || newSpace
    });
  });

  // --------------------------------------------------------------------------
  // Avatar Customization & Status
  // --------------------------------------------------------------------------
  socket.on('update_avatar', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    if (data.name) player.name = sanitizeText(data.name, 24);
    if (data.avatar) {
      player.avatar = {
        ...player.avatar,
        ...data.avatar
      };
    }

    io.emit('player_avatar_updated', {
      id: socket.id,
      name: player.name,
      avatar: player.avatar
    });
  });

  socket.on('update_status', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    player.status = {
      text: sanitizeText(data.text, 50) || 'Available',
      emoji: sanitizeText(data.emoji, 8) || '💬'
    };

    io.emit('player_status_updated', {
      id: socket.id,
      status: player.status
    });
  });

  // --------------------------------------------------------------------------
  // Audio / Video / ScreenShare State
  // --------------------------------------------------------------------------
  socket.on('update_av_state', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    player.avState = {
      ...player.avState,
      ...data
    };

    io.emit('player_av_updated', {
      id: socket.id,
      avState: player.avState
    });
  });

  // --------------------------------------------------------------------------
  // Collaborative Whiteboard
  // --------------------------------------------------------------------------
  socket.on('whiteboard_draw', (strokeData) => {
    if (!strokeData) return;
    const stroke = {
      id: 'strk_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: strokeData.type || 'path',
      points: strokeData.points || [],
      color: strokeData.color || '#000000',
      width: Math.min(Math.max(Number(strokeData.width) || 3, 1), 30),
      isEraser: !!strokeData.isEraser,
      text: strokeData.text ? sanitizeText(strokeData.text, 80) : null,
      x: strokeData.x,
      y: strokeData.y,
      user: GATHER_OFFICE_STATE.players[socket.id]?.name || 'Anonymous'
    };

    GATHER_OFFICE_STATE.whiteboard.strokes.push(stroke);
    if (GATHER_OFFICE_STATE.whiteboard.strokes.length > 500) {
      GATHER_OFFICE_STATE.whiteboard.strokes.shift();
    }

    io.emit('whiteboard_stroke_added', stroke);
  });

  socket.on('whiteboard_clear', () => {
    GATHER_OFFICE_STATE.whiteboard.strokes = [];
    io.emit('whiteboard_cleared');
  });

  // --------------------------------------------------------------------------
  // Bulletin Board / Sticky Notes
  // --------------------------------------------------------------------------
  socket.on('notes_add', (noteData) => {
    const note = {
      id: 'note_' + Date.now(),
      title: sanitizeText(noteData.title, 40) || 'Untitled Note',
      content: sanitizeText(noteData.content, 200) || '',
      color: noteData.color || '#FEF08A',
      author: GATHER_OFFICE_STATE.players[socket.id]?.name || 'Teammate',
      date: new Date().toLocaleDateString()
    };

    GATHER_OFFICE_STATE.bulletinNotes.unshift(note);
    if (GATHER_OFFICE_STATE.bulletinNotes.length > 20) {
      GATHER_OFFICE_STATE.bulletinNotes.pop();
    }

    io.emit('notes_updated', GATHER_OFFICE_STATE.bulletinNotes);
  });

  socket.on('notes_delete', (data) => {
    GATHER_OFFICE_STATE.bulletinNotes = GATHER_OFFICE_STATE.bulletinNotes.filter(n => n.id !== data.id);
    io.emit('notes_updated', GATHER_OFFICE_STATE.bulletinNotes);
  });

  // --------------------------------------------------------------------------
  // YouTube Presentation Screen
  // --------------------------------------------------------------------------
  socket.on('media_change', (data) => {
    const sanitized = sanitizeYouTubeUrl(data.url);
    if (sanitized) {
      GATHER_OFFICE_STATE.media = {
        videoId: sanitized.videoId,
        embedUrl: sanitized.embedUrl,
        title: sanitizeText(data.title, 60) || 'Custom Shared Video',
        playing: true,
        setBy: GATHER_OFFICE_STATE.players[socket.id]?.name || 'User',
        startedAt: Date.now()
      };
      io.emit('media_synced', GATHER_OFFICE_STATE.media);
    }
  });

  // --------------------------------------------------------------------------
  // Retro Arcade Game
  // --------------------------------------------------------------------------
  socket.on('arcade_submit_score', (data) => {
    const score = Number(data.score) || 0;
    const name = GATHER_OFFICE_STATE.players[socket.id]?.name || 'Player';
    const entry = {
      name,
      score,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    GATHER_OFFICE_STATE.arcade.leaderboard.push(entry);
    GATHER_OFFICE_STATE.arcade.leaderboard.sort((a, b) => b.score - a.score);
    GATHER_OFFICE_STATE.arcade.leaderboard = GATHER_OFFICE_STATE.arcade.leaderboard.slice(0, 10);

    io.emit('arcade_leaderboard_updated', GATHER_OFFICE_STATE.arcade.leaderboard);
  });

  // --------------------------------------------------------------------------
  // Coffee Machine Brew
  // --------------------------------------------------------------------------
  socket.on('coffee_brew', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    player.heldItem = 'coffee';
    io.emit('coffee_brewed', {
      id: socket.id,
      beverage: data.beverage || 'Espresso',
      playerName: player.name
    });
  });

  // --------------------------------------------------------------------------
  // Icebreaker Roulette Wheel
  // --------------------------------------------------------------------------
  socket.on('roulette_spin', () => {
    if (GATHER_OFFICE_STATE.roulette.active) return;
    GATHER_OFFICE_STATE.roulette.active = true;

    const QUESTIONS = [
      'What is your go-to productivity hack?',
      'If you could work from anywhere in the world tomorrow, where?',
      'Tea or Coffee? And how do you take it?',
      'What song do you listen to on repeat while coding/working?',
      'Share one unexpected hobby or fun fact about yourself!',
      'What was the best meal or dessert you had recently?'
    ];
    const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
    const resultTopic = QUESTIONS[randomIndex];

    io.emit('roulette_started', {
      targetIndex: randomIndex,
      topic: resultTopic,
      spinner: GATHER_OFFICE_STATE.players[socket.id]?.name || 'Teammate'
    });

    setTimeout(() => {
      GATHER_OFFICE_STATE.roulette.active = false;
      GATHER_OFFICE_STATE.roulette.result = resultTopic;
      io.emit('roulette_finished', {
        topic: resultTopic
      });
    }, 4000);
  });

  // --------------------------------------------------------------------------
  // Chat Messaging (Nearby, Space, Global, Direct)
  // --------------------------------------------------------------------------
  socket.on('send_chat', (data) => {
    const player = GATHER_OFFICE_STATE.players[socket.id];
    if (!player) return;

    const channel = data.channel || 'global';
    const text = sanitizeText(data.text);
    if (!text) return;

    const message = {
      id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      channel,
      senderId: socket.id,
      senderName: player.name,
      avatarColor: player.avatar.outfitColor || '#5E6AD2',
      text,
      timestamp: Date.now()
    };

    if (channel === 'global') {
      io.emit('chat_broadcast', message);
    } else if (channel === 'space') {
      // Deliver only to players in the same activeSpace
      for (const [sId, p] of Object.entries(GATHER_OFFICE_STATE.players)) {
        if (p.activeSpace === player.activeSpace) {
          io.to(sId).emit('chat_broadcast', message);
        }
      }
    } else if (channel === 'nearby') {
      // Deliver only to players within ~220px distance or same space
      for (const [sId, p] of Object.entries(GATHER_OFFICE_STATE.players)) {
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 240 || (p.activeSpace !== 'open_office' && p.activeSpace === player.activeSpace)) {
          io.to(sId).emit('chat_broadcast', message);
        }
      }
    } else if (channel === 'direct' && data.recipientId) {
      // Direct whisper
      message.recipientId = data.recipientId;
      message.recipientName = GATHER_OFFICE_STATE.players[data.recipientId]?.name || 'Teammate';
      socket.emit('chat_broadcast', message); // to sender
      io.to(data.recipientId).emit('chat_broadcast', message); // to recipient
    }
  });

  // --------------------------------------------------------------------------
  // Disconnect
  // --------------------------------------------------------------------------
  socket.on('disconnect', () => {
    console.log(`[Gather.town v2] 🔴 Player disconnected: ${socket.id}`);
    const player = GATHER_OFFICE_STATE.players[socket.id];
    delete GATHER_OFFICE_STATE.players[socket.id];

    if (player) {
      socket.broadcast.emit('player_left', { id: socket.id });
      io.emit('chat_broadcast', {
        id: 'sys_' + Date.now(),
        channel: 'global',
        senderId: 'system',
        senderName: 'HQ System',
        avatarColor: '#EF4444',
        text: `🚪 ${player.name} left the Gather office.`,
        timestamp: Date.now()
      });
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Gather.town v2 Virtual Office',
    onlineCount: Object.keys(GATHER_OFFICE_STATE.players).length
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Gather.town v2] 🚀 Server running on http://0.0.0.0:${PORT}`);
});
