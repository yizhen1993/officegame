/**
 * ============================================================================
 * Gather.town v2 Virtual Office — Procedural Canvas Texture Generator
 * 100% Pure HTML5 Canvas 2D Generation -> Injected into Phaser TextureManager
 * Zero 404s, Zero External Image Asset Dependencies, Authentic Pixel Art Style
 * ============================================================================
 */

export class TextureGenerator {
  static generateAll(scene) {
    const tm = scene.textures;

    this.createFloors(tm);
    this.createWalls(tm);
    this.createFurniture(tm);
    this.createChairs(tm);
    this.createInteractiveTextures(tm);
    this.createVFXTextures(tm);
  }

  static createCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // Authentic pixel art rendering
    return { canvas, ctx };
  }

  // --------------------------------------------------------------------------
  // 1. FLOORS & CARPETS (32x32)
  // --------------------------------------------------------------------------
  static createFloors(tm) {
    // 1A. Scandinavian Oak Parquet (Open Office Hallway)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#E3D2BA';
      ctx.fillRect(0, 0, 32, 32);

      // Wood plank lines
      ctx.fillStyle = '#D6C1A4';
      ctx.fillRect(0, 0, 16, 8);
      ctx.fillRect(16, 8, 16, 8);
      ctx.fillRect(0, 16, 16, 8);
      ctx.fillRect(16, 24, 16, 8);

      // Subtle grain lines
      ctx.fillStyle = '#C8B090';
      ctx.fillRect(0, 7, 32, 1);
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillRect(0, 23, 32, 1);
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(15, 0, 1, 32);

      tm.addCanvas('floor_wood_light', canvas);
    }

    // 1B. Executive Mahogany Planks (Boardroom)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#5A3825';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#4A2E1E';
      ctx.fillRect(0, 0, 32, 10);
      ctx.fillRect(0, 21, 32, 11);

      // Plank bevel lines
      ctx.fillStyle = '#392215';
      ctx.fillRect(0, 10, 32, 1);
      ctx.fillRect(0, 21, 32, 1);
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(18, 0, 1, 10);
      ctx.fillRect(10, 11, 1, 10);

      tm.addCanvas('floor_wood_dark', canvas);
    }

    // 1C. Modern Tech Slate-Teal Carpet (Brainstorm Lab)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#1E3A40';
      ctx.fillRect(0, 0, 32, 32);

      // Woven pixel texture
      ctx.fillStyle = '#162C31';
      for (let y = 0; y < 32; y += 4) {
        for (let x = 0; x < 32; x += 4) {
          if ((x + y) % 8 === 0) ctx.fillRect(x, y, 2, 2);
        }
      }
      ctx.fillStyle = '#264A52';
      for (let y = 2; y < 32; y += 4) {
        for (let x = 2; x < 32; x += 4) {
          if ((x + y) % 8 === 0) ctx.fillRect(x, y, 2, 2);
        }
      }

      tm.addCanvas('floor_carpet_slate', canvas);
    }

    // 1D. Deep Navy Felt Carpet (Lounge)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#1E2433';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#272F42';
      for (let y = 0; y < 32; y += 2) {
        for (let x = (y % 4 === 0 ? 0 : 2); x < 32; x += 4) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      tm.addCanvas('floor_carpet_navy', canvas);
    }

    // 1E. Bistro Checkerboard Tile (Cafeteria)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#FAF7EE'; // Cream
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#C27D5E'; // Terracotta
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillRect(16, 16, 16, 16);

      // Grout lines
      ctx.fillStyle = '#8C563D';
      ctx.fillRect(0, 15, 32, 1);
      ctx.fillRect(15, 0, 1, 32);

      tm.addCanvas('floor_tile_bistro', canvas);
    }

    // 1F. Acoustic Charcoal Felt (Quiet Focus Pods)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#2D3139';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#383D47';
      for (let y = 0; y < 32; y += 3) {
        for (let x = 0; x < 32; x += 3) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#4A505C';
      ctx.strokeRect(0.5, 0.5, 31, 31);

      tm.addCanvas('floor_pod_carpet', canvas);
    }

    // 1G. Ornate Oriental / Bohemian Area Rug (64x64)
    {
      const { canvas, ctx } = this.createCanvas(64, 64);
      ctx.fillStyle = '#881337'; // Deep wine red
      ctx.fillRect(0, 0, 64, 64);

      // Gold ornate border
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.strokeRect(3, 3, 58, 58);

      // Inner medallion
      ctx.fillStyle = '#1E3A8A';
      ctx.beginPath();
      ctx.ellipse(32, 32, 18, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FDE68A';
      ctx.stroke();

      // Fringe at top and bottom
      ctx.fillStyle = '#F5F5F4';
      for (let x = 4; x < 60; x += 3) {
        ctx.fillRect(x, 0, 1, 3);
        ctx.fillRect(x, 61, 1, 3);
      }

      tm.addCanvas('floor_rug_ornate', canvas);
    }

    // 1H. Luxury Casino Velvet Carpet (Texas Hold'em Poker Club)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#064E3B'; // Deep casino emerald green
      ctx.fillRect(0, 0, 32, 32);

      // Gold fleur / diamond geometric motif
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, 4);
      ctx.lineTo(28, 16);
      ctx.lineTo(16, 28);
      ctx.lineTo(4, 16);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(15, 15, 2, 2);

      tm.addCanvas('floor_carpet_casino', canvas);
    }
  }

  // --------------------------------------------------------------------------
  // 2. WALLS & PARTITIONS (32x32)
  // --------------------------------------------------------------------------
  static createWalls(tm) {
    // 2A. Solid Office Partition Wall (Top Cap)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#334155'; // Dark slate top
      ctx.fillRect(0, 0, 32, 32);

      // Light bevel on top edge
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 32, 4);

      // Dark shadow on bottom
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 28, 32, 4);

      tm.addCanvas('wall_top', canvas);
    }

    // 2B. Vertical Wall Face with Skirting Board
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#E2E8F0'; // Light cream drywall
      ctx.fillRect(0, 0, 32, 32);

      // Drop shadow from ceiling/top
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(0, 0, 32, 6);

      // Wooden baseboard (skirting)
      ctx.fillStyle = '#78350F';
      ctx.fillRect(0, 26, 32, 6);
      ctx.fillStyle = '#451A03';
      ctx.fillRect(0, 26, 32, 1);
      ctx.fillRect(0, 31, 32, 1);

      tm.addCanvas('wall_face', canvas);
    }

    // 2C. Acoustic Glass Partition Wall (Gather v2 signature look!)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Aluminum metal frame
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 32, 4);
      ctx.fillRect(0, 28, 32, 4);
      ctx.fillRect(0, 0, 3, 32);
      ctx.fillRect(29, 0, 3, 32);

      // Tinted glass center
      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.fillRect(3, 4, 26, 24);

      // Crisp diagonal glass reflection lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 24);
      ctx.lineTo(24, 8);
      ctx.moveTo(14, 26);
      ctx.lineTo(26, 14);
      ctx.stroke();

      tm.addCanvas('wall_glass', canvas);
    }
  }

  // --------------------------------------------------------------------------
  // 3. DESKS & TABLES
  // --------------------------------------------------------------------------
  static createFurniture(tm) {
    // 3A. Double Workstation Office Desk (64x32)
    {
      const { canvas, ctx } = this.createCanvas(64, 32);
      // Desk surface (light birch)
      ctx.fillStyle = '#D4A373';
      ctx.fillRect(2, 2, 60, 28);
      ctx.strokeStyle = '#BC6C25';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, 60, 28);

      // Desk divider / acoustic screen
      ctx.fillStyle = '#457B9D';
      ctx.fillRect(2, 15, 60, 3);

      // Left Monitor (showing code lines)
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(10, 5, 14, 8);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(12, 7, 10, 1);
      ctx.fillRect(12, 9, 7, 1);

      // Left Keyboard & Mouse
      ctx.fillStyle = '#374151';
      ctx.fillRect(12, 20, 10, 5);
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(24, 21, 3, 4);

      // Right Monitor (showing graphs)
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(40, 5, 14, 8);
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(42, 7, 10, 4);

      // Right Keyboard & Mouse
      ctx.fillStyle = '#374151';
      ctx.fillRect(42, 20, 10, 5);
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(54, 21, 3, 4);

      // Potted desk succulent
      ctx.fillStyle = '#D97706'; // Terracotta pot
      ctx.fillRect(30, 8, 4, 4);
      ctx.fillStyle = '#10B981'; // Plant
      ctx.fillRect(30, 6, 4, 3);

      tm.addCanvas('desk_workstation', canvas);
    }

    // 3B. Single Focus Pod Desk (32x32)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = '#E9D8A6';
      ctx.fillRect(2, 4, 28, 24);
      ctx.strokeStyle = '#94D2BD';
      ctx.strokeRect(2, 4, 28, 24);

      // Laptop
      ctx.fillStyle = '#4A5568';
      ctx.fillRect(9, 9, 14, 9);
      ctx.fillStyle = '#6366F1';
      ctx.fillRect(11, 10, 10, 6);

      // Desk lamp
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(24, 10, 3, 0, Math.PI * 2);
      ctx.fill();

      tm.addCanvas('desk_single', canvas);
    }

    // 3C. Boardroom Conference Table (64x32 piece)
    {
      const { canvas, ctx } = this.createCanvas(64, 32);
      ctx.fillStyle = '#7C2D12'; // Rich cherry mahogany
      ctx.fillRect(0, 0, 64, 32);
      ctx.fillStyle = '#9A3412';
      ctx.fillRect(2, 2, 60, 28);

      // Built-in center wire channel & microphones
      ctx.fillStyle = '#292524';
      ctx.fillRect(8, 14, 48, 4);
      ctx.fillStyle = '#A8A29E';
      ctx.beginPath();
      ctx.arc(20, 16, 3, 0, Math.PI * 2);
      ctx.arc(44, 16, 3, 0, Math.PI * 2);
      ctx.fill();

      // Subtle drop shadow around edge
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.5, 0.5, 63, 31);

      tm.addCanvas('boardroom_table_piece', canvas);
    }

    // 3D. Brainstorm Round Collaboration Table (48x48)
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(24, 24, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tablet and sticky notes in center
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(16, 18, 6, 6);
      ctx.fillStyle = '#BAE6FD';
      ctx.fillRect(24, 20, 6, 6);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(20, 24, 10, 6);

      tm.addCanvas('round_collab_table', canvas);
    }

    // 3E. Plush 3-Seater Sofa (64x32)
    {
      const { canvas, ctx } = this.createCanvas(64, 32);
      // Sofa base & backrest
      ctx.fillStyle = '#1E3A8A'; // Navy Blue
      ctx.fillRect(2, 2, 60, 28);
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(4, 4, 56, 10); // Backrest

      // 3 Cushions
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(6, 16, 16, 12);
      ctx.fillRect(24, 16, 16, 12);
      ctx.fillRect(42, 16, 16, 12);

      // Armrests
      ctx.fillStyle = '#1D4ED8';
      ctx.fillRect(2, 8, 4, 20);
      ctx.fillRect(58, 8, 4, 20);

      // Yellow Throw Pillows
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(7, 14, 5, 6);
      ctx.fillRect(52, 14, 5, 6);

      tm.addCanvas('couch_lounge_h', canvas);
    }

    // 3F. Glass Coffee Table (40x24)
    {
      const { canvas, ctx } = this.createCanvas(40, 24);
      ctx.fillStyle = '#78350F';
      ctx.fillRect(2, 2, 36, 20);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
      ctx.fillRect(4, 4, 32, 16);

      // Magazines and Coffee Mug
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(8, 8, 8, 8);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(22, 10, 5, 5);

      tm.addCanvas('coffee_table', canvas);
    }

    // 3G. Bookshelf / Library Wall (32x48)
    {
      const { canvas, ctx } = this.createCanvas(32, 48);
      ctx.fillStyle = '#5A3825';
      ctx.fillRect(0, 0, 32, 48);

      // Shelves
      ctx.fillStyle = '#3E271D';
      ctx.fillRect(2, 14, 28, 2);
      ctx.fillRect(2, 30, 28, 2);
      ctx.fillRect(2, 44, 28, 2);

      // Colorful Books
      const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
      for (let s = 0; s < 3; s++) {
        const y = 4 + s * 16;
        let x = 4;
        while (x < 26) {
          const w = 2 + Math.floor(Math.random() * 3);
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, w, 10);
          x += w + 1;
        }
      }

      tm.addCanvas('bookshelf', canvas);
    }

    // 3H. Monstera & Ficus Office Plants (32x40)
    {
      const { canvas, ctx } = this.createCanvas(32, 40);
      // Ceramic pot
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(8, 24, 16, 14);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(7, 22, 18, 3);
      ctx.fillStyle = '#78350F'; // Soil
      ctx.fillRect(9, 23, 14, 2);

      // Monstera leaves
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(16, 12, 10, 0, Math.PI * 2);
      ctx.arc(10, 16, 7, 0, Math.PI * 2);
      ctx.arc(22, 16, 7, 0, Math.PI * 2);
      ctx.fill();

      // Leaf slits
      ctx.fillStyle = '#047857';
      ctx.fillRect(15, 6, 2, 14);

      tm.addCanvas('plant_monstera', canvas);
    }

    // 3I. Ficus Office Tree (32x40)
    {
      const { canvas, ctx } = this.createCanvas(32, 40);
      // Woven basket planter
      ctx.fillStyle = '#92400E';
      ctx.fillRect(8, 26, 16, 12);
      ctx.fillStyle = '#B45309';
      ctx.fillRect(7, 24, 18, 3);
      ctx.fillStyle = '#451A03'; // Soil
      ctx.fillRect(9, 25, 14, 2);

      // Slender tree trunk
      ctx.fillStyle = '#78350F';
      ctx.fillRect(14, 16, 4, 10);
      ctx.fillRect(12, 18, 3, 2);
      ctx.fillRect(17, 17, 3, 2);

      // Lush oval foliage canopy
      ctx.fillStyle = '#065F46'; // Deep emerald
      ctx.beginPath();
      ctx.ellipse(16, 11, 11, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Top lighter canopy cluster
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.ellipse(15, 9, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lime green leaf highlights
      ctx.fillStyle = '#34D399';
      ctx.fillRect(13, 6, 3, 2);
      ctx.fillRect(18, 8, 3, 2);
      ctx.fillRect(11, 12, 2, 2);

      tm.addCanvas('plant_ficus', canvas);
    }

    // 3J. Kosmi Texas Hold'em Poker Table (112x64 oval felt)
    {
      const { canvas, ctx } = this.createCanvas(112, 64);
      // Mahogany outer padded leather armrest
      ctx.fillStyle = '#451A03';
      ctx.beginPath();
      ctx.roundRect(2, 2, 108, 60, 28);
      ctx.fill();

      // Brass / Gold rim accent
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner Rich Green Felt
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.roundRect(8, 8, 96, 48, 22);
      ctx.fill();

      // Inner betting boundary line
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(14, 14, 84, 36, 16);
      ctx.stroke();

      // 5 Community Card outlined rectangles in center
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let c = 0; c < 5; c++) {
        const cx = 32 + c * 10;
        ctx.fillRect(cx, 24, 8, 12);
        ctx.strokeRect(cx, 24, 8, 12);
      }

      // Dealer Chip Tray at top center
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(48, 10, 16, 6);
      // Colored chip stacks in tray
      ctx.fillStyle = '#EF4444'; ctx.fillRect(50, 11, 2, 4);
      ctx.fillStyle = '#3B82F6'; ctx.fillRect(54, 11, 2, 4);
      ctx.fillStyle = '#10B981'; ctx.fillRect(58, 11, 2, 4);

      // Subtle Kosmi Hold'em label in center felt
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 5px sans-serif';
      ctx.fillText('KOSMI HOLD\'EM', 38, 43);

      tm.addCanvas('poker_table_felt', canvas);
    }
  }

  // --------------------------------------------------------------------------
  // 4. CHAIRS IN 4 DIRECTIONS (32x32)
  // --------------------------------------------------------------------------
  static createChairs(tm) {
    // 4A. Office Swivel Chair - Facing DOWN
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Wheels / Base
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(10, 24, 12, 4);

      // Padded Seat Cushion
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(8, 12, 16, 12);
      ctx.fillStyle = '#1D4ED8';
      ctx.fillRect(9, 14, 14, 8);

      // Armrests
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(6, 14, 2, 8);
      ctx.fillRect(24, 14, 2, 8);

      // Low Backrest (behind)
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(8, 8, 16, 5);

      tm.addCanvas('chair_down', canvas);
    }

    // 4B. Office Swivel Chair - Facing UP (Player sits with back towards viewer)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Wheels / Base
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(10, 26, 12, 4);

      // Armrests
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(6, 12, 2, 8);
      ctx.fillRect(24, 12, 2, 8);

      // Tall High-Back Mesh Backrest
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(8, 6, 16, 18);
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(10, 8, 12, 14);

      // Lumbar Support Strip
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(9, 16, 14, 3);

      tm.addCanvas('chair_up', canvas);
    }

    // 4C. Office Swivel Chair - Facing LEFT
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Base
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(12, 26, 10, 4);

      // Backrest on right side
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(20, 6, 5, 18);

      // Seat cushion pointing left
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(8, 16, 14, 8);

      // Left Armrest
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(10, 14, 10, 2);

      tm.addCanvas('chair_left', canvas);
    }

    // 4D. Office Swivel Chair - Facing RIGHT
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Base
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(10, 26, 10, 4);

      // Backrest on left side
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(7, 6, 5, 18);

      // Seat cushion pointing right
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(10, 16, 14, 8);

      // Right Armrest
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(12, 14, 10, 2);

      tm.addCanvas('chair_right', canvas);
    }
  }

  // --------------------------------------------------------------------------
  // 5. INTERACTIVE OBJECTS (Gather Modules)
  // --------------------------------------------------------------------------
  static createInteractiveTextures(tm) {
    // 5A. Large Wall-Mounted Whiteboard (96x48)
    {
      const { canvas, ctx } = this.createCanvas(96, 48);
      // Aluminum metal frame
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(0, 0, 96, 48);
      ctx.strokeStyle = '#64748B';
      ctx.strokeRect(0, 0, 96, 48);

      // Whiteboard glossy surface
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(4, 4, 88, 38);

      // Marker shelf at bottom
      ctx.fillStyle = '#64748B';
      ctx.fillRect(24, 42, 48, 3);
      // Red, Blue, Black, Green markers & Eraser
      ctx.fillStyle = '#EF4444'; ctx.fillRect(28, 41, 6, 2);
      ctx.fillStyle = '#3B82F6'; ctx.fillRect(36, 41, 6, 2);
      ctx.fillStyle = '#10B981'; ctx.fillRect(44, 41, 6, 2);
      ctx.fillStyle = '#1E293B'; ctx.fillRect(52, 41, 8, 3); // Eraser

      // Sticky notes on board
      ctx.fillStyle = '#FEF08A'; ctx.fillRect(10, 10, 14, 14); // Yellow
      ctx.fillStyle = '#BAE6FD'; ctx.fillRect(28, 12, 14, 14); // Blue
      ctx.fillStyle = '#FECDD3'; ctx.fillRect(72, 10, 14, 14); // Pink

      // Diagram sketch on whiteboard
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(48, 12, 18, 12);
      ctx.beginPath();
      ctx.moveTo(57, 24);
      ctx.lineTo(57, 30);
      ctx.stroke();

      tm.addCanvas('obj_whiteboard', canvas);
    }

    // 5B. Hi-Tech Presentation / Media Screen (96x54)
    {
      const { canvas, ctx } = this.createCanvas(96, 54);
      // Bezel
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 96, 54);

      // Display Area
      const grad = ctx.createLinearGradient(0, 0, 96, 54);
      grad.addColorStop(0, '#1E1B4B');
      grad.addColorStop(1, '#312E81');
      ctx.fillStyle = grad;
      ctx.fillRect(3, 3, 90, 48);

      // YouTube logo / Media presentation icon
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.roundRect(36, 18, 24, 16, 4);
      ctx.fill();

      // White Play Triangle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(45, 22);
      ctx.lineTo(53, 26);
      ctx.lineTo(45, 30);
      ctx.fill();

      // Power LED status dot
      ctx.fillStyle = '#10B981';
      ctx.fillRect(47, 51, 2, 2);

      tm.addCanvas('obj_projector', canvas);
    }

    // 5C. Retro Arcade Cabinet (32x48)
    {
      const { canvas, ctx } = this.createCanvas(32, 48);
      // Cabinet Body (Cyan/Purple Neon)
      ctx.fillStyle = '#18181B';
      ctx.fillRect(2, 4, 28, 44);

      // Glowing Marquee
      ctx.fillStyle = '#EC4899';
      ctx.fillRect(4, 6, 24, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('GATHER', 5, 12);

      // CRT Screen
      ctx.fillStyle = '#064E3B';
      ctx.fillRect(5, 16, 22, 16);
      // Pixel Snake on screen
      ctx.fillStyle = '#34D399';
      ctx.fillRect(7, 20, 6, 2);
      ctx.fillRect(11, 22, 2, 4);
      ctx.fillStyle = '#EF4444'; // Apple
      ctx.fillRect(18, 26, 2, 2);

      // Control Deck with Joystick and Buttons
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(4, 32, 24, 6);
      ctx.fillStyle = '#DC2626'; // Joystick ball
      ctx.beginPath(); ctx.arc(10, 34, 2, 0, Math.PI * 2); ctx.fill();
      // Arcade Buttons
      ctx.fillStyle = '#3B82F6'; ctx.fillRect(18, 33, 2, 2);
      ctx.fillStyle = '#EAB308'; ctx.fillRect(22, 33, 2, 2);

      // Coin Door
      ctx.fillStyle = '#09090B';
      ctx.fillRect(8, 40, 16, 6);
      ctx.fillStyle = '#F59E0B'; // Coin slots
      ctx.fillRect(11, 42, 2, 3);
      ctx.fillRect(19, 42, 2, 3);

      tm.addCanvas('obj_arcade', canvas);
    }

    // 5D. Espresso Café Bar & Machine (64x32)
    {
      const { canvas, ctx } = this.createCanvas(64, 32);
      // Granite Countertop
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 10, 60, 20);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 8, 60, 4);

      // Stainless Steel Espresso Machine
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(6, 2, 24, 18);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(8, 4, 20, 6); // Pressure gauge panel
      ctx.fillStyle = '#EF4444'; ctx.fillRect(10, 6, 2, 2);
      ctx.fillStyle = '#10B981'; ctx.fillRect(14, 6, 2, 2);

      // Portafilter & Steam Wand
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(12, 12, 4, 4);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(22, 12, 2, 6);

      // Stack of Ceramic Cups
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(36, 12, 6, 6);
      ctx.fillRect(36, 8, 6, 4);

      // Syrup Flavor Bottles (Vanilla, Caramel, Hazelnut)
      ctx.fillStyle = '#F59E0B'; ctx.fillRect(48, 4, 3, 10);
      ctx.fillStyle = '#92400E'; ctx.fillRect(53, 4, 3, 10);

      tm.addCanvas('obj_coffee', canvas);
    }

    // 5E. Office Water Cooler (32x40)
    {
      const { canvas, ctx } = this.createCanvas(32, 40);
      // Inverted Blue Jug
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.beginPath();
      ctx.arc(16, 12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // Highlight
      ctx.fillRect(13, 8, 2, 6);

      // White Stand Base
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(8, 18, 16, 20);
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(8, 18, 16, 20);

      // Water Dispenser Spigots (Cold Blue, Hot Red)
      ctx.fillStyle = '#3B82F6'; ctx.fillRect(11, 24, 3, 3);
      ctx.fillStyle = '#EF4444'; ctx.fillRect(18, 24, 3, 3);

      // Drip Tray
      ctx.fillStyle = '#64748B';
      ctx.fillRect(10, 30, 12, 2);

      tm.addCanvas('obj_watercooler', canvas);
    }

    // 5F. Team Bulletin Notice Board (64x32)
    {
      const { canvas, ctx } = this.createCanvas(64, 32);
      // Dark Wood Frame
      ctx.fillStyle = '#78350F';
      ctx.fillRect(0, 0, 64, 32);

      // Cork Surface
      ctx.fillStyle = '#D97706';
      ctx.fillRect(2, 2, 60, 28);

      // Pinned Sticky Notes
      ctx.fillStyle = '#FEF08A'; ctx.fillRect(6, 6, 14, 14); // Yellow
      ctx.fillStyle = '#EF4444'; ctx.fillRect(12, 6, 2, 2); // Pin

      ctx.fillStyle = '#BAE6FD'; ctx.fillRect(24, 8, 16, 12); // Blue
      ctx.fillStyle = '#10B981'; ctx.fillRect(31, 8, 2, 2); // Pin

      ctx.fillStyle = '#BBF7D0'; ctx.fillRect(44, 6, 14, 14); // Green
      ctx.fillStyle = '#EF4444'; ctx.fillRect(50, 6, 2, 2); // Pin

      tm.addCanvas('obj_bulletin', canvas);
    }

    // 5G. Icebreaker Wheel of Fortune (48x48)
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      // Stand legs
      ctx.fillStyle = '#475569';
      ctx.fillRect(22, 38, 4, 10);
      ctx.fillRect(14, 46, 20, 2);

      // Wheel Segments
      const colors = ['#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'];
      const cx = 24, cy = 22, r = 18;
      const step = (Math.PI * 2) / colors.length;

      for (let i = 0; i < colors.length; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, i * step, (i + 1) * step);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Center brass hub
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Top indicator pointer (arrow pointing down)
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r + 3);
      ctx.lineTo(cx - 3, cy - r - 4);
      ctx.lineTo(cx + 3, cy - r - 4);
      ctx.fill();

      tm.addCanvas('obj_wheel', canvas);
    }

    // 5H. Neon Texas Hold'em Poker Sign (64x32)
    {
      const { canvas, ctx } = this.createCanvas(64, 32);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(2, 2, 60, 28, 8);
      ctx.fill();

      // Glowing emerald border
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Gold Poker Title & Spade / Diamond Icons
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♠ POKER ♣', 32, 14);

      // Subtitle
      ctx.fillStyle = '#6EE7B7';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('TEXAS HOLD\'EM', 32, 24);

      tm.addCanvas('obj_poker', canvas);
    }
  }

  // --------------------------------------------------------------------------
  // 6. VISUAL EFFECTS & PROMPTS
  // --------------------------------------------------------------------------
  static createVFXTextures(tm) {
    // 6A. Interaction Glow Prompt Ring
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      const grad = ctx.createRadialGradient(16, 16, 4, 16, 16, 15);
      grad.addColorStop(0, 'rgba(250, 204, 21, 0.8)');
      grad.addColorStop(0.6, 'rgba(250, 204, 21, 0.4)');
      grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();

      tm.addCanvas('glow_indicator', canvas);
    }

    // 6B. Confetti / Star Particles (for Dancing)
    {
      const { canvas, ctx } = this.createCanvas(8, 8);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(2, 0, 4, 8);
      ctx.fillRect(0, 2, 8, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(3, 3, 2, 2);

      tm.addCanvas('particle_star', canvas);
    }

    // 6C. Musical Note (for Dancing/Music)
    {
      const { canvas, ctx } = this.createCanvas(12, 12);
      ctx.fillStyle = '#EC4899';
      ctx.beginPath();
      ctx.arc(4, 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(5, 2, 2, 7);
      ctx.fillRect(5, 2, 5, 2);

      tm.addCanvas('particle_music', canvas);
    }
  }
}
