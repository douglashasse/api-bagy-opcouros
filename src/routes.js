import { bagyRequest, exchangeBagyCode, getBagyApiMode, refreshBagyToken } from './bagy-client.js';
import { getMissingRequiredConfig } from './config.js';
import { httpError, readJsonBody, sendJson, sendNoContent } from './http-utils.js';
import { requireInternalApiKey, validateBagyWebhook } from './security.js';
import { sanitizeProductResponse, sanitizeSettings } from './sanitizers.js';

function pickQuery(url, names) {
  const out = {};
  for (const name of names) out[name] = url.searchParams.get(name) || undefined;
  return out;
}

function requirePathParam(value, name) {
  if (!value) throw httpError(400, 'MISSING_PATH_PARAM', `Parametro ausente: ${name}`);
  return decodeURIComponent(value);
}

export async function routeRequest(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/health') {
    const missing = getMissingRequiredConfig();
    return sendJson(res, missing.length ? 503 : 200, {
      ok: missing.length === 0,
      service: 'api-bagy-opcouros',
      missing_config: missing
    });
  }

  if (url.pathname === '/v1/bagy/webhooks' && req.method === 'POST') {
    validateBagyWebhook(req, url);
    const payload = await readJsonBody(req);
    console.log(JSON.stringify({
      event: 'bagy_webhook_received',
      at: new Date().toISOString(),
      scope_name: payload.scope_name,
      scope_id: payload.scope_id,
      seller_id: payload.seller_id,
      act: payload.act
    }));
    return sendJson(res, 202, { ok: true, received: true });
  }

  if (url.pathname === '/v1/bagy/oauth/exchange' && req.method === 'POST') {
    requireInternalApiKey(req);
    const body = await readJsonBody(req);
    const data = await exchangeBagyCode({
      code: body.code,
      apiAddress: body.api_address || body.apiAddress
    });
    return sendJson(res, 200, { ok: true, token_saved: true, bagy: sanitizeTokenResponse(data) });
  }

  if (url.pathname === '/v1/bagy/tokens/refresh' && req.method === 'POST') {
    requireInternalApiKey(req);
    const data = await refreshBagyToken();
    return sendJson(res, 200, { ok: true, token_saved: true, bagy: sanitizeTokenResponse(data) });
  }

  if (!url.pathname.startsWith('/v1/bagy/')) {
    throw httpError(404, 'NOT_FOUND', 'Rota nao encontrada.');
  }

  requireInternalApiKey(req);

  if (req.method === 'GET' && url.pathname === '/v1/bagy/info') {
    const infoPath = getBagyApiMode() === 'dooca' ? '/settings' : '/info';
    return sendJson(res, 200, sanitizeSettings(await bagyRequest(infoPath)));
  }

  if (req.method === 'GET' && url.pathname === '/v1/bagy/products') {
    const params = pickQuery(url, ['page', 'limit', 'available', 'category_id', 'reference', 'name', 'sku']);
    return sendJson(res, 200, sanitizeProductResponse(await bagyRequest('/products', { params })));
  }

  const productMatch = url.pathname.match(/^\/v1\/bagy\/products\/([^/]+)$/);
  if (req.method === 'GET' && productMatch) {
    const productId = requirePathParam(productMatch[1], 'product_id');
    return sendJson(res, 200, sanitizeProductResponse(await bagyRequest(`/products/${productId}`)));
  }

  if (req.method === 'GET' && url.pathname === '/v1/bagy/orders') {
    const params = pickQuery(url, ['page', 'limit', 'status_id', 'customer_id', 'email', 'cpf', 'date_from', 'date_to']);
    return sendJson(res, 200, await bagyRequest('/orders', { params }));
  }

  const orderCompleteMatch = url.pathname.match(/^\/v1\/bagy\/orders\/([^/]+)\/complete$/);
  if (req.method === 'GET' && orderCompleteMatch) {
    const orderId = requirePathParam(orderCompleteMatch[1], 'order_id');
    return sendJson(res, 200, await bagyRequest(`/orders/${orderId}/complete`));
  }

  const orderMatch = url.pathname.match(/^\/v1\/bagy\/orders\/([^/]+)$/);
  if (req.method === 'GET' && orderMatch) {
    const orderId = requirePathParam(orderMatch[1], 'order_id');
    return sendJson(res, 200, await bagyRequest(`/orders/${orderId}`));
  }

  if (req.method === 'GET' && url.pathname === '/v1/bagy/carts') {
    const params = pickQuery(url, ['page', 'limit', 'customer_id', 'session_id']);
    return sendJson(res, 200, await bagyRequest('/carts', { params }));
  }

  if (req.method === 'POST' && url.pathname === '/v1/bagy/carts') {
    const body = await readJsonBody(req);
    return sendJson(res, 201, await bagyRequest('/carts', { method: 'POST', body }));
  }

  const cartCompleteMatch = url.pathname.match(/^\/v1\/bagy\/carts\/([^/]+)\/complete$/);
  if (req.method === 'GET' && cartCompleteMatch) {
    const sessionId = requirePathParam(cartCompleteMatch[1], 'session_id');
    return sendJson(res, 200, await bagyRequest(`/carts/${sessionId}/complete`));
  }

  const cartMatch = url.pathname.match(/^\/v1\/bagy\/carts\/([^/]+)$/);
  if (cartMatch) {
    const sessionId = requirePathParam(cartMatch[1], 'session_id');
    if (req.method === 'GET') return sendJson(res, 200, await bagyRequest(`/carts/${sessionId}`));
    if (req.method === 'PUT') return sendJson(res, 200, await bagyRequest(`/carts/${sessionId}`, { method: 'PUT', body: await readJsonBody(req) }));
    if (req.method === 'DELETE') {
      await bagyRequest(`/carts/${sessionId}`, { method: 'DELETE' });
      return sendNoContent(res);
    }
  }

  throw httpError(404, 'NOT_FOUND', 'Rota Bagy nao implementada ainda.');
}

function sanitizeTokenResponse(data) {
  if (!data || typeof data !== 'object') return data;
  return {
    ...data,
    access_token: data.access_token ? '[redacted]' : undefined,
    refresh_token: data.refresh_token ? '[redacted]' : undefined
  };
}
