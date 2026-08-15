# dsh-plugins

A monorepo of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins.

## Plugins

| Package | Description |
|---|---|
| [`dsh-deepseek-balance`](packages/dsh-deepseek-balance) | Session-header DeepSeek API balance + per-conversation spend + peak/off-peak pricing indicator |

## Layout

```
packages/
  dsh-deepseek-balance/   # one npm package (installable DSH bundle) per plugin
```

Each package is a standard DSH bundle: it declares `dsh.bundle.patch` + a
`cordis.patch.yml`, so it installs with:

```sh
dsh plugin --profile web add <package>
```

## License

MIT
