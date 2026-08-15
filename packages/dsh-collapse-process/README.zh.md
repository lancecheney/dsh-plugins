# dsh-collapse-process

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 客户端插件：**回答过程中完全不改动界面；等一轮回答结束（turn 结束）后，把这一轮的「过程内容」收进一个折叠行**，只留下真正的回答文字。

被折叠的内容包括：

- 上下文注入（`@deepseek-ai/dsh-system-prompt`、skill catalog 等 `context` 节点）
- 工具调用行（Bash / Read / Write 等 `tool-call` 节点）
- 斜杠命令行（`command` 节点）
- 压缩标记（`compaction` / `manual-compaction`）
- 只包含思考、没有正文的 assistant 步骤（`Think`）

回答文字本身（含最终回答所在的那个 assistant 步骤）始终可见。折叠后每个 turn 在回答下方显示一行：

```
▸ 过程已折叠 · 展开
```

点击即可展开 / 收起这一轮的过程。

## 行为细节

- **流式过程中**（turn 尚未结束）不改动任何渲染，一切保持原样。
- **回答结束后**自动折叠；每个 turn 的折叠状态独立，且按会话隔离（`sessionId#turn` 作 key）。
- 折叠状态是内存态的 UI 状态，刷新页面后重新默认折叠，不落盘。

## 结构

- `lib/index.js` — host 半区（无 host 行为，仅满足 bundle 入口）。
- `lib/client.js` — 浏览器半区。遮蔽 `conversation.chat.node` 的 process 节点渲染器（`priority: -1`），在 turn 结束后返回 `null`；并在最终回答节点下方注入折叠行。
- `cordis.patch.yml` — bundle 补丁，把插件行插入 host 组合。
- `package.json` — 声明 `dsh.bundle` + `dsh.client`（web 平台）以及 `./client` 导出。

## 安装

```sh
dsh plugin --profile web add @lancecheney/dsh-collapse-process
```

然后重启 `dsh web` 并刷新页面。

## 已知限制

- 若某一轮在**没有正文的情况下**中断 / 出错（没有 closing answer），该轮不会被折叠，避免出现「收起来了但无法展开」的死角。
- 中间步骤里若夹杂正文（例如「我先看下仓库结构」然后才调用工具），那个带正文的步骤会保持可见，只折叠纯过程步骤。这是有意为之：区分「回答」与「过程」的最简单可靠信号就是该步骤是否产出正文。

## License

MIT
