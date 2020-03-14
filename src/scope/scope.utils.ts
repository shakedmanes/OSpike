// scope.utils.ts

import scopeModel from './scope.model';
import userPermissionModel from '../user-permission/user-permission.model';
import { propertyOf } from '../utils/objectUtils';
import { IScope, collectionName as ScopeModelName } from './scope.interface';
import { IClient } from '../client/client.interface';
import { IUserPermission } from '../user-permission/user-permission.interface';

export class ScopeUtils {

  /**
   * Transforms raw scopes values into scopes models from the db
   * @param scopes - Array of raw scopes values (strings)
   * @param audienceId - Audience id for the scopes
   */
  static async transformRawScopesToModels(scopes: string[], audienceId: string) {

    // Will contains all the models for the requested scopes
    // const scopesModelIds = [];

    // First of all, get all the scopes for the specific audience
    const scopesModelIds =
      await scopeModel.find({
        [propertyOf<IScope>('audienceId')]: audienceId,
        value: { $in: scopes },
      });

    // // Filter all the scopes that contained in the raw scopes names
    // for (const currScopeModel of allScopesForAudience) {
    //   if (scopes.indexOf(currScopeModel.value) !== -1) {
    //     scopesModelIds.push(currScopeModel);
    //   }
    // }

    return scopesModelIds;
  }

  /**
   * Easy utility for transforming scope models to raw scopes
   * @param scopesModels - array of scope models to get as raw scopes
   */
  static transformScopeModelsToRawScopes(scopesModels: IScope[]) {
    return scopesModels.map(scope => scope.value);
  }

  /**
   * Getting all the scopes models permitted to specific client by audienceId
   * @param client - client model for getting scopes from
   * @param audienceId - the audience id the client requested scopes from
   */
  static async getAllScopesForClientAndAudience(client: IClient, audienceId: string) {

    return await scopeModel.find({ audienceId, permittedClients: client._id }) as IScope[];
  }

  /**
   * Checking sufficient scopes requested by the client.
   * Returns boolean indicates if requested scopes by the client are permitted.
   * @param clientId - object id of the client which requesting permission to the scopes
   * @param audienceId - the audience id the client requested scopes from
   * @param scopes - scopes requested by the client
   */
  static async checkSufficientScopes(clientId: string, audienceId: string, scopes: string[]) {
    return (
      (await scopeModel.find({
        audienceId,
        value: { $in: scopes },
        permittedClients: clientId,
      })).length === scopes.length
    );
  }

  /**
   * Checking if the user already approve the requested scopes by the client.
   * Returns boolean indicates if requested scopes by the client are already permitted by the user.
   * @param userId - The user id
   * @param clientId - The client object id
   * @param audienceId - The audience id
   * @param scopes - The scopes the client requested
   */
  static async checkUserApprovement(userId: string,
                                    clientId: string,
                                    audienceId: string,
                                    scopes: string[]) {
    return (
      (await userPermissionModel.aggregate([
        {
          $lookup: {
            from: `${ScopeModelName.toLowerCase()}s`,
            localField: propertyOf<IUserPermission>('scopeId'),
            foreignField: propertyOf<IScope>('_id'),
            as: propertyOf<IUserPermission>('scopeId'),
          },
        },
        { $unwind: { path: `$${propertyOf<IUserPermission>('scopeId')}` } },
        {
          $match: {
            $and: [
              { userId: { $eq: userId } },
              { clientId: { $eq: clientId } },
              {
                [`${propertyOf<IUserPermission>('scopeId')}.${propertyOf<IScope>('audienceId')}`]: {
                  $eq: audienceId,
                },
              },
              {
                [`${propertyOf<IUserPermission>('scopeId')}.${propertyOf<IScope>('value')}`]: {
                  $in: scopes,
                },
              },
            ],
          },
        },
      ])).length === scopes.length
    );
  }

  /**
   * Store in db the user approvement in userPermission model
   * @param userId - User id
   * @param clientId - Client id of the client which requested the scopes
   * @param scopes - Scopes object ids
   */
  static async saveUserApprovement(userId: string,
                                   clientId: string,
                                   scopesIds: string[]) {
    for (const scopeId of scopesIds) {
      await userPermissionModel.update(
        { userId, clientId, scopeId },
        { userId, clientId, scopeId },
        { upsert: true },
      );
    }
  }
}
