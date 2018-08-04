import { Schema, model } from 'mongoose';
import { IBaseModel } from '../generic/generic.interface';
import { userUniqueEmailValidator } from './user.validator';
import { generatePasswordHash } from '../utils/hashUtils';

export interface IUser extends IBaseModel {
  name: string;
  email: string;
  password: string;
}

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: userUniqueEmailValidator,
  },
  password: {
    type: String,
    required: true,
  },
});

userSchema.pre<IUser>('save', function save() {
  this.password = generatePasswordHash(this.password);
});

export const collectionName = 'User';
const userModel = model<IUser>(collectionName, userSchema);

export default userModel;
