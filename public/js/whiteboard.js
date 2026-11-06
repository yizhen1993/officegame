/**
 * ============================================================================
 * Gather.town v2 Virtual Office — Collaborative Whiteboard Module
 * Real-time HTML5 Canvas drawing synchronized with all players in the room
 * ============================================================================
 */

export class WhiteboardManager {
  constructor(canvasElement, network) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.network = network;

    this.isDrawing = false;
    this.currentTool = 'pen'; // 'pen' | 'highlighter' | 'eraser'
    this.currentColor = '#1E1B4B';
    this.currentWidth = 4;
    this.currentStroke = null;

    this.setupEvents();
  }

  setupEvents() {
    const c = this.canvas;

    const getPos = (e) => {
      const rect = c.getBoundingClientRect();
      const scaleX = c.width / rect.width;
      const scaleY = c.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    c.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      const pt = getPos(e);
      this.currentStroke = {
        type: 'path',
        color: this.currentTool === 'eraser' ? '#FFFFFF' : this.currentColor,
        width: this.currentTool === 'highlighter' ? 16 : this.currentWidth,
        isEraser: this.currentTool === 'eraser',
        isHighlighter: this.currentTool === 'highlighter',
        points: [pt]
      };
      this.drawPoint(pt, this.currentStroke);
    });

    c.addEventListener('mousemove', (e) => {
      if (!this.isDrawing || !this.currentStroke) return;
      const pt = getPos(e);
      this.currentStroke.points.push(pt);
      this.drawLineSegment(
        this.currentStroke.points[this.currentStroke.points.length - 2],
        pt,
        this.currentStroke
      );
    });

    const stopDrawing = () => {
      if (!this.isDrawing || !this.currentStroke) return;
      this.isDrawing = false;
      // Send completed stroke to server
      if (this.network && this.currentStroke.points.length > 0) {
        this.network.sendWhiteboardStroke(this.currentStroke);
      }
      this.currentStroke = null;
    };

    c.addEventListener('mouseup', stopDrawing);
    c.addEventListener('mouseleave', stopDrawing);

    // Touch support for mobile / tablets
    c.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = c.getBoundingClientRect();
        const scaleX = c.width / rect.width;
        const scaleY = c.height / rect.height;
        const pt = {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY
        };
        this.isDrawing = true;
        this.currentStroke = {
          type: 'path',
          color: this.currentTool === 'eraser' ? '#FFFFFF' : this.currentColor,
          width: this.currentTool === 'highlighter' ? 16 : this.currentWidth,
          isEraser: this.currentTool === 'eraser',
          isHighlighter: this.currentTool === 'highlighter',
          points: [pt]
        };
        this.drawPoint(pt, this.currentStroke);
      }
    });

    c.addEventListener('touchmove', (e) => {
      if (!this.isDrawing || !this.currentStroke || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = c.getBoundingClientRect();
      const scaleX = c.width / rect.width;
      const scaleY = c.height / rect.height;
      const pt = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
      this.currentStroke.points.push(pt);
      this.drawLineSegment(
        this.currentStroke.points[this.currentStroke.points.length - 2],
        pt,
        this.currentStroke
      );
    });

    c.addEventListener('touchend', stopDrawing);
  }

  drawPoint(pt, stroke) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    if (stroke.isHighlighter) {
      ctx.globalAlpha = 0.35;
    }
    ctx.fill();
    ctx.restore();
  }

  drawLineSegment(p1, p2, stroke) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.isHighlighter) {
      ctx.globalAlpha = 0.35;
    }
    ctx.stroke();
    ctx.restore();
  }

  renderStroke(stroke) {
    if (!stroke || !stroke.points || stroke.points.length === 0) return;
    if (stroke.type === 'text') {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `bold ${stroke.size || 16}px Nunito, sans-serif`;
      ctx.fillStyle = stroke.color || '#1E1B4B';
      ctx.fillText(stroke.text, stroke.x, stroke.y);
      ctx.restore();
      return;
    }

    if (stroke.points.length === 1) {
      this.drawPoint(stroke.points[0], stroke);
      return;
    }

    for (let i = 1; i < stroke.points.length; i++) {
      this.drawLineSegment(stroke.points[i - 1], stroke.points[i], stroke);
    }
  }

  loadInitialStrokes(strokes) {
    this.clearCanvasLocally();
    if (Array.isArray(strokes)) {
      strokes.forEach(s => this.renderStroke(s));
    }
  }

  clearCanvasLocally() {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setWidth(w) {
    this.currentWidth = Number(w);
  }

  downloadImage() {
    const link = document.createElement('a');
    link.download = `gather-whiteboard-${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}
