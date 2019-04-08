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
import { IUser } from '../user/user.interface';
import { OAuth2Utils, JWTPayload } from './oauth2.utils';
import { IAccessToken } from '../accessToken/accessToken.interface';
import userModel from '../user/user.model';
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

enum GrantType { CODE, IMPLICIT, CLIENT_CREDENTIALS, PASSWORD, REFRESH_TOKEN }

function checkTokenResponseValidity(grantType: GrantType,
                                    response: request.Response,
                                    client: IClient,
                                    tokenOptions: ITokenOptions) {
  const responseBodyTemplate = ['access_token', 'refresh_token', 'expires_in', 'token_type'];
  let accessToken: JWTPayload;

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

      accessToken = OAuth2Utils.stripJWTAccessToken(response.body.access_token) as JWTPayload;

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
      expect(response).to.have.property('status', 200);
      expect(response.body).to.have.all.keys(responseBodyTemplate);

      accessToken = OAuth2Utils.stripJWTAccessToken(response.body.access_token) as JWTPayload;

      expect(accessToken).to.nested.include({
        iss: config.issuerHostUri,
        clientId: client.id,
        iat: accessToken.exp - config.ACCESS_TOKEN_EXPIRATION_TIME,
        exp: accessToken.iat + config.ACCESS_TOKEN_EXPIRATION_TIME,
        ...dismantleNestedProperties(null, tokenOptions),
      });
      break;

    case (GrantType.REFRESH_TOKEN):
      expect(response).to.have.property('status', 200);

      break;

    default:
      break;
  }
}

/**
 * Checks token introspection request validity
 * @param response - The response to check token introspection validity.
 * @param token - The access token to validate values appropriate to the response given.
 *                If not given at all, refers it like it was unexisted/inactive token.
 */
function checkTokenIntrospection(response: request.Response, token?: IAccessToken) {

  const payload = token ? OAuth2Utils.stripJWTAccessToken(token.value) as object : {};

  expect(response).to.nested.include({
    status: 200,
    ...dismantleNestedProperties(
      'body',
      {
        active: !!token,
        ...(token ?
          {
            clientId: token.clientId,
            ...(token.userId && typeof token.userId === 'object' ?
                { username: token.userId.name } : null),
            ...payload,
          } : {}
        ),

      },
    ),
  });
}

describe('OAuth2 Flows Functionality', () => {

  // Routes for the flows
  const AUTH_CODE_ENDPOINT = `${config.OAUTH_ENDPOINT}${config.OAUTH_AUTHORIZATION_ENDPOINT}`;
  const TOKEN_ENDPOINT = `${config.OAUTH_ENDPOINT}${config.OAUTH_TOKEN_ENDPOINT}`;
  const LOGIN_ENDPOINT = `${config.OAUTH_ENDPOINT}${config.OAUTH_USER_LOGIN_ENDPOINT}`;
  const DECISION_ENDPOINT = `${config.OAUTH_ENDPOINT}${config.OAUTH_TOKEN_USER_CONSENT_ENDPOINT}`;
  const TOKEN_INTROSPECTION_ENDPOINT =
    `${config.OAUTH_ENDPOINT}${config.OAUTH_TOKEN_INTROSPECTION_ENDPOINT}`;

  let registeredClient = new clientModel({
    id: 'registeredClientId',
    secret: 'registeredClientSecret',
    registrationToken: 'registeredClientRegistrationTokenBlaBla',
    name: 'registeredClient',
    hostUri: 'https://registeredClient.register.com',
    redirectUris: ['https://registeredClient.register.com/callback'],
    scopes: ['something'],
  });

  let registeredClient2 = new clientModel({
    id: 'registeredClientId2',
    secret: 'registeredClientSecert2',
    registrationToken: 'registreredClientRegistrationTokebBlaBla2',
    name: 'registeredClient2',
    hostUri: 'https://registeredClient2.register.com',
    redirectUris: ['https://registeredClient2.register.com/callback2'],
    scopes: ['something2'],
  });

  let registeredClient3 = new clientModel({
    id: 'registeredClientId3',
    secret: 'registeredClientSecert3',
    registrationToken: 'registreredClientRegistrationTokebBlaBla3',
    name: 'registeredClient3',
    hostUri: 'https://registeredClient3.register.com',
    redirectUris: ['https://registeredClient3.register.com/callback3'],
    scopes: ['something3'],
  });

  const registeredUserPassword = '123456';
  let registeredUser = new userModel({
    name: 'Someone',
    email: 'someone@someone.com',
    password: registeredUserPassword,
  });

  const registeredUserPassword2 = 'johnny';
  let registeredUser2 = new userModel({
    name: 'Johndoe',
    email: 'johndoe@smith.com',
    password: registeredUserPassword2,
  });

  before(async () => {
    await deleteCollections();

    registeredClient = await registeredClient.save();
    registeredClient2 = await registeredClient2.save();
    registeredClient3 = await registeredClient3.save();
    registeredUser = await registeredUser.save();
    registeredUser2 = await registeredUser2.save();
  });

  after(async () => {
    await deleteCollections();
  });

  describe('Authorization Code Flow', () => {

  });

  describe('Implicit Flow', () => {

  });

  describe.only('Resource Owner Password Credentials Flow', () => {

    afterEach(async () => {
      await deleteCollections(['accesstokens']);
    });

    it('Should acquire token for registered client and user via HTTP Basic Authentication',
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .set(
            'Authorization',
            createAuthorizationHeader(registeredClient.id, registeredClient.secret),
          ).send(
            createTokenParameters(
              'password',
              'https://audience',
              'something',
              registeredUser.email,
              registeredUserPassword,
            ),
          ).expect((res) => {
            checkTokenResponseValidity(
              GrantType.PASSWORD,
              res,
              registeredClient,
              { aud: 'https://audience', scope: ['something'], sub: registeredUser.id },
            );
          }).end(done);
       },
    );

    it('Should acquire token for registered client and user via POST Authentication',
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .send({
            ...createTokenParameters(
              'password',
              'https://audience',
              'something',
              registeredUser.email,
              registeredUserPassword,
            ),
            client_id: registeredClient.id,
            client_secret: registeredClient.secret,
          }).expect((res) => {
            checkTokenResponseValidity(
              GrantType.PASSWORD,
              res,
              registeredClient,
              { aud: 'https://audience', scope: ['something'], sub: registeredUser.id },
            );
          }).end(done);
       },
    );

    it(`Should acquire token for registered client and user ${''
        }even if there's already token for the user (different audience)`,
       async () => {
         const previousAccessToken = await new accessTokenModel({
           clientId: registeredClient._id,
           audience: 'https://someaudience.com',
           userId: registeredUser.id,
           value: 'abcd1234',
           scopes: ['something'],
           grantType: 'password',
         }).save();

         const response =
           await request(app)
                  .post(TOKEN_ENDPOINT)
                  .set(
                    'Authorization',
                    createAuthorizationHeader(registeredClient.id, registeredClient.secret),
                  ).send(
                    createTokenParameters(
                      'password',
                      'https://audience',
                      'something',
                      registeredUser.email,
                      registeredUserPassword,
                    ),
                  );

         checkTokenResponseValidity(
           GrantType.PASSWORD,
           response,
           registeredClient,
           { aud: 'https://audience', scope: ['something'], sub: registeredUser.id },
         );
       },
    );

    it(`Should acquire token for registered client and user ${''
        }even if there's already token for the user (different user)`,
       async () => {
         const previousAccessToken = await new accessTokenModel({
           clientId: registeredClient._id,
           audience: 'https://audience.com',
           userId: registeredUser.id,
           value: 'abcd1234',
           scopes: ['something'],
           grantType: 'password',
         }).save();

         const response =
           await request(app)
                  .post(TOKEN_ENDPOINT)
                  .set(
                    'Authorization',
                    createAuthorizationHeader(registeredClient.id, registeredClient.secret),
                  ).send(
                    createTokenParameters(
                      'password',
                      'https://audience',
                      'something',
                      registeredUser2.email,
                      registeredUserPassword2,
                    ),
                  );

         checkTokenResponseValidity(
           GrantType.PASSWORD,
           response,
           registeredClient,
           { aud: 'https://audience', scope: ['something'], sub: registeredUser2.id },
         );
       },
    );

    it('Should not acquire token for registered client and user without client authentication',
       (done) => {
         request(app)
         .post(TOKEN_ENDPOINT)
         .send(
           createTokenParameters(
             'password',
             'https://audience',
             'something',
             registeredUser.id,
             registeredUserPassword,
            ),
         ).expect(401)
         .end(done);
       },
    );

    it('Should not acquire token for registered client and user without audience parameter',
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .set(
            'Authorization',
            createAuthorizationHeader(registeredClient.id, registeredClient.secret),
          ).send(
            createTokenParameters(
              'password',
              undefined,
              'something',
              registeredUser.email,
              registeredUserPassword,
            ),
          ).expect(400, { message: errorMessages.MISSING_AUDIENCE })
          .end(done);
       },
    );

    it(`Should not acquire token for registered client and user ${''
        }without/incorrect grant_type parameter`,
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .set(
            'Authorization',
            createAuthorizationHeader(registeredClient.id, registeredClient.secret),
          ).send(
            createTokenParameters(
              undefined,
              'https://audience',
              'something',
              registeredUser.email,
              registeredUserPassword,
            ),
          ).expect(501)
          .end(done);
       },
    );

    it(`Should not acquire token for registered client and user when ${''
        }there's already token associated with the same audience`,
       async () => {
         const previousAccessToken = await new accessTokenModel({
          clientId: registeredClient._id,
          userId: registeredUser._id,
          audience: 'https://audience',
          value: 'abcd1234',
          scopes: ['reading'],
          grantType: 'password',
         }).save();

         const response =
           await request(app)
                  .post(TOKEN_ENDPOINT)
                  .set(
                    'Authorization',
                    createAuthorizationHeader(registeredClient.id, registeredClient.secret),
                  ).send(
                    createTokenParameters(
                      'password',
                      'https://audience',
                      'something',
                      registeredUser.email,
                      registeredUserPassword,
                      ),
                  );
         expect(response).to.nested.include({
           status: 400,
           'body.message': tokenErrorMessages.DUPLICATE_ACCESS_TOKEN,
         });

       },
    );

    it('Should not acquire token for unregistered client',
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .set(
            'Authorization',
            createAuthorizationHeader('unexistingClientId', 'unexisitingClientSecret'),
          ).send(
            createTokenParameters(
              'password',
              'https://audience',
              'something',
              registeredUser.email,
              registeredUserPassword,
            ),
          ).expect(401)
          .end(done);
       },
    );

    it('Should not acquire token for unregistered user',
       (done) => {
         request(app)
          .post(TOKEN_ENDPOINT)
          .set(
            'Authorization',
            createAuthorizationHeader(registeredClient.id, registeredClient.secret),
          ).send(
            createTokenParameters(
              'password',
              'https://audience',
              'something',
              'unexistingUserEmail',
              'unexistingUserPassword',
            ),
          ).expect(403, { message: 'Invalid resource owner credentials' })
          .end(done);
       },
    );
  });

  describe('Client Credentials Flow', () => {

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

    let validToken = new accessTokenModel({
      clientId: registeredClient._id,
      audience: registeredClient2.hostUri,
      value: OAuth2Utils.createJWTAccessToken({
        aud: registeredClient2.hostUri,
        sub: registeredClient._id,
        scope: ['read'],
        clientId: registeredClient._id,
      }),
      scopes: ['read'],
      grantType: 'client_credentials',
    });

    let validToken2 = new accessTokenModel({
      clientId: registeredClient._id,
      userId: registeredUser._id,
      audience: registeredClient2.hostUri,
      value: OAuth2Utils.createJWTAccessToken({
        aud: registeredClient2.hostUri,
        sub: registeredUser._id,
        scope: ['write'],
        clientId: registeredClient._id,
      }),
      scopes: ['write'],
      grantType: 'code',
    });

    let validInactiveToken = new accessTokenModel({
      clientId: registeredClient2._id,
      audience: registeredClient.hostUri,
      value: OAuth2Utils.createJWTAccessToken({
        aud: registeredClient.hostUri,
        sub: registeredClient2._id,
        scope: ['write'],
        clientId: registeredClient2._id,
      }),
      scopes: ['write'],
      grantType: 'client_credentials',
    });

    before(async () => {
      await deleteCollections(['accesstokens']);
      validToken = await validToken.save();
      validToken2 = await validToken2.save();
      validInactiveToken = await validInactiveToken.save();
      await validInactiveToken.update({ expireAt: 100 });
    });

    it('Should return information about valid token via HTTP Basic Authentication', (done) => {
      request(app)
        .post(TOKEN_INTROSPECTION_ENDPOINT)
        .set(
          'Authorization',
          createAuthorizationHeader(registeredClient.id, registeredClient.secret),
        ).send({ token: validToken.value })
        .expect(res => checkTokenIntrospection(res, validToken))
        .end(done);
    });

    it('Should return information about valid token via POST Authentication', (done) => {
      request(app)
        .post(TOKEN_INTROSPECTION_ENDPOINT)
        .send({
          token: validToken.value,
          client_id: registeredClient.id,
          client_secret: registeredClient.secret,
        }).expect(res => checkTokenIntrospection(res, validToken))
        .end(done);
    });

    it('Should return information about valid token containing associated username', (done) => {
      request(app)
        .post(TOKEN_INTROSPECTION_ENDPOINT)
        .set(
          'Authorization',
          createAuthorizationHeader(registeredClient.id, registeredClient.secret),
        ).send({ token: validToken2.value })
        .expect(res => checkTokenIntrospection(res, validToken2))
        .end(done);
    });

    it('Should return information about valid token to audience client', (done) => {
      request(app)
        .post(TOKEN_INTROSPECTION_ENDPOINT)
        .set(
          'Authorization',
          createAuthorizationHeader(registeredClient2.id, registeredClient2.secret),
        ).send({ token: validToken.value })
        .expect(res => checkTokenIntrospection(res, validToken))
        .end(done);
    });

    it('Should return information about valid token to the associated client', (done) => {
      request(app)
      .post(TOKEN_INTROSPECTION_ENDPOINT)
      .set(
        'Authorization',
        createAuthorizationHeader(registeredClient.id, registeredClient.secret),
      ).send({ token: validToken.value })
      .expect(res => checkTokenIntrospection(res, validToken))
      .end(done);
    });

    it(`Should not return information about valid token to ${''
       }client which is not associated or audience`,
       (done) => {
         request(app)
          .post(TOKEN_INTROSPECTION_ENDPOINT)
          .set(
            'Authorization',
            createAuthorizationHeader(registeredClient3.id, registeredClient3.secret),
          ).send({ token: validToken.value })
          .expect(res => checkTokenIntrospection(res))
          .end(done);
       },
    );

    it('Should not return information about valid token without authentication', (done) => {
      request(app)
        .post(TOKEN_INTROSPECTION_ENDPOINT)
        .send({ token: validToken.value })
        .expect(401)
        .end(done);
    });

    it('Should return only active status about inactive token', (done) => {
      request(app)
        .post(TOKEN_INTROSPECTION_ENDPOINT)
        .set(
          'Authorization',
          createAuthorizationHeader(registeredClient2.id, registeredClient2.secret),
        ).send({ token: validInactiveToken.value })
        .expect(res => checkTokenIntrospection(res))
        .end(done);
    });

    it('Should return only active status about unexists token', (done) => {

      const unexistToken = OAuth2Utils.createJWTAccessToken({
        aud: 'https://unexistingAudienceHostUri',
        sub: 'unexistSubjectId',
        scope: ['unexistingScope'],
        clientId: 'unexistingClientId',
      });

      const unexistToken2 = OAuth2Utils.createJWTAccessToken({
        aud: registeredClient3.hostUri,
        sub: registeredClient2._id,
        scope: ['something2'],
        clientId: registeredClient2.id,
      });

      request(app)
        .post(TOKEN_INTROSPECTION_ENDPOINT)
        .set(
          'Authorization',
          createAuthorizationHeader(registeredClient.id, registeredClient.secret),
        ).send({ token:  unexistToken })
        .expect(res => checkTokenIntrospection(res))
        .end(() => {
          request(app)
            .post(TOKEN_INTROSPECTION_ENDPOINT)
            .set(
              'Authorization',
              createAuthorizationHeader(registeredClient.id, registeredClient.secret),
            ).send({ token:  unexistToken2 })
            .expect(res => checkTokenIntrospection(res))
            .end(done);
        });
    });
  });
});
