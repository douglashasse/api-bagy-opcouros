import { timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { getHeader, httpError } from './http-utils.js';

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function getProvidedKey(req) {
  return getHeader(req, 'x-opcouros-api-key') || getHeader(req, 'authorization')?.replace(/^Bearer\s+/i, '');
}

function isAdminKey(provided) {
  return Boolean(config.opcourosApiKey && safeEqual(provided, config.opcourosApiKey));
}

function isReadKey(provided) {
  return Boolean(config.opcourosReadApiKey && safeEqual(provided, config.opcourosReadApiKey));
}

export function requireInternalApiKey(req) {
  const provided = getProvidedKey(req);
  if (!isAdminKey(provided)) {
    throw httpError(401, 'UNAUTHORIZED', 'Chave admin ausente ou invalida.');
  }
}

export function requireReadApiKey(req) {
  const provided = getProvidedKey(req);
  if (!isAdminKey(provided) && !isReadKey(provided)) {
    throw httpError(401, 'UNAUTHORIZED', 'Chave de leitura ausente ou invalida.');
  }
}

export function validateBagyWebhook(req, url) {
  if (!config.bagy.webhookSecret) return;
  const provided = getHeader(req, 'x-bagy-webhook-secret') || url.searchParams.get('secret');
  if (!safeEqual(provided, config.bagy.webhookSecret)) {
    throw httpError(401, 'WEBHOOK_UNAUTHORIZED', 'Webhook Bagy nao autorizado.');
  }
}
