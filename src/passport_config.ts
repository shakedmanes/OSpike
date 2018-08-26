import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Strategy as ClientPasswordStrategy } from 'passport-oauth2-client-password';
import { BasicStrategy } from 'passport-http';

import userModel, { IUser } from './user/user.model';
import clientModel from './client/client.model';
import accessTokenModel from './accessToken/accessToken.model';
import { validatePasswordHash } from './utils/hashUtils';

/**
 * Local Strategy
 *
 * Used for authenticate end-users by email and password credentials.
 */
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email, password, callback) => {
    const user = await userModel.findOne({ email });

    if (user && validatePasswordHash(password, user.password)) {
      return callback(null, user, { message: 'Logged In Successfully' });
    }
    return callback(null, false, { message: 'Incorrect email or password.' });
  },
));

/**
 * Verify function used for BasicStrategy & ClientPasswordStrategy
 * @param clientId - client id received from the strategy
 * @param clientSecret - client secret received from the strategy
 * @param callback - callback to return to the strategy
 */
const verifyFunction =
async (clientId: string, clientSecret: string, callback: (error: any, client?: any) => void) => {
  const client = await clientModel.findOne({ clientId });

  if (client && clientSecret === client.secret) {
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
passport.use(new BasicStrategy(verifyFunction));

/**
 * Client Password strategy
 *
 * The OAuth 2.0 client password authentication strategy authenticates clients
 * using a client ID and client secret. The strategy requires a verify callback,
 * which accepts those credentials and calls done providing a client.
 */
passport.use(new ClientPasswordStrategy(verifyFunction));

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

passport.serializeUser((user: IUser, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  done(null, await userModel.findOne({ _id: id }) || undefined);
});
