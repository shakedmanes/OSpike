import { IBaseModel } from '../generic/generic.interface';

export interface IUser extends IBaseModel {
  name: string;
  email: string;
  password: string;
}

export const collectionName = 'User';
