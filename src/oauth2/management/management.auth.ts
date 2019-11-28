// management.auth

import { Strategy } from 'passport-strategy';
import { Request } from 'express';
import accessTokenModel from '../../accessToken/accessToken.model';
import clientModel from '../../client/client.model';
import { IClient } from '../../client/client.interface';
import config from '../../config';
import { ScopeUtils } from '../../scope/scope.utils';
import { LOG_LEVEL, log, parseLogData } from '../../utils/logger';

// TODO: Return somehow the message of the failure
export const authFailMessages = {
  CLIENT_MANAGER_TOKEN_MISSING: 'Client manager authorization header is missing',
  INSUFFICIENT_CLIENT_MANAGER_TOKEN: 'Client does not have permissions to manage clients',
  INVALID_CLIENT_MANAGER_TOKEN: 'Incorrect client manager credentials given',
  REGISTRATION_TOKEN_MISSING: 'Registration token parameter is missing',
  INVALID_REG_TOKEN_OR_CLIENT_ID: `Registration token or client id parameter isn't valid`,

};

export interface IClientManagemementStrategyOptions {
  includeRegistrationToken: boolean;
}

/**
 * Client Management Authentication Strategy for authenticating the client manager and
 * validate the registration token entered (if included).
 */
export class ClientManagementAuthenticationStrategy
   extends Strategy implements IClientManagemementStrategyOptions {

  public name: string;
  public includeRegistrationToken: IClientManagemementStrategyOptions['includeRegistrationToken'];

  constructor(options?: IClientManagemementStrategyOptions) {
    super();
    this.name = config.CLIENT_MANAGER_PASSPORT_STRATEGY;
    this.includeRegistrationToken = options ? options.includeRegistrationToken || false : false;
  }

  async authenticate(req: Request, options: any): Promise<void> {

    // Getting the client manager token and registration token if included
    const clientManagerToken = <string>req.headers[config.CLIENT_MANAGER_AUTHORIZATION_HEADER];
    const registrationToken = req.headers.authorization;

    // If missing client manager authorization header
    if (!clientManagerToken) {
      log(
        LOG_LEVEL.WARN,
        parseLogData(
          'Client Management Authentication Strategy',
          `Someone at ${req.headers['x-forwarded-for']
           } tried to use client management routes without authorization header`,
          400,
          null,
        ),
      );

      return this.fail({ message: authFailMessages.CLIENT_MANAGER_TOKEN_MISSING }, 400);
    }

    // Checking the client manager token
    const accessTokenDoc =
      await accessTokenModel.findOne({ value: clientManagerToken })
                            .populate('clientId scopes')
                            .lean();

    // Check if the client have special scope for managing clients and the requests
    // have been done from the correct host
    if (accessTokenDoc &&
        // accessTokenDoc.scopes.indexOf(config.CLIENT_MANAGER_SCOPE) > -1) {
        ScopeUtils.transformScopeModelsToRawScopes(accessTokenDoc.scopes)
                  .indexOf(config.CLIENT_MANAGER_SCOPE) > -1) {

      // If registration token is needed for authentication
      if (this.includeRegistrationToken) {

        if (!registrationToken) {
          log(
            LOG_LEVEL.WARN,
            parseLogData(
              'Client Management Authentication Strategy',
              `Someone at ${req.headers['x-forwarded-for']
               } tried to manage client without registration token of the client`,
              400,
              null,
            ),
          );

          return this.fail({ message: authFailMessages.REGISTRATION_TOKEN_MISSING }, 400);
        }

        const clientDoc = await clientModel.findOne({ registrationToken }).lean();

        // Check if the registration token is exists and talking about the same client
        if (clientDoc && clientDoc.id === req.params.clientId) {
          log(
            LOG_LEVEL.INFO,
            parseLogData(
              'Client Management Authentication Strategy',
              `Successfully authenticated with ${''
               }registration token from ${req.headers['x-forwarded-for']}`,
              200,
              null,
            ),
          );

          return this.success(<IClient>accessTokenDoc.clientId);
        }

        log(
          LOG_LEVEL.WARN,
          parseLogData(
            'Client Management Authentication Strategy',
            `Someone at ${req.headers['x-forwarded-for']
             } tried to manage client with invalid registration token or client id`,
            400,
            null,
          ),
        );

        return this.fail({ message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID }, 400);
      }

      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'Client Management Authentication Strategy',
          `Successfully authenticated from ${req.headers['x-forwarded-for']}`,
          200,
          null,
        ),
      );

      return this.success(<IClient>accessTokenDoc.clientId);
    }

    if (accessTokenDoc && (<IClient>accessTokenDoc.clientId)) {

      log(
        LOG_LEVEL.WARN,
        parseLogData(
          'Client Management Authentication Strategy',
          `Someone at ${req.headers['x-forwarded-for']} with the client id ${accessTokenDoc.clientId
          } tried to manage client with insufficient client manager privileges`,
          403,
          null,
        ),
      );

      // Means that the client doesn't have the permissions to manage clients
      return this.fail({ message: authFailMessages.INSUFFICIENT_CLIENT_MANAGER_TOKEN }, 403);
    }

    log(
      LOG_LEVEL.WARN,
      parseLogData(
        'Client Management Authentication Strategy',
        `Someone at ${req.headers['x-forwarded-for']
         } tried to authenticate with invalid client manager token`,
        401,
        null,
      ),
    );

    return this.fail({ message: authFailMessages.INVALID_CLIENT_MANAGER_TOKEN }, 401);
  }
}
