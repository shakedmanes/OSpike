// client.model

import { Schema, model } from 'mongoose';
import { IClient, collectionName } from './client.interface';
import {
  clientUniqueNameValidator,
  clientUniqueIdValidator,
  clientUniqueSecretValidator,
  clientUniqueRedirectUrisValidator,
  clientUniqueHostUriValidator,
  clientRegistrationTokenUniqueValidator,
} from './client.validator';

const clientSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    validate: clientUniqueNameValidator,
  },
  id: {
    type: String,
    unique: true,
    required: true,
    validate: clientUniqueIdValidator,
  },
  secret: {
    type: String,
    unique: true,
    required: true,
    validate: clientUniqueSecretValidator,
  },
  redirectUris: {
    type: [String],
    unique: true,
    required: true,
    validate: clientUniqueRedirectUrisValidator,
  },
  hostUri: {
    type: String,
    unique: true,
    required: true,
    validate: clientUniqueHostUriValidator,
  },
  scopes: {
    type: [String],
    default: [],
  },
  registrationToken: {
    type: String,
    required: true,
    validate: clientRegistrationTokenUniqueValidator,
  },
});

clientSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
};

const clientModel = model<IClient>(collectionName, clientSchema);

export default clientModel;
