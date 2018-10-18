// certs.routes.ts

import fs from 'fs';
import { Router } from 'express';
import config from '../config';

const certRoutes = Router();
const jwksContents = fs.readFileSync(config.jwksPath);
const publicKeyPemContents = fs.readFileSync(config.publicKeyPath);
const certificateContents = fs.readFileSync(config.certificatePath);

// Route for getting the public key in jwks format for validating the jwt token
certRoutes.get('/jwks.json', (req, res) => {
  return res.status(200).send(jwksContents);
});

// Route for getting the public key in pem format for validating the jwt token
certRoutes.get('/publickey.pem', (req, res) => {
  return res.status(200).send(publicKeyPemContents);
});

// Route for getting the certificate of the server for validating the public key
certRoutes.get('/certificate.pem', (req, res) => {
  return res.status(200).send(certificateContents);
});

export default certRoutes;
