// config

import { join } from 'path';

const devConfigProperties = {
  mongoUrl: 'mongodb://admin:Aa123456@ds125352.mlab.com:25352/authorization_server',
};

const testConfigProperties = {
  mongoUrl: 'mongodb://admin:Aa123456@ds259742.mlab.com:59742/authorization_server_test',
};

let config = {
  // Expiration Times - format in seconds for mongoose TTL expiration field
  AUTH_CODE_EXPIRATION_TIME: 120, // 2 Minutes
  ACCESS_TOKEN_EXPIRATION_TIME: 180, // 3 Minutes
  REFRESH_TOKEN_EXPIRATION_TIME: 180, // 3 Minutes
  QUICK_FIX_DELAY: 30, // Delay in delete access token execution

  // Lengths
  AUTH_CODE_LENGTH: 50,
  ACCESS_TOKEN_LENGTH: 100,
  REFRESH_TOKEN_LENGTH: 50,
  CLIENT_ID_LENGTH: 40,
  CLIENT_SECRET_LENGTH: 100,
  REGISTRATION_TOKEN_LENGTH: 40,

  // Client Manager
  CLIENT_MANAGER_SCOPE: 'client_manager_special_scope',
  CLIENT_MANAGER_AUTHORIZATION_HEADER: 'authorization-registrer',
  CLIENT_MANAGER_PASSPORT_STRATEGY: 'client_manager_strategy', // Only client manager authentication
  CLIENT_MANAGER_PASSPORT_MANAGEMENT_STRATEGY: 'client_manager_management_strategy',

  // Routes Configuration
  OAUTH_ENDPOINT: '/oauth2',
  WELLKNOWN_ENDPOINT: '/.well-known',

  // Bcrypt
  BCRYPT_ROUNDS: 8,

  // Session
  SESSION_SECRET: 'bla_bla_secret_session_dont_tell_anyone',

  // MongoDB Url
  mongoUrl: 'mongodb://admin:Aa123456@ds125352.mlab.com:25352/authorization_server',
  mongoUrlTest: 'mongodb://admin:Aa123456@ds259742.mlab.com:59742/authorization_server_test',

  // SSL Configuration
  privateKeyPath: join(__dirname, 'certs/files/privatekey.pem'),
  publicKeyPath: join(__dirname, 'certs/files/publickey.pem'),
  certificatePath: join(__dirname, 'certs/files/certificate.pem'),

  // JWT Configuration
  issuerHostUri: 'https://localhost:1337',
  jwtAlgorithm: 'RS256',
  jwksPath: join(__dirname, 'certs/files/jwks.json'),
};

console.log('Entered config');
console.log(process.env.NODE_ENV);

switch (process.env.NODE_ENV) {
  case 'dev':
    config = { ...config, ...devConfigProperties };
    break;
  case 'test':
    config = { ...config, ...testConfigProperties };
    break;

  default:
    config = { ...config, ...devConfigProperties };
}

export default config;
