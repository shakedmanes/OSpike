import nanoid from 'nanoid';
import config from '../config';

export const authCodeValueGenerator = () => {
  return nanoid(config.AUTH_CODE_LENGTH);
};

export const accessTokenValueGenerator = () => {
  return nanoid(config.ACCESS_TOKEN_LENGTH);
};

export const refreshTokenValueGenerator = () => {
  return nanoid(config.REFRESH_TOKEN_LENGTH);
};

export const clientIdValueGenerator = () => {
  return nanoid(config.CLIENT_ID_LENGTH);
};

export const clientSecretValueGenerator = () => {
  return nanoid(config.CLIENT_SECRET_LENGTH);
};

export const registrationTokenValueGenerator = () => {
  return nanoid(config.REGISTRATION_TOKEN_LENGTH);
};
