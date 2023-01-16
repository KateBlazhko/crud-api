import { LoadBalancer } from './LoadBalancer';
import { ServerService } from './ServerService';

if (process.env.CASE === 'multi') {
  const balancer = new LoadBalancer();
  balancer.start();
} else {
  const server = new ServerService();
  server.start();
}
