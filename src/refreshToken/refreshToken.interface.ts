import { IBaseModel } from '../generic/generic.interface';
import { IAccessToken } from '../accessToken/accessToken.interface';

export interface IRefreshToken extends IBaseModel {
  value: string;
  accessTokenId: string | IAccessToken; // Access Token id or Access Token after population
  expiresAt: Date;
}

export const collectionName = 'RefreshToken';
