// authCode.model

import { Schema, model } from 'mongoose';
import {
  IClient,
  collectionName as ClientModelName,
} from '../client/client.interface';
import { collectionName as UserModelName } from '../user/user.interface';
import { IAuthCode, collectionName } from './authCode.interface';
import { authCodeUniqueValueValidator } from './authCode.validator';
import config from '../config';

const authCodeSchema = new Schema({
  value: {
    type: String,
    unique: true,
    required: true,
    validate: authCodeUniqueValueValidator,
  },
  clientId: {
    type: String,
    ref: ClientModelName,
    required: true,
  },
  userId: {
    type: String,
    ref: UserModelName,
    required: true,
  },
  redirectUri: {
    type: String,
    required: true,
  },
  scopes: {
    type: [String],
    required: true,
  },
  expireAt: {
    type: Date,
    default: Date.now,
    expires: config.AUTH_CODE_EXPIRATION_TIME,
  },
});

// Ensures there's only one code for client and user combination
authCodeSchema.index({ clientId: 1, userId: 1 }, { unique: true });

// TODO: Implement proper exception handling for this throwed error
// Checking if redirectUri specified is in the redirect uris of the client model
authCodeSchema.pre<IAuthCode>('validate', async function () {
  const clientModel = await model<IClient>(ClientModelName).findOne({ id: this.clientId });
  if (clientModel && clientModel.redirectUris.indexOf(this.redirectUri) !== -1) {
    throw new Error('Reference Error - RedirectUri doesn\'t exists in client model');
  }
});

const authCodeModel = model<IAuthCode>(collectionName, authCodeSchema);

export default authCodeModel;
