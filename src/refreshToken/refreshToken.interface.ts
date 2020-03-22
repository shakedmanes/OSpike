// refreshToken.interface

import { IBaseModel } from '../generic/generic.interface';
import { IAccessToken } from '../accessToken/accessToken.interface';

export interface IRefreshToken extends IBaseModel {
  value: string;
  accessTokenId: string | IAccessToken; // Access Token id or Access Token after population
  userProperties: any; // User properties from authentication provider
  expiresAt: Date;
}

export const collectionName = 'RefreshToken';
