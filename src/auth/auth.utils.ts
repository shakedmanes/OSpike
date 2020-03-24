// auth.utils

import { Request, Response, NextFunction } from 'express';
import config from '../config';

/**
 * Middleware for ensuring user is authenticated
 */
export const ensureAuthenticatedMiddleware =
(req: Request, res: Response, next: NextFunction) => {

  // If user in not on the request object, the user in not authenticated
  if (!req.user) {

    // Save the url the user tried to get to, so after authentication redirect
    // him to it
    console.log(req.url);
    console.log(req.originalUrl);
    const relayState = Buffer.from(req.originalUrl).toString('base64');

    // Redirect the user to perform authentication
    res.redirect(`${config.AUTH_ENDPOINT}${config.AUTH_SHRAGA_ENDPOINT}/?RelayState=${relayState}`);

  } else { // Means the user is already authenticated, proceed with request flow

    next();
  }
};
