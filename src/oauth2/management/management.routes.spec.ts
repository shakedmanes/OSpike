// management.routes.spec

import { expect } from 'chai';
import * as mongoose from 'mongoose';
import { default as request }  from 'supertest';
import { IClientInformation, IClientBasicInformation } from './management.interface';
import clientModel from '../../client/client.model';
import { IAccessToken } from '../../accessToken/accessToken.interface';
import accessTokenModel from '../../accessToken/accessToken.model';
import { deleteCollections, propertyOf } from '../../test';
import app from '../../app';
import config from '../../config';

describe.only('Client Management Routes Functionality', () => {

  const registerEndpoint = config.OAUTH_ENDPOINT + '/register';

  const validClientInformation: IClientBasicInformation =  {
    name: 'TestName',
    hostUri: 'https://test.com',
    redirectUris: ['https://test.com/callback'],
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

  // Will be created in before hook
  let clientRegistrerAccessToken: any = null;

  let notClientRegistrer = new clientModel({
    id: 'notclientRegistrer123',
    secret: 'notClientRegistrer123Secret',
    registrationToken: 'notClientRegistrerRegistrationTokenBlaBla',
    name: 'notClientRegistrer',
    hostUri: 'https://verynotclient.register.com',
    redirectUris: ['https://verynotclient.register.com/callback'],
    scopes: [config.CLIENT_MANAGER_SCOPE],
  });

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
  });

  after(async () => {
    await deleteCollections();
  });

  describe.only('(Register Client) - /register', () => {

    it.only('Should register client by client manager that does have permissions', () => {
      return expect(
        request(app)
        .post(registerEndpoint)
        .send({ clientInformation: validClientInformation })
        .set(config.CLIENT_MANAGER_AUTHORIZATION_HEADER, clientRegistrerAccessToken.value),
      ).to.eventually.exist.and.deep.include({ status: 201, body: { ...validClientInformation } })
       .and.have.keys(
         `body.${propertyOf<IClientInformation>('id')}`,
         `body.${propertyOf<IClientInformation>('secret')}`,
         `body.${propertyOf<IClientInformation>('registrationToken')}`,
       );
    });

    it('Should not register client by client manager that doesn\'t have permissions', () => {

    });

    it('Should not register client without data by client manager that does have permissions',
       () => {

       },
     );
  });

  describe('(Read Client) - /register/:id', () => {
    it('Should read existing client information by client manager that does have permissions',
       () => {

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
