// error.handler

import { Request, Response, NextFunction } from 'express';
import { BaseError } from './error';
import { MongooseErrorHandler } from './error.handler.mongoose';

// TODO: Error type correction
export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {

  // Authentication error caused by passport strategy
  if (error.name === 'AuthenticationError') {
    return res.status(error.status).send({
      message: req.session ? req.session.messages[0] : error.name,
    });
  }

  if (error instanceof BaseError) {
    return res.status(error.status).send({ message: error.message });
  }

  if (MongooseErrorHandler.instanceOf(error)) {
    const errorDetails = MongooseErrorHandler.parseError(error);
    return res.status(errorDetails.status).send({ message: errorDetails.message });
  }

  // Other errors
  return res.status(error.status || 500)
            .send({ message: error.message || 'Internal Server Error' });
}
