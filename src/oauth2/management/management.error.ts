// management.error

import { NotFound, BadRequest } from '../../utils/error';

export class ClientNotFound extends NotFound {
  constructor(message?: string) {
    super(message || 'Client not found');
  }
}

export class BadClientInformation extends BadRequest {
  constructor(message?: string) {
    super(message || 'Invalid client information given');
  }
}
