const config = {
  // Expiration Times
  AUTH_CODE_EXPIRATION_TIME: 3600, // 1 Minute
  ACCESS_TOKEN_EXPIRATION_TIME: 7200, // 2 Minutes
  REFRESH_TOKEN_EXPIRATION_TIME: 7200, // 2 Minutes

  // Lengths
  AUTH_CODE_LENGTH: 50,
  ACCESS_TOKEN_LENGTH: 100,
  REFRESH_TOKEN_LENGTH: 50,
  CLIENT_ID_LENGTH: 40,
  CLIENT_SECRET_LENGTH: 100,
  REGISTRATION_TOKEN_LENGTH: 40,

  // Client Manager
  CLIENT_MANAGER_SCOPE: 'client_manager_special_scope',
  CLIENT_MANAGER_AUTHORIZATION_HEADER: 'Authorization-Registrer',

  // Bcrypt
  BCRYPT_ROUNDS: 8,

  // Session
  SESSION_SECRET: 'bla_bla_secret_session_dont_tell_anyone',

  // MongoDB Url
  mongoUrl: 'mongodb://admin:Aa123456@ds125352.mlab.com:25352/authorization_server',
};

export default config;
