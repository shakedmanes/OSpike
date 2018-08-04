const config = {
  // Expiration Times
  AUTH_CODE_EXPIRATION_TIME: 3600, // 1 Minute
  ACCESS_TOKEN_EXPIRATION_TIME: 7200, // 2 Minutes
  REFRESH_TOKEN_EXPIRATION_TIME: 7200, // 2 Minutes

  // Lengths
  AUTH_CODE_LENGTH: 50,
  ACCESS_TOKEN_LENGTH: 100,
  REFRESH_TOKEN_LENGTH: 50,

  // Bcrypt
  BCRYPT_ROUNDS: 'u98wGn!@nNoF_)Y98t@yldKE38xW7#-#',

  // Session
  SESSION_SECRET: 'bla_bla_secret_session_dont_tell_anyone',
};

export default config;
