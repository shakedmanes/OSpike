
// Client information given by the user
export interface IClientBasicInformation {
  name: string;
  redirectUris: string[];
  hostUri: string;
  scopes?: string[];
}

// Whole client information needed in db
export interface IClientInformation extends IClientBasicInformation {
  id: string;
  secret: string;
  registrationToken: string;
}
