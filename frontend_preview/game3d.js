/**
 * GitWorld 3D WebGL Fantasy Engine (Three.js)
 * Features:
 * - Full 3D Procedural Voxel / Low-Poly RPG World
 * - 3D Terrain with elevated blocks, animated water waves, and biome vegetation
 * - Detailed 3D Building Models (Castle, Wizard Tower, Volcanic Forge, Thatched Cottage)
 * - 3D Animated Player Character with limb walk cycles, cape flutter, and smooth directional rotation
 * - 3D Hovering Gatekeeper NPC with mystic aura
 * - Dynamic Lighting, Soft Shadows, Floating Particles (Embers & Magic Sparkles)
 * - Third-person RPG camera with mouse orbit & scroll zoom
 */

class GameEngine3D {
  constructor(containerId, minimapId) {
    this.container = document.getElementById(containerId);
    this.minimap = document.getElementById(minimapId);
    this.mCtx = this.minimap.getContext('2d');

    this.world = null;
    this.tileSize = 4; // 3D units per tile

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x14243a, 0.0045);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Player 3D state
    this.player = {
      mesh: null,
      limbs: {},
      x: 0,
      z: 0,
      targetRotation: 0,
      currentRotation: 0,
      speed: 12,
      isMoving: false,
      walkTime: 0
    };

    // Camera orbit controls state
    this.cameraOffset = new THREE.Vector3(0, 18, 26);
    this.cameraTarget = new THREE.Vector3(0, 2, 0);
    this.isMouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.cameraAngleH = 0;
    this.cameraAngleV = 0.6;
    this.cameraDistance = 32;

    // Keys & Interaction
    this.keys = {};
    this.activeInteraction = null;
    this.onInteract = null;

    // Dynamic objects & particles
    this.animatedObjects = [];
    this.particles = [];

    // Lighting setup
    this.setupLighting();
    this.initListeners();

    window.addEventListener('resize', () => this.onResize());

    this.clock = new THREE.Clock();
    this.animate();
  }

  setupLighting() {
    // Ambient moonlight / sky glow
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
    this.scene.add(ambientLight);

    // Main Sun / Directional light with soft shadows
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.25);
    this.sunLight.position.set(40, 70, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    const d = 80;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Secondary subtle fill light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    fillLight.position.set(-40, 30, -30);
    this.scene.add(fillLight);
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      if (window.app && !window.app.is3D) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      this.keys[e.key.toLowerCase()] = true;

      if (e.key.toLowerCase() === 'e' && this.activeInteraction) {
        if (this.onInteract) this.onInteract(this.activeInteraction);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (window.app && !window.app.is3D) return;
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse drag to rotate camera
    this.container.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const deltaX = e.clientX - this.mouseX;
      const deltaY = e.clientY - this.mouseY;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      this.cameraAngleH -= deltaX * 0.008;
      this.cameraAngleV = Math.max(0.2, Math.min(1.3, this.cameraAngleV + deltaY * 0.008));
    });

    // Mouse scroll to zoom
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(14, Math.min(65, this.cameraDistance + e.deltaY * 0.03));
    }, { passive: false });
  }

  onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  loadWorld(worldModel) {
    this.world = worldModel;

    // Clear previous dynamic meshes
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      this.scene.remove(obj);
    }

    this.animatedObjects = [];
    this.particles = [];
    this.setupLighting();

    // 1. Build 3D Terrain
    this.buildTerrain(worldModel);

    // 1b. Add ambient vegetation, lamps, and fireflies
    this.buildAmbience(worldModel);

    // 2. Build 3D Buildings
    this.buildBuildings(worldModel);

    // 3. Build 3D Gatekeeper NPC
    this.buildGatekeeper(worldModel);

    // 4. Build 3D Player Character
    this.buildPlayer(worldModel);

    // Snap camera immediately to player location
    const r = this.cameraDistance;
    const theta = this.cameraAngleH;
    const phi = this.cameraAngleV;
    const camX = this.player.x + r * Math.sin(theta) * Math.cos(phi);
    const camY = 3 + r * Math.sin(phi);
    const camZ = this.player.z + r * Math.cos(theta) * Math.cos(phi);
    this.camera.position.set(camX, camY, camZ);
    this.cameraTarget.set(this.player.x, 2.5, this.player.z);
    this.camera.lookAt(this.cameraTarget);
    this.onResize();

    // Minimap size
    const mapW = worldModel.dimensions.width;
    const mapH = worldModel.dimensions.height;
    this.minimap.width = 140;
    this.minimap.height = Math.round((140 * mapH) / mapW);
  }

  buildTerrain(worldModel) {
    const width = worldModel.dimensions.width;
    const height = worldModel.dimensions.height;
    const ground = worldModel.terrain.ground;

    const materials = {
      water: new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.88
      }),
      grass: new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 }),
      forest: new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 }),
      dirt: new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }),
      volcano: new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 }),
      sand: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 }),
      wall: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    };

    const S = this.tileSize;

    // Instanced blocks or clustered groups
    const blockGeo = new THREE.BoxGeometry(S, 2, S);
    const waterGeo = new THREE.BoxGeometry(S, 1.4, S);
    const wallGeo = new THREE.BoxGeometry(S, 6, S);

    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        const tileId = ground[z][x];
        const posX = (x - width / 2) * S;
        const posZ = (z - height / 2) * S;

        let mesh;
        if (tileId === 0 || tileId === 1) {
          // Water tile
          mesh = new THREE.Mesh(waterGeo, materials.water);
          mesh.position.set(posX, -0.6, posZ);
          this.animatedObjects.push({
            mesh,
            initialY: -0.6,
            phase: x * 0.5 + z * 0.3,
            type: 'water'
          });
        } else if (tileId === 8) {
          // Stone fortress wall
          mesh = new THREE.Mesh(wallGeo, materials.wall);
          mesh.position.set(posX, 2, posZ);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        } else {
          // Normal ground block
          let mat = materials.grass;
          if (tileId === 3) mat = materials.dirt;
          else if (tileId === 4) mat = materials.stone;
          else if (tileId === 5) mat = materials.forest;
          else if (tileId === 6) mat = materials.volcano;
          else if (tileId === 7) mat = materials.sand;

          mesh = new THREE.Mesh(blockGeo, mat);
          mesh.position.set(posX, -0.2, posZ);
          mesh.receiveShadow = true;

          // Add 3D foliage/trees in mystic forest biomes
          if (tileId === 5 && (x * 7 + z * 13) % 5 === 0) {
            this.addTree(posX + (Math.random() - 0.5) * 1.5, posZ + (Math.random() - 0.5) * 1.5);
          }
        }

        this.scene.add(mesh);
      }
    }

    // Deep seabed plane below map
    const bedGeo = new THREE.PlaneGeometry(width * S * 1.5, height * S * 1.5);
    const bedMat = new THREE.MeshBasicMaterial({ color: 0x051329 });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.y = -2;
    this.scene.add(bedMesh);
  }

  addTree(x, z) {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.8;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Foliage Cones
    const folMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.5, 6), folMat);
    cone1.position.y = 3.2;
    cone1.castShadow = true;
    treeGroup.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2, 6), folMat);
    cone2.position.y = 4.4;
    cone2.castShadow = true;
    treeGroup.add(cone2);

    treeGroup.position.set(x, 0, z);
    this.scene.add(treeGroup);
  }

  buildAmbience(worldModel) {
    const width = worldModel.dimensions.width;
    const height = worldModel.dimensions.height;
    const ground = worldModel.terrain.ground;
    const collision = worldModel.terrain.collision;
    const S = this.tileSize;
    const roadTiles = [];
    const plantTiles = [];

    for (let z = 1; z < height - 1; z++) {
      for (let x = 1; x < width - 1; x++) {
        const tileId = ground[z][x];
        const posX = (x + 0.5 - width / 2) * S;
        const posZ = (z + 0.5 - height / 2) * S;

        if (tileId === 4) {
          roadTiles.push({ x: posX, z: posZ, tileX: x, tileZ: z });
        } else if ((tileId === 2 || tileId === 5) && collision[z][x] === 0) {
          plantTiles.push({ x: posX, z: posZ, tileX: x, tileZ: z });
        }
      }
    }

    // Lamps follow the main path at a restrained interval so the scene stays readable.
    roadTiles.forEach((tile, index) => {
      if (index % 5 !== 0) return;
      const horizontal = ground[tile.tileZ][tile.tileX - 1] === 4 && ground[tile.tileZ][tile.tileX + 1] === 4;
      this.addStreetLamp(tile.x + (horizontal ? 0 : 1.7), tile.z + (horizontal ? 1.7 : 0));
    });

    // Use a deterministic tile hash for a calm, repeatable scattering pattern.
    plantTiles.forEach((tile) => {
      const hash = (tile.tileX * 37 + tile.tileZ * 61) % 17;
      if (hash === 0 || hash === 7) {
        this.addPlant(tile.x + ((hash % 3) - 1) * 0.5, tile.z + ((hash % 5) - 2) * 0.35, hash === 7);
      }
    });

    const fireflyCount = Math.min(42, Math.max(18, Math.floor((width * height) / 45)));
    for (let index = 0; index < fireflyCount; index++) {
      const tile = plantTiles[(index * 11) % plantTiles.length];
      if (!tile) break;
      this.addFirefly(tile.x + ((index % 4) - 1.5) * 1.1, 2.2 + (index % 5) * 0.45, tile.z + ((index % 3) - 1) * 1.2, index);
    }
  }

  addPlant(x, z, isFlower) {
    const plant = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, isFlower ? 0.8 : 0.55, 5),
      new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.9 })
    );
    stem.position.y = isFlower ? 0.4 : 0.28;
    plant.add(stem);

    const bloom = new THREE.Mesh(
      isFlower ? new THREE.SphereGeometry(0.18, 6, 6) : new THREE.ConeGeometry(0.28, 0.65, 5),
      new THREE.MeshStandardMaterial({ color: isFlower ? 0xf472b6 : 0x65a30d, roughness: 0.85 })
    );
    bloom.position.y = isFlower ? 0.82 : 0.62;
    plant.add(bloom);
    plant.position.set(x, 0, z);
    this.scene.add(plant);
  }

  addStreetLamp(x, z) {
    const lamp = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.65, metalness: 0.35 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.8, 6), metal);
    post.position.y = 1.4;
    lamp.add(post);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.35, 6), metal);
    cap.position.y = 2.95;
    lamp.add(cap);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    glow.position.y = 2.75;
    lamp.add(glow);

    const light = new THREE.PointLight(0xfbbf24, 0.8, 9, 2);
    light.position.y = 2.75;
    lamp.add(light);
    lamp.position.set(x, 0, z);
    this.scene.add(lamp);
  }

  addFirefly(x, y, z, index) {
    const firefly = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 6),
      new THREE.MeshBasicMaterial({ color: index % 3 === 0 ? 0xfef08a : 0xa7f3d0 })
    );
    firefly.position.set(x, y, z);
    this.scene.add(firefly);
    this.animatedObjects.push({
      mesh: firefly,
      baseX: x,
      baseY: y,
      baseZ: z,
      phase: index * 0.9,
      type: 'firefly'
    });
  }

  buildBuildings(worldModel) {
    const width = worldModel.dimensions.width;
    const height = worldModel.dimensions.height;
    const S = this.tileSize;

    for (const bldg of worldModel.buildings) {
      const posX = (bldg.x + bldg.width / 2 - width / 2) * S;
      const posZ = (bldg.y + bldg.height / 2 - height / 2) * S;
      const bw = bldg.width * S;
      const bh = bldg.height * S;

      const group = new THREE.Group();
      group.position.set(posX, 0.8, posZ);

      const repo = bldg.repository;
      const title = repo ? repo.name : bldg.name;
      const stars = repo ? repo.stars : 0;
      const langColor = repo?.languageColor || '#d4af37';
      let peakY = 8.5;

      if (bldg.spriteType.includes('castle') || bldg.spriteType.includes('hall')) {
        this.create3DCastle(group, bw, bh, bldg);
        peakY = 14.5;
      } else if (bldg.spriteType.includes('tower')) {
        this.create3DWizardTower(group, bw, bh, bldg);
        peakY = 19.5;
      } else if (bldg.spriteType.includes('forge')) {
        this.create3DForge(group, bw, bh, bldg);
        peakY = 11.0;
      } else {
        this.create3DCottage(group, bw, bh, bldg);
        peakY = 8.0;
      }

      // Add matching floating 3D nameplate billboard with Stars & Title
      this.create3DNameplate(group, title, stars, langColor, peakY);

      // Add glowing 3D interaction disc on ground
      const ringGeo = new THREE.RingGeometry(0.8, 1.2, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.1, bh / 2 + 1.2);
      group.add(ring);

      this.scene.add(group);
      bldg.meshGroup = group;
    }
  }

  create3DNameplate(group, title, stars, langColor, yOffset) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Rounded tag background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(16, 16, 480, 96, 18);
      ctx.fill();
    } else {
      ctx.fillRect(16, 16, 480, 96);
    }

    // Border in language color
    ctx.strokeStyle = langColor || '#d4af37';
    ctx.lineWidth = 6;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(16, 16, 480, 96, 18);
      ctx.stroke();
    } else {
      ctx.strokeRect(16, 16, 480, 96);
    }

    // Stars
    if (stars > 0) {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`★ ${stars}`, 256, 52);
    }

    // Repository / Building Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, stars > 0 ? 88 : 72);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(7.5, 1.88, 1);
    sprite.position.y = yOffset;
    group.add(sprite);
  }

  create3DCastle(group, bw, bh, bldg) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

    // Main Keep Body
    const keepH = 7;
    const keep = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.75, keepH, bh * 0.75), stoneMat);
    keep.position.y = keepH / 2;
    keep.castShadow = true;
    keep.receiveShadow = true;
    group.add(keep);

    // 4 Corner Towers
    const towerH = 10;
    const towerR = 1.4;
    const cornerOffsets = [
      [-bw * 0.38, -bh * 0.38],
      [bw * 0.38, -bh * 0.38],
      [-bw * 0.38, bh * 0.38],
      [bw * 0.38, bh * 0.38]
    ];

    const flagColor = (bldg.repository && bldg.repository.languageColor)
      ? parseInt(bldg.repository.languageColor.replace('#', '0x'), 16)
      : 0xdc2626;

    cornerOffsets.forEach(([cx, cz]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(towerR, towerR * 1.1, towerH, 8), trimMat);
      tower.position.set(cx, towerH / 2, cz);
      tower.castShadow = true;
      group.add(tower);

      // Battlements cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(towerR * 1.2, towerR, 1.2, 8), stoneMat);
      cap.position.set(cx, towerH + 0.6, cz);
      group.add(cap);

      // Flagpole & banner
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5), new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
      pole.position.set(cx, towerH + 2.2, cz);
      group.add(pole);

      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ color: flagColor, side: THREE.DoubleSide }));
      flag.position.set(cx + 0.6, towerH + 2.8, cz);
      group.add(flag);
    });

    // Castle Portcullis Entrance (Arched)
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.8, 0.4), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    door.position.set(0, 1.9, bh * 0.38 + 0.1);
    group.add(door);

    // Golden Heraldic Shield/Crest on Front Keep Wall (matches 2D banner)
    const crest = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 0.2), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 }));
    crest.position.set(0, 5.2, bh * 0.375 + 0.08);
    group.add(crest);

    const crestInlay = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.22), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    crestInlay.position.set(0, 5.2, bh * 0.375 + 0.1);
    group.add(crestInlay);

    // Warm entrance light
    const pointLight = new THREE.PointLight(0xfef08a, 0.9, 12);
    pointLight.position.set(0, 3, bh * 0.38 + 1.2);
    group.add(pointLight);
  }

  create3DWizardTower(group, bw, bh, bldg) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.5 });

    // Multi-stage cylindrical stone tower
    const towerH = 11;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, towerH, 10), stoneMat);
    tower.position.y = towerH / 2;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Balcony ring
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.5, 1, 10), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    ring.position.y = towerH;
    group.add(ring);

    // Conical Wizard Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 5, 10), roofMat);
    roof.position.y = towerH + 3;
    roof.castShadow = true;
    group.add(roof);

    // Floating Rotating Arcane Crystal atop Spire
    const crystalGeo = new THREE.OctahedronGeometry(0.9, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = towerH + 6.8;
    group.add(crystal);

    this.animatedObjects.push({
      mesh: crystal,
      type: 'crystalSpin'
    });

    // Glowing mystic point light
    const magicLight = new THREE.PointLight(0x38bdf8, 1.5, 16);
    magicLight.position.set(0, towerH + 6.8, 0);
    group.add(magicLight);

    // Arched Glowing Arcane Window (matches 2D purple window)
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.2), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
    win.position.set(0, 6.5, 2.5);
    group.add(win);

    // Glowing Rune Stones carved in wall (matches 2D cyan/purple runes)
    const rune1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.1), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    rune1.position.set(-1.2, 4.0, 2.5);
    group.add(rune1);

    const rune2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.1), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
    rune2.position.set(1.2, 4.5, 2.5);
    group.add(rune2);

    // Oak Door at base (matches 2D entrance)
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    door.position.set(0, 1.2, 2.75);
    group.add(door);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    knob.position.set(0.4, 1.2, 2.9);
    group.add(knob);
  }

  create3DForge(group, bw, bh, bldg) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.9 });

    // Main Foundry Body
    const fH = 5.5;
    const forge = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.8, fH, bh * 0.8), stoneMat);
    forge.position.y = fH / 2;
    forge.castShadow = true;
    group.add(forge);

    // Pitched Slate Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(bw * 0.55, 3.2, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = fH + 1.6;
    roof.castShadow = true;
    group.add(roof);

    // Chimney emitting smoke
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.5, 1.4), new THREE.MeshStandardMaterial({ color: 0x1c1917 }));
    chimney.position.set(bw * 0.28, fH + 2.2, -bh * 0.2);
    chimney.castShadow = true;
    group.add(chimney);

    // Smoke puff spheres above chimney (matches 2D smoke puffs)
    const smoke1 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), new THREE.MeshBasicMaterial({ color: 0x78716c, transparent: true, opacity: 0.5 }));
    smoke1.position.set(bw * 0.28, fH + 4.8, -bh * 0.2);
    group.add(smoke1);

    const smoke2 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 6), new THREE.MeshBasicMaterial({ color: 0x78716c, transparent: true, opacity: 0.3 }));
    smoke2.position.set(bw * 0.28 + 0.3, fH + 5.8, -bh * 0.2);
    group.add(smoke2);

    // Glowing Molten Fire Hearth Entrance (matches 2D furnace)
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xc2410c }));
    hearth.position.set(0, 1.2, bh * 0.4 + 0.05);
    group.add(hearth);

    const moltenCore = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.45), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    moltenCore.position.set(0, 1.2, bh * 0.4 + 0.08);
    group.add(moltenCore);

    // Hanging Red Smith Weapon Sign (matches 2D red sign)
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 1.0), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    sign.position.set(-bw * 0.41, 3.0, bh * 0.1);
    group.add(sign);

    // Fiery Point Light
    const fireLight = new THREE.PointLight(0xf97316, 2.0, 14);
    fireLight.position.set(0, 1.5, bh * 0.4 + 1.2);
    group.add(fireLight);

    // Anvil (matches 2D outside anvil)
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.4 }));
    anvil.position.set(2.2, 0.4, bh * 0.4 + 1.2);
    group.add(anvil);
  }

  create3DCottage(group, bw, bh, bldg) {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

    // House Body (Pitched Timber Cottage)
    const houseW = Math.max(5, bw * 0.8);
    const houseD = Math.max(4, bh * 0.8);
    const hH = 3.8;
    const house = new THREE.Mesh(new THREE.BoxGeometry(houseW, hH, houseD), wallMat);
    house.position.y = hH / 2;
    house.castShadow = true;
    house.receiveShadow = true;
    group.add(house);

    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(houseW + 0.35, 0.45, houseD + 0.35),
      new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.95 })
    );
    foundation.position.y = 0.22;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    group.add(foundation);

    // Tudor Timber Corner Posts
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([cx, cz]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, hH, 0.35), beamMat);
      post.position.set(cx * (houseW / 2), hH / 2, cz * (houseD / 2));
      group.add(post);
    });

    // Pitched Thatched Straw Roof
    const roofH = 2.4;
    const roofGeo = new THREE.ConeGeometry(Math.hypot(houseW, houseD) * 0.45, roofH, 4);
    const roof = new THREE.Mesh(roofGeo, thatchMat);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(houseW / Math.max(houseW, houseD), 1, houseD / Math.max(houseW, houseD));
    roof.position.y = hH + roofH / 2;
    roof.castShadow = true;
    group.add(roof);

    const ridge = new THREE.Mesh(new THREE.BoxGeometry(houseW * 0.82, 0.22, 0.28), beamMat);
    ridge.position.set(0, hH + roofH + 0.08, 0);
    ridge.rotation.y = Math.PI / 4;
    ridge.castShadow = true;
    group.add(ridge);

    const eave = new THREE.Mesh(new THREE.BoxGeometry(houseW + 0.4, 0.24, 0.35), beamMat);
    eave.position.set(0, hH + 0.15, houseD / 2 + 0.12);
    eave.castShadow = true;
    group.add(eave);

    // Stone Chimney with soft smoke puff
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x64748b }));
    chimney.position.set(houseW * 0.28, hH + 1.2, -houseD * 0.2);
    chimney.castShadow = true;
    group.add(chimney);

    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.5 }));
    smoke.position.set(houseW * 0.28, hH + 2.8, -houseD * 0.2);
    group.add(smoke);

    // Arched Oak Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), beamMat);
    door.position.set(-houseW * 0.22, 1.1, houseD / 2 + 0.1);
    group.add(door);

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.16), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }));
    doorFrame.position.set(-houseW * 0.22, 1.25, houseD / 2 + 0.04);
    group.add(doorFrame);

    const awning = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.7, 4), thatchMat);
    awning.rotation.y = Math.PI / 4;
    awning.rotation.x = Math.PI / 2;
    awning.position.set(-houseW * 0.22, 2.55, houseD / 2 + 0.55);
    awning.scale.set(1, 0.55, 1);
    awning.castShadow = true;
    group.add(awning);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    knob.position.set(-houseW * 0.22 + 0.4, 1.1, houseD / 2 + 0.22);
    group.add(knob);

    // Warm Glowing Window with Frame
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    win.position.set(houseW * 0.22, 2.0, houseD / 2 + 0.08);
    group.add(win);

    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 0.05), beamMat);
    winFrame.position.set(houseW * 0.22, 2.0, houseD / 2 + 0.05);
    group.add(winFrame);

    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    [-0.72, 0.72].forEach((offset) => {
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.15, 0.12), shutterMat);
      shutter.position.set(houseW * 0.22 + offset, 2.0, houseD / 2 + 0.12);
      group.add(shutter);
    });

    // Flower Box beneath Window (matches 2D pink/purple flower box)
    const flowerBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    flowerBox.position.set(houseW * 0.22, 1.2, houseD / 2 + 0.2);
    group.add(flowerBox);

    const flowers = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.25), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
    flowers.position.set(houseW * 0.22, 1.4, houseD / 2 + 0.2);
    group.add(flowers);

    // Warm lantern light
    const lantern = new THREE.PointLight(0xfef08a, 0.8, 8);
    lantern.position.set(houseW * 0.22, 2.0, houseD / 2 + 0.8);
    group.add(lantern);
  }

  buildGatekeeper(worldModel) {
    if (!worldModel.gatekeeper || !worldModel.gatekeeper.position) return;
    const width = worldModel.dimensions.width;
    const height = worldModel.dimensions.height;
    const S = this.tileSize;

    const gx = (worldModel.gatekeeper.position.x - width / 2 + 0.5) * S;
    const gz = (worldModel.gatekeeper.position.y - height / 2 + 0.5) * S;

    const gkGroup = new THREE.Group();
    gkGroup.position.set(gx, 1.8, gz);

    // Robe
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.6 });
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 8), robeMat);
    robe.position.y = 0.8;
    gkGroup.add(robe);

    // Wizard Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfed7aa }));
    head.position.y = 2.1;
    gkGroup.add(head);

    // Pointed Wizard Hat
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x1e1b4b }));
    hat.position.y = 2.8;
    gkGroup.add(hat);

    // Wooden Staff with Glowing Azure Crystal
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    staff.position.set(0.9, 1.4, 0.2);
    gkGroup.add(staff);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    orb.position.set(0.9, 2.9, 0.2);
    gkGroup.add(orb);

    // Mystical Light
    const orbLight = new THREE.PointLight(0x38bdf8, 1.8, 8);
    orbLight.position.set(0.9, 2.9, 0.2);
    gkGroup.add(orbLight);

    this.scene.add(gkGroup);

    this.animatedObjects.push({
      mesh: gkGroup,
      baseY: 1.8,
      type: 'hover'
    });
  }

  buildPlayer(worldModel) {
    const width = worldModel.dimensions.width;
    const height = worldModel.dimensions.height;
    const S = this.tileSize;

    const spawnX = worldModel.spawnPoint ? (worldModel.spawnPoint.x - width / 2 + 0.5) * S : 0;
    const spawnZ = worldModel.spawnPoint ? (worldModel.spawnPoint.y - height / 2 + 0.5) * S : 0;

    const playerGroup = new THREE.Group();
    playerGroup.position.set(spawnX, 0, spawnZ);

    const armorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.6 });
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });

    // Torso & Tunic
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), tunicMat);
    torso.position.y = 2.0;
    torso.castShadow = true;
    playerGroup.add(torso);

    // Helmet & Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), armorMat);
    head.position.y = 3.2;
    head.castShadow = true;
    playerGroup.add(head);

    // Helmet Plume
    const plume = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.8), goldMat);
    plume.position.set(0, 3.8, 0);
    playerGroup.add(plume);

    // Flowing Cape
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, side: THREE.DoubleSide }));
    cape.position.set(0, 2.0, -0.42);
    playerGroup.add(cape);

    // Animated Limbs (Left Leg, Right Leg, Left Arm, Right Arm)
    const legGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const leftLeg = new THREE.Mesh(legGeo, armorMat);
    leftLeg.position.set(-0.35, 0.7, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, armorMat);
    rightLeg.position.set(0.35, 0.7, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);

    const armGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
    const leftArm = new THREE.Mesh(armGeo, armorMat);
    leftArm.position.set(-0.85, 2.0, 0);
    leftArm.castShadow = true;
    playerGroup.add(leftArm);

    // Shield on Left Arm
    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.8), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    shield.position.set(-0.25, -0.1, 0.1);
    leftArm.add(shield);

    const rightArm = new THREE.Mesh(armGeo, armorMat);
    rightArm.position.set(0.85, 2.0, 0);
    rightArm.castShadow = true;
    playerGroup.add(rightArm);

    // Sword in Right Hand
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.25), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 }));
    blade.position.set(0, -0.5, 0.6);
    blade.rotation.x = Math.PI / 4;
    rightArm.add(blade);

    this.scene.add(playerGroup);

    this.player.mesh = playerGroup;
    this.player.limbs = { torso, head, cape, leftLeg, rightLeg, leftArm, rightArm };
    this.player.x = spawnX;
    this.player.z = spawnZ;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.updatePlayer(dt, time);
    this.updateCamera();
    this.updateAnimatedObjects(time, dt);
    this.checkInteractions();
    this.renderMinimap();

    this.renderer.render(this.scene, this.camera);
  }

  updatePlayer(dt, time) {
    if (!this.player.mesh) return;

    let moveX = 0;
    let moveZ = 0;

    // Camera relative directions
    const forward = new THREE.Vector3(-Math.sin(this.cameraAngleH), 0, -Math.cos(this.cameraAngleH)).normalize();
    const right = new THREE.Vector3(Math.cos(this.cameraAngleH), 0, -Math.sin(this.cameraAngleH)).normalize();

    if (this.keys['w'] || this.keys['arrowup']) { moveX += forward.x; moveZ += forward.z; }
    if (this.keys['s'] || this.keys['arrowdown']) { moveX -= forward.x; moveZ -= forward.z; }
    if (this.keys['a'] || this.keys['arrowleft']) { moveX -= right.x; moveZ -= right.z; }
    if (this.keys['d'] || this.keys['arrowright']) { moveX += right.x; moveZ += right.z; }

    const isMoving = moveX !== 0 || moveZ !== 0;
    this.player.isMoving = isMoving;

    if (isMoving) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      const targetX = this.player.x + moveX * this.player.speed * dt;
      const targetZ = this.player.z + moveZ * this.player.speed * dt;

      if (!this.checkCollision(targetX, this.player.z)) {
        this.player.x = targetX;
      }
      if (!this.checkCollision(this.player.x, targetZ)) {
        this.player.z = targetZ;
      }

      this.player.mesh.position.x = this.player.x;
      this.player.mesh.position.z = this.player.z;

      // Smooth rotation to face movement direction
      this.player.targetRotation = Math.atan2(moveX, moveZ);
      let diff = this.player.targetRotation - this.player.currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.player.currentRotation += diff * 12 * dt;
      this.player.mesh.rotation.y = this.player.currentRotation;

      this.player.walkTime += dt * 11;
    }

    // --- 3D Character Walk Cycle & Idle Animations ---
    const limbs = this.player.limbs;
    if (isMoving) {
      const walkCycle = this.player.walkTime;

      // Alternate leg swing
      limbs.leftLeg.rotation.x = Math.sin(walkCycle) * 0.75;
      limbs.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.75;

      // Arm swing in opposition
      limbs.leftArm.rotation.x = -Math.sin(walkCycle) * 0.55;
      limbs.rightArm.rotation.x = Math.sin(walkCycle) * 0.55;

      // Dynamic walking body bob
      limbs.torso.position.y = 2.0 + Math.abs(Math.sin(walkCycle * 2)) * 0.15;
      limbs.head.position.y = 3.2 + Math.abs(Math.sin(walkCycle * 2)) * 0.15;

      // Cape billowing behind
      limbs.cape.rotation.x = 0.35 + Math.sin(walkCycle) * 0.15;
    } else {
      // Idle breathing animation
      const breath = Math.sin(time * 3) * 0.05;
      limbs.leftLeg.rotation.x = 0;
      limbs.rightLeg.rotation.x = 0;
      limbs.leftArm.rotation.x = breath;
      limbs.rightArm.rotation.x = -breath;
      limbs.torso.position.y = 2.0 + breath;
      limbs.head.position.y = 3.2 + breath;
      limbs.cape.rotation.x = 0.08 + Math.sin(time * 2) * 0.04;
    }
  }

  updateCamera() {
    if (!this.player.mesh) return;

    // Compute spherical coordinates around player
    const r = this.cameraDistance;
    const theta = this.cameraAngleH;
    const phi = this.cameraAngleV;

    const camX = this.player.x + r * Math.sin(theta) * Math.cos(phi);
    const camY = 3 + r * Math.sin(phi);
    const camZ = this.player.z + r * Math.cos(theta) * Math.cos(phi);

    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.12);
    this.cameraTarget.lerp(new THREE.Vector3(this.player.x, 2.5, this.player.z), 0.15);
    this.camera.lookAt(this.cameraTarget);
  }

  updateAnimatedObjects(time, dt) {
    for (const item of this.animatedObjects) {
      if (item.type === 'water') {
        // Water wave bobbing
        item.mesh.position.y = item.initialY + Math.sin(time * 2.5 + item.phase) * 0.12;
      } else if (item.type === 'crystalSpin') {
        // Floating crystal spin
        item.mesh.rotation.y += dt * 1.8;
        item.mesh.rotation.x = Math.sin(time * 2) * 0.2;
      } else if (item.type === 'hover') {
        // Gatekeeper hovering
        item.mesh.position.y = item.baseY + Math.sin(time * 2) * 0.25;
      } else if (item.type === 'firefly') {
        item.mesh.position.x = item.baseX + Math.sin(time * 0.7 + item.phase) * 0.7;
        item.mesh.position.y = item.baseY + Math.sin(time * 1.8 + item.phase) * 0.35;
        item.mesh.position.z = item.baseZ + Math.cos(time * 0.55 + item.phase) * 0.55;
        item.mesh.scale.setScalar(0.7 + (Math.sin(time * 3 + item.phase) + 1) * 0.45);
      }
    }
  }

  checkCollision(targetX, targetZ) {
    if (!this.world) return false;
    const width = this.world.dimensions.width;
    const height = this.world.dimensions.height;
    const S = this.tileSize;

    // Convert 3D world coords to tile grid
    const tileX = Math.floor((targetX + (width / 2) * S) / S);
    const tileZ = Math.floor((targetZ + (height / 2) * S) / S);

    if (tileX < 0 || tileX >= width || tileZ < 0 || tileZ >= height) return true;
    return this.world.terrain.collision[tileZ][tileX] === 1;
  }

  checkInteractions() {
    if (window.app && !window.app.is3D) return;
    if (!this.world || !this.player.mesh) return;

    const width = this.world.dimensions.width;
    const height = this.world.dimensions.height;
    const S = this.tileSize;

    let nearest = null;
    let minDist = 14.0; // Comfortable 3D distance threshold (~3.5 tiles)

    for (const bldg of this.world.buildings) {
      let targetX, targetZ;
      if (bldg.interactionPoint) {
        targetX = (bldg.interactionPoint.x + 0.5 - width / 2) * S;
        targetZ = (bldg.interactionPoint.y + 0.5 - height / 2) * S;
      } else {
        targetX = (bldg.x + bldg.width / 2 - width / 2) * S;
        targetZ = (bldg.y + bldg.height / 2 - height / 2) * S;
      }
      const dist = Math.hypot(this.player.x - targetX, this.player.z - targetZ);

      if (dist < minDist) {
        minDist = dist;
        nearest = {
          type: 'building',
          data: bldg,
          label: `Inspect ${bldg.repository ? bldg.repository.name : bldg.name}`
        };
      }
    }

    if (this.world.gatekeeper && this.world.gatekeeper.position) {
      const gx = (this.world.gatekeeper.position.x - width / 2 + 0.5) * S;
      const gz = (this.world.gatekeeper.position.y - height / 2 + 0.5) * S;
      const dist = Math.hypot(this.player.x - gx, this.player.z - gz);

      if (dist < Math.max(minDist, 14.0)) {
        if (dist < minDist) minDist = dist;
        nearest = {
          type: 'gatekeeper',
          data: this.world.gatekeeper,
          label: `Speak with ${this.world.gatekeeper.name}`
        };
      }
    }

    this.activeInteraction = nearest;
    const promptEl = document.getElementById('interaction-prompt');
    const promptLabel = document.getElementById('interaction-label');

    if (nearest) {
      promptLabel.textContent = nearest.label;
      promptEl.style.display = 'flex';
    } else {
      promptEl.style.display = 'none';
    }
  }

  renderMinimap() {
    if (!this.world || !this.minimap) return;

    const mw = this.minimap.width;
    const mh = this.minimap.height;
    const mapW = this.world.dimensions.width;
    const mapH = this.world.dimensions.height;
    const S = this.tileSize;

    this.mCtx.clearRect(0, 0, mw, mh);
    this.mCtx.fillStyle = '#0f172a';
    this.mCtx.fillRect(0, 0, mw, mh);

    // Buildings as golden markers
    this.mCtx.fillStyle = '#d4af37';
    for (const b of this.world.buildings) {
      const mx = (b.x / mapW) * mw;
      const my = (b.y / mapH) * mh;
      const bw = Math.max(4, (b.width / mapW) * mw);
      const bh = Math.max(4, (b.height / mapH) * mh);
      this.mCtx.fillRect(mx, my, bw, bh);
    }

    // Player position
    const px = (((this.player.x + (mapW / 2) * S) / (mapW * S))) * mw;
    const py = (((this.player.z + (mapH / 2) * S) / (mapH * S))) * mh;

    this.mCtx.fillStyle = '#22c55e';
    this.mCtx.beginPath();
    this.mCtx.arc(px, py, 4, 0, Math.PI * 2);
    this.mCtx.fill();
    this.mCtx.strokeStyle = '#ffffff';
    this.mCtx.lineWidth = 1;
    this.mCtx.stroke();
  }
}
