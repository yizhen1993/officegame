/**
 * ============================================================================
 * Kosmi Texas Hold'em Poker Engine (Server Side)
 * Supports up to 6 players, standard 52-card deck, hand evaluation, blinds,
 * betting rounds (Pre-flop, Flop, Turn, River, Showdown), turn timers & pot awards.
 * ============================================================================
 */

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: VALUES[rank],
        color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
      });
    }
  }
  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ----------------------------------------------------------------------------
// Hand Evaluator (Evaluates best 5-card hand out of 7 cards)
// ----------------------------------------------------------------------------
function evaluate7Cards(cards) {
  if (!cards || cards.length < 5) {
    return { score: 0, name: 'Incomplete Hand', cards: [] };
  }

  // Generate all 5-card combinations of the 7 cards
  const combos = [];
  const n = cards.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        for (let l = k + 1; l < n; l++) {
          for (let m = l + 1; m < n; m++) {
            combos.push([cards[i], cards[j], cards[k], cards[l], cards[m]]);
          }
        }
      }
    }
  }

  let bestScore = -1;
  let bestResult = null;

  for (const combo of combos) {
    const res = score5Cards(combo);
    if (res.score > bestScore) {
      bestScore = res.score;
      bestResult = res;
    }
  }

  return bestResult;
}

function score5Cards(five) {
  // Sort descending by value
  const sorted = [...five].sort((a, b) => b.value - a.value);
  const values = sorted.map(c => c.value);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  let isStraight = false;
  let straightHigh = 0;

  // Normal straight check
  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  } else if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    // Wheel straight: A-2-3-4-5
    isStraight = true;
    straightHigh = 5;
  }

  // Count frequencies
  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const countPairs = Object.entries(counts).map(([v, count]) => ({ val: Number(v), count }));
  countPairs.sort((a, b) => b.count - a.count || b.val - a.val);

  // 1. Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return { score: 9000000, name: 'Royal Flush', cards: sorted };
  }
  // 2. Straight Flush
  if (isFlush && isStraight) {
    return { score: 8000000 + straightHigh, name: `Straight Flush (${sorted[0].rank} high)`, cards: sorted };
  }
  // 3. Four of a Kind
  if (countPairs[0].count === 4) {
    const score = 7000000 + countPairs[0].val * 100 + countPairs[1].val;
    return { score, name: `Four of a Kind (${rankName(countPairs[0].val)}s)`, cards: sorted };
  }
  // 4. Full House
  if (countPairs[0].count === 3 && countPairs[1].count === 2) {
    const score = 6000000 + countPairs[0].val * 100 + countPairs[1].val;
    return { score, name: `Full House (${rankName(countPairs[0].val)}s full of ${rankName(countPairs[1].val)}s)`, cards: sorted };
  }
  // 5. Flush
  if (isFlush) {
    const score = 5000000 + values[0] * 10000 + values[1] * 1000 + values[2] * 100 + values[3] * 10 + values[4];
    return { score, name: `Flush (${sorted[0].rank} high)`, cards: sorted };
  }
  // 6. Straight
  if (isStraight) {
    return { score: 4000000 + straightHigh, name: `Straight (${rankName(straightHigh)} high)`, cards: sorted };
  }
  // 7. Three of a Kind
  if (countPairs[0].count === 3) {
    const score = 3000000 + countPairs[0].val * 1000 + countPairs[1].val * 10 + countPairs[2].val;
    return { score, name: `Three of a Kind (${rankName(countPairs[0].val)}s)`, cards: sorted };
  }
  // 8. Two Pair
  if (countPairs[0].count === 2 && countPairs[1].count === 2) {
    const score = 2000000 + countPairs[0].val * 1000 + countPairs[1].val * 10 + countPairs[2].val;
    return { score, name: `Two Pair (${rankName(countPairs[0].val)}s & ${rankName(countPairs[1].val)}s)`, cards: sorted };
  }
  // 9. One Pair
  if (countPairs[0].count === 2) {
    const score = 1000000 + countPairs[0].val * 10000 + countPairs[1].val * 100 + countPairs[2].val * 10 + countPairs[3].val;
    return { score, name: `Pair of ${rankName(countPairs[0].val)}s`, cards: sorted };
  }
  // 10. High Card
  const score = values[0] * 10000 + values[1] * 1000 + values[2] * 100 + values[3] * 10 + values[4];
  return { score, name: `High Card ${sorted[0].rank}`, cards: sorted };
}

function rankName(val) {
  if (val === 14) return 'Ace';
  if (val === 13) return 'King';
  if (val === 12) return 'Queen';
  if (val === 11) return 'Jack';
  return String(val);
}

// ----------------------------------------------------------------------------
// Texas Hold'em Room Engine
// ----------------------------------------------------------------------------
class PokerEngine {
  constructor(io) {
    this.io = io;
    this.seats = [null, null, null, null, null, null]; // 6 seats
    this.deck = [];
    this.communityCards = [];
    this.pot = 0;
    this.stage = 'waiting'; // waiting, preflop, flop, turn, river, showdown
    this.dealerSeat = 0;
    this.turnSeat = null;
    this.currentBet = 0;
    this.minRaise = 100;
    this.smallBlind = 50;
    this.bigBlind = 100;
    this.turnSecondsLeft = 20;
    this.timerInterval = null;
    this.handWinnerInfo = null;
    this.actedSeats = new Set();
  }

  getSeatedCount() {
    return this.seats.filter(s => s !== null).length;
  }

  getActivePlayers() {
    return this.seats.filter(s => s !== null && !s.folded && s.chips + s.currentBet > 0);
  }

  sit(socketId, playerName, avatar, seatIndex, chairId) {
    if (seatIndex < 0 || seatIndex >= 6) return false;
    // Check if player already seated elsewhere
    const existing = this.seats.findIndex(s => s && s.id === socketId);
    if (existing !== -1) {
      this.stand(socketId);
    }

    if (this.seats[seatIndex] !== null) {
      // Find next free seat if requested seat is taken
      seatIndex = this.seats.findIndex(s => s === null);
      if (seatIndex === -1) return false;
    }

    this.seats[seatIndex] = {
      id: socketId,
      name: playerName || 'Player',
      avatar: avatar || {},
      chips: 10000,
      currentBet: 0,
      folded: false,
      cards: [],
      isAllIn: false,
      seatIndex,
      chairId
    };

    this.broadcastState();

    if (this.stage === 'waiting' && this.getSeatedCount() >= 2) {
      setTimeout(() => this.startNewHand(), 1000);
    }
    return true;
  }

  stand(socketId) {
    const idx = this.seats.findIndex(s => s && s.id === socketId);
    if (idx === -1) return false;

    const player = this.seats[idx];
    if (this.turnSeat === idx) {
      this.fold(idx);
    }

    this.seats[idx] = null;
    this.broadcastState();

    if (this.getSeatedCount() < 2 && this.stage !== 'waiting') {
      this.resetTable();
    }
    return true;
  }

  startNewHand() {
    const seated = this.seats.map((s, idx) => ({ s, idx })).filter(item => item.s !== null);
    if (seated.length < 2) {
      this.stage = 'waiting';
      this.broadcastState();
      return;
    }

    this.deck = createDeck();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = this.bigBlind;
    this.minRaise = this.bigBlind;
    this.handWinnerInfo = null;
    this.actedSeats.clear();

    // Advance dealer button
    let nextDealer = (this.dealerSeat + 1) % 6;
    while (!this.seats[nextDealer]) {
      nextDealer = (nextDealer + 1) % 6;
    }
    this.dealerSeat = nextDealer;

    // Reset players & deal 2 private cards
    this.seats.forEach(s => {
      if (s) {
        s.folded = false;
        s.isAllIn = false;
        s.currentBet = 0;
        s.cards = [this.deck.pop(), this.deck.pop()];
      }
    });

    // Small blind & Big blind
    let sbSeat = this.findNextSeated(this.dealerSeat);
    let bbSeat = this.findNextSeated(sbSeat);

    this.postBet(sbSeat, this.smallBlind);
    this.postBet(bbSeat, this.bigBlind);

    this.stage = 'preflop';
    // Action starts after big blind
    this.turnSeat = this.findNextSeated(bbSeat);
    this.startTurnTimer();
    this.broadcastState();
  }

  postBet(seatIdx, amount) {
    const player = this.seats[seatIdx];
    if (!player) return;
    const actual = Math.min(player.chips, amount);
    player.chips -= actual;
    player.currentBet += actual;
    this.pot += actual;
    if (player.chips === 0) {
      player.isAllIn = true;
    }
  }

  findNextSeated(fromIdx) {
    let next = (fromIdx + 1) % 6;
    let count = 0;
    while (count < 6) {
      if (this.seats[next] && !this.seats[next].folded) {
        return next;
      }
      next = (next + 1) % 6;
      count++;
    }
    return fromIdx;
  }

  startTurnTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.turnSecondsLeft = 20;

    this.timerInterval = setInterval(() => {
      this.turnSecondsLeft--;
      if (this.turnSecondsLeft <= 0) {
        clearInterval(this.timerInterval);
        // Timeout: auto-check if current bet matches, otherwise auto-fold
        const cur = this.seats[this.turnSeat];
        if (cur) {
          if (cur.currentBet >= this.currentBet) {
            this.handleAction(cur.id, 'check');
          } else {
            this.handleAction(cur.id, 'fold');
          }
        }
      } else {
        // Send lightweight timer update
        this.io.emit('poker_state', this.getPublicState());
      }
    }, 1000);
  }

  handleAction(socketId, action, amount = 0) {
    const seatIdx = this.seats.findIndex(s => s && s.id === socketId);
    if (seatIdx === -1 || seatIdx !== this.turnSeat) return false;

    const player = this.seats[seatIdx];
    this.actedSeats.add(seatIdx);

    if (action === 'fold') {
      this.fold(seatIdx);
    } else if (action === 'check') {
      if (player.currentBet < this.currentBet) {
        // Cannot check, force call
        this.postBet(seatIdx, this.currentBet - player.currentBet);
      }
    } else if (action === 'call') {
      const needed = this.currentBet - player.currentBet;
      this.postBet(seatIdx, needed);
    } else if (action === 'raise') {
      const raiseTo = Math.max(this.currentBet + this.minRaise, Number(amount) || (this.currentBet * 2));
      const additional = raiseTo - player.currentBet;
      this.postBet(seatIdx, additional);
      this.currentBet = player.currentBet;
      // Raising resets others' acted status
      this.actedSeats.clear();
      this.actedSeats.add(seatIdx);
    } else if (action === 'all_in') {
      this.postBet(seatIdx, player.chips);
      if (player.currentBet > this.currentBet) {
        this.currentBet = player.currentBet;
        this.actedSeats.clear();
        this.actedSeats.add(seatIdx);
      }
    }

    this.checkRoundProgression();
    return true;
  }

  fold(seatIdx) {
    const player = this.seats[seatIdx];
    if (player) {
      player.folded = true;
    }
  }

  checkRoundProgression() {
    const active = this.getActivePlayers();

    // 1. If only 1 player remains, they win immediately
    if (active.length === 1) {
      this.endHandSingleWinner(active[0]);
      return;
    }

    // 2. Check if all active non-all-in players have acted and bets are matched
    const playersNeedAction = active.filter(p => !p.isAllIn);
    const allMatched = playersNeedAction.every(p => p.currentBet === this.currentBet && this.actedSeats.has(p.seatIndex));

    if (allMatched || playersNeedAction.length === 0) {
      this.advanceStage();
    } else {
      // Advance turn to next active player
      this.turnSeat = this.findNextSeated(this.turnSeat);
      this.startTurnTimer();
      this.broadcastState();
    }
  }

  advanceStage() {
    // Reset round bets
    this.seats.forEach(s => {
      if (s) s.currentBet = 0;
    });
    this.currentBet = 0;
    this.actedSeats.clear();

    if (this.stage === 'preflop') {
      this.stage = 'flop';
      this.deck.pop(); // Burn card
      this.communityCards.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
    } else if (this.stage === 'flop') {
      this.stage = 'turn';
      this.deck.pop(); // Burn card
      this.communityCards.push(this.deck.pop());
    } else if (this.stage === 'turn') {
      this.stage = 'river';
      this.deck.pop(); // Burn card
      this.communityCards.push(this.deck.pop());
    } else if (this.stage === 'river') {
      this.stage = 'showdown';
      this.resolveShowdown();
      return;
    }

    this.turnSeat = this.findNextSeated(this.dealerSeat);
    this.startTurnTimer();
    this.broadcastState();
  }

  resolveShowdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const active = this.getActivePlayers();

    let bestScore = -1;
    let winners = [];

    active.forEach(player => {
      const evaluation = evaluate7Cards([...player.cards, ...this.communityCards]);
      player.handEvaluation = evaluation;
      if (evaluation.score > bestScore) {
        bestScore = evaluation.score;
        winners = [player];
      } else if (evaluation.score === bestScore) {
        winners.push(player);
      }
    });

    const share = Math.floor(this.pot / winners.length);
    winners.forEach(w => {
      w.chips += share;
    });

    const winnerNames = winners.map(w => w.name).join(', ');
    const handName = winners[0]?.handEvaluation?.name || 'Best Hand';

    this.handWinnerInfo = {
      winners: winners.map(w => ({ id: w.id, name: w.name, chipsWon: share, cards: w.cards, evaluation: w.handEvaluation })),
      description: `🏆 ${winnerNames} won ${this.pot} 🪙 with ${handName}!`
    };

    this.pot = 0;
    this.broadcastState();

    // Reset for next hand after celebration delay
    setTimeout(() => {
      this.startNewHand();
    }, 6000);
  }

  endHandSingleWinner(winner) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    winner.chips += this.pot;

    this.handWinnerInfo = {
      winners: [{ id: winner.id, name: winner.name, chipsWon: this.pot }],
      description: `🏆 ${winner.name} won ${this.pot} 🪙 (All opponents folded)!`
    };

    this.pot = 0;
    this.stage = 'showdown';
    this.broadcastState();

    setTimeout(() => {
      this.startNewHand();
    }, 4000);
  }

  resetTable() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.stage = 'waiting';
    this.communityCards = [];
    this.pot = 0;
    this.turnSeat = null;
    this.handWinnerInfo = null;
    this.broadcastState();
  }

  getPublicState() {
    return {
      stage: this.stage,
      pot: this.pot,
      currentBet: this.currentBet,
      dealerSeat: this.dealerSeat,
      turnSeat: this.turnSeat,
      turnSecondsLeft: this.turnSecondsLeft,
      communityCards: this.communityCards,
      handWinnerInfo: this.handWinnerInfo,
      seats: this.seats.map(s => {
        if (!s) return null;
        return {
          id: s.id,
          name: s.name,
          avatar: s.avatar,
          chips: s.chips,
          currentBet: s.currentBet,
          folded: s.folded,
          isAllIn: s.isAllIn,
          seatIndex: s.seatIndex,
          chairId: s.chairId,
          // In showdown, cards are shown; otherwise cards hidden for opponents
          cardsCount: s.cards ? s.cards.length : 0,
          cards: (this.stage === 'showdown' && !s.folded) ? s.cards : undefined,
          handName: s.handEvaluation?.name
        };
      })
    };
  }

  broadcastState() {
    const publicState = this.getPublicState();

    // Send personalized state to each socket so each player sees their private hole cards
    this.seats.forEach(s => {
      if (s && s.id) {
        const personalState = {
          ...publicState,
          mySeatIndex: s.seatIndex,
          myCards: s.cards,
          myHand: s.cards ? evaluate7Cards([...s.cards, ...this.communityCards]) : null
        };
        this.io.to(s.id).emit('poker_state', personalState);
      }
    });

    // Also emit public state to spectators in room
    this.io.emit('poker_public_sync', publicState);
  }
}

// Module export for node (CommonJS)
module.exports = { PokerEngine, evaluate7Cards };
