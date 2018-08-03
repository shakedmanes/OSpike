import { Schema, model } from 'mongoose';
import { IBaseModel } from '../generic/generic.interface';
import { collectionName as ClientModelName, IClient } from '../client/client.model';
import { collectionName as UserModelName } from '../user/user.model';
import { codeUniqueValueValidator } from './code.validator';

export interface ICode extends IBaseModel {
  value: string;
  clientId: string;
  userId: string;
  redirectUri: string;
}

const codeSchema = new Schema({
  value: {
    type: String,
    unique: true,
    required: true,
    validate: codeUniqueValueValidator,
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
});

// Ensures there's only one code for client and user combination
codeSchema.index({ clientId: 1, userId: 1 }, { unique: true });

// TODO: Implement proper exception handling for this throwed error
// Checking if redirectUri specified is in the redirect uris of the client model
codeSchema.pre<ICode>('validate', async function () {
  const clientModel = await model<IClient>(ClientModelName).findOne({ id: this.clientId });
  if (clientModel && clientModel.redirectUris.indexOf(this.redirectUri) !== -1) {
    throw new Error('Reference Error - RedirectUri doesn\'t exists in client model');
  }
});

export const collectionName = 'Code';
const codeModel = model<ICode>(collectionName, codeSchema);

export default codeModel;
