/**
 * Solar System Renderer
 * Manages 3D scene with planets and asteroids
 */

import * as THREE from 'three';
import {
  BODY_COLORS,
  PLANET_ORBITS,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_FAR,
  CAMERA_DEFAULT_DISTANCE,
  MOONS,
  ISS_DATA,
  MoonData,
} from '../utils/Constants';
import { orbitalPosition, randomAngle, auToRenderUnits } from '../utils/Math';
import { TextureManager } from './TextureLoader';

export class SolarSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  // Scene objects
  private sun: THREE.Mesh | null = null;
  private planets: Map<string, THREE.Mesh> = new Map();
  private moons: Map<string, THREE.Mesh> = new Map();
  private asteroids: Map<string, THREE.Mesh> = new Map();
  private labels: Map<string, THREE.Sprite> = new Map();
  private circles: Map<string, THREE.LineLoop> = new Map();
  private missionShips: Map<string, { mesh: THREE.Mesh; targetOrbit: number; progress: number }> = new Map();
  private minedAsteroids: Set<string> = new Set();

  // Camera control state
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraRotation = { theta: 0, phi: Math.PI / 4 };
  private cameraDistance = CAMERA_DEFAULT_DISTANCE;
  private cameraTarget = new THREE.Vector3(0, 0, 0);

  // Camera animation
  private isAnimatingCamera = false;
  private animationStartTime = 0;
  private animationDuration = 1500; // ms
  private animationStartPos = new THREE.Vector3();
  private animationEndPos = new THREE.Vector3();
  private animationStartTarget = new THREE.Vector3();
  private animationEndTarget = new THREE.Vector3();
  private animationStartDistance = 0;
  private animationEndDistance = 0;

  // Focus state
  private focusedObject: THREE.Mesh | null = null;

  // Texture manager
  private textureManager: TextureManager;

  // Selection and hover
  private selectedObject: THREE.Mesh | null = null;
  private hoveredObject: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.textureManager = TextureManager.getInstance();

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      CAMERA_NEAR,
      CAMERA_FAR
    );
    this.updateCameraPosition();

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Add lighting
    this.setupLighting();

    // Add starfield
    this.addStarfield();

    // Add solar system objects
    this.addSun();
    this.addPlanets();
    this.addMoons();

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupLighting(): void {
    // Much brighter ambient light for visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Point light at sun (reduced intensity since ambient is brighter)
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 5000);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);
  }

  private addStarfield(): void {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });

    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 4000;
      const y = (Math.random() - 0.5) * 4000;
      const z = (Math.random() - 0.5) * 4000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  private addSun(): void {
    const geometry = new THREE.SphereGeometry(10, 64, 64); // Higher detail for close-up
    // Sun with texture support
    const material = this.textureManager.createSunMaterial();
    this.sun = new THREE.Mesh(geometry, material);
    this.sun.userData = { type: 'sun', name: 'Sun', originalColor: BODY_COLORS.SUN, size: 10 };
    this.scene.add(this.sun);

    // Add glowing aura around sun
    const glowGeometry = new THREE.SphereGeometry(15, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.sun.add(glow);

    // Add label
    this.addLabel('Sun', this.sun);

    // Add circle
    this.addCircle('Sun', 15, 0xffff00);
  }

  private addPlanets(): void {
    const planetData = [
      { name: 'Mercury', orbit: PLANET_ORBITS.MERCURY, size: 1.5, color: BODY_COLORS.MERCURY },
      { name: 'Venus', orbit: PLANET_ORBITS.VENUS, size: 2.5, color: BODY_COLORS.VENUS },
      { name: 'Earth', orbit: PLANET_ORBITS.EARTH, size: 2.5, color: BODY_COLORS.EARTH },
      { name: 'Mars', orbit: PLANET_ORBITS.MARS, size: 2, color: BODY_COLORS.MARS },
      { name: 'Jupiter', orbit: PLANET_ORBITS.JUPITER, size: 8, color: BODY_COLORS.JUPITER },
      { name: 'Saturn', orbit: PLANET_ORBITS.SATURN, size: 7, color: BODY_COLORS.SATURN },
      { name: 'Uranus', orbit: PLANET_ORBITS.URANUS, size: 4, color: BODY_COLORS.URANUS },
      { name: 'Neptune', orbit: PLANET_ORBITS.NEPTUNE, size: 4, color: BODY_COLORS.NEPTUNE },
    ];

    planetData.forEach((planet) => {
      // Higher detail geometry for close-up viewing
      const geometry = new THREE.SphereGeometry(planet.size, 64, 64);
      // Use textured material with fallback color
      const material = this.textureManager.createPlanetMaterial(planet.name, planet.color);
      const mesh = new THREE.Mesh(geometry, material);

      // Position at random point in orbit (for now)
      const angle = randomAngle();
      const pos = orbitalPosition(planet.orbit, angle);
      mesh.position.set(pos.x, pos.y, pos.z);

      mesh.userData = {
        type: 'planet',
        name: planet.name,
        orbit: planet.orbit,
        angle: angle,
        size: planet.size,
      };

      this.scene.add(mesh);
      this.planets.set(planet.name, mesh);

      // Add rings for Saturn
      if (planet.name === 'Saturn') {
        this.addSaturnRings(mesh, planet.size);
      }

      // Add label
      this.addLabel(planet.name, mesh);

      // Add circle
      this.addCircle(planet.name, planet.size * 1.5, planet.color);

      // Add orbit line
      this.addOrbitLine(planet.orbit, planet.color);
    });
  }

  /**
   * Add rings to Saturn
   */
  private addSaturnRings(saturnMesh: THREE.Mesh, planetSize: number): void {
    const innerRadius = planetSize * 1.2;
    const outerRadius = planetSize * 2.2;
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);

    // Rotate UV coordinates for proper texture mapping
    const pos = ringGeometry.attributes.position;
    const uv = ringGeometry.attributes.uv;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      uv.setXY(i, v3.length() < (innerRadius + outerRadius) / 2 ? 0 : 1, 1);
    }

    // Create material with fallback appearance
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xe3d8b8, // Saturn's color as fallback
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });

    // Try to load ring texture asynchronously
    this.textureManager.loadSaturnRingsTexture().then((texture) => {
      if (texture) {
        ringMaterial.map = texture;
        ringMaterial.needsUpdate = true;
        ringMaterial.opacity = 0.9; // More opaque with texture
        console.log('✓ Loaded Saturn rings texture');
      } else {
        console.log('✗ Using fallback appearance for Saturn rings (texture not found)');
      }
    });

    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    // Rotate rings to be horizontal (around the equator)
    rings.rotation.x = Math.PI / 2;

    // Add rings as child of Saturn so they move together
    saturnMesh.add(rings);
  }

  private addOrbitLine(orbitAU: number, color: number): void {
    const points = [];
    const segments = 128;
    const radius = auToRenderUnits(orbitAU);

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle)));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      opacity: 0.6,
      transparent: true,
      linewidth: 2 // Note: linewidth may not work on all platforms, but worth setting
    });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
  }

  /**
   * Convert km to rendering units (scaled appropriately for moons)
   */
  private kmToRenderUnits(km: number): number {
    // Scale: 1 AU = 149,597,871 km = 100 render units
    // So 1 km = 100 / 149,597,871 render units
    return (km * 100) / 149597871;
  }

  /**
   * Add moons to the scene
   */
  private addMoons(): void {
    // Add all moons from the MOONS array
    MOONS.forEach((moonData) => {
      this.addMoon(moonData);
    });

    // Add ISS
    this.addMoon(ISS_DATA);
  }

  /**
   * Add a single moon orbiting a planet
   */
  private addMoon(moonData: MoonData | typeof ISS_DATA): void {
    const parent = this.planets.get(moonData.parent);
    if (!parent) {
      console.warn(`Parent planet ${moonData.parent} not found for moon ${moonData.name}`);
      return;
    }

    const geometry = new THREE.SphereGeometry(moonData.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: moonData.color,
      emissive: moonData.color,
      emissiveIntensity: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Position at random point in orbit around parent
    const angle = randomAngle();
    const orbitRadius = this.kmToRenderUnits(moonData.orbitKm);
    const pos = orbitalPosition(orbitRadius / 100, angle); // orbitalPosition expects AU-like units

    // Position relative to parent planet
    mesh.position.set(
      parent.position.x + pos.x,
      parent.position.y + pos.y,
      parent.position.z + pos.z
    );

    const isSatellite = moonData.name === 'ISS';
    mesh.userData = {
      type: isSatellite ? 'satellite' : 'moon',
      name: moonData.name,
      parent: moonData.parent,
      orbitRadius: orbitRadius,
      angle: angle,
      size: moonData.size,
      orbitalPeriod: moonData.orbitalPeriodDays || 27.3,
    };

    this.scene.add(mesh);
    this.moons.set(moonData.name, mesh);

    // Add label (smaller for moons)
    this.addLabel(moonData.name, mesh);

    // Add circle
    this.addCircle(moonData.name, moonData.size * 1.5, moonData.color);
  }

  /**
   * Add an asteroid to the scene
   */
  public addAsteroid(
    id: string,
    name: string,
    orbitAU: number,
    size: number,
    type: 'C' | 'S' | 'M'
  ): void {
    const colorMap = {
      C: BODY_COLORS.ASTEROID_C,
      S: BODY_COLORS.ASTEROID_S,
      M: BODY_COLORS.ASTEROID_M,
    };

    // Medium detail for asteroids (balance between performance and quality)
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    // Use textured material with fallback color
    const material = this.textureManager.createAsteroidMaterial(type, colorMap[type]);
    const mesh = new THREE.Mesh(geometry, material);

    // Position at random point in orbit
    const angle = randomAngle();
    const pos = orbitalPosition(orbitAU, angle);
    mesh.position.set(pos.x, pos.y, pos.z);

    mesh.userData = {
      type: 'asteroid',
      id: id,
      name: name,
      orbit: orbitAU,
      asteroidType: type,
      angle: angle,
      size: size,
    };

    this.scene.add(mesh);
    this.asteroids.set(id, mesh);

    // Add label
    this.addLabel(name, mesh);

    // Add circle
    this.addCircle(id, size * 2, colorMap[type]);
  }

  /**
   * Create a text label sprite
   */
  private createTextSprite(text: string, color: string = '#ffffff'): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 1280;
    canvas.height = 320;

    // Draw text
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 100px Courier New';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(100, 25, 1); // 2x larger for better visibility when zoomed out

    return sprite;
  }

  /**
   * Add a label to an object
   */
  private addLabel(key: string, parentMesh: THREE.Mesh): void {
    const label = this.createTextSprite(key, '#00ffff');
    label.position.set(0, parentMesh.userData.size * 2 + 6, 0); // Increased offset for larger labels
    parentMesh.add(label);
    this.labels.set(key, label);
  }

  /**
   * Add a circle outline around an object
   */
  private addCircle(key: string, radius: number, color: number): void {
    const segments = 64;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        radius * Math.cos(theta),
        0,
        radius * Math.sin(theta)
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    const circle = new THREE.LineLoop(geometry, material);

    // Position circle at same location as object
    const object = this.sun?.userData.name === key ? this.sun :
                   this.planets.get(key) ||
                   this.moons.get(key) ||
                   this.asteroids.get(key);
    if (object) {
      circle.position.copy(object.position);
      // Store reference to parent object for click detection
      circle.userData = {
        type: 'selection-circle',
        parentObject: object,
        parentKey: key
      };
      this.scene.add(circle);
      this.circles.set(key, circle);
    }
  }

  private setupEventListeners(): void {
    // Mouse controls
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this));
    this.canvas.addEventListener('click', this.onClick.bind(this));

    // Window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private checkHover(event: MouseEvent): void {
    // Calculate mouse position in normalized device coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find intersected objects
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, false);

    let newHover: THREE.Mesh | null = null;

    if (intersects.length > 0) {
      let object = intersects[0].object as THREE.Mesh;

      // If hovering over a selection circle, redirect to parent object
      if (object.userData.type === 'selection-circle') {
        object = object.userData.parentObject;
      }

      if (object.userData.type === 'asteroid' || object.userData.type === 'planet' ||
          object.userData.type === 'sun' || object.userData.type === 'moon' ||
          object.userData.type === 'satellite') {
        newHover = object;
      }
    }

    // If hover changed, update outline and dispatch event
    if (newHover !== this.hoveredObject) {
      // Remove old outline
      if (this.hoveredObject && this.hoveredObject.material instanceof THREE.MeshStandardMaterial) {
        this.hoveredObject.material.emissiveIntensity = this.hoveredObject.userData.type === 'asteroid' ? 0.4 : 0.3;
      } else if (this.hoveredObject && this.hoveredObject.material instanceof THREE.MeshBasicMaterial) {
        // Sun case - reset color
        this.hoveredObject.material.color.setHex(this.hoveredObject.userData.originalColor || BODY_COLORS.SUN);
      }

      this.hoveredObject = newHover;

      // Add new outline (green glow)
      if (this.hoveredObject && this.hoveredObject.material instanceof THREE.MeshStandardMaterial) {
        this.hoveredObject.material.emissiveIntensity = 0.8;
      } else if (this.hoveredObject && this.hoveredObject.material instanceof THREE.MeshBasicMaterial) {
        // Sun case - make it brighter yellow
        this.hoveredObject.material.color.setHex(0xffff80);
      }

      // Dispatch hover event
      const event = new CustomEvent('objectHovered', { detail: this.hoveredObject?.userData || null });
      window.dispatchEvent(event);

      // Change cursor
      this.canvas.style.cursor = this.hoveredObject ? 'pointer' : 'default';
    }
  }

  private onMouseDown(event: MouseEvent): void {
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent): void {
    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    // Check if actually dragging (moved more than 5 pixels)
    const moved = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;

    // Always check for hover if not dragging
    if (!this.isDragging && !moved) {
      this.checkHover(event);
      return;
    }

    if (event.buttons === 0) {
      this.isDragging = false;
      this.checkHover(event);
      return;
    }

    this.isDragging = true;

    if (event.buttons === 1) {
      // Left click: rotate
      this.cameraRotation.theta -= deltaX * 0.005;
      this.cameraRotation.phi -= deltaY * 0.005;
      this.cameraRotation.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraRotation.phi));
    } else if (event.buttons === 2) {
      // Right click: pan
      const panSpeed = 0.5;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);

      this.cameraTarget.addScaledVector(right, -deltaX * panSpeed);
      this.cameraTarget.addScaledVector(up, deltaY * panSpeed);
    }

    this.updateCameraPosition();
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    this.cameraDistance += event.deltaY * 0.1;
    this.cameraDistance = Math.max(50, Math.min(2000, this.cameraDistance));
    this.updateCameraPosition();
  }

  private onClick(event: MouseEvent): void {
    // Don't process clicks during drag
    if (this.isDragging) return;

    // Calculate mouse position in normalized device coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find intersected objects
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, false);

    if (intersects.length > 0) {
      let object = intersects[0].object as THREE.Mesh;

      // If clicked on a selection circle, redirect to parent object
      if (object.userData.type === 'selection-circle') {
        object = object.userData.parentObject;
      }

      if (object.userData.type === 'asteroid' || object.userData.type === 'planet' ||
          object.userData.type === 'sun' || object.userData.type === 'moon' ||
          object.userData.type === 'satellite') {
        this.selectObject(object);
        // Zoom to object
        this.focusOnObject(object);
      }
    } else {
      this.selectObject(null);
    }
  }

  private selectObject(object: THREE.Mesh | null): void {
    // Deselect previous
    if (this.selectedObject && this.selectedObject.material instanceof THREE.MeshStandardMaterial) {
      // Reset to original intensity
      this.selectedObject.material.emissiveIntensity = this.selectedObject.userData.type === 'asteroid' ? 0.4 : 0.3;
    }

    this.selectedObject = object;

    // Highlight new selection by increasing glow (keeps texture visible)
    if (this.selectedObject && this.selectedObject.material instanceof THREE.MeshStandardMaterial) {
      // Just increase intensity, don't change color - this preserves textures!
      this.selectedObject.material.emissiveIntensity = 0.5;
    }

    // Dispatch custom event
    const event = new CustomEvent('objectSelected', { detail: object?.userData || null });
    window.dispatchEvent(event);
  }

  private updateCameraPosition(): void {
    const x =
      this.cameraTarget.x +
      this.cameraDistance * Math.sin(this.cameraRotation.phi) * Math.cos(this.cameraRotation.theta);
    const y = this.cameraTarget.y + this.cameraDistance * Math.cos(this.cameraRotation.phi);
    const z =
      this.cameraTarget.z +
      this.cameraDistance * Math.sin(this.cameraRotation.phi) * Math.sin(this.cameraRotation.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  /**
   * Smoothly animate camera to focus on an object
   */
  public focusOnObject(object: THREE.Mesh | null): void {
    if (!object) {
      // Return to system view
      this.focusedObject = null;
      this.animateCameraTo(new THREE.Vector3(0, 0, 0), CAMERA_DEFAULT_DISTANCE);

      // Dispatch event
      const event = new CustomEvent('cameraFocusChanged', { detail: null });
      window.dispatchEvent(event);
      return;
    }

    this.focusedObject = object;
    const targetPos = object.position.clone();
    const size = object.userData.size || 5;
    const focusDistance = size * 8; // Distance based on object size

    this.animateCameraTo(targetPos, focusDistance);

    // Dispatch event
    const event = new CustomEvent('cameraFocusChanged', { detail: object.userData });
    window.dispatchEvent(event);
  }

  /**
   * Select and focus on an object by name (for search functionality)
   */
  public selectAndFocusByName(name: string, type: 'sun' | 'planet' | 'moon' | 'asteroid' | 'satellite', id?: string): void {
    let object: THREE.Mesh | null = null;

    if (type === 'sun') {
      object = this.sun;
    } else if (type === 'planet') {
      object = this.planets.get(name) || null;
    } else if (type === 'moon' || type === 'satellite') {
      object = this.moons.get(name) || null;
    } else if (type === 'asteroid' && id) {
      object = this.asteroids.get(id) || null;
    }

    if (object) {
      this.selectObject(object);
      this.focusOnObject(object);
    }
  }

  /**
   * Animate camera to a new position
   */
  private animateCameraTo(newTarget: THREE.Vector3, newDistance: number): void {
    this.isAnimatingCamera = true;
    this.animationStartTime = performance.now();
    this.animationStartPos.copy(this.camera.position);
    this.animationStartTarget.copy(this.cameraTarget);
    this.animationStartDistance = this.cameraDistance;

    this.animationEndTarget.copy(newTarget);
    this.animationEndDistance = newDistance;

    // Calculate end position
    const x = newTarget.x + newDistance * Math.sin(this.cameraRotation.phi) * Math.cos(this.cameraRotation.theta);
    const y = newTarget.y + newDistance * Math.cos(this.cameraRotation.phi);
    const z = newTarget.z + newDistance * Math.sin(this.cameraRotation.phi) * Math.sin(this.cameraRotation.theta);
    this.animationEndPos.set(x, y, z);
  }

  /**
   * Update camera animation
   */
  private updateCameraAnimation(currentTime: number): void {
    if (!this.isAnimatingCamera) return;

    const elapsed = currentTime - this.animationStartTime;
    let t = Math.min(elapsed / this.animationDuration, 1);

    // Ease in-out
    t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // Interpolate position
    this.camera.position.lerpVectors(this.animationStartPos, this.animationEndPos, t);
    this.cameraTarget.lerpVectors(this.animationStartTarget, this.animationEndTarget, t);
    this.cameraDistance = this.animationStartDistance + (this.animationEndDistance - this.animationStartDistance) * t;

    this.camera.lookAt(this.cameraTarget);

    if (t >= 1) {
      this.isAnimatingCamera = false;
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Render the scene
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update animation (called every frame)
   * @param deltaTime - Time since last frame in milliseconds
   * @param timeScale - Time scale multiplier (0.001 = real-time, 1.0 = 1 sec per day)
   * @param currentTime - Current performance time
   */
  public update(deltaTime: number, timeScale: number = 1.0, currentTime: number = 0): void {
    // Apply time scale to animation speed
    const scaledDelta = deltaTime * timeScale;

    // Update camera animation
    this.updateCameraAnimation(currentTime);

    // Animate planets in their orbits
    this.planets.forEach((planet, name) => {
      const userData = planet.userData;
      userData.angle += scaledDelta * 0.0001; // Base rotation speed
      const pos = orbitalPosition(userData.orbit, userData.angle);
      planet.position.set(pos.x, pos.y, pos.z);

      // Update circle position
      const circle = this.circles.get(name);
      if (circle) {
        circle.position.copy(planet.position);
      }

      // If this is the focused object, update camera target
      if (this.focusedObject === planet && !this.isAnimatingCamera) {
        this.cameraTarget.copy(planet.position);
        this.updateCameraPosition();
      }
    });

    // Animate asteroids (slightly faster than planets)
    this.asteroids.forEach((asteroid, id) => {
      const userData = asteroid.userData;
      userData.angle += scaledDelta * 0.0002;
      const pos = orbitalPosition(userData.orbit, userData.angle);
      asteroid.position.set(pos.x, pos.y, pos.z);

      // Update circle position
      const circle = this.circles.get(id);
      if (circle) {
        circle.position.copy(asteroid.position);
      }

      // If this is the focused object, update camera target
      if (this.focusedObject === asteroid && !this.isAnimatingCamera) {
        this.cameraTarget.copy(asteroid.position);
        this.updateCameraPosition();
      }
    });

    // Animate moons around their parent planets
    this.moons.forEach((moon, name) => {
      const userData = moon.userData;
      const parent = this.planets.get(userData.parent);
      if (!parent) return;

      // Calculate orbital speed based on period (faster for shorter periods)
      const baseSpeed = 0.0001;
      const speedMultiplier = 30 / (userData.orbitalPeriod || 27.3); // Normalized to Moon's period
      userData.angle += scaledDelta * baseSpeed * speedMultiplier;

      // Calculate position relative to parent planet
      const orbitRadiusAU = userData.orbitRadius / 100; // Convert back to AU-like units
      const relativePos = orbitalPosition(orbitRadiusAU, userData.angle);

      // Set position relative to parent
      moon.position.set(
        parent.position.x + relativePos.x,
        parent.position.y + relativePos.y,
        parent.position.z + relativePos.z
      );

      // Update circle position
      const circle = this.circles.get(name);
      if (circle) {
        circle.position.copy(moon.position);
      }

      // If this is the focused object, update camera target
      if (this.focusedObject === moon && !this.isAnimatingCamera) {
        this.cameraTarget.copy(moon.position);
        this.updateCameraPosition();
      }
    });
  }

  /**
   * Get asteroid count
   */
  public getAsteroidCount(): number {
    return this.asteroids.size;
  }

  /**
   * Mark an asteroid as mined (hides label)
   */
  public setAsteroidMined(asteroidId: string, mined: boolean): void {
    if (mined) {
      this.minedAsteroids.add(asteroidId);
    } else {
      this.minedAsteroids.delete(asteroidId);
    }
    
    // Hide/show label
    const label = this.labels.get(asteroidId);
    if (label) {
      label.visible = !mined;
    }
  }

  /**
   * Check if an asteroid has been mined
   */
  public isAsteroidMined(asteroidId: string): boolean {
    return this.minedAsteroids.has(asteroidId);
  }

  /**
   * Get the current orbital angle for an asteroid
   * Returns angle in radians (0 to 2π)
   */
  public getAsteroidAngle(asteroidId: string): number | null {
    const asteroid = this.asteroids.get(asteroidId);
    if (!asteroid) return null;
    return asteroid.userData.angle;
  }

  /**
   * Get Earth's current orbital angle
   * Returns angle in radians (0 to 2π)
   */
  public getEarthAngle(): number {
    const earth = this.planets.get('Earth');
    if (!earth) return 0;
    return earth.userData.angle;
  }

  /**
   * Create a ship for a mission
   */
  public createMissionShip(missionId: string, targetOrbitAU: number): void {
    // Create a small triangular ship
    const geometry = new THREE.ConeGeometry(1.5, 4, 4);
    geometry.rotateX(Math.PI / 2); // Point forward
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.5,
    });

    const ship = new THREE.Mesh(geometry, material);
    ship.userData = { type: 'ship', missionId };

    // Start at Earth's position
    const earthOrbitUnits = auToRenderUnits(1.0);
    ship.position.set(earthOrbitUnits, 0, 0);

    this.scene.add(ship);
    this.missionShips.set(missionId, { mesh: ship, targetOrbit: targetOrbitAU, progress: 0 });
  }

  /**
   * Update ship position based on mission progress
   */
  public updateMissionShipProgress(missionId: string, progress: number): void {
    const shipData = this.missionShips.get(missionId);
    if (!shipData) return;

    shipData.progress = progress;

    // Calculate position along trajectory
    // Simplified: linear interpolation from Earth (1 AU) to target and back
    const earthOrbit = 1.0;
    const targetOrbit = shipData.targetOrbit;
    
    let currentOrbit: number;
    let angle: number;
    
    if (progress < 0.33) {
      // Outbound phase
      const t = progress / 0.33;
      currentOrbit = earthOrbit + (targetOrbit - earthOrbit) * t;
      angle = t * Math.PI; // Travel half orbit
    } else if (progress < 0.67) {
      // Mining phase - orbit around asteroid
      currentOrbit = targetOrbit;
      const t = (progress - 0.33) / 0.34;
      angle = Math.PI + t * 0.5; // Small orbit movement
    } else {
      // Return phase
      const t = (progress - 0.67) / 0.33;
      currentOrbit = targetOrbit + (earthOrbit - targetOrbit) * t;
      angle = Math.PI * 1.5 + t * Math.PI * 0.5;
    }

    const orbitUnits = auToRenderUnits(currentOrbit);
    shipData.mesh.position.set(
      Math.cos(angle) * orbitUnits,
      0,
      Math.sin(angle) * orbitUnits
    );

    // Point ship in direction of travel
    const nextAngle = angle + 0.1;
    const lookX = Math.cos(nextAngle) * orbitUnits;
    const lookZ = Math.sin(nextAngle) * orbitUnits;
    shipData.mesh.lookAt(lookX, 0, lookZ);
  }

  /**
   * Focus camera on a mission ship
   */
  public focusOnMissionShip(missionId: string): void {
    const shipData = this.missionShips.get(missionId);
    if (!shipData) return;

    this.focusOnObject(shipData.mesh);
  }

  /**
   * Remove a mission ship
   */
  public removeMissionShip(missionId: string): void {
    const shipData = this.missionShips.get(missionId);
    if (!shipData) return;

    this.scene.remove(shipData.mesh);
    shipData.mesh.geometry.dispose();
    if (shipData.mesh.material instanceof THREE.Material) {
      shipData.mesh.material.dispose();
    }
    this.missionShips.delete(missionId);
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.renderer.dispose();
    this.scene.clear();
  }
}
