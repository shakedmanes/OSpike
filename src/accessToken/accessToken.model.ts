// accessToken.model

import { Schema, model } from 'mongoose';
import { collectionName as ClientModelName } from '../client/client.interface';
import { collectionName as UserModelName } from '../user/user.interface';
import { IAccessToken, collectionName } from './accessToken.interface';
import { clientRefValidator } from '../client/client.validator';
import { userRefValidator } from '../user/user.validator';
import config from '../config';

// TODO: Define scope model and scope types
// TODO: Define specific grant types available for token

export const errorMessages = {
  DUPLICATE_ACCESS_TOKEN: `There's already token for the client and the user and the audience.`,
  DUPLICATE_ACCESS_TOKEN_WITHOUT_USER: `There's already token for the client and the audience.`,
};

const accessTokenSchema = new Schema(
  {
    clientId: {
      type: String,
      ref: ClientModelName,
      required: true,
      validate: clientRefValidator as any,
    },
    userId: {
      type: String,
      ref: UserModelName,
      // required: true,
      validate: userRefValidator as any,
    },
    audience: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      unique: true,
      required: true,
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
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

// Ensures there's only one token for user in specific client app and audience
accessTokenSchema.index({ clientId: 1, userId: 1, audience: 1 }, { unique: true });

accessTokenSchema.pre<IAccessToken>(
  'save',
  async function (this: IAccessToken, next: any) {
    const foundToken = await accessTokenModel.findOne({
      clientId: this.clientId,
      ...(this.userId ? { userId: this.userId } : { userId : { $exists: false } }),
      audience: this.audience,
    });

    if (foundToken &&
       (foundToken.expireAt.getTime() +
       (config.ACCESS_TOKEN_EXPIRATION_TIME * 1000)) <= Date.now()) {
      await foundToken.remove();
    }

    next();
  });

// Construct better error handling for errors from mongo server
accessTokenSchema.post('save', function save(this: IAccessToken, err: any, doc: any, next: any) {
  if (err.name === 'MongoError' && err.code === 11000) {
    err.message = this.userId ? errorMessages.DUPLICATE_ACCESS_TOKEN :
                                errorMessages.DUPLICATE_ACCESS_TOKEN_WITHOUT_USER;
  }

  next(err);
});

// Virtual field for audience client validations and population
accessTokenSchema.virtual('audienceClient', {
  ref: ClientModelName,
  localField: 'audience',
  foreignField: 'hostUri',
  justOne: true,
});

/**
 * ############ FOR FUTURE VERSIONS ONLY ############
 * We can decide for each client, how much he want the user to have a token.
 * To do so, we need to modify some things:
 *
 * 1. Set specific TTL for deletion of access token document based on 'expireAt' field.
 *    Uncomment the following code:
 *
 * accessTokenSchema.index(
 *   { expireAt: 1 },
 *   { expireAfterSeconds: config.ACCESS_TOKEN_EXPIRATION_TIME }
 * );
 *
 * 2. At 'expireAt' field of the document, we should remove the 'expires' field (because we already
 *    declared it the index above) and we set the 'expireAt' field for any time we want the document
 *    to be deleted. (Maybe querying about the client document associate to that token and set the
 *    time according to its configuration [Maybe field inside client documents, which indicates the
 *    token TTL for each user])
 *    BIG NOTE: We can specify range limit of the 'expireAt' field for not allowing user to create
 *              infinite token. (setting expireAfterSeconds to minimum field value, and somehow
 *              validate the 'expireAt' field to not exceed the current time plus maximum constant
 *              time for token. [expireAt <= Date.now() + ACCESS_TOKEN_MAX_TIME])
 *
 * 3. Update the refresh token model to expire after the expiration time of the access token
 *    associated to it and add constant time for it (The expiration time of the refresh token
 *    could be set by the oauth2.controller file inside the authorization code exchange method)
 */

const accessTokenModel = model<IAccessToken>(collectionName, accessTokenSchema);

export default accessTokenModel;
