import { RepositoryModel, SizeTier, BiomeType } from '../../../types';
import { RawGitHubRepo } from './github';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00ADD8',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Shell: '#89e051'
};

const LANGUAGE_BIOMES: Record<string, BiomeType> = {
  TypeScript: 'stone_city',
  JavaScript: 'stone_city',
  Python: 'mystic_forest',
  Rust: 'iron_forge',
  'C++': 'iron_forge',
  C: 'iron_forge',
  Go: 'stone_city',
  HTML: 'meadow',
  CSS: 'meadow',
  Java: 'plains',
  Shell: 'plains'
};

export class RepositoryNormalizer {
  /**
   * Determine size tier based on repo disk usage (sizeKb) and star count
   */
  public static calculateSizeTier(sizeKb: number, stars: number): SizeTier {
    if (sizeKb > 8000 || stars >= 50) {
      return 'large';
    }
    if (sizeKb > 1000 || stars >= 10) {
      return 'medium';
    }
    return 'small';
  }

  /**
   * Map repository language to a fantasy biome
   */
  public static determineBiome(language: string | null): BiomeType {
    if (!language) return 'plains';
    return LANGUAGE_BIOMES[language] || 'plains';
  }

  /**
   * Normalize a raw GitHub repository API object into a clean RepositoryModel
   */
  public static normalize(raw: RawGitHubRepo): RepositoryModel {
    const language = raw.language || 'Plain Text';
    const stars = raw.stargazers_count || 0;
    const sizeKb = raw.size || 0;

    return {
      id: raw.id,
      name: raw.name,
      fullName: raw.full_name,
      description: raw.description || 'A forgotten archive in the Git realm.',
      htmlUrl: raw.html_url,
      primaryLanguage: language,
      languageColor: LANGUAGE_COLORS[language] || '#8b949e',
      stars,
      forks: raw.forks_count || 0,
      openIssues: raw.open_issues_count || 0,
      sizeKb,
      sizeTier: this.calculateSizeTier(sizeKb, stars),
      lastPushedAt: raw.pushed_at,
      isFork: raw.fork || false,
      topics: raw.topics || []
    };
  }

  /**
   * Batch normalize multiple repositories
   */
  public static normalizeAll(rawRepos: RawGitHubRepo[]): RepositoryModel[] {
    return rawRepos.map((repo) => this.normalize(repo));
  }
}
