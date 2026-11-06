/**
 * ============================================================================
 * Gather.town v2 Virtual Office — Game Configuration & Map Constants
 * Tile Size: 32x32 px
 * Map: 50 x 38 tiles = 1600 x 1216 px
 * ============================================================================
 */

export const GATHER_CONFIG = {
  TILE_SIZE: 32,
  MAP_WIDTH_TILES: 50,
  MAP_HEIGHT_TILES: 38,
  MAP_WIDTH_PX: 1600,
  MAP_HEIGHT_PX: 1216,

  // Player physics
  WALK_SPEED: 180,
  BOOST_SPEED: 270,
  INTERACTION_DISTANCE: 56, // Distance to show "[X] Press X to interact"
  PROXIMITY_AUDIO_DISTANCE: 220,

  // Private Spaces (Coordinates & Names)
  SPACES: {
    boardroom: {
      id: 'boardroom',
      name: 'Executive Boardroom',
      color: '#4338CA', // Indigo
      bounds: { x1: 576, y1: 864, x2: 1024, y2: 1184 },
      desc: 'Executive meeting plaza with conference seats & synchronized presentation screen.'
    },
    brainstorm: {
      id: 'brainstorm',
      name: 'Brainstorm Lab',
      color: '#0D9488', // Teal
      bounds: { x1: 1088, y1: 32, x2: 1568, y2: 448 },
      desc: 'Ideation hub with interactive whiteboard & circular collaboration table.'
    },
    focus_pod_1: {
      id: 'focus_pod_1',
      name: 'Quiet Focus Pod 1',
      color: '#D97706', // Amber
      bounds: { x1: 576, y1: 32, x2: 704, y2: 256 },
      desc: 'Soundproof focus pod for deep solo work.'
    },
    focus_pod_2: {
      id: 'focus_pod_2',
      name: 'Quiet Focus Pod 2',
      color: '#D97706',
      bounds: { x1: 736, y1: 32, x2: 864, y2: 256 },
      desc: 'Soundproof focus pod for deep solo work.'
    },
    focus_pod_3: {
      id: 'focus_pod_3',
      name: 'Quiet Focus Pod 3',
      color: '#D97706',
      bounds: { x1: 896, y1: 32, x2: 1024, y2: 256 },
      desc: 'Soundproof focus pod for deep solo work.'
    },
    lounge: {
      id: 'lounge',
      name: 'Cozy Lounge & Fireplace',
      color: '#BE185D', // Pink/Rose
      bounds: { x1: 32, y1: 768, x2: 512, y2: 1184 },
      desc: 'Casual conversation area with plush couches, bookshelf, and fireplace.'
    },
    cafeteria: {
      id: 'cafeteria',
      name: 'Cafeteria & Arcade Bar',
      color: '#EA580C', // Orange
      bounds: { x1: 1088, y1: 704, x2: 1568, y2: 1184 },
      desc: 'Espresso coffee bar, water cooler, arcade cabinet & icebreaker wheel.'
    },
    poker_room: {
      id: 'poker_room',
      name: 'Kosmi Texas Hold\'em Poker Club',
      color: '#059669', // Emerald felt
      bounds: { x1: 32, y1: 32, x2: 512, y2: 448 },
      desc: 'Private VIP Texas Hold\'em poker room cloned 1-to-1 from Kosmi.io. Sit at any chair to play!'
    },
    open_office: {
      id: 'open_office',
      name: 'Open Office Hallway',
      color: '#64748B',
      desc: 'Common open space. Proximity audio & chat enabled.'
    }
  },

  // Chairs list: Exact pixel placement and facing direction
  CHAIRS: [
    // Executive Boardroom Conference Chairs (South-Center Plaza)
    { id: 'br_chair_top_1', x: 752, y: 980, direction: 'down', spaceId: 'boardroom' },
    { id: 'br_chair_top_2', x: 800, y: 980, direction: 'down', spaceId: 'boardroom' },
    { id: 'br_chair_top_3', x: 848, y: 980, direction: 'down', spaceId: 'boardroom' },
    { id: 'br_chair_bot_1', x: 752, y: 1068, direction: 'up', spaceId: 'boardroom' },
    { id: 'br_chair_bot_2', x: 800, y: 1068, direction: 'up', spaceId: 'boardroom' },
    { id: 'br_chair_bot_3', x: 848, y: 1068, direction: 'up', spaceId: 'boardroom' },
    { id: 'br_chair_left',  x: 708, y: 1024, direction: 'right', spaceId: 'boardroom' },
    { id: 'br_chair_right', x: 892, y: 1024, direction: 'left', spaceId: 'boardroom' },

    // Brainstorm Lab (Round collaboration table)
    { id: 'bs_chair_top',   x: 1328, y: 216, direction: 'down', spaceId: 'brainstorm' },
    { id: 'bs_chair_bot',   x: 1328, y: 296, direction: 'up', spaceId: 'brainstorm' },
    { id: 'bs_chair_left',  x: 1288, y: 256, direction: 'right', spaceId: 'brainstorm' },
    { id: 'bs_chair_right', x: 1368, y: 256, direction: 'left', spaceId: 'brainstorm' },

    // Focus Pods (1 chair in each pod)
    { id: 'pod1_chair', x: 640, y: 152, direction: 'up', spaceId: 'focus_pod_1' },
    { id: 'pod2_chair', x: 800, y: 152, direction: 'up', spaceId: 'focus_pod_2' },
    { id: 'pod3_chair', x: 960, y: 152, direction: 'up', spaceId: 'focus_pod_3' },

    // Open Office Cluster A (Engineering Pod)
    { id: 'eng_chair_1', x: 624, y: 472, direction: 'down', spaceId: 'open_office' },
    { id: 'eng_chair_2', x: 656, y: 472, direction: 'down', spaceId: 'open_office' },
    { id: 'eng_chair_3', x: 624, y: 552, direction: 'up', spaceId: 'open_office' },
    { id: 'eng_chair_4', x: 656, y: 552, direction: 'up', spaceId: 'open_office' },

    // Open Office Cluster B (Product Pod)
    { id: 'prod_chair_1', x: 944, y: 472, direction: 'down', spaceId: 'open_office' },
    { id: 'prod_chair_2', x: 976, y: 472, direction: 'down', spaceId: 'open_office' },
    { id: 'prod_chair_3', x: 944, y: 552, direction: 'up', spaceId: 'open_office' },
    { id: 'prod_chair_4', x: 976, y: 552, direction: 'up', spaceId: 'open_office' },

    // Open Office Cluster C (Design Pod)
    { id: 'des_chair_1', x: 624, y: 728, direction: 'down', spaceId: 'open_office' },
    { id: 'des_chair_2', x: 656, y: 728, direction: 'down', spaceId: 'open_office' },
    { id: 'des_chair_3', x: 624, y: 808, direction: 'up', spaceId: 'open_office' },
    { id: 'des_chair_4', x: 656, y: 808, direction: 'up', spaceId: 'open_office' },

    // Open Office Cluster D (Marketing Pod)
    { id: 'mkt_chair_1', x: 944, y: 728, direction: 'down', spaceId: 'open_office' },
    { id: 'mkt_chair_2', x: 976, y: 728, direction: 'down', spaceId: 'open_office' },
    { id: 'mkt_chair_3', x: 944, y: 808, direction: 'up', spaceId: 'open_office' },
    { id: 'mkt_chair_4', x: 976, y: 808, direction: 'up', spaceId: 'open_office' },

    // Cafeteria Bistro Chairs
    { id: 'cafe_chair_1', x: 1260, y: 928, direction: 'right', spaceId: 'cafeteria' },
    { id: 'cafe_chair_2', x: 1332, y: 928, direction: 'left', spaceId: 'cafeteria' },
    { id: 'cafe_chair_3', x: 1260, y: 1056, direction: 'right', spaceId: 'cafeteria' },
    { id: 'cafe_chair_4', x: 1332, y: 1056, direction: 'left', spaceId: 'cafeteria' },

    // Lounge Sectional Sofa Seats
    { id: 'lounge_sofa_1', x: 232, y: 880, direction: 'down', spaceId: 'lounge' },
    { id: 'lounge_sofa_2', x: 256, y: 880, direction: 'down', spaceId: 'lounge' },
    { id: 'lounge_sofa_3', x: 280, y: 880, direction: 'down', spaceId: 'lounge' },

    // Kosmi Texas Hold'em VIP Poker Table (Top-Left 6-Seat VIP Room)
    { id: 'poker_chair_1', x: 236, y: 196, direction: 'down', spaceId: 'poker_room', seatIndex: 0 },
    { id: 'poker_chair_2', x: 308, y: 196, direction: 'down', spaceId: 'poker_room', seatIndex: 1 },
    { id: 'poker_chair_3', x: 348, y: 240, direction: 'left', spaceId: 'poker_room', seatIndex: 2 },
    { id: 'poker_chair_4', x: 308, y: 284, direction: 'up', spaceId: 'poker_room', seatIndex: 3 },
    { id: 'poker_chair_5', x: 236, y: 284, direction: 'up', spaceId: 'poker_room', seatIndex: 4 },
    { id: 'poker_chair_6', x: 196, y: 240, direction: 'right', spaceId: 'poker_room', seatIndex: 5 }
  ],

  // Interactive Objects with Gather.town prompt
  INTERACTIVE_OBJECTS: [
    {
      id: 'obj_poker',
      type: 'poker',
      name: 'Kosmi Texas Hold\'em Poker Table',
      prompt: 'Press X to open Poker Table',
      x: 272,
      y: 150,
      width: 96,
      height: 48,
      modalId: 'modal-poker'
    },
    {
      id: 'obj_whiteboard',
      type: 'whiteboard',
      name: 'Interactive Whiteboard',
      prompt: 'Press X to draw & collaborate',
      x: 1328,
      y: 96,
      width: 96,
      height: 48,
      modalId: 'modal-whiteboard'
    },
    {
      id: 'obj_projector',
      type: 'media',
      name: 'Executive Presentation Screen',
      prompt: 'Press X to open Media & Live Radio Player',
      x: 800,
      y: 912,
      width: 96,
      height: 54,
      modalId: 'modal-media'
    },
    {
      id: 'obj_arcade',
      type: 'arcade',
      name: 'Gather Retro Arcade',
      prompt: 'Press X to play Retro Snake & Pong',
      x: 1472,
      y: 832,
      width: 32,
      height: 48,
      modalId: 'modal-arcade'
    },
    {
      id: 'obj_bulletin',
      type: 'notes',
      name: 'Team Bulletin Board',
      prompt: 'Press X to view & post Sticky Notes',
      x: 800,
      y: 360,
      width: 64,
      height: 32,
      modalId: 'modal-bulletin'
    },
    {
      id: 'obj_coffee',
      type: 'coffee',
      name: 'Café Espresso Bar',
      prompt: 'Press X to brew Coffee (+50% Speed)',
      x: 1200,
      y: 768,
      width: 64,
      height: 32,
      modalId: 'modal-coffee'
    },
    {
      id: 'obj_watercooler',
      type: 'watercooler',
      name: 'Office Water Cooler',
      prompt: 'Press X for Water Cooler Chat',
      x: 1376,
      y: 768,
      width: 32,
      height: 40,
      modalId: 'modal-watercooler'
    },
    {
      id: 'obj_wheel',
      type: 'wheel',
      name: 'Icebreaker Wheel of Fortune',
      prompt: 'Press X to spin the Wheel',
      x: 1472,
      y: 992,
      width: 48,
      height: 48,
      modalId: 'modal-wheel'
    }
  ]
};
