import RippleApiService from './api-v1/services/ripple-api';
import { Server } from './server';
import config from '../.secret_config';

const rippleApiService = new RippleApiService({server: config.server});
console.log('Using rippled server:', config.server);

const server = new Server({rippleApiService});
server.listen().then((port) => {
  console.log('Listening on port:', port);
});
