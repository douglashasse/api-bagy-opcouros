export async function readJsonBody(req) {
  const raw = await readRawBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const form = new URLSearchParams(raw);
    if ([...form.keys()].length) return Object.fromEntries(form.entries());
    throw httpError(400, 'INVALID_JSON', 'Corpo da requisicao nao e JSON valido.');
  }
}

export async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(body);
}

export function sendNoContent(res) {
  res.writeHead(204, { 'cache-control': 'no-store' });
  res.end();
}

export function httpError(status, code, message, details = undefined) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

export function getHeader(req, name) {
  return req.headers[String(name).toLowerCase()];
}
