// oauth2.utils

import config from '../config';
import { default as jwt } from 'jsonwebtoken';
import fs from 'fs';
import { join as pathJoin } from 'path';

/**
 * NOTE: There are big differences between the 'aud' and 'sub' claims.
 * To demonstrate that, we need to look at 2 authorization grants:
 * Client Credentials and Authorization Code.
 *
 * Authorization Code - An example JWT payload will look like:
 * {
 *  iss: 'https://authorization_server.com',
 *  aud: 'https://client.host.url', // Client host uri
 *  sub: '1321okewq4m21omsa', // User id
 *  iat: '2141405920151',
 *  exp: '2141405980151'
 * }
 *
 * Client Credentials - An example JWT payload will look like:
 * {
 *  iss: 'https://authorization_server.com',
 *  aud: 'https://resource_server.host.url', // Resource Server uri
 *  sub: '$wqe21lmleqw882K_klemwlqm2211', // Client id
 *  iat: '2141405920151',
 *  exp: '2141405980151',
 * }
 *
 * As we see when there is 'server to server' authorization the audience will be the resource server
 * because the token is intended for it, and the client will be the subject, because the token
 * generated for him.
 *
 */
export interface JWTPayload {
  iss: string; // Issuer of the jwt (who issued that JWT [authorization server])
  aud: string; // Audience of the jwt (receipent that the JWT intended for)
  sub: string; // The subject of the jwt (the user/client the JWT generated for)
  iat: number; // Issued at time of the token in milliseconds
  exp: number; // Expiration time of the token in milliseconds
}

export class OAuth2Utils {

  private static readonly privatKey = fs.readFileSync(pathJoin(__dirname, config.privateKeyPath));

  static createJWTAccessToken(payload: JWTPayload) {
    return jwt.sign(payload, OAuth2Utils.privatKey);
  }
}
