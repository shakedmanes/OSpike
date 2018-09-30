// accessToken.validator

import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './accessToken.interface';

// Access Token reference validator
export const accessTokenRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];
