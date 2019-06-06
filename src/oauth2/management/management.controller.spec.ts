// management.controller.spec

import { expect } from 'chai';
import * as mongoose from 'mongoose';
import { ManagementController } from './management.controller';
import { IClientInformation, IClientBasicInformation } from './management.interface';
import { deleteCollections, propertyOf } from '../../test';
import clientModel from '../../client/client.model';
import { ClientNotFound } from './management.error';

describe('Client Management Operations Functionality', async () => {

  // Setting data mocks
  const clientBasicMock: IClientBasicInformation = {
    name: 'TestClient',
    hostUri: ['https://test.client', 'https://testing.client'],
    redirectUris: ['https://test.client/callback', 'https://testing.client/callback'],
    scopes: ['read'],
  };

  const clientBasicMock2: IClientBasicInformation = {
    name: 'TestClient2',
    hostUri: ['https://test2.client'],
    redirectUris: ['https://test2.client/callback2'],
  };

  // Registered clients for updating queries
  let registerdClient = new clientModel({
    id: '123456789',
    secret: 'shhhhhitsecret',
    audienceId: 'audienceIdRegisteredClient',
    registrationToken: 'blablaregistrationtoken',
    name: 'RegisterdClient',
    hostUri: ['https://www.www'],
    redirectUris: ['https://www.www/callback'],
    scopes: ['read'],
  });

  let registerdClient2 = new clientModel({
    id: '987654321',
    secret: 'classifiedsecret',
    audienceId: 'audienceIdRegisteredClient2',
    registrationToken: 'registrationtokenofclient',
    name: 'RegisterdClient2',
    hostUri: ['https://www2.www2'],
    redirectUris: ['https://www2.www2/callback'],
  });

  let registerdClient3 = new clientModel({
    id: '129305023',
    secret: 'supersecretkey',
    audienceId: 'audienceIdRegisteredClient3',
    registrationToken: 'registrationTokenOfClient',
    name: 'RegisterdClient3',
    hostUri: ['https://www3.www3'],
    redirectUris: ['https://www3.www3/callback'],
  });

  // Clients for delete queries
  let deleteClient = new clientModel({
    id: 'abcdefghijk',
    secret: 'csecretttttt',
    audienceId: 'audienceIdDeletedClient',
    registrationToken: 'clienttokenregistration',
    name: 'deleteClient',
    hostUri: ['https://rlwrwrwok.w'],
    redirectUris: ['https://rlwrwrwok.w/callback'],
    scopes: ['read'],
  });

  let deleteClient2 = new clientModel({
    id: 'blablaidofclient',
    secret: 'verysophisticatedsecret',
    audienceId: 'audienceIdDeletedClient2',
    registrationToken: 'uniqueextraordinaryregistrationtoken',
    name: 'deleteClient2',
    hostUri: ['https://ewewewewewewsss'],
    redirectUris: ['https://ewewewewewewsss/callback'],
  });

  // Invalid client by hostUri
  const invalidClientHostUri: IClientBasicInformation = {
    name: 'invalidClientHostUri',
    hostUri: ['http://wrwrw'],
    redirectUris: ['http://wrwrw/callback'],
  };

  // Invalid client by hostUri and redirectUris
  const invalidClientHostUri2: IClientBasicInformation = {
    name: 'invalidClientHostUri2',
    hostUri: ['rrrrrrererere'],
    redirectUris: ['rrrrrrererere/callback'],
  };

  // Invalid client by hostUri without redirect uri
  const invalidClientMissingRedirectUri: IClientBasicInformation = {
    name: 'InvalidClientMissingRedirectUri',
    hostUri: ['https://something.new', 'https://something.old'],
    redirectUris: ['https://something.new/callback'],
  };

  // Invalid client by redirectUris
  const invalidClientRedirectUris: IClientBasicInformation = {
    name: 'invalidClientRedirectUris',
    hostUri: ['https://www.eeee.eee'],
    redirectUris: ['/callback'],
  };

  // Invalid client by redirectUris
  const invalidClientRedirectUris2: IClientBasicInformation = {
    name: 'invalidClientRedirectUris2',
    hostUri: ['https://rrlrlrllr'],
    redirectUris: ['https://rrrrrr/wwwww/callback'],
  };

  // Invalid client by redirectUris
  const invalidClientRedirectUris3: IClientBasicInformation = {
    name: 'invalidClientRedirectUris3',
    hostUri: ['https://relremwle'],
    redirectUris: ['https://relremwle/callback', '/callback'],
  };

  // Invalid client by duplicate name
  const invalidClientDupName: IClientBasicInformation = {
    name: registerdClient.name,
    hostUri: ['https://somehost'],
    redirectUris: ['https://somehost/callback'],
  };

  // Invalid client by duplicate host
  const invalidClientDupHost: IClientBasicInformation = {
    name: 'invalidClientDupHost',
    hostUri: registerdClient.hostUri,
    redirectUris: ['https://somehost/callback'],
  };

  /** Valid information to update on clients */
  const validUpdateClientInfo: IClientBasicInformation = {
    name: 'UpdatedRegisteredClient',
    hostUri: ['https://new.url'],
    redirectUris: ['https://new.url/callbacks'],
    scopes: ['write'],
  };

  const validUpdateClientInfo2: Partial<IClientBasicInformation> = {
    name: 'UpdatedRegisteredClient2',
    scopes: ['read', 'write', 'profile'],
  };

  /** Invalid information to update on clients */
  const invalidUpdateClientInfoHostUri: Partial<IClientBasicInformation> = {
    hostUri: ['https://new.url.will.fail:3200'],
  };

  const invalidUpdateClientInfoRedirectUris: Partial<IClientBasicInformation> = {
    redirectUris: ['https://new.redirect.host.without.update.host/callback'],
  };

  before(async () => {
    // Delete all collections before test suite
    await deleteCollections();

    registerdClient = await registerdClient.save();
    registerdClient2 = await registerdClient2.save();
    registerdClient3 = await registerdClient3.save();

    deleteClient = await deleteClient.save();
    deleteClient2 = await deleteClient2.save();
  });

  after(async () => {
    await deleteCollections();
  });

  describe('registerClient()', () => {

    it('Should create new client', () => {
      const createdClient = ManagementController.registerClient(clientBasicMock);
      const createdClient2 = ManagementController.registerClient(clientBasicMock2);

      return Promise.all([
        expect(createdClient).to.eventually.exist,
        expect(createdClient2).to.eventually.exist,
        expect(createdClient).to.eventually.have.property(propertyOf<IClientInformation>('id')),
        expect(createdClient).to.eventually.have.property(propertyOf<IClientInformation>('secret')),
        expect(createdClient).to.eventually.have.property(
          propertyOf<IClientInformation>('audienceId'),
        ),
        expect(createdClient).to.eventually.have.property(
          propertyOf<IClientInformation>('registrationToken'),
        ),
        expect(createdClient2).to.eventually.have.property(propertyOf<IClientInformation>('id')),
        expect(createdClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('secret'),
        ),
        expect(createdClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('audienceId'),
        ),
        expect(createdClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('registrationToken'),
        ),
      ]);
    });

    it('Should not create client and raise hostUri validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClientHostUri);
      const invalidClientError2 = ManagementController.registerClient(invalidClientHostUri2);
      const invalidClientError3 =
        ManagementController.registerClient(invalidClientMissingRedirectUri);

      return Promise.all([
        expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError2).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError3).to.be.rejectedWith(mongoose.ValidationError),
      ]);
    });

    it('Should not create client and raise redirecturis validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClientRedirectUris);
      const invalidClientError2 = ManagementController.registerClient(invalidClientRedirectUris2);
      const invalidClientError3 = ManagementController.registerClient(invalidClientRedirectUris3);

      return Promise.all([
        expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError2).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError3).to.be.rejectedWith(mongoose.ValidationError),
      ]);
    });

    it('Should not create client and raise duplicate name validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClientDupName);

      return expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client and raise duplicate hostUri validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClientDupHost);

      return expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client by empty input and raise validation error', () => {
      return expect(ManagementController.registerClient({} as IClientBasicInformation))
                                        .to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client without name and raise name validation error', () => {
      return expect(ManagementController.registerClient({
        hostUri: ['https://default.host'],
        redirectUris: ['https://default.host/callback'],
      } as IClientBasicInformation))
      .to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client without hostUri and raise hostUri validation error', () => {
      return expect(ManagementController.registerClient({
        name: 'SomeExampleApp',
        redirectUris: ['https://unknown/callback'],
      } as IClientBasicInformation)).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client without redirectUris and raise redirectUri validation error',
       () => {
         return expect(ManagementController.registerClient({
           name: 'SomeExampleApplication',
           hostUri: ['https://design.com'],
         } as IClientBasicInformation)).to.be.rejectedWith(mongoose.ValidationError);
       },
    );
  });

  describe('readClient()', () => {

    it('Should read existing clients data', () => {
      const clientInformation = ManagementController.readClient(registerdClient.id);
      const clientInformation2 = ManagementController.readClient(registerdClient2.id);

      return Promise.all([
        expect(clientInformation).to.eventually.exist.and.deep.include(registerdClient.toJSON()),
        expect(clientInformation2).to.eventually.exist.and.deep.include(registerdClient2.toJSON()),
      ]);
    });

    it('Should not read client by empty input and raise ClientNotFound error', () => {
      return expect(ManagementController.readClient('')).to.be.rejectedWith(ClientNotFound);
    });

    it('Should not read unexist client and raise ClientNotFound error', () => {
      return Promise.all([
        expect(ManagementController.readClient('unexistedClientId'))
                                   .to.be.rejectedWith(ClientNotFound),
        expect(ManagementController.readClient('232323232')).to.be.rejectedWith(ClientNotFound),
      ]);
    });
  });

  describe('updateClient()', () => {

    it('Should update existing client with valid information', () => {
      const updatedClient =
        ManagementController.updateClient(registerdClient.id, validUpdateClientInfo);
      const updatedClient2 =
        ManagementController.updateClient(registerdClient2.id, validUpdateClientInfo2);

      return Promise.all([
        expect(updatedClient).to.eventually.exist,
        expect(updatedClient2).to.eventually.exist,
        expect(updatedClient).to.eventually.have.property(
          propertyOf<IClientInformation>('id'),
          registerdClient.id,
        ),
        expect(updatedClient).to.eventually.have.property(
          propertyOf<IClientInformation>('secret'),
          registerdClient.secret,
        ),
        expect(updatedClient).to.eventually.have.property(
          propertyOf<IClientInformation>('audienceId'),
          registerdClient.audienceId,
        ),
        expect(updatedClient).to.eventually.have.property(
          propertyOf<IClientInformation>('registrationToken'),
          registerdClient.registrationToken,
        ),
        expect(updatedClient).to.eventually.deep.include(validUpdateClientInfo),
        expect(updatedClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('id'),
          registerdClient2.id,
        ),
        expect(updatedClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('secret'),
          registerdClient2.secret,
        ),
        expect(updatedClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('audienceId'),
          registerdClient2.audienceId,
        ),
        expect(updatedClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('registrationToken'),
          registerdClient2.registrationToken,
        ),
        expect(updatedClient2).to.eventually.deep.include(validUpdateClientInfo2),
      ]);
    });

    it('Should not update exisiting client only with hostUri without updating redirectUris', () => {
      return expect(
        ManagementController.updateClient(registerdClient2.id, invalidUpdateClientInfoHostUri),
      ).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not update exisiting client only with redirectUris without updating hostUri', () => {
      return expect(
        ManagementController.updateClient(registerdClient2.id, invalidUpdateClientInfoRedirectUris),
      ).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not update unexisting client and raise ClientNotFound error', () => {
      return Promise.all([
        expect(ManagementController.updateClient('unexistingClientId', validUpdateClientInfo))
        .to.be.rejectedWith(ClientNotFound),
        expect(ManagementController.updateClient('123231123', validUpdateClientInfo2))
        .to.be.rejectedWith(ClientNotFound),
      ]);
    });

    it('Should not update empty client and raise ClientNotFound error', () => {
      return expect(ManagementController.updateClient('', {})).to.be.rejectedWith(ClientNotFound);
    });

    it('Should not update existing client with invalid hostUri and raise hostUri validation error',
       () => {
         return Promise.all([
           expect(ManagementController.updateClient(
             registerdClient.id,
             { hostUri: invalidClientHostUri.hostUri },
           )).to.be.rejectedWith(mongoose.ValidationError),
           expect(ManagementController.updateClient(
            registerdClient2.id,
            { hostUri: invalidClientHostUri2.hostUri },
           )).to.be.rejectedWith(mongoose.ValidationError),
         ]);
       },
    );

    it(`Should not update existing client with invalid redirectUris
       and raise redirectUris validation error`,
       () => {
         return Promise.all([
           expect(ManagementController.updateClient(
             registerdClient.id,
             { redirectUris: invalidClientRedirectUris.redirectUris },
           )).to.be.rejectedWith(mongoose.ValidationError),
           expect(ManagementController.updateClient(
             registerdClient2.id,
             { redirectUris: invalidClientRedirectUris2.redirectUris },
           )).to.be.rejectedWith(mongoose.ValidationError),
           expect(ManagementController.updateClient(
             registerdClient.id,
             { redirectUris: invalidClientRedirectUris3.redirectUris },
           )).to.be.rejectedWith(mongoose.ValidationError),
         ]);
       },
    );

    it('Should not update existing client with duplicate name and raise validation error', () => {
      console.log(registerdClient2.name);
      return expect(ManagementController.updateClient(
        registerdClient.id,
        { name: registerdClient3.name },
      )).to.be.rejectedWith(mongoose.ValidationError);
    });

    it(`Should not update existing client with duplicate hostUri
       and raise hostUri validation error`,
       () => {
         return expect(ManagementController.updateClient(
           registerdClient2.id,
           { hostUri: registerdClient3.hostUri },
         )).to.be.rejectedWith(mongoose.ValidationError);
       },
    );

  });

  describe('deleteClient()', () => {

    it('Should delete existing client', () => {
      return Promise.all([
        expect(ManagementController.deleteClient(deleteClient.id))
        .to.eventually.be.true,
        expect(ManagementController.deleteClient(deleteClient2.id))
        .to.eventually.be.true,
      ]);
    });

    it('Should not delete unexisting client and raise ClientNotFound error', () => {
      return Promise.all([
        expect(ManagementController.deleteClient('unexisitingClientId'))
        .to.be.rejectedWith(ClientNotFound),
        expect(ManagementController.deleteClient('12321313'))
        .to.be.rejectedWith(ClientNotFound),
      ]);
    });

    it('Should not delete empty input client and raise ClientNotFound error', () => {
      return expect(ManagementController.deleteClient('')).to.be.rejectedWith(ClientNotFound);
    });
  });
});
