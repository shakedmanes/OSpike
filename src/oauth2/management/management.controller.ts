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

  // Projection fields to exclude from client document
  static readonly clientProjectionFields = { _id: 0, __v: 0 };

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
  static async updateClient(clientId: string, clientInformation: IClientBasicInformation) {

    // Due to problem getting the model when updating, we need to seperate the query to
    // 2, one for getting the model and updating the changes, other for setting the changes
    // and checking it via the validators.
    const clientDoc = await clientModel.findOne({ id: clientId });

    if (clientDoc) {
      Object.assign(clientDoc, clientInformation);
      await clientDoc.save();

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

    const clientDoc = await clientModel.findOneAndRemove({ id: clientId });

    if (clientDoc) {
      return true;
    }

    throw new InvalidParameter('Invalid client id or client registration token given');
  }
}
