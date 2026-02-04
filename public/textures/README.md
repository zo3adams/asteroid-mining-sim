# Texture Resources for Asteroid Miner

## Where to Get Textures

### NASA Solar System Textures (Public Domain)
Best source for high-quality, scientifically accurate textures.

**Solar System Scope** (Free for non-commercial use)
- URL: https://www.solarsystemscope.com/textures/
- License: Free for non-commercial projects
- Available: All planets, moons, Sun
- Resolution: Up to 8K

**NASA 3D Resources**
- URL: https://nasa3d.arc.nasa.gov/images
- License: Public Domain
- Available: Planets, asteroids, spacecraft

**Planet Pixel Emporium** (Free for non-commercial)
- URL: http://planetpixelemporium.com/planets.html
- License: Free for non-commercial use
- Available: All planets with color, bump, and specular maps
- Resolution: Up to 4K

## Required Textures

### Planets (in order of priority)
Place these in `public/textures/planets/`:

1. **mercury.jpg** - Mercury surface
2. **venus.jpg** - Venus atmosphere/surface
3. **earth.jpg** - Earth (Blue Marble)
4. **mars.jpg** - Mars surface
5. **jupiter.jpg** - Jupiter cloud bands
6. **saturn.jpg** - Saturn (with rings as separate texture)
7. **saturn-rings.png** - Saturn rings (transparent PNG)
8. **uranus.jpg** - Uranus
9. **neptune.jpg** - Neptune
10. **sun.jpg** - Sun surface

### Optional Enhancement Maps
- **earth-night.jpg** - Earth city lights (for night side)
- **earth-clouds.png** - Earth clouds (transparent overlay)
- **mars-normal.jpg** - Mars height/normal map
- **moon.jpg** - Moon surface (for future use)

### Asteroids
Place these in `public/textures/asteroids/`:

1. **asteroid-grey.jpg** - Generic grey rocky texture
2. **asteroid-carbon.jpg** - Dark carbonaceous texture (C-type)
3. **asteroid-metal.jpg** - Metallic texture (M-type)

## Recommended Resolutions

- **For Development**: 1K (1024x512)
- **For Production**: 2K (2048x1024)
- **Close-up planets**: 4K (4096x2048)
- **Asteroids**: 512x512 or 1024x1024

## Quick Start Downloads

### Option 1: Solar System Scope (Easiest)
1. Visit: https://www.solarsystemscope.com/textures/
2. Download the 2K textures for each planet
3. Rename to match the filenames above
4. Place in `public/textures/planets/`

### Option 2: NASA (Most Authentic)
1. Visit: https://nasa3d.arc.nasa.gov/images
2. Search for each planet name
3. Download color maps
4. Place in `public/textures/planets/`

### Option 3: We Provide Placeholder
We've included a placeholder texture loader that will:
- Use solid colors if no textures found
- Log which textures are missing
- Allow hot-swapping textures without restart

## Texture Format Notes

- Use **JPG** for color maps (smaller file size)
- Use **PNG** for transparency (rings, clouds)
- Power-of-2 dimensions for best performance (512, 1024, 2048, 4096)
- sRGB color space (default)

## Copyright & Attribution

All NASA images are **public domain** and can be used freely.

Solar System Scope textures are **free for non-commercial use** - include attribution:
```
Textures courtesy of Solar System Scope (https://www.solarsystemscope.com)
```

Planet Pixel Emporium textures are **free for non-commercial use** - include attribution:
```
Textures courtesy of James Hastings-Trew (http://planetpixelemporium.com)
```

## Adding Textures to the Game

1. Place texture files in the appropriate directory
2. The game will automatically detect and load them
3. No code changes needed for basic textures
4. Refresh the browser to see changes

## Testing Without Textures

The game will work without textures and fall back to colored spheres. Add textures gradually as you find/download them.
