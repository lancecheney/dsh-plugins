# dsh-plugins

A monorepo of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins. / DeepSeek Harness 插件集合（monorepo）。

## Plugins / 插件

| Package / 包 | Description / 说明 | Docs / 文档 |
|---|---|---|
| [`dsh-deepseek-balance`](packages/dsh-deepseek-balance) | Session-header DeepSeek API balance + per-conversation spend + peak/off-peak pricing indicator / 会话头部显示余额、消耗、峰谷价格 | [EN](packages/dsh-deepseek-balance/README.md) · [中文](packages/dsh-deepseek-balance/README.zh.md) |

## Layout / 结构

```
packages/
  dsh-deepseek-balance/   # one npm package (installable DSH bundle) per plugin
                          # 每个插件一个 npm 包（可安装的 DSH bundle）
```

Each package is a standard DSH bundle: it declares `dsh.bundle.patch` + a
`cordis.patch.yml`, so it installs with:
/ 每个包都是标准 DSH bundle，声明了 `dsh.bundle.patch` 和 `cordis.patch.yml`，可用以下命令安装：

```sh
dsh plugin --profile web add <package>
```

## License

MIT
