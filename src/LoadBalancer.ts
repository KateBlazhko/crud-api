import http from 'http';
import { PORT_NAME, statusMessages } from './constants';
import { TUser } from './model';
import cluster, { Worker } from 'cluster';
import { cpus } from 'os';
import { ServerService } from './ServerService';

export class LoadBalancer {
  public users: TUser[] = [];
  private workers: Worker[] = [];
  private currentWorkerNumber = 1;
  private numberCPU = cpus().length;

  public balancer = http.createServer((request, response) => {
    try {
      let endpoint = `http://localhost:${PORT_NAME + this.currentWorkerNumber}${request.url}`;
      const req = http.request(endpoint, { method: request.method, headers: request.headers }, (res) => {
        if (res.statusCode) {
          response.writeHead(res.statusCode, res.statusMessage, res.headers);
        }

        res.pipe(response);
      });

      request.pipe(req);

      this.currentWorkerNumber = this.currentWorkerNumber === this.numberCPU ? 1 : this.currentWorkerNumber + 1;
    } catch {
      this.responseWithError(response, 500, statusMessages.serverError);
    }
  });

  public start() {
    if (cluster.isPrimary) {
      this.balancer.listen(PORT_NAME);

      for (let i = 0; i < this.numberCPU; i++) {
        const worker = cluster.fork({ id: i + 1 });

        worker.on('message', (msg) => {
          this.updateUsers(msg);
        });

        this.workers.push(worker);
      }
    } else {
      const server = new ServerService(process);
      server.start();

      process.on('message', (msg: TUser[]) => {
        server.users = [...msg];
      });
    }
  }

  public close() {
    this.users = [];
    this.balancer.close();
  }

  private responseWithError(response: http.ServerResponse, statusCode: number, errorMessage: string) {
    response.statusCode = statusCode;
    response.statusMessage = errorMessage;
    response.end();
  }

  private updateUsers({ method, id, data }: { id: number; method: string; data: TUser }) {
    if (method === 'post') {
      this.users.push(data);
    }

    if (method === 'put') {
      this.users = this.users.map((user) => (user.id === data.id ? data : user));
    }

    if (method === 'delete') {
      this.users = this.users.filter((user) => user.id !== data.id);
    }

    this.workers.forEach((worker) => worker.send(this.users));
  }
}
