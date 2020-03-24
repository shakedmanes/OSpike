// oauth2.controller

import * as oauth2orize from 'oauth2orize';
import passport from 'passport';
import { Response, Request, NextFunction } from 'express';
import {
  authCodeValueGenerator,
  refreshTokenValueGenerator,
} from '../utils/valueGenerator';
import { OAuth2Utils } from './oauth2.utils';
import { ensureAuthenticatedMiddleware } from '../auth/auth.utils';
import authCodeModel from '../authCode/authCode.model';
import accessTokenModel from '../accessToken/accessToken.model';
import { IAccessToken } from '../accessToken/accessToken.interface';
import refreshTokenModel from '../refreshToken/refreshToken.model';
import clientModel from '../client/client.model';
import { IClient } from '../client/client.interface';
import { IScope } from '../scope/scope.interface';
import config from '../config';
import { BadRequest } from '../utils/error';
import { InsufficientScopes } from './oauth2.error';
import { LOG_LEVEL, log, parseLogData } from '../utils/logger';
import { ScopeUtils } from '../scope/scope.utils';
import { Wrapper } from '../utils/wrapper';

// Error messages
export const errorMessages = {
  MISSING_AUDIENCE: 'The audience parameter is missing.',
  MISSING_SCOPE_IN_CLIENT: `Client doesn't support client_credentials due incomplete scopes value.`,
  MISSING_SCOPE: 'The scope parameter is missing.',
  INSUFFICIENT_SCOPE_FOR_CLIENT: `The client doesn't have permission for the requested scopes.`,
};

// TODO: create specified config files with grants types
// TODO: create generated session key for each of the requests
const server = oauth2orize.createServer();

// Binds the route for login in ensure logged in middleware
const loginUri = '/oauth2/login';
// const ensureLoggedInMiddleware =
// (req: Request, res: Response, next: NextFunction) => {
//   if (!req.user) {
//     const relayState = Buffer.from(req.url).toString('base64');
//     res.redirect(`/auth/shraga/?RelayState=${relayState}`);
//   } else {
//     next();
//   }
// };

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

    try {
      const authCode = await new authCodeModel({
        redirectUri,
        value: authCodeValueGenerator(),
        clientId: client._id,
        userId: user.id,
        userProperties: user,
        scopes: ares.scope.map((scope: IScope) => scope._id),
        audience: ares.audience,
      }).save();

      log(
        LOG_LEVEL.INFO,
        parseLogData(
          'OAuth2 Flows',
          `Flow: Authorization Code ${'\r\n'
          }Results: Generated authorization code for the following properties.${'\r\n'
          }clientId: ${client.id}, userId: ${user.id}, audience: ${ares.audience
          }, scopes: ${ares.scope.map((scope: IScope) => scope._id)}, value: ${authCode.value}`,
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
      value: OAuth2Utils.createJWTAccessToken(
        {
          aud: ares.audience,
          sub: user.id,
          scope: ScopeUtils.transformScopeModelsToRawScopes(ares.scope),
          clientId: client.id,
        },
        user,
      ),
      clientId: client._id,
      userId: user.id,
      audience: ares.audience,
      scopes: ares.scope.map((scope: IScope) => scope._id),
      grantType: 'token',
    }).save();

    log(
      LOG_LEVEL.INFO,
      parseLogData(
        'OAuth2 Flows',
        `Flow: Implicit \r\nResults: Generated token for the following properties.${'\r\n'
        }JWT Contents: ${JSON.stringify(OAuth2Utils.stripJWTAccessToken(accessToken.value))}`,
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

    // Gets the auth code full information
    let authCode = await authCodeModel.findOne({ value: code }).populate('clientId scopes');

    // Checks if the auth code exists and belongs to requested client.
    // Also, the redirect uri specified for exchange must by identical to the previous
    // redirect uri used for creating the auth code, as required in
    // https://tools.ietf.org/html/rfc6749#section-4.1.3
    if (authCode &&
        client.id === (<IClient>authCode.clientId).id &&
        redirectUri === authCode.redirectUri) {

      try {
        authCode = await authCode.remove();

        // Generate fresh access token
        const accessToken = await new accessTokenModel({
          value: OAuth2Utils.createJWTAccessToken(
            {
              aud: authCode.audience,
              sub: authCode.userId as string,
              scope: ScopeUtils.transformScopeModelsToRawScopes(<IScope[]>authCode.scopes),
              clientId: client.id,
            },
            authCode.userProperties,
          ),
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
          userProperties: authCode.userProperties,
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

// Currently this flow cannot work, until we figure out how to support it properly
//
// /**
//  * Grant Resource Owner Password Credentials
//  *
//  * Exchange user id and password for access tokens.
//  *
//  * The callback accepts the `client`, which is exchanging the user's name and password
//  * from the token request for verification. If these values are validated, the
//  * application issues an access token on behalf of the user who authorized the code.
//  */
// server.exchange(oauth2orize.exchange.password(
//   {},
//   async (client, username, password, scope, body, done) => {

//     // Check if audience specified
//     if (!body.audience) {
//       return done(new BadRequest(errorMessages.MISSING_AUDIENCE));
//     }

// tslint:disable-next-line:max-line-length
//     // In the user model schema we authenticate via email & password so username should be the email
//     const user = await userModel.findOne({ email: username }).lean();

//     if (user && validatePasswordHash(password, user.password)) {

//       try {
//         const accessToken = await new accessTokenModel({
//           value: OAuth2Utils.createJWTAccessToken({
//             scope,
//             aud: body.audience,
//             sub: user.id,
//             clientId: client.id,
//           }),
//           clientId: client._id,
//           userId: user.id,
//           audience: body.audience,
//           scopes: await ScopeUtils.transformRawScopesToModels(scope, body.audience),
//           grantType: 'password',
//         }).save();

//         const refreshToken = await new refreshTokenModel({
//           value: refreshTokenValueGenerator(),
//           accessTokenId: accessToken._id,
//         }).save();

//         const additionalParams = {
//           expires_in: config.ACCESS_TOKEN_EXPIRATION_TIME,
//         };

//         log(
//           LOG_LEVEL.INFO,
//           parseLogData(
//             'OAuth2 Flows',
//             `Flow: Resource Owner Password Credentials ${'\r\n'
//              }Results: Generated token for the following properties.${'\r\n'
// tslint:disable-next-line:max-line-length
//              }JWT Contents: ${JSON.stringify(OAuth2Utils.stripJWTAccessToken(accessToken.value))}`,
//             200,
//             null,
//           ),
//         );

//         return done(null, accessToken.value, refreshToken.value, additionalParams);
//       } catch (err) {
//         return done(err);
//       }
//     }

//     log(
//       LOG_LEVEL.INFO,
//       parseLogData(
//         'OAuth2 Flows',
//         `Flow: Resource Owner Password Credentials ${'\r\n'
//          }Results: Invalid user name or password given.${'\r\n'
//          }username: ${username}\r\n password: ${password}`,
//         400,
//         null,
//       ),
//     );

//     return done(null, false);
//   },
// ));

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

      // Getting all permitted scopes for client by audienceId
      const permittedScopesForClient =
        await ScopeUtils.getAllScopesForClientAndAudience(client, body.audience);

      // Change scopes values when working on scopes feature
      const accessToken = await new accessTokenModel({
        value: OAuth2Utils.createJWTAccessToken({
          aud: body.audience,
          sub: client.id,
          // scope: client.scopes, // Change this to body.scope
          scope: ScopeUtils.transformScopeModelsToRawScopes(permittedScopesForClient),
          clientId: client.id,
        }),
        clientId: client._id,
        audience: body.audience,
        grantType: 'client_credentials',
        // scopes: client.scopes, // Change this to body.scope
        scopes: permittedScopesForClient,
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
    populate: { path: 'clientId scopes' },
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
        value: OAuth2Utils.createJWTAccessToken(
          {
            aud: (<IAccessToken>refreshTokenDoc.accessTokenId).audience,
            sub: (<IAccessToken>refreshTokenDoc.accessTokenId).userId as string,
            scope: ScopeUtils.transformScopeModelsToRawScopes(
              <IScope[]>(<IAccessToken>refreshTokenDoc.accessTokenId).scopes,
            ),
            clientId: (<IClient>(<IAccessToken>refreshTokenDoc.accessTokenId).clientId).id,
          },
          refreshTokenDoc.userProperties,
        ),
        clientId: (<IClient>(<IAccessToken>refreshTokenDoc.accessTokenId).clientId)._id,
        userId: (<IAccessToken>refreshTokenDoc.accessTokenId).userId,
        audience: (<IAccessToken>refreshTokenDoc.accessTokenId).audience,
        scopes: (<IAccessToken>refreshTokenDoc.accessTokenId).scopes,
        grantType: (<IAccessToken>refreshTokenDoc.accessTokenId).grantType,
      }).save();

      const newRefreshToken = await new refreshTokenModel({
        value: refreshTokenValueGenerator(),
        accessTokenId: accessToken._id,
        userProperties: refreshTokenDoc.userProperties,
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
  ensureAuthenticatedMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    // Checking if all the request parameters is given

    // Check for missing audience parameter
    if (!req.query.audience) {
      throw new BadRequest(errorMessages.MISSING_AUDIENCE);
    }

    // Check for missing scope parameter and correct form
    if (!req.query.scope) {
      throw new BadRequest(errorMessages.MISSING_SCOPE);
    }

    // Setting locals in the request object, allows to keep the audience parameter in the
    // Requests chain (without it, we can't access the audience parameter before asking
    // the client for approvement)
    if (typeof((<any>(req)).locals) === 'object' && (<any>req).locals !== null) {
      (<any>(req)).locals.audience = req.query.audience;
    } else {
      (<any>(req)).locals = { audience: req.query.audience };
    }

    next();
  },
  server.authorization(
    // TODO: add typing for new validate function
    async (areq: any , done: any) => {
      const client = await clientModel.findOne({ id: areq.clientID });

      // Checking if the client exists and gave the correct redirect uri
      if (client && client.isValidRedirectUri(areq.redirectURI)) {
        /**
         * Note For Future Releases:
         * We need to validate the scopes requested - check if the client has the scopes
         * that he trying to acheive with the checkSufficientScopes function
         * found in scopeUtils file
         */

        // Checking if the client has access to the scopes he requested

        return done(null, client, areq.redirectURI);
      }
      // Client specified not found or invalid redirect uri specified.
      // Generates error - AuthorizationError('Unauthorized client', 'unauthorized_client')
      return done(null, false);
    },
    // Check if grant request in correct form and qualifies for immediate approval
    async (oauth2, done) => {

      // // Checking if token already genereated for the user and the client
      // const accessToken =
      // await accessTokenModel.findOne({
      //   clientId: oauth2.client._id,
      //   userId: oauth2.user.id,
      //   audienceId: oauth2.locals.audience,
      // }).lean();

      // User already have token in the client with requested scopes
      // TODO: Consider if the client requests for other scope, ask the user if he wants
      //       To drop the access token that the client have and create a new one with
      //       The requested scopes.
      // if (accessToken && isScopeEquals(accessToken.scopes, oauth2.scope)) {
      //   return (
      //     done(null, true, { audience: oauth2.locals.audience, scope: oauth2.req.scope }, null)
      //   );
      // }

      // TODO: Maybe consider refactor the scopes validation in one function for both client
      //       and user, also in one big mongodb query (which will eventually more efficient)

      // Otherwise, the client requested new/different scopes (or maybe new token) behalf
      // the user, so we need to check if the client have permission for the scopes he requested
      if (await ScopeUtils.checkSufficientScopes(
            oauth2.client._id, oauth2.locals.audience, oauth2.req.scope,
          )) {

        // Get the scopes models from the db to pass on request
        const requestedScopes =
         await ScopeUtils.transformRawScopesToModels(oauth2.req.scope, oauth2.locals.audience);

        // The client have the requested scopes, need to check if the user already approve them once
        // Or we need to show him the consent (forward him to user decision route for approving
        // the scopes requested by the client)
        if (await ScopeUtils.checkUserApprovement(
              oauth2.user.id, oauth2.client._id, oauth2.locals.audience, oauth2.req.scope,
            )) {
          return (
            done(null, true, { audience: oauth2.locals.audience, scope: requestedScopes }, null)
          );
        }

        // Let the user decide
        return (
          done(null, false, { audience: oauth2.locals.audience, scope: requestedScopes }, null)
        );
      }

      // The client does not have permission to the requested scopes
      throw new InsufficientScopes(errorMessages.INSUFFICIENT_SCOPE_FOR_CLIENT);
    },

  ),
  // Here should be the approvement consents for after the user autnenticated.
  // tslint:disable-next-line:max-line-length
  // like in https://github.com/scottksmith95/beerlocker/blob/master/beerlocker-6.1/controllers/oauth2.js#L126

  // TODO: Implement request handler for the user stage of allow authorization to requested scopes
  (req: any, res: Response, next: NextFunction) => {

    // Render decision page for user
    res.render('decision', {
      transactionID: req.oauth2.transactionID,
      user: req.user,
      client: req.oauth2.client,
      audience: req.oauth2.info.audience,
      scopes: req.oauth2.info.scope,
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
  ensureAuthenticatedMiddleware,
  server.decision(async (req, done) => {

    // Checks if the decision ends up with approvement.
    // if so, we need to save that for future requests (remember the user choice)
    if ((<any>req).body && !(<any>req).body.cancel && req.oauth2) {
      await ScopeUtils.saveUserApprovement(
        req.user.id,
        req.oauth2.client._id,
        (<IScope[]><unknown>req.oauth2.info.scope).map((scope: IScope) => scope._id),
      );
    }

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
  function (req: Request, res: Response, next: NextFunction) {
    const passportCallback = Wrapper.wrapPassportCallback(req, res, next);
    return (
      passport.authenticate(
        ['basic', 'oauth2-client-password'],
        { session: false },
        passportCallback,
      )(req, res, next)
    );
  },
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
  function (req: Request, res: Response, next: NextFunction) {
    const passportCallback = Wrapper.wrapPassportCallback(req, res, next);
    return (
      passport.authenticate(
        ['basic', 'oauth2-client-password'],
        { session: false },
        passportCallback,
      )(req, res, next)
    );
  },
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
                              .populate('clientId audienceClient scopes').lean();

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
          ...(accessToken.userId ? { userId: accessToken.userId } : null),
          ...jwtPayload,
          ...({
            scope: (<IScope[]>accessToken.scopes).map(
              (scope) => { return { value: scope.value, description: scope.description }; },
            ),
          }),
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

// Currently the authentication endpoints are not in use,
// because of usage of 3rd party authentication.
//
// // Authentication endpoints (login endpoints)
// export const loginForm = (req: Request, res: Response) => {

//   // Checks if there's any errors from previous authentication
//   // cause if the login failed this is the redirect uri.
//   let errorMessage = null;
//   if (req.session) {
//     // User trying reach this route not via authorize route
//     if (!req.session.returnTo ||
//         (req.session.returnTo && !req.session.returnTo.startsWith('/oauth2/authorize?'))) {
//       throw new BadRequest('Authentication without OAuth2 flow is not permitted!');
//     }
//     errorMessage = req.session.messages ? req.session.messages[0] : null;
//   }

//   res.render('login', { errorMessage });
// };

// export const loginMethod = [
//   passport.authenticate(
//     'local',
//     {
//       successReturnToOrRedirect: '/',
//       failureRedirect: loginUri,
//       failureMessage: 'Incorrect email or password',
//     },
//   ),
// ];

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
