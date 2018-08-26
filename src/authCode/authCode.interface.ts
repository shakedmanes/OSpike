import { IBaseModel } from '../generic/generic.interface';
import { IClient } from '../client/client.model';
import { IUser } from '../user/user.model';

export interface IAuthCode extends IBaseModel {
  value: string;
  clientId: string | IClient; // Client ID or Client Model after population
  userId: string | IUser; // User ID or User model after population
  redirectUri: string;
  scopes: [string];
  expireAt: Date;
}

export const collectionName = 'AuthCode';
