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
    hostUri: 'https://test.client',
    redirectUris: ['https://test.client/callback'],
    scopes: ['read'],
  };

  const clientBasicMock2: IClientBasicInformation = {
    name: 'TestClient2',
    hostUri: 'https://test2.client',
    redirectUris: ['https://test2.client/callback2'],
  };

  // Registered clients for updating queries
  let registerdClient = new clientModel({
    id: '123456789',
    secret: 'shhhhhitsecret',
    registrationToken: 'blablaregistrationtoken',
    name: 'RegisterdClient',
    hostUri: 'https://www.www',
    redirectUris: ['https://www.www/callback'],
    scopes: ['read'],
  });

  let registerdClient2 = new clientModel({
    id: '987654321',
    secret: 'classifiedsecret',
    registrationToken: 'registrationtokenofclient',
    name: 'RegisterdClient2',
    hostUri: 'https://www2.www2',
    redirectUris: ['https://www2.www2/callback'],
  });

  // Clients for delete queries
  let deleteClient = new clientModel({
    id: 'abcdefghijk',
    secret: 'csecretttttt',
    registrationToken: 'clienttokenregistration',
    name: 'deleteClient',
    hostUri: 'https://rlwrwrwok.w',
    redirectUris: ['https://rlwrwrwok.w/callback'],
    scopes: ['read'],
  });

  let deleteClient2 = new clientModel({
    id: 'blablaidofclient',
    secret: 'verysophisticatedsecret',
    registrationToken: 'uniqueextraordinaryregistrationtoken',
    name: 'deleteClient2',
    hostUri: 'https://ewewewewewewsss',
    redirectUris: ['https://ewewewewewewsss/callback'],
  });

  // Invalid client by hostUri
  const invalidClient: IClientBasicInformation = {
    name: 'InvalidClient',
    hostUri: 'http://wrwrw',
    redirectUris: ['http://wrwrw/callback'],
  };

  // Invalid client by hostUri and redirectUris
  const invalidClient2: IClientBasicInformation = {
    name: 'InvalidClient2',
    hostUri: 'rrrrrrererere',
    redirectUris: ['rrrrrrererere/callback'],
  };

  // Invalid client by redirectUris
  const invalidClient3: IClientBasicInformation = {
    name: 'InvalidClient3',
    hostUri: 'https://www.eeee.eee',
    redirectUris: ['/callback'],
  };

  // Invalid client by redirectUris
  const invalidClient4: IClientBasicInformation = {
    name: 'InvalidClient4',
    hostUri: 'https://rrlrlrllr',
    redirectUris: ['https://rrrrrr/wwwww/callback'],
  };

  // Invalid client by redirectUris
  const invalidClient5: IClientBasicInformation = {
    name: 'InvalidClient5',
    hostUri: 'https://relremwle',
    redirectUris: ['https://relremwle/callback', '/callback'],
  };

  // Invalid client by duplicate name
  const invalidClient6: IClientBasicInformation = {
    name: registerdClient.name,
    hostUri: 'https://somehost',
    redirectUris: ['https://somehost/callback'],
  };

  // Invalid client by duplicate host
  const invalidClient7: IClientBasicInformation = {
    name: 'InvalidClient7',
    hostUri: registerdClient.hostUri,
    redirectUris: ['https://somehost/callback'],
  };

  // Information to update on clients
  const updateClientInfo: IClientBasicInformation = {
    name: 'UpdatedRegisteredClient',
    hostUri: 'https://new.url',
    redirectUris: ['https://new.url/callbacks'],
    scopes: ['write'],
  };

  const updateClientInfo2: Partial<IClientBasicInformation> = {
    hostUri: 'https://updated.url.com',
    scopes: ['read', 'write', 'profile'],
  };

  before(async () => {
    // Delete all collections before test suite
    await deleteCollections();

    registerdClient = await registerdClient.save();
    registerdClient2 = await registerdClient2.save();

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
          propertyOf<IClientInformation>('registrationToken'),
        ),
        expect(createdClient2).to.eventually.have.property(propertyOf<IClientInformation>('id')),
        expect(createdClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('secret'),
        ),
        expect(createdClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('registrationToken'),
        ),
      ]);
    });

    it('Should not create client and raise hostUri validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClient);
      const invalidClientError2 = ManagementController.registerClient(invalidClient2);

      return Promise.all([
        expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError2).to.be.rejectedWith(mongoose.ValidationError),
      ]);
    });

    it('Should not create client and raise redirecturis validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClient3);
      const invalidClientError2 = ManagementController.registerClient(invalidClient4);
      const invalidClientError3 = ManagementController.registerClient(invalidClient5);

      return Promise.all([
        expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError2).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError3).to.be.rejectedWith(mongoose.ValidationError),
      ]);
    });

    it('Should not create client and raise duplicate name validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClient6);

      return expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client and raise duplicate hostUri validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClient7);

      return expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client by empty input and raise validation error', () => {
      return expect(ManagementController.registerClient({} as IClientBasicInformation))
                                        .to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client without name and raise name validation error', () => {
      return expect(ManagementController.registerClient({
        hostUri: 'https://default.host',
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
           hostUri: 'https://design.com',
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
        ManagementController.updateClient(registerdClient.id, updateClientInfo);
      const updatedClient2 =
        ManagementController.updateClient(registerdClient2.id, updateClientInfo2);

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
          propertyOf<IClientInformation>('registrationToken'),
          registerdClient.registrationToken,
        ),
        expect(updatedClient2).to.eventually.deep.include(updateClientInfo2),
        expect(updatedClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('id'),
          registerdClient2.id,
        ),
        expect(updatedClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('secret'),
          registerdClient2.secret,
        ),
        expect(updatedClient2).to.eventually.have.property(
          propertyOf<IClientInformation>('registrationToken'),
          registerdClient2.registrationToken,
        ),
        expect(updatedClient2).to.eventually.deep.include(updateClientInfo2),
      ]);
    });

    it('Should not update unexisting client and raise ClientNotFound error', () => {
      return Promise.all([
        expect(ManagementController.updateClient('unexistingClientId', updateClientInfo))
        .to.be.rejectedWith(ClientNotFound),
        expect(ManagementController.updateClient('123231123', updateClientInfo2))
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
             { hostUri: invalidClient.hostUri },
           )).to.be.rejectedWith(mongoose.ValidationError),
           expect(ManagementController.updateClient(
            registerdClient2.id,
            { hostUri: invalidClient2.hostUri },
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
             { redirectUris: invalidClient3.redirectUris },
           )).to.be.rejectedWith(mongoose.ValidationError),
           expect(ManagementController.updateClient(
             registerdClient2.id,
             { redirectUris: invalidClient4.redirectUris },
           )).to.be.rejectedWith(mongoose.ValidationError),
           expect(ManagementController.updateClient(
             registerdClient.id,
             { redirectUris: invalidClient5.redirectUris },
           )).to.be.rejectedWith(mongoose.ValidationError),
         ]);
       },
    );

    it('Should not update existing client with duplicate name and raise validation error', () => {
      return expect(ManagementController.updateClient(
        registerdClient.id,
        { name: registerdClient2.name },
      )).to.be.rejectedWith(mongoose.ValidationError);
    });

    it(`Should not update existing client with duplicate hostUri
       and raise hostUri validation error`,
       () => {
         return expect(ManagementController.updateClient(
           registerdClient2.id,
           { hostUri: registerdClient.hostUri },
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
