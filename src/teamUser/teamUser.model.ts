import { Schema, model } from 'mongoose';
import { ITeamUser, collectionName } from './teamUser.interface';
import { teamUserUniqueNameValidator } from './teamUser.validator';

const teamUserSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    validate: teamUserUniqueNameValidator,
  },
  password: {
    type: String,
    required: true,
  },
});

const teamUserModel = model<ITeamUser>(collectionName, teamUserSchema);

export default teamUserModel;
