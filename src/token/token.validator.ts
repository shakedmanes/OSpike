import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './token.model';

// Token reference validator
export const tokenRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// Token unique value validator
export const tokenUniqueValueValidator = [
  uniqueValidator.bind({}, collectionName, 'value'),
  'Unique Error - Value {VALUE} already exists',
];
