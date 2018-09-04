import { Request, Response, NextFunction } from 'express';
import { BaseError } from './error';

// TODO: Error type correction
export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {

  // Authentication error caused by passport strategy
  if (error.name === 'AuthenticationError') {
    return res.status(error.status).send({
      message: req.session ? req.session.messages[0] : error.name,
    });
  }

  if (error instanceof BaseError) {
    return res.status(error.status).send({
      message: error.message,
    });
  }

  // Other errors (Mongo, etc.)
  return res.status(error.status || 500)
            .send({ message: error.message || 'Internal Server Error' });
}
