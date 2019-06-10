// management.interface

import { IClient } from '../../client/client.interface';

// Client information given by the user
export interface IClientBasicInformation {
  name: IClient['name'];
  redirectUris: IClient['redirectUris'];
  hostUris: IClient['hostUris'];
  scopes?: IClient['scopes'];
}

// Whole client information needed in db
export interface IClientInformation extends IClientBasicInformation {
  id: IClient['id'];
  secret: IClient['secret'];
  audienceId: IClient['audienceId'];
  registrationToken: IClient['registrationToken'];
}
