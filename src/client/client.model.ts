import { Schema, model } from 'mongoose';
import { collectionName as TeamUserModelName } from '../teamUser/teamUser.interface';
import { IClient, collectionName } from './client.interface';
import {
  clientUniqueNameValidator,
  clientUniqueIdValidator,
  clientUniqueSecretValidator,
  clientUniqueRedirectUrisValidator,
  clientUniqueHostUriValidator,
  clientRegistrationTokenUniqueValidator,
} from './client.validator';
import { teamUserRefValidator } from '../teamUser/teamUser.validator';

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

const clientModel = model<IClient>(collectionName, clientSchema);

export default clientModel;
