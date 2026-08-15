# dsh-collapse-process

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) client plugin: **leave the UI completely untouched while a turn is streaming, then — once the turn settles — fold that turn's process content into a single disclosure row**, leaving only the actual answer text visible.

Folded content includes:

- context injections (`@deepseek-ai/dsh-system-prompt`, the skill catalog, and other `context` nodes)
- tool-call rows (Bash / Read / Write and other `tool-call` nodes)
- slash-command rows (`command` nodes)
- compaction markers (`compaction` / `manual-compaction`)
- reasoning-only assistant steps with no prose body (`Think`)

The answer text itself (and the assistant step that carries it) always stays visible. Once folded, each turn shows one row under its answer:

```
▸ Process folded · Expand
```

Click to expand / collapse that turn's process.

## Behaviour

- **While streaming** (turn not yet ended): nothing changes.
- **After the turn settles**: auto-fold; each turn's fold state is independent and scoped per session (`sessionId#turn`).
- Fold state is in-memory UI state only — not persisted, so a page reload returns to the collapsed default.

## Layout

- `lib/index.js` — host half (no host behaviour; satisfies the bundle entry).
- `lib/client.js` — browser half. Shadows the process node renderers under `conversation.chat.node` (priority `-1`) to render `null` once the turn settles, and injects the fold row under the closing answer.
- `cordis.patch.yml` — bundle patch inserting the plugin row into the host composition.
- `package.json` — declares `dsh.bundle` + `dsh.client` (web platform) and the `./client` export.

## Install

```sh
dsh plugin --profile web add @lancecheney/dsh-collapse-process
```

Then restart `dsh web` and refresh the page.

## Known limitations

- A turn that is interrupted/errored **without a text answer** is not folded, so the user can never be left with content that is collapsed but has no way to expand.
- Interstitial prose inside a tool-calling step (e.g. "let me check the repo first" followed by a tool call) keeps that step visible; only purely-process steps fold. This is deliberate: "does this step produce prose" is the simplest reliable signal separating answer from process.

## License

MIT
