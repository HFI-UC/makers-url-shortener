# Makers URL Shortener

This repository provides a minimal Cloudflare Workers backend for generating short URLs.

## API Usage

Send a **POST** request to the Worker with JSON body:

```json
{
  "url": "https://example.com"
}
```

Successful requests return:

```json
{
  "status": 200,
  "key": "/xxxxx"
}
```

Prefix the returned `key` with the Worker domain to create the full short link. For example, if your Worker is deployed at `https://url.example.workers.dev` and the `key` returned is `/demo`, the short link is:

```
https://url.example.workers.dev/demo
```

## Deployment

1. Create a KV namespace called `LINKS` and bind it to your Worker through the Cloudflare dashboard or CLI.
2. Copy the code from `src/index.js` into your Worker's script and deploy it.

## License

This project is released under the AGPLv3 License. See `LICENSE.md` for details.
