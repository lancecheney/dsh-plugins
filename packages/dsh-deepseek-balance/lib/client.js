window.__ModuleLoader__.load({
	id: "@lancecheney/dsh-deepseek-balance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		const css = ".Dbg1_root{display:inline-flex;align-items:center;gap:6px;height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:18px;padding:0 12px;font-family:var(--dsw-font-family);font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);background:0 0;white-space:nowrap;cursor:pointer}.Dbg1_root:hover{background:var(--dsw-alias-interactive-bg-hover)}.Dbg1_num{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-weight:500}.Dbg1_sep{color:var(--dsw-alias-label-dimmed)}.Dbg1_chip{border-radius:9px;padding:0 8px;font-size:11px;line-height:18px;font-weight:600}.Dbg1_peak{color:var(--dsw-alias-state-warn-primary)}.Dbg1_offPeak{color:var(--dsw-alias-state-success-primary)}.Dbg1_legacy{color:var(--dsw-alias-label-tertiary)}.Dbg1_dimmed{color:var(--dsw-alias-label-dimmed)}.Dbg1_plus{font-size:9px;line-height:1;vertical-align:super;color:var(--dsw-alias-state-warn-primary);font-weight:700}.Dbg1_unit{font-size:10px}";
		const css2 = ".Dp1_backdrop{position:fixed;top:0;bottom:0;right:0;background:rgba(0,0,0,.32);z-index:60}.Dp1_panel{position:fixed;top:0;bottom:0;right:0;z-index:61;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);border-left:1px solid var(--dsw-alias-border-l1);box-shadow:var(--dsw-shadow-lv3);overflow-y:auto}.Dp1_head{display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px 56px 22px;position:relative}.Dp1_avatar{width:64px;height:64px;border-radius:50%;background:var(--dsw-alias-fill-l2);color:var(--dsw-alias-label-primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;flex:none;border:2px solid var(--dsw-alias-border-l2)}.Dp1_name{font-size:18px;font-weight:600;color:var(--dsw-alias-label-primary)}.Dp1_key{font-family:var(--dsw-font-mono);color:var(--dsw-alias-label-tertiary);font-size:13px}.Dp1_close{position:fixed;top:16px;right:16px;cursor:pointer;background:0 0;border:0;color:var(--dsw-alias-label-secondary);font-size:22px;line-height:1;z-index:62}.Dp1_body{padding:0 56px 36px;display:flex;flex-direction:column;gap:26px}.Dp1_stats{display:flex;align-items:center;justify-content:center;gap:56px;flex-wrap:wrap;padding:18px 0}.Dp1_statItem{display:flex;flex-direction:column;align-items:center;gap:4px}.Dp1_statValue{font-size:18px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}.Dp1_statLabel{font-size:12px;color:var(--dsw-alias-label-tertiary)}.Dp1_sepBar{color:var(--dsw-alias-label-dimmed);font-size:14px}.Dp1_balance{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin:0 auto}.Dp1_balanceBlock{position:relative;box-sizing:border-box;width:200px;background:rgba(127,127,127,.10);border-radius:14px;padding:10px 14px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;height:80px}.Dp1_balanceBlockLabel{font-size:12px;color:var(--dsw-alias-label-tertiary)}.Dp1_balanceBlockValue{font-size:28px;font-weight:700;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;margin-top:auto}.Dp1_balanceBlock .Dp1_btn{position:absolute;right:12px;top:10px;height:22px;padding:0 8px;font-size:12px}.Dp1_btn{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-primary);cursor:pointer;font-size:13px}.Dp1_btn:hover{background:var(--dsw-alias-interactive-bg-hover)}.Dp1_btnPrimary{background:#4d6bfe;color:#fff;border:none}.Dp1_section{padding:16px 0}.Dp1_title{font-size:13px;color:var(--dsw-alias-label-secondary);margin:0 0 12px;font-weight:600;letter-spacing:.02em}.Dp1_row{display:flex;align-items:center;gap:8px;padding:7px 0}.Dp1_twoCol{display:flex;flex-wrap:wrap;gap:24px 80px;align-items:flex-start}.Dp1_twoCol .Dp1_section{flex:1 1 260px;min-width:0}.Dp1_rowTitle{flex:1;min-width:0;color:var(--dsw-alias-label-primary);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.Dp1_rowTitleGray{color:var(--dsw-alias-label-dimmed)}.Dp1_rowVal{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-size:13px;flex:none}.Dp1_rank{color:var(--dsw-alias-label-tertiary);width:18px;text-align:right;flex:none;font-size:13px}.Dp1_monthNav{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:14px}.Dp1_monthGrids{display:flex;flex-wrap:wrap;gap:20px}.Dp1_monthGrids .Dp1_monthGroup{flex:1 1 260px;min-width:0}.Dp1_monthGroup{display:flex;flex-direction:column;align-items:center;gap:8px}.Dp1_monthGroupTitle{font-size:12px;color:var(--dsw-alias-label-tertiary)}.Dp1_grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;width:100%;max-width:170px}.Dp1_cell{aspect-ratio:1;border-radius:6px;background:rgba(127,127,127,.08);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--dsw-alias-label-tertiary)}.Dp1_cellFlat{background:#60a5fa;color:#fff}.Dp1_cellPeak{background:#f97316;color:#fff}.Dp1_cellOff{background:#22c55e;color:#fff}.Dp1_cellBlue{color:#fff}.Dp1_legend{display:flex;gap:12px;margin-top:10px;justify-content:center;font-size:11px;color:var(--dsw-alias-label-tertiary);flex-wrap:wrap}.Dp1_dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:middle}.Dp1_nameRow{display:flex;align-items:center;gap:6px}.Dp1_edit{border:0;background:0 0;cursor:pointer;color:var(--dsw-alias-label-tertiary);font-size:14px;padding:2px;line-height:1}.Dp1_edit:hover{color:var(--dsw-alias-label-primary)}.Dp1_editRow{display:flex;align-items:center;gap:8px}.Dp1_editInput{height:30px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-fill-l1);color:var(--dsw-alias-label-primary);font-size:13px;width:180px}@media (max-width:640px){.Dbg1_root{margin-top:80px}.Dp1_head{padding:24px 16px 16px}.Dp1_body{padding:0 16px 24px}.Dp1_stats{gap:20px;padding:12px 0}.Dp1_close{right:12px;top:12px}}";
		const injectCss = (text, tagId) => {
			if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
				const tag = document.createElement("style");
				tag.dataset.plugin = "@lancecheney/dsh-deepseek-balance";
				tag.dataset.pluginCss = tagId;
				tag.textContent = text;
				document.head.appendChild(tag);
			}
		};
		injectCss(css, "@lancecheney/dsh-deepseek-balance/BillingBadge.css");
		injectCss(css2, "@lancecheney/dsh-deepseek-balance/UsagePanel.css");
		const C = { root: "Dbg1_root", num: "Dbg1_num", sep: "Dbg1_sep", chip: "Dbg1_chip", peak: "Dbg1_peak", offPeak: "Dbg1_offPeak", legacy: "Dbg1_legacy", dimmed: "Dbg1_dimmed", plus: "Dbg1_plus", unit: "Dbg1_unit" };
		const P = { backdrop: "Dp1_backdrop", panel: "Dp1_panel", head: "Dp1_head", avatar: "Dp1_avatar", name: "Dp1_name", key: "Dp1_key", close: "Dp1_close", body: "Dp1_body", stats: "Dp1_stats", statItem: "Dp1_statItem", statValue: "Dp1_statValue", statLabel: "Dp1_statLabel", sepBar: "Dp1_sepBar", balance: "Dp1_balance", balanceBlock: "Dp1_balanceBlock", balanceBlockLabel: "Dp1_balanceBlockLabel", balanceBlockValue: "Dp1_balanceBlockValue", btn: "Dp1_btn", btnPrimary: "Dp1_btnPrimary", section: "Dp1_section", title: "Dp1_title", row: "Dp1_row", twoCol: "Dp1_twoCol", rowTitle: "Dp1_rowTitle", rowTitleGray: "Dp1_rowTitleGray", rowVal: "Dp1_rowVal", rank: "Dp1_rank", monthNav: "Dp1_monthNav", monthGrids: "Dp1_monthGrids", monthGroup: "Dp1_monthGroup", monthGroupTitle: "Dp1_monthGroupTitle", grid: "Dp1_grid", cell: "Dp1_cell", cellFlat: "Dp1_cellFlat", cellPeak: "Dp1_cellPeak", cellOff: "Dp1_cellOff", cellBlue: "Dp1_cellBlue", legend: "Dp1_legend", dot: "Dp1_dot", nameRow: "Dp1_nameRow", edit: "Dp1_edit", editRow: "Dp1_editRow", editInput: "Dp1_editInput" };

		const MODEL_META = { "deepseek-v4-pro": { label: "DeepSeek-V4-Pro" }, "deepseek-v4-flash": { label: "DeepSeek-V4-Flash" } };
		const FALLBACK_PRICING = {
			effectiveFrom: "2026-08-17T00:00:00+08:00",
			currencies: {
				CNY: { symbol: "¥", models: { "deepseek-v4-pro": { legacy: { hit: 0.025, miss: 3.0, output: 6.0 }, peak: { hit: 0.30, miss: 9.0, output: 27.0 }, offPeak: { hit: 0.15, miss: 4.5, output: 13.5 } }, "deepseek-v4-flash": { legacy: { hit: 0.02, miss: 1.0, output: 2.0 }, peak: { hit: 0.10, miss: 3.0, output: 9.0 }, offPeak: { hit: 0.05, miss: 1.5, output: 4.5 } } } },
				USD: { symbol: "$", models: { "deepseek-v4-pro": { legacy: { hit: 0.003625, miss: 0.435, output: 0.87 }, peak: { hit: 0.044, miss: 1.32, output: 3.96 }, offPeak: { hit: 0.022, miss: 0.66, output: 1.98 } }, "deepseek-v4-flash": { legacy: { hit: 0.0028, miss: 0.14, output: 0.28 }, peak: { hit: 0.014, miss: 0.44, output: 1.32 }, offPeak: { hit: 0.007, miss: 0.22, output: 0.66 } } } }
			}
		};
		const DEFAULT_MODEL = "deepseek-v4-pro";

		function beijingDecimalHour(now) { let h = 0, m = 0; try { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Shanghai", hour12: false, hour: "2-digit", minute: "2-digit" }).formatToParts(now); for (const x of p) { if (x.type === "hour") h = Number(x.value); if (x.type === "minute") m = Number(x.value); } } catch { h = now.getHours(); m = now.getMinutes(); } return h + m / 60; }
		function periodFor(now, effectiveFrom) { const eff = Date.parse(effectiveFrom); if (Number.isFinite(eff) && now.getTime() < eff) return "legacy"; const h = beijingDecimalHour(now); return (h >= 9 && h < 12) || (h >= 14 && h < 18) ? "peak" : "offPeak"; }
		function firstBalance(data) { const infos = data && data.balance_infos; if (!Array.isArray(infos) || infos.length === 0) return null; return infos.find((r) => r.currency === "CNY") || infos[0]; }
		function fmtPrice(v) { const n = Number(v); return Number.isFinite(n) ? String(n) : String(v); }
		function fmtMoney(v) { const n = Number(v); if (!Number.isFinite(n)) return "—"; if (n <= 0) return "0.00"; if (n < 0.01) return n.toFixed(4); if (n < 1) return n.toFixed(3); return n.toFixed(2); }
		function translate(dict, key, params) { let s = dict[key]; if (s === void 0) return key; if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v)); return s; }
		function fmtTokens(n) { if (!Number.isFinite(n)) return "—"; if (n < 1000) return String(Math.round(n)); const scaled = (v) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10); if (n < 1e6) return scaled(n / 1e3) + "K"; return scaled(n / 1e6) + "M"; }
		function fmtDuration(ms) { if (!Number.isFinite(ms) || ms <= 0) return "—"; const s = ms / 1e3; if (s < 60) return Math.round(s) + "s"; const w = Math.round(s); const h = Math.floor(w / 3600); const m = Math.floor((w % 3600) / 60); if (h > 0) return h + "h" + m + "m"; return m + "m" + (w % 60) + "s"; }
		function beijingDayKey(ms) { return new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10); }
		function beijingMonthKey(ms) { return new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 7); }
		function findFrame() { if (typeof document === "undefined") return null; const overlay = document.querySelector("[data-shell-overlay]"); return overlay && overlay.parentElement ? overlay.parentElement : null; }
		function sidebarWidthOf(frame) { const col = frame && frame.firstElementChild; return col ? col.getBoundingClientRect().width : null; }
		const noopSubscribe = () => () => {};
		function dayColor(d) { if (!d || d.tokens <= 0) return "none"; if (d.flat >= d.peak && d.flat >= d.offPeak) return "flat"; return d.peak >= d.offPeak ? "peak" : "off"; }
		function tokenBlue(tokens, max) { if (!tokens || tokens <= 0 || max <= 0) return null; const r = tokens / max; if (r < 0.2) return "#93c5fd"; if (r < 0.4) return "#60a5fa"; if (r < 0.6) return "#3b82f6"; if (r < 0.8) return "#2563eb"; return "#1e40af"; }
		function monthGrid(year, month, daysData) {
			const first = new Date(Date.UTC(year, month, 1));
			const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
			const lead = (first.getUTCDay() + 6) % 7;
			const cells = [];
			for (let i = 0; i < lead; i++) cells.push(null);
			for (let d = 1; d <= daysInMonth; d++) {
				const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
				cells.push({ day: d, key, data: daysData[key] });
			}
			return cells;
		}

		function BillingBadge(props) {
			const directory = props.directory;
			const sessionId = props.sessionId;
			const [open, setOpen] = react.useState(false);
			const [state, setState] = react.useState({ phase: "loading" });

			react.useEffect(() => {
				let alive = true; let timer;
				const load = async () => {
					try {
						const usageUrl = sessionId ? `/api/deepseek-usage?session=${encodeURIComponent(sessionId)}` : "/api/deepseek-usage";
						const [balanceRes, pricingRes, usageRes] = await Promise.all([
							fetch("/api/deepseek-balance", { headers: { accept: "application/json" }, cache: "no-store" }),
							fetch("/api/deepseek-pricing", { headers: { accept: "application/json" }, cache: "no-store" }),
							fetch(usageUrl, { headers: { accept: "application/json" }, cache: "no-store" })
						]);
						const balanceData = await balanceRes.json().catch(() => ({}));
						const pricingData = await pricingRes.json().catch(() => null);
						const usageData = await usageRes.json().catch(() => null);
						if (!alive) return;
						setState({ phase: "ok", balance: balanceRes.ok ? balanceData : null, pricing: pricingData && pricingRes.ok && pricingData.currencies ? pricingData : FALLBACK_PRICING, usage: usageData && usageData.spend ? usageData : null });
					} catch (e) { if (alive) setState({ phase: "error" }); }
				};
				load(); timer = setInterval(load, 30000);
				return () => { alive = false; clearInterval(timer); };
			}, [sessionId]);

			const pricing = state.pricing || FALLBACK_PRICING;
			const effectiveFrom = pricing.effectiveFrom || FALLBACK_PRICING.effectiveFrom;
			const balanceRow = state.phase === "ok" && state.balance ? firstBalance(state.balance) : null;
			const currency = balanceRow && balanceRow.currency ? balanceRow.currency : "CNY";
			const dict = currency === "USD" ? en : zh;
			const tr = (key, params) => translate(dict, key, params);
			const pricingSet = (pricing.currencies && pricing.currencies[currency]) || pricing.currencies.CNY || FALLBACK_PRICING.currencies.CNY;
			const symbol = pricingSet.symbol || "¥";
			const models = pricingSet.models || FALLBACK_PRICING.currencies.CNY.models;

			const modelState = react.useSyncExternalStore(directory ? (fn) => directory.subscribe(fn) : noopSubscribe, () => (directory ? directory.getSnapshot() : null));
			const currentSelection = modelState && modelState.current ? modelState.current : null;
			const modelId = currentSelection && currentSelection.model ? currentSelection.model : DEFAULT_MODEL;
			const reasoningEffort = currentSelection ? currentSelection.reasoningEffort : void 0;

			const period = periodFor(new Date(), effectiveFrom);
			const isPeak = period === "peak";
			const isLegacy = period === "legacy";
			const model = models[modelId] || models[DEFAULT_MODEL] || FALLBACK_PRICING.currencies.CNY.models[DEFAULT_MODEL];
			const p = (period === "peak" ? model.peak : period === "offPeak" ? model.offPeak : model.legacy) || model.peak;
			const outputPrice = fmtPrice(p.output);
			const cost = state.usage && state.usage.spend ? state.usage.spend.total : null;
			const plus = reasoningEffort === "max" ? "++" : reasoningEffort === "off" ? "" : "+";
			const periodClass = isLegacy ? C.legacy : isPeak ? C.peak : C.offPeak;
			const periodLabel = isLegacy ? tr("period.legacy") : isPeak ? tr("period.peak") : tr("period.offPeak");

			const sep = (key) => react.createElement("span", { key, className: C.sep, "aria-hidden": true }, "|");
			const segs = [];
			segs.push(react.createElement("span", { key: "spent" }, tr("label.spent"), " ", react.createElement("span", { className: C.num }, cost === null ? "—" : `${symbol}${fmtMoney(cost)}`)));
			segs.push(sep("sep1"));
			segs.push(react.createElement("span", { key: "balance" }, tr("label.balance"), " ", react.createElement("span", { className: C.num }, balanceRow !== null ? `${symbol}${fmtMoney(Number(balanceRow.total_balance))}` : (state.phase === "loading" ? "…" : tr("balance.unavailable")))));
			segs.push(sep("sep2"));
			segs.push(react.createElement("span", { key: "period", className: `${C.chip} ${periodClass}` }, periodLabel));
			segs.push(sep("sep3"));
			segs.push(react.createElement("span", { key: "price" }, react.createElement("span", { className: C.unit }, symbol), outputPrice, react.createElement("span", { className: C.unit }, "/M"), plus !== "" ? react.createElement("span", { className: C.plus }, plus) : null));

			return react.createElement(react.Fragment, null,
				react.createElement("button", { type: "button", className: C.root, onClick: () => setOpen(true) }, segs),
				open ? react.createElement(UsagePanel, { sessionId: props.sessionId, currency, symbol, pricing, effectiveFrom, tr, onClose: () => setOpen(false) }) : null
			);
		}

		function UsagePanel({ currency, symbol, pricing, tr, onClose }) {
			const [usageData, setUsageData] = react.useState(null);
			const [balance, setBalance] = react.useState(null);
			const [sidebarW, setSidebarW] = react.useState(280);
			const [monthIdxPeriod, setMonthIdxPeriod] = react.useState(0);
			const [monthIdxTokens, setMonthIdxTokens] = react.useState(0);
			const [editing, setEditing] = react.useState(false);
			const [draft, setDraft] = react.useState("");

			react.useEffect(() => {
				let alive = true;
				(async () => {
					try {
						const [u, b] = await Promise.all([
							fetch("/api/deepseek-usage", { headers: { accept: "application/json" }, cache: "no-store" }).then((r) => r.json()),
							fetch("/api/deepseek-balance", { headers: { accept: "application/json" }, cache: "no-store" }).then((r) => r.json())
						]);
						if (!alive) return;
						setUsageData(u); setBalance(firstBalance(b));
					} catch (e) {}
				})();
				return () => { alive = false; };
			}, []);

			react.useEffect(() => {
				const frame = findFrame();
				const col = frame && frame.firstElementChild;
				if (!col) return;
				const apply = () => setSidebarW(col.getBoundingClientRect().width);
				apply();
				const ro = new ResizeObserver(apply);
				ro.observe(col);
				return () => ro.disconnect();
			}, []);

			const months = react.useMemo(() => {
				const set = new Set();
				const cur = beijingMonthKey(Date.now());
				if (usageData && usageData.days) for (const k of Object.keys(usageData.days)) set.add(k.slice(0, 7));
				set.add(cur);
				return [...set].sort();
			}, [usageData]);
			const monthKeyPeriod = months[months.length - 1 - monthIdxPeriod] || beijingMonthKey(Date.now());
			const [yP, mP] = monthKeyPeriod.split("-").map(Number);
			const cellsPeriod = react.useMemo(() => monthGrid(yP, mP - 1, usageData ? usageData.days : {}), [yP, mP, usageData]);
			const monthKeyTokens = months[months.length - 1 - monthIdxTokens] || beijingMonthKey(Date.now());
			const [yT, mT] = monthKeyTokens.split("-").map(Number);
			const cellsTokens = react.useMemo(() => monthGrid(yT, mT - 1, usageData ? usageData.days : {}), [yT, mT, usageData]);
			const maxDayTokens = react.useMemo(() => {
				if (!usageData || !usageData.days) return 0;
				return Object.values(usageData.days).reduce((m, d) => Math.max(m, d.tokens || 0), 0);
			}, [usageData]);
			const pricingSet = (pricing.currencies && pricing.currencies[currency]) || pricing.currencies.CNY;
			const sym = pricingSet.symbol || "¥";

			const totalSpend = usageData && usageData.spend ? usageData.spend.total : null;
			const todaySpend = usageData && usageData.spend ? usageData.spend.today : null;

			const modelEffortList = react.useMemo(() => {
				if (!usageData || !usageData.modelEffort) return [];
				return Object.entries(usageData.modelEffort).map(([k, v]) => ({ key: k, tokens: v.tokens })).sort((a, b) => b.tokens - a.tokens);
			}, [usageData]);

			const cellFor = (cell) => {
				if (!cell) return react.createElement("div", { key: "b" + Math.random(), className: P.cell });
				const color = dayColor(cell.data);
				const cls = color === "flat" ? P.cell + " " + P.cellFlat : color === "peak" ? P.cell + " " + P.cellPeak : color === "off" ? P.cell + " " + P.cellOff : P.cell;
				return react.createElement("div", { key: cell.key, className: cls, title: cell.key }, cell.day);
			};
			const tokenCellFor = (cell) => {
				if (!cell) return react.createElement("div", { key: "t" + Math.random(), className: P.cell });
				const tokens = cell.data ? cell.data.tokens : 0;
				const color = tokenBlue(tokens, maxDayTokens);
				return react.createElement("div", { key: cell.key, className: P.cell + (color ? " " + P.cellBlue : ""), style: color ? { background: color } : void 0, title: cell.key }, cell.day);
			};

			const modelLabel = (k) => { const [m, e] = k.split("|"); return `${(MODEL_META[m] || {}).label || m}${e ? " · " + e : ""}`; };
			const stat = (label, value) => react.createElement("div", { className: P.statItem }, react.createElement("div", { className: P.statValue }, value), react.createElement("div", { className: P.statLabel }, label));
			const sepBar = (key) => react.createElement("span", { key, className: P.sepBar }, "|");
			const tokenName = usageData && usageData.tokenName ? usageData.tokenName : "API key";
			const saveName = async () => {
				const name = draft.trim() || "API key";
				try {
					const r = await fetch("/api/deepseek-balance/token-name", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tokenName: name }) });
					const d = await r.json();
					setUsageData((u) => (u ? { ...u, tokenName: d.tokenName } : u));
				} catch {}
				setEditing(false);
			};

			return react.createElement(react.Fragment, null,
				react.createElement("div", { className: P.backdrop, style: { left: sidebarW + "px" }, onClick: onClose }),
				react.createElement("div", { className: P.panel, style: { left: sidebarW + "px" } },
					react.createElement("div", { className: P.head },
						react.createElement("div", { className: P.avatar }, tokenName.slice(0, 2).toUpperCase()),
						editing ? react.createElement("div", { className: P.editRow }, react.createElement("input", { className: P.editInput, value: draft, onChange: (e) => setDraft(e.target.value), autoFocus: true }), react.createElement("button", { className: P.btn + " " + P.btnPrimary, onClick: saveName }, tr("panel.save"))) : react.createElement("div", { className: P.nameRow }, react.createElement("span", { className: P.name }, tokenName), react.createElement("button", { className: P.edit, onClick: () => { setDraft(tokenName); setEditing(true); } }, "✎")),
						react.createElement("div", { className: P.key }, usageData && usageData.apiKeyPreview ? usageData.apiKeyPreview : tr("balance.unavailable")),
						react.createElement("button", { className: P.close, onClick: onClose }, "×")
					),
					react.createElement("div", { className: P.body },
						react.createElement("div", { className: P.stats },
							stat(tr("stat.total"), usageData ? fmtTokens(usageData.totalTokens) : "…"), sepBar("s1"),
							stat(tr("stat.dailyPeak"), usageData ? fmtTokens(usageData.dailyPeakTokens) : "…"), sepBar("s2"),
							stat(tr("stat.longest"), usageData ? fmtDuration(usageData.longestChatMs) : "…"), sepBar("s3"),
							stat(tr("stat.curStreak"), usageData ? usageData.currentStreak + tr("unit.day") : "…"), sepBar("s4"),
							stat(tr("stat.longStreak"), usageData ? usageData.longestStreak + tr("unit.day") : "…")
						),
						react.createElement("div", { className: P.balance },
							react.createElement("div", { className: P.balanceBlock },
								react.createElement("div", { className: P.balanceBlockLabel }, tr("stat.today")),
								react.createElement("div", { className: P.balanceBlockValue }, todaySpend !== null ? `${sym}${fmtMoney(todaySpend)}` : "…")
							),
							react.createElement("div", { className: P.balanceBlock },
								react.createElement("div", { className: P.balanceBlockLabel }, tr("stat.cumulative")),
								react.createElement("div", { className: P.balanceBlockValue }, totalSpend !== null ? `${sym}${fmtMoney(totalSpend)}` : "…")
							),
							react.createElement("div", { className: P.balanceBlock },
								react.createElement("div", { className: P.balanceBlockLabel }, tr("label.balance")),
								react.createElement("div", { className: P.balanceBlockValue }, balance ? `${sym}${fmtMoney(Number(balance.total_balance))}` : "…"),
								react.createElement("button", { className: P.btn + " " + P.btnPrimary, onClick: () => window.open("https://platform.deepseek.com/usage", "_blank", "noopener") }, tr("panel.topup"))
							)
						),
						react.createElement("div", { className: P.section },
							react.createElement("h3", { className: P.title }, tr("panel.month")),
							react.createElement("div", { className: P.monthGrids },
								react.createElement("div", { className: P.monthGroup },
									react.createElement("div", { className: P.monthNav },
										react.createElement("button", { className: P.btn, disabled: monthIdxPeriod >= months.length - 1, onClick: () => setMonthIdxPeriod(monthIdxPeriod + 1) }, "‹"),
										react.createElement("span", { className: P.rowVal }, tr("panel.monthPeriod") + " · " + monthKeyPeriod),
										react.createElement("button", { className: P.btn, disabled: monthIdxPeriod <= 0, onClick: () => setMonthIdxPeriod(monthIdxPeriod - 1) }, "›")
									),
									react.createElement("div", { className: P.grid }, cellsPeriod.map(cellFor)),
									react.createElement("div", { className: P.legend },
										react.createElement("span", null, react.createElement("span", { className: P.dot, style: { background: "#60a5fa" } }), tr("legend.flat")),
										react.createElement("span", null, react.createElement("span", { className: P.dot, style: { background: "#f97316" } }), tr("legend.peak")),
										react.createElement("span", null, react.createElement("span", { className: P.dot, style: { background: "#22c55e" } }), tr("legend.off")),
										react.createElement("span", null, react.createElement("span", { className: P.dot, style: { background: "rgba(127,127,127,.15)" } }), tr("legend.none"))
									)
								),
								react.createElement("div", { className: P.monthGroup },
									react.createElement("div", { className: P.monthNav },
										react.createElement("button", { className: P.btn, disabled: monthIdxTokens >= months.length - 1, onClick: () => setMonthIdxTokens(monthIdxTokens + 1) }, "‹"),
										react.createElement("span", { className: P.rowVal }, tr("panel.monthTokens") + " · " + monthKeyTokens),
										react.createElement("button", { className: P.btn, disabled: monthIdxTokens <= 0, onClick: () => setMonthIdxTokens(monthIdxTokens - 1) }, "›")
									),
									react.createElement("div", { className: P.grid }, cellsTokens.map(tokenCellFor)),
									react.createElement("div", { className: P.legend },
										react.createElement("span", null, react.createElement("span", { className: P.dot, style: { background: "#93c5fd" } }), tr("legend.less")),
										react.createElement("span", null, react.createElement("span", { className: P.dot, style: { background: "#1e40af" } }), tr("legend.more"))
									)
								)
							)
						),
						react.createElement("div", { className: P.twoCol },
							react.createElement("div", { className: P.section },
								react.createElement("h3", { className: P.title }, tr("panel.topSessions")),
								(usageData ? (usageData.sessions || []).slice(0, 8) : []).map((s, i) => react.createElement("div", { key: s.id, className: P.row },
									react.createElement("span", { className: P.rank }, String(i + 1)),
									react.createElement("span", { className: P.rowTitle + (s.archived ? " " + P.rowTitleGray : "") }, s.title || s.id),
									react.createElement("span", { className: P.rowVal }, fmtTokens(s.tokens))
								))
							),
							react.createElement("div", { className: P.section },
								react.createElement("h3", { className: P.title }, tr("panel.peakSessions")),
								(usageData ? [...(usageData.sessions || [])].sort((a, b) => b.peakTokens - a.peakTokens).slice(0, 5) : []).map((s, i) => react.createElement("div", { key: s.id, className: P.row },
									react.createElement("span", { className: P.rank }, String(i + 1)),
									react.createElement("span", { className: P.rowTitle }, s.title || s.id),
									react.createElement("span", { className: P.rowVal }, fmtTokens(s.peakTokens))
								))
							)
						),
						react.createElement("div", { className: P.twoCol },
							react.createElement("div", { className: P.section },
								react.createElement("h3", { className: P.title }, tr("panel.modelEffort")),
								modelEffortList.map((m) => react.createElement("div", { key: m.key, className: P.row },
									react.createElement("span", { className: P.rowTitle }, modelLabel(m.key)),
									react.createElement("span", { className: P.rowVal }, fmtTokens(m.tokens))
								))
							)
						)
					)
				)
			);
		}

		const NS = "deepseek-balance";
		const zh = {
			"label.spent": "消耗", "label.balance": "余额", "label.model": "模型",
			"period.peak": "高峰", "period.offPeak": "空闲", "period.legacy": "平价",
			"balance.unavailable": "余额不可用",
			"panel.stats": "统计", "panel.balance": "余额与消耗", "panel.topup": "跳转API官网", "panel.save": "保存",
			"panel.topSessions": "消耗最多的对话", "panel.month": "每日分布", "panel.monthPeriod": "每日时段分布", "panel.monthTokens": "每日 Token 消耗", "panel.peakSessions": "高峰消耗排行", "panel.modelEffort": "模型与思考强度",
			"stat.total": "累计 Token", "stat.dailyPeak": "每日峰值", "stat.longest": "最长聊天", "stat.curStreak": "当前连续", "stat.longStreak": "最长连续", "stat.today": "今日消耗", "stat.cumulative": "累计消耗",
			"unit.day": " 天",
			"legend.flat": "平价", "legend.peak": "高峰", "legend.off": "空闲", "legend.none": "无数据", "legend.less": "少", "legend.more": "多"
		};
		const en = {
			"label.spent": "Spent", "label.balance": "Balance", "label.model": "Model",
			"period.peak": "Peak", "period.offPeak": "Off-peak", "period.legacy": "Flat",
			"balance.unavailable": "balance unavailable",
			"panel.stats": "Stats", "panel.balance": "Balance & Spend", "panel.topup": "API site", "panel.save": "Save",
			"panel.topSessions": "Top conversations", "panel.month": "Daily", "panel.monthPeriod": "Daily period", "panel.monthTokens": "Daily token usage", "panel.peakSessions": "Peak-hour ranking", "panel.modelEffort": "Model & effort",
			"stat.total": "Total tokens", "stat.dailyPeak": "Daily peak", "stat.longest": "Longest chat", "stat.curStreak": "Current streak", "stat.longStreak": "Longest streak", "stat.today": "Today", "stat.cumulative": "Total",
			"unit.day": "d",
			"legend.flat": "Flat", "legend.peak": "Peak", "legend.off": "Off-peak", "legend.none": "None", "legend.less": "Less", "legend.more": "More"
		};

		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "deepseek-balance: dictionaries");
			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "deepseek-balance",
				order: -100,
				inject: (sessionId) => {
					const models = ctx.get("modelDirectories");
					let directory;
					if (models && typeof models.directoryFor === "function") { try { directory = models.directoryFor(sessionId); } catch {} }
					return { directory: directory ? directory.store : void 0, sessionId };
				}
			}, BillingBadge));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
