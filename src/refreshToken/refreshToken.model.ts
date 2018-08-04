import { Schema, model } from 'mongoose';
import { IBaseModel } from '../generic/generic.interface';
import { refreshTokenUniqueValueValidator } from './refreshToken.validator';
import { accessTokenRefValidator } from '../accessToken/accessToken.validator';
import {
  collectionName as AccessTokenModelName,
  IAccessToken,
} from '../accessToken/accessToken.model';
import config from '../config';

export interface IRefreshToken extends IBaseModel {
  value: string;
  accessTokenId: string | IAccessToken; // Access Token id or Access Token after population
  expiresAt: Date;
}

// TODO: Check if multiple refresh token reference the same access token

const refreshTokenSchema = new Schema({
  value: {
    type: String,
    unique: true,
    required: true,
    validate: refreshTokenUniqueValueValidator,
  },
  accessTokenId: {
    type: String,
    ref: AccessTokenModelName,
    unique: true,
    required: true,
    validate: accessTokenRefValidator,
  },
  expireAt: {
    type: Date,
    default: Date.now,
    expires: config.REFRESH_TOKEN_EXPIRATION_TIME,
  },
});

export const collectionName = 'RefreshToken';
const refreshTokenModel = model<IRefreshToken>(collectionName, refreshTokenSchema);

export default refreshTokenModel;
