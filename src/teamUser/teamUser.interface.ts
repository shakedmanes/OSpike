import { IBaseModel } from '../generic/generic.interface';

export interface ITeamUser extends IBaseModel {
  name: string;
  password: string;
}

export const collectionName = 'TeamUser';
