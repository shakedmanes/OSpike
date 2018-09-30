// user.model

import { Schema, model } from 'mongoose';
import { IUser, collectionName } from './user.interface';
import { generatePasswordHash } from '../utils/hashUtils';

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

userSchema.pre<IUser>('save', function save() {
  this.password = generatePasswordHash(this.password);
});

const userModel = model<IUser>(collectionName, userSchema);

export default userModel;
