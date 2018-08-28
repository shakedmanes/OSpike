import { Router, Request, Response } from 'express';
import { ManagementController } from './management.controller';

const router = Router();

// TODO: handle errors with error handler
// TODO: implement passport strategy for authentication of client manager and registration token

// Register client endpoint
router.post('/register', async (req: Request, res: Response) => {

  // If the request contains the client information
  if (req.body.clientInformation) {
    const clientInformation = await ManagementController.registerClient(req.body.clientInformation);

    return res.status(201).send(clientInformation);
  }

  return res.status(400).send('Client information parameter is missing');
});

// Read client information endpoint
router.get('/register', async (req: Request, res: Response) => {

  // If the request contains the client registration token and id
  if (req.headers.authorization && req.body.clientId) {
    const clientInformation =
      await ManagementController.readClient(req.headers.authorization, req.body.clientId);

    return res.status(200).send(clientInformation);
  }

  return res.status(400).send('Registration token or client id parameter is missing');
});

// Update client information endpoint
router.put('/register', async (req: Request, res: Response) => {

  // If the request contains the client registration token and id and update client information
  if (req.headers.authorization && req.body.clientId && req.body.clientInformation) {
    const clientInformation =
      await ManagementController.updateClient(
        req.headers.authorization,
        req.body.clientId,
        req.body.clientInformation,
      );

    return res.status(200).send(clientInformation);
  }

  // Line too long, created variable for error message
  const errorMessage = 'Registration token or client id or client information parameter is missing';
  return res.status(400).send(errorMessage);
});

// Delete client endpoint
router.delete('/register', async (req: Request, res: Response) => {

  // If the request contains the client registration token and id
  if (req.headers.authorization && req.body.clientId) {
    const isClientDeleted =
      await ManagementController.deleteClient(req.headers.authorization, req.body.clientId);

    return isClientDeleted ? res.status(200).send('Client deleted successfully') :
                             res.status(500).send('There was error deleting client');
  }

  return res.status(400).send('Registration token or client id parameter is missing');
});

export default router;
