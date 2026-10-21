export const ApiCode = {
  Success: 0,
  Failure: -1,
  ValidationError: 1001,
  SetupKeyInvalid: 1002,
  AlreadyInitialized: 1003,
  InvalidCredentials: 1004,
  AuthRequired: 1005,
  TokenInvalid: 1006,
  TokenExpired: 1007,
  OldPasswordInvalid: 1008,
  NotFound: 1009,
  ConfigKeyExists: 1010,
  UserAccountExists: 1011,
  RateLimited: 1012,
  DictionaryValueExists: 1013,
  FileInUse: 1014,
} as const;

export type ApiCode = (typeof ApiCode)[keyof typeof ApiCode];
export type FailureCode = Exclude<ApiCode, typeof ApiCode.Success>;
