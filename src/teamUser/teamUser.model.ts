import { Schema, model } from 'mongoose';
import { IBaseModel } from '../generic/generic.interface';
import { teamUserUniqueNameValidator } from './teamUser.validator';

export interface ITeamUser extends IBaseModel {
  name: string;
  password: string;
}

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

export const collectionName = 'TeamUser';
const teamUserModel = model<ITeamUser>(collectionName, teamUserSchema);

export default teamUserModel;
