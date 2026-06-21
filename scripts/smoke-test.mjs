const baseUrl = process.env.BASE_URL || 'http://localhost:3099';
const apiKey = process.env.OPCOUROS_API_KEY || '';

const health = await fetch(`${baseUrl}/health`);
console.log('health', health.status, await health.text());

if (apiKey) {
  const info = await fetch(`${baseUrl}/v1/bagy/info`, {
    headers: { 'X-OPCOUROS-API-KEY': apiKey }
  });
  console.log('bagy info', info.status, await info.text());
}
