import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './teamUser.model';

// TeamUser reference validator
export const teamUserRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// TeamUser unique name validator
export const teamUserUniqueNameValidator = [
  uniqueValidator.bind({}, collectionName, 'name'),
  'Unique Error - Name {VALUE} already exists',
];
