# dsh-deepseek-balance

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) client plugin that renders a compact billing badge to the **left of the "Session log" button** in the web UI:

```
Spent ¥0.12 | Balance ¥47.17 | Peak | ¥27.0⁺/M output
```

![badge](https://github.com/lancecheney/dsh-plugins/raw/main/docs/screenshot.png)

Clicking the badge opens a right-side drawer with full usage stats:

![panel](https://github.com/lancecheney/dsh-plugins/raw/main/docs/panel.png)

## Features

- **Balance** — live DeepSeek API balance from `GET /user/balance`, proxied server-side so your API key never reaches the browser.
- **Spent** — estimated cost of the *current conversation window*, computed from the session's `tokenUsage` projection × the current-period price. Each conversation window shows its own spend.
- **Peak / Off-peak / Flat** — Beijing-time pricing period (peak: 09:00–12:00 and 14:00–18:00; everything else is off-peak). Before the peak/off-peak scheme takes effect, it shows **Flat** with the pre-change price.
- **Price** — current-period output price (per 1M tokens) for the selected model, with a small superscript `+` (high) / `++` (max) marker when thinking mode adds extra output.
- **Model-aware** — switches between DeepSeek-V4-Pro and V4-Flash pricing to match the current conversation's selected model.
- **Currency-aware** — reads the account currency from the balance (`CNY` / `USD`) and shows `¥` or `$` with the matching price table.
- **Self-updating** — the host fetches the official pricing docs daily at 01:00 Beijing time (plus once at startup), with a built-in fallback table.

## How pricing is obtained

DeepSeek does not expose a pricing API, so the host half scrapes the official docs page — both the Chinese page for CNY and the English page for USD (`https://api-docs.deepseek.com/quick_start/pricing/`), parses the price tables and the effective date, and serves them to the browser at `/api/deepseek-pricing`. Prices are cached in memory and refreshed daily; on any failure the last-known-good built-in table is used.

## Structure

- `lib/index.js` — host half. Registers `/api/deepseek-balance` (balance proxy) and `/api/deepseek-pricing` (price table).
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

## Notes

- The **Spent** figure is an estimate: all tokens in a session are priced at the current period's rate. Real billing is computed by DeepSeek.
- Reasoning tokens are billed as output tokens; the `+` / `++` marker signals that high/max effort increases output volume, not the unit price.

## License

MIT
