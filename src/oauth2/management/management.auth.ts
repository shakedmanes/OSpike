import { Strategy } from 'passport-strategy';
import { Request } from 'express';
import clientModel from '../../client/client.model';
import config from '../../config';

/**
 * Client Management Authentication Strategy for authenticating the client manager and
 * validate the registration token entered (if included).
 */
class ClientManagementAuthenticationStrategy extends Strategy {

  constructor() {
    super();
  }

  async authenticate(req: Request, options: any): Promise<void> {

    // Getting the client manager credentials and registration token if included
    const clientManagerCredentials = this.parseClientManagerCredentials(
      <string>req.headers[config.CLIENT_MANAGER_AUTHORIZATION_HEADER],
    );
    const registrationToken = req.headers.authorization;

    // Checking the client manager credentials
    const clientManagerDoc = await clientModel.findOne(clientManagerCredentials);

    // Check if the client have special scope for managing clients
    if (clientManagerDoc && clientManagerDoc.scopes.indexOf(config.CLIENT_MANAGER_SCOPE) > -1) {

      // If registration token is needed for authentication
      if (options.includeRegistrationToken) {

        const clientDoc = await clientModel.findOne({ registrationToken });

        // Check if the registration token is exists and talking about the same client
        if (clientDoc && clientDoc.id === req.body.clientId) {
          return this.success(clientDoc);
        }

        return this.fail({ message: `Registration token or client id parameter isn't valid` }, 400);
      }

      return this.fail({ message: `Registration token parameter is missing` }, 400);
    }

    if (!!clientManagerDoc) {
      return this.fail({ message: `Incorrect client manager credentials given` }, 401);
    }

    // Means that the client doesn't have the permissions to manage clients
    return this.fail({ message: `Client does not have permissions to manage clients` }, 403);
  }

  /**
   * Parses encoded client manager credentials to decoded credentials
   * @param credentials - Base64 encoded client manager credentials
   * @returns Decoded object containing client id and client secret of client manager
   */
  private parseClientManagerCredentials(credentials: string) {
    const decodedCredentials = Buffer.from(credentials, 'base64').toString().split(':');

    return { id: decodedCredentials[0], secret: decodedCredentials[1] };
  }
}
