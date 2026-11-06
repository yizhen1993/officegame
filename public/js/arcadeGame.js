/**
 * ============================================================================
 * Gather.town v2 Virtual Office — Playable Retro Arcade (Snake Classic)
 * Self-contained retro mini-game playable inside the Arcade Cabinet modal
 * ============================================================================
 */

export class RetroArcadeGame {
  constructor(canvasElement, onScoreSubmit) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.onScoreSubmit = onScoreSubmit;

    this.gridSize = 18;
    this.tileCount = 20; // 360 / 18 = 20
    this.snake = [];
    this.food = { x: 10, y: 10 };
    this.dx = 1;
    this.dy = 0;
    this.score = 0;
    this.highScore = 0;
    this.gameLoop = null;
    this.isRunning = false;
    this.isGameOver = false;

    this.setupControls();
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.dy === 0) { this.dx = 0; this.dy = -1; e.preventDefault(); }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.dy === 0) { this.dx = 0; this.dy = 1; e.preventDefault(); }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.dx === 0) { this.dx = -1; this.dy = 0; e.preventDefault(); }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.dx === 0) { this.dx = 1; this.dy = 0; e.preventDefault(); }
          break;
      }
    });
  }

  start() {
    this.snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 }
    ];
    this.dx = 1;
    this.dy = 0;
    this.score = 0;
    this.isGameOver = false;
    this.isRunning = true;
    this.spawnFood();

    if (this.gameLoop) clearInterval(this.gameLoop);
    this.gameLoop = setInterval(() => this.tick(), 110);
  }

  stop() {
    this.isRunning = false;
    if (this.gameLoop) clearInterval(this.gameLoop);
  }

  spawnFood() {
    this.food = {
      x: Math.floor(Math.random() * this.tileCount),
      y: Math.floor(Math.random() * this.tileCount)
    };
  }

  tick() {
    if (!this.isRunning) return;

    // Next head position
    const head = {
      x: this.snake[0].x + this.dx,
      y: this.snake[0].y + this.dy
    };

    // Collision with walls
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver();
      return;
    }

    // Collision with self
    for (let i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
        this.gameOver();
        return;
      }
    }

    this.snake.unshift(head);

    // Eat food
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      if (this.score > this.highScore) this.highScore = this.score;
      this.spawnFood();
    } else {
      this.snake.pop();
    }

    this.render();
  }

  gameOver() {
    this.isRunning = false;
    this.isGameOver = true;
    if (this.gameLoop) clearInterval(this.gameLoop);
    this.render();

    if (this.onScoreSubmit && this.score > 0) {
      this.onScoreSubmit(this.score);
    }
  }

  render() {
    const ctx = this.ctx;
    const sz = this.gridSize;

    // Retro Arcade CRT background
    ctx.fillStyle = '#064E3B'; // Dark CRT green
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid lines
    ctx.strokeStyle = '#065F46';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < this.canvas.width; x += sz) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += sz) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); ctx.stroke();
    }

    // Food (Retro Red Apple with pixel stem)
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(this.food.x * sz + 2, this.food.y * sz + 2, sz - 4, sz - 4);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(this.food.x * sz + sz / 2, this.food.y * sz, 2, 2);

    // Snake Body
    this.snake.forEach((seg, index) => {
      ctx.fillStyle = index === 0 ? '#34D399' : '#059669'; // Head brighter green
      ctx.fillRect(seg.x * sz + 1, seg.y * sz + 1, sz - 2, sz - 2);

      // Snake eyes on head
      if (index === 0) {
        ctx.fillStyle = '#064E3B';
        ctx.fillRect(seg.x * sz + 4, seg.y * sz + 4, 3, 3);
        ctx.fillRect(seg.x * sz + 11, seg.y * sz + 4, 3, 3);
      }
    });

    // Score HUD
    ctx.fillStyle = '#A7F3D0';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`SCORE: ${this.score}`, 10, 20);
    ctx.fillText(`BEST: ${this.highScore}`, 280, 20);

    // Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, 160);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px monospace';
      ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, 195);
      ctx.fillText('Click [Start Game] to Retry', this.canvas.width / 2, 225);
      ctx.textAlign = 'left';
    }
  }
}
