import { model as getModel } from 'mongoose';
import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './code.model';

// Code reference validator
export const codeRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// Code unique value validator
export const codeUniqueValueValidator = [
  uniqueValidator.bind({}, collectionName, 'value'),
  'Unique Error - Value {VALUE} already exists',
];
