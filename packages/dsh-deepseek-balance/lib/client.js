window.__ModuleLoader__.load({
	id: "@lancecheney/dsh-deepseek-balance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		const css = ".Dbg1_root{display:inline-flex;align-items:center;gap:6px;height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:18px;padding:0 12px;font-family:var(--dsw-font-family);font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);background:0 0;white-space:nowrap}.Dbg1_num{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-weight:500}.Dbg1_sep{color:var(--dsw-alias-label-dimmed)}.Dbg1_chip{border-radius:9px;padding:0 8px;font-size:11px;line-height:18px;font-weight:600}.Dbg1_peak{color:var(--dsw-alias-state-warn-primary)}.Dbg1_offPeak{color:var(--dsw-alias-state-success-primary)}.Dbg1_legacy{color:var(--dsw-alias-label-tertiary)}.Dbg1_dimmed{color:var(--dsw-alias-label-dimmed)}.Dbg1_plus{font-size:9px;line-height:1;vertical-align:super;color:var(--dsw-alias-state-warn-primary);font-weight:700}";
		const tagId = "@lancecheney/dsh-deepseek-balance/BillingBadge.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@lancecheney/dsh-deepseek-balance";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		const cssModule = { root: "Dbg1_root", num: "Dbg1_num", sep: "Dbg1_sep", chip: "Dbg1_chip", peak: "Dbg1_peak", offPeak: "Dbg1_offPeak", legacy: "Dbg1_legacy", dimmed: "Dbg1_dimmed", plus: "Dbg1_plus" };

		const MODEL_META = {
			"deepseek-v4-pro": { label: "DeepSeek-V4-Pro" },
			"deepseek-v4-flash": { label: "DeepSeek-V4-Flash" }
		};

		/** Last-known-good prices (per currency), used only while the host pricing fetch is unavailable. */
		const FALLBACK_PRICING = {
			effectiveFrom: "2026-08-17T00:00:00+08:00",
			currencies: {
				CNY: {
					symbol: "¥",
					models: {
						"deepseek-v4-pro": {
							legacy: { hit: 0.025, miss: 3.0, output: 6.0 },
							peak: { hit: 0.30, miss: 9.0, output: 27.0 },
							offPeak: { hit: 0.15, miss: 4.5, output: 13.5 }
						},
						"deepseek-v4-flash": {
							legacy: { hit: 0.02, miss: 1.0, output: 2.0 },
							peak: { hit: 0.10, miss: 3.0, output: 9.0 },
							offPeak: { hit: 0.05, miss: 1.5, output: 4.5 }
						}
					}
				},
				USD: {
					symbol: "$",
					models: {
						"deepseek-v4-pro": {
							legacy: { hit: 0.003625, miss: 0.435, output: 0.87 },
							peak: { hit: 0.044, miss: 1.32, output: 3.96 },
							offPeak: { hit: 0.022, miss: 0.66, output: 1.98 }
						},
						"deepseek-v4-flash": {
							legacy: { hit: 0.0028, miss: 0.14, output: 0.28 },
							peak: { hit: 0.014, miss: 0.44, output: 1.32 },
							offPeak: { hit: 0.007, miss: 0.22, output: 0.66 }
						}
					}
				}
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

		/** legacy (pre effective date) → flat price; otherwise peak/off-peak by Beijing time. */
		function periodFor(now, effectiveFrom) {
			const eff = Date.parse(effectiveFrom);
			if (Number.isFinite(eff) && now.getTime() < eff) return "legacy";
			const h = beijingDecimalHour(now);
			return (h >= 9 && h < 12) || (h >= 14 && h < 18) ? "peak" : "offPeak";
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

		function fmtMoney(value) {
			const n = Number(value);
			if (!Number.isFinite(n)) return "—";
			if (n <= 0) return "0.00";
			if (n < 0.01) return n.toFixed(4);
			if (n < 1) return n.toFixed(3);
			return n.toFixed(2);
		}

		/** Estimated cost for a session's token-usage projection under one price set. */
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
						const [balanceRes, pricingRes] = await Promise.all([
							fetch("/api/deepseek-balance", { headers: { accept: "application/json" }, cache: "no-store" }),
							fetch("/api/deepseek-pricing", { headers: { accept: "application/json" }, cache: "no-store" })
						]);
						const balanceData = await balanceRes.json().catch(() => ({}));
						const pricingData = await pricingRes.json().catch(() => null);
						if (!alive) return;
						setState({
							phase: "ok",
							balance: balanceRes.ok ? balanceData : null,
							balanceError: balanceRes.ok ? null : (balanceData.error || `HTTP ${balanceRes.status}`),
							pricing: pricingData && pricingRes.ok && pricingData.currencies ? pricingData : FALLBACK_PRICING
						});
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

			const pricing = state.pricing || FALLBACK_PRICING;
			const effectiveFrom = pricing.effectiveFrom || FALLBACK_PRICING.effectiveFrom;
			const balanceRow = state.phase === "ok" && state.balance ? firstBalance(state.balance) : null;
			const currency = balanceRow && balanceRow.currency ? balanceRow.currency : "CNY";
			const pricingSet = (pricing.currencies && pricing.currencies[currency]) || pricing.currencies.CNY || FALLBACK_PRICING.currencies.CNY;
			const symbol = pricingSet.symbol || "¥";
			const models = pricingSet.models || FALLBACK_PRICING.currencies.CNY.models;

			const modelState = react.useSyncExternalStore(
				directory ? (fn) => directory.subscribe(fn) : noopSubscribe,
				() => (directory ? directory.getSnapshot() : null)
			);
			const currentSelection = modelState && modelState.current ? modelState.current : null;
			const modelId = currentSelection && currentSelection.model ? currentSelection.model : DEFAULT_MODEL;
			const reasoningEffort = currentSelection ? currentSelection.reasoningEffort : void 0;

			const period = periodFor(new Date(), effectiveFrom);
			const isPeak = period === "peak";
			const isLegacy = period === "legacy";
			const model = models[modelId] || models[DEFAULT_MODEL] || FALLBACK_PRICING.currencies.CNY.models[DEFAULT_MODEL];
			const p = (period === "peak" ? model.peak : period === "offPeak" ? model.offPeak : model.legacy) || model.peak;
			const outputPrice = fmtPrice(p.output);
			const cost = usage !== undefined && usage !== null ? costOf(usage, p) : null;

			// off → base price; high (default) → one +; max → two +.
			const plus = reasoningEffort === "max" ? "++" : reasoningEffort === "off" ? "" : "+";

			const periodClass = isLegacy ? cssModule.legacy : isPeak ? cssModule.peak : cssModule.offPeak;
			const periodLabel = isLegacy ? t("period.legacy") : isPeak ? t("period.peak") : t("period.offPeak");

			const tooltipParts = [
				isLegacy ? t("period.legacyNote") : `${t("period.peak")}: 09:00–12:00, 14:00–18:00 (${t("time.beijing")})`,
				isLegacy ? "" : `${t("period.offPeak")}: ${t("time.other")}`,
				"",
				`${t("label.model")}: ${(MODEL_META[modelId] || {}).label || modelId}${reasoningEffort ? ` · ${reasoningEffort}` : ""}`,
				t("reasoning.note")
			].filter((line) => line !== "");
			if (cost !== null && usage) {
				tooltipParts.push(
					"",
					`${t("label.spent")}: ${symbol}${fmtMoney(cost)} (${t("cost.estimate")})`,
					t("cost.breakdown", {
						miss: (usage.uncachedInputTokens ?? 0) + (usage.cacheWriteTokens ?? 0),
						hit: usage.cacheReadTokens ?? 0,
						output: usage.outputTokens ?? 0
					})
				);
			}
			tooltipParts.push("");
			for (const [id, info] of Object.entries(models)) {
				const meta = MODEL_META[id] || {};
				const row = t("price.row", { sym: symbol, hit: fmtPrice(info.peak.hit), miss: fmtPrice(info.peak.miss), output: fmtPrice(info.peak.output) });
				const off = t("price.row", { sym: symbol, hit: fmtPrice(info.offPeak.hit), miss: fmtPrice(info.offPeak.miss), output: fmtPrice(info.offPeak.output) });
				const legacy = info.legacy ? t("price.row", { sym: symbol, hit: fmtPrice(info.legacy.hit), miss: fmtPrice(info.legacy.miss), output: fmtPrice(info.legacy.output) }) : null;
				tooltipParts.push(
					`${meta.label || id} — ${t("period.peak")}: ${row} / ${t("period.offPeak")}: ${off}${legacy ? ` / ${t("period.legacy")}: ${legacy}` : ""}`
				);
			}
			const tooltip = tooltipParts.join("\n");

			const sep = (key) => react.createElement("span", { key, className: cssModule.sep, "aria-hidden": true }, "|");

			const segs = [];
			segs.push(react.createElement("span", { key: "spent" },
				t("label.spent"), " ",
				react.createElement("span", { className: cssModule.num }, cost === null ? "—" : `${symbol}${fmtMoney(cost)}`)));
			segs.push(sep("sep1"));
			segs.push(react.createElement("span", { key: "balance" },
				t("label.balance"), " ",
				react.createElement("span", { className: cssModule.num },
					balanceRow !== null ? `${symbol}${fmtMoney(Number(balanceRow.total_balance))}` : (state.phase === "loading" ? "…" : t("balance.unavailable")))));
			segs.push(sep("sep2"));
			segs.push(react.createElement("span", { key: "period", className: `${cssModule.chip} ${periodClass}` }, periodLabel));
			segs.push(sep("sep3"));
			segs.push(react.createElement("span", { key: "price" },
				`${symbol}${outputPrice}`,
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
			"period.legacy": "平价",
			"period.legacyNote": "当前为调价前平价（8/17 前）",
			"time.beijing": "北京时间",
			"time.other": "其余时段",
			"balance.unavailable": "余额不可用",
			"price.suffix": "/M 输出",
			"price.row": "命中{sym}{hit}/未命中{sym}{miss}/输出{sym}{output}",
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
			"period.legacy": "Flat",
			"period.legacyNote": "Pre-change flat pricing (before Aug 17)",
			"time.beijing": "Beijing time",
			"time.other": "all other hours",
			"balance.unavailable": "balance unavailable",
			"price.suffix": "/M output",
			"price.row": "hit {sym}{hit}/miss {sym}{miss}/output {sym}{output}",
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
