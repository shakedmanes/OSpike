import { Schema, model } from 'mongoose';
import { IUser, collectionName } from './user.interface';
import { userUniqueEmailValidator } from './user.validator';
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

const userModel = model<IUser>(collectionName, userSchema);

export default userModel;
