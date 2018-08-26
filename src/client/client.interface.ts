import { IBaseModel } from '../generic/generic.interface';

export interface IClient extends IBaseModel {
  name: string;
  id: string;
  secret: string;
  redirectUris: [string];
  hostUri: string;
  teamUserId: string;
}

export const collectionName = 'Client';
