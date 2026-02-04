# How the Texture System Works

## Overview

The game now supports realistic texture mapping for all celestial bodies. Textures are **optional** - the game works perfectly without them using colored spheres as fallback.

## Architecture

### TextureManager (`src/rendering/TextureLoader.ts`)
Singleton class that handles all texture loading:
- Loads textures asynchronously
- Caches loaded textures (no duplicate loading)
- Provides fallback to colored materials
- Logs success/failure to console

### Integration with SolarSystem
1. When creating a planet/asteroid, request textured material
2. Material starts with fallback color
3. Texture loads in background
4. When loaded, material updates automatically
5. No game pause or stuttering

## Texture Loading Flow

```
Game Start
    ↓
Create Planet Mesh
    ↓
Request Textured Material (fallback color)
    ↓
Add to Scene (visible immediately)
    ↓
[Background] Attempt to load texture file
    ↓
Success? → Update material with texture
Failure? → Keep using fallback color
```

## File Naming Convention

### Planets
Format: `{planet-name}.jpg`
- All lowercase
- No spaces
- Example: `earth.jpg`, `saturn.jpg`

### Asteroids
Format: `asteroid-{type}.jpg`
- C-type → `asteroid-carbon.jpg`
- S-type → `asteroid-grey.jpg`
- M-type → `asteroid-metal.jpg`

### Special Cases
- Sun: `sun.jpg`
- Saturn Rings: `saturn-rings.png` (with transparency)

## Material Properties

### Planets
```typescript
MeshStandardMaterial {
  map: texture (if available),
  color: fallbackColor,
  emissive: fallbackColor,
  emissiveIntensity: 0.3,
  roughness: 0.9,
  metalness: 0.0
}
```

### Sun
```typescript
MeshBasicMaterial {
  map: texture (if available),
  color: fallbackColor
}
```

### Asteroids
```typescript
MeshStandardMaterial {
  map: texture (if available),
  color: fallbackColor,
  emissive: fallbackColor,
  emissiveIntensity: 0.4,
  roughness: 1.0,
  metalness: 0.5 (for M-type) or 0.0
}
```

## Geometry Detail Levels

We increased polygon count for better texture quality:

| Object Type | Old | New | Reason |
|------------|-----|-----|---------|
| Sun | 32x32 | 64x64 | Close-up viewing |
| Planets | 32x32 | 64x64 | Smooth textures |
| Asteroids | 16x16 | 32x32 | Balance quality/performance |

## Console Logging

When textures load, you'll see:
```
✓ Loaded texture for Earth
✓ Loaded texture for Mars
✓ Loaded texture for Sun
✗ Using fallback color for Venus (texture not found)
```

This helps you know which textures are working.

## Adding New Textures

1. Drop texture file in correct folder
2. Ensure filename matches convention
3. Refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
4. Check console for success message
5. Zoom in on object to see texture!

No code changes needed!

## Performance Considerations

### Texture Size vs Quality
- **512x256**: Low quality, fast loading
- **1024x512 (1K)**: Good quality, recommended for asteroids
- **2048x1024 (2K)**: High quality, recommended for planets
- **4096x2048 (4K)**: Very high, only for close-up focus

### Loading Strategy
- Textures load asynchronously (non-blocking)
- Cached after first load (instant on revisit)
- Multiple objects share same texture (memory efficient)
- Failed loads don't retry (graceful fallback)

### Memory Usage
Approximate VRAM usage:
- 1K texture: ~4 MB
- 2K texture: ~16 MB
- 4K texture: ~64 MB

For 10 planets @ 2K: ~160 MB VRAM (very reasonable)

## Future Enhancements

### Normal/Bump Maps
Add height detail:
```typescript
material.normalMap = texture;
material.bumpMap = texture;
```

### Night Lights (Earth)
Show cities at night:
```typescript
material.emissiveMap = nightTexture;
```

### Cloud Layers (Earth)
Separate transparent cloud layer:
```typescript
const cloudMaterial = new THREE.MeshStandardMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.8
});
```

### Animated Textures (Sun)
Scrolling texture for solar activity:
```typescript
material.map.offset.x += deltaTime * 0.001;
```

### Ring Systems (Saturn)
Already supported! Just needs:
- `saturn-rings.png` texture
- Separate ring geometry
- Transparent material

## Troubleshooting

### Textures not appearing?
1. Check browser console for errors
2. Verify filename matches exactly (case-sensitive!)
3. Check file is in correct folder
4. Try hard refresh (Ctrl+Shift+R)
5. Check file format (JPG for color, PNG for transparency)

### Textures look stretched?
- Ensure texture is 2:1 aspect ratio (equirectangular)
- Example: 2048x1024, 4096x2048, etc.

### Performance issues?
- Use 2K instead of 4K textures
- Use JPG instead of PNG (smaller)
- Reduce texture count (prioritize visible planets)

### Texture appears upside down?
- Some texture sources flip textures
- Can fix in code: `texture.wrapT = THREE.RepeatWrapping; texture.repeat.y = -1;`

## Credits & Attribution

When using textures from these sources, add to game credits:

**Solar System Scope:**
```
Planet textures courtesy of Solar System Scope
https://www.solarsystemscope.com
```

**NASA:**
```
NASA imagery - Public Domain
https://nasa3d.arc.nasa.gov
```

**Planet Pixel Emporium:**
```
Textures by James Hastings-Trew
http://planetpixelemporium.com
```
