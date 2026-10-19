import type { FailureCode } from './codes';
import type { ValidationErrorData } from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: FailureCode,
    message: string,
    public readonly data: ValidationErrorData | null = null,
  ) {
    super(message);
  }
}
