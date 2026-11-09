import * as THREE from 'three';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Isometric RTS angle configuration
    this.pitch = 50 * (Math.PI / 180);
    this.yaw = 45 * (Math.PI / 180);
    this.zoom = 35;
    this.minZoom = 12;
    this.maxZoom = 70;

    this.target = new THREE.Vector3(0, 0, 0);
    this.panSpeed = 0.5;
    this.keyState = {};

    // Touch gesture state
    this.touchPointers = [];
    this.initialPinchDist = 0;
    this.initialZoom = this.zoom;
    this.lastTouchPos = { x: 0, y: 0 };

    this.setupListeners();
    this.updateCameraPosition();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keyState[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keyState[e.code] = false;
    });

    // Mouse Wheel Zoom
    this.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.04;
      this.zoom = THREE.MathUtils.clamp(this.zoom + zoomDelta, this.minZoom, this.maxZoom);
      this.updateCameraPosition();
    }, { passive: false });

    // Touch Handlers for Android & Mobile
    this.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // 2-finger touch for camera pan and pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDist = Math.hypot(dx, dy);
        this.initialZoom = this.zoom;
        this.lastTouchPos = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
      }
    }, { passive: true });

    this.domElement.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        // Pinch to zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (this.initialPinchDist > 0) {
          const ratio = this.initialPinchDist / dist;
          this.zoom = THREE.MathUtils.clamp(this.initialZoom * ratio, this.minZoom, this.maxZoom);
        }

        // Two-finger pan
        const currentMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const currentMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const deltaX = (currentMidX - this.lastTouchPos.x) * 0.08;
        const deltaY = (currentMidY - this.lastTouchPos.y) * 0.08;

        this.target.x -= (deltaX - deltaY) * 0.7;
        this.target.z -= (deltaX + deltaY) * 0.7;

        this.lastTouchPos = { x: currentMidX, y: currentMidY };
        this.updateCameraPosition();
      }
    }, { passive: false });
  }

  update(delta) {
    let moveX = 0;
    let moveZ = 0;

    if (this.keyState['KeyW'] || this.keyState['ArrowUp']) {
      moveX -= 1;
      moveZ -= 1;
    }
    if (this.keyState['KeyS'] || this.keyState['ArrowDown']) {
      moveX += 1;
      moveZ += 1;
    }
    if (this.keyState['KeyA'] || this.keyState['ArrowLeft']) {
      moveX -= 1;
      moveZ += 1;
    }
    if (this.keyState['KeyD'] || this.keyState['ArrowRight']) {
      moveX += 1;
      moveZ -= 1;
    }

    if (moveX !== 0 || moveZ !== 0) {
      const speed = this.panSpeed * (this.zoom / 25) * (delta * 60);
      this.target.x += moveX * speed;
      this.target.z += moveZ * speed;

      // Clamp camera bounds to terrain
      this.target.x = THREE.MathUtils.clamp(this.target.x, -80, 80);
      this.target.z = THREE.MathUtils.clamp(this.target.z, -80, 80);

      this.updateCameraPosition();
    }
  }

  updateCameraPosition() {
    const camOffset = new THREE.Vector3(
      this.zoom * Math.cos(this.yaw) * Math.cos(this.pitch),
      this.zoom * Math.sin(this.pitch),
      this.zoom * Math.sin(this.yaw) * Math.cos(this.pitch)
    );

    this.camera.position.copy(this.target).add(camOffset);
    this.camera.lookAt(this.target);
  }
}
