import * as dotenv from 'dotenv';
dotenv.config();
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import { ENDPOINT, statusMessages } from './constants';
import { TUser } from './model';

export class ServerService {
  public users: TUser[] = [{ id: 'id1', username: 'name1', age: 18, hobbies: [] }];

  public start() {
    const server = http.createServer((request, response) => {
      try {
        switch (request.method) {
          case 'GET':
            this.get(request, response);
            break;
          case 'POST':
            this.post(request, response);
            break;
          case 'PUT':
            this.put(request, response);
            break;
          case 'DELETE':
            this.delete(request, response);
            break;
          default:
            throw new Error();
        }
      } catch {
        this.responseWithError(response, 500, statusMessages.serverError);
      }
    });
    server.listen(process.env.PORT_NAME);
  }

  private responseWithError(response: http.ServerResponse, statusCode: number, errorMessage: string) {
    response.statusCode = statusCode;
    response.statusMessage = errorMessage;
    response.end();
  }

  private responseSuccess(response: http.ServerResponse, statusCode: number, data?: string) {
    response.setHeader('Content-Type', 'application/json');
    response.statusCode = statusCode;
    response.end(data);
  }

  private validateBody(data: Buffer[], response: http.ServerResponse, callback: (body: TUser) => void) {
    try {
      const body = JSON.parse(Buffer.concat(data).toString());

      if ('username' in body && 'age' in body && 'hobbies' in body) {
        callback(body);
        return;
      }

      this.responseWithError(response, 400, statusMessages.invalidBody);
    } catch {
      this.responseWithError(response, 500, statusMessages.serverError);
    }
  }

  private validateID(id: string) {
    return id.match(/^[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/);
  }

  private checkStartsWithEndpoint(
    { url }: http.IncomingMessage,
    response: http.ServerResponse,
    callback: (foundUser: TUser) => void
  ) {
    if (url?.startsWith(ENDPOINT)) {
      const userId = url.split('/').at(-1);
      const foundUser = this.users.find((user) => user.id === userId);

      if (foundUser) {
        if (this.validateID(foundUser.id)) {
          callback(foundUser);
        } else {
          this.responseWithError(response, 400, statusMessages.invalidId);
        }
      } else {
        this.responseWithError(response, 404, statusMessages.noExistUser);
      }
      return;
    }

    this.responseWithError(response, 404, statusMessages.invalidEndpoint);
  }

  public get(request: http.IncomingMessage, response: http.ServerResponse) {
    if (request.url === ENDPOINT) {
      this.responseSuccess(response, 200, JSON.stringify(this.users));
      return;
    }

    this.checkStartsWithEndpoint(request, response, (foundUser?: TUser) =>
      this.responseSuccess(response, 200, JSON.stringify(foundUser))
    );
  }

  public post(request: http.IncomingMessage, response: http.ServerResponse) {
    if (request.url === ENDPOINT) {
      const data: Buffer[] = [];

      request
        .on('data', (chunk: Buffer) => {
          data.push(chunk);
        })
        .on('end', () => {
          this.validateBody(data, response, (body) => {
            const newUser = { ...body, id: uuidv4() };

            this.responseSuccess(response, 201, JSON.stringify(newUser));

            this.users.push(newUser);
          });
        });
      return;
    }

    this.responseWithError(response, 404, statusMessages.invalidEndpoint);
  }

  public put(request: http.IncomingMessage, response: http.ServerResponse) {
    this.checkStartsWithEndpoint(request, response, ({ id: userId }: TUser) => {
      const data: Buffer[] = [];

      request
        .on('data', (chunk: Buffer) => {
          data.push(chunk);
        })
        .on('end', () => {
          this.validateBody(data, response, (body) => {
            const updatedUser = { ...body, id: userId };

            this.users = this.users.map((user) => (user.id === userId ? updatedUser : user));

            this.responseSuccess(response, 200, JSON.stringify(updatedUser));
          });
        });
    });
  }

  public delete(request: http.IncomingMessage, response: http.ServerResponse) {
    this.checkStartsWithEndpoint(request, response, (foundUser: TUser) => {
      this.users = this.users.filter((user) => user.id !== foundUser.id);

      this.responseSuccess(response, 204, JSON.stringify(foundUser));
    });
  }
}
