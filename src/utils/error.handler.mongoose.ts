// error.handler.mongoose

import { Error as MongooseError } from 'mongoose';
import { MongoError } from 'mongodb';

export class MongooseErrorHandler {

  private static readonly DUP_KEY_SEP = 'dup key: { :';
  private static readonly DUP_KEY_TEMPLATE_MESSAGE =
    `Duplicate value given: There's already {prop} - {value} for {collection}`;
  private static readonly COLLECTION_NAMES = [
    'clients', 'accesstokens', 'refreshtokens', 'authcodes', 'users',
  ];
  private static readonly COLLECTION_NAMES_VIEW = [
    'Client', 'Access-Token', 'Refresh-Token', 'Authorization-Code', 'User',
  ];

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
  static parseError(error: MongooseError | MongoError): { status: number, message: string } {

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
        if ((<any>error).code === 11000 || (<any>error).code === 11001) {
          return {
            status: 400,
            message: MongooseErrorHandler.parseDuplicateKeyMessage(error.message),
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

  private static parseDuplicateKeyMessage(message: string) {
    let index = 0;
    let collectionIndex = -1;
    const dupKeySepIndex = message.indexOf(MongooseErrorHandler.DUP_KEY_SEP);

    // Finding the collection that related to the error
    for (index = 0;
      collectionIndex === -1 && index < MongooseErrorHandler.COLLECTION_NAMES.length;
      index += 1) {
      collectionIndex = message.indexOf(MongooseErrorHandler.COLLECTION_NAMES[index]);
    }

    // If not succeed in parsing the message, just return it
    if (collectionIndex === -1 && index === MongooseErrorHandler.COLLECTION_NAMES.length) {
      return message;
    }

    // Should lower the index by one cause of the increment by the for loop
    index -= 1;

    // Extracting the property and value caused the error
    const prop = message.substring(
      collectionIndex + MongooseErrorHandler.COLLECTION_NAMES[index].length + 2,
      dupKeySepIndex - 3,
    );

    const value = message.substring(
      dupKeySepIndex + MongooseErrorHandler.DUP_KEY_SEP.length + 1,
      message.length - 2,
    );

    return MongooseErrorHandler.DUP_KEY_TEMPLATE_MESSAGE
      .replace('{collection}', MongooseErrorHandler.COLLECTION_NAMES_VIEW[index])
      .replace('{prop}', prop)
      .replace('{value}', value);
  }
}
