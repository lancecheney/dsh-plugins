window.__ModuleLoader__.load({
	id: "@lancecheney/dsh-deepseek-balance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		const css = ".Dbg1_root{display:inline-flex;align-items:center;gap:6px;height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:18px;padding:0 12px;font-family:var(--dsw-font-family);font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);background:0 0;white-space:nowrap}.Dbg1_num{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-weight:500}.Dbg1_sep{color:var(--dsw-alias-label-dimmed)}.Dbg1_chip{border-radius:9px;padding:0 8px;font-size:11px;line-height:18px;font-weight:600}.Dbg1_peak{color:var(--dsw-alias-state-warn-primary)}.Dbg1_offPeak{color:var(--dsw-alias-state-success-primary)}.Dbg1_dimmed{color:var(--dsw-alias-label-dimmed)}.Dbg1_plus{font-size:9px;line-height:1;vertical-align:super;color:var(--dsw-alias-state-warn-primary);font-weight:700}";
		const tagId = "@lancecheney/dsh-deepseek-balance/BillingBadge.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@lancecheney/dsh-deepseek-balance";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		const cssModule = { root: "Dbg1_root", num: "Dbg1_num", sep: "Dbg1_sep", chip: "Dbg1_chip", peak: "Dbg1_peak", offPeak: "Dbg1_offPeak", dimmed: "Dbg1_dimmed", plus: "Dbg1_plus" };

		/**
		 * DeepSeek API peak/off-peak pricing (effective 2026-08-17, Beijing time).
		 * Peak: 09:00-12:00 and 14:00-18:00; everything else is off-peak.
		 * Values are CNY per 1M tokens. Reasoning tokens are billed as output.
		 */
		const MODELS = {
			"deepseek-v4-pro": {
				label: "DeepSeek-V4-Pro",
				short: "Pro",
				peak: { hit: 0.30, miss: 9.0, output: 27.0 },
				offPeak: { hit: 0.15, miss: 4.5, output: 13.5 }
			},
			"deepseek-v4-flash": {
				label: "DeepSeek-V4-Flash",
				short: "Flash",
				peak: { hit: 0.10, miss: 3.0, output: 9.0 },
				offPeak: { hit: 0.05, miss: 1.5, output: 4.5 }
			}
		};
		const DEFAULT_MODEL = "deepseek-v4-pro";

		/** Decimal hour in Beijing time (Asia/Shanghai), independent of the user's TZ. */
		function beijingDecimalHour(now) {
			let hour = 0;
			let minute = 0;
			try {
				const parts = new Intl.DateTimeFormat("en-GB", {
					timeZone: "Asia/Shanghai",
					hour12: false,
					hour: "2-digit",
					minute: "2-digit"
				}).formatToParts(now);
				for (const part of parts) {
					if (part.type === "hour") hour = Number(part.value);
					if (part.type === "minute") minute = Number(part.value);
				}
			} catch {
				hour = now.getHours();
				minute = now.getMinutes();
			}
			return hour + minute / 60;
		}

		function periodFor(now) {
			const h = beijingDecimalHour(now);
			const peak = (h >= 9 && h < 12) || (h >= 14 && h < 18);
			return peak ? "peak" : "offPeak";
		}

		/** Prefer the CNY balance row; fall back to the first row. */
		function firstBalance(data) {
			const infos = data && data.balance_infos;
			if (!Array.isArray(infos) || infos.length === 0) return null;
			return infos.find((row) => row.currency === "CNY") || infos[0];
		}

		function fmtPrice(value) {
			const n = Number(value);
			return Number.isFinite(n) ? String(n) : String(value);
		}

		function fmtYuan(value) {
			const n = Number(value);
			if (!Number.isFinite(n)) return "—";
			if (n <= 0) return "0.00";
			if (n < 0.01) return n.toFixed(4);
			if (n < 1) return n.toFixed(3);
			return n.toFixed(2);
		}

		/** Estimated cost (CNY) for a session's token-usage projection under one period's prices. */
		function costOf(usage, p) {
			const miss = (usage.uncachedInputTokens ?? 0) + (usage.cacheWriteTokens ?? 0);
			const hit = usage.cacheReadTokens ?? 0;
			const output = usage.outputTokens ?? 0;
			return (miss * p.miss + hit * p.hit + output * p.output) / 1e6;
		}

		const noopSubscribe = () => () => {};

		function BillingBadge(props) {
			const t = props.t;
			const useProjection = props.useProjection;
			const directory = props.directory;
			const usage = useProjection("tokenUsage");
			const [state, setState] = react.useState({ phase: "loading" });

			react.useEffect(() => {
				let alive = true;
				let timer;
				const load = async () => {
					try {
						const res = await fetch("/api/deepseek-balance", {
							headers: { accept: "application/json" },
							cache: "no-store"
						});
						const data = await res.json().catch(() => ({}));
						if (!alive) return;
						if (!res.ok) {
							setState({ phase: "error", message: data.error || `HTTP ${res.status}` });
							return;
						}
						setState({ phase: "ok", data });
					} catch (error) {
						if (alive) setState({ phase: "error", message: error instanceof Error ? error.message : String(error) });
					}
				};
				load();
				timer = setInterval(load, 60000);
				return () => {
					alive = false;
					clearInterval(timer);
				};
			}, []);

			const modelState = react.useSyncExternalStore(
				directory ? (fn) => directory.subscribe(fn) : noopSubscribe,
				() => (directory ? directory.getSnapshot() : null)
			);
			const currentSelection = modelState && modelState.current ? modelState.current : null;
			const modelId = currentSelection && currentSelection.model ? currentSelection.model : DEFAULT_MODEL;
			const reasoningEffort = currentSelection ? currentSelection.reasoningEffort : void 0;

			const period = periodFor(new Date());
			const isPeak = period === "peak";
			const model = MODELS[modelId] || MODELS[DEFAULT_MODEL];
			const p = model[period];
			const outputPrice = fmtPrice(p.output);
			const balance = state.phase === "ok" ? firstBalance(state.data) : null;
			const cost = usage !== undefined && usage !== null ? costOf(usage, p) : null;

			// off → base price; high (default) → one +; max → two +.
			const plus = reasoningEffort === "max" ? "++" : reasoningEffort === "off" ? "" : "+";

			const tooltipParts = [
				`${t("period.peak")}: 09:00–12:00, 14:00–18:00 (${t("time.beijing")})`,
				`${t("period.offPeak")}: ${t("time.other")}`,
				"",
				`${t("label.model")}: ${model.label}${reasoningEffort ? ` · ${reasoningEffort}` : ""}`,
				t("reasoning.note")
			];
			if (cost !== null && usage) {
				tooltipParts.push(
					"",
					`${t("label.spent")}: ¥${fmtYuan(cost)} (${t("cost.estimate")})`,
					t("cost.breakdown", {
						miss: (usage.uncachedInputTokens ?? 0) + (usage.cacheWriteTokens ?? 0),
						hit: usage.cacheReadTokens ?? 0,
						output: usage.outputTokens ?? 0
					})
				);
			}
			tooltipParts.push("");
			for (const [, info] of Object.entries(MODELS)) {
				tooltipParts.push(
					`${info.label} — ${t("period.peak")}: ${t("price.row", { hit: fmtPrice(info.peak.hit), miss: fmtPrice(info.peak.miss), output: fmtPrice(info.peak.output) })} / ${t("period.offPeak")}: ${t("price.row", { hit: fmtPrice(info.offPeak.hit), miss: fmtPrice(info.offPeak.miss), output: fmtPrice(info.offPeak.output) })}`
				);
			}
			const tooltip = tooltipParts.join("\n");

			const sep = (key) => react.createElement("span", { key, className: cssModule.sep, "aria-hidden": true }, "|");

			const segs = [];
			segs.push(react.createElement("span", { key: "spent" },
				t("label.spent"), " ",
				react.createElement("span", { className: cssModule.num }, cost === null ? "—" : `¥${fmtYuan(cost)}`)));
			segs.push(sep("sep1"));
			segs.push(react.createElement("span", { key: "balance" },
				t("label.balance"), " ",
				react.createElement("span", { className: cssModule.num },
					balance !== null ? `¥${fmtYuan(Number(balance.total_balance))}` : (state.phase === "loading" ? "…" : t("balance.unavailable")))));
			segs.push(sep("sep2"));
			segs.push(react.createElement("span", { key: "period", className: `${cssModule.chip} ${isPeak ? cssModule.peak : cssModule.offPeak}` },
				isPeak ? t("period.peak") : t("period.offPeak")));
			segs.push(sep("sep3"));
			segs.push(react.createElement("span", { key: "price" },
				`¥${outputPrice}`,
				plus !== "" ? react.createElement("span", { className: cssModule.plus }, plus) : null,
				t("price.suffix")));

			return react.createElement("span", { className: cssModule.root, title: tooltip }, segs);
		}

		const NS = "deepseek-balance";
		const zh = {
			"label.spent": "消耗",
			"label.balance": "余额",
			"label.model": "模型",
			"period.peak": "高峰",
			"period.offPeak": "空闲",
			"time.beijing": "北京时间",
			"time.other": "其余时段",
			"balance.unavailable": "余额不可用",
			"price.suffix": "/M 输出",
			"price.row": "命中¥{hit}/未命中¥{miss}/输出¥{output}",
			"cost.estimate": "按当前时段价格估算",
			"cost.breakdown": "输入(未命中) {miss} · 输入(命中) {hit} · 输出 {output} tokens",
			"reasoning.note": "思考链按输出 token 计费；价格段 + / ++ 表示 high / max 思考会额外增加输出量"
		};
		const en = {
			"label.spent": "Spent",
			"label.balance": "Balance",
			"label.model": "Model",
			"period.peak": "Peak",
			"period.offPeak": "Off-peak",
			"time.beijing": "Beijing time",
			"time.other": "all other hours",
			"balance.unavailable": "balance unavailable",
			"price.suffix": "/M output",
			"price.row": "hit ¥{hit}/miss ¥{miss}/output ¥{output}",
			"cost.estimate": "estimated at the current period's price",
			"cost.breakdown": "input(miss) {miss} · input(hit) {hit} · output {output} tokens",
			"reasoning.note": "Reasoning tokens are billed as output; + / ++ mark high / max effort which adds extra output"
		};

		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "deepseek-balance: dictionaries");
			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "deepseek-balance",
				order: -100,
				locale: NS,
				inject: (sessionId) => {
					const models = ctx.get("modelDirectories");
					let directory;
					if (models && typeof models.directoryFor === "function") {
						try {
							directory = models.directoryFor(sessionId);
						} catch {}
					}
					return { directory: directory ? directory.store : void 0 };
				}
			}, BillingBadge));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
