/**
 * ============================================================================
 * Gather.town v2 Virtual Office — UI Manager & Overlay Controller
 * Manages Sleek Dark Dock, Video Grid, Chat Channels, Modals & Avatar Studio
 * ============================================================================
 */

import { WhiteboardManager } from './whiteboard.js';
import { RetroArcadeGame } from './arcadeGame.js';

export class UIManager {
  constructor(network, scene) {
    this.network = network;
    this.scene = scene;

    this.activeModal = null;
    this.currentChatChannel = 'global';
    this.localPlayerState = null;
    this.allPlayers = new Map();
    this.spaces = {};

    this.whiteboardMgr = null;
    this.arcadeGame = null;

    this.initDOMReferences();
    this.bindDOMEvents();
  }

  initDOMReferences() {
    // Modals
    this.modals = {
      whiteboard: document.getElementById('modal-whiteboard'),
      media: document.getElementById('modal-media'),
      arcade: document.getElementById('modal-arcade'),
      bulletin: document.getElementById('modal-bulletin'),
      coffee: document.getElementById('modal-coffee'),
      wheel: document.getElementById('modal-wheel'),
      poker: document.getElementById('modal-poker'),
      avatarStudio: document.getElementById('modal-avatar-studio')
    };

    // Chat
    this.chatLog = document.getElementById('chat-messages-log');
    this.chatInput = document.getElementById('chat-input-field');
    this.chatChannelButtons = document.querySelectorAll('.chat-channel-btn');

    // Video Grid
    this.videoGridContainer = document.getElementById('top-video-carousel');

    // Space Banner
    this.spaceBanner = document.getElementById('hud-space-pill');
    this.spaceBannerText = document.getElementById('hud-space-title');
    this.spaceBannerDetail = document.getElementById('hud-space-detail');
    this.onlineCountBadge = document.getElementById('hud-online-count');

    // Top Live Music Pill
    this.musicPill = document.getElementById('hud-music-pill');
    this.musicTitle = document.getElementById('hud-music-title');
    this.musicMuteBtn = document.getElementById('hud-music-mute-btn');
    this.musicMuteIcon = document.getElementById('hud-music-mute-icon');
    this.musicIcon = document.getElementById('hud-music-icon');
    this.musicInfoBtn = document.getElementById('hud-music-info-btn');
    this.musicIconBtn = document.getElementById('hud-music-icon-btn');
    this.isMusicMuted = false;
    this.currentMedia = null;

    // Bottom Dock Buttons
    this.btnMic = document.getElementById('dock-btn-mic');
    this.btnCam = document.getElementById('dock-btn-cam');
    this.btnScreen = document.getElementById('dock-btn-screen');
    this.btnGhost = document.getElementById('dock-btn-ghost');
    this.btnDance = document.getElementById('dock-btn-dance');
    this.btnEditChar = document.getElementById('dock-btn-avatar');
    this.btnMinimap = document.getElementById('dock-btn-minimap');

    // User Profile
    this.dockUserName = document.getElementById('dock-user-name');
    this.dockUserStatus = document.getElementById('dock-user-status');
    this.dockUserAvatarCircle = document.getElementById('dock-user-avatar-circle');

    // Sidebar
    this.sidebar = document.getElementById('gather-sidebar');
    this.btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    this.participantsList = document.getElementById('participants-list-container');
  }

  bindDOMEvents() {
    // 1. Bottom Dock Media Toggles (WebRTC Real Mic, Camera & ScreenShare)
    if (this.btnMic) {
      this.btnMic.addEventListener('click', async () => {
        if (!this.localPlayerState) return;
        if (this.webrtc) {
          const micOn = await this.webrtc.toggleMic();
          this.localPlayerState.avState.mic = micOn;
        } else {
          const cur = this.localPlayerState.avState.mic;
          this.localPlayerState.avState.mic = !cur;
        }
        this.updateDockAVButtons();
        this.network.updateAVState(this.localPlayerState.avState);
        this.renderVideoGrid();
      });
    }

    if (this.btnCam) {
      this.btnCam.addEventListener('click', async () => {
        if (!this.localPlayerState) return;
        if (this.webrtc) {
          const camOn = await this.webrtc.toggleCamera();
          this.localPlayerState.avState.camera = camOn;
        } else {
          const cur = this.localPlayerState.avState.camera;
          this.localPlayerState.avState.camera = !cur;
        }
        this.updateDockAVButtons();
        this.network.updateAVState(this.localPlayerState.avState);
        this.renderVideoGrid();
      });
    }

    if (this.btnScreen) {
      this.btnScreen.addEventListener('click', async () => {
        if (!this.localPlayerState) return;
        if (this.webrtc) {
          const screenOn = await this.webrtc.toggleScreenShare();
          this.localPlayerState.avState.screenShare = screenOn;
        } else {
          const cur = this.localPlayerState.avState.screenShare;
          this.localPlayerState.avState.screenShare = !cur;
        }
        this.updateDockAVButtons();
        this.network.updateAVState(this.localPlayerState.avState);
        this.renderVideoGrid();
      });
    }

    // 2. Ghost & Dance
    if (this.btnGhost) {
      this.btnGhost.addEventListener('click', () => {
        if (window.GatherApp) window.GatherApp.toggleGhost();
      });
    }
    if (this.btnDance) {
      this.btnDance.addEventListener('click', () => {
        if (window.GatherApp) window.GatherApp.toggleDance();
      });
    }

    // 3. Avatar Studio Modal Trigger
    if (this.btnEditChar) {
      this.btnEditChar.addEventListener('click', () => {
        this.openAvatarStudio();
      });
    }

    // 4. Quick Emotes Click
    document.querySelectorAll('.dock-emote-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-emote');
        if (window.GatherApp) window.GatherApp.sendReaction(emoji);
      });
    });

    // 5. Chat Channel Selectors
    this.chatChannelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.chatChannelButtons.forEach(b => b.classList.remove('active-channel'));
        btn.classList.add('active-channel');
        this.currentChatChannel = btn.getAttribute('data-channel');
        this.chatInput.placeholder = `Message ${btn.textContent.trim()}...`;
      });
    });

    // 6. Chat Send
    const sendBtn = document.getElementById('btn-send-chat');
    const sendAction = () => {
      const text = this.chatInput.value.trim();
      if (text) {
        this.network.sendChat(this.currentChatChannel, text);
        this.chatInput.value = '';
      }
    };
    if (sendBtn) sendBtn.addEventListener('click', sendAction);
    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendAction();
        }
      });
    }

    // 7. Sidebar Tabs (Participants vs Chat)
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active-tab'));
        btn.classList.add('active-tab');

        const tab = btn.getAttribute('data-tab');
        const participantsPane = document.getElementById('pane-participants');
        const chatPane = document.getElementById('pane-chat');

        if (tab === 'participants') {
          participantsPane.classList.remove('hidden');
          chatPane.classList.add('hidden');
        } else {
          participantsPane.classList.add('hidden');
          chatPane.classList.remove('hidden');
        }
      });
    });

    // 8. Sidebar Toggle Collapse
    if (this.btnToggleSidebar) {
      this.btnToggleSidebar.addEventListener('click', () => {
        this.sidebar.classList.toggle('collapsed');
      });
    }

    // 9. Close Modal Buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => this.closeActiveModal());
    });

    // 10. Whiteboard Controls
    const wbCanvas = document.getElementById('whiteboard-canvas');
    if (wbCanvas) {
      this.whiteboardMgr = new WhiteboardManager(wbCanvas, this.network);

      document.querySelectorAll('.wb-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.wb-tool-btn').forEach(b => b.classList.remove('active-tool'));
          btn.classList.add('active-tool');
          this.whiteboardMgr.setTool(btn.getAttribute('data-tool'));
        });
      });

      document.querySelectorAll('.wb-color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.wb-color-swatch').forEach(b => b.classList.remove('ring-2', 'ring-indigo-500'));
          btn.classList.add('ring-2', 'ring-indigo-500');
          this.whiteboardMgr.setColor(btn.getAttribute('data-color'));
        });
      });

      const wbClear = document.getElementById('wb-btn-clear');
      if (wbClear) wbClear.addEventListener('click', () => this.network.clearWhiteboard());

      const wbSave = document.getElementById('wb-btn-download');
      if (wbSave) wbSave.addEventListener('click', () => this.whiteboardMgr.downloadImage());
    }

    // 11. Retro Arcade Game
    const arcadeCanvas = document.getElementById('arcade-canvas');
    if (arcadeCanvas) {
      this.arcadeGame = new RetroArcadeGame(arcadeCanvas, (score) => {
        this.network.submitArcadeScore(score);
      });

      const btnArcadeStart = document.getElementById('arcade-btn-start');
      if (btnArcadeStart) {
        btnArcadeStart.addEventListener('click', () => this.arcadeGame.start());
      }
    }

    // 12. Media Player (YouTube)
    const btnMediaApply = document.getElementById('media-btn-apply');
    const mediaUrlInput = document.getElementById('media-url-input');
    const mediaTitleInput = document.getElementById('media-title-input');

    const handleApplyMedia = () => {
      const url = mediaUrlInput ? mediaUrlInput.value.trim() : '';
      const title = (mediaTitleInput ? mediaTitleInput.value.trim() : '') || 'Custom Video';

      if (!url) {
        this.showToast('⚠️ Please enter a YouTube link or video ID', '#F59E0B');
        if (mediaUrlInput) mediaUrlInput.focus();
        return;
      }

      this.network.changeMedia(url, title);
      this.showToast('▶ Updating video on screen...', '#10B981');
      if (mediaUrlInput) mediaUrlInput.value = '';
      if (mediaTitleInput) mediaTitleInput.value = '';
    };

    if (btnMediaApply) {
      btnMediaApply.addEventListener('click', handleApplyMedia);
    }
    if (mediaUrlInput) {
      mediaUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApplyMedia();
        }
      });
    }
    if (mediaTitleInput) {
      mediaTitleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApplyMedia();
        }
      });
    }

    // Live Radio Buttons (Direct Grab from YouTube Live Search API)
    document.querySelectorAll('.media-live-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const keyword = btn.getAttribute('data-keyword');
        this.fetchAndPlayLiveMusic(keyword);
      });
    });

    const btnSearchLive = document.getElementById('media-btn-search-live');
    if (btnSearchLive) {
      btnSearchLive.addEventListener('click', () => {
        const query = (mediaUrlInput ? mediaUrlInput.value.trim() : '') || 'lofi hip hop live streaming radio';
        this.fetchAndPlayLiveMusic(query);
      });
    }

    // Preset Video Buttons
    document.querySelectorAll('.media-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        const title = btn.getAttribute('data-title');
        this.network.changeMedia(url, title);
        this.showToast(`▶ Switched to: ${title}`, '#10B981');
      });
    });

    // 13. Bulletin Notes Add Form
    const btnAddNote = document.getElementById('btn-add-note');
    const noteTitleInput = document.getElementById('note-title-input');
    const noteContentInput = document.getElementById('note-content-input');

    const submitStickyNote = () => {
      let title = noteTitleInput ? noteTitleInput.value.trim() : '';
      const content = noteContentInput ? noteContentInput.value.trim() : '';
      const colorSelect = document.getElementById('note-color-select');
      const color = colorSelect ? colorSelect.value : '#FEF08A';

      if (!content && !title) {
        this.showToast('⚠️ Please write something on the sticky note!', '#F59E0B');
        if (noteContentInput) noteContentInput.focus();
        return;
      }

      if (!title) {
        title = content.length > 20 ? content.slice(0, 18) + '...' : 'Quick Note';
      }

      this.network.addNote(title, content || title, color);
      if (noteTitleInput) noteTitleInput.value = '';
      if (noteContentInput) noteContentInput.value = '';
      this.showToast('📌 Sticky note posted to board!', '#10B981');
    };

    if (btnAddNote) {
      btnAddNote.addEventListener('click', submitStickyNote);
    }
    if (noteTitleInput) {
      noteTitleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (noteContentInput) noteContentInput.focus();
        }
      });
    }
    if (noteContentInput) {
      noteContentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitStickyNote();
        }
      });
    }

    // 14. Coffee Machine Beverage Brew
    document.querySelectorAll('.coffee-beverage-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const beverage = btn.getAttribute('data-beverage');
        this.network.brewCoffee(beverage);
        this.closeActiveModal();
        this.showToast(`☕ Brewed fresh ${beverage}! +50% Speed Boost active for 30s!`, '#10B981');
      });
    });

    // 15. Icebreaker Wheel Spin
    const btnSpinWheel = document.getElementById('btn-spin-wheel');
    if (btnSpinWheel) {
      btnSpinWheel.addEventListener('click', () => {
        this.network.spinRoulette();
      });
    }

    // 16. Avatar Studio Customizer Live Updates
    this.setupAvatarStudioListeners();

    // 17. Live Playlist Track HUD Controls (Mute / Unmute & Quick Player Modal)
    if (this.musicMuteBtn) {
      this.musicMuteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMusicMute();
      });
    }

    if (this.musicInfoBtn) {
      this.musicInfoBtn.addEventListener('click', () => {
        this.openModal('media');
      });
    }

    if (this.musicIconBtn) {
      this.musicIconBtn.addEventListener('click', () => {
        this.openModal('media');
      });
    }

    // Unmute / autoplay unlock on first user gesture (satisfies modern browser autoplay policy)
    const unlockAudio = () => {
      if (!this.isMusicMuted) {
        this.sendIframeCommand('projector-iframe', 'unMute');
        this.sendIframeCommand('projector-iframe', 'playVideo');
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
  }

  // ==========================================================================
  // AVATAR STUDIO CONTROLLER
  // ==========================================================================
  setupAvatarStudioListeners() {
    const previewCanvas = document.getElementById('avatar-preview-canvas');
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const renderPreview = () => {
      if (!this.tempAvatar) return;
      ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

      // Render 2x zoomed preview
      ctx.save();
      ctx.scale(2.5, 2.5);
      ctx.translate(14, 10);

      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(16, 28, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw legs & shoes
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(11, 21, 4, 4);
      ctx.fillRect(17, 21, 4, 4);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(11, 24, 4, 3);
      ctx.fillRect(17, 24, 4, 3);

      // Torso
      ctx.fillStyle = this.tempAvatar.outfitColor;
      ctx.fillRect(10, 14, 12, 8);
      // Arms
      ctx.fillRect(7, 14, 3, 7);
      ctx.fillRect(22, 14, 3, 7);
      // Hands
      ctx.fillStyle = this.tempAvatar.skin;
      ctx.fillRect(7, 20, 3, 2);
      ctx.fillRect(22, 20, 3, 2);

      // Head
      ctx.fillStyle = this.tempAvatar.skin;
      ctx.fillRect(10, 4, 12, 10);

      // Eyes
      ctx.fillStyle = '#1E1B4B';
      ctx.fillRect(12, 8, 2, 2);
      ctx.fillRect(18, 8, 2, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(12, 8, 1, 1);
      ctx.fillRect(18, 8, 1, 1);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(15, 12, 2, 1); // Smile

      // Hair
      ctx.fillStyle = this.tempAvatar.hairColor;
      ctx.fillRect(9, 2, 14, 4);
      ctx.fillRect(8, 4, 3, 5);
      ctx.fillRect(21, 4, 3, 5);

      // Accessory
      if (this.tempAvatar.accessory === 'glasses') {
        ctx.strokeStyle = '#0F172A';
        ctx.strokeRect(11.5, 7.5, 3, 3);
        ctx.strokeRect(17.5, 7.5, 3, 3);
      } else if (this.tempAvatar.accessory === 'sunglasses') {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(11, 8, 4, 2);
        ctx.fillRect(17, 8, 4, 2);
      } else if (this.tempAvatar.accessory === 'headphones') {
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(10, 2, 12, 2);
        ctx.fillRect(8, 7, 3, 5);
        ctx.fillRect(21, 7, 3, 5);
      }

      ctx.restore();
    };

    this.renderAvatarPreview = renderPreview;

    // Skin Tone Options
    document.querySelectorAll('.avatar-skin-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.avatar-skin-opt').forEach(b => b.classList.remove('selected-opt'));
        btn.classList.add('selected-opt');
        if (this.tempAvatar) {
          this.tempAvatar.skin = btn.getAttribute('data-skin');
          renderPreview();
        }
      });
    });

    // Hair Style Options
    document.querySelectorAll('.avatar-hair-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.avatar-hair-opt').forEach(b => b.classList.remove('selected-opt'));
        btn.classList.add('selected-opt');
        if (this.tempAvatar) {
          this.tempAvatar.hair = btn.getAttribute('data-hair');
          renderPreview();
        }
      });
    });

    // Hair Color Options
    document.querySelectorAll('.avatar-haircolor-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.avatar-haircolor-opt').forEach(b => b.classList.remove('selected-opt'));
        btn.classList.add('selected-opt');
        if (this.tempAvatar) {
          this.tempAvatar.hairColor = btn.getAttribute('data-haircolor');
          renderPreview();
        }
      });
    });

    // Outfit Style Options
    document.querySelectorAll('.avatar-outfit-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.avatar-outfit-opt').forEach(b => b.classList.remove('selected-opt'));
        btn.classList.add('selected-opt');
        if (this.tempAvatar) {
          this.tempAvatar.outfit = btn.getAttribute('data-outfit');
          renderPreview();
        }
      });
    });

    // Outfit Color Options
    document.querySelectorAll('.avatar-outfitcolor-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.avatar-outfitcolor-opt').forEach(b => b.classList.remove('selected-opt'));
        btn.classList.add('selected-opt');
        if (this.tempAvatar) {
          this.tempAvatar.outfitColor = btn.getAttribute('data-outfitcolor');
          renderPreview();
        }
      });
    });

    // Accessory Options
    document.querySelectorAll('.avatar-accessory-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.avatar-accessory-opt').forEach(b => b.classList.remove('selected-opt'));
        btn.classList.add('selected-opt');
        if (this.tempAvatar) {
          this.tempAvatar.accessory = btn.getAttribute('data-accessory');
          renderPreview();
        }
      });
    });

    // Save Avatar button
    const btnSaveAvatar = document.getElementById('btn-save-avatar');
    if (btnSaveAvatar) {
      btnSaveAvatar.addEventListener('click', () => {
        const nameInput = document.getElementById('avatar-name-input');
        const newName = nameInput.value.trim() || this.localPlayerState.name;
        this.localPlayerState.name = newName;
        this.localPlayerState.avatar = { ...this.tempAvatar };

        this.network.updateAvatar(newName, this.tempAvatar);
        this.updateDockProfile();

        // Re-generate local sprite texture
        if (this.scene && this.scene.localPlayer) {
          const key = `avatar_${this.localPlayerState.id}`;
          import('./avatar.js').then(({ AvatarGenerator }) => {
            AvatarGenerator.generateSpritesheet(this.scene, key, this.tempAvatar);
          });
        }

        this.closeActiveModal();
        this.showToast('✅ Avatar appearance saved!', '#10B981');
      });
    }
  }

  openAvatarStudio() {
    if (!this.localPlayerState) return;
    this.tempAvatar = { ...this.localPlayerState.avatar };
    const nameInput = document.getElementById('avatar-name-input');
    if (nameInput) nameInput.value = this.localPlayerState.name;

    this.openModal('avatarStudio');
    if (this.renderAvatarPreview) this.renderAvatarPreview();
  }

  // ==========================================================================
  // MODALS MANAGEMENT
  // ==========================================================================
  openModal(modalKey, extraData = null) {
    this.closeActiveModal();
    const modalEl = this.modals[modalKey];
    if (modalEl) {
      if (modalKey === 'media') {
        modalEl.classList.remove('is-hidden');
      } else {
        modalEl.classList.remove('hidden');
      }
      this.activeModal = modalEl;

      if (modalKey === 'arcade' && this.arcadeGame) {
        this.arcadeGame.render();
      }
      if (modalKey === 'poker' && this.poker) {
        this.poker.render();
      }
      if (modalKey === 'wheel') {
        setTimeout(() => this.initRouletteWheel(), 50);
      }
      if (modalKey === 'bulletin') {
        const inp = document.getElementById('note-title-input');
        if (inp) setTimeout(() => inp.focus(), 100);
      }
      if (modalKey === 'media') {
        const inp = document.getElementById('media-url-input');
        if (inp) setTimeout(() => inp.focus(), 100);
      }
    }
  }

  closeActiveModal() {
    if (this.activeModal) {
      if (this.activeModal === this.modals.media) {
        this.activeModal.classList.add('is-hidden');
      } else {
        this.activeModal.classList.add('hidden');
      }
      this.activeModal = null;
    }
    if (this.arcadeGame) {
      this.arcadeGame.stop();
    }
  }

  isModalOpen() {
    return this.activeModal !== null;
  }

  // ==========================================================================
  // TOP VIDEO GRID & PROXIMITY CAROUSEL
  // ==========================================================================
  renderVideoGrid() {
    if (!this.videoGridContainer || !this.localPlayerState) return;
    this.videoGridContainer.innerHTML = '';

    // 1. Self Video Tile (always first)
    const selfTile = this.createVideoTile(this.localPlayerState, true);
    this.videoGridContainer.appendChild(selfTile);

    // 2. Remote Players in same space or within proximity
    const selfX = this.localPlayerState.x;
    const selfY = this.localPlayerState.y;
    const selfSpace = this.localPlayerState.activeSpace;

    this.allPlayers.forEach(player => {
      if (player.id === this.localPlayerState.id) return;

      let isConnected = false;
      if (selfSpace !== 'open_office') {
        // In private space: only connect if in the exact same space
        isConnected = (player.activeSpace === selfSpace);
      } else {
        // In open office: connect if within proximity distance (~320px)
        const dx = player.x - selfX;
        const dy = player.y - selfY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        isConnected = (dist <= 320);
      }

      if (isConnected) {
        const tile = this.createVideoTile(player, false);
        this.videoGridContainer.appendChild(tile);

        // Auto-negotiate WebRTC connection with nearby peers
        if (this.webrtc) {
          if (!this.webrtc.peers.has(player.id)) {
            const isInitiator = (this.localPlayerState.id < player.id);
            this.webrtc.connectToPeer(player.id, isInitiator);
          } else {
            const peer = this.webrtc.peers.get(player.id);
            if (peer && peer.remoteStream) {
              this.webrtc.attachRemoteMedia(player.id, peer.remoteStream);
            }
          }
        }
      } else {
        // Disconnect WebRTC peer if player went out of range or to another room
        if (this.webrtc && this.webrtc.peers.has(player.id)) {
          this.webrtc.closePeer(player.id);
        }
      }
    });

    if (this.webrtc) {
      this.webrtc.updateProximityVolumes(this.localPlayerState, this.allPlayers);
    }
  }

  createVideoTile(player, isSelf) {
    const card = document.createElement('div');
    card.className = 'gather-video-tile relative flex-shrink-0 w-36 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-lg';
    if (isSelf) {
      card.id = 'self-video-tile';
    }

    const isCamOn = player.avState?.camera || player.avState?.screenShare;
    const isMicOn = player.avState?.mic;

    if (isCamOn) {
      if (isSelf) {
        // Local webcam video element
        card.innerHTML = `
          <div class="w-full h-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
            <video id="self-video-stream" class="w-full h-full object-cover" autoplay playsinline muted></video>
            <div class="absolute top-1.5 left-1.5 z-20 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE</span>
            </div>
          </div>
        `;
        setTimeout(() => {
          const vid = card.querySelector('#self-video-stream');
          const stream = (this.webrtc?.isScreenSharing && this.webrtc?.screenStream)
            ? this.webrtc.screenStream
            : this.webrtc?.localStream;
          if (vid && stream) {
            vid.srcObject = stream;
            vid.play().catch(() => {});
          }
        }, 10);
      } else {
        // Remote peer WebRTC video element
        card.innerHTML = `
          <div class="w-full h-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
            <video id="video-stream-${player.id}" class="w-full h-full object-cover" autoplay playsinline></video>
            <div class="absolute top-1.5 left-1.5 z-20 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE</span>
            </div>
          </div>
        `;
        setTimeout(() => {
          const vid = card.querySelector(`#video-stream-${player.id}`);
          const peer = this.webrtc?.peers.get(player.id);
          if (vid && peer?.remoteStream) {
            vid.srcObject = peer.remoteStream;
            vid.play().catch(() => {});
          }
        }, 10);
      }
    } else {
      // Camera off: Shows customized avatar circle with talking ring
      card.innerHTML = `
        <div class="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center relative">
          <div class="w-11 h-11 rounded-full ${isMicOn ? 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'ring-1 ring-slate-600'} flex items-center justify-center text-white text-base font-black" style="background-color: ${player.avatar?.outfitColor || '#4F46E5'}">
            ${player.name.charAt(0).toUpperCase()}
          </div>
          <div class="mt-1 text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
            ${player.status?.emoji || '💬'} ${player.status?.text || 'Available'}
          </div>
        </div>
      `;
    }

    // Bottom name bar with mic status
    const bottomBar = document.createElement('div');
    bottomBar.className = 'absolute bottom-0 inset-x-0 h-6 bg-slate-950/80 backdrop-blur-sm px-2 flex items-center justify-between text-[11px] text-slate-200 font-bold z-20';
    bottomBar.innerHTML = `
      <span class="truncate max-w-[90px]">${isSelf ? `${player.name} (You)` : player.name}</span>
      <span class="text-xs ${isMicOn ? 'text-emerald-400' : 'text-rose-400'}">
        ${isMicOn ? '🎤' : '🔇'}
      </span>
    `;

    card.appendChild(bottomBar);
    return card;
  }

  // ==========================================================================
  // PRIVATE SPACE BANNER
  // ==========================================================================
  updateSpaceHUD(spaceId, spaceInfo) {
    if (!this.spaceBanner) return;

    if (spaceId !== 'open_office') {
      this.spaceBanner.className = 'gather-space-pill is-private';
      this.spaceBannerText.innerHTML = `🔒 ${spaceInfo?.name || spaceId}`;
      this.spaceBannerDetail.textContent = 'Private Space • Audio & Video Isolated';
    } else {
      this.spaceBanner.className = 'gather-space-pill';
      this.spaceBannerText.innerHTML = `🌐 Open Office Hallway`;
      this.spaceBannerDetail.textContent = 'Proximity Audio (2-3m)';
    }

    this.renderVideoGrid();
  }

  // ==========================================================================
  // PARTICIPANTS LIST & CHAT
  // ==========================================================================
  updateParticipantsList() {
    if (!this.participantsList) return;
    this.participantsList.innerHTML = '';

    if (this.onlineCountBadge) {
      this.onlineCountBadge.textContent = `${this.allPlayers.size} Online`;
    }

    // Group players by space
    const groups = {};
    this.allPlayers.forEach(p => {
      const sp = p.activeSpace || 'open_office';
      if (!groups[sp]) groups[sp] = [];
      groups[sp].push(p);
    });

    for (const [spaceId, players] of Object.entries(groups)) {
      const spaceHeader = document.createElement('div');
      spaceHeader.className = 'px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-800/50 rounded-lg mt-2 flex items-center justify-between';
      spaceHeader.innerHTML = `
        <span>${spaceId === 'open_office' ? '🌐 Hallway' : `🔒 ${this.spaces[spaceId]?.name || spaceId}`}</span>
        <span class="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full text-slate-300 font-bold">${players.length}</span>
      `;
      this.participantsList.appendChild(spaceHeader);

      players.forEach(p => {
        const item = document.createElement('div');
        const isSelf = this.localPlayerState && p.id === this.localPlayerState.id;
        item.className = 'flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800/80 transition group';
        item.innerHTML = `
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow" style="background-color: ${p.avatar?.outfitColor || '#4F46E5'}">
              ${p.name.charAt(0).toUpperCase()}
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-bold text-slate-200">${p.name} ${isSelf ? '<span class="text-[10px] text-indigo-400">(You)</span>' : ''}</span>
              <span class="text-[10px] text-slate-400">${p.status?.emoji || '💬'} ${p.status?.text || 'Available'}</span>
            </div>
          </div>
          ${!isSelf ? `
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button class="locate-btn p-1 hover:bg-slate-700 rounded text-xs" title="Locate on Map">📍</button>
              <button class="chat-btn p-1 hover:bg-slate-700 rounded text-xs" title="Direct Message">💬</button>
            </div>
          ` : ''}
        `;

        if (!isSelf) {
          const btnLocate = item.querySelector('.locate-btn');
          if (btnLocate) {
            btnLocate.addEventListener('click', () => {
              if (this.scene && this.scene.cameras.main) {
                this.scene.cameras.main.pan(p.x, p.y, 800);
                this.showToast(`📍 Located ${p.name}!`, '#6366F1');
              }
            });
          }
          const btnDirect = item.querySelector('.chat-btn');
          if (btnDirect) {
            btnDirect.addEventListener('click', () => {
              this.currentChatChannel = 'direct';
              this.chatInput.placeholder = `Direct whisper to ${p.name}...`;
              this.chatInput.focus();
            });
          }
        }

        this.participantsList.appendChild(item);
      });
    }
  }

  appendChatMessage(msg) {
    if (!this.chatLog) return;

    const row = document.createElement('div');
    row.className = 'flex flex-col gap-0.5 text-xs animate-fadeIn';

    const timeStr = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let channelBadge = '';
    if (msg.channel === 'space') {
      channelBadge = '<span class="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-extrabold text-[9px]">SPACE</span>';
    } else if (msg.channel === 'nearby') {
      channelBadge = '<span class="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-extrabold text-[9px]">NEARBY</span>';
    } else if (msg.channel === 'direct') {
      channelBadge = '<span class="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-extrabold text-[9px]">WHISPER</span>';
    }

    row.innerHTML = `
      <div class="flex items-center gap-1.5">
        ${channelBadge}
        <span class="font-bold text-slate-300" style="color: ${msg.avatarColor || '#60A5FA'}">${msg.senderName}</span>
        <span class="text-[10px] text-slate-500">${timeStr}</span>
      </div>
      <div class="text-slate-200 bg-slate-800/60 rounded-lg px-2.5 py-1.5 mt-0.5 border border-slate-700/50 break-words leading-relaxed">
        ${msg.text}
      </div>
    `;

    this.chatLog.appendChild(row);
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
  }

  // ==========================================================================
  // BULLETIN NOTES & MEDIA SCREEN
  // ==========================================================================
  renderBulletinNotes(notes) {
    const container = document.getElementById('bulletin-notes-grid');
    if (!container || !Array.isArray(notes)) return;
    container.innerHTML = '';

    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'rounded-xl p-3 shadow-md flex flex-col justify-between text-slate-900 animate-fadeIn';
      card.style.backgroundColor = note.color || '#FEF08A';

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-xs text-slate-900">${note.title}</span>
            <button class="delete-note-btn text-xs text-slate-600 hover:text-red-700 font-bold" data-id="${note.id}">✕</button>
          </div>
          <p class="text-xs text-slate-800 mt-1.5 leading-relaxed font-medium">${note.content}</p>
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-700 font-bold mt-3 border-t border-black/10 pt-1.5">
          <span>By ${note.author}</span>
          <span>${note.date}</span>
        </div>
      `;

      const delBtn = card.querySelector('.delete-note-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          this.network.deleteNote(note.id);
        });
      }

      container.appendChild(card);
    });
  }

  sendIframeCommand(iframeId, func, args = '') {
    const iframe = document.getElementById(iframeId);
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: func,
          args: args
        }), '*');
      } catch (e) {
        console.warn(`[IFrame Audio] Command ${func} failed:`, e);
      }
    }
  }

  toggleMusicMute() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.sendIframeCommand('projector-iframe', 'mute');
      if (this.musicMuteIcon) this.musicMuteIcon.textContent = '🔇';
      if (this.musicMuteBtn) {
        this.musicMuteBtn.classList.add('bg-rose-900/60', 'text-rose-300', 'border-rose-500/50');
        this.musicMuteBtn.title = 'Unmute Music';
      }
      if (this.musicIcon) this.musicIcon.classList.remove('animate-pulse');
      this.showToast('🔇 Office music muted', '#64748B');
    } else {
      this.sendIframeCommand('projector-iframe', 'unMute');
      this.sendIframeCommand('projector-iframe', 'playVideo');
      if (this.musicMuteIcon) this.musicMuteIcon.textContent = '🔊';
      if (this.musicMuteBtn) {
        this.musicMuteBtn.classList.remove('bg-rose-900/60', 'text-rose-300', 'border-rose-500/50');
        this.musicMuteBtn.title = 'Mute Music';
      }
      if (this.musicIcon) this.musicIcon.classList.add('animate-pulse');
      this.showToast('🔊 Office music playing', '#10B981');
    }
  }

  updateMediaScreen(media) {
    if (!media) return;
    this.currentMedia = media;
    const iframe = document.getElementById('projector-iframe');
    const titleEl = document.getElementById('projector-title');

    const cleanTitle = (media.title || 'lofi hip hop radio - beats to relax/study to').replace(/^▶\s*/, '');

    // 1. Update Projector modal title and Top HUD live playlist track title
    if (titleEl) {
      titleEl.textContent = `▶ ${cleanTitle} (Shared by ${media.setBy || 'Office Radio'})`;
    }
    if (this.musicTitle) {
      this.musicTitle.textContent = cleanTitle;
      this.musicTitle.title = cleanTitle;
    }

    // 2. Synchronize master video/audio iframe (Single unified source of truth)
    if (iframe) {
      const muteParam = this.isMusicMuted ? 1 : 0;
      const videoId = media.videoId || 'jfKfPfyJRdk';
      const targetEmbedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=${muteParam}&loop=1&playlist=${videoId}&controls=1`;

      if (!iframe.src || !iframe.src.includes(videoId)) {
        iframe.src = targetEmbedUrl;
      }
    }
  }

  async fetchAndPlayLiveMusic(keyword) {
    this.showToast(`🔍 Grabbing active live stream: "${keyword}"...`, '#6366F1');
    try {
      const res = await fetch(`/api/youtube/live-radio?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      if (data.success && data.videos && data.videos.length > 0) {
        const topVideo = data.videos[0];
        this.network.changeMedia(topVideo.url, topVideo.title);
        this.showToast(`▶ Now streaming live: ${topVideo.title}`, '#10B981');
      } else {
        this.showToast('⚠️ No active live stream found for that keyword', '#F59E0B');
      }
    } catch (e) {
      console.error('[Live Radio] Fetch error:', e);
      this.showToast('⚠️ Could not connect to YouTube live search API', '#EF4444');
    }
  }

  updateArcadeLeaderboard(leaderboard) {
    const container = document.getElementById('arcade-leaderboard-list');
    if (!container || !Array.isArray(leaderboard)) return;
    container.innerHTML = '';

    leaderboard.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800/80 text-xs text-slate-200 font-mono';
      row.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="w-5 text-center font-bold ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-amber-700'}">#${idx + 1}</span>
          <span class="font-bold">${item.name}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-emerald-400 font-black">${item.score} pts</span>
          <span class="text-[10px] text-slate-500">${item.date}</span>
        </div>
      `;
      container.appendChild(row);
    });
  }

  // ==========================================================================
  // DOCK USER PROFILE HUD
  // ==========================================================================
  updateDockProfile() {
    if (!this.localPlayerState) return;
    if (this.dockUserName) this.dockUserName.textContent = this.localPlayerState.name;
    if (this.dockUserStatus) {
      this.dockUserStatus.textContent = `${this.localPlayerState.status?.emoji || '💬'} ${this.localPlayerState.status?.text || 'Available'}`;
    }
    if (this.dockUserAvatarCircle) {
      this.dockUserAvatarCircle.style.backgroundColor = this.localPlayerState.avatar?.outfitColor || '#4F46E5';
      this.dockUserAvatarCircle.textContent = this.localPlayerState.name.charAt(0).toUpperCase();
    }
  }

  updateDockAVButtons() {
    if (!this.localPlayerState) return;
    const { mic, camera, screenShare } = this.localPlayerState.avState;

    if (this.btnMic) {
      this.btnMic.className = `gather-dock-btn ${mic ? 'is-active' : ''}`;
      this.btnMic.querySelector('.dock-icon').textContent = mic ? '🎤' : '🔇';
    }
    if (this.btnCam) {
      this.btnCam.className = `gather-dock-btn ${camera ? 'is-active' : ''}`;
      this.btnCam.querySelector('.dock-icon').textContent = camera ? '📹' : '🚫';
    }
    if (this.btnScreen) {
      this.btnScreen.className = `gather-dock-btn ${screenShare ? 'is-active' : ''}`;
    }
  }

  showToast(message, color = '#6366F1') {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2';
    toast.style.backgroundColor = color;
    toast.textContent = message;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-fadeOut');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  showWebRTCPopout(remoteId, state) {
    if (this.webrtc && typeof this.webrtc.showWebRTCPopout === 'function') {
      this.webrtc.showWebRTCPopout(remoteId, state);
    } else if (typeof window.showWebRTCPopout === 'function') {
      window.showWebRTCPopout(remoteId, state);
    }
  }

  // ==========================================================================
  // ICEBREAKER WHEEL OF FORTUNE (ROULETTE)
  // ==========================================================================
  initRouletteWheel() {
    this.rouletteSlices = [
      { text: 'Productivity', icon: '💡', color: '#10B981' }, // 0
      { text: 'Dream Travel', icon: '✈️', color: '#06B6D4' }, // 1
      { text: 'Tea or Coffee', icon: '☕', color: '#F59E0B' }, // 2
      { text: 'Coding Song',  icon: '🎵', color: '#6366F1' }, // 3
      { text: 'Secret Hobby', icon: '🎭', color: '#8B5CF6' }, // 4
      { text: 'Favorite Meal',icon: '🍰', color: '#EC4899' }  // 5
    ];
    this.rouletteAngle = this.rouletteAngle || 0;
    this.isRouletteSpinning = false;
    this.drawRouletteWheel(this.rouletteAngle);
  }

  drawRouletteWheel(angle = 0) {
    const canvas = document.getElementById('roulette-wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = cx - 10;
    const slices = this.rouletteSlices || [
      { text: 'Productivity', icon: '💡', color: '#10B981' },
      { text: 'Dream Travel', icon: '✈️', color: '#06B6D4' },
      { text: 'Tea or Coffee', icon: '☕', color: '#F59E0B' },
      { text: 'Coding Song',  icon: '🎵', color: '#6366F1' },
      { text: 'Secret Hobby', icon: '🎭', color: '#8B5CF6' },
      { text: 'Favorite Meal',icon: '🍰', color: '#EC4899' }
    ];
    const numSlices = slices.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (let i = 0; i < numSlices; i++) {
      const startA = i * sliceAngle;
      const endA = startA + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = slices[i].color;
      ctx.fill();
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text & icon
      ctx.save();
      const midA = startA + sliceAngle / 2;
      ctx.rotate(midA);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${slices[i].icon} ${slices[i].text}`, radius - 16, 4);
      ctx.restore();
    }

    // Outer gold border with division pegs
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Small golden pegs around edge
    for (let i = 0; i < numSlices; i++) {
      const a = i * sliceAngle;
      const px = Math.cos(a) * (radius - 2);
      const py = Math.sin(a) * (radius - 2);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FDE68A';
      ctx.fill();
    }

    // Center circular badge
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', 0, 0);

    ctx.restore();
  }

  playRouletteTick() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.audioCtx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.035);
    } catch (e) {}
  }

  handleRouletteStarted(data) {
    const { targetIndex, spinner } = data;
    const btn = document.getElementById('btn-spin-wheel');
    const badge = document.getElementById('roulette-status-badge');
    const topicText = document.getElementById('roulette-topic-text');
    if (btn) btn.disabled = true;
    if (badge) {
      badge.textContent = `🎲 ${spinner} is spinning...`;
      badge.className = 'text-[10px] uppercase font-black tracking-wider text-rose-400 animate-pulse';
    }
    if (topicText) {
      topicText.textContent = 'Hold tight! Wheel is deciding the icebreaker topic...';
    }

    this.isRouletteSpinning = true;

    const sliceAngle = (Math.PI * 2) / 6;
    const sliceCenter = targetIndex * sliceAngle + sliceAngle / 2;
    const desiredFinalAngle = -Math.PI / 2 - sliceCenter;
    const currentNorm = (this.rouletteAngle || 0) % (Math.PI * 2);
    const extraRotations = 5 * Math.PI * 2; // 5 full loops
    let totalDelta = desiredFinalAngle - currentNorm + extraRotations;
    while (totalDelta < extraRotations) {
      totalDelta += Math.PI * 2;
    }

    const startAngle = this.rouletteAngle || 0;
    const targetAngle = startAngle + totalDelta;
    const duration = 3600; // 3.6s
    const startTime = performance.now();
    let lastTickSlice = -1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const curAngle = startAngle + totalDelta * ease;
      this.rouletteAngle = curAngle;
      this.drawRouletteWheel(curAngle);

      const curSlice = Math.floor((curAngle / sliceAngle)) % 6;
      if (curSlice !== lastTickSlice) {
        lastTickSlice = curSlice;
        this.playRouletteTick();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isRouletteSpinning = false;
        this.drawRouletteWheel(targetAngle);
      }
    };
    requestAnimationFrame(animate);
  }

  handleRouletteFinished(data) {
    const { topic, spinner } = data;
    const btn = document.getElementById('btn-spin-wheel');
    const badge = document.getElementById('roulette-status-badge');
    const topicText = document.getElementById('roulette-topic-text');
    if (btn) btn.disabled = false;
    if (badge) {
      badge.textContent = `✨ ICEBREAKER TOPIC (Spun by ${spinner})`;
      badge.className = 'text-[10px] uppercase font-black tracking-wider text-emerald-400';
    }
    if (topicText) {
      topicText.textContent = `"${topic}"`;
    }
    this.showToast(`🎡 Icebreaker Topic: "${topic}"`, '#10B981');
  }
}
