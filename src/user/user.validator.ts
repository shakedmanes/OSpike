// user.validator

import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './user.interface';

// User reference validator
export const userRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];
