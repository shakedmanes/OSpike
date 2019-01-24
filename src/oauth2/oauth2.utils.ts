// oauth2.utils

import config from '../config';
import { default as jwt } from 'jsonwebtoken';
import fs from 'fs';

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
export interface JWTPayload extends JWTPayloadData {
  iss: string; // Issuer of the JWT (who issued that JWT [authorization server])
  iat: number; // Issued at time of the token in milliseconds
  exp: number; // Expiration time of the token in milliseconds
}

export interface JWTPayloadData {
  aud: string; // Audience of the JWT (receipent that the JWT intended for)
  sub: string; // The subject of the JWT (the user/client the JWT generated for)
  scope: string[]; // The scopes for the JWT

}

export class OAuth2Utils {

  private static readonly privateKey = fs.readFileSync(config.privateKeyPath);
  private static readonly publicKey = fs.readFileSync(config.publicKeyPath);

  static createJWTAccessToken(payload: JWTPayloadData) {
    return jwt.sign(
      { ...payload },
      OAuth2Utils.privateKey,
      {
        issuer: config.issuerHostUri,
        expiresIn: config.ACCESS_TOKEN_EXPIRATION_TIME,
        algorithm: config.jwtAlgorithm,
      },
    );
  }

  static stripJWTAccessToken(accessToken: string) {
    return jwt.verify(accessToken, OAuth2Utils.publicKey);
  }
}
