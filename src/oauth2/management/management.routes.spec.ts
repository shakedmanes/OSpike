// management.routes.spec

import { expect } from 'chai';
import * as mongoose from 'mongoose';
import { default as request }  from 'supertest';
import { IClientInformation, IClientBasicInformation } from './management.interface';
import { authFailMessages } from './management.auth';
import { errorMessages } from './management.routes';
import clientModel from '../../client/client.model';
import accessTokenModel from '../../accessToken/accessToken.model';
import { deleteCollections, propertyOf, dismantleNestedProperties } from '../../test';
import { InvalidParameter } from '../../utils/error';
import app from '../../app';
import config from '../../config';

describe.only('Client Management Routes Functionality', () => {

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
  });

  after(async () => {
    await deleteCollections();
  });

  describe.only('(Register Client) - /register', () => {

    it.only('Should register client by client manager that does have permissions', (done) => {

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
    it.only(
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
       () => {

       },
    );

    it('Should not read unexisting client information by client manager that does have permissions',
       () => {

       },
    );

    it(`Should not read client information without specifing
         client id by client manager that does have permissions`,
    );
  });

  describe('(Update Client) - /register/:id', () => {

    it('Should update existing client information by client manager that does have permissions',
       () => {

       },
    );

    it(`Sohuld not update existing client information by
        client manager that doesn\'t have permissions`,
       () => {

       },
     );

    it(`Should not update unexisting client information
        by client manager that does have permissions`,
       () => {

       },
     );
  });

});
