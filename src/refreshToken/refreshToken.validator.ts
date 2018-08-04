import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './refreshToken.model';

// Refresh Token reference validator
export const refreshTokenRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// Refresh Token unique value validator
export const refreshTokenUniqueValueValidator = [
  uniqueValidator.bind({}, collectionName, 'value'),
  'Unique Error - Value {VALUE} already exists',
];
