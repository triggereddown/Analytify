/**
 * Base class for all intentional, expected HTTP errors thrown from services.
 * Distinguishes "we chose to reject this request" (4xx, expected) from
 * unhandled bugs (5xx, unexpected) so the centralized error middleware can
 * treat them differently (e.g. hide stack traces for the latter in prod).
 *
 * TEACHING NOTE — "extends Error":
 * `AppError` inherits everything a normal JS Error has (message, stack)
 * and adds a `statusCode` field. Because it's a `class`, TypeScript lets
 * every subclass (BadRequestError, NotFoundError, etc.) automatically
 * satisfy `instanceof AppError` checks — useful in error.middleware.ts.
 */
export class AppError extends Error {
  // TEACHING NOTE — "public readonly": this is a TS shorthand. Writing
  // `public readonly statusCode: number` as a constructor parameter both
  // declares the class field AND assigns it from the argument, in one line
  // — equivalent to declaring `statusCode: number;` above the constructor
  // and writing `this.statusCode = statusCode;` inside it.
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}
