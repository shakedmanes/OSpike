// authCode.validator

import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './authCode.interface';

// Auth Code reference validator
export const authCodeRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// Auth Code unique value validator
export const authCodeUniqueValueValidator = [
  uniqueValidator.bind({}, collectionName, 'value'),
  'Unique Error - Value {VALUE} already exists',
];
