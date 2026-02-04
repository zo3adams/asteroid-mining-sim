# Texture Download Checklist

## Download These Files from Solar System Scope

Visit: https://www.solarsystemscope.com/textures/

Click "Download" on each and get the **2K Color Map** version:

### Required Planets (10 files)
- [ ] Sun → rename to `sun.jpg`
- [X] Mercury → rename to `mercury.jpg`
- [X] Venus Surface → rename to `venus.jpg`
- [X] Earth Daymap → rename to `earth.jpg`
- [X] Mars → rename to `mars.jpg`
- [X] Jupiter → rename to `jupiter.jpg`
- [X] Saturn → rename to `saturn.jpg`
- [X] Saturn Ring Alpha → rename to `saturn-rings.png`
- [X] Uranus → rename to `uranus.jpg`
- [ ] Neptune → rename to `neptune.jpg`

### Place Files Here:
All planet files go in: `public/textures/planets/`

### Asteroids (3 files - find elsewhere)
Search Google for "seamless rock texture" or use:
- [X] Grey rock texture → save as `asteroid-grey.jpg`
- [X] Dark rock texture → save as `asteroid-carbon.jpg`
- [X] Metallic texture → save as `asteroid-metal.jpg`

Place in: `public/textures/asteroids/`

---

## Quick Test

After placing files:
1. Refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Open console (F12)
3. Look for "✓ Loaded texture for..." messages
4. Zoom in on a planet to see textures!

## File Size Check

Your `public/textures/planets/` folder should be:
- ~8-10 MB total for all 2K planet textures
- Each file ~800 KB - 1 MB

If files are much larger (>3 MB each), you downloaded 4K or 8K versions (which work but are slower).

---

## Alternative: Start Without Textures

The game works fine without textures! They're optional enhancements.
- Planets will be colored spheres
- Add textures later when you have time
- Hot-reload means no restart needed
