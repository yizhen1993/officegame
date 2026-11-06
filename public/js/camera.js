/**
 * ============================================================================
 * 2D Game Camera Script — JavaScript / Phaser 3
 * ============================================================================
 * 
 * Features:
 * 1. Zooms in and centers smoothly on the player target.
 * 2. Uses a mathematical 'clamp' function on the map edges so the visible camera
 *    viewport NEVER moves past the corners of the fixed map at any zoom level.
 * 3. Dynamic zoom controls (mouse wheel, touch pinch, keyboard shortcuts)
 *    with automatic re-clamping.
 * 4. Smooth lerp camera movement.
 * ============================================================================
 */

export class Clamped2DCamera {
  /**
   * @param {Phaser.Cameras.Scene2D.Camera} camera - Phaser 3 Main Camera instance
   * @param {Object} config - Configuration options
   * @param {number} config.mapWidth - Total width of the map in pixels (e.g. 1600)
   * @param {number} config.mapHeight - Total height of the map in pixels (e.g. 1216)
   * @param {number} [config.defaultZoom=2.0] - Initial zoom level (e.g. 2.0x zoomed in)
   * @param {number} [config.minZoom=1.0] - Minimum zoom level (1.0x fits entire map)
   * @param {number} [config.maxZoom=2.5] - Maximum zoom level
   * @param {number} [config.lerpSpeed=0.08] - Smooth follow interpolation factor (0 to 1)
   */
  constructor(camera, config = {}) {
    this.camera = camera;
    this.mapWidth = config.mapWidth || 1600;
    this.mapHeight = config.mapHeight || 1216;
    this.minZoom = config.minZoom !== undefined ? config.minZoom : 1.0;
    this.maxZoom = config.maxZoom !== undefined ? config.maxZoom : 2.5;
    this.lerpSpeed = config.lerpSpeed !== undefined ? config.lerpSpeed : 0.08;
    this.zoom = config.defaultZoom !== undefined ? config.defaultZoom : 2.0;

    this.target = null;
    this.currentX = this.mapWidth / 2;
    this.currentY = this.mapHeight / 2;

    // Initialize camera zoom and disable Phaser's built-in bounds/follow
    // to avoid Phaser's known zoom-bounding bugs.
    this.camera.stopFollow();
    this.camera.useBounds = false;
    this.setZoom(this.zoom);
  }

  /**
   * Mathematical clamp function: ensures value is constrained between min and max.
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  static clamp(value, min, max) {
    if (min >= max) return (min + max) / 2;
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Calculate the clamped camera center (x, y) so that the visible viewport
   * NEVER extends past the fixed map boundaries [0, 0, mapWidth, mapHeight].
   *
   * Formula:
   *   visibleWidth  = camera.width  / zoom
   *   visibleHeight = camera.height / zoom
   *   halfW = visibleWidth  / 2
   *   halfH = visibleHeight / 2
   *
   * Clamped Camera Center:
   *   clampedX = clamp(target.x, halfW, mapWidth  - halfW)
   *   clampedY = clamp(target.y, halfH, mapHeight - halfH)
   *
   * @param {number} targetX
   * @param {number} targetY
   * @param {number} zoomLevel
   * @returns {{x: number, y: number}}
   */
  getClampedCenter(targetX, targetY, zoomLevel = this.zoom) {
    const visibleWidth = this.camera.width / zoomLevel;
    const visibleHeight = this.camera.height / zoomLevel;

    const halfW = visibleWidth / 2;
    const halfH = visibleHeight / 2;

    // Minimum and maximum valid center coordinates
    const minCenterX = halfW;
    const maxCenterX = this.mapWidth - halfW;
    const minCenterY = halfH;
    const maxCenterY = this.mapHeight - halfH;

    let clampedX;
    if (minCenterX >= maxCenterX) {
      clampedX = this.mapWidth / 2;
    } else {
      clampedX = Clamped2DCamera.clamp(targetX, minCenterX, maxCenterX);
    }

    let clampedY;
    if (minCenterY >= maxCenterY) {
      clampedY = this.mapHeight / 2;
    } else {
      clampedY = Clamped2DCamera.clamp(targetY, minCenterY, maxCenterY);
    }

    return { x: clampedX, y: clampedY };
  }

  /**
   * Set target GameObject (e.g. localPlayer) to follow.
   * @param {Phaser.GameObjects.GameObject} target
   */
  setTarget(target) {
    this.target = target;
    if (this.target) {
      this.snapToTarget();
    }
  }

  /**
   * Snap camera directly to target without lerping (e.g. on spawn or teleport).
   */
  snapToTarget() {
    if (!this.target) return;
    const { x, y } = this.getClampedCenter(this.target.x, this.target.y, this.zoom);
    this.currentX = x;
    this.currentY = y;
    this.camera.centerOn(x, y);
  }

  /**
   * Adjust camera zoom with strict bounds and immediate re-clamping.
   * @param {number} targetZoom
   */
  setZoom(targetZoom) {
    const roundedZoom = Math.round(targetZoom * 10) / 10;
    this.zoom = Clamped2DCamera.clamp(roundedZoom, this.minZoom, this.maxZoom);
    this.camera.setZoom(this.zoom);

    // Re-clamp position immediately at the new zoom scale
    if (this.target) {
      const targetPos = this.getClampedCenter(this.target.x, this.target.y, this.zoom);
      this.currentX = targetPos.x;
      this.currentY = targetPos.y;
      this.camera.centerOn(this.currentX, this.currentY);
    } else {
      const centerPos = this.getClampedCenter(this.currentX, this.currentY, this.zoom);
      this.currentX = centerPos.x;
      this.currentY = centerPos.y;
      this.camera.centerOn(this.currentX, this.currentY);
    }
  }

  getZoom() {
    return this.zoom;
  }

  /**
   * Per-frame update called inside scene.update(time, delta).
   * Smoothly lerps towards the target and clamps to map edges.
   */
  update() {
    if (!this.target) return;

    // 1. Calculate desired clamped center for target
    const targetPos = this.getClampedCenter(this.target.x, this.target.y, this.zoom);

    // 2. Smoothly interpolate (lerp) towards clamped position
    this.currentX += (targetPos.x - this.currentX) * this.lerpSpeed;
    this.currentY += (targetPos.y - this.currentY) * this.lerpSpeed;

    // 3. Final safety clamp to eliminate any floating-point overflow
    const safePos = this.getClampedCenter(this.currentX, this.currentY, this.zoom);
    this.currentX = safePos.x;
    this.currentY = safePos.y;

    // 4. Center camera viewport on clamped coordinates
    this.camera.centerOn(this.currentX, this.currentY);
  }
}
