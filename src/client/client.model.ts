import { Schema, model } from 'mongoose';
import { IBaseModel } from '../generic/generic.interface';
import { collectionName as TeamUserModelName } from '../teamUser/teamUser.model';
import {
  clientUniqueNameValidator,
  clientUniqueIdValidator,
  clientUniqueSecretValidator,
  clientUniqueRedirectUrisValidator,
  clientUniqueHostUriValidator,
} from './client.validator';
import { teamUserRefValidator } from '../teamUser/teamUser.validator';

export interface IClient extends IBaseModel {
  name: string;
  id: string;
  secret: string;
  redirectUris: [string];
  hostUri: string;
  teamUserId: string;
}

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
  teamUserId: {
    type: String,
    ref: TeamUserModelName,
    required: true,
    validate: teamUserRefValidator,
  },
});

export const collectionName = 'Client';
const clientModel = model<IClient>(collectionName, clientSchema);

export default clientModel;
