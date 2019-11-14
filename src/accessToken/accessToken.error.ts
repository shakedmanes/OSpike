// accessToken.error

import { BadRequest } from '../utils/error';

export class AccessTokenLimitExceeded extends BadRequest {
  constructor(message?: string) {
    super(
      message ||
      'Access Token Limit Exceeded - You have reached the limit of generated tokens per client',
    );
  }
}
