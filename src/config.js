import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

loadDotEnv();

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function cleanBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

export const config = {
  port: Number(process.env.PORT || 3099),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  opcourosApiKey: process.env.OPCOUROS_API_KEY || '',
  opcourosReadApiKey: process.env.OPCOUROS_READ_API_KEY || '',
  bagy: {
    apiBase: cleanBaseUrl(process.env.BAGY_API_BASE || ''),
    apiMode: process.env.BAGY_API_MODE || 'auto',
    accessToken: process.env.BAGY_ACCESS_TOKEN || '',
    refreshToken: process.env.BAGY_REFRESH_TOKEN || '',
    consumerKey: process.env.BAGY_CONSUMER_KEY || '',
    consumerSecret: process.env.BAGY_CONSUMER_SECRET || '',
    webhookSecret: process.env.BAGY_WEBHOOK_SECRET || '',
    tokenStorePath: process.env.BAGY_TOKEN_STORE_PATH || './data/bagy-token.json'
  }
};

export function getMissingRequiredConfig() {
  const missing = [];
  if (!config.opcourosApiKey) missing.push('OPCOUROS_API_KEY');
  if (!config.bagy.apiBase) missing.push('BAGY_API_BASE');
  if (!config.bagy.accessToken) missing.push('BAGY_ACCESS_TOKEN');
  return missing;
}
