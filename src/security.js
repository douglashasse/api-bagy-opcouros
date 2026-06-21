import { timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { getHeader, httpError } from './http-utils.js';

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function requireInternalApiKey(req) {
  const provided = getHeader(req, 'x-opcouros-api-key') || getHeader(req, 'authorization')?.replace(/^Bearer\s+/i, '');
  if (!config.opcourosApiKey || !safeEqual(provided, config.opcourosApiKey)) {
    throw httpError(401, 'UNAUTHORIZED', 'Chave interna ausente ou invalida.');
  }
}

export function validateBagyWebhook(req, url) {
  if (!config.bagy.webhookSecret) return;
  const provided = getHeader(req, 'x-bagy-webhook-secret') || url.searchParams.get('secret');
  if (!safeEqual(provided, config.bagy.webhookSecret)) {
    throw httpError(401, 'WEBHOOK_UNAUTHORIZED', 'Webhook Bagy nao autorizado.');
  }
}
