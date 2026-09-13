import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Coordinates, RouteData, AppPhase } from '../../types';

interface GlobeViewProps {
  routeData: RouteData | null;
  phase: AppPhase;
  drawProgress: number; // 0 to 1
  onCursorMove?: (coords: Coordinates) => void;
  onCameraChange?: (info: { heading: number; tilt: number; cameraAltKm: number }) => void;
  externalControlRef?: React.MutableRefObject<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetNorth: () => void;
    resetView: () => void;
  } | null>;
}

export const GlobeView: React.FC<GlobeViewProps> = ({
  routeData,
  phase,
  drawProgress,
  onCursorMove,
  onCameraChange,
  externalControlRef,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const trajectoryRibbonRef = useRef<THREE.Mesh | null>(null);
  const trajectoryCoreLineRef = useRef<THREE.Line | null>(null);
  const trajectoryTipRef = useRef<THREE.Mesh | null>(null);
  const startMarkerRef = useRef<THREE.Group | null>(null);
  const endMarkerRef = useRef<THREE.Group | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);

  // Interaction & Camera orbit state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraDistanceRef = useRef(3.2); // Earth radius is 1.0; 3.2 is ~14,000 km
  const targetCameraDistanceRef = useRef(3.2);
  const targetRotationRef = useRef({ x: 0.2, y: 0 });
  const currentRotationRef = useRef({ x: 0.2, y: 0 });
  const isAutoSpinningRef = useRef(true);

  // Target camera focus for animations
  const cameraAnimationRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startDist: number;
    targetX: number;
    targetY: number;
    targetDist: number;
    startTime: number;
    duration: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startDist: 3.2,
    targetX: 0,
    targetY: 0,
    targetDist: 3.2,
    startTime: 0,
    duration: 1500,
  });

  // Convert (lat, lng) to 3D Cartesian on sphere of radius R
  const geoToVector = useCallback((lat: number, lng: number, radius: number = 1.0): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#000000');

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);
    camera.position.set(0, 0, cameraDistanceRef.current);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting: Pure high-contrast neutral lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // 5. Earth Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // Load Earth Texture & Create High-Contrast Black and White Shader Material
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/textures/earth_atmos_2048.jpg', (texture) => {
      texture.anisotropy = 8;

      // Custom Shader for Photorealistic High-Contrast Grayscale Earth
      const earthMaterial = new THREE.ShaderMaterial({
        uniforms: {
          earthTexture: { value: texture },
          sunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D earthTexture;
          uniform vec3 sunDirection;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            vec4 texColor = texture2D(earthTexture, vUv);

            // True photometric grayscale conversion
            float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

            // Stark high-contrast black & white curve (deep pure black oceans, crisp brilliant white land)
            float contrast = smoothstep(0.15, 0.65, gray);
            contrast = pow(contrast, 1.25) * 1.45;
            contrast = clamp(contrast, 0.0, 1.0);

            vec3 monoColor = vec3(contrast);

            // High-contrast directional lighting
            vec3 viewDir = normalize(-vPosition);
            vec3 lightDir = normalize(sunDirection);
            float NdotL = max(dot(vNormal, lightDir), 0.0);
            float diffuse = 0.15 + 0.85 * NdotL;

            // Pure silver/monochrome atmospheric Fresnel rim
            float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.2);
            vec3 rim = vec3(1.0, 1.0, 1.0) * fresnel * 0.45;

            gl_FragColor = vec4(monoColor * diffuse + rim, 1.0);
          }
        `,
      });

      const earthSphere = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64), earthMaterial);
      earthGroup.add(earthSphere);

      // Graticules (Monochrome Latitude & Longitude lines overlay)
      const graticuleGeom = new THREE.SphereGeometry(1.0005, 36, 18);
      const graticuleMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.05,
      });
      const graticuleSphere = new THREE.Mesh(graticuleGeom, graticuleMat);
      earthGroup.add(graticuleSphere);
    });

    // 6. Atmospheric Halo Outer Sphere (Pure Silver / Monochrome)
    const atmosphereGeom = new THREE.SphereGeometry(1.025, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.8);
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * intensity * 0.45;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    scene.add(atmosphereMesh);
    atmosphereRef.current = atmosphereMesh;

    // 7. Subtle Starfield Background
    const starGeom = new THREE.BufferGeometry();
    const starCount = 1200;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 80;
      starCoords[i + 1] = (Math.random() - 0.5) * 80;
      starCoords[i + 2] = (Math.random() - 0.5) * 80;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18,
      transparent: true,
      opacity: 0.4,
    });
    const starPoints = new THREE.Points(starGeom, starMat);
    scene.add(starPoints);

    // Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Handle Camera Tweens / Animations
      if (cameraAnimationRef.current.active) {
        const anim = cameraAnimationRef.current;
        const elapsed = time - anim.startTime;
        const p = Math.min(1, elapsed / anim.duration);
        // Smooth cubic ease out
        const ease = 1 - Math.pow(1 - p, 3);

        currentRotationRef.current.x = anim.startX + (anim.targetX - anim.startX) * ease;
        currentRotationRef.current.y = anim.startY + (anim.targetY - anim.startY) * ease;
        cameraDistanceRef.current = anim.startDist + (anim.targetDist - anim.startDist) * ease;

        if (p >= 1) {
          anim.active = false;
        }
      } else {
        // Natural damping towards target rotation & zoom
        currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;
        cameraDistanceRef.current += (targetCameraDistanceRef.current - cameraDistanceRef.current) * 0.08;

        // Ambient idle rotation when not dragging
        if (isAutoSpinningRef.current && !isDraggingRef.current) {
          targetRotationRef.current.y += 0.035 * delta;
        }
      }

      // Apply rotation to Earth Group
      if (earthGroupRef.current) {
        earthGroupRef.current.rotation.x = currentRotationRef.current.x;
        earthGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      // Update camera distance
      if (cameraRef.current) {
        cameraRef.current.position.z = cameraDistanceRef.current;
      }

      // Dynamically update trajectory ribbon thickness uniform based on camera distance
      if (trajectoryRibbonRef.current) {
        const mat = trajectoryRibbonRef.current.material as THREE.ShaderMaterial;
        if (mat?.uniforms?.uCameraDist) {
          mat.uniforms.uCameraDist.value = cameraDistanceRef.current;
        }
      }

      // Report telemetry to HUD
      if (onCameraChange) {
        const headingDeg = ((-currentRotationRef.current.y * (180 / Math.PI)) % 360 + 360) % 360;
        const tiltDeg = Math.round(currentRotationRef.current.x * (180 / Math.PI));
        const altKm = (cameraDistanceRef.current - 1.0) * 6378.137;
        onCameraChange({
          heading: Math.round(headingDeg),
          tilt: tiltDeg,
          cameraAltKm: Math.round(altKm),
        });
      }

      renderer.render(scene, camera);
    };

    animate(performance.now());

    // Keyboard shortcuts for manual zoom
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '+' || e.key === '=' || e.key === 'NumpadAdd') {
        targetCameraDistanceRef.current = Math.max(1.06, targetCameraDistanceRef.current - 0.35);
      } else if (e.key === '-' || e.key === '_' || e.key === 'NumpadSubtract') {
        targetCameraDistanceRef.current = Math.min(6.0, targetCameraDistanceRef.current + 0.35);
      } else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        targetRotationRef.current = { x: 0.2, y: 0 };
        targetCameraDistanceRef.current = 3.2;
        isAutoSpinningRef.current = true;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Raycaster for cursor coordinates
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !earthGroupRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(earthGroupRef.current.children, true);
    if (intersects.length > 0) {
      const point = intersects[0].point.clone();
      point.applyEuler(new THREE.Euler(-currentRotationRef.current.x, -currentRotationRef.current.y, 0, 'YXZ'));
      point.normalize();

      const lat = Math.asin(Math.max(-1, Math.min(1, point.y))) * (180 / Math.PI);
      const lng = -Math.atan2(point.z, point.x) * (180 / Math.PI) - 90;
      let normLng = ((lng + 180) % 360) - 180;
      if (normLng < -180) normLng += 360;

      if (onCursorMove) {
        onCursorMove({ lat, lng: normLng });
      }
    }
  };

  // Mouse & Touch Drag Controls
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    isAutoSpinningRef.current = false;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handlePointerDrag = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    targetRotationRef.current.y += deltaX * 0.005;
    targetRotationRef.current.x += deltaY * 0.005;

    // Clamp X rotation to prevent flipping upside down
    targetRotationRef.current.x = Math.max(-1.4, Math.min(1.4, targetRotationRef.current.x));

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  // Wheel Zoom (allows closer zooming down to 1.06)
  const handleWheel = (e: React.WheelEvent) => {
    targetCameraDistanceRef.current = Math.max(1.06, Math.min(6.0, targetCameraDistanceRef.current + e.deltaY * 0.002));
  };

  // Double click to zoom in manually towards center
  const handleDoubleClick = () => {
    targetCameraDistanceRef.current = Math.max(1.06, targetCameraDistanceRef.current - 0.45);
  };

  // Expose external controls for HUD buttons
  useEffect(() => {
    if (!externalControlRef) return;
    externalControlRef.current = {
      zoomIn: () => {
        targetCameraDistanceRef.current = Math.max(1.06, targetCameraDistanceRef.current - 0.35);
      },
      zoomOut: () => {
        targetCameraDistanceRef.current = Math.min(6.0, targetCameraDistanceRef.current + 0.35);
      },
      resetNorth: () => {
        targetRotationRef.current.y = 0;
      },
      resetView: () => {
        targetRotationRef.current = { x: 0.2, y: 0 };
        targetCameraDistanceRef.current = 3.2;
        isAutoSpinningRef.current = true;
      },
    };
  }, [externalControlRef]);

  // Helper to create a vibrant 3D Location Marker Pin
  const createLocationMarker = (lat: number, lng: number, colorHex: number): THREE.Group => {
    const group = new THREE.Group();
    const pos = geoToVector(lat, lng, 1.002);
    group.position.copy(pos);

    // Orient marker outward along normal
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());

    // Stem cylinder
    const stemGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.05, 8);
    stemGeom.translate(0, 0.025, 0);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stem = new THREE.Mesh(stemGeom, stemMat);
    group.add(stem);

    // Glowing Sphere Pin Head
    const headGeom = new THREE.SphereGeometry(0.018, 16, 16);
    headGeom.translate(0, 0.055, 0);
    const headMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const head = new THREE.Mesh(headGeom, headMat);
    group.add(head);

    // Ground Pulse Ring
    const ringGeom = new THREE.RingGeometry(0.015, 0.024, 24);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    group.add(ring);

    return group;
  };

  /**
   * Helper to build a 3D Surface Ribbon Mesh for the trajectory path.
   * Unlike THREE.Line (which is locked to 1px by WebGL), this 3D ribbon has real physical width
   * on the sphere surface (~45 km corridor) and perspectives scales up and down naturally
   * when the user zooms in or out!
   */
  const createRibbonMesh = (vectors: THREE.Vector3[]): THREE.Mesh => {
    const count = vectors.length;
    if (count < 2) return new THREE.Mesh();

    const positions: number[] = [];
    const binormals: number[] = [];
    const sides: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < count; i++) {
      const P = vectors[i];
      const N = P.clone().normalize();

      let T: THREE.Vector3;
      if (i === 0) {
        T = vectors[1].clone().sub(P).normalize();
      } else if (i === count - 1) {
        T = P.clone().sub(vectors[i - 1]).normalize();
      } else {
        T = vectors[i + 1].clone().sub(vectors[i - 1]).normalize();
      }

      // Lateral bi-normal along sphere surface: B = normalize(N x T)
      const B = new THREE.Vector3().crossVectors(N, T).normalize();

      // Left vertex (side = -1)
      positions.push(P.x, P.y, P.z);
      binormals.push(B.x, B.y, B.z);
      sides.push(-1.0);

      // Right vertex (side = +1)
      positions.push(P.x, P.y, P.z);
      binormals.push(B.x, B.y, B.z);
      sides.push(1.0);

      const progress = i / (count - 1);
      uvs.push(0, progress);
      uvs.push(1, progress);

      if (i < count - 1) {
        const idx = i * 2;
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('aBinormal', new THREE.Float32BufferAttribute(binormals, 3));
    geom.setAttribute('aSide', new THREE.Float32BufferAttribute(sides, 1));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);

    // Glowing Neon Trajectory Material with dynamic distance-based thickness
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uCameraDist: { value: cameraDistanceRef.current },
      },
      vertexShader: `
        uniform float uCameraDist;
        attribute vec3 aBinormal;
        attribute float aSide;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          // Dynamic scaling:
          // In space orbit (uCameraDist >= 3.0), line is bold, thick (~0.012 - 0.018 halfWidth)
          // At surface level (uCameraDist ~ 1.14), line is refined and appropriately thin-thick (~0.0045 halfWidth)
          float normDist = clamp(uCameraDist, 1.05, 6.0);
          float scale = pow(normDist / 3.0, 0.85);
          float halfWidth = 0.011 * scale;

          vec3 displaced = position + aBinormal * (aSide * halfWidth);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          float distFromCenter = abs(vUv.x - 0.5) * 2.0;
          float core = 1.0 - smoothstep(0.0, 0.35, distFromCenter);
          float aura = 1.0 - smoothstep(0.05, 1.0, distFromCenter);

          vec3 coreColor = vec3(1.0, 1.0, 1.0);
          vec3 auraColor = vec3(0.0, 0.88, 1.0);

          vec3 color = mix(auraColor, coreColor, core);
          float alpha = clamp(aura * 0.95 + core * 0.5, 0.0, 1.0);

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    return new THREE.Mesh(geom, mat);
  };

  // Build / Update Route Line & Markers
  useEffect(() => {
    if (!earthGroupRef.current) return;
    const earthGroup = earthGroupRef.current;

    // Clean up previous route objects
    if (trajectoryRibbonRef.current) {
      earthGroup.remove(trajectoryRibbonRef.current);
      trajectoryRibbonRef.current = null;
    }
    if (trajectoryCoreLineRef.current) {
      earthGroup.remove(trajectoryCoreLineRef.current);
      trajectoryCoreLineRef.current = null;
    }
    if (trajectoryTipRef.current) {
      earthGroup.remove(trajectoryTipRef.current);
      trajectoryTipRef.current = null;
    }
    if (startMarkerRef.current) {
      earthGroup.remove(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      earthGroup.remove(endMarkerRef.current);
      endMarkerRef.current = null;
    }

    if (!routeData) return;

    const { from, to, coordinates } = routeData;

    // Create Start Marker (Emerald #10b981)
    const startMarker = createLocationMarker(from.coords.lat, from.coords.lng, 0x10b981);
    earthGroup.add(startMarker);
    startMarkerRef.current = startMarker;

    // Create Destination Marker (Rose #f43f5e)
    const endMarker = createLocationMarker(to.coords.lat, to.coords.lng, 0xf43f5e);
    earthGroup.add(endMarker);
    endMarkerRef.current = endMarker;

    // Build Trajectory Coordinates (radius 1.004 to cleanly float above surface)
    const totalPoints = coordinates.length;
    const pointsToInclude = Math.max(2, Math.floor(totalPoints * Math.min(1, Math.max(0, drawProgress))));
    const vectors: THREE.Vector3[] = [];

    for (let i = 0; i < pointsToInclude; i++) {
      const c = coordinates[i];
      vectors.push(geoToVector(c.lat, c.lng, 1.004));
    }

    // 1. Scalable 3D Ribbon with dynamic distance-based thickness
    const ribbon = createRibbonMesh(vectors);
    earthGroup.add(ribbon);
    trajectoryRibbonRef.current = ribbon;

    // 2. Crisp Center Core Line for long-range sharpness
    const lineGeom = new THREE.BufferGeometry().setFromPoints(vectors);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const coreLine = new THREE.Line(lineGeom, lineMat);
    earthGroup.add(coreLine);
    trajectoryCoreLineRef.current = coreLine;

    // 3. Active Leading Tip Beacon Particle
    if (pointsToInclude > 1 && pointsToInclude < totalPoints) {
      const tipPos = vectors[vectors.length - 1];
      const tipGeom = new THREE.SphereGeometry(0.016, 16, 16);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const tip = new THREE.Mesh(tipGeom, tipMat);
      tip.position.copy(tipPos);
      earthGroup.add(tip);
      trajectoryTipRef.current = tip;
    }
  }, [routeData, drawProgress, geoToVector]);

  // Handle Cinematic Animation Phases
  useEffect(() => {
    if (!routeData) return;

    if (phase === 'dive_to_departure') {
      // Step 1: Smooth 3D camera dive from space orbit down into departure airfield
      const startLat = routeData.from.coords.lat;
      const startLng = routeData.from.coords.lng;

      const targetX = (startLat * Math.PI) / 180;
      const targetY = -((startLng + 90) * Math.PI) / 180;

      cameraAnimationRef.current = {
        active: true,
        startX: currentRotationRef.current.x,
        startY: currentRotationRef.current.y,
        startDist: cameraDistanceRef.current,
        targetX: Math.max(-1.3, Math.min(1.3, targetX)),
        targetY: targetY,
        targetDist: cameraDistanceRef.current, // Keep current altitude — no zoom in
        startTime: performance.now(),
        duration: 1400,
      };
      isAutoSpinningRef.current = false;
    } else if (phase === 'local_sector_2d') {
      // Step 2: Hold current altitude while 2D radar overlay is displayed
      targetCameraDistanceRef.current = cameraDistanceRef.current;
      isAutoSpinningRef.current = false;
    } else if (phase === 'zoom_out_to_globe') {
      // Step 3: Smoothly pan back toward the global overview (altitude left unchanged — no automatic zoom)
      cameraAnimationRef.current = {
        active: true,
        startX: currentRotationRef.current.x,
        startY: currentRotationRef.current.y,
        startDist: cameraDistanceRef.current,
        targetX: 0.25,
        targetY: currentRotationRef.current.y + 0.35,
        targetDist: cameraDistanceRef.current, // Keep current altitude — no automatic zoom
        startTime: performance.now(),
        duration: 1400,
      };
    } else if (phase === 'settled') {
      // Step 4: Route drawing complete — keep camera at its current orbital position.
      // Just sync target refs so damping doesn't drift, and gently resume auto-spin.
      targetRotationRef.current.x = currentRotationRef.current.x;
      targetRotationRef.current.y = currentRotationRef.current.y;
      targetCameraDistanceRef.current = cameraDistanceRef.current;
      isAutoSpinningRef.current = true;
    }
  }, [phase, routeData]);

  return (
    <div
      ref={mountRef}
      onPointerDown={handlePointerDown}
      onPointerMove={(e) => {
        handlePointerDrag(e);
        handlePointerMove(e);
      }}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden select-none"
    />
  );
};
