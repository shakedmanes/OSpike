import { IClientBasicInformation, IClientInformation } from './management.interface';
import clientModel from '../../client/client.model';

class ManagementController {

  /**
   * Registers client as relay party in authorization server
   * @param clientInformation - Client information given from the user
   */
  static async registerClient(clientInformation: IClientBasicInformation) {
    // TODO: Implement registration of client
  }

  /**
   * Reads client information from authorization server
   * @param clientRegistrationToken - Client registration token issued at registration of the client
   * @param clientId - Client identifier given by authorization server
   */
  static async readClient(clientRegistrationToken: string, clientId: string) {

    // TODO: implement read of client
    if (ManagementController.validateClient(clientRegistrationToken, clientId)) {

    }

    throw new Error('Invalid client id or client registration token given');
  }

  /**
   * Updates client information in authorization server
   * @param clientRegistrationToken - Client registration token issued at registration of the client
   * @param clientInformation - Client information to update
   */
  static async updateClient(clientRegistrationToken: string,
                            clientId: string,
                            clientInformation: IClientBasicInformation) {

    // TODO: implement update of client
    if (ManagementController.validateClient(clientRegistrationToken, clientId)) {

    }

    throw new Error('Invalid client id or client registration token given');

  }

  /**
   * Deletes the client from the relay parties of authorization server
   * @param clientRegistrationToken - Client registration token issued at registration of the client
   * @param clientId - Client identifier given by authorization server
   */
  static async deleteClient(clientRegistrationToken: string, clientId: string) {

    // TODO: implement delete of client
    if (ManagementController.validateClient(clientRegistrationToken, clientId)) {

    }

    throw new Error('Invalid client id or client registration token given');
  }

  /**
   * Validates that the client registration token and the client id given are correct
   * @param clientRegistrationToken - Client registration token issued at registration of the client
   * @param clientId - Client identifier given by authorization server
   */
  private static async validateClient(clientRegistrationToken: string, clientId: string) {
    const clientDoc = await clientModel.findOne({ id: clientId });

    if (clientDoc && clientDoc.registrationToken === clientRegistrationToken) {
      return true;
    }

    return false;
  }

}
