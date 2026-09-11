import { Router, Request, Response } from 'express';
import { UserSettings } from '../../../types';

export const settingsRouter = Router();

const DEFAULT_SETTINGS: UserSettings = {
  audio: {
    bgmVolume: 70,
    sfxVolume: 80,
    muted: false
  },
  graphics: {
    retroFilter: true,
    showGrid: false,
    showMinimap: true,
    tileSize: 32
  },
  gameplay: {
    controls: 'WASD',
    movementSpeed: 'normal'
  },
  theme: 'fantasy'
};

/**
 * GET /api/settings
 * Retrieves the current player settings from session or defaults
 */
settingsRouter.get('/', (req: Request, res: Response) => {
  const current = req.session?.settings || DEFAULT_SETTINGS;
  return res.json(current);
});

/**
 * POST /api/settings
 * Updates and persists player settings in session
 */
settingsRouter.post('/', (req: Request, res: Response) => {
  const newSettings = req.body;
  if (!req.session) {
    return res.status(400).json({ error: 'Session unavailable' });
  }

  req.session.settings = {
    ...DEFAULT_SETTINGS,
    ...req.session.settings,
    ...newSettings
  };

  return res.json({
    success: true,
    message: 'Settings saved successfully',
    settings: req.session.settings
  });
});
