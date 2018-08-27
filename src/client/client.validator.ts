import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName } from './client.interface';

// Client reference validator
export const clientRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// Client unique name validator
export const clientUniqueNameValidator = [
  uniqueValidator.bind({}, collectionName, 'name'),
  'Unique Error - Name {VALUE} already exists',
];

// Client unique id validator
export const clientUniqueIdValidator = [
  uniqueValidator.bind({}, collectionName, 'id'),
  'Unique Error - ID {VALUE} already exists',
];

// Client unique secret validator
export const clientUniqueSecretValidator = [
  uniqueValidator.bind({}, collectionName, 'secret'),
  'Unique Error - Secret {VALUE} already exists',
];

// Client unique redirectUris validator
export const clientUniqueRedirectUrisValidator = [
  uniqueValidator.bind({}, collectionName, 'redirectUris'),
  'Unique Error - RedirectUris {VALUE} already exists',
];

// Client unique hostUri validator
export const clientUniqueHostUriValidator = [
  uniqueValidator.bind({}, collectionName, 'hostUri'),
  'Unique Error - HostUri {VALUE} already exists',
];
