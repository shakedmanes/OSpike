// management.interface

import { IClient } from '../../client/client.interface';
import { propertyOf } from '../../test';

// Client information given by the user
export interface IClientBasicInformation {
  name: IClient['name'];
  redirectUris: IClient['redirectUris'];
  hostUris: IClient['hostUris'];
  scopes?: IClient['scopes'];
}

export const numIClientBasicInformationLength = 4;

// Type guard for client basic information
export const isIClientBasicInformation = (obj: any): obj is IClientBasicInformation => {
  return (
    obj &&
    obj[propertyOf<IClientBasicInformation>('name')] &&
    obj[propertyOf<IClientBasicInformation>('redirectUris')] &&
    obj[propertyOf<IClientBasicInformation>('hostUris')] &&
    Object.keys(obj).length === numIClientBasicInformationLength - 1
    // Uncomment this when scopes feature ready
    // obj[propertyOf<IClientBasicInformation>('scopes')] &&
    // Object.keys(obj).length === numIClientBasicInformationLength
  );
};

export const isPartialIClientBasicInformation =
  (obj: any): obj is Partial<IClientBasicInformation> => {
    const props = [
      propertyOf<IClientBasicInformation>('name'),
      propertyOf<IClientBasicInformation>('redirectUris'),
      propertyOf<IClientBasicInformation>('hostUris'),
      // Uncomment this when scopes feature ready
      // propertyOf<IClientBasicInformation>('scopes'),
    ];
    let numPropsFound = 0;

    if (!obj) {
      return false;
    }

    for (const prop of props) {
      numPropsFound += (obj.hasOwnProperty(prop)) ? 1 : 0;
    }

    // Checks if the properties of the object are only from the props array and
    // if the properties given is only from the props without any other properties
    return (numPropsFound === Object.keys(obj).length && numPropsFound <= props.length);
  };

// Whole client information needed in db
export interface IClientInformation extends IClientBasicInformation {
  id: IClient['id'];
  secret: IClient['secret'];
  audienceId: IClient['audienceId'];
  registrationToken: IClient['registrationToken'];
}
