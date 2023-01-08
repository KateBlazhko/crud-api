export const ENDPOINT = `/api/users`;

export enum statusMessages {
  serverError = 'Sorry, something wrong',
  invalidId = 'Sorry, userId is invalid (not uuid)',
  noExistUser = 'Sorry, record with id === userId does not exist',
  invalidEndpoint = 'Sorry, there is not this endpoint',
  invalidBody = 'Sorry, body does not contain required fields',
}
