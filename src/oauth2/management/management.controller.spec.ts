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
    hostUris: ['https://test.client', 'https://testing.client'],
    redirectUris: ['https://test.client/callback', 'https://testing.client/callback'],
    scopes: ['read'],
  };

  const clientBasicMock2: IClientBasicInformation = {
    name: 'TestClient2',
    hostUris: ['https://test2.client'],
    redirectUris: ['https://test2.client/callback2'],
  };

  // Registered clients for updating queries
  let registerdClient = new clientModel({
    id: '123456789',
    secret: 'shhhhhitsecret',
    audienceId: 'audienceIdRegisteredClient',
    registrationToken: 'blablaregistrationtoken',
    name: 'RegisterdClient',
    hostUris: ['https://www.www'],
    redirectUris: ['https://www.www/callback'],
    scopes: ['read'],
  });

  let registerdClient2 = new clientModel({
    id: '987654321',
    secret: 'classifiedsecret',
    audienceId: 'audienceIdRegisteredClient2',
    registrationToken: 'registrationtokenofclient',
    name: 'RegisterdClient2',
    hostUris: ['https://www2.www2'],
    redirectUris: ['https://www2.www2/callback'],
  });

  let registerdClient3 = new clientModel({
    id: '129305023',
    secret: 'supersecretkey',
    audienceId: 'audienceIdRegisteredClient3',
    registrationToken: 'registrationTokenOfClient3',
    name: 'RegisterdClient3',
    hostUris: ['https://www3.www3', 'https://www555.www555'],
    redirectUris: ['https://www3.www3/callback', 'https://www555.www555/callback'],
  });

  let registerdClient4 = new clientModel({
    id: '1235001023',
    secret: 'verysuperultrasecret',
    audienceId: 'registeredClient4AudienceId',
    registrationToken: 'registrationTokenRegisterdClient4',
    name: 'registerdClient4',
    hostUris: ['https://wowow.okokok'],
    redirectUris: ['https://wowow.okokok/callback', 'https://wowow.okokok/callback/redirect'],
  });

  // Clients for delete queries
  let deleteClient = new clientModel({
    id: 'abcdefghijk',
    secret: 'csecretttttt',
    audienceId: 'audienceIdDeletedClient',
    registrationToken: 'clienttokenregistration',
    name: 'deleteClient',
    hostUris: ['https://rlwrwrwok.w'],
    redirectUris: ['https://rlwrwrwok.w/callback'],
    scopes: ['read'],
  });

  let deleteClient2 = new clientModel({
    id: 'blablaidofclient',
    secret: 'verysophisticatedsecret',
    audienceId: 'audienceIdDeletedClient2',
    registrationToken: 'uniqueextraordinaryregistrationtoken',
    name: 'deleteClient2',
    hostUris: ['https://ewewewewewewsss'],
    redirectUris: ['https://ewewewewewewsss/callback'],
  });

  // Invalid client by hostUris
  const invalidClientHostUris: IClientBasicInformation = {
    name: 'invalidClientHostUris',
    hostUris: ['http://wrwrw'],
    redirectUris: ['http://wrwrw/callback'],
  };

  // Invalid client by hostUriss and redirectUris
  const invalidClientHostUris2: IClientBasicInformation = {
    name: 'invalidClientHostUris2',
    hostUris: ['rrrrrrererere'],
    redirectUris: ['rrrrrrererere/callback'],
  };

  // Invalid client by hostUri without redirect uri
  const invalidClientMissingRedirectUri: IClientBasicInformation = {
    name: 'InvalidClientMissingRedirectUri',
    hostUris: ['https://something.new', 'https://something.old'],
    redirectUris: ['https://something.new/callback'],
  };

  // Invalid client by redirectUris
  const invalidClientRedirectUris: IClientBasicInformation = {
    name: 'invalidClientRedirectUris',
    hostUris: ['https://www.eeee.eee'],
    redirectUris: ['/callback'],
  };

  // Invalid client by redirectUris
  const invalidClientRedirectUris2: IClientBasicInformation = {
    name: 'invalidClientRedirectUris2',
    hostUris: ['https://rrlrlrllr'],
    redirectUris: ['https://rrrrrr/wwwww/callback'],
  };

  // Invalid client by redirectUris
  const invalidClientRedirectUris3: IClientBasicInformation = {
    name: 'invalidClientRedirectUris3',
    hostUris: ['https://relremwle'],
    redirectUris: ['https://relremwle/callback', '/callback'],
  };

  // Invalid client by duplicate name
  const invalidClientDupName: IClientBasicInformation = {
    name: registerdClient.name,
    hostUris: ['https://somehost'],
    redirectUris: ['https://somehost/callback'],
  };

  // Invalid client by duplicate host
  const invalidClientDupHost: IClientBasicInformation = {
    name: 'invalidClientDupHost',
    hostUris: registerdClient.hostUris,
    redirectUris: ['https://somehost/callback'],
  };

  // Invalid client by duplicate host (more than one host)
  const invalidClientDupHostMult: IClientBasicInformation = {
    name: 'invalidClientDupHostMult',
    hostUris: registerdClient3.hostUris,
    redirectUris: registerdClient3.hostUris.map((val, index) => val + `/unexistredirect${index}`),
  };

  /** Valid information to update on clients */
  const validUpdateClientInfo: IClientBasicInformation = {
    name: 'UpdatedRegisteredClient',
    hostUris: ['https://new.url'],
    redirectUris: ['https://new.url/callbacks'],
    scopes: ['write'],
  };

  const validUpdateClientInfo2: Partial<IClientBasicInformation> = {
    name: 'UpdatedRegisteredClient2',
    scopes: ['read', 'write', 'profile'],
  };

  /** Invalid information to update on clients */
  const invalidUpdateClientInfoHostUris: Partial<IClientBasicInformation> = {
    hostUris: ['https://new.url.will.fail:3200'],
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
    registerdClient4 = await registerdClient4.save();

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

    it('Should not create client and raise hostUris validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClientHostUris);
      const invalidClientError2 = ManagementController.registerClient(invalidClientHostUris2);
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

    it('Should not create client and raise duplicate hostUris (multiple) validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClientDupHostMult);

      return expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client and raise duplicate hostUris (single) validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClientDupHost);

      return expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client by empty input and raise validation error', () => {
      return expect(ManagementController.registerClient({} as IClientBasicInformation))
                                        .to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client without name and raise name validation error', () => {
      return expect(ManagementController.registerClient({
        hostUris: ['https://default.host'],
        redirectUris: ['https://default.host/callback'],
      } as IClientBasicInformation))
      .to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client without hostUris and raise hostUris validation error', () => {
      return expect(ManagementController.registerClient({
        name: 'SomeExampleApp',
        redirectUris: ['https://unknown/callback'],
      } as IClientBasicInformation)).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client without redirectUris and raise redirectUri validation error',
       () => {
         return expect(ManagementController.registerClient({
           name: 'SomeExampleApplication',
           hostUris: ['https://design.com'],
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
        ManagementController.updateClient(registerdClient2.id, invalidUpdateClientInfoHostUris),
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
             { hostUris: invalidClientHostUris.hostUris },
           )).to.be.rejectedWith(mongoose.ValidationError),
           expect(ManagementController.updateClient(
            registerdClient2.id,
            { hostUris: invalidClientHostUris2.hostUris },
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

    it(`Should not update existing client with duplicate hostUris (single host)
       and raise hostUri validation error`,
       () => {
         return expect(ManagementController.updateClient(
           registerdClient2.id,
           { hostUris: registerdClient4.hostUris },
         )).to.be.rejectedWith(mongoose.ValidationError);
       },
    );

    it(`Should not update existing client with duplicate hostUris (multiple hosts)
       and raise hostUri validation error`,
       () => {
         return expect(ManagementController.updateClient(
           registerdClient2.id,
           { hostUris: registerdClient3.hostUris },
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
