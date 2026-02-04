# Texture Setup Guide

## Quick Start - Get Free Textures Now!

The game is set up to use textures, but they're not included in the repository (they're large files). Here's how to add them:

### Option 1: Solar System Scope (Recommended - Easiest)

**Best for: Quick setup, high quality**

1. Visit: https://www.solarsystemscope.com/textures/
2. Scroll down to the texture downloads
3. Download these **2K Color Maps** (they're free!):
   - Sun
   - Mercury
   - Venus
   - Earth
   - Mars
   - Jupiter
   - Saturn (+ Saturn Rings)
   - Uranus
   - Neptune

4. Rename the files:
   - `2k_sun.jpg` → `sun.jpg`
   - `2k_mercury.jpg` → `mercury.jpg`
   - `2k_venus_surface.jpg` → `venus.jpg`
   - `2k_earth_daymap.jpg` → `earth.jpg`
   - `2k_mars.jpg` → `mars.jpg`
   - `2k_jupiter.jpg` → `jupiter.jpg`
   - `2k_saturn.jpg` → `saturn.jpg`
   - `2k_saturn_ring_alpha.png` → `saturn-rings.png`
   - `2k_uranus.jpg` → `uranus.jpg`
   - `2k_neptune.jpg` → `neptune.jpg`

5. Place all `.jpg` files in: `public/textures/planets/`

6. **For asteroids**, you can use:
   - Find a generic rock texture online (search "rock texture seamless")
   - Use the same texture for all 3 types initially
   - Name them:
     - `asteroid-grey.jpg` (S-type - rocky)
     - `asteroid-carbon.jpg` (C-type - dark)
     - `asteroid-metal.jpg` (M-type - metallic)
   - Place in: `public/textures/asteroids/`

7. Refresh your browser - textures load automatically!

### Option 2: NASA 3D Resources

**Best for: Most authentic, scientifically accurate**

1. Visit: https://nasa3d.arc.nasa.gov/images
2. Search for each planet (e.g., "Mercury color map")
3. Download the color map JPG
4. Rename to match our naming convention
5. Place in `public/textures/planets/`

### Option 3: Planet Pixel Emporium

**Best for: High quality with bump/specular maps**

1. Visit: http://planetpixelemporium.com/planets.html
2. Click each planet
3. Download the color map (right-click → Save Image)
4. Rename and place in `public/textures/planets/`

## What Happens Without Textures?

The game works perfectly fine without textures! It will:
- Display planets as colored spheres (current behavior)
- Log to console which textures are missing
- Let you add textures one-by-one as you find them

## Texture Specifications

### Recommended Sizes
- **Planets**: 2K (2048x1024) - good balance
- **Sun**: 2K or 4K
- **Asteroids**: 1K (1024x1024) - they're small

### Format
- **Color maps**: JPG (smaller files)
- **Transparency** (rings): PNG
- **Power-of-2 dimensions**: 512, 1024, 2048, 4096

### File Sizes (approximate)
- 1K texture: ~200 KB
- 2K texture: ~800 KB
- 4K texture: ~3 MB

## Directory Structure

```
public/
└── textures/
    ├── planets/
    │   ├── sun.jpg
    │   ├── mercury.jpg
    │   ├── venus.jpg
    │   ├── earth.jpg
    │   ├── mars.jpg
    │   ├── jupiter.jpg
    │   ├── saturn.jpg
    │   ├── saturn-rings.png
    │   ├── uranus.jpg
    │   └── neptune.jpg
    └── asteroids/
        ├── asteroid-grey.jpg
        ├── asteroid-carbon.jpg
        └── asteroid-metal.jpg
```

## Testing

1. Start the dev server: `npm run dev`
2. Open browser console (F12)
3. Look for messages like:
   - `✓ Loaded texture for Earth` (success)
   - `✗ Using fallback color for Mars (texture not found)` (missing)

## Finding Good Asteroid Textures

Search Google/DuckDuckGo for:
- "seamless rock texture free"
- "asteroid texture"
- "grey rock texture seamless"
- "basalt texture"
- "carbon rock texture" (for C-type)
- "metal texture" (for M-type)

Good free texture sites:
- textures.com (free account needed)
- freepbr.com
- 3dtextures.me
- polyhaven.com

## Attribution

If using Solar System Scope textures, add to credits:
```
Planet textures courtesy of Solar System Scope
(https://www.solarsystemscope.com)
```

## Advanced: Normal Maps (Future)

For even better visuals, you can add normal/bump maps later:
- `earth-normal.jpg` - Height details
- `mars-normal.jpg` - Crater depth
- Etc.

The game will automatically use them if present!

## Troubleshooting

**Textures not loading?**
- Check file names match exactly (case-sensitive)
- Check files are in correct folders
- Open browser console for error messages
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Textures look weird?**
- Ensure they're in sRGB color space
- Check dimensions are power-of-2
- Try re-downloading from source

**Performance issues?**
- Use 2K instead of 4K textures
- Use 1K for asteroids
- JPG instead of PNG for color maps
