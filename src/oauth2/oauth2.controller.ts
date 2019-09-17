// oauth2.controller

import * as oauth2orize from 'oauth2orize';
import { ensureLoggedIn } from 'connect-ensure-login';
import passport from 'passport';
import { Response, Request, NextFunction } from 'express';
import {
  authCodeValueGenerator,
  refreshTokenValueGenerator,
} from '../utils/valueGenerator';
import { OAuth2Utils } from './oauth2.utils';
import authCodeModel from '../authCode/authCode.model';
import accessTokenModel from '../accessToken/accessToken.model';
import { IAccessToken } from '../accessToken/accessToken.interface';
import refreshTokenModel from '../refreshToken/refreshToken.model';
import clientModel from '../client/client.model';
import { IClient } from '../client/client.interface';
import userModel from '../user/user.model';
import { validatePasswordHash } from '../utils/hashUtils';
import { isScopeEquals } from '../utils/isEqual';
import config from '../config';
import { BadRequest } from '../utils/error';
import { LOG_LEVEL, log, parseLogData } from '../utils/logger';

// Error messages
export const errorMessages = {
  MISSING_AUDIENCE: 'The audience parameter is missing.',
  MISSING_SCOPE_IN_CLIENT: `Client doesn't support client_credentials due incomplete scopes value.`,
  MISSING_SCOPE: 'The scope parameter is missing.',
};

// TODO: create specified config files with grants types
// TODO: create generated session key for each of the requests
// TODO: refactor ensureLoggedIn binding
const server = oauth2orize.createServer();

// Binds the route for login in ensure logged in middleware
const loginUri = '/oauth2/login';
const ensureLoggedInMiddleware = ensureLoggedIn.bind({}, loginUri);

/**
 * ############ FOR FUTURE VERSIONS ############
 * According to what said in accessToken.model file, for updating the expires_in field
 * which sent to indicates the user how much time the token is valid to, it should be
 * taken from specific token time configuration field inside the client model.
 * Also need to configure that in the token introspection route (returning exp field).
 */

/**
 * Grant authorization codes
 *
 * The callback takes the `client` requesting authorization, the `redirectURI`
 * (which is used as a verifier in the subsequent exchange), the authenticated
 * `user` granting access, and their response, which contains approved scope,
 * duration, etc. as parsed by the application.  The application issues a code,
 * which is bound to these values, and will be exchanged for an access token.
 */
server.grant(oauth2orize.grant.code(
  async (client, redirectUri, user, ares, done) => {

    // Check if there's token already for the user and client for the audience,
    // therfore avoid generating code
    const token = await accessTokenModel.findOne({
      clientId: client._id,
      userId: user._id,
      audience: ares.audience,
    });

    if (token) {
      return done(new BadRequest('There\'s already access token for that \
                                  client and user for that audience.'));
    }

    try {
      const authCode = await new authCodeModel({
        redirectUri,
        value: authCodeValueGenerator(),
        clientId: client._id,
        userId: user._id,
        scopes: ares.scope,
        audience: ares.audience,
      }).save();

      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'OAuth2 Flows',
          `Flow: Authorization Code ${'\r\n'
           }Results: Generated authorization code for the following properties.\r\n
           clientId: ${client.id}\r\nuserId: ${user._id}\r\n\audience: ${ares.audience
          }\r\nscopes: ${ares.scope}\r\nvalue: ${authCode.value}`,
          200,
          null,
        ),
      );

      return done(null, authCode.value);

    } catch (err) {
      return done(err);
    }
  },
));

/**
 * Grant implicit authorization.
 *
 * The callback takes the `client` requesting authorization, the authenticated
 * `user` granting access, and their response, which contains approved scope,
 * duration, etc. as parsed by the application.  The application issues a token,
 * which is bound to these values.
 */
server.grant(oauth2orize.grant.token(async (client, user, ares, done) => {
  // In authorization endpoint, the redirect uri of the client got checked to ensure
  // The client is really who requesting the token.

  try {
    const accessToken = await new accessTokenModel({
      value: OAuth2Utils.createJWTAccessToken({
        aud: ares.audience,
        sub: user._id,
        scope: ares.scope,
        clientId: client.id,
      }),
      clientId: client._id,
      userId: user._id,
      audience: ares.audience,
      scopes: ares.scope,
      grantType: 'token',
    }).save();

    log(
      LOG_LEVEL.INFO,
      parseLogData(
        'OAuth2 Flows',
        `Flow: Implicit \r\nResults: Generated token for the following properties.${'\r\n'
         }audience: ${accessToken.audience}`,
        200,
        null,
      ),
    );

    return done(null, accessToken.value, { expires_in: config.ACCESS_TOKEN_EXPIRATION_TIME });
  } catch (err) {
    return done(err);
  }
}));

/**
 * Exchange authorization code for access token.
 * Finds the authorization code, create new access token and deletes the used authorization code.
 */
server.exchange(oauth2orize.exchange.code(
  async (client, code, redirectUri, done) => {

    let authCode = await authCodeModel.findOne({ value: code }).populate('clientId');
    if (authCode &&
        client.id === (<IClient>authCode.clientId).id &&
        redirectUri === authCode.redirectUri) {

      try {
        authCode = await authCode.remove();

        // Generate fresh access token
        const accessToken = await new accessTokenModel({
          value: OAuth2Utils.createJWTAccessToken({
            aud: authCode.audience,
            sub: authCode.userId as string,
            scope: authCode.scopes,
            clientId: client.id,
          }),
          clientId: (<IClient>authCode.clientId)._id,
          userId: authCode.userId,
          audience: authCode.audience,
          scopes: authCode.scopes,
          grantType: 'code',
        }).save();

        // Generate refresh token based on access token
        const refreshToken = await new refreshTokenModel({
          value: refreshTokenValueGenerator(),
          accessTokenId: accessToken._id,
        }).save();

        const additionalParams = {
          expires_in: config.ACCESS_TOKEN_EXPIRATION_TIME,
        };

        log(
          LOG_LEVEL.INFO,
          parseLogData(
            'OAuth2 Flows',
            `Flow: Exchange Authorization code ${'\r\n'
             }Results: Generated token for the following properties.${'\r\n'
             }JWT Contents: ${JSON.stringify(OAuth2Utils.stripJWTAccessToken(accessToken.value))}`,
            200,
            null,
          ),
        );

        done(null, accessToken.value, refreshToken.value, additionalParams);
      } catch (err) {
        done(err);
      }

    } else {
      // Authorization code specified not found, pass 'false' in accessToken field for generate
      // appropiate TokenError('Invalid authorization code', 'invalid_grant').
      // This could occurres by invalid client id or redirect uri specified, not only invalid code.

      log(
        LOG_LEVEL.WARN,
        parseLogData(
          'OAuth2 Flows',
          `Flow: Exchange Authorization code ${'\r\n'
           }Results: Invalid client id or redirect uri specified.${'\r\n'
           }`,
          400,
          null,
        ),
      );

      done(null, false);
    }
  },
));

/**
 * Grant Resource Owner Password Credentials
 *
 * Exchange user id and password for access tokens.
 *
 * The callback accepts the `client`, which is exchanging the user's name and password
 * from the token request for verification. If these values are validated, the
 * application issues an access token on behalf of the user who authorized the code.
 */
server.exchange(oauth2orize.exchange.password(
  {},
  async (client, username, password, scope, body, done) => {

    // Check if audience specified
    if (!body.audience) {
      return done(new BadRequest(errorMessages.MISSING_AUDIENCE));
    }

    // In the user model schema we authenticate via email & password so username should be the email
    const user = await userModel.findOne({ email: username }).lean();

    if (user && validatePasswordHash(password, user.password)) {

      try {
        const accessToken = await new accessTokenModel({
          value: OAuth2Utils.createJWTAccessToken({
            scope,
            aud: body.audience,
            sub: user._id,
            clientId: client.id,
          }),
          clientId: client._id,
          userId: user._id,
          audience: body.audience,
          scopes: scope,
          grantType: 'password',
        }).save();

        const refreshToken = await new refreshTokenModel({
          value: refreshTokenValueGenerator(),
          accessTokenId: accessToken._id,
        }).save();

        const additionalParams = {
          expires_in: config.ACCESS_TOKEN_EXPIRATION_TIME,
        };

        log(
          LOG_LEVEL.INFO,
          parseLogData(
            'OAuth2 Flows',
            `Flow: Resource Owner Password Credentials ${'\r\n'
             }Results: Generated token for the following properties.${'\r\n'
             }JWT Contents: ${JSON.stringify(OAuth2Utils.stripJWTAccessToken(accessToken.value))}`,
            200,
            null,
          ),
        );

        return done(null, accessToken.value, refreshToken.value, additionalParams);
      } catch (err) {
        return done(err);
      }
    }

    log(
      LOG_LEVEL.INFO,
      parseLogData(
        'OAuth2 Flows',
        `Flow: Resource Owner Password Credentials ${'\r\n'
         }Results: Invalid user name or password given.${'\r\n'
         }username: ${username}\r\n password: ${password}`,
        400,
        null,
      ),
    );

    return done(null, false);
  },
));

/**
 * Grant Client Credentials
 *
 * Exchange the client id and password/secret for an access token.
 *
 * The callback accepts the `client`, which is exchanging the client's id and
 * password/secret from the token request for verification. If these values are validated, the
 * application issues an access token on behalf of the client who authorized the code.
 */
server.exchange(oauth2orize.exchange.clientCredentials(
  {},
  async (client: IClient, scope, body, done) => {

    // TODO: Uncomment the following code when scopes feature is ready.

    // If the client doesn't have actually scopes to grant authorization on
    // if (client.scopes.length === 0) {
    // tslint:disable-next-line:max-line-length
    //   return done(new BadRequest(errorMessages.MISSING_SCOPE_IN_CLIENT));
    // }

    // Check if audience specified
    if (!body.audience) {
      return done(new BadRequest(errorMessages.MISSING_AUDIENCE));
    }

    try {
      // Change scopes values when working on scopes feature
      const accessToken = await new accessTokenModel({
        value: OAuth2Utils.createJWTAccessToken({
          aud: body.audience,
          sub: client._id,
          scope: client.scopes, // Change this to body.scope
          clientId: client.id,
        }),
        clientId: client._id,
        audience: body.audience,
        grantType: 'client_credentials',
        scopes: client.scopes, // Change this to body.scope
      }).save();

      // As said in OAuth2 RFC in https://tools.ietf.org/html/rfc6749#section-4.4.3
      // Refresh token SHOULD NOT be included in client credentials
      const additionalParams = {
        expires_in: config.ACCESS_TOKEN_EXPIRATION_TIME,
      };

      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'OAuth2 Flows',
          `Flow: Client Credentials ${'\r\n'
           }Results: Generated token for the following properties.${'\r\n'
           }JWT Contents: ${JSON.stringify(OAuth2Utils.stripJWTAccessToken(accessToken.value))}`,
          200,
          null,
        ),
      );

      return done(null, accessToken.value, undefined, additionalParams);

    } catch (err) {
      return done(err);
    }
  },
));

/**
 * Exchange the refresh token for an access token.
 *
 * The callback accepts the `client`, which is exchanging the client's id from the token
 * request for verification.  If this value is validated, the application issues an access
 * token on behalf of the client who authorized the code
 */
server.exchange(oauth2orize.exchange.refreshToken(async (client, refreshToken, scope, done) => {
  // Getting the refresh token and populating down the chain to client
  const refreshTokenDoc = await refreshTokenModel.findOne({
    value: refreshToken,
  }).populate({
    path: 'accessTokenId',
    populate: { path: 'clientId' },
  });

  // Checking the refresh token was issued for the authenticated client.
  // Also, checking if somehow an attacker managed to create refresh token for client credentials
  // flow and avoid it.
  if (refreshTokenDoc &&
      (<IClient>(<IAccessToken>refreshTokenDoc.accessTokenId).clientId).id === client.id &&
      (<IAccessToken>refreshTokenDoc.accessTokenId).grantType !== 'client_credentials') {
    try {
      // Need to delete previous access token and refresh token
      await (<IAccessToken>refreshTokenDoc.accessTokenId).remove();
      await refreshTokenDoc.remove();

      const accessToken = await new accessTokenModel({
        value: OAuth2Utils.createJWTAccessToken({
          aud: (<IAccessToken>refreshTokenDoc.accessTokenId).audience,
          sub: (<IAccessToken>refreshTokenDoc.accessTokenId).userId as string,
          scope: (<IAccessToken>refreshTokenDoc.accessTokenId).scopes,
          clientId: (<IClient>(<IAccessToken>refreshTokenDoc.accessTokenId).clientId).id,
        }),
        clientId: (<IClient>(<IAccessToken>refreshTokenDoc.accessTokenId).clientId)._id,
        userId: (<IAccessToken>refreshTokenDoc.accessTokenId).userId,
        audience: (<IAccessToken>refreshTokenDoc.accessTokenId).audience,
        scopes: (<IAccessToken>refreshTokenDoc.accessTokenId).scopes,
        grantType: (<IAccessToken>refreshTokenDoc.accessTokenId).grantType,
      }).save();

      const newRefreshToken = await new refreshTokenModel({
        value: refreshTokenValueGenerator(),
        accessTokenId: accessToken._id,
      }).save();

      // Should consider security-wise returning a new refresh token with the response.
      // Maybe in future releases refresh token will be omitted.
      const additionalParams = {
        expires_in: config.ACCESS_TOKEN_EXPIRATION_TIME,
      };

      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'OAuth2 Flows',
          `Flow: Refresh Token ${'\r\n'
           }Results: Generated new token for the following properties.${'\r\n'
           }JWT Contents: ${JSON.stringify(OAuth2Utils.stripJWTAccessToken(accessToken.value))}`,
          200,
          null,
        ),
      );

      return done(null, accessToken.value, newRefreshToken.value, additionalParams);
    } catch (err) {
      return done(err);
    }
  }

  log(
    LOG_LEVEL.INFO,
    parseLogData(
      'OAuth2 Flows',
      `Flow: Refresh Token ${'\r\n'}Results: Invalid refresh token given.`,
      401,
      null,
    ),
  );

  return done(null, false);
}));

/**
 * Authorization Middlewares for Authorization endpoint
 * The authorization endpoint should implement the end user authentication.
 */
export const authorizationEndpoint = [
  ensureLoggedInMiddleware(),
  server.authorization(
    // TODO: add typing for new validate function
    async (areq: any , done: any) => {
      const client = await clientModel.findOne({ id: areq.clientID });
      if (client && client.isValidRedirectUri(areq.redirectURI)) {

        /**
         * Note For Future Releases:
         * We need to validate the scopes requested - check if the client has the scopes
         * that he trying to acheive with the checkSufficientScopes function
         * found in scopeUtils file
         */

        return done(null, client, areq.redirectURI);
      }
      // Client specified not found or invalid redirect uri specified.
      // Generates error - AuthorizationError('Unauthorized client', 'unauthorized_client')
      return done(null, false);
    },
    // Check if grant request qualifies for immediate approval
    async (client, user, scope, type, areq, done) => {
      // Checking if token already genereated for the user in the client
      const accessToken =
      await accessTokenModel.findOne({ clientId: client._id, userId: user._id }).lean();

      // User already have token in the client with requested scopes
      // TODO: Consider if the client requests for other scope, ask the user if he wants
      //       To drop the access token that the client have and create a new one with
      //       The requested scopes.
      if (accessToken && isScopeEquals(accessToken.scopes, scope)) {
        return done(null, true, { scope: areq.scope }, null);
      }

      // TODO: Implement option for user to allow once for the client and if he want to change
      //       He can do that after. So we can check quickly if the user allowed that client before.

      // Let the user decide
      return done(null, false, { scope: areq.scope }, null);
    },

  ),
  // Here should be the approvement consents for after the user autnenticated.
  // tslint:disable-next-line:max-line-length
  // like in https://github.com/scottksmith95/beerlocker/blob/master/beerlocker-6.1/controllers/oauth2.js#L126

  // TODO: Implement request handler for the user stage of allow authorization to requested scopes
  (req: any, res: Response, next: NextFunction) => {

    // Put on the oauth2 request information object the audience
    if (!req.query.audience) {
      throw new BadRequest(errorMessages.MISSING_AUDIENCE);
    }

    req.oauth2.info.audience = req.query.audience;

    res.render('decision', {
      transactionID: req.oauth2.transactionID,
      user: req.user,
      client: req.oauth2.client,
    });
  },
];

/**
 * User decision endpoint
 *
 * `decision` middleware processes a user's decision to allow or deny access
 * requested by a client application.  Based on the grant type requested by the
 * client, the above grant middleware configured above will be invoked to send
 * a response.
 */
export const decisionEndpoint = [
  ensureLoggedInMiddleware(),
  server.decision((req, done) => {
    // Pass the request information to the authorization grant middleware
    return done(null, req.oauth2 ? req.oauth2.info : {});
  }),
];

/**
 * Token endpoint
 *
 * `token` middleware handles client requests to exchange authorization grants
 * for access tokens.  Based on the grant type being exchanged, the above
 * exchange middleware will be invoked to handle the request.  Clients must
 * authenticate when making requests to this endpoint.
 */
export const tokenEndpoint = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
];

/**
 * Token Introspection endpoint
 *
 * The token introspection endpoint used for getting information about given token
 * to indicate the state of the token to the client (expiration time, audience, etc.)
 * more information in @see https://tools.ietf.org/html/rfc7662
 */
export const tokenIntrospectionEndpoint = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.body.token;

    if (token) {
      let jwtPayload = {};

      try {
        jwtPayload = OAuth2Utils.stripJWTAccessToken(token);
      } catch (err) {

        log(
          LOG_LEVEL.INFO,
          parseLogData(
            'OAuth2 Flows',
            `Flow: Token Introspection ${'\r\n'
             }Results: Received expired or invalid token.${'\r\n'
             }token: ${token}`,
            200,
            null,
          ),
        );

        return res.status(200).send({ active: false });
      }

      const accessToken =
        await accessTokenModel.findOne({ value: token })
                              .populate('userId clientId audienceClient').lean();

      // If access token found and associated to the requester
      if (accessToken &&
          (accessToken.expireAt.getTime() +
           (config.ACCESS_TOKEN_EXPIRATION_TIME * 1000) > Date.now()) &&
          typeof accessToken.clientId === 'object' &&
          ((<IAccessToken>accessToken.clientId).id === req.user.id ||
          (accessToken.audienceClient && accessToken.audienceClient.id === req.user.id))) {

        log(
          LOG_LEVEL.INFO,
          parseLogData(
            'OAuth2 Flows',
            `Flow: Token Introspection ${'\r\n'
            }Results: Return information regarding the following token.${'\r\n'
            }JWT Contents: ${JSON.stringify(OAuth2Utils.stripJWTAccessToken(accessToken.value))}`,
            200,
            null,
          ),
        );

        return res.status(200).send({
          active: true,
          clientId: (<IAccessToken>accessToken.clientId).id,
          ...(accessToken.userId && typeof accessToken.userId === 'object' ?
             { username: accessToken.userId.name } : null),
          ...jwtPayload,
        });
      }
    }

    log(
      LOG_LEVEL.INFO,
      parseLogData(
        'OAuth2 Flows',
        `Flow: Token Introspection ${'\r\n'
         }Results: Received expired or invalid token.${'\r\n'
         }token: ${token}`,
        200,
        null,
      ),
    );

    // Any other possible cases should be handled like that for preventing token scanning attacks
    return res.status(200).send({ active: false });
  },
];

// Authentication endpoints (login endpoints)
export const loginForm = (req: Request, res: Response) => {

  // Checks if there's any errors from previous authentication
  // cause if the login failed this is the redirect uri.
  let errorMessage = null;
  if (req.session) {
    // User trying reach this route not via authorize route
    if (!req.session.returnTo ||
        (req.session.returnTo && !req.session.returnTo.startsWith('/oauth2/authorize?'))) {
      throw new BadRequest('Authentication without OAuth2 flow is not permitted!');
    }
    errorMessage = req.session.messages ? req.session.messages[0] : null;
  }

  res.render('login', { errorMessage });
};

export const loginMethod = [
  passport.authenticate(
    'local',
    {
      successReturnToOrRedirect: '/',
      failureRedirect: loginUri,
      failureMessage: 'Incorrect email or password',
    },
  ),
];

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient((client, callback) => {
  callback(null, client.id);
});

server.deserializeClient(async (id, callback) => {
  callback(null, await clientModel.findOne({ id }).lean());
});
