import { Schema, model } from 'mongoose';
import { IBaseModel } from '../generic/generic.interface';
import { collectionName as ClientModelName } from '../client/client.model';
import { collectionName as UserModelName } from '../user/user.model';
import { tokenUniqueValueValidator } from './token.validator';
import { clientRefValidator } from '../client/client.validator';
import { userRefValidator } from '../user/user.validator';

export interface IToken extends IBaseModel {
  clientId: string;
  userId: string;
  value: string;
  scopes: [string];
  grantType: string;
  expireAt: number;
}

const tokenSchema = new Schema({
  clientId: {
    type: String,
    ref: ClientModelName,
    required: true,
    validate: clientRefValidator,
  },
  userId: {
    type: String,
    ref: UserModelName,
    required: true,
    validate: userRefValidator,
  },
  value: {
    type: String,
    unique: true,
    required: true,
    validate: tokenUniqueValueValidator,
  },
  grantType: {
    type: String,
    required: true,
  },
  scopes: {
    type: [String],
    required: true,
  },
  expireAt: { // Expiration time of token, the token will be deleted from db by the expires value.
    type: Number,
    default: Date.now(),
    expires: 3600, // TODO: Set config file for values like that
  },
});

// Ensures there's only one token for user in specific client app
tokenSchema.index({ clientId: 1, userId: 1 }, { unique: true });

export const collectionName = 'Token';
const tokenModel = model<IToken>(collectionName, tokenSchema);

export default tokenModel;
