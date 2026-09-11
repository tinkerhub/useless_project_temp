import seedrandom from 'seedrandom';
import {
  WorldModel,
  RepositoryModel,
  BuildingModel,
  SpriteBuildingType,
  TileDefinition,
  BiomeType
} from '../../../types';
import { RepositoryNormalizer } from './normalizer';
import { AuthenticatedUser } from '../middleware/auth';

const TILE_LEGEND: Record<number, TileDefinition> = {
  0: { name: 'deep_water', collidable: true },
  1: { name: 'water_edge', collidable: true },
  2: { name: 'grass', collidable: false },
  3: { name: 'dirt_path', collidable: false },
  4: { name: 'stone_path', collidable: false },
  5: { name: 'forest_grass', collidable: false },
  6: { name: 'volcanic_stone', collidable: false },
  7: { name: 'sand', collidable: false },
  8: { name: 'stone_wall', collidable: true }
};

export class WorldGenerator {
  public static generate(user: AuthenticatedUser, repos: RepositoryModel[]): WorldModel {
    const seed = `gitworld-${user.username}-${user.id}`;
    const rng = seedrandom(seed);

    // Map size scales with number of repositories
    const repoCount = repos.length;
    const width = Math.max(30, Math.min(60, 24 + Math.ceil(Math.sqrt(repoCount)) * 6));
    const height = width;
    const tileSize = 32;

    // Initialize blank grids
    const ground: number[][] = Array.from({ length: height }, () => Array(width).fill(2)); // Default grass (2)
    const collision: number[][] = Array.from({ length: height }, () => Array(width).fill(0)); // Walkable (0)

    // 1. Water borders around the perimeter
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          ground[y][x] = 0;
          collision[y][x] = 1;
        }
      }
    }

    // 2. Spawn and Gatekeeper location (Western edge)
    const gateY = Math.floor(height / 2);
    const gateX = 2;
    const spawnX = gateX + 2;
    const spawnY = gateY;

    // Gatekeeper walls & archway
    ground[gateY - 2][gateX] = 8;
    ground[gateY - 1][gateX] = 8;
    ground[gateY][gateX] = 4; // stone archway threshold
    ground[gateY + 1][gateX] = 8;
    ground[gateY + 2][gateX] = 8;

    collision[gateY - 2][gateX] = 1;
    collision[gateY - 1][gateX] = 1;
    collision[gateY][gateX] = 0; // walkable through gate
    collision[gateY + 1][gateX] = 1;
    collision[gateY + 2][gateX] = 1;

    // 3. Main East-West thoroughfare / stone path
    for (let x = spawnX; x < width - 4; x++) {
      ground[gateY][x] = 4; // Stone path
    }

    // Keep track of occupied tiles for collision and spacing
    const occupied = new Set<string>();
    const markOccupied = (tx: number, ty: number) => occupied.add(`${tx},${ty}`);
    const isOccupied = (tx: number, ty: number) => occupied.has(`${tx},${ty}`);

    // Reserve gate and spawn area
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -2; dx <= 5; dx++) {
        markOccupied(gateX + dx, gateY + dy);
      }
    }

    const buildings: BuildingModel[] = [];

    // Helper to select sprite type based on biome and size
    const pickSprite = (biome: BiomeType, sizeTier: string): SpriteBuildingType => {
      if (biome === 'iron_forge') return sizeTier === 'large' ? 'forge_medium' : 'forge_medium';
      if (biome === 'mystic_forest') return sizeTier === 'large' ? 'hall_large' : 'tower_medium';
      if (biome === 'stone_city') return sizeTier === 'large' ? 'castle_large' : 'hall_large';
      return sizeTier === 'large' ? 'castle_large' : 'cottage_small';
    };

    // 4. Place buildings for each repository deterministically
    // We sort repositories by stars and recency so important ones appear prominently
    const sortedRepos = [...repos].sort((a, b) => b.stars - a.stars);

    for (let i = 0; i < sortedRepos.length; i++) {
      const repo = sortedRepos[i];
      const biome = RepositoryNormalizer.determineBiome(repo.primaryLanguage);

      let bWidth = 2;
      let bHeight = 2;
      if (repo.sizeTier === 'large') {
        bWidth = 3;
        bHeight = 3;
      } else if (repo.sizeTier === 'small') {
        bWidth = 2;
        bHeight = 1;
      }

      const spriteType = pickSprite(biome, repo.sizeTier);

      // Attempt to find a deterministic, non-overlapping spot
      let placed = false;
      let attempts = 0;
      const maxAttempts = 150;

      while (!placed && attempts < maxAttempts) {
        attempts++;
        // Distribute along north/south of the main thoroughfare
        const candX = Math.floor(spawnX + 2 + rng() * (width - spawnX - 8));
        const candY = Math.floor(3 + rng() * (height - 8));

        // Avoid the exact central thoroughfare
        if (Math.abs(candY - gateY) < 3) continue;

        // Check bounding box + 1 tile buffer around building
        let overlaps = false;
        for (let dy = -1; dy <= bHeight + 1; dy++) {
          for (let dx = -1; dx <= bWidth + 1; dx++) {
            const checkX = candX + dx;
            const checkY = candY + dy;
            if (
              checkX <= 1 ||
              checkX >= width - 2 ||
              checkY <= 1 ||
              checkY >= height - 2 ||
              isOccupied(checkX, checkY)
            ) {
              overlaps = true;
              break;
            }
          }
          if (overlaps) break;
        }

        if (!overlaps) {
          // Valid location found!
          // Mark building footprint + margin as occupied and collidable
          for (let dy = 0; dy < bHeight; dy++) {
            for (let dx = 0; dx < bWidth; dx++) {
              markOccupied(candX + dx, candY + dy);
              collision[candY + dy][candX + dx] = 1; // Solid building wall
            }
          }

          // Buffer around building
          for (let dy = -1; dy <= bHeight; dy++) {
            for (let dx = -1; dx <= bWidth; dx++) {
              markOccupied(candX + dx, candY + dy);
            }
          }

          // Paint biome terrain beneath building surroundings
          const biomeTile =
            biome === 'mystic_forest'
              ? 5
              : biome === 'iron_forge'
              ? 6
              : biome === 'meadow'
              ? 7
              : biome === 'stone_city'
              ? 4
              : 2;

          for (let dy = -2; dy <= bHeight + 1; dy++) {
            for (let dx = -2; dx <= bWidth + 1; dx++) {
              const py = candY + dy;
              const px = candX + dx;
              if (py > 0 && py < height - 1 && px > 0 && px < width - 1) {
                if (ground[py][px] === 2) {
                  ground[py][px] = biomeTile;
                }
              }
            }
          }

          // Interaction point (entrance) just below the building
          const interactionX = candX + Math.floor(bWidth / 2);
          const interactionY = candY + bHeight;
          collision[interactionY][interactionX] = 0; // Walkable
          ground[interactionY][interactionX] = 3; // Dirt path marker

          // Connect interaction point to the main road with a dirt path
          const stepY = interactionY < gateY ? 1 : -1;
          for (let py = interactionY; py !== gateY; py += stepY) {
            if (collision[py][interactionX] === 0) {
              ground[py][interactionX] = 3; // Dirt path
            }
          }

          buildings.push({
            id: `bldg-${repo.id}`,
            name: `${repo.name}`,
            x: candX,
            y: candY,
            width: bWidth,
            height: bHeight,
            spriteType,
            biome,
            interactionPoint: {
              x: interactionX,
              y: interactionY
            },
            repository: repo
          });

          placed = true;
        }
      }
    }

    return {
      version: '1.0.0',
      seed,
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        htmlUrl: user.htmlUrl,
        totalRepos: repos.length
      },
      dimensions: {
        width,
        height,
        tileSize
      },
      spawnPoint: {
        x: spawnX,
        y: spawnY
      },
      gatekeeper: {
        name: 'Grimwald the Gatekeeper',
        status: 'welcome',
        position: {
          x: gateX,
          y: gateY
        },
        interactionRange: 1.5,
        dialogue: {
          greeting: `Greetings, traveler ${user.username}. You stand within the Git realm.`,
          success: `The gate remains open for ${user.displayName}. Walk forth and explore your creations!`,
          failure: 'The gate is barred to unauthorized travelers.'
        }
      },
      tileLegend: TILE_LEGEND,
      terrain: {
        ground,
        collision
      },
      buildings
    };
  }
}
