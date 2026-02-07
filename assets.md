# Asteroid Miner - Assets & Data Sources

## External Data Sources

### NASA JPL Small-Body Database (SBDB)
- **URL**: https://ssd-api.jpl.nasa.gov/sbdb.api
- **Documentation**: https://ssd-api.jpl.nasa.gov/doc/sbdb.html
- **License**: Public domain (US Government)
- **Usage**: Asteroid orbital elements, physical characteristics
- **Rate Limits**: No official limit, be respectful
- **Data Fields**:
  - Orbital elements (a, e, i, Ω, ω, M)
  - Physical characteristics (diameter, albedo, rotation period)
  - Taxonomy class
  - Discovery information

### NASA Horizons System
- **URL**: https://ssd.jpl.nasa.gov/api/horizons.api
- **Documentation**: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- **License**: Public domain (US Government)
- **Usage**: Precise ephemerides, positions over time
- **Rate Limits**: 10 requests/second recommended
- **Data Fields**:
  - Position vectors (x, y, z)
  - Velocity vectors
  - Time-series data
  - Orbital state vectors

### Wikipedia API
- **URL**: https://en.wikipedia.org/api/rest_v1/
- **Documentation**: https://www.mediawiki.org/wiki/API:REST_API
- **License**: CC BY-SA 3.0
- **Usage**: Educational content, asteroid articles
- **Rate Limits**: Reasonable use, identify application
- **Data Fields**:
  - Article summaries
  - Full text
  - Images
  - Links
- **Implementation Notes**:
  - Direct links to Wikipedia articles (not API calls for MVP)
  - Custom lookup table in `src/data/WikipediaLinks.ts` for special cases
  - Handles asteroids with non-standard article names
  - Example: Asteroid 433953 → `(433953)_1997_XR2` article
  - All planets and the Sun have Wikipedia links

#### Asteroid type links
 - S https://en.wikipedia.org/wiki/S-type_asteroid
 - M https://en.wikipedia.org/wiki/M-type_asteroid
 - Q https://en.wikipedia.org/wiki/Q-type_asteroid
 - V https://en.wikipedia.org/wiki/V-type_asteroid
 - E https://en.wikipedia.org/wiki/E-type_asteroid
 - C https://en.wikipedia.org/wiki/C-type_asteroid
 - D https://en.wikipedia.org/wiki/D-type_asteroid

### Minor Planet Center
- **URL**: https://minorplanetcenter.net/
- **License**: Free for non-commercial use
- **Usage**: Discovery data, orbital elements
- **Note**: May require scraping or file downloads

### Planetary Data System (PDS)
- **URL**: https://pds.nasa.gov/
- **License**: Public domain
- **Usage**: Scientific data, mission results
- **Note**: Complex datasets, may use for advanced features

## 3D Assets

### Solar System Bodies - TEXTURES IMPLEMENTED ✓
- **Sun**: Texture-mapped sphere (64x64 segments for quality)
  - Texture: `public/textures/planets/sun.jpg`
  - Source: Solar System Scope / NASA (see texture-setup-guide.md)
  - Fallback: Yellow glow if texture missing
- **Planets**: Textured spheres (64x64 segments)
  - Textures: `public/textures/planets/{planet}.jpg`
  - Source: Solar System Scope / NASA / Planet Pixel Emporium
  - All planets support texture mapping with automatic fallback
  - See: `docs/texture-setup-guide.md` for download instructions
- **Asteroids**: Textured based on classification (32x32 segments)
  - C-type: `asteroid-carbon.jpg` (dark carbonaceous)
  - S-type: `asteroid-grey.jpg` (stony, rocky)
  - M-type: `asteroid-metal.jpg` (metallic)
  - Source: Generic rock textures (free texture sites)
  - Fallback: Light grey color if textures missing

### Spacecraft/Ships
- **Player Mining Ships**: Custom models or simple geometric shapes
  - Source: TBD (create, or use Creative Commons models)
- **Pirate Ships**: Distinct appearance
  - Source: TBD
- **Competitor Ships**: Various designs
  - Source: TBD

### UI Elements
- **HUD Frames**: SVG or texture-based
- **Icons**: Resource types, equipment, etc.
- **Fonts**: Monospace for technical readability
  - Recommendation: "Space Mono" or similar

## Textures

### Skybox/Background
- **Star Field**: High-res star map
  - Source: ESA Gaia mission data or procedural
- **Milky Way**: Background galaxy texture
  - Source: NASA imagery or procedural

### Surface Textures
- **Asteroid Surfaces**: PBR textures
  - Albedo, normal, roughness, metallic maps
  - Source: Procedural or Creative Commons
- **Planet Textures**:
  - Source: NASA Blue Marble, JunoCam, etc.

## Audio (Future)
- **Ambient**: Space ambience, ship hum
- **UI**: Button clicks, alerts
- **Events**: Explosions, mining sounds
- **Music**: Background music (optional)
- **License**: All must be royalty-free or Creative Commons

## Data Caching Strategy

### Local Storage Structure
```javascript
{
  "asteroids": {
    "lastUpdate": timestamp,
    "data": {
      "asteroid_id": {
        // cached asteroid data
      }
    }
  },
  "ephemerides": {
    // cached position data
  },
  "wikipedia": {
    // cached article summaries
  }
}
```

### Cache Invalidation
- **Asteroid data**: Cache for 30 days
- **Ephemerides**: Cache for 7 days (changes slowly)
- **Wikipedia**: Cache for 14 days
- **Market prices**: No cache (always generate fresh)

### Progressive Loading
1. Load solar system base (Sun + planets)
2. Load top 100 most interesting asteroids
3. Load asteroids on-demand as player explores
4. Load ephemerides only when needed for missions

## Asset Credits Template

All external assets must be credited. Maintain this list:

```markdown
## Credits
Zoe Adams - producer and character design
Claude Code - lead developer
Github Copilt - lead developer and SRE


### Data Sources
- NASA JPL Small-Body Database - Public Domain
- NASA Horizons System - Public Domain
- Wikipedia - CC BY-SA 3.0
- [Other sources as added]

### 3D Models
- [Model name] - [Source] - [License]

### Textures
- [Texture name] - [Source] - [License]

### Audio
- [Audio file] - [Source] - [License]

### Fonts
- [Font name] - [Source] - [License]

### Code Libraries
- Three.js - MIT License
- [Other libraries as added]
```

## Asset Optimization

### 3D Models
- Keep polygon count reasonable (< 10k triangles for asteroids)
- Use LOD (Level of Detail) for distant objects
- Instancing for repeated objects (asteroid field)

### Textures
- Compress textures (use texture compression formats)
- Mipmapping for distant objects
- Power-of-2 dimensions

### Data
- Compress JSON data (gzip)
- Only load visible objects
- Spatial partitioning for efficient queries

## Development Assets

### Placeholder Assets
- Simple colored spheres for asteroids (until proper models)
- Basic geometric ships (cubes/cylinders)
- Solid color backgrounds (until textures)
- All marked clearly as "WIP" or "PLACEHOLDER"

## Legal Compliance

### Attribution Requirements
- NASA data: No attribution required but recommended, we will attribute to NASA and link direclty to their knowledge base and articals often in the game
- Wikipedia: Must provide attribution and link
- Creative Commons: Follow specific license terms
- Commercial assets: If any, track licenses carefully

### User-Generated Links
- Links to Wikipedia: Must be clear they're external
- Links to NASA: Must be clear they're external
- Disclaimer: "External educational resources"



### Images
- public/images/vehicle_anomoly.png - picture of a space ship exploding to be used when a mission fails
- public/images/mining_red_asteroid.png - picture of mining on an asteroid to be used as an interstitial scene
- public/images/mining_jupiter_moon.png - picture of a mining rig on a moon of jupiter to be used as an interstitial scene
