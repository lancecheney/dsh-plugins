# dsh-deepseek-balance

A client plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that renders, to the **left of the "Session log" button** in the web UI:

```
消耗 ¥0.12 | 余额 ¥47.17 | 高峰 | ¥27.0/M 输出
```

- **消耗 / Spent** — estimated cost of the *current conversation window* (session `tokenUsage` projection × current-period price). Each conversation window shows its own spend.
- **余额 / Balance** — live DeepSeek API balance from `GET /user/balance`, proxied server-side so the API key never reaches the browser.
- **高峰 / 空闲 (Peak / Off-peak)** — Beijing-time peak detection (peak: 09:00–12:00 and 14:00–18:00; everything else is off-peak).
- **价格 / Price** — current-period output price (CNY / 1M tokens) for DeepSeek-V4-Pro, with the full V4-Pro / V4-Flash price table on hover.

Pricing follows DeepSeek's official peak/off-peak pricing effective **2026-08-17**.

## Structure

- `lib/index.js` — host half. Registers the same-origin `/api/deepseek-balance` route that proxies `GET /user/balance`, resolving the API key + base URL exactly like `llm-deepseek` (credentials seam, then env).
- `lib/client.js` — browser half. Renders the badge into the `conversation.session.header.utilities` slot (`order: -100`, so it sits before Session log).
- `package.json` — declares the `dsh.client` web-platform entry and the `./client` export.

## Install

1. Copy this package into the profile's module-resolution directory, e.g.:

   ```
   ~/.dsh/profiles/node_modules/@deepseek-ai/dsh-deepseek-balance/
   ```

2. Register it in the web profile's `cordis.patch.yml`:

   ```yaml
   - insert:
       - id: deepseek-balance
         name: '@deepseek-ai/dsh-deepseek-balance'
   ```

3. Restart `dsh web` and refresh the page.

Requires a `DEEPSEEK_API_KEY` configured through the harness credential store (or the `DEEPSEEK_API_KEY` environment variable).

## License

MIT
