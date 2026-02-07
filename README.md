# Asteroid Miner

A 3D resource management simulation game where you run an asteroid mining company in our solar system.

## Overview

Play as the CEO of an asteroid mining operation, sending robotic and human crews to mine resources from real asteroids and comets. Navigate contracts, manage economics, unlock technologies, and defend against space pirates—all while learning real orbital mechanics, spacecraft systems, and solar system science.

## Features

- **Real Solar System**: Navigate a 3D WebGL solar system with real asteroids and comets
- **Real Science**: Actual orbital mechanics, NASA data, and educational content
- **Strategic Gameplay**: Contract management, sub-contractor selection, tech tree progression
- **Economic Simulation**: Dynamic markets, resource trading, warehouse management
- **Educational**: Learn about space vehicles, orbital mechanics, and solar system resources
- **No Account Required**: URL-based save system, fully client-side

## Technology

- **TypeScript** - Compiled to JavaScript for maintainability
- **WebGL** - 3D graphics rendering
- **Three.js** - 3D library
- **Vite** - Build tool and dev server
- **Vitest** - Unit testing framework
- **NASA JPL Data** - Real asteroid orbital and physical data (bundled)

## Quick Start

```bash
npm install
npm run dev
```

## Development

### Available Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm test           # Run unit tests
npm run test:watch # Run tests in watch mode
```

### Project Structure

```
src/
├── core/           # Game state, mission types
├── data/           # Asteroid data, news system, tech tree
├── rendering/      # Three.js solar system rendering
├── utils/          # Constants, formatting helpers
└── __tests__/      # Unit tests
```

## Updating Asteroid Data

Asteroid orbital and physical data is bundled as static JSON to avoid CORS issues when deployed to web servers. The NASA JPL API does not allow cross-origin requests from arbitrary domains.

### When to Update

You may need to refresh the asteroid data if:
- NASA updates orbital elements after new observations
- You want to add new asteroids to the game
- Physical parameters (diameter, mass, albedo) have been refined

### How to Update

1. Run the fetch script from your local machine (localhost is allowed by NASA's CORS policy):

```bash
npx tsx scripts/fetch-asteroid-data.ts
```

2. The script will fetch data for all 35 default asteroids from NASA JPL's Small-Body Database API and save it to `src/data/asteroid-data.json`.

3. Rebuild and redeploy:

```bash
npm run build
# Deploy dist/ folder to your server
```

### Adding New Asteroids

1. Edit `scripts/fetch-asteroid-data.ts` and add the asteroid designation to the `ASTEROIDS` array
2. Also update `src/data/AsteroidData.ts` in the `getDefaultAsteroids()` method
3. Run the fetch script and rebuild

## Testing

The project uses Vitest for unit testing. Tests are organized by feature:

- `progression.test.ts` - Level progression thresholds
- `news-system.test.ts` - News ticker behavior and content
- `asteroid-match.test.ts` - Mission planning asteroid matching

```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```

## Documentation

- [spec.md](spec.md) - Game specification and core concept
- [architecture.md](architecture.md) - Technical architecture
- [game-mechanics.md](game-mechanics.md) - Detailed game mechanics and balance
- [characters-factions.md](characters-factions.md) - Characters and factions
- [assets.md](assets.md) - Asset sources and data APIs
- [news-ticker-content.md](news-ticker-content.md) - News ticker content specification

## License

TBD

## Credits

- NASA JPL Small-Body Database - Asteroid data
- NASA Horizons System - Ephemerides
- Wikipedia - Educational content

---

*"Mining the cosmos, one asteroid at a time."*
