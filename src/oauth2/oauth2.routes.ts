// oauth2.routes

import { Router } from 'express';
import {
  authorizationEndpoint,
  tokenEndpoint,
  decisionEndpoint,
//  loginForm,
//  loginMethod,
  tokenIntrospectionEndpoint,
} from './oauth2.controller';
import { setManagementRoutes } from './management/management.routes';
import {
  setPermissionManagementRoutes,
} from './permission-management/permission-management.routes';

const router = Router();

// OAuth2 routes
router.get('/authorize', authorizationEndpoint);
router.post('/token', tokenEndpoint);
router.post('/tokeninfo', tokenIntrospectionEndpoint);
router.post('/decision', decisionEndpoint);

// Authentication routes
// router.get('/login', loginForm);
// router.post('/login', loginMethod);

// Management routes
setManagementRoutes(router);

// User permission management routes
setPermissionManagementRoutes(router);

export default router;
