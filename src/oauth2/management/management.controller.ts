// management.controller

import {
  clientIdValueGenerator,
  clientSecretValueGenerator,
  audienceIdValueGenerator,
  registrationTokenValueGenerator,
} from '../../utils/valueGenerator';
import {
  IClientBasicInformation,
  isIClientBasicInformation,
  isPartialIClientBasicInformation,
} from './management.interface';
import clientModel from '../../client/client.model';
import accessTokenModel from '../../accessToken/accessToken.model';
import authCodeModel from '../../authCode/authCode.model';
import { ClientNotFound, BadClientInformation } from './management.error';

// TODO: Add error handling
// TODO: aggregate mongoose model properties

export class ManagementController {

  public static readonly ERROR_MESSAGES: { [error: string]: string} = {
    MISSING_CLIENT_PROP: `Invalid client information given, format:
    { name: XXX, hostUris: [https://XXX], redirectUris: [/YYY]}`,
    INVALID_CLIENT_UPDATE_PARAMS: `Invalid client update information given, format:
    { name?: XXX, hostUris?: [https://XXX], redirectUris?: [/YYY]}`,
    DUPLICATE_HOST_URI: `Invalid client information given, Duplicate host uri found`,
  };

  /**
   * Registers client as relay party in authorization server
   * @param clientInformation - Client information given from the user
   * @returns Registered client information
   */
  static async registerClient(clientInformation: IClientBasicInformation) {

    // Checking if the client information received is malformed
    if (!isIClientBasicInformation(clientInformation)) {
      throw new BadClientInformation(ManagementController.ERROR_MESSAGES.MISSING_CLIENT_PROP);
    }

    // Creating the client model with whole values in the db
    const clientDoc = await new clientModel({
      id: clientIdValueGenerator(),
      secret: clientSecretValueGenerator(),
      audienceId: audienceIdValueGenerator(),
      registrationToken: registrationTokenValueGenerator(),
      ...clientInformation,
      // Override the hostUris to lowercases
      hostUris: clientInformation.hostUris.map(val => val.toLowerCase()),
      // Override the redirectUris to lowercases
      redirectUris: clientInformation.redirectUris.map(val => val.toLowerCase()),
    }).save();

    return clientDoc;
  }

  /**
   * Reads client information from authorization server
   * @param clientId - Client identifier given by authorization server
   * @returns The client information
   */
  static async readClient(clientId: string) {

    const clientDoc =
      await clientModel.findOne({ id: clientId }).lean();

    if (clientDoc) {
      delete clientDoc.__v;
      return clientDoc;
    }

    throw new ClientNotFound('Invalid client id or client registration token given');
  }

  /**
   * Updates client information in authorization server
   * @param clientId - Client id of the client to update
   * @param clientInformation - Client information to update
   * @returns The updated client information
   */
  static async updateClient(clientId: string, clientInformation: Partial<IClientBasicInformation>) {

    // Checking if the update information is malformed
    if (!isPartialIClientBasicInformation(clientInformation)) {
      throw new BadClientInformation(
        ManagementController.ERROR_MESSAGES.INVALID_CLIENT_UPDATE_PARAMS,
      );
    }

    // Due to problem getting the model when updating, we need to seperate the query to
    // 2, one for getting the model and updating the changes, other for setting the changes
    // and checking it via the validators.
    const clientDoc = await clientModel.findOne({ id: clientId });

    if (clientDoc) {

      const updatedHostUris: any = {};

      // Lowercase all the hostUris if exist
      if (clientInformation.hostUris) {
        clientInformation.hostUris = clientInformation.hostUris.map(val => val.toLowerCase());
        const setHostUris = new Set(clientInformation.hostUris);

        if (clientInformation.hostUris.length !== setHostUris.size) {
          throw new BadClientInformation(this.ERROR_MESSAGES.DUPLICATE_HOST_URI);
        }
      }

      // Lowercase all the redirectUris if exist
      if (clientInformation.redirectUris) {
        clientInformation.redirectUris =
          clientInformation.redirectUris.map(val => val.toLowerCase());
      }

      Object.assign(clientDoc, clientInformation);
      await clientDoc.save();

      return clientDoc;
    }

    throw new ClientNotFound('Invalid client id or client registration token given');
  }

  /**
   * Reset client credentials (Client ID, Client Secret) and all access tokens and auth codes
   * for specific client.
   * @param clientId - Client id of the client to reset
   * @returns The updated client information
   */
  static async resetClientCredentials(clientId: string) {

    const clientDoc = await clientModel.findOne({ id: clientId });

    if (!clientDoc) {
      throw new ClientNotFound('Invalid client id or client registration token given');
    }

    // Removing all associated access tokens and auth codes for the client
    await accessTokenModel.remove({ clientId: clientDoc._id });
    await authCodeModel.remove({ clientId: clientDoc._id });

    // Generate new client id and client secret
    clientDoc.id = clientIdValueGenerator();
    clientDoc.secret = clientSecretValueGenerator();
    await clientDoc.save();

    return clientDoc;
  }

  /**
   * Deletes the client from the relay parties of authorization server
   * @param clientId - Client identifier given by authorization server
   * @returns Boolean indicates if the client have been deleted or not
   */
  static async deleteClient(clientId: string) {

    const clientDoc = await clientModel.findOneAndRemove({ id: clientId });

    if (clientDoc) {
      return true;
    }

    throw new ClientNotFound('Invalid client id or client registration token given');
  }
}
