import {
  clientIdValueGenerator,
  clientSecretValueGenerator,
  registrationTokenValueGenerator,
} from '../../utils/valueGenerator';
import { IClientBasicInformation, IClientInformation } from './management.interface';
import clientModel from '../../client/client.model';

// TODO: Add access only for the special client who registers other clients

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
   * @param clientRegistrationToken - Client registration token issued at registration of the client
   * @param clientId - Client identifier given by authorization server
   * @returns The client information
   */
  static async readClient(clientRegistrationToken: string, clientId: string) {

    const clientDoc =
      await ManagementController.validateAndGetClient(clientRegistrationToken, clientId);

    if (clientDoc) {
      return clientDoc;
    }

    throw new Error('Invalid client id or client registration token given');
  }

  /**
   * Updates client information in authorization server
   * @param clientRegistrationToken - Client registration token issued at registration of the client
   * @param clientInformation - Client information to update
   * @returns The updated client information
   */
  static async updateClient(clientRegistrationToken: string,
                            clientId: string,
                            clientInformation: IClientBasicInformation) {

    const clientDoc =
      await ManagementController.validateAndGetClient(clientRegistrationToken, clientId);

    if (clientDoc) {
      return await clientDoc.update(clientInformation);
    }

    throw new Error('Invalid client id or client registration token given');

  }

  /**
   * Deletes the client from the relay parties of authorization server
   * @param clientRegistrationToken - Client registration token issued at registration of the client
   * @param clientId - Client identifier given by authorization server
   * @returns Boolean indicates if the client have been deleted or not
   */
  static async deleteClient(clientRegistrationToken: string, clientId: string) {

    const clientDoc =
      await ManagementController.validateAndGetClient(clientRegistrationToken, clientId);

    if (clientDoc) {
      return !! await clientDoc.remove();
    }

    throw new Error('Invalid client id or client registration token given');
  }

  /**
   * Validates that the client registration token and the client id given are correct
   * @param clientRegistrationToken - Client registration token issued at registration of the client
   * @param clientId - Client identifier given by authorization server
   * @returns Client model if found and validated, otherwise false
   */
  private static async validateAndGetClient(clientRegistrationToken: string, clientId: string) {
    const clientDoc = await clientModel.findOne({ id: clientId });

    if (clientDoc && clientDoc.registrationToken === clientRegistrationToken) {
      return clientDoc;
    }

    return false;
  }

}
