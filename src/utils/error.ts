// error

export class BaseError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);

    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);

    this.status = status || 500;
  }
}

export class DuplicateUnique extends BaseError {
  constructor(message?: string) {
    super(message || 'Duplicate Unique Field', 400);
  }
}

export class NotFound extends BaseError {
  constructor(message?: string) {
    super(message || 'Not Found', 404);
  }
}

export class InvalidParameter extends BaseError {
  constructor(message?: string) {
    super(message || 'Invalid Parameter Provided', 400);
  }
}

export class BadRequest extends BaseError {
  constructor(message?: string) {
    super(message || 'Bad Request', 400);
  }
}

export class Unauthorized extends BaseError {
  constructor(message?: string) {
    super(message || 'Unauthorized', 401);
  }
}

export class InternalServerError extends BaseError {
  constructor(message?: string) {
    super(message || 'Internal Server Error', 500);
  }
}
