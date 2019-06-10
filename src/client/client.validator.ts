// client.validator

import { refValidator, uniqueValidator } from '../generic/generic.validator';
import { collectionName, IClient } from './client.interface';
import { URL } from 'url';

// Client reference validator
export const clientRefValidator = [
  refValidator.bind({}, collectionName, '_id'),
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

    // Include the route regex inside the host uri entered for validating correct redirect uris
    const redirectUriRegex = new RegExp('((\/([A-Za-z0-9]+[\-_]*)+)+)');

    // Object containing regex for each host uri redirect uris
    const regexesContainingHost: { [host: string]: RegExp } = {};

    // Minimum number of redirect uri required due the number of distinct hosts
    const minimumRedirectUris = this.hostUris.length;

    // Set containing the regexes checked in the redirect uris received
    const distinctRegexesChecked = new Set();

    // First checking if there's more host uris than redirect uris
    // (means there's missing redirect uri)
    if (minimumRedirectUris > value.length) {
      return false;
    }

    // Creating regex for each hostUri redirect uris
    for (let hostIndex = 0; hostIndex < this.hostUris.length; hostIndex += 1) {
      regexesContainingHost[this.hostUris[hostIndex]] =
        new RegExp(`^${this.hostUris[hostIndex]}${redirectUriRegex.source}$`);
    }

    let index = 0;
    let valid = value.length > 0 ? true : false;

    // Iterate each redirect uri and check if it contains the host and valid
    while (valid && index < value.length) {

      let hostInRedirectUri;

      // Extracting the host uri from the redirect uri
      try {
        hostInRedirectUri = new URL(value[index]).origin;
      } catch (err) {
        return false;
      }

      // Checking if the redirect uri have one of the host uris and appropriate format
      if (regexesContainingHost[hostInRedirectUri] &&
          regexesContainingHost[hostInRedirectUri].test(value[index])) {
        distinctRegexesChecked.add(regexesContainingHost[hostInRedirectUri]);
      } else {
        valid = false;
      }

      index += 1;
    }

    // Checing if the redirectUris are valid and there's enough redirectUris for all the hostnames
    return (valid && distinctRegexesChecked.size === minimumRedirectUris);
  },
  `Invalid redirectUris - {VALUE}, doesn't fit hostUris value`,
];
