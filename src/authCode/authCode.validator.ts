// authCode.validator

import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './authCode.interface';

// Auth Code reference validator
export const authCodeRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];
