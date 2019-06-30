// management.controller

import { URL } from 'url';
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
import { ClientNotFound, BadClientInformation } from './management.error';

// TODO: Add error handling
// TODO: aggregate mongoose model properties

export class ManagementController {

  public static readonly ERROR_MESSAGES: { [error: string]: string} = {
    MISSING_CLIENT_PROP: `Invalid client information given, format:
    { name: XXX, hostUris: [https://XXX], redirectUris: [https://XXX/YYY]}`,
    INVALID_CLIENT_UPDATE_PARAMS: `Invalid client update information given, format:
    { name?: XXX, hostUris?: [https://XXX], redirectUris?: [https://XXX/YYY]}`,
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
      redirectUris: clientInformation.redirectUris.map(val => new URL(val).toString()),
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

      // Lowercase all the hostUris if exist
      if (clientInformation.hostUris) {
        clientInformation.hostUris = clientInformation.hostUris.map(val => val.toLowerCase());
      }

      // Lowercase all the redirectUris if exist
      if (clientInformation.redirectUris) {
        clientInformation.redirectUris =
          clientInformation.redirectUris.map(val => new URL(val).toString());
      }

      // tslint:disable-next-line:max-line-length
      // // If we update the hostUri, we need to update the current redirectUris with the new hostUri
      // if (clientInformation.hostUri && clientInformation.hostUri !== clientDoc.hostUri) {
      //   const clientHostUri = clientInformation.hostUri;
      //   clientInformation.hostUri = clientInformation.hostUri.toLowerCase();
      //   const regHostsUri = new RegExp(
      //     `(${clientDoc.hostUri}|${clientHostUri})`,
      //   );

      //   for (let index = 0; index < clientDoc.redirectUris.length; index += 1) {
      //     clientDoc.redirectUris[index] =
      //       clientDoc.redirectUris[index].replace(regHostsUri, clientInformation.hostUri);
      //   }

      //   if (clientInformation.redirectUris) {
      //     for (let index = 0; index < clientInformation.redirectUris.length; index += 1) {
      //       clientInformation.redirectUris[index] =
      // tslint:disable-next-line:max-line-length
      //         clientInformation.redirectUris[index].replace(regHostsUri, clientInformation.hostUri);
      //     }
      //   }
      // }

      Object.assign(clientDoc, clientInformation);
      await clientDoc.save();

      return clientDoc;
    }

    throw new ClientNotFound('Invalid client id or client registration token given');
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
