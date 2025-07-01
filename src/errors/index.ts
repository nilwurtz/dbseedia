export abstract class DbSeediaError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

export class FileParseError extends DbSeediaError {
  constructor(message: string, cause?: Error) {
    super(`File parsing failed: ${message}`, cause);
  }
}

export class DataTransformError extends DbSeediaError {
  constructor(message: string, cause?: Error) {
    super(`Data transformation failed: ${message}`, cause);
  }
}

export class DatabaseError extends DbSeediaError {
  constructor(message: string, cause?: Error) {
    super(`Database operation failed: ${message}`, cause);
  }
}

export class ConnectionError extends DbSeediaError {
  constructor(message: string, cause?: Error) {
    super(`Connection failed: ${message}`, cause);
  }
}

export class ValidationError extends DbSeediaError {
  constructor(message: string, cause?: Error) {
    super(`Validation failed: ${message}`, cause);
  }
}

export class FileNotFoundError extends DbSeediaError {
  constructor(message: string, cause?: Error) {
    super(`File not found: ${message}`, cause);
  }
}
