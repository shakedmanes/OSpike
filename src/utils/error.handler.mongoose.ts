// error.handler.mongoose

import { Error as MongooseError } from 'mongoose';
import { MongoError } from 'mongodb';

export class MongooseErrorHandler {

  /**
   * Returns if the error is Mongoose/Mongo error or not
   * @param error - Error to check
   */
  static instanceOf(error: any): boolean {
    return error instanceof MongooseError || error instanceof MongoError;
  }

  /**
   * Parses error occurred by mongoose to readable error for the client
   * @param error - Error occurred by mongoose
   */
  static parseError(error: MongooseError | MongoError): { status: number, message: string} {

    switch (error.name) {

      // Any validation errors or casting error occurred by user input
      case 'ValidationError':
      case 'ValidatorError':
      case 'CastError':
        return {
          status: 400,
          message: error.message,
        };

      // Checks duplicate key error
      // TODO: Make more beautiful error message
      case 'MongoError':
        if ((<any>error).code === 11000) {
          return {
            status: 400,
            message: error.message,
          };
        }

      // Any other unusual errors
      default:
        return {
          status: 500,
          message: error.message || 'Internal Server Error',
        };
    }

  }
}
