# API Bagy OPCouros

API intermediaria segura entre n8n/OPCouros e API Bagy.

Ela existe para o n8n nao precisar guardar nem manipular diretamente o token da Bagy em varios nodes. O n8n chama esta API com uma chave interna, e esta API conversa com a Bagy usando o `BAGY_ACCESS_TOKEN`.

## Estado atual

MVP inicial com:

- `GET /health`
- `GET /v1/bagy/info`
- `GET /v1/bagy/products`
- `GET /v1/bagy/products/:id`
- `GET /v1/bagy/orders`
- `GET /v1/bagy/orders/:id`
- `GET /v1/bagy/orders/:id/complete`
- `GET /v1/bagy/carts`
- `POST /v1/bagy/carts`
- `GET /v1/bagy/carts/:session_id`
- `GET /v1/bagy/carts/:session_id/complete`
- `PUT /v1/bagy/carts/:session_id`
- `DELETE /v1/bagy/carts/:session_id`
- `POST /v1/bagy/webhooks`
- `POST /v1/bagy/tokens/refresh`
- `POST /v1/bagy/oauth/exchange`

## Configuracao local

```bash
cp .env.example .env
```

Preencha no `.env`:

```dotenv
PORT=3099
HOST=127.0.0.1
ALLOWED_ORIGINS=https://www.opcouros.com.br,https://opcouros.com.br,http://localhost:4177
OPCOUROS_API_KEY=uma-chave-interna-forte
OPCOUROS_READ_API_KEY=outra-chave-somente-leitura
BAGY_API_BASE=https://api.dooca.store
BAGY_API_MODE=dooca
BAGY_ACCESS_TOKEN=token-fornecido-pela-bagy
```

Nao envie tokens no chat.

## Rodar localmente

```bash
npm start
```

Teste:

```bash
curl http://localhost:3099/health
```

Exemplo de chamada protegida:

```bash
curl \
  -H "X-OPCOUROS-API-KEY: sua-chave-interna" \
  http://localhost:3099/v1/bagy/info
```

## Uso no n8n

Criar uma credencial Header Auth ou enviar header manual:

```text
X-OPCOUROS-API-KEY: mesma chave de OPCOUROS_API_KEY
```

URLs esperadas na VPS:

```text
https://api-bagy-opcouros.agenciahasse.com.br/health
https://api-bagy-opcouros.agenciahasse.com.br/v1/bagy/products
https://api-bagy-opcouros.agenciahasse.com.br/v1/bagy/carts
```

## Deploy em VPS/EasyPanel

1. Criar app Docker/Git no EasyPanel.
2. Apontar para este repositorio/projeto.
3. Configurar variaveis:
   - `PORT=3099`
   - `HOST=0.0.0.0`
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS`
   - `OPCOUROS_API_KEY` para rotas admin/escrita
   - `OPCOUROS_READ_API_KEY` para bot, landings e consultas somente leitura
   - `BAGY_API_BASE`
   - `BAGY_API_MODE`
   - `BAGY_ACCESS_TOKEN`
   - `BAGY_REFRESH_TOKEN`, se existir
   - `BAGY_WEBHOOK_SECRET`, se usar webhook Bagy
4. Expor porta interna `3099`.
5. Configurar dominio com HTTPS.

## Observacoes importantes

- A API atual da Bagy/Dooca usa `https://api.dooca.store` com `Authorization: Bearer <token>`.
- A documentacao antiga da Bagy usa `{dominio_da_loja}/web_api` com `access_token` na query. O app ainda suporta esse modo com `BAGY_API_MODE=legacy`.
- As rotas de `info` e `products` devolvem resposta sanitizada por padrao, adequada para n8n/chatbot. Para uso administrativo interno, use `?raw=1` para receber o JSON completo da Bagy.
- `OPCOUROS_READ_API_KEY` permite somente `GET`. Use essa chave no chatbot e em landing pages.
- O endpoint de webhook da Bagy aceita `x-www-form-urlencoded` ou JSON.
- Checkout/link final ainda precisa ser validado na Bagy, porque a API cria/consulta carrinho, mas a URL final de pagamento pode depender do front da loja.
