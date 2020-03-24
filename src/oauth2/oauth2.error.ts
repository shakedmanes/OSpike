// oauth2.error

import { Unauthorized } from '../utils/error';

export class InsufficientScopes extends Unauthorized {
  constructor(message?: string) {
    super(message || 'Insufficient Scopes Requested');
  }
}
