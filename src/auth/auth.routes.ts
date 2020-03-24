// auth.routes

import { Router } from 'express';
import passport from 'passport';
import config from '../config';

const router = Router();

// Authentication via proxy shraga
router.get(config.AUTH_SHRAGA_ENDPOINT, passport.authenticate('shraga'));

// Handle callback redirection from shraga after authentication
// and redirect back to original url stored in RelayState parameter
router.post(
  config.AUTH_SHRAGA_CALLBACK_ENDPOINT,
  passport.authenticate('shraga'),
  (req: any, res: any) => {
    res.redirect(
      `${Buffer.from(req.user.RelayState, 'base64').toString('utf8')}`,
    );
  },
);

export default router;
