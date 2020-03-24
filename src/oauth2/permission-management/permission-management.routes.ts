// permission-management.routes

import { Router, Request, Response, NextFunction } from 'express';
import config from '../../config';
import { PermissionManagementController } from './permission-management.controller';
import { ensureAuthenticatedMiddleware } from '../../auth/auth.utils';
import { Wrapper } from '../../utils/wrapper';
import { InvalidParameter, NotFound } from '../../utils/error';
import { LOG_LEVEL, log, parseLogData } from '../../utils/logger';

export const errorMessages = {
  NOT_FOUND_USER_PERMISSION: 'There is no user permissions approved for that user',
  NOT_FOUND_USER_PERMISSION_BY_AUDIENCE:
    'There is no user permissions approved for that user and that audience',
  INVALID_PARAMETERS_GIVEN: 'Invalid request body. Please do not try anything stupid',
};

export const setPermissionManagementRoutes = (router: Router) => {

  // User Permission Management Page
  router.get(
    config.OAUTH_PERMISSION_MANAGEMENT_ENDPOINT,
    ensureAuthenticatedMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // Logging which user requested to view his permissions
      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'OAuth2 User Permissions Management',
          `Operation: View Full Permissions For User ${'\r\n'
           } User ID: ${req.user.id}`,
          null,
          null,
        ),
      );

      // Gather all user permissions for current user
      const userPermissions =
        await PermissionManagementController.getAllUserPermissions(req.user.id);

      // If not found any user permissions
      if (userPermissions.length === 0) {
        throw new NotFound(errorMessages.NOT_FOUND_USER_PERMISSION);
      }

      // Render appropriate page for manage all permissions grouped by audience
      res.render('permission-management', {
        userPermissions,
      });
    }),
  );

  // User Permission Management Page for specific audience
  router.get(
    `${config.OAUTH_PERMISSION_MANAGEMENT_ENDPOINT}/:audienceId`,
    ensureAuthenticatedMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {

      // Checks if audience id is received
      if (req.params.audienceId) {

        // Logging which user requested to view his permissions by audience
        log(
          LOG_LEVEL.INFO,
          parseLogData(
            'OAuth2 User Permissions Management',
            `Operation: View Permissions For User By Audience ID ${'\r\n'
             } User ID: ${req.user.id}, Audience ID: ${req.params.audienceId}`,
            null,
            null,
          ),
        );

        // Gather all user permissions for current user and specific audience
        const userPermissions =
          await PermissionManagementController.getAllUserPermissionsByAudience(
            req.user.id,
            req.params.audienceId,
          );

        // If not found any user permissions
        if (userPermissions.length === 0) {
          throw new NotFound(errorMessages.NOT_FOUND_USER_PERMISSION_BY_AUDIENCE);
        }

        // Render appropriate page for managing specific audience permissions
        res.render('audience-permission-management', {
          userPermissions,
        });

      } else {
        res.redirect(`${config.OAUTH_PERMISSION_MANAGEMENT_ENDPOINT}`);
      }
    }),
  );

  // Deletes User Permission
  router.post(
    config.OAUTH_PERMISSION_MANAGEMENT_ENDPOINT,
    ensureAuthenticatedMiddleware,
    Wrapper.wrapAsync(async (req: Request, res: Response) => {
      // Check if specified deleteAudId property (delete by audience id)
      if (req.body && req.body.deleteAudId) {

        // Check if specified deleteClientId property (delete by client id)
        if (req.body.deleteClientId) {

          // Logging the operation
          log(
            LOG_LEVEL.INFO,
            parseLogData(
              'OAuth2 User Permissions Management',
              `Operation: Delete Permissions For User By Audience And Client ${'\r\n'
              } User ID: ${req.user.id}, Audience ID: ${req.body.deleteAudId},${''
              } Client ID: ${req.body.deleteClientId}`,
              null,
              null,
            ),
          );

          // Delete all permissions approved by user by audience id and client id
          await PermissionManagementController.deleteUserPermissionsByAudienceAndClient(
            req.user.id,
            req.body.deleteClientId,
            req.body.deleteAudId,
          );
        } else { // Need to delete only by audience id

          // Logging the operation
          log(
            LOG_LEVEL.INFO,
            parseLogData(
              'OAuth2 User Permissions Management',
              `Operation: Delete Permissions For User By Audience ${'\r\n'
              } User ID: ${req.user.id}, Audience ID: ${req.body.deleteAudId}`,
              null,
              null,
            ),
          );

          // Delete all permissions approved by user only by audience
          await PermissionManagementController.deleteUserPermissionsByAudience(
            req.user.id,
            req.body.deleteAudId,
          );
        }

        // Redirect back to user permissions page
        res.redirect(req.originalUrl);

      } else { // Invalid request body given
        throw new InvalidParameter(errorMessages.INVALID_PARAMETERS_GIVEN);
      }
    }),
  );

};
