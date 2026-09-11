import axios from 'axios';

export interface RawGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number; // in KB
  fork: boolean;
  pushed_at: string;
  topics?: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory cache for GitHub API responses to protect rate limits
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class GitHubService {
  private static getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private static setCache<T>(key: string, data: T, ttlMs = CACHE_TTL_MS): void {
    cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  /**
   * Fetches the authenticated user's repositories from GitHub API
   * Handles caching, pagination up to 100 repos, and rate limit errors
   */
  public static async fetchUserRepos(accessToken: string): Promise<RawGitHubRepo[]> {
    const cacheKey = `repos_${accessToken.slice(-10)}`;
    const cached = this.getCached<RawGitHubRepo[]>(cacheKey);
    if (cached) {
      console.log('⚡ Serving repos from in-memory cache');
      return cached;
    }

    try {
      const response = await axios.get<RawGitHubRepo[]>('https://api.github.com/user/repos', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'GitWorld-MVP-Backend',
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          per_page: 100,
          sort: 'pushed',
          direction: 'desc',
          affiliation: 'owner,collaborator'
        }
      });

      const repos = response.data;
      this.setCache(cacheKey, repos);
      return repos;
    } catch (error: any) {
      const status = error?.response?.status;
      const rateLimitRemaining = error?.response?.headers?.['x-ratelimit-remaining'];

      if (status === 403 && rateLimitRemaining === '0') {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }

      console.error('Failed to fetch user repos from GitHub:', error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetches public user details by username
   */
  public static async fetchPublicUser(username: string): Promise<any> {
    const cacheKey = `user_${username.toLowerCase()}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`https://api.github.com/users/${username}`, {
        headers: { 'User-Agent': 'GitWorld-MVP-Backend', Accept: 'application/vnd.github.v3+json' }
      });
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch user ${username}:`, error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetches public repositories for any GitHub username
   */
  public static async fetchPublicUserRepos(username: string): Promise<RawGitHubRepo[]> {
    const cacheKey = `public_repos_${username.toLowerCase()}`;
    const cached = this.getCached<RawGitHubRepo[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get<RawGitHubRepo[]>(`https://api.github.com/users/${username}/repos`, {
        headers: { 'User-Agent': 'GitWorld-MVP-Backend', Accept: 'application/vnd.github.v3+json' },
        params: { per_page: 60, sort: 'pushed', direction: 'desc' }
      });
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch repos for ${username}:`, error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetches directory contents (file tree) of a repository
   */
  public static async fetchRepoContents(
    accessToken: string,
    owner: string,
    repo: string,
    dirPath = ''
  ): Promise<any[]> {
    const cleanPath = dirPath.replace(/^\//, '');
    const cacheKey = `tree_${owner}_${repo}_${cleanPath}`;
    const cached = this.getCached<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'GitWorld-MVP-Backend',
        Accept: 'application/vnd.github.v3+json'
      };
      if (accessToken && accessToken !== 'mock_dev_token') {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`,
        { headers }
      );

      const items = Array.isArray(response.data) ? response.data : [response.data];
      const result = items.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
        size: item.size || 0,
        downloadUrl: item.download_url
      }));

      this.setCache(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error(`Failed to fetch repo contents for ${owner}/${repo}/${cleanPath}:`, error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Reads raw file content from a repository and decodes Base64 to text
   */
  public static async fetchRepoFile(
    accessToken: string,
    owner: string,
    repo: string,
    filePath: string
  ): Promise<any> {
    const cleanPath = filePath.replace(/^\//, '');
    const cacheKey = `file_${owner}_${repo}_${cleanPath}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'GitWorld-MVP-Backend',
        Accept: 'application/vnd.github.v3+json'
      };
      if (accessToken && accessToken !== 'mock_dev_token') {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`,
        { headers }
      );

      const data = response.data;
      if (data.type !== 'file') {
        throw new Error('Target path is a directory, not a file');
      }

      // Decode base64 file content to utf8 string
      const decodedContent = Buffer.from(data.content || '', 'base64').toString('utf8');

      const result = {
        name: data.name,
        path: data.path,
        size: data.size,
        content: decodedContent,
        isBinary: false,
        language: data.name.split('.').pop() || 'text'
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error(`Failed to fetch file ${cleanPath}:`, error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetches recent commits for a repository
   */
  public static async fetchRepoCommits(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<any[]> {
    const cacheKey = `commits_${owner}_${repo}`;
    const cached = this.getCached<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'GitWorld-MVP-Backend',
        Accept: 'application/vnd.github.v3+json'
      };
      if (accessToken && accessToken !== 'mock_dev_token') {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits`,
        { headers, params: { per_page: 10 } }
      );

      const commits = response.data.map((item: any) => ({
        sha: item.sha.substring(0, 7),
        message: item.commit.message,
        author: item.commit.author?.name || item.author?.login || 'Unknown Adventurer',
        date: item.commit.author?.date || '',
        htmlUrl: item.html_url
      }));

      this.setCache(cacheKey, commits);
      return commits;
    } catch (error: any) {
      console.error(`Failed to fetch commits for ${owner}/${repo}:`, error?.response?.data || error.message);
      return [];
    }
  }
}

