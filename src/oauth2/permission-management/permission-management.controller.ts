// permission-management.controller

import userPermissionModel from '../../user-permission/user-permission.model';
import { collectionName as clientModelName, IClient } from '../../client/client.interface';
import { collectionName as scopeModelName, IScope } from '../../scope/scope.interface';
import { IUserPermission } from '../../user-permission/user-permission.interface';
import { propertyOf } from '../../utils/objectUtils';

// Represent grouped user permission details object, as returned from
// 'getAllUserPermissions' function
export interface IGroupedUserPermissionDetails {
  audienceName: string;
  audienceId: string;
  clients: [{ clientName: string, clientId: string, numScopes: number }];
}

// Represent grouped user permission details by specific audience id, as
// returned from 'getAllUserPermissionsByAudience' function
export interface IGroupedUserPermissionDetailsByAudience {
  audienceId: string;
  audienceClientName: string;
  clientId: string;
  clientName: string;
  scopes: [{ value: string, description: string }];
}
export class PermissionManagementController {

  /**
   * Get all user permissions
   * @param userId - The user id
   */
  static async getAllUserPermissions(userId: string): Promise<IGroupedUserPermissionDetails[]> {

    /**
     * Gets all the user permission and group them by audience
     * of all the scopes granted the following manner:
     *
     * [
     *  {
     *    audienceName: Name of the audience,
     *    audienceId: Id of the audience,
     *    clients: [
     *      {
     *        clientName: name of the client,
     *        clientId: ObjectID of the client,
     *        numScopes: Number of scopes the client have to this particular audience behalf
     *                   the user permission
     *      }
     *    ]
     *  }
     * ]
     */
    const userPermissions = await userPermissionModel.aggregate(
      [
        {
          $match: {
            [`${propertyOf<IUserPermission>('userId')}`]: {
              $eq: userId,
            },
          },
        },
        {
          $lookup: {
            from: `${clientModelName.toLowerCase()}s`,
            localField: `${propertyOf<IUserPermission>('clientId')}`,
            foreignField: `${propertyOf<IClient>('_id')}`,
            as: 'clientId',
          },
        },
        {
          $unwind: {
            path: '$clientId',
          },
        },
        {
          $lookup: {
            from: `${scopeModelName.toLowerCase()}s`,
            let: {
              localScopeId: `$${propertyOf<IUserPermission>('scopeId')}`,
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      '$_id', '$$localScopeId',
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: `${clientModelName.toLowerCase()}s`,
                  let: {
                    localAudId: `$${propertyOf<IScope>('audienceId')}`,
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            `$${propertyOf<IClient>('audienceId')}`, '$$localAudId',
                          ],
                        },
                      },
                    },
                  ],
                  as: 'scopeAudienceClient',
                },
              },
              {
                $unwind: {
                  path: '$scopeAudienceClient',
                },
              },
              {
                $project: {
                  value: `$${propertyOf<IScope>('value')}`,
                  _id: `$${propertyOf<IScope>('_id')}`,
                  audienceId: `$scopeAudienceClient.${propertyOf<IClient>('audienceId')}`,
                  audienceClientName: `$scopeAudienceClient.${propertyOf<IClient>('name')}`,
                },
              },
            ],
            as: 'scopeId',
          },
        },
        {
          $unwind: {
            path: '$scopeId',
          },
        },
        {
          $group: {
            _id: {
              audienceClientName: '$scopeId.audienceClientName',
              audienceId: '$scopeId.audienceId',
              clientId: `$clientId.${propertyOf<IClient>('_id')}`,
              clientName: `$clientId.${propertyOf<IClient>('name')}`,
            },
            numScopes: {
              $sum: 1,
            },
          },
        },
        {
          $group: {
            _id: {
              audienceClientName: '$_id.audienceClientName',
              audienceId: '$_id.audienceId',
            },
            clients: {
              $addToSet: {
                clientId: '$_id.clientId',
                clientName: '$_id.clientName',
                numScopes: '$numScopes',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            clients: 1,
            audienceClientName: '$_id.audienceClientName',
            audienceId: '$_id.audienceId',
          },
        },
      ],
    );

    return userPermissions;
  }

  /**
   * Get all user permissions of specific audience id
   * @param userId - The user id
   * @param audienceId - The audience id
   */
  static async getAllUserPermissionsByAudience(userId: string, audienceId: string):
               Promise<IGroupedUserPermissionDetailsByAudience[]> {

    /**
     * Gets all the user permission by specific audience and group by
     * each clients scopes in the following manner:
     *
     * [
     *  {
     *    audienceClientName: Name of the audience,
     *    audienceId: Id of the audience,
     *    clientName: Name of the client (which scopes grouped by),
     *    clientId: ObjectID of the client (which scopes grouped by)
     *    scopes: [
     *      {
     *        value: Actual value of the scope,
     *        description: Description of the scope meaning
     *      }
     *    ]
     *  }
     * ]
     *
     * NOTE: The audienceClientName/audienceId will always be identical for each element in
     *       the array result, because of representation purposes.
     */
    const userPermissions = await userPermissionModel.aggregate([
      {
        $match: {
          [`${propertyOf<IUserPermission>('userId')}`]: {
            $eq: userId,
          },
        },
      },
      {
        $lookup: {
          from: `${scopeModelName.toLowerCase()}s`,
          let: {
            localScopeId: `$${propertyOf<IUserPermission>('scopeId')}`,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$_id', '$$localScopeId',
                  ],
                },
              },
            },
            {
              $lookup: {
                from: `${clientModelName.toLowerCase()}s`,
                let: {
                  localAudId: `$${propertyOf<IScope>('audienceId')}`,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          `$${propertyOf<IClient>('audienceId')}`, '$$localAudId',
                        ],
                      },
                    },
                  },
                ],
                as: 'scopeAudienceClient',
              },
            },
            {
              $unwind: {
                path: '$scopeAudienceClient',
              },
            },
            {
              $project: {
                value: `$${propertyOf<IScope>('value')}`,
                description: `$${propertyOf<IScope>('description')}`,
                audienceId: `$scopeAudienceClient.${propertyOf<IClient>('audienceId')}`,
                audienceClientName: `$scopeAudienceClient.${propertyOf<IClient>('name')}`,
              },
            },
          ],
          as: 'scopeId',
        },
      },
      {
        $unwind: {
          path: '$scopeId',
        },
      },
      {
        $match: {
          'scopeId.audienceId': audienceId,
        },
      },
      {
        $lookup: {
          from: `${clientModelName.toLowerCase()}s`,
          let: {
            localClientId: `$${propertyOf<IUserPermission>('clientId')}`,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$_id', '$$localClientId',
                  ],
                },
              },
            },
            {
              $project: {
                _id: `$${propertyOf<IClient>('_id')}`,
                name: `$${propertyOf<IClient>('name')}`,
              },
            },
          ],
          as: 'clientId',
        },
      },
      {
        $unwind: {
          path: '$clientId',
        },
      },
      {
        $group: {
          _id: {
            audienceId: `$scopeId.${propertyOf<IScope>('audienceId')}`,
            audienceClientName: '$scopeId.audienceClientName',
            clientId: `$clientId.${propertyOf<IClient>('_id')}`,
            clientName: `$clientId.${propertyOf<IClient>('name')}`,
          },
          scopes: {
            $addToSet: '$scopeId',
          },
        },
      },
      {
        $project: {
          _id: 0,
          scopes: {
            [`${propertyOf<IScope>('value')}`]: 1,
            [`${propertyOf<IScope>('description')}`]: 1,
          },
          audienceId: '$_id.audienceId',
          audienceClientName: '$_id.audienceClientName',
          clientId: '$_id.clientId',
          clientName: '$_id.clientName',
        },
      },
    ]);

    return userPermissions;
  }

  /**
   * Deletes all user permissions approved for specified audience
   * @param userId - The user id
   * @param audienceId - The audience id
   */
  static async deleteUserPermissionsByAudience(userId: string, audienceId: string) {
    // Because we must populate the scopeId field for knowing which
    // userPermission to delete, we need to separate the calls to find and remove
    const scopeIdsToDelete =
      (await userPermissionModel
        .find({ userId })
        .populate(`${propertyOf<IUserPermission>('scopeId')}`)
      ).filter(userPermission => (<IScope>userPermission.scopeId).audienceId === audienceId)
      .map(userPermission => (<IScope>userPermission.scopeId)._id);

      // Delete all scopes related to audience id
    await userPermissionModel.remove({ userId, scopeId: { $in: scopeIdsToDelete } });
  }

  /**
   * Deletes all user permissions approved for specified client and audience
   * @param userId - The user id
   * @param clientId - The client id (object id)
   * @param audienceId - The audience id
   */
  static async deleteUserPermissionsByAudienceAndClient(userId: string,
                                                        clientId: string,
                                                        audienceId: string) {
    // Because we must populate the scopeId field for knowing which
    // userPermission to delete, we need to separate the calls to find and remove
    const scopeIdsToDelete =
      (await userPermissionModel
        .find({ userId, clientId })
        .populate(`${propertyOf<IUserPermission>('scopeId')}`)
      ).filter(userPermission => (<IScope>userPermission.scopeId).audienceId === audienceId)
      .map(userPermission => (<IScope>userPermission.scopeId)._id);

    // Delete all scopes related to audience id and client
    await userPermissionModel.remove({ userId, clientId, scopeId: { $in: scopeIdsToDelete } });
  }
}
