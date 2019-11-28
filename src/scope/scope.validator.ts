// scope.validator

import { refValidator } from '../generic/generic.validator';
import { collectionName } from './scope.interface';

// scope reference validator
export const scopeRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];
