/**
 * @nestjs/websockets mock for tests
 */

export const WsException = class WsException extends Error {
  constructor(message: any) {
    super(typeof message === 'string' ? message : JSON.stringify(message));
    this.name = 'WsException';
  }
};
