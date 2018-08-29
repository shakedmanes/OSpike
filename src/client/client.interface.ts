// client.interface

import { IBaseModel } from '../generic/generic.interface';

export interface IClient extends IBaseModel {
  name: string;
  id: string;
  secret: string;
  redirectUris: string[];
  hostUri: string;
  scopes: string[]; // Optional field for usage of client_credentials flow, may be empty
  registrationToken: string;
}

export const collectionName = 'Client';
