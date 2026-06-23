import http from 'node:http';
import { config } from './config.js';
import { routeRequest } from './routes.js';
import { sendJson } from './http-utils.js';

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  if (!config.allowedOrigins.includes('*') && !config.allowedOrigins.includes(origin)) return;

  res.setHeader('access-control-allow-origin', origin);
  res.setHeader('vary', 'Origin');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,x-opcouros-api-key,authorization');
  res.setHeader('access-control-max-age', '86400');
}

const server = http.createServer(async (req, res) => {
  try {
    applyCors(req, res);
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'cache-control': 'no-store' });
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    await routeRequest(req, res, url);
  } catch (error) {
    const status = error.status || 500;
    const payload = {
      ok: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: status >= 500 ? 'Erro interno da API OPCouros.' : error.message
      }
    };

    if (config.nodeEnv !== 'production' && error.details) {
      payload.error.details = error.details;
    }

    if (status >= 500) {
      console.error(JSON.stringify({
        event: 'server_error',
        at: new Date().toISOString(),
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack
      }));
    }

    sendJson(res, status, payload);
  }
});

server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({
    event: 'server_started',
    service: 'api-bagy-opcouros',
    port: config.port,
    host: config.host,
    node_env: config.nodeEnv
  }));
});
