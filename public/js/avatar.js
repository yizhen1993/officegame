/**
 * ============================================================================
 * Gather.town v2 Virtual Office — Dynamic Pixel Character Generator
 * Composites customizable skin, hair, clothes, accessories, and directions
 * into a dynamic Phaser Spritesheet (32x32 per frame, 4 directions, walk cycle)
 * ============================================================================
 */

export class AvatarGenerator {
  /**
   * Generates a 4x4 + 2 action spritesheet (6 frames wide, 4 rows high = 192x128 px)
   * Rows:
   *  0: DOWN (Frames 0-3: Walk cycle, Frame 4: Sit, Frame 5: Dance)
   *  1: UP   (Frames 0-3: Walk cycle, Frame 4: Sit, Frame 5: Dance)
   *  2: LEFT (Frames 0-3: Walk cycle, Frame 4: Sit, Frame 5: Dance)
   *  3: RIGHT(Frames 0-3: Walk cycle, Frame 4: Sit, Frame 5: Dance)
   */
  static generateSpritesheet(scene, key, avatarConfig) {
    const config = {
      skin: avatarConfig?.skin || '#FDDFB5',
      hair: avatarConfig?.hair || 'part',
      hairColor: avatarConfig?.hairColor || '#3E2723',
      outfit: avatarConfig?.outfit || 'hoodie',
      outfitColor: avatarConfig?.outfitColor || '#3B82F6',
      accessory: avatarConfig?.accessory || 'none',
      accessoryColor: avatarConfig?.accessoryColor || '#1E293B',
      heldItem: avatarConfig?.heldItem || 'none'
    };

    const canvas = document.createElement('canvas');
    canvas.width = 32 * 6;  // 192px
    canvas.height = 32 * 4; // 128px
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const directions = ['down', 'up', 'left', 'right'];

    directions.forEach((dir, row) => {
      // Frames 0-3: Walk cycle (0: idle/neutral, 1: step left, 2: idle, 3: step right)
      for (let f = 0; f < 4; f++) {
        const xOffset = f * 32;
        const yOffset = row * 32;
        this.drawCharacterFrame(ctx, xOffset, yOffset, dir, f, 'walk', config);
      }

      // Frame 4: Sitting frame
      this.drawCharacterFrame(ctx, 4 * 32, row * 32, dir, 0, 'sit', config);

      // Frame 5: Dancing frame
      this.drawCharacterFrame(ctx, 5 * 32, row * 32, dir, 0, 'dance', config);
    });

    // Update existing texture without destroying glTexture
    if (scene.textures.exists(key)) {
      const tex = scene.textures.get(key);
      const img = tex.getSourceImage();
      if (img && img.getContext) {
        const imgCtx = img.getContext('2d');
        imgCtx.clearRect(0, 0, img.width, img.height);
        imgCtx.drawImage(canvas, 0, 0);
        tex.refresh();
        return key;
      }
      scene.textures.remove(key);
    }

    // Add as spritesheet
    scene.textures.addSpriteSheet(key, canvas, {
      frameWidth: 32,
      frameHeight: 32
    });

    return key;
  }

  static drawCharacterFrame(ctx, ox, oy, dir, step, mode, cfg) {
    ctx.save();
    ctx.translate(ox, oy);

    const isSit = mode === 'sit';
    const isDance = mode === 'dance';

    // Bobbing offset
    let bobY = 0;
    if (mode === 'walk') {
      if (step === 1 || step === 3) bobY = -1;
    } else if (isDance) {
      bobY = (step % 2 === 0) ? -2 : 0;
    }

    // 1. SHADOW (Soft oval beneath feet)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(16, isSit ? 26 : 28, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. LEGS & SHOES
    ctx.fillStyle = '#1E293B'; // Dark trousers/jeans
    const shoeColor = '#0F172A';

    if (isSit) {
      // Seated posture: legs tucked forward
      if (dir === 'down') {
        ctx.fillRect(11, 23, 4, 4);
        ctx.fillRect(17, 23, 4, 4);
        ctx.fillStyle = shoeColor;
        ctx.fillRect(11, 26, 4, 2);
        ctx.fillRect(17, 26, 4, 2);
      } else if (dir === 'up') {
        // Back of legs
        ctx.fillRect(12, 24, 8, 4);
      } else if (dir === 'left') {
        ctx.fillRect(10, 23, 5, 4);
        ctx.fillStyle = shoeColor;
        ctx.fillRect(8, 25, 4, 2);
      } else if (dir === 'right') {
        ctx.fillRect(17, 23, 5, 4);
        ctx.fillStyle = shoeColor;
        ctx.fillRect(20, 25, 4, 2);
      }
    } else if (dir === 'down' || dir === 'up') {
      let lFootY = 24, rFootY = 24;
      if (step === 1) lFootY = 23;
      if (step === 3) rFootY = 23;

      ctx.fillRect(11, 21 + bobY, 4, 4);
      ctx.fillRect(17, 21 + bobY, 4, 4);
      // Shoes
      ctx.fillStyle = shoeColor;
      ctx.fillRect(11, lFootY + bobY, 4, 3);
      ctx.fillRect(17, rFootY + bobY, 4, 3);
    } else if (dir === 'left') {
      let legX = 13;
      if (step === 1) legX = 11;
      if (step === 3) legX = 15;
      ctx.fillRect(legX, 21 + bobY, 6, 4);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(legX - 1, 24 + bobY, 6, 3);
    } else if (dir === 'right') {
      let legX = 13;
      if (step === 1) legX = 15;
      if (step === 3) legX = 11;
      ctx.fillRect(legX, 21 + bobY, 6, 4);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(legX, 24 + bobY, 6, 3);
    }

    // 3. TORSO / OUTFIT
    const torsoY = (isSit ? 15 : 14) + bobY;
    ctx.fillStyle = cfg.outfitColor;

    if (dir === 'down' || dir === 'up') {
      // Main torso block
      ctx.fillRect(10, torsoY, 12, 8);

      // Outfit details
      if (dir === 'down') {
        if (cfg.outfit === 'suit') {
          // White dress shirt collar + tie
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(14, torsoY, 4, 3);
          ctx.fillStyle = '#EF4444'; // Red tie
          ctx.fillRect(15, torsoY + 2, 2, 5);
        } else if (cfg.outfit === 'hoodie') {
          // Hoodie pocket & strings
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.fillRect(12, torsoY + 4, 8, 3);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(13, torsoY + 1, 1, 3);
          ctx.fillRect(18, torsoY + 1, 1, 3);
        } else if (cfg.outfit === 'polo') {
          // Button collar
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(15, torsoY, 2, 4);
        }
      }

      // Arms
      ctx.fillStyle = cfg.outfitColor;
      if (isDance) {
        // Arms waving high in celebration
        ctx.fillRect(7, torsoY - 4, 3, 7);
        ctx.fillRect(22, torsoY - 4, 3, 7);
        // Hands
        ctx.fillStyle = cfg.skin;
        ctx.fillRect(7, torsoY - 6, 3, 2);
        ctx.fillRect(22, torsoY - 6, 3, 2);
      } else {
        const armSwingL = (step === 1) ? -1 : (step === 3) ? 1 : 0;
        const armSwingR = (step === 1) ? 1 : (step === 3) ? -1 : 0;
        ctx.fillRect(7, torsoY + armSwingL, 3, 7);
        ctx.fillRect(22, torsoY + armSwingR, 3, 7);
        // Hands
        ctx.fillStyle = cfg.skin;
        ctx.fillRect(7, torsoY + 6 + armSwingL, 3, 2);
        ctx.fillRect(22, torsoY + 6 + armSwingR, 3, 2);
      }
    } else {
      // Side profile torso
      ctx.fillRect(11, torsoY, 10, 8);
      // Arm
      ctx.fillStyle = cfg.outfitColor;
      const armSwing = (step === 1) ? -2 : (step === 3) ? 2 : 0;
      ctx.fillRect(14 + armSwing, torsoY, 4, 7);
      ctx.fillStyle = cfg.skin;
      ctx.fillRect(14 + armSwing, torsoY + 6, 4, 2);
    }

    // 4. HEAD & SKIN
    const headY = 4 + bobY;
    ctx.fillStyle = cfg.skin;
    ctx.fillRect(10, headY, 12, 10); // 12x10 face box

    // 5. EYES & EXPRESSION
    if (dir === 'down') {
      ctx.fillStyle = '#1E1B4B'; // Dark pupils
      ctx.fillRect(12, headY + 4, 2, 2);
      ctx.fillRect(18, headY + 4, 2, 2);
      // White eye highlights
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(12, headY + 4, 1, 1);
      ctx.fillRect(18, headY + 4, 1, 1);
      // Smile
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(15, headY + 8, 2, 1);
    } else if (dir === 'left') {
      ctx.fillStyle = '#1E1B4B';
      ctx.fillRect(10, headY + 4, 2, 2);
    } else if (dir === 'right') {
      ctx.fillStyle = '#1E1B4B';
      ctx.fillRect(20, headY + 4, 2, 2);
    }

    // 6. HAIR STYLES
    ctx.fillStyle = cfg.hairColor;
    if (dir === 'down') {
      if (cfg.hair === 'buzz') {
        ctx.fillRect(10, headY - 1, 12, 3);
      } else if (cfg.hair === 'part') {
        ctx.fillRect(9, headY - 2, 14, 4);
        ctx.fillRect(9, headY + 1, 3, 3);
      } else if (cfg.hair === 'curly') {
        ctx.fillRect(8, headY - 3, 16, 5);
        ctx.fillRect(8, headY + 1, 2, 3);
        ctx.fillRect(22, headY + 1, 2, 3);
      } else if (cfg.hair === 'bob') {
        ctx.fillRect(9, headY - 2, 14, 4);
        ctx.fillRect(8, headY + 1, 3, 7);
        ctx.fillRect(21, headY + 1, 3, 7);
      } else if (cfg.hair === 'messy') {
        ctx.fillRect(8, headY - 3, 16, 4);
        ctx.fillRect(7, headY - 1, 2, 3);
        ctx.fillRect(23, headY - 2, 2, 3);
      } else if (cfg.hair === 'ponytail') {
        ctx.fillRect(9, headY - 2, 14, 4);
        ctx.fillRect(22, headY - 1, 4, 6);
      } else if (cfg.hair === 'afro') {
        ctx.fillRect(7, headY - 4, 18, 7);
        ctx.fillRect(6, headY - 1, 20, 6);
      }
    } else if (dir === 'up') {
      // Full back of head hair
      ctx.fillRect(8, headY - 2, 16, 9);
      if (cfg.hair === 'ponytail') {
        ctx.fillRect(14, headY + 7, 4, 5);
      } else if (cfg.hair === 'afro') {
        ctx.fillRect(6, headY - 4, 20, 11);
      }
    } else if (dir === 'left') {
      ctx.fillRect(11, headY - 2, 11, 4);
      ctx.fillRect(16, headY + 1, 6, 5);
      if (cfg.hair === 'ponytail') {
        ctx.fillRect(22, headY + 2, 4, 5);
      }
    } else if (dir === 'right') {
      ctx.fillRect(10, headY - 2, 11, 4);
      ctx.fillRect(10, headY + 1, 6, 5);
      if (cfg.hair === 'ponytail') {
        ctx.fillRect(6, headY + 2, 4, 5);
      }
    }

    // 7. ACCESSORIES (Glasses, Headphones, Hats)
    if (cfg.accessory === 'glasses' && dir === 'down') {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1;
      ctx.strokeRect(11.5, headY + 3.5, 3, 3);
      ctx.strokeRect(17.5, headY + 3.5, 3, 3);
      ctx.beginPath();
      ctx.moveTo(14.5, headY + 5);
      ctx.lineTo(17.5, headY + 5);
      ctx.stroke();
    } else if (cfg.accessory === 'sunglasses' && dir === 'down') {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(11, headY + 4, 4, 2);
      ctx.fillRect(17, headY + 4, 4, 2);
      ctx.fillRect(15, headY + 4, 2, 1);
    } else if (cfg.accessory === 'headphones') {
      ctx.fillStyle = '#3B82F6';
      // Headband
      ctx.fillRect(10, headY - 2, 12, 2);
      // Earcups
      if (dir === 'down' || dir === 'up') {
        ctx.fillRect(8, headY + 3, 3, 5);
        ctx.fillRect(21, headY + 3, 3, 5);
      } else if (dir === 'left') {
        ctx.fillRect(15, headY + 3, 3, 5);
      } else if (dir === 'right') {
        ctx.fillRect(14, headY + 3, 3, 5);
      }
    } else if (cfg.accessory === 'beanie') {
      ctx.fillStyle = '#DC2626'; // Red beanie
      ctx.fillRect(9, headY - 4, 14, 5);
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(8, headY - 1, 16, 2);
    } else if (cfg.accessory === 'cat_ears') {
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(10, headY - 4, 3, 3);
      ctx.fillRect(19, headY - 4, 3, 3);
    }

    // 8. HELD ITEM (e.g. Coffee Cup)
    if (cfg.heldItem === 'coffee') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(23, torsoY + 4, 4, 5);
      ctx.fillStyle = '#78350F'; // Coffee liquid top
      ctx.fillRect(24, torsoY + 4, 2, 1);
      // Steam
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(24, torsoY + 1, 1, 2);
    }

    ctx.restore();
  }
}
