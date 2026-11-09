import * as THREE from 'three';
import { Building } from '../Building.js';

export class Pagoda extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: 'ပုဂံစေတီ (Bagan Stupa)',
      type: 'pagoda',
      hp: 1200,
      size: 5
    });

    this.createPagodaModel();
  }

  createPagodaModel() {
    const isEnemy = this.faction === 'enemy';
    const brickMat = new THREE.MeshStandardMaterial({
      color: isEnemy ? 0x34495e : 0x8a3814, // Rich ancient Bagan red terracotta brick
      roughness: 0.85
    });
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x6e6e6e,
      roughness: 0.9
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      metalness: 0.85,
      roughness: 0.22
    });
    const goldGleamMat = new THREE.MeshStandardMaterial({
      color: 0xffe600,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x785e00,
      emissiveIntensity: 0.2
    });

    this.modelGroup = new THREE.Group();

    // 1. Terraced Square Foundation (ပစ္စယာ ၃ ဆင့်)
    const terraces = [
      { w: 5.2, h: 0.55, y: 0.275 },
      { w: 4.4, h: 0.5, y: 0.8 },
      { w: 3.6, h: 0.45, y: 1.275 }
    ];

    terraces.forEach(t => {
      const geo = new THREE.BoxGeometry(t.w, t.h, t.w);
      const mesh = new THREE.Mesh(geo, brickMat);
      mesh.position.y = t.y;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.modelGroup.add(mesh);
    });

    // Four Cardinal Arch Portals (မုခ်ပေါက် ၄ မျက်နှာ)
    const portalGeo = new THREE.BoxGeometry(1.2, 0.9, 0.4);
    const portals = [
      { x: 0, z: 2.3, rot: 0 },
      { x: 0, z: -2.3, rot: 0 },
      { x: 2.3, z: 0, rot: Math.PI / 2 },
      { x: -2.3, z: 0, rot: Math.PI / 2 }
    ];

    portals.forEach(p => {
      const portal = new THREE.Mesh(portalGeo, brickMat);
      portal.position.set(p.x, 0.7, p.z);
      portal.rotation.y = p.rot;
      this.modelGroup.add(portal);

      // Gold Buddha Alcove inside portal
      const alcove = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.45, 6), goldMat);
      alcove.position.set(p.x, 0.7, p.z);
      this.modelGroup.add(alcove);
    });

    // Four Corner Stupas on 2nd Terrace (ထောင့်စေတီရံ ၄ ဆူ)
    const cornerOffset = 1.8;
    const cornerPositions = [
      [-cornerOffset, -cornerOffset],
      [cornerOffset, -cornerOffset],
      [-cornerOffset, cornerOffset],
      [cornerOffset, cornerOffset]
    ];

    cornerPositions.forEach(([cx, cz]) => {
      const cornerBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.6), brickMat);
      cornerBase.position.set(cx, 1.2, cz);
      this.modelGroup.add(cornerBase);

      const cornerStupa = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.85, 8), goldMat);
      cornerStupa.position.set(cx, 1.7, cz);
      this.modelGroup.add(cornerStupa);
    });

    // 2. Octagonal Medhi & Lotus Band (ရှစ်ထောင့် ကြာမှောက်ကြာလန် ခုံ)
    const octGeo = new THREE.CylinderGeometry(1.5, 1.7, 0.5, 8);
    const octMesh = new THREE.Mesh(octGeo, brickMat);
    octMesh.position.y = 1.75;
    this.modelGroup.add(octMesh);

    // 3. Golden Bell Dome (ခေါင်းလောင်းပုံတော်)
    const domeGeo = new THREE.CylinderGeometry(1.1, 1.5, 1.4, 16);
    const dome = new THREE.Mesh(domeGeo, goldMat);
    dome.position.y = 2.65;
    dome.castShadow = true;
    this.modelGroup.add(dome);

    // Tapered Upper Dome (သပိတ်မှောက်)
    const bowlGeo = new THREE.CylinderGeometry(0.7, 1.1, 0.6, 16);
    const bowl = new THREE.Mesh(bowlGeo, goldMat);
    bowl.position.y = 3.55;
    this.modelGroup.add(bowl);

    // 4. Concentric Spire Rings (ဖောင်းရစ် ၇ ဆင့်)
    const ringGeo = new THREE.ConeGeometry(0.65, 1.8, 12);
    const ringMesh = new THREE.Mesh(ringGeo, goldGleamMat);
    ringMesh.position.y = 4.65;
    this.modelGroup.add(ringMesh);

    // 5. Golden Royal Hti Umbrella (ထီးတော်မိုး)
    const htiGeo = new THREE.CylinderGeometry(0.42, 0.08, 0.22, 12);
    const hti = new THREE.Mesh(htiGeo, goldGleamMat);
    hti.position.y = 5.65;
    this.modelGroup.add(hti);

    // Diamond Orb Finial (စိန်ဖူးတော်)
    const orbGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const orb = new THREE.Mesh(orbGeo, new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff0aa,
      emissiveIntensity: 0.8
    }));
    orb.position.y = 5.85;
    this.modelGroup.add(orb);

    this.mesh.add(this.modelGroup);
  }
}
