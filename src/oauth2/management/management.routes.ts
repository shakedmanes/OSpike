import { Router, Request, Response } from 'express';
import passport from 'passport';
import config from '../../config';
import { ManagementController } from './management.controller';

// TODO: handle errors with error handler

export const setManagementRoutes = (router: Router) => {
  // Register client endpoint
  router.post(
    '/register',
    passport.authenticate(config.CLIENT_MANAGER_PASSPORT_STRATEGY, { session: false }),
    async (req: Request, res: Response) => {

      // If the request contains the client information
      if (req.body.clientInformation) {
        const clientInformation =
          await ManagementController.registerClient(req.body.clientInformation);

        return res.status(201).send(clientInformation);
      }

      return res.status(400).send('Client information parameter is missing');
    },
  );

  // Read client information endpoint
  router.get(
    '/register',
    passport.authenticate(config.CLIENT_MANAGER_PASSPORT_MANAGEMENT_STRATEGY, { session: false }),
    async (req: Request, res: Response) => {

      // If the request contains the client registration token and id
      if (req.body.clientId) {
        const clientInformation = await ManagementController.readClient(req.body.clientId);

        return res.status(200).send(clientInformation);
      }

      return res.status(400).send('Client id parameter is missing');
    },
  );

  // Update client information endpoint
  router.put(
    '/register',
    passport.authenticate(config.CLIENT_MANAGER_PASSPORT_MANAGEMENT_STRATEGY, { session: false }),
    async (req: Request, res: Response) => {

      // If the request contains the client registration token and id and update client information
      if (req.body.clientId && req.body.clientInformation) {
        const clientInformation =
          await ManagementController.updateClient(req.body.clientId, req.body.clientInformation);

        return res.status(200).send(clientInformation);
      }

      // Line too long, created variable for error message
      const errorMessage =
        'Client id or client information parameter is missing';
      return res.status(400).send(errorMessage);
    },
  );

  // Delete client endpoint
  router.delete(
    '/register',
    passport.authenticate(config.CLIENT_MANAGER_PASSPORT_MANAGEMENT_STRATEGY, { session: false }),
    async (req: Request, res: Response) => {

      // If the request contains the client registration token and id
      if (req.body.clientId) {
        const isClientDeleted = await ManagementController.deleteClient(req.body.clientId);

        return isClientDeleted ? res.status(200).send('Client deleted successfully') :
                                res.status(500).send('There was error deleting client');
      }

      return res.status(400).send('Client id parameter is missing');
    },
  );
};
