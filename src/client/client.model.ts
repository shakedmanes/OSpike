// client.model

import { Schema, model } from 'mongoose';
import { IClient, collectionName } from './client.interface';
import { hostUriRegexValidator, redirectUrisValidator } from './client.validator';

const clientSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  id: {
    type: String,
    unique: true,
    required: true,
  },
  secret: {
    type: String,
    unique: true,
    required: true,
  },
  redirectUris: {
    type: [String],
    unique: true,
    required: true,
    validate: redirectUrisValidator,
  },
  hostUri: {
    type: String,
    unique: true,
    required: true,
    validate: hostUriRegexValidator,
  },
  scopes: {
    type: [String],
    default: [],
  },
  registrationToken: {
    type: String,
    unique: true,
    required: true,
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
