# dsh-deepseek-balance

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 客户端插件，在网页界面 **「Session log」按钮左侧** 渲染一个紧凑的计费徽章：

```
消耗 ¥0.12 | 余额 ¥47.17 | 高峰 | ¥8/M⁺
```

![徽章](https://github.com/lancecheney/dsh-plugins/raw/main/docs/screenshot.png)

点开徽章会打开右侧抽屉面板，展示完整用量统计：

![面板](https://github.com/lancecheney/dsh-plugins/raw/main/docs/panel.png)

面板里依次是：账号信息（token 名 + 脱敏 Key）、累计统计、余额块、对话排行与高峰时段排行、两张每日日历（按计费时段 / 按 token 量）、以及模型 × 思考强度排行。Key 下面那一行会写明徽章当前按哪个模型计价。

## 功能

- **余额** — 实时 DeepSeek API 余额（`GET /user/balance`），由服务端代理请求，浏览器不会接触你的 API Key。
- **消耗** — 当前对话的估算花费。服务端读取该会话的事件日志（同时兼容旧的 `session.jsonl.zstd` 和新的 `session.v3.jsonl.zstd`），重放其中的 token 用量后在服务端计价。每个对话窗口显示各自的消耗，面板里则是累计总量。
- **高峰 / 空闲 / 平价** — 按北京时间判断计费时段（高峰：09:00–12:00、14:00–18:00，其余空闲）。在峰谷定价生效前显示 **平价**（调价前价格）。
- **价格** — 当前时段的输出单价（每百万 tokens），思考强度为 high/max 时价格数字后带小上标 `+` / `++`。
- **按模型切换** — 价格跟随当前会话的模型：优先用输入框里实时选中的模型，其次用该会话最后一次请求所用的模型，在 DeepSeek-V4-Pro 与 DeepSeek-Flash 价格表之间切换。两者都拿不到时显示 `—`，不会拿别的模型的价来顶。
- **历史价格** — 每一步都按它执行当时生效的价格档与峰谷时段计价，跨调价的会话不会被统一按今天的价格重算。
- **按货币切换** — 从余额接口读取账号货币（`CNY` / `USD`），自动显示 `¥` 或 `$` 及对应价格表。
- **自动更新** — 服务端每天北京时间 01:00（外加启动时一次）抓取官方定价页，失败时回退到内置价格表。

## 价格如何获取

DeepSeek 没有公开的定价 API，因此 host 半区抓取官方文档页（中文页取人民币、英文页取美元，`https://api-docs.deepseek.com/quick_start/pricing/`），解析价格表和生效日期，并通过 `/api/deepseek-pricing` 下发给浏览器。价格缓存在内存中、每天刷新一次；任何失败都会回退到最后一次成功/内置的价格表。

## 结构

- `lib/index.js` — host 半区。注册 `/api/deepseek-balance`（余额代理）、`/api/deepseek-pricing`（价格表）与 `/api/deepseek-usage`（聚合用量 + 花费，可用 `?session=` 只取单个会话）。
- `lib/client.js` — 浏览器半区。把徽章渲染进 `conversation.session.header.utilities` 槽位。
- `cordis.patch.yml` — bundle 补丁，把插件行插入 host 组合。
- `package.json` — 声明 `dsh.bundle` + `dsh.client`（web 平台）以及 `./client` 导出。

## 安装

通过 `dsh plugin`：

```sh
dsh plugin --profile web add @lancecheney/dsh-deepseek-balance
```

然后重启 `dsh web` 并刷新页面。

需要已在 harness 凭据存储中配置 `DEEPSEEK_API_KEY`（或设置 `DEEPSEEK_API_KEY` 环境变量）。

## 安全

余额接口走服务端代理：浏览器只请求本地 `/api/deepseek-balance` 路由，由 host 半区转发到 DeepSeek。API Key 从 harness 凭据存储（或 `DEEPSEEK_API_KEY` 环境变量）解析，仅在服务端调用 DeepSeek 时放入 `Authorization: Bearer ...` 请求头，绝不进入浏览器。界面只显示脱敏后的预览（`sk-8ce0e*****d899`），方便确认当前用的是哪个密钥。

## 说明

- **消耗** 是估算值：插件用本地会话日志对照自己维护的官方价格表重放计算，因此可能与官方后台不一致（例如日志尚未落盘时）。实际扣费以 DeepSeek 服务端为准。
- 思考链按输出 token 计费；`+` / `++` 只是标记 high/max 思考会增加输出量，并不改变单价。

## License

MIT
