// scope.utils.ts

import scopeModel from './scope.model';
import { propertyOf } from '../utils/objectUtils';
import { IScope } from './scope.interface';
import { IClient } from '../client/client.interface';

export class ScopeUtils {

  // UNSAFE
  static async transformRawScopesToModels(scopes: string[], audienceId: string) {

    // Will contains all the models for the requested scopes
    const scopesModelIds = [];

    // First of all, get all the scopes for the specific audience
    const allScopesForAudience =
      await scopeModel.find({ [propertyOf<IScope>('audienceId')]: audienceId });

    // Filter all the scopes that contained in the raw scopes names
    for (const currScopeModel of allScopesForAudience) {
      if (scopes.indexOf(currScopeModel.value) !== -1) {
        scopesModelIds.push(currScopeModel);
      }
    }

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
}
