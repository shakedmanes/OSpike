import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './accessToken.interface';

// Access Token reference validator
export const accessTokenRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// Access Token unique value validator
export const accessTokenUniqueValueValidator = [
  uniqueValidator.bind({}, collectionName, 'value'),
  'Unique Error - Value {VALUE} already exists',
];
