// client.validator

import { refValidator } from '../generic/generic.validator';
import { collectionName, IClient } from './client.interface';
import { propertyOf } from '../utils/objectUtils';

// Client reference validator
export const clientRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// Client reference validator by audience id

export const clientRefValidatorByAudId = [
  refValidator.bind({}, collectionName, propertyOf<IClient>('audienceId')),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// HostUris regex validator
export const hostUrisRegexValidator: [(value: string[]) => boolean, string] = [
  (value: string[]): boolean => {
    // Regex for host uri containing https and maybe port
    // tslint:disable-next-line:max-line-length
    const hostUriRegex = /^(https:\/\/([A-Za-z0-9\._\-]+)([A-Za-z0-9]+))(:[1-9][0-9]{0,3}|:[1-5][0-9]{4}|:6[0-4][0-9]{3}|:65[0-4][0-9]{2}|:655[0-2][0-9]|:6553[0-5])?$/;
    let index = 0;
    let valid = value.length > 0;

    while (valid && index < value.length) {
      valid = hostUriRegex.test(value[index]);
      index += 1;
    }

    return valid;
  },
  `Invalid hostUri value given {VALUE}`,
];

// RedirectUris validator
export const redirectUrisValidator: [(this: IClient, value: string[]) => boolean, string] = [
  function (this: IClient, value: string[]) {

    // Regex for redirectUris suffix
    const redirectUriRegex = new RegExp('^((\/([A-Za-z0-9]+[\-_]*)+)+)$');
    let index = 0;
    let valid = value.length > 0;

    while (valid && index < value.length) {
      valid = redirectUriRegex.test(value[index]);
      index += 1;
    }

    // Checking if all the redirectUris are valid and there's no duplicate redirectUris
    return (valid && new Set(value).size === value.length);
  },
  `Invalid redirectUris - {VALUE}, doesn't fit hostUris value`,
];
