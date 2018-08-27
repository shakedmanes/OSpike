import { Router } from 'express';
import {
  authorizationEndpoint,
  tokenEndpoint,
  decisionEndpoint,
  loginForm,
  loginMethod,
} from './oauth2.controller';

const router = Router();

// OAuth2 routes
router.get('/authorize', authorizationEndpoint);
router.post('/token', tokenEndpoint);
router.post('/decision', decisionEndpoint);

// Authentication routes
router.get('/login', loginForm);
router.post('/login', loginMethod);

export default router;
