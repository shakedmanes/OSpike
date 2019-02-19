// oauth2.routes.spec

import { expect } from 'chai';
import { default as request } from 'supertest';
import app from '../app';
import config from '../config';
import {
  deleteCollections,
  propertyOf,
  dismantleNestedProperties,
  lowerCasePropertiesValues,
} from '../test';
import accessTokenModel, {
  errorMessages as tokenErrorMessages,
} from '../accessToken/accessToken.model';
import clientModel from '../client/client.model';
import { IClient } from '../client/client.interface';
import { OAuth2Utils, JWTPayload } from './oauth2.utils';
import { errorMessages } from './oauth2.controller';

// Utility functions for the tests
function createAuthorizationParameters(responseType: string,
                                       clientId: string,
                                       redirectUri: string,
                                       scopes: string,
                                       state: string,
                                       audience: string) {
  return {
    ...(state ? { state } : null),
    ...(audience ? { audience } : null),
    ...(responseType ? { response_type: responseType } : null),
    ...(clientId ? { client_id: clientId } : null),
    ...(redirectUri ? { redirect_uri: redirectUri } : null),
    ...(scopes ? { scope: scopes } : null),
  };
}

function createTokenParameters(grantType?: string,
                               audience?: string,
                               scopes?: string,
                               username?: string,
                               password?: string) {
  return {
    ...(audience ? { audience } : null),
    ...(grantType ? { grant_type: grantType } : null),
    ...(scopes ? { scope: scopes } : null),
    ...(username ? { username } : null),
    ...(password ? { password } : null),
  };

}

/**
 * Create HTTP Basic Authentication string for authorization header
 * @param clientId - Id of the client
 * @param clientSecret - Secret of the client
 */
function createAuthorizationHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
}

interface ITokenOptions {
  aud?: string;
  scope?: string[] | string;
  sub?: string;
}

interface ITokenClaims extends Required<ITokenOptions> {
  clientId: string;
  iat: number;
  exp: number;
  iss: string;
}

interface IResponseBodyTemplate {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

enum GrantType { CODE, IMPLICIT, CLIENT_CREDENTIALS, PASSWORD }

function checkTokenResponseValidity(grantType: GrantType,
                                    response: request.Response,
                                    client: IClient,
                                    tokenOptions: ITokenOptions) {
  const responseBodyTemplate = ['access_token', 'refresh_token', 'expires_in', 'token_type'];

  switch (grantType) {

    case (GrantType.CODE):

      break;

    case (GrantType.IMPLICIT):
      break;

    // Checking Client Credentials Flow
    case (GrantType.CLIENT_CREDENTIALS):
      expect(response).to.have.property('status', 200);
      responseBodyTemplate.splice(1, 1);
      expect(response.body).to.have.all.keys(responseBodyTemplate);

      const accessToken: JWTPayload =
        OAuth2Utils.stripJWTAccessToken(response.body.access_token) as JWTPayload;

      expect(accessToken).to.nested.include({
        iss: config.issuerHostUri,
        clientId: client.id,
        sub: client._id.toString(),
        iat: accessToken.exp - config.ACCESS_TOKEN_EXPIRATION_TIME,
        exp: accessToken.iat + config.ACCESS_TOKEN_EXPIRATION_TIME,
        ...dismantleNestedProperties(null, tokenOptions),
      });
      break;

    case (GrantType.PASSWORD):
      break;

    default:
      break;
  }
}

describe('OAuth2 Flows Functionality', () => {

  // Routes for the flows
  const AUTH_CODE_ENDPOINT = `${config.OAUTH_ENDPOINT}/${config.OAUTH_AUTHORIZATION_ENDPOINT}`;
  const TOKEN_ENDPOINT = `${config.OAUTH_ENDPOINT}/${config.OAUTH_TOKEN_ENDPOINT}`;
  const LOGIN_ENDPOINT = `${config.OAUTH_ENDPOINT}/${config.OAUTH_USER_LOGIN_ENDPOINT}`;
  const DECISION_ENDPOINT = `${config.OAUTH_ENDPOINT}/${config.OAUTH_TOKEN_USER_CONSENT_ENDPOINT}`;
  const TOKEN_INTROSPECTION_ENDPOINT =
    `${config.OAUTH_ENDPOINT}/${config.OAUTH_TOKEN_INTROSPECTION_ENDPOINT}`;

  let registeredClient = new clientModel({
    id: 'registeredClientId',
    secret: 'registeredClientSecret',
    registrationToken: 'registeredClientRegistrationTokenBlaBla',
    name: 'registeredClient',
    hostUri: 'https://registeredClient.register.com',
    redirectUris: ['https://registeredClient.register.com/callback'],
    scopes: ['something'],
  });

  before(async () => {
    await deleteCollections();

    registeredClient = await registeredClient.save();
  });

  after(async () => {
    await deleteCollections();
  });

  describe('Authorization Code Flow', () => {

    it(
      'Should acquire authorization code by sending appropiate parameters for registered client',
      () => {

      },
    );
  });

  describe('Implicit Flow', () => {

  });

  describe('Resource Owner Password Credentials Flow', () => {

  });

  describe.only('Client Credentials Flow', () => {

    afterEach(async () => {
      await deleteCollections(['accesstokens']);
    });

    it(`Should acquire token for registered client ${''
        }via HTTP Basic Authentication`,
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .set(
            'Authorization',
            createAuthorizationHeader(registeredClient.id, registeredClient.secret),
          ).send(createTokenParameters('client_credentials', 'https://audience', 'something'))
          .expect((res) => {
            checkTokenResponseValidity(
              GrantType.CLIENT_CREDENTIALS,
              res,
              registeredClient,
              { aud: 'https://audience', scope: ['something'] },
            );
          }).end(done);
       },
    );

    it(`Should acquire token for registered client ${''
        }via POST Authentication`,
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .send({
            ...createTokenParameters('client_credentials', 'https://audience', 'something'),
            client_id: registeredClient.id,
            client_secret: registeredClient.secret,
          }).expect((res) => {
            checkTokenResponseValidity(
              GrantType.CLIENT_CREDENTIALS,
              res,
              registeredClient,
              { aud: 'https://audience', scope: ['something'] },
            );
          }).end(done);
       },
    );

    it(`Should acquire token for registered client ${''
        }even if there's already token for the client (different audience)`,
       async () => {
         const previousAccessToken = await new accessTokenModel({
           clientId: registeredClient._id,
           audience: 'https://someaudience.com',
           value: 'abcd1234',
           scopes: ['something'],
           grantType: 'client_credentials',
         }).save();

         const response =
           await request(app)
                  .post(TOKEN_ENDPOINT)
                  .set(
                    'Authorization',
                    createAuthorizationHeader(registeredClient.id, registeredClient.secret),
                  ).send(
                    createTokenParameters('client_credentials', 'https://audience', 'something'),
                  );

         checkTokenResponseValidity(
           GrantType.CLIENT_CREDENTIALS,
           response,
           registeredClient,
           { aud: 'https://audience', scope: ['something'] },
         );
       },
    );

    it(`Should not acquire token for registered client without client authentication`,
       (done) => {
         request(app)
         .post(TOKEN_ENDPOINT)
         .send(createTokenParameters('client_credentials', 'https://audience', 'something'))
         .expect(401)
         .end(done);
       },
    );

    it(`Should not acquire token for registered client without audience parameter`,
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .set(
            'Authorization',
            createAuthorizationHeader(registeredClient.id, registeredClient.secret),
          ).send(createTokenParameters('client_credentials', undefined, 'something'))
          .expect(400, { message: errorMessages.MISSING_AUDIENCE })
          .end(done);
       },
    );

    it(`Should not acquire token for registered client without/incorrect grant_type parameter`,
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .set(
            'Authorization',
            createAuthorizationHeader(registeredClient.id, registeredClient.secret),
          ).send(createTokenParameters(undefined, 'https://audience', 'something'))
          .expect(501)
          .end(done);
       },
    );

    it(`Should not acquire token for registered client when ${''
        }there's already token associated with the same audience`,
       async () => {
         const previousAccessToken = await new accessTokenModel({
          clientId: registeredClient._id,
          audience: 'https://audience',
          value: 'abcd1234',
          scopes: ['reading'],
          grantType: 'client_credentials',
         }).save();

         const response =
           await request(app)
                  .post(TOKEN_ENDPOINT)
                  .set(
                    'Authorization',
                    createAuthorizationHeader(registeredClient.id, registeredClient.secret),
                  ).send(
                    createTokenParameters('client_credentials', 'https://audience', 'something'),
                  );
         expect(response).to.nested.include({
           status: 400,
           'body.message': tokenErrorMessages.DUPLICATE_ACCESS_TOKEN,
         });

       },
    );
    // Need to think about it? (The first test function)
    it.skip('Should not acquire token for registered client without scope parameter');
    it.skip(`Should not acquire token for registered client ${''
            }with scopes that does not belong to it`);
    it.skip(`Should not acquire token for registered client without ${''
            }scopes registered (if not defined scope parameter)`);
    it('Should not acquire token for registered client by incorrect secret',
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .set('Authorization', createAuthorizationHeader(registeredClient.id, 'incorrectSecret'))
          .send(createTokenParameters('client_credentials', 'https://audience', 'something'))
          .expect(401)
          .end(done);
       },
    );

    it('Should not acquire token for unregistered client', (done) => {
      request(app)
        .post(TOKEN_ENDPOINT)
        .set('Authorization', createAuthorizationHeader('unexistingId', 'unexisitingSecret'))
        .send(createTokenParameters('client_credentials', 'https://audience', 'something'))
        .expect(401)
        .end(done);
    });

  });

  describe('Refresh Token Flow', () => {

  });

  describe('Token Introspection', () => {

  });
});
