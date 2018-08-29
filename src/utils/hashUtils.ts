// hashUtils

import { hashSync, compareSync } from 'bcrypt';
import config from '../config';

export const generatePasswordHash = (password: string) => {
  return hashSync(password, config.BCRYPT_ROUNDS);
};

export const validatePasswordHash = (password: string, passwordHash: string) => {
  return compareSync(password, passwordHash);
};
