// management.routes.spec

import { expect } from 'chai';
import { default as request }  from 'supertest';
import { IClientInformation, IClientBasicInformation } from './management.interface';
import { authFailMessages } from './management.auth';
import { errorMessages } from './management.routes';
import clientModel from '../../client/client.model';
import accessTokenModel from '../../accessToken/accessToken.model';
import {
  deleteCollections,
  propertyOf,
  dismantleNestedProperties,
  lowerCasePropertiesValues,
} from '../../test';
import { InvalidParameter } from '../../utils/error';
import app from '../../app';
import config from '../../config';

describe('Client Management Routes Functionality', () => {

  const registerEndpoint = config.OAUTH_ENDPOINT + '/register';

  const validClientInformation: IClientBasicInformation =  {
    name: 'TestName',
    hostUri: 'https://test.com',
    redirectUris: ['https://test.com/callback'],
  };

  const validClientInformation2: IClientBasicInformation = {
    name: 'TestNameShouldNotWork',
    hostUri: 'https://testshouldnotwork.com',
    redirectUris: ['https://testshouldnotwork.com/callback'],
  };

  const validClientInformation3: IClientBasicInformation = {
    name: 'TestNameShouldNotWork2',
    hostUri: 'https://testshouldnotwork2.com',
    redirectUris: ['https://testshouldnotwork2.com/callback'],
  };

  let clientRegistrer = new clientModel({
    id: 'abcd1234567',
    secret: 'clientRegistrerSecret',
    registrationToken: 'clientRegistretRegistrationToken',
    name: 'ClientRegistrer',
    hostUri: 'https://client.register.com',
    redirectUris: ['https://client.register.com/callback'],
    scopes: [config.CLIENT_MANAGER_SCOPE],
  });

  let notClientRegistrer = new clientModel({
    id: 'notclientRegistrer123',
    secret: 'notClientRegistrer123Secret',
    registrationToken: 'notClientRegistrerRegistrationTokenBlaBla',
    name: 'notClientRegistrer',
    hostUri: 'https://verynotclient.register.com',
    redirectUris: ['https://verynotclient.register.com/callback'],
    scopes: ['blabla'],
  });

  let registeredClient = new clientModel({
    id: 'registeredClientId',
    secret: 'registeredClientSecret',
    registrationToken: 'registeredClientRegistrationTokenBlaBla',
    name: 'registeredClient',
    hostUri: 'https://registeredClient.register.com',
    redirectUris: ['https://registeredClient.register.com/callback'],
    scopes: ['something'],
  });

  let updatedClient = new clientModel({
    id: 'updatedClientId',
    secret: 'updatedClientSecret',
    registrationToken: 'updatedClientRegistrationTokenBlaBla',
    name: 'updatedClient',
    hostUri: 'https://updatedClient.register.com',
    redirectUris: ['https://updatedClient.register.com/callback'],
    scopes: ['something-new'],
  });

  let updatedClient2 = new clientModel({
    id: 'updatedClientId2',
    secret: 'updatedClientSecret2',
    registrationToken: 'updatedClientRegistrationTokenBlaBla2',
    name: 'updatedClient2',
    hostUri: 'https://updatedClient2.register.com',
    redirectUris: ['https://updatedClient2.register.com/callback'],
    scopes: ['something-new2'],
  });

  let deletedClient = new clientModel({
    id: 'deletedClient',
    secret: 'deletedClientSecret',
    registrationToken: 'deletedClientRegistrationToken',
    name: 'deletedClientName',
    hostUri: 'https://deletedClient.com',
    redirectUris: ['https://deletedClient.com/callback'],
    scopes: ['something-new-delete'],
  });

  let deletedClient2 = new clientModel({
    id: 'deletedClient2',
    secret: 'deletedClientSecret2',
    registrationToken: 'deletedClientRegistrationToken2',
    name: 'deletedClientName2',
    hostUri: 'https://deletedClient2.com',
    redirectUris: ['https://deletedClient2.com/callback'],
    scopes: ['something-new-delete2'],
  });

  const updatedInformation: IClientBasicInformation = {
    name: 'newUpdatedClientName',
    hostUri: 'https://updatedClient.reg',
    redirectUris: ['https://updatedClient.reg/callback', 'https://updatedClient.reg/redirect'],
  };

  const updatedInformation2: IClientBasicInformation = {
    name: 'newUpdatedClientName2',
    hostUri: 'https://updatedClient2',
    redirectUris: ['https://updatedClient2/callback', 'https://updatedClient2/redirect'],
  };

  const updatedInformation3: IClientBasicInformation = {
    name: 'newUpdatedClientName3',
    hostUri: 'https://updatedClient3',
    redirectUris: ['https://updatedClient3/callback', 'https://updatedClient3/redirect'],
  };

  const updatedInformation4: IClientBasicInformation = {
    name: 'newUpdatedClientName4',
    hostUri: 'https://updatedClient4',
    redirectUris: ['https://updatedClient4/callback', 'https://updatedClient4/redirect'],
  };

  // Will be created in before hook
  let clientRegistrerAccessToken: any = null;
  let notClientRegistrerAccessToken: any = null;

  before(async () => {
    // Delete all collections before test suite
    await deleteCollections();

    clientRegistrer = await clientRegistrer.save();
    notClientRegistrer = await notClientRegistrer.save();

    clientRegistrerAccessToken = await new accessTokenModel({
      clientId: clientRegistrer._id,
      audience: config.issuerHostUri,
      value: '123456789',
      scopes: [config.CLIENT_MANAGER_SCOPE],
      grantType: 'client_credentials',
      expiresAt: 999999999999,
    }).save();

    notClientRegistrerAccessToken = await new accessTokenModel({
      clientId: notClientRegistrer._id,
      audience: config.issuerHostUri,
      value: '987654321',
      scopes: ['blabla'],
      grantType: 'client_credentials',
      expiresAt: 999999999999,
    }).save();

    registeredClient = await registeredClient.save();
    updatedClient = await updatedClient.save();
    updatedClient2 = await updatedClient2.save();
    deletedClient = await deletedClient.save();
    deletedClient2 = await deletedClient2.save();
  });

  after(async () => {
    await deleteCollections();
  });

  describe('(Register Client) - /register', () => {

    it('Should register client by client manager that does have permissions', (done) => {

      request(app)
        .post(registerEndpoint)
        .send({ clientInformation: validClientInformation })
        .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
        .expect((res) => {

          expect(res).to.nested.include({
            status: 201,
            ...dismantleNestedProperties('body', validClientInformation),
          });
          expect(res).to.have.nested.property(`body.${propertyOf<IClientInformation>('id')}`);
          expect(res).to.have.nested.property(`body.${propertyOf<IClientInformation>('secret')}`);
          expect(res).to.have.nested.property(
            `body.${propertyOf<IClientInformation>('registrationToken')}`,
          );

        }).end(done);
    });

    it('Should not register client without client manager access token header', (done) => {
      request(app)
        .post(registerEndpoint)
        .send({ clientInformation: validClientInformation2 })
        .expect(400, { message: authFailMessages.CLIENT_MANAGER_TOKEN_MISSING })
        .end(done);
    });

    it(
      'Should not register client by client manager that doesn\'t have permissions',
      (done) => {
        request(app)
          .post(registerEndpoint)
          .send({ clientInformation: validClientInformation3 })
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, notClientRegistrerAccessToken.value)
          .expect(403, { message: authFailMessages.INSUFFICIENT_CLIENT_MANAGER_TOKEN })
          .end(done);
      },
    );

    it(
      'Should not register client without data by client manager that does have permissions',
      (done) => {
        request(app)
          .post(registerEndpoint)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .expect(
            new InvalidParameter().status,
            { message: errorMessages.MISSING_CLIENT_INFORMATION },
          ).end(done);
      },
     );
  });

  describe('(Read Client) - /register/:id', () => {
    it(
      'Should read existing client information by client manager that does have permissions',
      (done) => {
        request(app)
          .get(`${registerEndpoint}/${registeredClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', registeredClient.registrationToken)
          .expect((res) => {
            expect(res).to.nested.include({
              status: 200,
              ...dismantleNestedProperties('body', registeredClient.toJSON()),
            });
          }).end(done);
      },
    );

    it(`Should not read existing client information by
       client manager that doesn\'t have permissions`,
       (done) => {
         request(app)
           .get(`${registerEndpoint}/${registeredClient.id}`)
           .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, notClientRegistrerAccessToken.value)
           .set('Authorization', registeredClient.registrationToken)
           .expect(403, { message: authFailMessages.INSUFFICIENT_CLIENT_MANAGER_TOKEN })
           .end(done);
       },
    );

    it(`Should not read existing client information by invalid registration token`,
       (done) => {
         request(app)
           .get(`${registerEndpoint}/${registeredClient.id}`)
           .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
           .set('Authorization', 'invalidRegistrationToken')
           .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
           .end(done);
       },
    );

    it(`Should not read existing client information without client manager access token header`,
       (done) => {
         request(app)
           .get(`${registerEndpoint}/${registeredClient.id}`)
           .set('Authorization', registeredClient.registrationToken)
           .expect(400, { message: authFailMessages.CLIENT_MANAGER_TOKEN_MISSING })
           .end(done);
       },
    );

    it(`Should not read existing client information without registration token header`,
       (done) => {
         request(app)
           .get(`${registerEndpoint}/${registeredClient.id}`)
           .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
           .expect(400, { message: authFailMessages.REGISTRATION_TOKEN_MISSING })
           .end(done);
       },
    );

    it('Should not read unexisting client information by client manager that does have permissions',
       (done) => {
         request(app)
          .get(`${registerEndpoint}/someunexisitingclientid`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', 'unexistingclientregistrationtoken')
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(done);
       },
    );

    it(`Should not read client information without specifing
        client id by client manager that does have permissions`,
       (done) => {
         request(app)
          .get(`${registerEndpoint}/`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', registeredClient.registrationToken)
          .expect(404) // Because the route not found, express decide to drop it if id not present
          .end(done);
       },
    );

    it(`Should not read client information by client id that does not match registration token`,
       (done) => {
         request(app)
          .get(`${registerEndpoint}/${registeredClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', notClientRegistrer.registrationToken)
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(() => {
            request(app)
              .get(`${registerEndpoint}/${notClientRegistrer.id}`)
              .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
              .set('Authorization', registeredClient.registrationToken)
              .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
              .end(done);
          });
       },
    );
  });

  describe('(Update Client) - /register/:id', () => {

    it(
      'Should update existing client information by client manager that does have permissions',
      (done) => {
        request(app)
          .put(`${registerEndpoint}/${updatedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', updatedClient.registrationToken)
          .send({ clientInformation: updatedInformation })
          .expect((res) => {
            expect(res).to.nested.include({
              status: 200,
              // Dismantle properties so chai can include them
              ...dismantleNestedProperties(
                'body',
                {
                  ...updatedClient.toJSON(),
                  // Lowercase redirectUris and hostUri in update information
                  ...lowerCasePropertiesValues(
                    [
                      propertyOf<IClientInformation>('redirectUris'),
                      propertyOf<IClientInformation>('hostUri'),
                    ],
                    updatedInformation,
                  ),
                },
              ),
            });
          }).end(done);

      },
    );

    it(`Should not update existing client information by
        client manager that doesn\'t have permissions`,
       (done) => {
         request(app)
          .put(`${registerEndpoint}/${updatedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, notClientRegistrerAccessToken.value)
          .set('Authorization', updatedClient.registrationToken)
          .send({ clientInformation: updatedInformation })
          .expect(403, { message: authFailMessages.INSUFFICIENT_CLIENT_MANAGER_TOKEN })
          .end(done);
       },
     );

    it(`Should not update existing client information by invalid registration token`,
       (done) => {
         request(app)
          .put(`${registerEndpoint}/${updatedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', 'invalidRegistrationToken')
          .send({ clientInformation: updatedInformation })
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(done);
       },
    );

    it(`Should not update existing client information without client manger token header`,
       (done) => {
         request(app)
          .put(`${registerEndpoint}/${updatedClient.id}`)
          .set('Authorization', updatedClient.registrationToken)
          .send({ clientInformation: updatedInformation })
          .expect(400, { message: authFailMessages.CLIENT_MANAGER_TOKEN_MISSING })
          .end(done);
       },
    );

    it(`Should not update existing client information without registration token`,
       (done) => {
         request(app)
          .put(`${registerEndpoint}/${updatedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .send({ clientInformation: updatedInformation })
          .expect(400, { message: authFailMessages.REGISTRATION_TOKEN_MISSING })
          .end(done);
       },
    );

    it(`Should not update existing client information by invalid registration token`,
       (done) => {
         request(app)
          .put(`${registerEndpoint}/${updatedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', 'invalidRegistrationToken')
          .send({ clientInformation: updatedInformation })
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(done);
       },
    );

    it(`Should not update unexisting client information
        by client manager that does have permissions`,
       (done) => {
         request(app)
          .put(`${registerEndpoint}/${'unexisitingClientId'}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', updatedClient.registrationToken)
          .send({ clientInformation: updatedInformation })
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(done);
       },
     );

    it('Should not update unexisting client by not specifying client id',
       (done) => {
         request(app)
          .put(`${registerEndpoint}/`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', updatedClient.registrationToken)
          .send({ clientInformation: updatedInformation })
          .expect(404) // Because the route not found, express decide to drop it if id not present
          .end(done);
       },
    );

    it('Should not update existing client by not specifying client information',
       (done) => {
         request(app)
          .put(`${registerEndpoint}/${updatedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', updatedClient.registrationToken)
          .expect(400, { message: errorMessages.MISSING_CLIENT_ID_OR_INFORMATION })
          .end(done);
       },
    );

    it(`Should not update existing client information
        by client id that does not match registration token`,
       (done) => {
         request(app)
          .put(`${registerEndpoint}/${updatedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', updatedClient2.registrationToken)
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(() => {
            request(app)
              .get(`${registerEndpoint}/${updatedClient2.id}`)
              .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
              .set('Authorization', updatedClient.registrationToken)
              .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
              .end(done);
          });
       },
    );
  });

  describe('(Delete Client) - /register/:id', () => {

    // Creating the deleted client back in the db for each test if deleted
    afterEach(async () => {
      deletedClient = await clientModel.findOneAndUpdate(
        { id: deletedClient.id },
        deletedClient.toObject(),
        { upsert: true },
      ) || deletedClient;
    });

    it(
      'Should delete existing client by client manager that does have permissions',
      (done) => {
        request(app)
          .delete(`${registerEndpoint}/${deletedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', deletedClient.registrationToken)
          .expect(204)
          .end(done);
      },
    );

    it(`Should not delete existing client by client manager that doesn\'t have permissions`,
       (done) => {
         request(app)
           .delete(`${registerEndpoint}/${deletedClient.id}`)
           .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, notClientRegistrerAccessToken.value)
           .set('Authorization', deletedClient.registrationToken)
           .expect(403, { message: authFailMessages.INSUFFICIENT_CLIENT_MANAGER_TOKEN })
           .end(done);
       },
    );

    it(`Should not delete existing client by invalid registration token`,
       (done) => {
         request(app)
           .delete(`${registerEndpoint}/${deletedClient.id}`)
           .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
           .set('Authorization', notClientRegistrer.registrationToken)
           .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
           .end(done);
       },
    );

    it(`Should not delete existing client without client manager access token header`,
       (done) => {
         request(app)
           .delete(`${registerEndpoint}/${deletedClient.id}`)
           .set('Authorization', deletedClient.registrationToken)
           .expect(400, { message: authFailMessages.CLIENT_MANAGER_TOKEN_MISSING })
           .end(done);
       },
    );

    it(`Should not delete existing client without registration token header`,
       (done) => {
         request(app)
           .delete(`${registerEndpoint}/${deletedClient.id}`)
           .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
           .expect(400, { message: authFailMessages.REGISTRATION_TOKEN_MISSING })
           .end(done);
       },
    );

    it('Should not delete unexisting client by client manager that does have permissions',
       (done) => {
         request(app)
          .delete(`${registerEndpoint}/someunexisitingclientid`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', 'unexistingclientregistrationtoken')
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(done);
       },
    );

    it(`Should not delete client without specifing
        client id by client manager that does have permissions`,
       (done) => {
         request(app)
          .delete(`${registerEndpoint}/`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', deletedClient.registrationToken)
          .expect(404) // Because the route not found, express decide to drop it if id not present
          .end(done);
       },
    );

    it(`Should not delete client by client id that does not match registration token`,
       (done) => {
         request(app)
          .delete(`${registerEndpoint}/${deletedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', deletedClient2.registrationToken)
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(() => {
            request(app)
              .get(`${registerEndpoint}/${deletedClient2.id}`)
              .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
              .set('Authorization', deletedClient.registrationToken)
              .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
              .end(done);
          });
       },
    );
  });

});
