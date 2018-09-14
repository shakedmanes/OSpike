// management.auth

import { Strategy } from 'passport-strategy';
import { Request } from 'express';
import accessTokenModel from '../../accessToken/accessToken.model';
import clientModel from '../../client/client.model';
import { IClient } from '../../client/client.interface';
import config from '../../config';

// TODO: Return somehow the message of the failure

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
      return this.fail({ message: 'Client manager authorization header is missing' }, 400);
    }

    // Checking the client manager token
    const accessTokenDoc =
      await accessTokenModel.findOne({ value: clientManagerToken }).populate('clientId');

    // Check if the client have special scope for managing clients and the requests
    // have been done from the correct host
    if (accessTokenDoc &&
        accessTokenDoc.scopes.indexOf(config.CLIENT_MANAGER_SCOPE) > -1) {

      // If registration token is needed for authentication
      if (this.includeRegistrationToken) {

        if (!registrationToken) {
          return this.fail({ message: 'Registration token parameter is missing' }, 400);
        }

        const clientDoc = await clientModel.findOne({ registrationToken });

        // Check if the registration token is exists and talking about the same client
        if (clientDoc && clientDoc.id === req.params.clientId) {
          return this.success(<IClient>accessTokenDoc.clientId);
        }

        return this.fail({ message: `Registration token or client id parameter isn't valid` }, 400);
      }

      return this.success(<IClient>accessTokenDoc.clientId);
    }

    if (accessTokenDoc && (<IClient>accessTokenDoc.clientId)) {
      // Means that the client doesn't have the permissions to manage clients
      return this.fail({ message: 'Client does not have permissions to manage clients' }, 403);
    }

    return this.fail({ message: 'Incorrect client manager credentials given' }, 401);
  }
}
