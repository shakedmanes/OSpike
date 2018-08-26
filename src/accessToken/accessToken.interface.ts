import { IBaseModel } from '../generic/generic.interface';
import { IClient } from '../client/client.interface';
import { IUser } from '../user/user.interface';

export interface IAccessToken extends IBaseModel {
  clientId: string | IClient; // Client ID or Client Model after population
  userId: string | IUser; // User ID or User model after population
  value: string;
  scopes: [string];
  grantType: string;
  expireAt: Date;
}

export const collectionName = 'AccessToken';
