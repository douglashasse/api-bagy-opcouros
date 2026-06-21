import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';

export function loadTokenState() {
  const path = resolve(config.bagy.tokenStorePath);
  if (!existsSync(path)) {
    return {
      accessToken: config.bagy.accessToken,
      refreshToken: config.bagy.refreshToken
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return {
      accessToken: parsed.access_token || parsed.accessToken || config.bagy.accessToken,
      refreshToken: parsed.refresh_token || parsed.refreshToken || config.bagy.refreshToken,
      raw: parsed
    };
  } catch {
    return {
      accessToken: config.bagy.accessToken,
      refreshToken: config.bagy.refreshToken
    };
  }
}

export function saveTokenState(payload) {
  const path = resolve(config.bagy.tokenStorePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ ...payload, saved_at: new Date().toISOString() }, null, 2));
}
