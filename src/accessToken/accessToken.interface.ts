// accessToken.interface

import { IBaseModel } from '../generic/generic.interface';
import { IClient } from '../client/client.interface';
import { IScope } from '../scope/scope.interface';

export interface IAccessToken extends IBaseModel {
  clientId: string | IClient; // Client ID or Client Model after population
  userId?: string; // User ID
  audience: string; // Audience of the token (for which resource server the token should be used)
  value: string;
  scopes: string[] | IScope[];
  grantType: string;
  expireAt: Date;
}

export const collectionName = 'AccessToken';
