import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { GitHubService } from '../services/github';
import { RepositoryNormalizer } from '../services/normalizer';

export const reposRouter = Router();

/**
 * GET /api/repos
 * Returns list of all normalized repositories for the logged-in user
 */
reposRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = req.session!.accessToken!;
    const rawRepos = await GitHubService.fetchUserRepos(accessToken);
    const normalized = RepositoryNormalizer.normalizeAll(rawRepos);
    return res.json(normalized);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch repositories', message: error.message });
  }
});

/**
 * GET /api/repos/:owner/:repo/contents
 * Browse directory file tree (e.g. ?path=src/components)
 */
reposRouter.get('/:owner/:repo/contents', async (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  const dirPath = (req.query.path as string) || '';
  const accessToken = req.session?.accessToken || '';

  try {
    const files = await GitHubService.fetchRepoContents(accessToken, owner, repo, dirPath);
    return res.json(files);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch directory contents', message: error.message });
  }
});

/**
 * GET /api/repos/:owner/:repo/file
 * View specific file source code (e.g. ?path=package.json)
 */
reposRouter.get('/:owner/:repo/file', async (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  const filePath = req.query.path as string;
  const accessToken = req.session?.accessToken || '';

  if (!filePath) {
    return res.status(400).json({ error: 'Missing required query parameter: path' });
  }

  try {
    const file = await GitHubService.fetchRepoFile(accessToken, owner, repo, filePath);
    return res.json(file);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch file content', message: error.message });
  }
});

/**
 * GET /api/repos/:owner/:repo/commits
 * View recent commit history
 */
reposRouter.get('/:owner/:repo/commits', async (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  const accessToken = req.session?.accessToken || '';

  try {
    const commits = await GitHubService.fetchRepoCommits(accessToken, owner, repo);
    return res.json(commits);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch commits', message: error.message });
  }
});
