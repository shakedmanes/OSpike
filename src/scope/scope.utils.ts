// scope.utils.ts

import scopeModel from './scope.model';
import { propertyOf } from '../utils/objectUtils';
import { IScope } from './scope.interface';
import { IClient } from '../client/client.interface';

export class ScopeUtils {

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
   * Transforms and filters client scopes models ids to raw scopes
   * for the specific audience which he requested
   * @param client - client model for getting scopes from
   * @param audienceId - the audience id the client requested scopes from
   */
  static async transformScopesModelsToRawScopes(client: IClient, audienceId: string) {

    const rawScopes = [];

    const populatedScopes = (await client.populate('scopes')).scopes as IScope[];

    for (const currScopeModel of populatedScopes) {
      if (currScopeModel.audienceId === audienceId) {
        rawScopes.push(currScopeModel.value);
      }
    }

    return rawScopes;
  }
}
