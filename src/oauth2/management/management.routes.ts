// management.routes

import { Router, Request, Response } from 'express';
import passport from 'passport';
import config from '../../config';
import { ManagementController } from './management.controller';
import { Wrapper } from '../../utils/wrapper';
import { InvalidParameter } from '../../utils/error';
import { LOG_LEVEL, log, parseLogData } from '../../utils/logger';

/**
 * Authentication middlewares for restricting routes.
 *
 * The first restrict only the client manager.
 * The seconds restrict the client manager and also the registration token of the client.
 */
const authenticateMiddleware = passport.authenticate(
  config.CLIENT_MANAGER_PASSPORT_STRATEGY,
  { session: false, failWithError: true, failureMessage: true },
);
const authenticateManagementMiddleware = passport.authenticate(
  config.CLIENT_MANAGER_PASSPORT_MANAGEMENT_STRATEGY,
  { session: false, failWithError: true, failureMessage: true },
);

export const errorMessages = {
  MISSING_CLIENT_INFORMATION: 'Client information parameter is missing',
  MISSING_CLIENT_ID: 'Client id request parameter is missing',
  MISSING_CLIENT_ID_OR_INFORMATION:
    `Client id request parameter or client information parameter is missing`,
};

export const setManagementRoutes = (router: Router) => {
  // Register client endpoint
  router.post(
    config.OAUTH_MANAGEMENT_ENDPOINT,
    authenticateMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // If the request contains the client information
      if (req.body.clientInformation) {
        const clientInformation =
          await ManagementController.registerClient(req.body.clientInformation);

        log(
          LOG_LEVEL.INFO,
          parseLogData(
            'Client Management Router',
            `Received from ${req.headers['x-forwarded-for']}, Operation - Register client. ${'\r\n'
             } Client information: ${JSON.stringify(req.body.clientInformation)}`,
            201,
            null,
          ),
        );

        return res.status(201).send(clientInformation);
      }

      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'Client Management Router',
          `Received from ${req.headers['x-forwarded-for']}, Operation - Register client. ${'\r\n'
           }Results: Missing client information`,
          400,
          null,
        ),
      );

      throw new InvalidParameter(errorMessages.MISSING_CLIENT_INFORMATION);
    },
  ));

  // Read client information endpoint
  router.get(
    `${config.OAUTH_MANAGEMENT_ENDPOINT}/:clientId`,
    authenticateManagementMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // If the request contains the client registration token and id
      if (req.params.clientId) {
        const clientInformation = await ManagementController.readClient(req.params.clientId);

        log(
          LOG_LEVEL.INFO,
          parseLogData(
            'Client Management Router',
            `Received from ${req.headers['x-forwarded-for']}, Operation - Read client. ${'\r\n'
             } Client Id: ${req.params.clientId}`,
            200,
            null,
          ),
        );

        return res.status(200).send(clientInformation);
      }

      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'Client Management Router',
          `Received from ${req.headers['x-forwarded-for']}, Operation - Read client. ${'\r\n'
           }Results: Missing client id`,
          400,
          null,
        ),
      );

      throw new InvalidParameter(errorMessages.MISSING_CLIENT_ID);
    },
  ));

  // Update client information endpoint
  router.put(
    `${config.OAUTH_MANAGEMENT_ENDPOINT}/:clientId`,
    authenticateManagementMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // If the request contains the client registration token and id and update client information
      if (req.params.clientId && req.body.clientInformation) {
        const clientInformation =
          await ManagementController.updateClient(req.params.clientId, req.body.clientInformation);

        log(
          LOG_LEVEL.INFO,
          parseLogData(
            'Client Management Router',
            `Received from ${req.headers['x-forwarded-for']}, Operation - Update client. ${'\r\n'
             }Client Id: ${req.params.clientId} ${'\r\n'
             }New Client information: ${req.body.clientInformation}`,
            200,
            null,
          ),
        );

        return res.status(200).send(clientInformation);
      }

      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'Client Management Router',
          `Received from ${req.headers['x-forwarded-for']}, Operation - Update client. ${'\r\n'
           }Results: Missing client id or information`,
          400,
          null,
        ),
      );

      throw new InvalidParameter(errorMessages.MISSING_CLIENT_ID_OR_INFORMATION);
    },
  ));

  // Reset client credentials endpoint
  router.patch(
    `${config.OAUTH_MANAGEMENT_ENDPOINT}/:clientId`,
    authenticateManagementMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // If the request contains the client registration token and id
      if (req.params.clientId) {

        // Resetting the client credentials and access tokens and auth codes
        const newClientDoc = await ManagementController.resetClientCredentials(req.params.clientId);

        // If successfully created new client
        if (newClientDoc) {

          log(
            LOG_LEVEL.INFO,
            parseLogData(
              'Client Management Router',
              `Received from ${req.headers['x-forwarded-for']}, Operation - Reset Client. ${'\r\n'
               } Client Id: ${newClientDoc.id} ${'\r\n'} Client Name: ${newClientDoc.name}`,
              200,
              null,
            ),
          );

          return res.status(200).send(newClientDoc);
        }

        log(
          LOG_LEVEL.ERROR,
          parseLogData(
            'Client Management Router',
            `Unknown Error: Received from ${req.headers['x-forwarded-for']
             }, Operation - Reset Client. ${'\r\n'
             } Results: Client id - ${req.params.id} is not reset due unknown error. `,
            500,
            null,
          ),
        );

        // Somehow the resetting failed
        return res.status(500).send('Internal Server Error');
      }

      throw new InvalidParameter(errorMessages.MISSING_CLIENT_ID);
    }),
  );

  // Delete client endpoint
  router.delete(
    `${config.OAUTH_MANAGEMENT_ENDPOINT}/:clientId`,
    authenticateManagementMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // If the request contains the client registration token and id
      if (req.params.clientId) {

        // If the deletion succeed
        if (await ManagementController.deleteClient(req.params.clientId)) {

          log(
            LOG_LEVEL.INFO,
            parseLogData(
              'Client Management Router',
              `Received from ${req.headers['x-forwarded-for']}, Operation - Delete client. ${'\r\n'
               } Client Id: ${req.params.clientId}`,
              204,
              null,
            ),
          );

          return res.sendStatus(204);
        }

        log(
          LOG_LEVEL.ERROR,
          parseLogData(
            'Client Management Router',
            `Unknown Error: Received from ${req.headers['x-forwarded-for']
             }, Operation - Delete client. ${'\r\n'} Client Id: ${req.params.clientId}`,
            500,
            null,
          ),
        );

        // Somehow the deletion failed
        return res.status(500).send('Internal Server Error');
      }

      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'Client Management Router',
          `Received from ${req.headers['x-forwarded-for']}, Operation - Delete client. ${'\r\n'
           }Results: Missing client id`,
          400,
          null,
        ),
      );

      throw new InvalidParameter(errorMessages.MISSING_CLIENT_ID);
    },
  ));
};
