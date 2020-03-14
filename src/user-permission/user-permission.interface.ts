// userPermission.interface

import { IBaseModel } from '../generic/generic.interface';
import { IClient } from '../client/client.interface';
import { IScope } from '../scope/scope.interface';

export interface IUserPermission extends IBaseModel {
  userId: string;
  clientId: string | IClient;
  scopeId: string | IScope;
}

export const collectionName = 'UserPermission';
