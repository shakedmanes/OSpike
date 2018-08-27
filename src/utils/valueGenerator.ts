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
