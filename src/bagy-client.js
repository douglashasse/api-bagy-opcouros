import { config } from './config.js';
import { httpError } from './http-utils.js';
import { loadTokenState, saveTokenState } from './token-store.js';

function buildUrl(path, params = {}) {
  if (!config.bagy.apiBase) {
    throw httpError(500, 'BAGY_API_BASE_MISSING', 'BAGY_API_BASE nao configurado.');
  }

  const url = new URL(`${config.bagy.apiBase}${path.startsWith('/') ? path : `/${path}`}`);
  const token = loadTokenState().accessToken;
  if (!token) throw httpError(500, 'BAGY_TOKEN_MISSING', 'BAGY_ACCESS_TOKEN nao configurado.');
  url.searchParams.set('access_token', token);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function parseResponse(response) {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  if (!text) return null;
  if (contentType.includes('application/json') || /^[\[{]/.test(text.trim())) {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
  return { raw: text };
}

export async function bagyRequest(path, { method = 'GET', params = {}, body } = {}) {
  const url = buildUrl(path, params);
  const init = {
    method,
    headers: {
      accept: 'application/json',
      'user-agent': 'api-bagy-opcouros/0.1.0'
    }
  };

  if (body !== undefined) {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    const safeUrl = new URL(url);
    safeUrl.searchParams.delete('access_token');
    throw httpError(502, 'BAGY_FETCH_FAILED', 'Falha de conexao com a API Bagy.', {
      url: safeUrl.toString(),
      cause: error.cause?.message || error.message
    });
  }
  const parsed = await parseResponse(response);

  if (!response.ok) {
    throw httpError(response.status, 'BAGY_REQUEST_FAILED', 'A Bagy retornou erro.', {
      status: response.status,
      response: parsed
    });
  }

  return parsed;
}

export async function refreshBagyToken() {
  const state = loadTokenState();
  const refreshToken = state.refreshToken;
  if (!refreshToken) {
    throw httpError(400, 'BAGY_REFRESH_TOKEN_MISSING', 'Refresh token da Bagy nao configurado.');
  }

  const url = new URL(`${config.bagy.apiBase}/auth`);
  url.searchParams.set('refresh_token', refreshToken);
  const response = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
  const parsed = await parseResponse(response);
  if (!response.ok) {
    throw httpError(response.status, 'BAGY_REFRESH_FAILED', 'Falha ao atualizar token Bagy.', parsed);
  }

  saveTokenState(parsed);
  return parsed;
}

export async function exchangeBagyCode({ code, apiAddress }) {
  const apiBase = String(apiAddress || config.bagy.apiBase || '').replace(/\/+$/, '');
  if (!apiBase || !code || !config.bagy.consumerKey || !config.bagy.consumerSecret) {
    throw httpError(400, 'BAGY_OAUTH_CONFIG_MISSING', 'Dados OAuth Bagy incompletos.');
  }

  const form = new URLSearchParams();
  form.set('consumer_key', config.bagy.consumerKey);
  form.set('consumer_secret', config.bagy.consumerSecret);
  form.set('code', code);

  const response = await fetch(`${apiBase}/auth`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: form
  });
  const parsed = await parseResponse(response);
  if (!response.ok) {
    throw httpError(response.status, 'BAGY_OAUTH_EXCHANGE_FAILED', 'Falha ao trocar code por token.', parsed);
  }

  saveTokenState(parsed);
  return parsed;
}
