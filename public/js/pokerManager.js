/**
 * ============================================================================
 * Kosmi Texas Hold'em Poker UI Manager (Client Side)
 * 1-to-1 clone of https://kosmi.io/poker/
 * Features 6-max oval felt, chip animations, hole & community cards,
 * interactive betting controls, turn timers, hand helper, ready check system,
 * action-needed audio cues (Web Audio API), and winner celebration.
 * ============================================================================
 */

export class PokerManager {
  constructor(network, uiManager) {
    this.network = network;
    this.ui = uiManager;
    this.state = null;
    this.prevState = null;
    this.mySeatIndex = null;
    this.myCards = [];
    this.myHand = null;

    this.prevTurnSeat = null;
    this.prevTurnSeconds = null;
    this.lastPromptedReady = false;

    // Web Audio Context for turn & action prompts
    this.audioCtx = null;

    // DOM Elements
    this.container = document.getElementById('modal-poker');
    this.tableEl = document.getElementById('poker-felt-table');
    this.communityCardsEl = document.getElementById('poker-community-cards');
    this.potEl = document.getElementById('poker-pot-display');
    this.actionConsoleEl = document.getElementById('poker-action-console');
    this.readyConsoleEl = document.getElementById('poker-ready-console');
    this.turnBannerEl = document.getElementById('poker-turn-banner');
    this.turnBannerText = document.getElementById('poker-turn-banner-text');
    this.winnerBannerEl = document.getElementById('poker-winner-banner');
    this.handNameEl = document.getElementById('poker-hand-eval-text');

    // Betting Controls
    this.btnFold = document.getElementById('poker-btn-fold');
    this.btnCheckCall = document.getElementById('poker-btn-check-call');
    this.btnRaise = document.getElementById('poker-btn-raise');
    this.raiseSlider = document.getElementById('poker-raise-slider');
    this.raiseAmountEl = document.getElementById('poker-raise-amount-val');
    this.btnLeave = document.getElementById('poker-btn-leave');

    // Ready System Controls
    this.btnReady = document.getElementById('poker-btn-ready');
    this.btnReadyText = document.getElementById('poker-btn-ready-text');
    this.btnReadyIcon = document.getElementById('poker-btn-ready-icon');
    this.readyStatusTitle = document.getElementById('poker-ready-status-title');
    this.readyStatusDesc = document.getElementById('poker-ready-status-desc');
    this.readyCountBadge = document.getElementById('poker-ready-count-badge');

    this.bindEvents();
    this.setupSocketListeners();
  }

  // ==========================================================================
  // Web Audio API Synthesizer (Instant latency, 0 external network requests)
  // ==========================================================================
  initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  playPokerSound(type) {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      if (type === 'turn') {
        // Distinctive two-tone chime for player's turn: D5 (587Hz) -> A5 (880Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        gain2.gain.setValueAtTime(0.25, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.6);
      } else if (type === 'action_needed' || type === 'ready_needed') {
        // Gentle double-ping prompting action needed
        [0, 0.12].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(659.25, now + delay); // E5
          gain.gain.setValueAtTime(0.18, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.18);
        });
      } else if (type === 'warning') {
        // Subtle countdown tick for last 5 seconds of turn
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(740, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'chips') {
        // Poker chip clink sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.07);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'win') {
        // Uplifting win arpeggio (C5 - E5 - G5 - C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.2, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.35);
        });
      }
    } catch (err) {
      console.warn('[Poker Audio]', err);
    }
  }

  setupSocketListeners() {
    this.network.on('poker_state', (state) => {
      this.updateState(state);
    });

    this.network.on('poker_public_sync', (state) => {
      if (!this.myCards || this.myCards.length === 0) {
        this.updateState(state);
      }
    });
  }

  bindEvents() {
    // 1. Ready Button Click
    if (this.btnReady) {
      this.btnReady.addEventListener('click', () => {
        this.initAudio();
        const mySeat = this.getMySeat();
        if (!mySeat) return;
        this.playPokerSound('chips');
        this.network.readyPoker(!mySeat.ready);
      });
    }

    // 2. Betting Actions
    if (this.btnFold) {
      this.btnFold.addEventListener('click', () => {
        this.initAudio();
        this.playPokerSound('chips');
        this.network.pokerAction('fold');
      });
    }

    if (this.btnCheckCall) {
      this.btnCheckCall.addEventListener('click', () => {
        this.initAudio();
        const mySeat = this.getMySeat();
        if (!mySeat) return;
        this.playPokerSound('chips');
        const curBet = this.state?.currentBet || 0;
        if (mySeat.currentBet >= curBet) {
          this.network.pokerAction('check');
        } else {
          this.network.pokerAction('call');
        }
      });
    }

    if (this.btnRaise) {
      this.btnRaise.addEventListener('click', () => {
        this.initAudio();
        this.playPokerSound('chips');
        const val = Number(this.raiseSlider?.value) || (this.state?.currentBet * 2) || 200;
        this.network.pokerAction('raise', val);
      });
    }

    if (this.raiseSlider) {
      this.raiseSlider.addEventListener('input', (e) => {
        if (this.raiseAmountEl) {
          this.raiseAmountEl.textContent = `${Number(e.target.value).toLocaleString()} 🪙`;
        }
      });
    }

    // Quick Bet Preset Buttons
    document.querySelectorAll('.poker-quick-bet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.initAudio();
        const type = btn.getAttribute('data-type');
        const mySeat = this.getMySeat();
        if (!mySeat || !this.raiseSlider) return;

        const pot = this.state?.pot || 0;
        const curBet = this.state?.currentBet || 100;

        let amount = curBet * 2;
        if (type === 'min') amount = curBet + (this.state?.minRaise || 100);
        else if (type === '2x') amount = curBet * 2;
        else if (type === '3x') amount = curBet * 3;
        else if (type === 'pot') amount = curBet + pot;
        else if (type === 'allin') amount = mySeat.chips + mySeat.currentBet;

        amount = Math.min(amount, mySeat.chips + mySeat.currentBet);
        this.raiseSlider.value = amount;
        if (this.raiseAmountEl) {
          this.raiseAmountEl.textContent = `${amount.toLocaleString()} 🪙`;
        }
        this.playPokerSound('chips');
      });
    });

    // Leave Table Button
    if (this.btnLeave) {
      this.btnLeave.addEventListener('click', () => {
        this.leaveTable();
      });
    }

    // Close Modal Button (also leaves table cleanly)
    const closeBtn = this.container?.querySelector('.btn-close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.leaveTable();
      });
    }
  }

  getMySeat() {
    if (!this.state || !Array.isArray(this.state.seats)) return null;
    return this.state.seats[this.mySeatIndex] || null;
  }

  joinSeat(seatIndex, chairId) {
    this.initAudio();
    this.mySeatIndex = seatIndex;
    this.network.sitPoker(seatIndex, chairId);
    this.openModal();
  }

  leaveTable() {
    this.network.standPoker();
    this.mySeatIndex = null;
    this.myCards = [];
    this.myHand = null;
    this.closeModal();

    if (window.GatherApp?.scene) {
      window.GatherApp.scene.standUp();
    }
  }

  openModal() {
    if (this.container) {
      this.container.classList.remove('hidden');
      if (this.ui) this.ui.activeModal = this.container;
      this.render();
    }
  }

  closeModal() {
    if (this.container) {
      this.container.classList.add('hidden');
      if (this.ui && this.ui.activeModal === this.container) {
        this.ui.activeModal = null;
      }
    }
  }

  updateState(newState) {
    this.state = newState;
    if (newState.mySeatIndex !== undefined) {
      this.mySeatIndex = newState.mySeatIndex;
    }
    if (newState.myCards) {
      this.myCards = newState.myCards;
    }
    if (newState.myHand) {
      this.myHand = newState.myHand;
    }

    // ------------------------------------------------------------------------
    // Turn & Action-Needed Audio Hint Prompts
    // ------------------------------------------------------------------------
    const isNowMyTurn = (newState.turnSeat === this.mySeatIndex && newState.stage !== 'waiting' && newState.stage !== 'showdown');
    const wasMyTurn = (this.prevTurnSeat === this.mySeatIndex && this.prevState?.stage !== 'waiting');

    if (isNowMyTurn && !wasMyTurn) {
      // It just became this player's turn to act!
      this.playPokerSound('turn');
    } else if (isNowMyTurn && newState.turnSecondsLeft <= 5 && newState.turnSecondsLeft > 0 && newState.turnSecondsLeft !== this.prevTurnSeconds) {
      // 5s countdown warning
      this.playPokerSound('warning');
    }

    // Action needed: Prompt if seated and NOT yet ready while others are ready
    const mySeat = (newState.seats && this.mySeatIndex !== null) ? newState.seats[this.mySeatIndex] : null;
    if (newState.stage === 'waiting' && mySeat && !mySeat.ready) {
      if (newState.readyCount > 0 && !this.lastPromptedReady) {
        this.playPokerSound('action_needed');
        this.lastPromptedReady = true;
      }
    } else {
      this.lastPromptedReady = false;
    }

    // Win Sound
    if (newState.stage === 'showdown' && this.prevState?.stage !== 'showdown') {
      const myId = this.network.socket?.id;
      if (newState.handWinnerInfo?.winners?.some(w => w.id === myId)) {
        this.playPokerSound('win');
      }
    }

    this.prevTurnSeat = newState.turnSeat;
    this.prevTurnSeconds = newState.turnSecondsLeft;
    this.prevState = newState;

    if (this.container && !this.container.classList.contains('hidden')) {
      this.render();
    }
  }

  render() {
    if (!this.state) return;

    this.renderCommunityCards();
    this.renderPot();
    this.renderSeats();
    this.renderTurnBanner();
    this.renderReadyConsole();
    this.renderActionConsole();
    this.renderWinnerBanner();
  }

  renderCommunityCards() {
    if (!this.communityCardsEl) return;
    this.communityCardsEl.innerHTML = '';

    const cards = this.state.communityCards || [];
    for (let i = 0; i < 5; i++) {
      const card = cards[i];
      const slot = document.createElement('div');
      slot.className = 'w-14 h-20 rounded-lg flex flex-col items-center justify-between p-1 shadow-md transition-all duration-300';

      if (card) {
        const isRed = card.color === 'red';
        slot.className += ' bg-white border-2 border-slate-200 text-slate-900 animate-flipIn';
        slot.innerHTML = `
          <div class="self-start text-xs font-black leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}">${card.rank}</div>
          <div class="text-2xl font-bold leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}">${card.suit}</div>
          <div class="self-end text-xs font-black leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}">${card.rank}</div>
        `;
      } else {
        slot.className += ' border-2 border-dashed border-emerald-500/30 bg-emerald-950/20';
      }
      this.communityCardsEl.appendChild(slot);
    }
  }

  renderPot() {
    if (this.potEl) {
      if (this.state.stage === 'waiting') {
        const seated = this.state.seatedCount || 0;
        const ready = this.state.readyCount || 0;
        this.potEl.textContent = `Waiting for Ready (${ready}/${seated}) 🪙`;
      } else {
        const pot = this.state.pot || 0;
        this.potEl.textContent = `Pot: ${pot.toLocaleString()} 🪙`;
      }
    }
  }

  renderTurnBanner() {
    if (!this.turnBannerEl) return;

    const isMidGame = (this.state.stage !== 'waiting' && this.state.stage !== 'showdown');
    if (!isMidGame) {
      this.turnBannerEl.classList.add('hidden');
      return;
    }

    const isMyTurn = (this.state.turnSeat === this.mySeatIndex);
    this.turnBannerEl.classList.remove('hidden');

    if (isMyTurn) {
      this.turnBannerEl.className = 'px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-xs text-center shadow-lg animate-pulse flex items-center justify-center gap-2';
      if (this.turnBannerText) {
        this.turnBannerText.textContent = `🔔 IT'S YOUR TURN! (⏱️ ${this.state.turnSecondsLeft || 20}s) Choose Check, Call, or Raise.`;
      }
    } else {
      const activePlayer = this.state.seats ? this.state.seats[this.state.turnSeat] : null;
      const name = activePlayer?.name || `Seat ${(this.state.turnSeat || 0) + 1}`;
      this.turnBannerEl.className = 'px-4 py-1.5 bg-slate-900/95 border-b border-slate-800 text-slate-300 font-bold text-xs text-center flex items-center justify-center gap-2';
      if (this.turnBannerText) {
        this.turnBannerText.textContent = `⏳ Waiting for ${name} (⏱️ ${this.state.turnSecondsLeft || 20}s)...`;
      }
    }
  }

  renderReadyConsole() {
    if (!this.readyConsoleEl) return;

    const isWaiting = (this.state.stage === 'waiting');
    if (!isWaiting) {
      this.readyConsoleEl.classList.add('hidden');
      return;
    }

    this.readyConsoleEl.classList.remove('hidden');
    const seatedCount = this.state.seatedCount || 0;
    const readyCount = this.state.readyCount || 0;

    if (this.readyCountBadge) {
      this.readyCountBadge.textContent = `${readyCount}/${seatedCount} Ready`;
      if (seatedCount >= 2 && readyCount === seatedCount) {
        this.readyCountBadge.className = 'px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-mono font-black animate-bounce';
      } else {
        this.readyCountBadge.className = 'px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono font-black text-amber-400';
      }
    }

    const mySeat = this.getMySeat();

    if (this.readyStatusTitle && this.readyStatusDesc) {
      if (seatedCount < 2) {
        this.readyStatusTitle.textContent = 'Waiting for Players...';
        this.readyStatusDesc.textContent = 'At least 2 seated players are required to start Texas Hold\'em.';
      } else if (seatedCount >= 2 && readyCount === seatedCount) {
        this.readyStatusTitle.textContent = '🟢 All Players Ready!';
        this.readyStatusDesc.textContent = 'Dealing private cards and posting blinds...';
      } else {
        this.readyStatusTitle.textContent = 'Ready Check in Progress';
        this.readyStatusDesc.textContent = `All seated players must click Ready to begin the game (${readyCount}/${seatedCount} Ready).`;
      }
    }

    if (this.btnReady) {
      if (!mySeat) {
        // Spectator: hide button
        this.btnReady.classList.add('hidden');
      } else {
        this.btnReady.classList.remove('hidden');
        if (mySeat.ready) {
          if (this.btnReadyText) this.btnReadyText.textContent = 'Ready (Click to Cancel)';
          if (this.btnReadyIcon) this.btnReadyIcon.textContent = '🟢';
          this.btnReady.className = 'px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/60 font-black text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer';
        } else {
          if (this.btnReadyText) this.btnReadyText.textContent = 'I\'m Ready';
          if (this.btnReadyIcon) this.btnReadyIcon.textContent = '✅';
          this.btnReady.className = 'px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center gap-1.5 cursor-pointer animate-pulse';
        }
      }
    }
  }

  renderSeats() {
    const seats = this.state.seats || [];
    for (let i = 0; i < 6; i++) {
      const seatContainer = document.getElementById(`poker-seat-${i}`);
      if (!seatContainer) continue;

      const player = seats[i];
      const isDealer = (this.state.dealerSeat === i);
      const isTurn = (this.state.turnSeat === i && this.state.stage !== 'waiting' && this.state.stage !== 'showdown');
      const isMe = (this.mySeatIndex === i);

      seatContainer.innerHTML = '';

      if (!player) {
        // Empty Seat
        seatContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 border-dashed border-emerald-600/40 bg-emerald-950/20 text-emerald-400/60 font-bold text-xs hover:border-emerald-400 hover:text-emerald-300 cursor-pointer transition">
            <span class="text-lg">🪑</span>
            <span>Seat ${i + 1}</span>
            <span class="text-[10px] opacity-75">Click to sit</span>
          </div>
        `;
        seatContainer.onclick = () => {
          this.joinSeat(i, `poker_chair_${i + 1}`);
        };
        continue;
      }

      seatContainer.onclick = null;

      // Active Player Pod
      const cardWrapper = document.createElement('div');
      cardWrapper.className = `relative flex flex-col items-center w-28 p-2 rounded-2xl bg-slate-900/90 border-2 ${
        isTurn ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.5)]' :
        player.folded ? 'border-slate-700 opacity-50' : 'border-emerald-600/60'
      } backdrop-blur-md transition-all duration-300`;

      // Dealer Button
      const dealerBadge = (isDealer && this.state.stage !== 'waiting') ? `
        <div class="absolute -top-2.5 -right-2 w-6 h-6 rounded-full bg-amber-400 border border-amber-200 text-slate-900 font-black text-xs flex items-center justify-center shadow-lg z-20">
          D
        </div>
      ` : '';

      // Timer ring if turn
      const timerBadge = isTurn ? `
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider animate-pulse z-20">
          ⏱️ ${this.state.turnSecondsLeft || 20}s
        </div>
      ` : '';

      // Hole Cards display or Ready Status Badge
      let middleHtml = '';
      if (this.state.stage === 'waiting') {
        if (player.ready) {
          middleHtml = `
            <div class="mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] shadow flex items-center gap-1">
              <span>🟢</span>
              <span>READY</span>
            </div>
          `;
        } else {
          middleHtml = `
            <div class="mt-2 px-2.5 py-0.5 rounded-full bg-slate-800 border border-amber-500/80 text-amber-300 font-bold text-[10px] shadow flex items-center gap-1 animate-pulse">
              <span>⏳</span>
              <span>NOT READY</span>
            </div>
          `;
        }
      } else {
        if (player.folded) {
          middleHtml = `<div class="text-[11px] font-bold text-slate-400 italic py-2">Folded</div>`;
        } else if (isMe && this.myCards && this.myCards.length === 2) {
          middleHtml = `
            <div class="flex items-center gap-1 my-1">
              ${this.renderCardMini(this.myCards[0])}
              ${this.renderCardMini(this.myCards[1])}
            </div>
          `;
        } else if (player.cards && player.cards.length === 2) {
          // Showdown: reveal opponent cards
          middleHtml = `
            <div class="flex items-center gap-1 my-1">
              ${this.renderCardMini(player.cards[0])}
              ${this.renderCardMini(player.cards[1])}
            </div>
          `;
        } else if (player.cardsCount === 2) {
          // Face down Kosmi cards
          middleHtml = `
            <div class="flex items-center gap-1 my-1">
              <div class="w-7 h-10 rounded bg-indigo-700 border border-indigo-400/60 flex items-center justify-center text-xs text-indigo-200 shadow">🂠</div>
              <div class="w-7 h-10 rounded bg-indigo-700 border border-indigo-400/60 flex items-center justify-center text-xs text-indigo-200 shadow">🂠</div>
            </div>
          `;
        }
      }

      // Bet chips pill
      const betHtml = (player.currentBet > 0 && this.state.stage !== 'waiting') ? `
        <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold shadow flex items-center gap-1 whitespace-nowrap z-20">
          <span>🪙</span>
          <span>${player.currentBet.toLocaleString()}</span>
        </div>
      ` : '';

      cardWrapper.innerHTML = `
        ${dealerBadge}
        ${timerBadge}
        <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md" style="background-color: ${player.avatar?.outfitColor || '#4F46E5'}">
          ${player.name.charAt(0).toUpperCase()}
        </div>
        <div class="text-xs font-black text-slate-100 truncate max-w-[90px] mt-1">${player.name}${isMe ? ' (You)' : ''}</div>
        <div class="text-[11px] font-bold text-amber-400 font-mono">${(player.chips || 0).toLocaleString()} 🪙</div>
        ${middleHtml}
        ${betHtml}
      `;

      seatContainer.appendChild(cardWrapper);
    }
  }

  renderCardMini(card) {
    if (!card) return '';
    const isRed = card.color === 'red';
    return `
      <div class="w-8 h-11 rounded bg-white border border-slate-300 flex flex-col items-center justify-center text-slate-900 shadow">
        <span class="text-[10px] font-black leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}">${card.rank}</span>
        <span class="text-xs font-bold leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}">${card.suit}</span>
      </div>
    `;
  }

  renderActionConsole() {
    const isWaiting = (this.state.stage === 'waiting');
    if (isWaiting) {
      if (this.actionConsoleEl) this.actionConsoleEl.classList.add('hidden');
      return;
    }

    if (this.actionConsoleEl) this.actionConsoleEl.classList.remove('hidden');

    const mySeat = this.getMySeat();
    if (!mySeat || !this.actionConsoleEl) {
      if (this.actionConsoleEl) this.actionConsoleEl.classList.add('opacity-40', 'pointer-events-none');
      return;
    }

    const isMyTurn = (this.state.turnSeat === this.mySeatIndex && this.state.stage !== 'showdown');
    this.actionConsoleEl.classList.remove('opacity-40', 'pointer-events-none');

    // Hand helper text
    if (this.handNameEl) {
      if (this.myHand && this.myHand.name) {
        this.handNameEl.textContent = `🎯 Best Hand: ${this.myHand.name}`;
      } else {
        this.handNameEl.textContent = 'Texas Hold\'em No-Limit • kosmi.io';
      }
    }

    // Toggle button active states based on turn
    if (!isMyTurn || mySeat.folded) {
      if (this.btnFold) this.btnFold.disabled = true;
      if (this.btnCheckCall) this.btnCheckCall.disabled = true;
      if (this.btnRaise) this.btnRaise.disabled = true;
      return;
    }

    if (this.btnFold) this.btnFold.disabled = false;
    if (this.btnCheckCall) this.btnCheckCall.disabled = false;
    if (this.btnRaise) this.btnRaise.disabled = false;

    // Check vs Call label
    const curBet = this.state.currentBet || 0;
    const diff = curBet - mySeat.currentBet;
    if (this.btnCheckCall) {
      if (diff <= 0) {
        this.btnCheckCall.textContent = 'Check';
        this.btnCheckCall.className = 'px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg transition active:scale-95';
      } else {
        this.btnCheckCall.textContent = `Call ${diff.toLocaleString()} 🪙`;
        this.btnCheckCall.className = 'px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg transition active:scale-95';
      }
    }

    // Raise Slider range
    if (this.raiseSlider) {
      const minRaise = curBet + (this.state.minRaise || 100);
      const maxRaise = mySeat.chips + mySeat.currentBet;
      this.raiseSlider.min = minRaise;
      this.raiseSlider.max = Math.max(minRaise, maxRaise);
      if (Number(this.raiseSlider.value) < minRaise) {
        this.raiseSlider.value = minRaise;
      }
      if (this.raiseAmountEl) {
        this.raiseAmountEl.textContent = `${Number(this.raiseSlider.value).toLocaleString()} 🪙`;
      }
    }
  }

  renderWinnerBanner() {
    if (!this.winnerBannerEl) return;
    const info = this.state?.handWinnerInfo;
    if (info && info.description) {
      this.winnerBannerEl.classList.remove('hidden');
      this.winnerBannerEl.textContent = info.description;
    } else {
      this.winnerBannerEl.classList.add('hidden');
    }
  }
}
