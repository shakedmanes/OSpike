// client.validator

import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName, IClient } from './client.interface';

// Client reference validator
export const clientRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
  `Reference Error - ${collectionName} {VALUE} does not exist`,
];

// HostUri regex validator
export const hostUriRegexValidator: [(value: string) => boolean, string] = [
  (value: string): boolean => {
    // Regex for host uri containing https and maybe port
    // tslint:disable-next-line:max-line-length
    const hostUriRegex = /^(https:\/\/([A-Za-z0-9\._\-]+)([A-Za-z0-9]+))(:[1-9][0-9]{0,3}|:[1-5][0-9]{4}|:6[0-4][0-9]{3}|:65[0-4][0-9]{2}|:655[0-2][0-9]|:6553[0-5])?$/;

    return hostUriRegex.test(value);
  },
  `Invalid hostUri value given {VALUE}`,
];

// RedirectUris validator
export const redirectUrisValidator: [(this: IClient, value: string[]) => boolean, string] = [
  function (this: IClient, value: string[]) {

    // Include the route regex inside the host uri entered for validating correct redirect uris
    const redirectUriRegex = new RegExp('((\/([A-Za-z0-9]+[\-_]*)+)+)');
    const regexContainingHost = new RegExp(`^${this.hostUri}${redirectUriRegex.source}$`);

    let index = 0;
    let valid = value.length > 0 ? true : false;

    // Iterate each redirect uri and check if it contains the host and valid
    while (valid && index < value.length) {
      valid = regexContainingHost.test(value[index]);
      index += 1;
    }

    return valid;
  },
  `Invalid redirectUris - {VALUE}, doesn't fit hostUri value`,
];
