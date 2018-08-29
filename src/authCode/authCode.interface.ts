// authCode.interface

import { IBaseModel } from '../generic/generic.interface';
import { IClient } from '../client/client.interface';
import { IUser } from '../user/user.interface';

export interface IAuthCode extends IBaseModel {
  value: string;
  clientId: string | IClient; // Client ID or Client Model after population
  userId: string | IUser; // User ID or User model after population
  redirectUri: string;
  scopes: string[];
  expireAt: Date;
}

export const collectionName = 'AuthCode';
