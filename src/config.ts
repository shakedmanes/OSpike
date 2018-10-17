// config

import { join } from 'path';

const config = {
  // Expiration Times - format in seconds for mongoose TTL expiration field
  AUTH_CODE_EXPIRATION_TIME: 120, // 2 Minutes
  ACCESS_TOKEN_EXPIRATION_TIME: 180, // 3 Minutes
  REFRESH_TOKEN_EXPIRATION_TIME: 180, // 3 Minutes

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

  // Bcrypt
  BCRYPT_ROUNDS: 8,

  // Session
  SESSION_SECRET: 'bla_bla_secret_session_dont_tell_anyone',

  // MongoDB Url
  mongoUrl: 'mongodb://admin:Aa123456@ds125352.mlab.com:25352/authorization_server',

  // SSL Configuration
  privateKeyPath: join(__dirname, 'certs/privatekey.pem'),
  publicKeyPath: join(__dirname, 'certs/publickey.pem'),
  certificatePath: join(__dirname, 'certs/certificate.pem'),

  // JWT Configuration
  issuerHostUri: 'https://localhost:1337',
};

export default config;
