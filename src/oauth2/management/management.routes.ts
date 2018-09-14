// management.routes

import { Router, Request, Response } from 'express';
import passport from 'passport';
import config from '../../config';
import { ManagementController } from './management.controller';
import { Wrapper } from '../../utils/wrapper';
import { InvalidParameter } from '../../utils/error';

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

export const setManagementRoutes = (router: Router) => {
  // Register client endpoint
  router.post(
    '/register',
    authenticateMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // If the request contains the client information
      if (req.body.clientInformation) {
        const clientInformation =
          await ManagementController.registerClient(req.body.clientInformation);

        return res.status(201).send(clientInformation);
      }

      throw new InvalidParameter('Client information parameter is missing');
    },
  ));

  // Read client information endpoint
  router.get(
    '/register/:clientId',
    authenticateManagementMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // If the request contains the client registration token and id
      if (req.params.clientId) {
        const clientInformation = await ManagementController.readClient(req.params.clientId);

        return res.status(200).send(clientInformation);
      }

      throw new InvalidParameter('Client id request parameter is missing');
    },
  ));

  // Update client information endpoint
  router.put(
    '/register/:clientId',
    authenticateManagementMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // If the request contains the client registration token and id and update client information
      if (req.params.clientId && req.body.clientInformation) {
        const clientInformation =
          await ManagementController.updateClient(req.params.clientId, req.body.clientInformation);

        return res.status(200).send(clientInformation);
      }

      throw new InvalidParameter(`Client id request parameter or
                                  client information parameter is missing`);
    },
  ));

  // Delete client endpoint
  router.delete(
    '/register/:clientId',
    authenticateManagementMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // If the request contains the client registration token and id
      if (req.params.clientId) {

        // If the deletion succeed
        if (await ManagementController.deleteClient(req.params.clientId)) {
          return res.sendStatus(204);
        }

        // Somehow the deletion failed
        return res.status(500).send('Internal Server Error');
      }

      throw new InvalidParameter('Client id request parameter is missing');
    },
  ));
};
