// management.routes.spec

import { expect } from 'chai';
import { default as request }  from 'supertest';
import { URL } from 'url';
import { IClientInformation, IClientBasicInformation } from './management.interface';
import { authFailMessages } from './management.auth';
import { errorMessages } from './management.routes';
import clientModel from '../../client/client.model';
import accessTokenModel from '../../accessToken/accessToken.model';
import authCodeModel from '../../authCode/authCode.model';
import {
  propertyOf,
  dismantleNestedProperties,
  lowerCasePropertiesValues,
} from '../../utils/objectUtils';
import { deleteCollections } from '../../test';
import { InvalidParameter } from '../../utils/error';
import app from '../../app';
import config from '../../config';

describe('Client Management Routes Functionality', () => {

  const registerEndpoint = `${config.OAUTH_ENDPOINT}/${config.OAUTH_MANAGEMENT_ENDPOINT}`;

  const validClientInformation: IClientBasicInformation =  {
    name: 'TestName',
    hostUris: ['https://test.com'],
    redirectUris: ['/callback'],
  };

  const validClientInformation2: IClientBasicInformation = {
    name: 'TestNameShouldNotWork',
    hostUris: ['https://testshouldnotwork.com'],
    redirectUris: ['/callback2'],
  };

  const validClientInformation3: IClientBasicInformation = {
    name: 'TestNameShouldNotWork2',
    hostUris: ['https://testshouldnotwork2.com'],
    redirectUris: ['/callback3'],
  };

  let clientRegistrer = new clientModel({
    id: 'abcd1234567',
    secret: 'clientRegistrerSecret',
    audienceId: 'clientRegistereAudienceId',
    registrationToken: 'clientRegistretRegistrationToken',
    name: 'ClientRegistrer',
    hostUris: ['https://client.register.com'],
    redirectUris: ['/oauth2/callback'],
    scopes: [config.CLIENT_MANAGER_SCOPE],
  });

  let notClientRegistrer = new clientModel({
    id: 'notclientRegistrer123',
    secret: 'notClientRegistrer123Secret',
    audienceId: 'notClientRegistereAudienceId',
    registrationToken: 'notClientRegistrerRegistrationTokenBlaBla',
    name: 'notClientRegistrer',
    hostUris: ['https://verynotclient.register.com'],
    redirectUris: ['/callback/not/registrer'],
    scopes: ['blabla'],
  });

  let registeredClient = new clientModel({
    id: 'registeredClientId',
    secret: 'registeredClientSecret',
    audienceId: 'registeredClientAudienceId',
    registrationToken: 'registeredClientRegistrationTokenBlaBla',
    name: 'registeredClient',
    hostUris: ['https://registeredClient.register.com'],
    redirectUris: ['/callback/some1'],
    scopes: ['something'],
  });

  let registeredClient2 = new clientModel({
    id: 'registeredClientId2',
    secret: 'registeredClientSecret2',
    audienceId: 'registeredClientAudienceId2',
    registrationToken: 'registeredClientRegistrationTokenBlaBla2',
    name: 'registeredClient2',
    hostUris: ['https://registeredClient.register.com2'],
    redirectUris: ['/callback/some12'],
    scopes: ['something2'],
  });

  let updatedClient = new clientModel({
    id: 'updatedClientId',
    secret: 'updatedClientSecret',
    audienceId: 'updatedClientAudienceId',
    registrationToken: 'updatedClientRegistrationTokenBlaBla',
    name: 'updatedClient',
    hostUris: ['https://updatedClient.register.com'],
    redirectUris: ['/callback/very/nice'],
    scopes: ['something-new'],
  });

  let updatedClient2 = new clientModel({
    id: 'updatedClientId2',
    secret: 'updatedClientSecret2',
    audienceId: 'updatedClient2AudienceId',
    registrationToken: 'updatedClientRegistrationTokenBlaBla2',
    name: 'updatedClient2',
    hostUris: ['https://updatedClient2.register.com'],
    redirectUris: ['/callback/4u'],
    scopes: ['something-new2'],
  });

  let deletedClient = new clientModel({
    id: 'deletedClient',
    secret: 'deletedClientSecret',
    audienceId: 'deletedClientAudienceId',
    registrationToken: 'deletedClientRegistrationToken',
    name: 'deletedClientName',
    hostUris: ['https://deletedClient.com'],
    redirectUris: ['/callback/deleted/me'],
    scopes: ['something-new-delete'],
  });

  let deletedClient2 = new clientModel({
    id: 'deletedClient2',
    secret: 'deletedClientSecret2',
    audienceId: 'deletedClient2AudienceId',
    registrationToken: 'deletedClientRegistrationToken2',
    name: 'deletedClientName2',
    hostUris: ['https://deletedClient2.com'],
    redirectUris: ['/callback/me/again'],
    scopes: ['something-new-delete2'],
  });

  const updatedInformation: IClientBasicInformation = {
    name: 'newUpdatedClientName',
    hostUris: ['https://updatedClient.reg', 'https://updatedClient2.reg'],
    redirectUris: ['/callback', '/redirect', '/wellcome'],
  };

  // Will be created in before hook
  let clientRegistrerAccessToken: any = null;
  let notClientRegistrerAccessToken: any = null;

  before(async () => {
    // Delete all collections before test suite
    await deleteCollections();

    clientRegistrer = await clientRegistrer.save();
    notClientRegistrer = await notClientRegistrer.save();

    // clientRegistrerAccessToken = await new accessTokenModel({
    //   clientId: clientRegistrer._id,
    //   audience: config.issuerHostUri,
    //   value: '123456789',
    //   scopes: [config.CLIENT_MANAGER_SCOPE],
    //   grantType: 'client_credentials',
    //   expiresAt: 999999999999,
    // }).save();

    // notClientRegistrerAccessToken = await new accessTokenModel({
    //   clientId: notClientRegistrer._id,
    //   audience: config.issuerHostUri,
    //   value: '987654321',
    //   scopes: ['blabla'],
    //   grantType: 'client_credentials',
    //   expiresAt: 999999999999,
    // }).save();

    registeredClient = await registeredClient.save();
    registeredClient2 = await registeredClient2.save();
    updatedClient = await updatedClient.save();
    updatedClient2 = await updatedClient2.save();
    deletedClient = await deletedClient.save();
    deletedClient2 = await deletedClient2.save();
  });

  after(async () => {
    await deleteCollections();
  });

  describe('(Register Client) - /register', () => {

    before(async () => {
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
    });

    after(async () => {
      await deleteCollections(['accesstokens']);
    });

    it('Should register client by client manager that does have permissions', (done) => {

      request(app)
        .post(registerEndpoint)
        .send({ clientInformation: validClientInformation })
        .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
        .expect((res) => {

          // Quick fix due inserting default port to each host
          validClientInformation.hostUris = validClientInformation.hostUris.map((val) => {
            return (!(new URL(val).port) ? val + ':443' : val);
          });

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

    before(async () => {
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
    });

    after(async () => {
      await deleteCollections(['accesstokens']);
    });

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

    before(async () => {
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
    });

    after(async () => {
      await deleteCollections(['accesstokens']);
    });

    it(
      'Should update existing client information by client manager that does have permissions',
      (done) => {
        request(app)
          .put(`${registerEndpoint}/${updatedClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', updatedClient.registrationToken)
          .send({ clientInformation: updatedInformation })
          .expect((res) => {

            // Quick fix due inserting default port to each host
            updatedInformation.hostUris = updatedInformation.hostUris.map((val) => {
              return (!(new URL(val).port) ? val + ':443' : val);
            });

            expect(res).to.nested.include({
              status: 200,
              // Dismantle properties so chai can include them
              ...dismantleNestedProperties(
                'body',
                {
                  ...updatedClient.toJSON(),
                  // Lowercase redirectUris and hostUris in update information
                  ...lowerCasePropertiesValues(
                    [
                      propertyOf<IClientInformation>('redirectUris'),
                      propertyOf<IClientInformation>('hostUris'),
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

  describe('(Reset Client) - /register/:id', () => {

    before(async () => {

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

      await accessTokenModel.create({
        value: 'AccessTokenJWTValue',
        clientId: registeredClient2._id,
        audience: 'SomeAudienceId',
        grantType: 'client_credentials',
        scopes: [],
      });
      await authCodeModel.create({
        redirectUri: `${registeredClient2.hostUris[0] + registeredClient2.redirectUris[0]}`,
        value: 'SomeAuthCodeValue',
        clientId: registeredClient2._id,
        userId: 'SomeUserId',
        scopes: [],
        audience: 'AudienceId',
      });
    });

    after(async () => {
      await deleteCollections(['accesstokens', 'authcodes']);
    });

    it('Should reset client credentials by client manager that does have permissions',
       async () => {
         const response =
          await request(app)
                 .patch(`${registerEndpoint}/${registeredClient2.id}`)
                 .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
                 .set('Authorization', registeredClient2.registrationToken);

         expect(response.body).to.not.have.property(
           propertyOf<IClientInformation>('id'),
           registeredClient2.id,
         );
         expect(response.body).to.not.have.property(
           propertyOf<IClientInformation>('secret'),
           registeredClient2.secret,
         );

         expect(await accessTokenModel.find({ clientId: registeredClient2._id }))
         .to.be.an('array').that.is.empty;
         expect(await authCodeModel.find({ clientId: registeredClient2._id }))
         .to.be.an('array').that.is.empty;
       },
    );

    it('Should not reset client credentials without any authorization',
       (done) => {
         request(app)
          .patch(`${registerEndpoint}/${registeredClient2.id}`)
          .expect(400, { message: authFailMessages.CLIENT_MANAGER_TOKEN_MISSING })
          .end(done);
       },
    );

    it('Should not reset client credentials without client manager token',
       (done) => {
         request(app)
          .patch(`${registerEndpoint}/${registeredClient2.id}`)
          .set('Authorization', registeredClient2.registrationToken)
          .expect(400, { message: authFailMessages.CLIENT_MANAGER_TOKEN_MISSING })
          .end(done);
       },
    );

    it('Should not reset client credentials without client registration token',
       (done) => {
         request(app)
          .patch(`${registerEndpoint}/${registeredClient2.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .expect(400, { message: authFailMessages.REGISTRATION_TOKEN_MISSING })
          .end(done);
       },
    );

    it(`Should not reset client credentials with client manager token that ${''
       }does not have permissions`,
       (done) => {
         request(app)
          .patch(`${registerEndpoint}/${registeredClient2.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, notClientRegistrerAccessToken.value)
          .set('Authorization', registeredClient2.registrationToken)
          .expect(403, { message: authFailMessages.INSUFFICIENT_CLIENT_MANAGER_TOKEN })
          .end(done);
       },
    );

    it('Should not reset client credentials by invalid client id',
       (done) => {
         request(app)
          .patch(`${registerEndpoint}/${'InvalidClientId'}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', registeredClient2.registrationToken)
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(done);
       },
    );

    it('Should not reset client credentials with client id with unassociated registration token',
       (done) => {
         request(app)
          .patch(`${registerEndpoint}/${registeredClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', registeredClient2.registrationToken)
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(done);
       },
    );

    it('Should not reset client credentials by invalid registration token',
       (done) => {
         request(app)
          .patch(`${registerEndpoint}/${registeredClient.id}`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', 'invalidRegistrationToken')
          .expect(400, { message: authFailMessages.INVALID_REG_TOKEN_OR_CLIENT_ID })
          .end(done);
       },
    );

    it('Should not reset client credentials without specify client id',
       (done) => {
         request(app)
          .patch(`${registerEndpoint}/`)
          .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value)
          .set('Authorization', registeredClient2.registrationToken)
          .expect(404) // Because the route not found, express decide to drop it if id not present
          .end(done);
       },
    );

  });

  describe('(Delete Client) - /register/:id', () => {

    before(async () => {
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
    });

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
