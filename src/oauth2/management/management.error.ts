// management.error

import { NotFound } from '../../utils/error';

export class ClientNotFound extends NotFound {
  constructor(message?: string) {
    super(message || 'Client not found');
  }
}
