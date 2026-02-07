/**
 * Texture loading and management
 */

import * as THREE from 'three';

export class TextureManager {
  private static instance: TextureManager;
  private loader: THREE.TextureLoader;
  private textures: Map<string, THREE.Texture> = new Map();
  private loadingPromises: Map<string, Promise<THREE.Texture>> = new Map();

  private constructor() {
    this.loader = new THREE.TextureLoader();
  }

  private applyTextureDefaults(texture: THREE.Texture): void {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }

  public static getInstance(): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager();
    }
    return TextureManager.instance;
  }

  /**
   * Load a texture from a URL
   * Returns cached texture if already loaded
   */
  public async loadTexture(url: string): Promise<THREE.Texture | null> {
    // Check cache first
    if (this.textures.has(url)) {
      return this.textures.get(url)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Start loading
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // Success
          this.applyTextureDefaults(texture);
          this.textures.set(url, texture);
          this.loadingPromises.delete(url);
          resolve(texture);
        },
        undefined,
        (error) => {
          // Error
          console.warn(`Failed to load texture: ${url}`, error);
          this.loadingPromises.delete(url);
          reject(error);
        }
      );
    });

    this.loadingPromises.set(url, promise);

    try {
      return await promise;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load planet texture
   */
  public async loadPlanetTexture(planetName: string): Promise<THREE.Texture | null> {
    const filename = planetName.toLowerCase() + '.jpg';
    const url = `/textures/planets/${filename}`;
    return this.loadTexture(url);
  }

  /**
   * Load Sun texture
   */
  public async loadSunTexture(): Promise<THREE.Texture | null> {
    return this.loadTexture('/textures/planets/sun.jpg');
  }

  /**
   * Load asteroid texture by type
   */
  public async loadAsteroidTexture(type: 'C' | 'S' | 'M'): Promise<THREE.Texture | null> {
    const typeMap: Record<string, string> = {
      C: 'asteroid-carbon.jpg',
      S: 'asteroid-grey.jpg',
      M: 'asteroid-metal.jpg',
    };
    // Fallback to grey texture for unknown/undefined types
    const filename = typeMap[type] || 'asteroid-grey.jpg';
    const url = `/textures/asteroids/${filename}`;
    return this.loadTexture(url);
  }

  /**
   * Load Saturn rings texture
   */
  public async loadSaturnRingsTexture(): Promise<THREE.Texture | null> {
    return this.loadTexture('/textures/planets/saturn-rings.png');
  }

  /**
   * Preload all planet textures
   */
  public async preloadPlanetTextures(): Promise<void> {
    const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
    const promises = planets.map(planet => this.loadPlanetTexture(planet));

    // Also load sun
    promises.push(this.loadSunTexture());

    // Load asteroid textures
    promises.push(this.loadAsteroidTexture('C'));
    promises.push(this.loadAsteroidTexture('S'));
    promises.push(this.loadAsteroidTexture('M'));

    // Wait for all (but don't fail if some are missing)
    await Promise.allSettled(promises);
  }

  /**
   * Create a textured material for a planet
   */
  public createPlanetMaterial(
    planetName: string,
    fallbackColor: number
  ): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: fallbackColor,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      roughness: 0.8,
      metalness: 0.0,
    });

    // Load texture asynchronously
    this.loadPlanetTexture(planetName).then((texture) => {
      if (texture) {
        material.map = texture;
        material.needsUpdate = true;
        console.log(`✓ Loaded texture for ${planetName}`);
      } else {
        console.log(`✗ Using fallback color for ${planetName} (texture not found)`);
      }
    });

    return material;
  }

  /**
   * Create a textured material for the Sun
   */
  public createSunMaterial(): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    this.loadSunTexture().then((texture) => {
      if (texture) {
        material.map = texture;
        material.needsUpdate = true;
        console.log('✓ Loaded texture for Sun');
      } else {
        console.log('✗ Using fallback color for Sun (texture not found)');
      }
    });

    return material;
  }

  /**
   * Create a textured material for an asteroid
   */
  public createAsteroidMaterial(
    type: 'C' | 'S' | 'M',
    fallbackColor: number
  ): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: fallbackColor,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      roughness: 0.9,
      metalness: type === 'M' ? 0.2 : 0.0,
    });

    this.loadAsteroidTexture(type).then((texture) => {
      if (texture) {
        material.map = texture;
        material.needsUpdate = true;
        console.log(`✓ Loaded texture for ${type}-type asteroid`);
      }
    });

    return material;
  }

  /**
   * Dispose of all textures
   */
  public dispose(): void {
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
    this.loadingPromises.clear();
  }
}
