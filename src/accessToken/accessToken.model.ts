import { Schema, model } from 'mongoose';
import { collectionName as ClientModelName } from '../client/client.interface';
import { collectionName as UserModelName } from '../user/user.interface';
import { IAccessToken, collectionName } from './accessToken.interface';
import { accessTokenUniqueValueValidator } from './accessToken.validator';
import { clientRefValidator } from '../client/client.validator';
import { userRefValidator } from '../user/user.validator';
import config from '../config';

// TODO: Define scope model and scope types
// TODO: Define specific grant types available for token

const accessTokenSchema = new Schema({
  clientId: {
    type: String,
    ref: ClientModelName,
    required: true,
    validate: clientRefValidator,
  },
  userId: {
    type: String,
    ref: UserModelName,
    // required: true,
    validate: userRefValidator,
  },
  value: {
    type: String,
    unique: true,
    required: true,
    validate: accessTokenUniqueValueValidator,
  },
  scopes: {
    type: [String],
    required: true,
  },
  grantType: {
    type: String,
    required: true,
  },
  expireAt: { // Expiration time of token, the token will be deleted from db by the expires value.
    type: Date,
    default: Date.now,
    expires: config.ACCESS_TOKEN_EXPIRATION_TIME,
  },
});

// Ensures there's only one token for user in specific client app
accessTokenSchema.index({ clientId: 1, userId: 1 }, { unique: true });

const accessTokenModel = model<IAccessToken>(collectionName, accessTokenSchema);

export default accessTokenModel;
