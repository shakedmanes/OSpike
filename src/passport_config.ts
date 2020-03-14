// passport_config

import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Strategy as ClientPasswordStrategy } from 'passport-oauth2-client-password';
const shragaStrategy = require('passport-shraga').Strategy;
import { BasicStrategy } from 'passport-http';
import { Request } from 'express';
import { ClientManagementAuthenticationStrategy } from './oauth2/management/management.auth';
import clientModel from './client/client.model';
import accessTokenModel from './accessToken/accessToken.model';
import config from './config';
import { ipInHostnames } from './utils/hostnameUtils';

/**
 * Shraga authentication strategy
 *
 * Used to authenticate end-users to ADFS server by using
 * shraga proxy instead implement ADFS authentication flow
 */
passport.use(new shragaStrategy(
  {
    callbackURL: `${config.AUTH_ENDPOINT}${config.AUTH_SHRAGA_CALLBACK_ENDPOINT}`,
    shragaURL: process.env.SHRAGA_URL,
  },
  (profile: any, done: any) => {
    done(null, profile);
  },
));

/**
 * Verify function used for BasicStrategy & ClientPasswordStrategy
 * @param clientId - client id received from the strategy
 * @param clientSecret - client secret received from the strategy
 * @param callback - callback to return to the strategy
 */
const verifyFunction =
async (req: Request,
       clientId: string,
       clientSecret: string,
       callback: (error: any, client?: any) => void) => {

  const client = await clientModel.findOne({ id: clientId });
  const ip = (req.headers['x-forwarded-for'] || '') as string;

  if (client &&
      clientSecret === client.secret &&
      (process.env.HOST_VALIDATION === '1' ?
       await ipInHostnames(client.hostUris, ip) : true)) {
    return callback(null, client);
  }

  return callback(null, false);
};

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(new BasicStrategy({ passReqToCallback: true }, verifyFunction));

/**
 * Client Password strategy
 *
 * The OAuth 2.0 client password authentication strategy authenticates clients
 * using a client ID and client secret. The strategy requires a verify callback,
 * which accepts those credentials and calls done providing a client.
 */
passport.use(new ClientPasswordStrategy({ passReqToCallback: true }, verifyFunction));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 *
 * MEANWHILE: restricted scopes are not implemented, need to implement this
 */
passport.use(new BearerStrategy(async (token, callback) => {
  const accessToken = await accessTokenModel.findOne({ value: token });

  if (accessToken) {
    return callback(
      null,
      accessToken,
      { message: 'Authenticated Successfully', scope: accessToken.scopes.join(' ') },
    );
  }
  return callback(null, false);
}));

/**
 * Internal Client Management Authentication Strategys.
 *
 * Used for authenticate client manager(s).
 * The second strategy also validate registration token
 * when accessing restricted client management route.
 */
passport.use(new ClientManagementAuthenticationStrategy());
passport.use(
  config.CLIENT_MANAGER_PASSPORT_MANAGEMENT_STRATEGY,
  new ClientManagementAuthenticationStrategy({ includeRegistrationToken: true }),
);

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTPS request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// user object is serialized into the session.  Typically this will be a
// simple matter of serializing the user's ID, and deserializing by finding
// the user by ID from the database.

// TODO: Create type for user object
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
