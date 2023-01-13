import * as dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import { ServerService } from '../src/ServerService';
import assert from 'assert';

const ENDPOINT = `/api/users`;
const WRONG_ENDPOINT = `/api/user`;
const MOCK_ID = '30dc4f8c-11e5-4369-a5e2-8b99e2c08b76';
const MOCK_NOEXIST_ID = '50dc4f8c-11e5-4369-a5e2-8b99e2c08b76';
const MOCK_WRONG_ID = 'wrong id';

const MOCK_USER = {
  id: MOCK_ID,
  username: 'User',
  age: '18',
  hobbies: [],
};
const MOCK_UPDATED_USER = {
  id: MOCK_ID,
  username: 'UpdatedUser',
  age: '18',
  hobbies: ['reading'],
};

const app = new ServerService();
jest.mock('uuid', () => ({ v4: () => MOCK_ID }));

describe('success getting, creating, updating and deleting user', () => {
  afterAll((done) => {
    app.close();
    done();
  });

  it('should get all users === []', async () => {
    const res = await request(app.server)
      .get(ENDPOINT)
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect([]);
  });
  it('should create user', async () => {
    const res = await request(app.server)
      .post(ENDPOINT)
      .send(MOCK_USER)
      .expect(201)
      .expect((res) => {
        assert(res.body.hasOwnProperty('username'));
        assert(res.body.hasOwnProperty('age'));
        assert(res.body.hasOwnProperty('hobbies'));
      });
  });
  it('should get created user', async () => {
    const res = await request(app.server)
      .get(ENDPOINT + `/${MOCK_ID}`)
      .expect(200)
      .expect(MOCK_USER);
  });
  it('should update created user', async () => {
    const res = await request(app.server)
      .put(ENDPOINT + `/${MOCK_ID}`)
      .send(MOCK_UPDATED_USER)
      .expect(200)
      .expect(MOCK_UPDATED_USER);
  });
  it('should delete updated user', async () => {
    const res = await request(app.server)
      .delete(ENDPOINT + `/${MOCK_ID}`)
      .send(MOCK_UPDATED_USER)
      .expect(204);
  });
  it('should get 404 if we try to get deleted user', async () => {
    const res = await request(app.server)
      .get(ENDPOINT + `/${MOCK_ID}`)
      .expect(404);
  });
});

describe('unsuccess getting, creating, updating and deleting user with status code === 400', () => {
  afterAll((done) => {
    app.close();
    done();
  });

  it('should return 400 if userId is invalid when getting a user', async () => {
    const res = await request(app.server)
      .get(ENDPOINT + `/${MOCK_WRONG_ID}`)
      .expect(400);
  });

  it('should return 400 if body does not contain required field', async () => {
    const res = await request(app.server)
      .post(ENDPOINT)
      .send({
        username: 'User',
        hobbies: [],
      })
      .expect(400);
  });

  it('should return 400 if userId is invalid when updating a user', async () => {
    const res = await request(app.server)
      .put(ENDPOINT + `/${MOCK_WRONG_ID}`)
      .send(MOCK_UPDATED_USER)
      .expect(400);
  });

  it('should return 400 if userId is invalid when deleting a user', async () => {
    const res = await request(app.server)
      .delete(ENDPOINT + `/${MOCK_WRONG_ID}`)
      .send(MOCK_UPDATED_USER)
      .expect(400);
  });
});

describe('unsuccess getting, creating, updating and deleting user with status code === 404', () => {
  afterAll((done) => {
    app.close();
    done();
  });

  it('should return 404 if endpoint is wrong', async () => {
    const res = await request(app.server).get(WRONG_ENDPOINT).expect(404);
  });

  it('should return 404 if record with id === userId does not exist', async () => {
    const res = await request(app.server)
      .get(ENDPOINT + `/${MOCK_NOEXIST_ID}`)
      .expect(404);
  });

  it('should return 404 if record with id === userId does not exist', async () => {
    const res = await request(app.server)
      .put(ENDPOINT + `/${MOCK_NOEXIST_ID}`)
      .send(MOCK_UPDATED_USER)
      .expect(404);
  });

  it('should return 404 if record with id === userId does not exist', async () => {
    const res = await request(app.server)
      .delete(ENDPOINT + `/${MOCK_NOEXIST_ID}`)
      .send(MOCK_UPDATED_USER)
      .expect(404);
  });
});

describe('errors on the server side', () => {
  afterAll((done) => {
    app.close();
    done();
  });

  it('should return 500', async () => {
    const mockGetData = jest.spyOn(app, 'post').mockImplementation(() => {
      throw new Error('Errors on the server side');
    });

    const res = await request(app.server).post(ENDPOINT).send(MOCK_USER).expect(500);
  });
});
