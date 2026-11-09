import * as THREE from 'three';
import { Building } from '../Building.js';

export class Palace extends Building {
  constructor(game, options = {}) {
    super(game, {
      ...options,
      name: options.name || 'ရွှေနန်းတော် (Royal Palace)',
      type: 'palace',
      hp: options.hp || 1500,
      size: 6
    });

    this.createPalace3DModel();
  }

  createPalace3DModel() {
    // PBR Materials based on authentic Bagan architecture
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.85 });
    const stoneDarkMat = new THREE.MeshStandardMaterial({ color: 0x566573, roughness: 0.9 });
    const brickMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x2c3e50 : 0x873600, // Ancient Red Brick
      roughness: 0.8
    });
    const teakMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x1c2833 : 0x3e1f0e, // Dark Royal Teak
      roughness: 0.7
    });
    const roofRedMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x4a235a : 0x78281f, // Bagan Terracotta Tile
      roughness: 0.55
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0xc0392b : 0xf1c40f, // Royal Gold
      metalness: 0.7,
      roughness: 0.3
    });
    const doorMat = new THREE.MeshStandardMaterial({
      color: this.faction === 'enemy' ? 0x922b21 : 0xd35400,
      metalness: 0.5,
      roughness: 0.4
    });

    this.modelGroup = new THREE.Group();

    // -------------------------------------------------------------
    // 1. FOUNDATION & PLINTH (အုတ်ခုံအောက်ခံ နှင့် ကျောက်စင်္ကြံ)
    // -------------------------------------------------------------
    // Bottom stone apron
    const apronGeo = new THREE.BoxGeometry(6.6, 0.25, 5.8);
    const apron = new THREE.Mesh(apronGeo, stoneDarkMat);
    apron.position.y = 0.125;
    apron.receiveShadow = true;
    this.modelGroup.add(apron);

    // Main red brick terrace wall
    const terraceGeo = new THREE.BoxGeometry(6.2, 0.75, 5.4);
    const terrace = new THREE.Mesh(terraceGeo, brickMat);
    terrace.position.y = 0.625;
    terrace.receiveShadow = true;
    terrace.castShadow = true;
    this.modelGroup.add(terrace);

    // Stone top pavement / veranda floor
    const floorGeo = new THREE.BoxGeometry(6.4, 0.15, 5.6);
    const floor = new THREE.Mesh(floorGeo, stoneMat);
    floor.position.y = 1.075;
    floor.receiveShadow = true;
    this.modelGroup.add(floor);

    // -------------------------------------------------------------
    // 2. GRAND FRONT STAIRS (ပင်မ လှေကားတော်)
    // -------------------------------------------------------------
    const stepCount = 5;
    const stepWidth = 1.8;
    const stepDepth = 0.3;
    const stepHeight = 0.18;
    for (let i = 0; i < stepCount; i++) {
      const stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth * (stepCount - i));
      const step = new THREE.Mesh(stepGeo, stoneMat);
      step.position.set(0, (i + 0.5) * stepHeight, 2.7 + (stepCount - i) * (stepDepth / 2));
      step.receiveShadow = true;
      step.castShadow = true;
      this.modelGroup.add(step);
    }

    // Staircase side banisters / walls
    const banisterGeo = new THREE.BoxGeometry(0.35, 0.9, 1.6);
    const banisterL = new THREE.Mesh(banisterGeo, brickMat);
    banisterL.position.set(stepWidth / 2 + 0.18, 0.55, 3.4);
    this.modelGroup.add(banisterL);

    const banisterR = new THREE.Mesh(banisterGeo, brickMat);
    banisterR.position.set(-stepWidth / 2 - 0.18, 0.55, 3.4);
    this.modelGroup.add(banisterR);

    // Golden lotus finials at newel posts
    const finialGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const finialL = new THREE.Mesh(finialGeo, goldMat);
    finialL.position.set(stepWidth / 2 + 0.18, 1.1, 4.1);
    this.modelGroup.add(finialL);

    const finialR = new THREE.Mesh(finialGeo, goldMat);
    finialR.position.set(-stepWidth / 2 - 0.18, 1.1, 4.1);
    this.modelGroup.add(finialR);

    // -------------------------------------------------------------
    // 3. VERANDA BALUSTRADES (တံတိုင်း လက်ရန်းများ)
    // -------------------------------------------------------------
    const makeRailing = (w, d, x, z) => {
      const railGeo = new THREE.BoxGeometry(w, 0.45, d);
      const rail = new THREE.Mesh(railGeo, teakMat);
      rail.position.set(x, 1.35, z);
      this.modelGroup.add(rail);

      // Golden rail top
      const railTopGeo = new THREE.BoxGeometry(w + 0.05, 0.08, d + 0.05);
      const railTop = new THREE.Mesh(railTopGeo, goldMat);
      railTop.position.set(x, 1.6, z);
      this.modelGroup.add(railTop);
    };

    // Front left and right veranda railings
    makeRailing(1.8, 0.12, 2.1, 2.7);
    makeRailing(1.8, 0.12, -2.1, 2.7);
    // Side railings
    makeRailing(0.12, 4.8, 3.1, 0);
    makeRailing(0.12, 4.8, -3.1, 0);

    // -------------------------------------------------------------
    // 4. MAIN HALL WALLS & ENTRANCE (နန်းဆောင် နံရံနှင့် ရွှေတံခါး)
    // -------------------------------------------------------------
    const wallGeo = new THREE.BoxGeometry(4.4, 1.8, 3.6);
    const wall = new THREE.Mesh(wallGeo, teakMat);
    wall.position.set(0, 2.05, -0.2);
    wall.castShadow = true;
    this.modelGroup.add(wall);

    // Royal Golden Entrance Door (ရှေ့မုခ် ရွှေတံခါးမကြီး)
    const doorFrameGeo = new THREE.BoxGeometry(1.6, 1.6, 0.2);
    const doorFrame = new THREE.Mesh(doorFrameGeo, goldMat);
    doorFrame.position.set(0, 1.95, 1.65);
    this.modelGroup.add(doorFrame);

    const doorInnerGeo = new THREE.BoxGeometry(1.3, 1.4, 0.15);
    const doorInner = new THREE.Mesh(doorInnerGeo, doorMat);
    doorInner.position.set(0, 1.9, 1.7);
    this.modelGroup.add(doorInner);

    // Side windows with golden frames
    [-1.6, 1.6].forEach(x => {
      const winGeo = new THREE.BoxGeometry(0.8, 0.9, 0.1);
      const win = new THREE.Mesh(winGeo, goldMat);
      win.position.set(x, 2.1, 1.65);
      this.modelGroup.add(win);
    });

    // -------------------------------------------------------------
    // 5. TEAK PILLARS WITH GOLDEN CAPITALS (ရွှေရောင်ဆင်ယင်ထားသော တိုင်လုံးများ)
    // -------------------------------------------------------------
    const makePillar = (x, z) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(x, 1.15, z);

      // Gold base pedestal
      const pBaseGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.18, 8);
      const pBase = new THREE.Mesh(pBaseGeo, goldMat);
      pBase.position.y = 0.09;
      pGroup.add(pBase);

      // Teak shaft
      const pShaftGeo = new THREE.CylinderGeometry(0.14, 0.15, 1.6, 8);
      const pShaft = new THREE.Mesh(pShaftGeo, teakMat);
      pShaft.position.y = 0.95;
      pShaft.castShadow = true;
      pGroup.add(pShaft);

      // Gold capital / Lotus crown
      const pCapGeo = new THREE.CylinderGeometry(0.24, 0.14, 0.2, 8);
      const pCap = new THREE.Mesh(pCapGeo, goldMat);
      pCap.position.y = 1.8;
      pGroup.add(pCap);

      this.modelGroup.add(pGroup);
    };

    // Front entrance portico columns
    makePillar(1.0, 2.2);
    makePillar(-1.0, 2.2);
    // Veranda corner columns
    makePillar(2.8, 2.2);
    makePillar(-2.8, 2.2);
    makePillar(2.8, 0);
    makePillar(-2.8, 0);
    makePillar(2.8, -2.2);
    makePillar(-2.8, -2.2);

    // -------------------------------------------------------------
    // 6. MULTI-TIERED GABLE & PYATTHAT ROOFS (ဘုံဆင့်ဆင့် အမိုးခုံးများ)
    // -------------------------------------------------------------
    // Tier 1: Lower Veranda Eaves (အောက်ထပ် တောင်ပံအမိုး)
    const eave1Geo = new THREE.BoxGeometry(6.6, 0.35, 5.8);
    const eave1 = new THREE.Mesh(eave1Geo, roofRedMat);
    eave1.position.set(0, 3.1, -0.1);
    eave1.castShadow = true;
    this.modelGroup.add(eave1);

    // Golden trim around Tier 1 eaves
    const eave1TrimGeo = new THREE.BoxGeometry(6.75, 0.08, 5.95);
    const eave1Trim = new THREE.Mesh(eave1TrimGeo, goldMat);
    eave1Trim.position.set(0, 2.95, -0.1);
    this.modelGroup.add(eave1Trim);

    // Front Portico Projecting Gable (ရှေ့မုခ်ဦး အမိုးစွန်း)
    const porticoRoofGeo = new THREE.ConeGeometry(1.6, 0.9, 4);
    const porticoRoof = new THREE.Mesh(porticoRoofGeo, roofRedMat);
    porticoRoof.position.set(0, 3.4, 2.0);
    porticoRoof.rotation.y = Math.PI / 4;
    porticoRoof.castShadow = true;
    this.modelGroup.add(porticoRoof);

    // Golden Pediment / Tympanum carving on front gable
    const pedimentGeo = new THREE.ConeGeometry(1.4, 0.8, 4);
    const pediment = new THREE.Mesh(pedimentGeo, goldMat);
    pediment.position.set(0, 3.35, 2.05);
    pediment.rotation.y = Math.PI / 4;
    this.modelGroup.add(pediment);

    // Tier 2: Middle Pavilion Chamber (အလယ်ဗဟိုဆောင်)
    const midWallGeo = new THREE.BoxGeometry(3.6, 0.9, 3.0);
    const midWall = new THREE.Mesh(midWallGeo, teakMat);
    midWall.position.set(0, 3.65, -0.2);
    midWall.castShadow = true;
    this.modelGroup.add(midWall);

    // Tier 2 Roof
    const eave2Geo = new THREE.BoxGeometry(4.8, 0.35, 4.0);
    const eave2 = new THREE.Mesh(eave2Geo, roofRedMat);
    eave2.position.set(0, 4.25, -0.2);
    eave2.castShadow = true;
    this.modelGroup.add(eave2);

    const eave2Trim = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.08, 4.15), goldMat);
    eave2Trim.position.set(0, 4.1, -0.2);
    this.modelGroup.add(eave2Trim);

    // Tier 3: Upper Pyatthat Tower (ပြာသာဒ်အထွတ်)
    const upperWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 2.0), teakMat);
    upperWall.position.set(0, 4.8, -0.2);
    upperWall.castShadow = true;
    this.modelGroup.add(upperWall);

    const eave3Geo = new THREE.BoxGeometry(3.2, 0.3, 2.8);
    const eave3 = new THREE.Mesh(eave3Geo, roofRedMat);
    eave3.position.set(0, 5.3, -0.2);
    eave3.castShadow = true;
    this.modelGroup.add(eave3);

    const eave3Trim = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.08, 2.95), goldMat);
    eave3Trim.position.set(0, 5.18, -0.2);
    this.modelGroup.add(eave3Trim);

    // Tier 4: Crown Pyatthat Roof (အထွတ်ခေါင် အမိုးခုံး)
    const eave4Geo = new THREE.ConeGeometry(1.6, 0.8, 4);
    const eave4 = new THREE.Mesh(eave4Geo, roofRedMat);
    eave4.position.set(0, 5.85, -0.2);
    eave4.rotation.y = Math.PI / 4;
    eave4.castShadow = true;
    this.modelGroup.add(eave4);

    // -------------------------------------------------------------
    // 7. GOLDEN CHOFA / HORN FINIALS ON EAVE CORNERS (ကနုတ်တုရင်များ)
    // -------------------------------------------------------------
    const makeChofa = (x, y, z) => {
      const chofaGeo = new THREE.ConeGeometry(0.12, 0.45, 6);
      const chofa = new THREE.Mesh(chofaGeo, goldMat);
      chofa.position.set(x, y, z);
      chofa.rotation.x = (z > 0 ? 0.35 : -0.35);
      chofa.rotation.z = (x > 0 ? -0.35 : 0.35);
      this.modelGroup.add(chofa);
    };

    // Corner chofas on Tier 1
    makeChofa(3.3, 3.3, 2.7);
    makeChofa(-3.3, 3.3, 2.7);
    makeChofa(3.3, 3.3, -2.9);
    makeChofa(-3.3, 3.3, -2.9);
    // Portico peak chofa
    makeChofa(0, 4.0, 2.8);

    // Corner chofas on Tier 2
    makeChofa(2.4, 4.45, 1.8);
    makeChofa(-2.4, 4.45, 1.8);
    makeChofa(2.4, 4.45, -2.2);
    makeChofa(-2.4, 4.45, -2.2);

    // -------------------------------------------------------------
    // 8. CENTRAL GOLDEN SPIRE & SIKHARA FINIAL (ထွတ်ခေါင်ရွှေစေတီထီးတော်)
    // -------------------------------------------------------------
    // Stepped square spire pedestal
    const spirePedestal1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.9), goldMat);
    spirePedestal1.position.set(0, 6.35, -0.2);
    this.modelGroup.add(spirePedestal1);

    const spirePedestal2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), goldMat);
    spirePedestal2.position.set(0, 6.55, -0.2);
    this.modelGroup.add(spirePedestal2);

    // Conical Golden Lotus Spire (ထီးတော်တံခွန်)
    const spireGeo = new THREE.ConeGeometry(0.35, 1.8, 8);
    const spire = new THREE.Mesh(spireGeo, goldMat);
    spire.position.set(0, 7.5, -0.2);
    spire.castShadow = true;
    this.modelGroup.add(spire);

    // Golden jewel finial orb at the pinnacle
    const orbGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const orb = new THREE.Mesh(orbGeo, goldMat);
    orb.position.set(0, 8.45, -0.2);
    this.modelGroup.add(orb);

    this.mesh.add(this.modelGroup);

    // Clean HP bar positioned nicely above the royal spire
    this.createHpBar(3.6, 0.22, 9.2);
  }
}
