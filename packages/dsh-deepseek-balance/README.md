# dsh-deepseek-balance

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) client plugin that renders a compact billing badge to the **left of the "Session log" button** in the web UI:

```
Spent ¥0.12 | Balance ¥47.17 | Peak | ¥8/M⁺
```

![badge](https://github.com/lancecheney/dsh-plugins/raw/main/docs/screenshot.png)

Clicking the badge opens a right-side drawer with full usage stats:

![panel](https://github.com/lancecheney/dsh-plugins/raw/main/docs/panel.png)

The drawer shows the account header (token name + masked key), lifetime totals, balance blocks, top-conversation and peak-hour rankings, two daily calendars (period and tokens per day), and a model × reasoning-effort ranking. The line under the key names the model the badge is currently pricing.

## Features

- **Balance** — live DeepSeek API balance from `GET /user/balance`, proxied server-side so your API key never reaches the browser.
- **Spent** — estimated cost of the *current conversation*. The host half reads that session's event log (both the legacy `session.jsonl.zstd` and the newer `session.v3.jsonl.zstd`), replays its token usage and prices it server-side. Each conversation window shows its own spend; the drawer shows the lifetime total.
- **Peak / Off-peak / Flat** — Beijing-time pricing period (peak: 09:00–12:00 and 14:00–18:00; everything else is off-peak). Before the peak/off-peak scheme takes effect, it shows **Flat** with the pre-change price.
- **Price** — current-period output price (per 1M tokens) for the selected model, with a small superscript `+` (high) / `++` (max) marker when thinking mode adds extra output.
- **Model-aware** — the price follows the current conversation's model: the live composer selection first, then the model of the session's last request, switching between the DeepSeek-V4-Pro and DeepSeek-Flash tables. If neither is known it shows `—` rather than another model's price.
- **Historic prices** — every step is priced with the price era and the peak/off-peak period that were in force when it ran, so conversations spanning a price change are not re-priced at today's numbers.
- **Currency-aware** — reads the account currency from the balance (`CNY` / `USD`) and shows `¥` or `$` with the matching price table.
- **Self-updating** — the host fetches the official pricing docs daily at 01:00 Beijing time (plus once at startup), with a built-in fallback table.

## How pricing is obtained

DeepSeek does not expose a pricing API, so the host half scrapes the official docs page — both the Chinese page for CNY and the English page for USD (`https://api-docs.deepseek.com/quick_start/pricing/`), parses the price tables and the effective date, and serves them to the browser at `/api/deepseek-pricing`. Prices are cached in memory and refreshed daily; on any failure the last-known-good built-in table is used.

## Structure

- `lib/index.js` — host half. Registers `/api/deepseek-balance` (balance proxy), `/api/deepseek-pricing` (price table) and `/api/deepseek-usage` (aggregated usage + spend, optionally narrowed to a single session with `?session=`).
- `lib/client.js` — browser half. Renders the badge into the `conversation.session.header.utilities` slot.
- `cordis.patch.yml` — bundle patch that inserts the plugin row into the host composition.
- `package.json` — declares `dsh.bundle` + `dsh.client` (web platform) and the `./client` export.

## Install

Via `dsh plugin`:

```sh
dsh plugin --profile web add @lancecheney/dsh-deepseek-balance
```

then restart `dsh web` and refresh the page.

Requires a `DEEPSEEK_API_KEY` configured through the harness credential store (or the `DEEPSEEK_API_KEY` environment variable).

## Security

The balance is proxied server-side: the browser only ever talks to the local `/api/deepseek-balance` route, which the host half forwards to DeepSeek. Your API key is resolved from the harness credential store (or the `DEEPSEEK_API_KEY` environment variable) and is only used server-side in the `Authorization: Bearer ...` header when calling DeepSeek — it never reaches the browser. The badge only shows a masked preview (`sk-8ce0e*****d899`) so you can tell which key is in use.

## Notes

- The **Spent** figure is an estimate: the plugin replays the local session logs against its own copy of DeepSeek's price table, so it can differ from the official dashboard (for example when a log has not been flushed yet). Real billing is computed by DeepSeek.
- Reasoning tokens are billed as output tokens; the `+` / `++` marker signals that high/max effort increases output volume, not the unit price.

## License

MIT
