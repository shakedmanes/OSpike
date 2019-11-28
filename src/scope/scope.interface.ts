// scope.interface

import { IBaseModel } from '../generic/generic.interface';
import { IClient } from '../client/client.interface';

export interface IScope extends IBaseModel {
  value: string; // The actual value of the scope (actual scope name)
  audienceId: string | IClient; // The audience id of the client which the scope belong to
  permittedClients: string[] | IClient[]; // The clients which permitted to use that scope
}

export const collectionName = 'Scope';
