import * as dotenv from 'dotenv';
dotenv.config();
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import { ENDPOINT } from './constants.js';

type TUser = {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
};

let users: TUser[] = [{ id: 'id1', username: 'name1', age: 18, hobbies: [] }];

const server = http.createServer((request, response) => {
  try {
    if (request.method === 'GET') {
      if (request.url === ENDPOINT) {
        response.setHeader('Content-Type', 'application/json');
        response.statusCode = 200;
        response.end(JSON.stringify(users));
        return;
      }

      if (request.url?.includes(ENDPOINT)) {
        const userId = request.url.split('/').at(-1);
        const foundUser = users.find((user) => user.id === userId);

        if (foundUser) {
          if (foundUser.id.match(/^[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/)) {
            response.setHeader('Content-Type', 'application/json');
            response.statusCode = 200;
            response.end(JSON.stringify(foundUser));
          } else {
            response.statusCode = 404;
            response.statusMessage = 'Sorry, userId is invalid (not uuid)';
            response.end();
          }
        } else {
          response.statusCode = 404;
          response.statusMessage = 'Sorry, record with id === userId does not exist';
          response.end();
        }
      }
      return;
    }

    if (request.method === 'POST') {
      if (request.url === ENDPOINT) {
        const data: Buffer[] = [];
        request
          .on('data', (chunk: Buffer) => {
            data.push(chunk);
          })
          .on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(data).toString());

              if ('username' in body && 'age' in body && 'hobbies' in body) {
                response.statusCode = 201;
                response.statusMessage = 'New user was added';
                users.push({ ...body, id: uuidv4() });
                console.log(users);
              } else {
                response.statusCode = 400;
                response.statusMessage = 'Sorry, body does not contain required fields';
              }

              response.end();
            } catch {
              response.statusCode = 500;
              response.statusMessage = 'Sorry, something wrong';
              response.end();
            }
          });
      } else {
        response.statusCode = 404;
        response.statusMessage = 'Sorry, there is not this endpoint';
        response.end();
      }
      return;
    }
    if (request.method === 'PUT') {
      if (request.url?.includes(ENDPOINT)) {
        const userId = request.url.split('/').at(-1);
        console.log(users);

        const foundUser = users.find((user) => user.id === userId);
        console.log(foundUser);

        if (foundUser) {
          if (foundUser.id.match(/^[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/)) {
            const data: Buffer[] = [];

            request
              .on('data', (chunk: Buffer) => {
                data.push(chunk);
              })
              .on('end', () => {
                try {
                  const body = JSON.parse(Buffer.concat(data).toString());

                  if ('username' in body && 'age' in body && 'hobbies' in body) {
                    response.setHeader('Content-Type', 'application/json');
                    response.statusCode = 200;
                    response.end(JSON.stringify({ ...body, id: userId }));
                    users = users.filter((user) => user.id !== userId);
                    users.push({ ...body, id: userId });
                    console.log(users);
                  } else {
                    response.statusCode = 400;
                    response.statusMessage = 'Sorry, body does not contain required fields';
                  }

                  response.end();
                } catch {
                  response.statusCode = 500;
                  response.statusMessage = 'Sorry, something wrong';
                  response.end();
                }
              });
          } else {
            response.statusCode = 404;
            response.statusMessage = 'Sorry, userId is invalid (not uuid)';
            response.end();
          }
        } else {
          response.statusCode = 404;
          response.statusMessage = 'Sorry, record with id === userId does not exist';
          response.end();
        }
        return;
      } else {
        response.statusCode = 404;
        response.statusMessage = 'Sorry, there is not this endpoint';
        response.end();
      }
      return;
    }

    if (request.method === 'DELETE') {
      if (request.url?.includes(ENDPOINT)) {
        const userId = request.url.split('/').at(-1);
        const foundUser = users.find((user) => user.id === userId);

        if (foundUser) {
          if (foundUser.id.match(/^[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/)) {
            response.statusCode = 204;
            response.end(JSON.stringify(foundUser));
            users = users.filter((user) => user.id !== userId);
          } else {
            response.statusCode = 404;
            response.statusMessage = 'Sorry, userId is invalid (not uuid)';
            response.end();
          }
        } else {
          response.statusCode = 404;
          response.statusMessage = 'Sorry, record with id === userId does not exist';
          response.end();
        }
      }
      return;
    }

    throw new Error();
  } catch {
    response.statusCode = 500;
    response.statusMessage = 'Sorry, something wrong';
    response.end();
  }
});

server.listen(process.env.PORT_NAME);
