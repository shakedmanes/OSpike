import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './user.model';

// User reference validator
export const userRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// User unique email validator
export const userUniqueEmailValidator = [
  uniqueValidator.bind({}, collectionName, 'email'),
  'Unique Error - Email {VALUE} already exists',
];
