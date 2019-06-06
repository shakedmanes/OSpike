// client.error

import { InvalidParameter } from '../utils/error';

export class InvalidHostUri extends InvalidParameter {
  constructor(message?: string) {
    super(message || 'Invalid host uri');
  }
}

export class InvalidRedirectUri extends InvalidParameter {
  constructor(message?: string) {
    super(message || 'Invalid redirect uri');
  }
}
