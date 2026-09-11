import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { GitHubService } from '../services/github';
import { RepositoryNormalizer } from '../services/normalizer';
import { UserProfile, Achievement } from '../../../types';

export const userRouter = Router();

/**
 * Helper to calculate RPG title and level based on repository data
 */
function calculateRPGStats(username: string, repos: any[]): {
  title: string;
  level: number;
  primaryElement: string;
  realmPower: number;
} {
  const totalStars = repos.reduce((acc, r) => acc + r.stars, 0);
  const totalForks = repos.reduce((acc, r) => acc + r.forks, 0);
  const repoCount = repos.length;

  // Find most prominent language
  const langCounts: Record<string, number> = {};
  for (const r of repos) {
    if (r.primaryLanguage && r.primaryLanguage !== 'Plain Text') {
      langCounts[r.primaryLanguage] = (langCounts[r.primaryLanguage] || 0) + 1;
    }
  }

  let primaryElement = 'Arcane Magic';
  let maxCount = 0;
  for (const [lang, count] of Object.entries(langCounts)) {
    if (count > maxCount) {
      maxCount = count;
      primaryElement = lang;
    }
  }

  // Level based on repos and stars
  const level = Math.max(1, Math.min(99, Math.floor(repoCount * 2 + totalStars * 1.5 + totalForks * 3)));
  const realmPower = repoCount * 100 + totalStars * 50 + totalForks * 30;

  // Title calculation
  let title = `Novice of the ${primaryElement} Plains`;
  if (level >= 50) {
    title = `Grand Archmage of ${primaryElement}`;
  } else if (level >= 25) {
    title = `Master Architect of ${primaryElement}`;
  } else if (level >= 10) {
    title = `Adept Spellweaver of ${primaryElement}`;
  }

  return { title, level, primaryElement, realmPower };
}

/**
 * GET /api/user/profile
 * Returns rich user stats, RPG class, language distribution, and achievements
 */
userRouter.get('/profile', requireAuth, async (req: Request, res: Response) => {
  const user = req.session!.user!;
  const accessToken = req.session!.accessToken!;

  try {
    const rawRepos = await GitHubService.fetchUserRepos(accessToken);
    const repos = RepositoryNormalizer.normalizeAll(rawRepos);

    const totalStars = repos.reduce((acc, r) => acc + r.stars, 0);
    const totalForks = repos.reduce((acc, r) => acc + r.forks, 0);
    const totalOpenIssues = repos.reduce((acc, r) => acc + r.openIssues, 0);

    // Language Breakdown
    const langCounts: Record<string, number> = {};
    for (const r of repos) {
      if (r.primaryLanguage && r.primaryLanguage !== 'Plain Text') {
        langCounts[r.primaryLanguage] = (langCounts[r.primaryLanguage] || 0) + 1;
      }
    }

    const totalLangs = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
    const languageBreakdown = Object.entries(langCounts)
      .map(([language, count]) => {
        const found = repos.find((r) => r.primaryLanguage === language);
        return {
          language,
          percentage: Math.round((count / totalLangs) * 100),
          color: found?.languageColor || '#8b949e'
        };
      })
      .sort((a, b) => b.percentage - a.percentage);

    const rpg = calculateRPGStats(user.username, repos);

    // Dynamic Achievements
    const achievements: Achievement[] = [
      {
        id: 'first-spell',
        title: 'First Creation',
        description: 'Forged at least 1 repository in the Git realm',
        icon: '🛡️',
        unlocked: repos.length >= 1
      },
      {
        id: 'star-vault',
        title: 'Vault of Starlight',
        description: 'Gathered 10 or more stars across your kingdoms',
        icon: '⭐',
        unlocked: totalStars >= 10
      },
      {
        id: 'constellation',
        title: 'Constellation Sovereign',
        description: 'Gathered 50 or more stars across your kingdoms',
        icon: '🌌',
        unlocked: totalStars >= 50
      },
      {
        id: 'polyglot',
        title: 'Polyglot Mage',
        description: 'Cast code in 3 or more distinct programming languages',
        icon: '🗡️',
        unlocked: languageBreakdown.length >= 3
      },
      {
        id: 'citadel',
        title: 'Citadel Architect',
        description: 'Erected a massive repository over 10 MB in scale',
        icon: '🏰',
        unlocked: repos.some((r) => r.sizeKb > 10000)
      }
    ];

    const profile: UserProfile = {
      user,
      rpg,
      stats: {
        totalStars,
        totalForks,
        totalOpenIssues,
        languageBreakdown
      },
      achievements
    };

    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to generate user profile', message: error.message });
  }
});
