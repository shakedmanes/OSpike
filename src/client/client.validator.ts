// client.validator

import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './client.interface';

// Client reference validator
export const clientRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];
