// authCode.interface

import { IBaseModel } from '../generic/generic.interface';
import { IClient } from '../client/client.interface';
import { IScope } from '../scope/scope.interface';

export interface IAuthCode extends IBaseModel {
  value: string;
  clientId: string | IClient; // Client ID or Client Model after population
  userId: string; // User ID
  userProperties: any; // User properties given by authentication provider
  audience: string; // Audience of the token (for which resource server the token should be used)
  redirectUri: string;
  scopes: string[] | IScope[];
  expireAt: Date;
}

export const collectionName = 'AuthCode';
