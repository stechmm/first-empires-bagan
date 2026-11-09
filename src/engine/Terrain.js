import * as THREE from 'three';

export class Terrain {
  constructor(scene, size = 220) {
    this.scene = scene;
    this.size = size;
    this.obstacles = [];
    this.trees = [];
    this.balloons = [];
    this.animatedBoats = [];
    this.waterVertices = [];

    this.createProceduralGround();
    this.createAyeyarwadyRiver();
    this.createDistantMountains();
    this.createBaganTempleSkyline();
    this.createDiverseVegetation();
    this.createHistoricalProps();
    this.createHotAirBalloons();
    this.createRiverLife();
  }

  createProceduralGround() {
    // 1. High-Detail Canvas Texture for Bagan Soil, Pathways & Flora
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Base Bagan Red Clay Soil
    ctx.fillStyle = '#8e4413';
    ctx.fillRect(0, 0, 2048, 2048);

    // Micro-granules, soil noise, and pebble grains
    for (let i = 0; i < 75000; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 2048;
      const r = Math.random() * 2.8 + 0.8;
      const shade = Math.random() > 0.5 ? 'rgba(56, 26, 7, 0.3)' : 'rgba(195, 120, 48, 0.22)';
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lush green patches & savannah dry grass zones
    for (let i = 0; i < 55; i++) {
      const cx = Math.random() * 2048;
      const cy = Math.random() * 2048;
      const radius = 90 + Math.random() * 180;
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      grad.addColorStop(0, 'rgba(40, 110, 50, 0.45)'); // Lush vegetation
      grad.addColorStop(0.5, 'rgba(190, 140, 50, 0.28)'); // Golden savannah grass
      grad.addColorStop(1, 'rgba(142, 68, 19, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ancient Royal Brick & Stone Roadways
    const drawPavedRoad = (points, width = 36) => {
      ctx.strokeStyle = 'rgba(195, 110, 45, 0.55)';
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();

      // Inner cobblestone track
      ctx.strokeStyle = 'rgba(120, 55, 20, 0.4)';
      ctx.lineWidth = width * 0.5;
      ctx.stroke();
    };

    // Main arteries from Palace center (1024, 1024)
    drawPavedRoad([[1024, 1024], [780, 1040], [520, 980], [320, 1024]]); // To Western River Port
    drawPavedRoad([[1024, 1024], [1050, 780], [980, 520], [1024, 280]]);  // To Northern Temples
    drawPavedRoad([[1024, 1024], [980, 1280], [1050, 1580], [1024, 1820]]); // To Southern Encampment
    drawPavedRoad([[1024, 1024], [1300, 1000], [1600, 1050], [1850, 1024]]); // To Eastern Plain

    const terrainTexture = new THREE.CanvasTexture(canvas);
    terrainTexture.wrapS = THREE.ClampToEdgeWrapping;
    terrainTexture.wrapT = THREE.ClampToEdgeWrapping;

    // 2. 3D Elevation Mesh with Gentle Dunes and Low River Trench
    const groundGeo = new THREE.PlaneGeometry(this.size, this.size, 112, 112);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      // Undulating knolls
      let z = Math.sin(x * 0.035) * Math.cos(y * 0.035) * 1.4;
      z += Math.sin(x * 0.07 + y * 0.05) * 0.7;

      // Lower riverbed trench on the West (x < -60)
      if (x < -this.size / 2 + 50) {
        const depth = THREE.MathUtils.clamp((-this.size / 2 + 50 - x) * 0.08, 0, 1.6);
        z -= depth;
      }

      // Flat building zone around central palace
      const distFromCenter = Math.hypot(x, y);
      if (distFromCenter < 35) {
        z *= distFromCenter / 35;
      }

      pos.setZ(i, z);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.86,
      metalness: 0.05
    });

    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Tactical Golden Grid
    const grid = new THREE.GridHelper(this.size, 44, 0xb7950b, 0x4a2a10);
    grid.position.y = 0.06;
    grid.material.opacity = 0.28;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  createAyeyarwadyRiver() {
    // Flowing River Surface on the West
    const riverGeo = new THREE.PlaneGeometry(42, this.size, 32, 64);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x1b4f72, // Deep ancient river blue
      roughness: 0.12,
      metalness: 0.8,
      transparent: true,
      opacity: 0.92,
      flatShading: true
    });

    this.riverMesh = new THREE.Mesh(riverGeo, this.waterMat);
    this.riverMesh.rotation.x = -Math.PI / 2;
    this.riverMesh.position.set(-this.size / 2 + 25, -0.15, 0);
    this.scene.add(this.riverMesh);

    // Golden Sandbar Shoreline
    const sandGeo = new THREE.PlaneGeometry(14, this.size);
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.95 });
    const sandBank = new THREE.Mesh(sandGeo, sandMat);
    sandBank.rotation.x = -Math.PI / 2;
    sandBank.position.set(-this.size / 2 + 46, -0.1, 0);
    this.scene.add(sandBank);

    // River Pier / Wooden Boat Dock (လှေဆိပ်)
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2311, roughness: 0.8 });
    const pier = new THREE.Group();
    pier.position.set(-this.size / 2 + 42, 0, 10);

    const deckGeo = new THREE.BoxGeometry(10, 0.25, 3.2);
    const deck = new THREE.Mesh(deckGeo, woodMat);
    deck.position.y = 0.4;
    pier.add(deck);

    // Dock pilings
    [-4, 0, 4].forEach(px => {
      [-1.4, 1.4].forEach(pz => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 6), woodMat);
        post.position.set(px, -0.2, pz);
        pier.add(post);
      });
    });
    this.scene.add(pier);
  }

  createDistantMountains() {
    // Majestic Mount Popa & Tangyi Mountain Ridge Backdrop on North/East Horizon
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x5d6d7e, // Atmospheric misty blue-grey
      roughness: 0.95,
      flatShading: true
    });
    const mountainGreenMat = new THREE.MeshStandardMaterial({
      color: 0x273746,
      roughness: 0.9,
      flatShading: true
    });

    const peaks = [
      { x: -70, z: -140, r: 28, h: 45, mat: mountainMat },
      { x: 0, z: -155, r: 38, h: 62, mat: mountainGreenMat }, // Mount Popa central volcanic peak
      { x: 75, z: -145, r: 32, h: 50, mat: mountainMat },
      { x: 135, z: -120, r: 30, h: 42, mat: mountainMat },
      { x: 145, z: -40, r: 26, h: 38, mat: mountainGreenMat },
      { x: 150, z: 45, r: 28, h: 40, mat: mountainMat }
    ];

    peaks.forEach(p => {
      const peakGeo = new THREE.ConeGeometry(p.r, p.h, 7);
      const peak = new THREE.Mesh(peakGeo, p.mat);
      peak.position.set(p.x, p.h / 2 - 2, p.z);
      peak.rotation.y = Math.random() * Math.PI;
      this.scene.add(peak);
    });
  }

  createBaganTempleSkyline() {
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x935116, roughness: 0.88 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.75, roughness: 0.3 });
    const whiteStuccoMat = new THREE.MeshStandardMaterial({ color: 0xe5e7e9, roughness: 0.65 });

    const templeLocations = [
      { x: -10, z: -75, type: 'gilded', scale: 1.8 },
      { x: 65, z: -60, type: 'monumental', scale: 2.2 },
      { x: -55, z: 65, type: 'monumental', scale: 1.6 },
      { x: 55, z: 60, type: 'gilded', scale: 2.0 },
      { x: 75, z: -10, type: 'gilded', scale: 1.7 },
      { x: -25, z: 80, type: 'ancient_ruin', scale: 1.4 },
      { x: 80, z: 40, type: 'ancient_ruin', scale: 1.5 }
    ];

    templeLocations.forEach(loc => {
      const temple = new THREE.Group();

      if (loc.type === 'gilded') {
        // Shwezigon style golden stupa
        const baseGeo = new THREE.BoxGeometry(6, 1.2, 6);
        const base = new THREE.Mesh(baseGeo, brickMat);
        base.position.y = 0.6;
        temple.add(base);

        const bellGeo = new THREE.CylinderGeometry(1.2, 2.4, 3.2, 16);
        const bell = new THREE.Mesh(bellGeo, goldMat);
        bell.position.y = 2.6;
        temple.add(bell);

        const spireGeo = new THREE.ConeGeometry(0.4, 3.6, 12);
        const spire = new THREE.Mesh(spireGeo, goldMat);
        spire.position.y = 5.8;
        temple.add(spire);
      } else if (loc.type === 'monumental') {
        // Ananda / Dhammayangyi temple with grand terraces and portals
        const terrace1Geo = new THREE.BoxGeometry(8, 2.2, 8);
        const t1 = new THREE.Mesh(terrace1Geo, loc.x > 0 ? whiteStuccoMat : brickMat);
        t1.position.y = 1.1;
        temple.add(t1);

        const terrace2Geo = new THREE.BoxGeometry(5.5, 1.8, 5.5);
        const t2 = new THREE.Mesh(terrace2Geo, brickMat);
        t2.position.y = 3.0;
        temple.add(t2);

        const sikharaGeo = new THREE.ConeGeometry(1.8, 4.5, 8);
        const sikhara = new THREE.Mesh(sikharaGeo, goldMat);
        sikhara.position.y = 5.8;
        temple.add(sikhara);
      } else {
        // Ancient atmospheric brick ruin
        const ruinGeo = new THREE.BoxGeometry(5, 3.5, 5);
        const ruin = new THREE.Mesh(ruinGeo, brickMat);
        ruin.position.y = 1.75;
        temple.add(ruin);

        const crownGeo = new THREE.CylinderGeometry(0.8, 1.8, 2.0, 8);
        const crown = new THREE.Mesh(crownGeo, brickMat);
        crown.position.y = 4.2;
        temple.add(crown);
      }

      temple.scale.setScalar(loc.scale);
      temple.position.set(loc.x, 0, loc.z);
      this.scene.add(temple);
    });
  }

  createDiverseVegetation() {
    const palmMat = new THREE.MeshStandardMaterial({ color: 0x4a2306, roughness: 0.9 });
    const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x196f3d, roughness: 0.65 });
    const banyanTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.85 });
    const banyanLeafMat = new THREE.MeshStandardMaterial({ color: 0x145a32, roughness: 0.7 });
    const potMat = new THREE.MeshStandardMaterial({ color: 0x78281f });

    // 1. Authentic Palmyra Palm Groves (Outside central base sanctuary)
    const palmCount = 55;
    for (let i = 0; i < palmCount; i++) {
      const x = (Math.random() - 0.5) * (this.size - 40);
      const z = (Math.random() - 0.5) * (this.size - 40);

      // Keep riverbank edge and wide central base clearing (radius 38m) pristine and uncluttered
      if (x < -this.size / 2 + 52 || (Math.hypot(x, z) < 38)) continue;

      const palm = new THREE.Group();
      const height = 5.5 + Math.random() * 3.5;

      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.35, height, 8);
      const trunk = new THREE.Mesh(trunkGeo, palmMat);
      trunk.position.y = height / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.1;
      trunk.castShadow = true;
      palm.add(trunk);

      // Toddy pot
      if (Math.random() > 0.4) {
        const pot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), potMat);
        pot.position.set(0.25, height - 0.8, 0);
        palm.add(pot);
      }

      // Fan Fronds
      for (let j = 0; j < 8; j++) {
        const leafGeo = new THREE.ConeGeometry(1.6, 0.8, 4);
        const leaf = new THREE.Mesh(leafGeo, palmLeafMat);
        const angle = (j / 8) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.9, height + 0.3, Math.sin(angle) * 0.9);
        leaf.rotation.x = Math.PI / 3;
        leaf.rotation.y = angle;
        leaf.castShadow = true;
        palm.add(leaf);
      }

      palm.position.set(x, 0, z);
      this.scene.add(palm);
      this.trees.push(palm);
    }

    // 2. Ancient Sacred Banyan Trees with Sprawling Aerial Roots
    const banyanCount = 12;
    for (let i = 0; i < banyanCount; i++) {
      const angle = (i / banyanCount) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 38 + Math.random() * 48;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (x < -this.size / 2 + 50) continue;

      const banyan = new THREE.Group();

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.5, 4.2, 8), banyanTrunkMat);
      trunk.position.y = 2.1;
      trunk.castShadow = true;
      banyan.add(trunk);

      // Aerial Prop Roots (ညောင်စို့များ)
      for (let r = 0; r < 4; r++) {
        const rAngle = (r / 4) * Math.PI * 2;
        const propRoot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.8, 6), banyanTrunkMat);
        propRoot.position.set(Math.cos(rAngle) * 1.8, 1.9, Math.sin(rAngle) * 1.8);
        banyan.add(propRoot);
      }

      // Leafy Canopy
      const canopyPositions = [
        [0, 5.2, 0, 3.4],
        [-1.8, 4.6, 1.2, 2.4],
        [1.8, 4.4, -1.0, 2.5],
        [0.8, 4.8, 1.6, 2.2]
      ];

      canopyPositions.forEach(([cx, cy, cz, radius]) => {
        const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 1), banyanLeafMat);
        canopy.position.set(cx, cy, cz);
        canopy.castShadow = true;
        banyan.add(canopy);
      });

      banyan.position.set(x, 0, z);
      this.scene.add(banyan);
      this.trees.push(banyan);
    }
  }

  createHistoricalProps() {
    // 1. Guardian Chinthe Statues (ပုဂံ မုခ်ဝ ခြင်္သေ့ကြီးများ) at the main avenue
    const stoneWhiteMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.6, roughness: 0.3 });

    const makeChinthe = (x, z, rotY) => {
      const chinthe = new THREE.Group();
      chinthe.position.set(x, 0, z);
      chinthe.rotation.y = rotY;

      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.6), stoneWhiteMat);
      base.position.y = 0.25;
      chinthe.add(base);

      // Lion Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 1.2), stoneWhiteMat);
      body.position.set(0, 1.0, -0.1);
      chinthe.add(body);

      // Lion Head with Golden Crown
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), stoneWhiteMat);
      head.position.set(0, 1.8, 0.35);
      chinthe.add(head);

      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 6), goldMat);
      crown.position.set(0, 2.4, 0.35);
      chinthe.add(crown);

      this.scene.add(chinthe);
    };

    // Flank the grand avenue
    makeChinthe(12, 14, Math.PI);
    makeChinthe(-12, 14, Math.PI);

    // 2. Traditional Wooden Ox-Cart (ပုဂံ နွားလှည်း)
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7 });

    const cart = new THREE.Group();
    cart.position.set(22, 0.6, -18);
    cart.rotation.y = 0.6;

    // Cart Bed
    const cartBed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 2.6), woodMat);
    cart.add(cartBed);

    // High Spoked Wheels
    [-0.95, 0.95].forEach(wx => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.12, 12), wheelMat);
      wheel.position.set(wx, 0, 0);
      wheel.rotation.z = Math.PI / 2;
      cart.add(wheel);
    });

    // Clay Pots in Cart
    const potMat = new THREE.MeshStandardMaterial({ color: 0x873600 });
    for (let i = 0; i < 3; i++) {
      const pot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 6), potMat);
      pot.position.set((i - 1) * 0.45, 0.35, 0.2);
      cart.add(pot);
    }
    this.scene.add(cart);
  }

  createHotAirBalloons() {
    const balloonColors = [0x922b21, 0xd4ac0d, 0x196f3d, 0x2874a6];

    for (let i = 0; i < 4; i++) {
      const balloon = new THREE.Group();
      const color = balloonColors[i % balloonColors.length];
      const balloonMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });

      const topGeo = new THREE.SphereGeometry(3.2, 16, 16);
      const topMesh = new THREE.Mesh(topGeo, balloonMat);
      topMesh.position.y = 3.2;
      balloon.add(topMesh);

      const bottomGeo = new THREE.ConeGeometry(3.0, 3.2, 16);
      const bottomMesh = new THREE.Mesh(bottomGeo, balloonMat);
      bottomMesh.position.y = 1.0;
      bottomMesh.rotation.x = Math.PI;
      balloon.add(bottomMesh);

      const basket = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
      basket.position.y = -1.2;
      balloon.add(basket);

      const startX = -30 + i * 28;
      const startY = 40 + (i % 2) * 12;
      const startZ = -70 - i * 14;
      balloon.position.set(startX, startY, startZ);

      balloon.userData = { baseY: startY, baseX: startX, phase: i * 1.5, speed: 0.15 + i * 0.05 };
      this.scene.add(balloon);
      this.balloons.push(balloon);
    }
  }

  createRiverLife() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2306, roughness: 0.8 });
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xfdfefe, roughness: 0.6 });

    const boatSpots = [
      { x: -this.size / 2 + 40, z: -15, rot: 0.4 },
      { x: -this.size / 2 + 38, z: 25, rot: -0.3 }
    ];

    boatSpots.forEach((spot, idx) => {
      const boat = new THREE.Group();

      const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 4.0), woodMat);
      hull.position.y = 0.2;
      boat.add(hull);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), woodMat);
      mast.position.set(0, 1.6, 0);
      boat.add(mast);

      const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), sailMat);
      sail.position.set(0, 1.8, 0.6);
      sail.rotation.y = Math.PI / 4;
      boat.add(sail);

      boat.position.set(spot.x, 0.1, spot.z);
      boat.rotation.y = spot.rot;
      this.scene.add(boat);

      boat.userData = { baseZ: spot.z, phase: idx * 2 };
      this.animatedBoats.push(boat);
    });
  }

  update(delta, time) {
    const elapsed = (time !== undefined && !isNaN(time)) ? time : (performance.now() * 0.001);

    // 1. Hot air balloons drifting
    for (const b of this.balloons) {
      if (!b.userData) continue;
      const baseY = b.userData.baseY || 35;
      const baseX = b.userData.baseX || 0;
      const phase = b.userData.phase || 0;
      b.position.y = baseY + Math.sin(elapsed * 0.8 + phase) * 1.5;
      b.position.x = baseX + Math.cos(elapsed * 0.3 + phase) * 3.0;
    }

    // 2. River boats rocking
    for (const boat of this.animatedBoats) {
      if (!boat.userData) continue;
      const phase = boat.userData.phase || 0;
      boat.rotation.z = Math.sin(elapsed * 2.0 + phase) * 0.06;
      boat.position.y = 0.1 + Math.sin(elapsed * 2.5 + phase) * 0.04;
    }

    // 3. Dynamic river water shimmer
    if (this.waterMat) {
      this.waterMat.roughness = 0.12 + Math.sin(elapsed * 1.5) * 0.04;
    }
  }
}
