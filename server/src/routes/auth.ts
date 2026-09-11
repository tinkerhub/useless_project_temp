import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';

export const authRouter = Router();

/**
 * Initiates the GitHub OAuth authorization flow
 * Redirects the user's browser to GitHub login
 */
authRouter.get('/github', (req: Request, res: Response) => {
  if (!config.github.clientId) {
    return res.status(500).json({
      error: 'GITHUB_CLIENT_ID is not configured in server/.env. Please see server/.env.example'
    });
  }

  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: 'read:user repo',
    allow_signup: 'true'
  });

  const authUrl = `${config.github.authorizeUrl}?${params.toString()}`;
  return res.redirect(authUrl);
});

/**
 * GitHub OAuth Callback Handler
 * Receives the temporary code and exchanges it for an access token
 */
authRouter.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const authError = req.query.error as string | undefined;

  // Branch 1: User cancelled or GitHub denied auth
  if (authError || !code) {
    if (req.session) {
      req.session.gatekeeper = {
        status: 'denied',
        dialogue: 'The misty runes flicker and fade. The gatekeeper scowls: "You bear no seal of entry. Turn back or authenticate with the Git realm."'
      };
    }
    return res.redirect(`${config.clientUrl}?auth=denied`);
  }

  try {
    // 1. Exchange temporary code for access token
    const tokenResponse = await axios.post(
      config.github.tokenUrl,
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.callbackUrl
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const { access_token, error, error_description } = tokenResponse.data;

    if (error || !access_token) {
      throw new Error(error_description || error || 'Failed to obtain access token');
    }

    // 2. Fetch authenticated user profile from GitHub API
    const userResponse = await axios.get(config.github.userApiUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'User-Agent': 'GitWorld-MVP-Backend'
      }
    });

    const ghUser = userResponse.data;

    // 3. Store in session
    if (req.session) {
      req.session.accessToken = access_token;
      req.session.user = {
        id: ghUser.id,
        username: ghUser.login,
        displayName: ghUser.name || ghUser.login,
        avatarUrl: ghUser.avatar_url,
        htmlUrl: ghUser.html_url,
        publicRepos: ghUser.public_repos
      };

      // Gatekeeper Narrative Branch: Successful Auth
      req.session.gatekeeper = {
        status: 'welcome',
        dialogue: `The ancient archway pulses with azure light! Grimwald lowers his halberd: "Welcome, lord ${ghUser.login}! The chronicles acknowledge your deeds. Enter your domain."`
      };
    }

    // 4. Redirect user back to the frontend game landing page
    return res.redirect(`${config.clientUrl}?auth=success`);
  } catch (err: any) {
    console.error('OAuth callback failed:', err?.response?.data || err.message);

    if (req.session) {
      req.session.gatekeeper = {
        status: 'denied',
        dialogue: 'The gates remain shut cold. The arcane conduits failed to reach GitHub.'
      };
    }

    return res.redirect(`${config.clientUrl}?auth=error`);
  }
});

/**
 * Returns the current authenticated user and gatekeeper state
 */
authRouter.get('/me', (req: Request, res: Response) => {
  const user = req.session?.user;
  const gatekeeper = req.session?.gatekeeper || {
    status: 'denied',
    dialogue: 'Halt, traveler! You must knock and present your GitHub seal to the Gatekeeper before you may enter.'
  };

  if (!user) {
    return res.json({
      isAuthenticated: false,
      user: null,
      gatekeeper
    });
  }

  return res.json({
    isAuthenticated: true,
    user,
    gatekeeper
  });
});

/**
 * Dev/Mock Login for instant testing without requiring GitHub App setup
 */
authRouter.get('/mock-login', (req: Request, res: Response) => {
  if (req.session) {
    req.session.accessToken = 'mock_dev_token';
    req.session.user = {
      id: 583231,
      username: 'octocat',
      displayName: 'The Monalisa Octocat',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      htmlUrl: 'https://github.com/octocat',
      publicRepos: 8
    };
    req.session.gatekeeper = {
      status: 'welcome',
      dialogue: 'The gates swing open to the realm of the legendary Octocat!'
    };
  }

  return res.redirect(`${config.clientUrl}?auth=success`);
});

/**
 * Logout route
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session = null;
  }
  return res.json({
    success: true,
    message: 'Logged out successfully',
    gatekeeper: {
      status: 'denied',
      dialogue: 'The fantasy gate closes behind you. Fare thee well, traveler.'
    }
  });
});
