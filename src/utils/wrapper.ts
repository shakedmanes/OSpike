// wrapper

import { Response, Request, NextFunction } from 'express';
import { Unauthorized } from './error';

export class Wrapper {

  /**
   * Creates an async wrap for a given function.
   * @param func - Any function.
   */
  static wrapAsync(func: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      func(req, res, next).catch((err: Error) => next(err));
    };
  }

  /**
   * Creates wrapper function for passport authenticate callback function
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function
   */
  static wrapPassportCallback(req: Request, res: Response, next: NextFunction) {
    return function (error: any, user: any) {

      if (error) {
        return next(new Unauthorized());
      }

      if (!user) {
        return next(new Unauthorized());
      }

      req.user = user;
      next();
    };
  }
}
