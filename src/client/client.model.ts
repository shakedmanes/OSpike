// client.model

import { Schema, model } from 'mongoose';
import { URL } from 'url';
import { IClient, collectionName } from './client.interface';
import { hostUrisRegexValidator, redirectUrisValidator } from './client.validator';
import { InvalidRedirectUri, InvalidHostUri } from './client.error';

const clientSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  id: {
    type: String,
    unique: true,
    required: true,
  },
  secret: {
    type: String,
    unique: true,
    required: true,
  },
  audienceId: {
    type: String,
    unique: true,
    required: true,
  },
  redirectUris: {
    type: [String],
    unique: true,
    required: true,
    validate: redirectUrisValidator,
  },
  hostUris: {
    type: [String],
    unique: true,
    required: true,
    validate: hostUrisRegexValidator,
  },
  scopes: {
    type: [String],
    default: [],
  },
  registrationToken: {
    type: String,
    unique: true,
    required: true,
  },
});

clientSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
};

// Lowercase all the hostUris and redirectUris before validators and saving
clientSchema.pre<IClient>('validate', function validate(this: IClient, next: any) {

  let errorCatched = null;
  let validFormat = true;
  let index = 0;

  while (validFormat && index < this.hostUris.length) {

    try {
      const hostUrisAsURL = new URL(this.hostUris[index]);

      // Checking if the hostUri given is really hostUri and not full url
      if (hostUrisAsURL.origin === hostUrisAsURL.href.substring(0, hostUrisAsURL.href.length - 1)) {
        this.hostUris[index] = hostUrisAsURL.origin;
      } else {
        errorCatched = new InvalidHostUri(`Invalid host uri given - ${this.hostUris[index]}${
                                          ''}, should be https://hostname and not full url`);
        validFormat = false;
      }
    } catch (err) {
      errorCatched = new InvalidHostUri(`Invalid host uri given - ${this.hostUris[index]}`);
      validFormat = false;
    }

    index += 1;
  }

  // Used for catching the invalid index when error occurred
  index = 0;

  while (validFormat && index < this.redirectUris.length) {

    try {
      this.redirectUris[index] = new URL(this.redirectUris[index]).toString();
    } catch (err) {
      errorCatched =
        new InvalidRedirectUri(`Invalid redirect uri given - ${this.redirectUris[index]}`);
      validFormat = false;
    }

    index += 1;
  }

  next(errorCatched);
});

const clientModel = model<IClient>(collectionName, clientSchema);

export default clientModel;
