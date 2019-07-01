// management.controller.spec

import { expect } from 'chai';
import * as mongoose from 'mongoose';
import { ManagementController } from './management.controller';
import { IClientInformation, IClientBasicInformation } from './management.interface';
import {
  deleteCollections,
  propertyOf,
  generateObjectSubsets,
} from '../../test';
import clientModel from '../../client/client.model';
import { ClientNotFound, BadClientInformation } from './management.error';

describe('Client Management Operations Functionality', async () => {

  // Setting data mocks
  const clientBasicMock: IClientBasicInformation = {
    name: 'TestClient',
    hostUris: ['https://test.client', 'https://testing.client'],
    redirectUris: ['/callback', '/call/back'],
  };

  const clientBasicMock2: IClientBasicInformation = {
    name: 'TestClient2',
    hostUris: ['https://test2.client'],
    redirectUris: ['/callback2'],
  };

  // Registered clients for updating queries
  let registerdClient = new clientModel({
    id: '123456789',
    secret: 'shhhhhitsecret',
    audienceId: 'audienceIdRegisteredClient',
    registrationToken: 'blablaregistrationtoken',
    name: 'RegisterdClient',
    hostUris: ['https://www.www'],
    redirectUris: ['/callback'],
    scopes: ['read'],
  });

  let registerdClient2 = new clientModel({
    id: '987654321',
    secret: 'classifiedsecret',
    audienceId: 'audienceIdRegisteredClient2',
    registrationToken: 'registrationtokenofclient',
    name: 'RegisterdClient2',
    hostUris: ['https://www2.www2'],
    redirectUris: ['/callback'],
  });

  let registerdClient3 = new clientModel({
    id: '129305023',
    secret: 'supersecretkey',
    audienceId: 'audienceIdRegisteredClient3',
    registrationToken: 'registrationTokenOfClient3',
    name: 'RegisterdClient3',
    hostUris: ['https://www3.www3', 'https://www555.www555'],
    redirectUris: ['/callback/here', '/callback/options'],
  });

  let registerdClient4 = new clientModel({
    id: '1235001023',
    secret: 'verysuperultrasecret',
    audienceId: 'registeredClient4AudienceId',
    registrationToken: 'registrationTokenRegisterdClient4',
    name: 'registerdClient4',
    hostUris: ['https://wowow.okokok'],
    redirectUris: ['/callback/to', '/callback/redirect'],
  });

  // Clients for delete queries
  let deleteClient = new clientModel({
    id: 'abcdefghijk',
    secret: 'csecretttttt',
    audienceId: 'audienceIdDeletedClient',
    registrationToken: 'clienttokenregistration',
    name: 'deleteClient',
    hostUris: ['https://rlwrwrwok.w'],
    redirectUris: ['/redirect'],
    scopes: ['read'],
  });

  let deleteClient2 = new clientModel({
    id: 'blablaidofclient',
    secret: 'verysophisticatedsecret',
    audienceId: 'audienceIdDeletedClient2',
    registrationToken: 'uniqueextraordinaryregistrationtoken',
    name: 'deleteClient2',
    hostUris: ['https://ewewewewewewsss'],
    redirectUris: ['/callback/delete'],
  });

  /** Invalid clients */

  // Invalid client by hostUris
  const invalidClientHostUris: IClientBasicInformation = {
    name: 'invalidClientHostUris',
    hostUris: ['http://wrwrw'],
    redirectUris: ['/callback'],
  };

  // Invalid client by hostUriss and redirectUris
  const invalidClientHostUris2: IClientBasicInformation = {
    name: 'invalidClientHostUris2',
    hostUris: ['rrrrrrererere'],
    redirectUris: ['/callback*)(!@#UWQJ___AKDQL11~'],
  };

  // Invalid client by hostUris
  const invalidClientHostUris3: IClientBasicInformation = {
    name: 'invalidClientHostUris3',
    hostUris: ['https://notoknotok/callback'],
    redirectUris: ['/redirect'],
  };

  // Invalid client by redirectUris
  const invalidClientRedirectUris: IClientBasicInformation = {
    name: 'invalidClientRedirectUris',
    hostUris: ['https://www.eeee.eee'],
    redirectUris: ['/callback///a'],
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
    redirectUris: ['/callback', 'https://relremwle/callback'],
  };

  // Invalid client by duplicate redirectUris
  const invalidClientRedirectUrisDup: IClientBasicInformation = {
    name: 'invalidClientRedirectUrisDuplicate',
    hostUris: ['https://veryverynewhost'],
    redirectUris: ['/valid/redirecturi', '/callback', '/valid/redirecturi'],
  };

  // Invalid client by redirectUris, some are valid and other not
  const invalidClientRedirectUrisSomeGood: IClientBasicInformation = {
    name: 'invalidClientRedirectUrisSomeGood',
    hostUris: ['https://surevalidaddress'],
    redirectUris: ['/first/valid', 'https://second.is.not/valid'],
  };

  // Invalid client by duplicate name
  const invalidClientDupName: IClientBasicInformation = {
    name: registerdClient.name,
    hostUris: ['https://somehost'],
    redirectUris: ['/callback'],
  };

  // Invalid client by duplicate host
  const invalidClientDupHost: IClientBasicInformation = {
    name: 'invalidClientDupHost',
    hostUris: registerdClient.hostUris,
    redirectUris: ['/callback'],
  };

  // Invalid client by duplicate host (more than one host)
  const invalidClientDupHostMult: IClientBasicInformation = {
    name: 'invalidClientDupHostMult',
    hostUris: registerdClient3.hostUris,
    redirectUris: ['/unexistredirect', '/more'],
  };

  // Invalid client by duplicate host (contains one of client's existing host)
  const invalidClientDupHostMultComb: IClientBasicInformation = {
    name: 'invalidClientDupHostMultComb',
    hostUris: ['https://somethingbrandnew.com', registerdClient3.hostUris[0]],
    redirectUris: ['/callback', '/something'],
  };

  // Invalid client by duplicate host (all hosts of existing client but in different order)
  const invalidClientDupHostMultOrder: IClientBasicInformation = {
    name: 'invalidClientDupHostMultOrder',
    hostUris: [registerdClient3.hostUris[1], registerdClient3.hostUris[0]],
    redirectUris: ['/new/callback', '/new/call'],
  };

  // Invalid client by hostUris, some are valid and other not
  const invalidClientHostUrisSomeGood: IClientBasicInformation = {
    name: 'invalidClientHostUrisSomeGood',
    hostUris: ['https://okokoktovbye', 'thisisverybad'],
    redirectUris: ['/shouldWorkyes'],
  };


  /** Valid information to update on clients */

  const validUpdateClientInfo: IClientBasicInformation = {
    name: 'UpdatedRegisteredClient',
    hostUris: ['https://new.url'],
    redirectUris: ['/callbacksss'],
  };

  const validUpdateClientInfo2: Partial<IClientBasicInformation> = {
    name: 'UpdatedRegisteredClient2',
    redirectUris: ['/callbacknewwownice', '/okokokgood'],
  };

  // Unsupported client update information fields

  const unsupportedUpdateFields = [
    propertyOf<IClientInformation>('id'),
    propertyOf<IClientInformation>('secret'),
    propertyOf<IClientInformation>('registrationToken'),
  ];

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
      const invalidClientError3 = ManagementController.registerClient(invalidClientHostUris3);

      return Promise.all([
        expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError2).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError3).to.be.rejectedWith(mongoose.ValidationError),
      ]);
    });

    it(`Should not create client by invalid redirectUris ${''
       } and raise redirecturis validation error`,
       () => {
         const invalidClientError = ManagementController.registerClient(invalidClientRedirectUris);
         const invalidClientError2 =
          ManagementController.registerClient(invalidClientRedirectUris2);
         const invalidClientError3 =
          ManagementController.registerClient(invalidClientRedirectUris3);
         const invalidClientError4 =
          ManagementController.registerClient(invalidClientRedirectUrisDup);
         const invalidClientError5 =
          ManagementController.registerClient(invalidClientRedirectUrisSomeGood);

         return Promise.all([
           expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError),
           expect(invalidClientError2).to.be.rejectedWith(mongoose.ValidationError),
           expect(invalidClientError3).to.be.rejectedWith(mongoose.ValidationError),
           expect(invalidClientError4).to.be.rejectedWith(mongoose.ValidationError),
           expect(invalidClientError5).to.be.rejectedWith(mongoose.ValidationError),
         ]);
       },
    );

    it('Should not create client and raise duplicate name validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClientDupName);

      return expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError);
    });

    it('Should not create client and raise duplicate hostUris (multiple) validation error', () => {
      const invalidClientError = ManagementController.registerClient(invalidClientDupHostMult);
      const invalidClientError2 =
        ManagementController.registerClient(invalidClientHostUrisSomeGood);

      return Promise.all([
        expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError),
        expect(invalidClientError2).to.be.rejectedWith(mongoose.ValidationError),
      ]);
    });

    it(`Should not create client and raise duplicate hostUris ${''
       } (multiple containing one host of another client) validation error`,
       () => {
         const invalidClientError =
           ManagementController.registerClient(invalidClientDupHostMultComb);

         return expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError);
       },
    );

    it(`Should not create client and raise duplicate hostUris ${''
       } (exact hostUris of client but in different order) validation error`,
       () => {
         const invalidClientError =
           ManagementController.registerClient(invalidClientDupHostMultOrder);

         return expect(invalidClientError).to.be.rejectedWith(mongoose.ValidationError);
       },
    );

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
        redirectUris: ['/call/back'],
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

    it(`Should not create client by partial client basic information ${''
       }and raise BadClientInformation error`,
       () => {
         const errorPromises = [];
         const invalidClient: IClientBasicInformation = {
           name: 'partialClientInvalid',
           hostUris: ['https://partialClient.com', 'https://verypartialclient.com'],
           redirectUris: ['/call', '/back'],
         };

         for (const subset of generateObjectSubsets(invalidClient)) {
           errorPromises.push(
             expect(ManagementController.registerClient(subset))
             .to.be.rejectedWith(BadClientInformation),
           );
         }

         return Promise.all(errorPromises);
       });
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

    it(`Should not update existing client with invalid redirectUris ${''
       }and raise redirectUris validation error`,
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
           expect(ManagementController.updateClient(
             registerdClient2.id,
             { redirectUris: invalidClientRedirectUrisDup.redirectUris },
           )).to.rejectedWith(mongoose.ValidationError),
           expect(ManagementController.updateClient(
             registerdClient.id,
             { redirectUris: invalidClientRedirectUrisSomeGood.redirectUris },
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
           {
             hostUris: registerdClient4.hostUris,
             redirectUris: ['/new/test/call'],
           },
         )).to.be.rejectedWith(mongoose.ValidationError);
       },
    );

    it(`Should not update existing client with duplicate hostUris (multiple hosts)
       and raise hostUri validation error`,
       () => {
         return expect(ManagementController.updateClient(
           registerdClient2.id,
           {
             hostUris: registerdClient3.hostUris,
             redirectUris: ['/okt', '/ooktest'],
           },
         )).to.be.rejectedWith(mongoose.ValidationError);
       },
    );

    it(`Should not update existing client with duplicate hostUris ${''
       }(same hosts different order) and raise validation error`,
       () => {
         return expect(ManagementController.updateClient(
           registerdClient2.id,
           {
             hostUris: [registerdClient3.hostUris[1], registerdClient3.hostUris[0]],
             redirectUris: ['/someurl', '/ookurl'],
           },
         )).to.be.rejectedWith(mongoose.ValidationError);
       },
    );

    it(`Should not update existing client with duplicate hostUris ${''
       }(containing partial hosts of existing clients) and raise validation error`,
       () => {
         return expect(ManagementController.updateClient(
           registerdClient2.id,
           {
             hostUris: ['https://wowthisisnotexistok.com', registerdClient3.hostUris[0]],
             redirectUris: ['/clbk/ok', '/yqoekr'],
           },
         )).to.be.rejectedWith(mongoose.ValidationError);
       },
    );

    it(`Should not update existing client with unsupported fields ${''
       } even if containing some valid fields and raise BadClientInformation error`,
       () => {
         const errorPromises = [];
         const sampleUnsupportedFieldsObj: any = {};
         let unsupportedFieldsSubsets;

         for (const unsupportedField of unsupportedUpdateFields) {

          // Creates random string value for each field
           sampleUnsupportedFieldsObj[unsupportedField] =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
         }

         unsupportedFieldsSubsets = generateObjectSubsets(sampleUnsupportedFieldsObj);

         // Trying to insert each possible subset of unsupported fields including one valid field
         for (const subset of unsupportedFieldsSubsets) {
           errorPromises.push(
             expect(ManagementController.updateClient(
               registerdClient4.id,
               { ...subset, name: 'validNameForClient' }),
             ).to.be.rejectedWith(BadClientInformation),
           );
         }

         return Promise.all(errorPromises);
       });
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
