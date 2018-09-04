// management.controller

import {
  clientIdValueGenerator,
  clientSecretValueGenerator,
  registrationTokenValueGenerator,
} from '../../utils/valueGenerator';
import { IClientBasicInformation, IClientInformation } from './management.interface';
import clientModel from '../../client/client.model';
import { ClientNotFound } from './management.error';
import { InvalidParameter } from '../../utils/error';

// TODO: Add error handling
// TODO: aggregate mongoose model properties

export class ManagementController {

  /**
   * Registers client as relay party in authorization server
   * @param clientInformation - Client information given from the user
   * @returns Registered client information
   */
  static async registerClient(clientInformation: IClientBasicInformation) {

    // Creating the client model with whole values in the db
    const clientDoc = await new clientModel({
      id: clientIdValueGenerator(),
      secret: clientSecretValueGenerator(),
      registrationToken: registrationTokenValueGenerator(),
      ...clientInformation,
    }).save();

    return clientDoc;
  }

  /**
   * Reads client information from authorization server
   * @param clientId - Client identifier given by authorization server
   * @returns The client information
   */
  static async readClient(clientId: string) {

    const clientDoc = await clientModel.findOne({ id: clientId });

    if (clientDoc) {
      return clientDoc;
    }

    throw new ClientNotFound('Invalid client id or client registration token given');
  }

  /**
   * Updates client information in authorization server
   * @param clientInformation - Client information to update
   * @returns The updated client information
   */
  static async updateClient(clientId: string, clientInformation: IClientBasicInformation) {

    const clientDoc = await clientModel.findOneAndUpdate(
      { id: clientId },
      { $set: clientInformation },
      { new: true, runValidators: true },
    );

    if (clientDoc) {
      return clientDoc;
    }

    throw new InvalidParameter('Invalid client id or client registration token given');
  }

  /**
   * Deletes the client from the relay parties of authorization server
   * @param clientId - Client identifier given by authorization server
   * @returns Boolean indicates if the client have been deleted or not
   */
  static async deleteClient(clientId: string) {

    const clientDoc = await clientModel.findOne({ id: clientId });

    if (clientDoc) {
      return !! await clientDoc.remove();
    }

    throw new InvalidParameter('Invalid client id or client registration token given');
  }
}
