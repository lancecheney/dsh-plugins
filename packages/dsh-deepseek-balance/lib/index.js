import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

/**
 * @lancecheney/dsh-deepseek-balance — host half.
 * - `/api/deepseek-balance` proxies DeepSeek `GET /user/balance`.
 * - `/api/deepseek-pricing` serves the price table, refreshed from the official
 *   docs page daily at 01:00 Beijing time (plus once at startup), with a
 *   hardcoded fallback if the scrape ever fails.
 */

const name = "deepseek-balance";
const inject = ["webServer", "credentials", "settings"];

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_KEY_ENV = "DEEPSEEK_API_KEY";
const UPSTREAM_TIMEOUT_MS = 8000;
const PRICING_DOCS_URL = "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/";
const PRICING_FETCH_TIMEOUT_MS = 15000;

/** Last-known-good prices: current legacy + the 2026-08-17 peak/off-peak table (CNY / 1M tokens). */
const FALLBACK_PRICING = {
	effectiveFrom: "2026-08-17T00:00:00+08:00",
	models: {
		"deepseek-v4-flash": {
			legacy: { hit: 0.02, miss: 1.0, output: 2.0 },
			peak: { hit: 0.10, miss: 3.0, output: 9.0 },
			offPeak: { hit: 0.05, miss: 1.5, output: 4.5 }
		},
		"deepseek-v4-pro": {
			legacy: { hit: 0.025, miss: 3.0, output: 6.0 },
			peak: { hit: 0.30, miss: 9.0, output: 27.0 },
			offPeak: { hit: 0.15, miss: 4.5, output: 13.5 }
		}
	}
};

function json(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(payload);
}

/** Read the resolved `llm-deepseek` settings section, tolerating absence. */
function resolveSettingsSection(ctx) {
	try {
		const settings = ctx.get("settings");
		if (settings && typeof settings.get === "function") {
			return settings.get(settingsNamespace("llm-deepseek"));
		}
	} catch {}
	return void 0;
}

/** Resolve the API key + base URL exactly like llm-deepseek: credentials seam, then env. */
async function resolveDeepSeekFacts(ctx) {
	const section = resolveSettingsSection(ctx);
	const apiKeyEnv =
		section && typeof section === "object" && typeof section.apiKeyEnv === "string" && section.apiKeyEnv.length > 0
			? section.apiKeyEnv
			: DEFAULT_KEY_ENV;
	const baseURL =
		(section && typeof section === "object" && typeof section.baseURL === "string" && section.baseURL.length > 0
			? section.baseURL
			: process.env.DEEPSEEK_BASE_URL) || DEFAULT_BASE_URL;

	let apiKey;
	const credentials = ctx.get("credentials");
	if (credentials && typeof credentials.resolve === "function") {
		try {
			const hit = await credentials.resolve(credentialRef(apiKeyEnv));
			if (hit && hit.value) apiKey = hit.value;
		} catch {}
	}
	if (!apiKey) apiKey = process.env[apiKeyEnv];
	if (!apiKey) throw new Error(`no DeepSeek API key (resolve ${apiKeyEnv} through credentials or env)`);

	return { apiKey, baseURL: String(baseURL).replace(/\/+$/, "") };
}

/** Minimal same-origin fence mirroring the /api carrier's Host/Origin checks. */
function isTrustedRead(req) {
	if (req.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = req.headers.origin;
	if (origin === void 0) return true;
	try {
		const originHost = new URL(origin).host;
		const host = req.headers.host ?? "";
		const hostWithoutPort = host.replace(/:\d+$/, "");
		return originHost === hostWithoutPort || originHost.replace(/:\d+$/, "") === hostWithoutPort;
	} catch {
		return false;
	}
}

function stripTags(html) {
	return html
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ");
}

/**
 * Parse the official pricing page (tag-stripped text) into the model price table.
 * Throws when the peak/off-peak table is absent, so the caller keeps the fallback.
 */
function parsePricing(html) {
	const text = stripTags(html);
	const number = (match, index) => {
		const value = Number(match[index]);
		return Number.isFinite(value) ? value : void 0;
	};

	const parseModel = (id) => {
		const re = new RegExp(
			id + "\\s+空闲时段\\s+([\\d.]+)元\\s+([\\d.]+)元\\s+([\\d.]+)元\\s+高峰时段\\s+([\\d.]+)元\\s+([\\d.]+)元\\s+([\\d.]+)元"
		);
		const m = text.match(re);
		if (!m) return void 0;
		return {
			offPeak: { hit: number(m, 1), miss: number(m, 2), output: number(m, 3) },
			peak: { hit: number(m, 4), miss: number(m, 5), output: number(m, 6) }
		};
	};

	const flash = parseModel("deepseek-v4-flash");
	const pro = parseModel("deepseek-v4-pro");
	if (!flash || !pro) throw new Error("peak/off-peak price table not found on the docs page");

	let effectiveFrom = FALLBACK_PRICING.effectiveFrom;
	const dateMatch = text.match(/北京时间\s*(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*(\d{1,2}):(\d{2})/);
	if (dateMatch) {
		const [y, mo, d, h, mi] = [1, 2, 3, 4, 5].map((i) => Number(dateMatch[i]));
		effectiveFrom = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+08:00`;
	}

	let legacy;
	const legacyMatch = text.match(/百万tokens输入（缓存命中）\s*([\d.]+)元\s*([\d.]+)元\s*百万tokens输入（缓存未命中）\s*([\d.]+)元\s*([\d.]+)元\s*百万tokens输出\s*([\d.]+)元\s*([\d.]+)元/);
	if (legacyMatch) {
		legacy = {
			"deepseek-v4-flash": { hit: number(legacyMatch, 1), miss: number(legacyMatch, 3), output: number(legacyMatch, 5) },
			"deepseek-v4-pro": { hit: number(legacyMatch, 2), miss: number(legacyMatch, 4), output: number(legacyMatch, 6) }
		};
	}

	return {
		effectiveFrom,
		models: {
			"deepseek-v4-flash": { ...(legacy?.flash ? { legacy: legacy.flash } : {}), peak: flash.peak, offPeak: flash.offPeak },
			"deepseek-v4-pro": { ...(legacy?.pro ? { legacy: legacy.pro } : {}), peak: pro.peak, offPeak: pro.offPeak }
		}
	};
}

const pricing = { data: FALLBACK_PRICING, fetchedAt: 0, source: "fallback" };
let pricingRefresh = null;

async function refreshPricing(ctx) {
	if (pricingRefresh) return pricingRefresh;
	pricingRefresh = (async () => {
		try {
			const res = await fetch(PRICING_DOCS_URL, {
				signal: AbortSignal.timeout(PRICING_FETCH_TIMEOUT_MS),
				headers: { accept: "text/html" }
			});
			if (!res.ok) throw new Error(`pricing docs HTTP ${res.status}`);
			const parsed = parsePricing(await res.text());
			pricing.data = parsed;
			pricing.fetchedAt = Date.now();
			pricing.source = "docs";
		} catch (error) {
			if (ctx?.logger?.warn) ctx.logger.warn(`deepseek-balance: pricing refresh failed (keeping fallback): ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			pricingRefresh = null;
		}
	})();
	return pricingRefresh;
}

/** Milliseconds until the next `hour`:00 in Beijing time (UTC+8, no DST). */
function msUntilNextHourBeijing(hour) {
	const now = new Date();
	const beijing = new Date(now.getTime() + 8 * 3600 * 1000);
	const bHour = beijing.getUTCHours();
	const bMinute = beijing.getUTCMinutes();
	const bSecond = beijing.getUTCSeconds();
	const bMs = beijing.getUTCMilliseconds();
	let deltaHours = hour - bHour;
	if (deltaHours < 0 || (deltaHours === 0 && (bMinute > 0 || bSecond > 0 || bMs > 0))) deltaHours += 24;
	return deltaHours * 3600 * 1000 - bMinute * 60 * 1000 - bSecond * 1000 - bMs;
}

function apply(ctx) {
	const balanceHandler = async (req, res) => {
		if (req.method !== "GET" && req.method !== "HEAD") {
			json(res, 405, { error: "method not allowed" });
			return;
		}
		if (!isTrustedRead(req)) {
			json(res, 403, { error: "forbidden" });
			return;
		}
		try {
			const { apiKey, baseURL } = await resolveDeepSeekFacts(ctx);
			const upstream = await fetch(`${baseURL}/user/balance`, {
				method: "GET",
				headers: {
					authorization: `Bearer ${apiKey}`,
					accept: "application/json"
				},
				signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
			});
			const body = await upstream.json().catch(() => ({}));
			if (!upstream.ok) {
				const message = body?.error?.message || `DeepSeek balance API HTTP ${upstream.status}`;
				json(res, upstream.status === 401 || upstream.status === 403 ? 401 : 502, { error: message });
				return;
			}
			json(res, 200, body);
		} catch (error) {
			json(res, 502, { error: error instanceof Error ? error.message : String(error) });
		}
	};

	const pricingHandler = async (req, res) => {
		if (req.method !== "GET" && req.method !== "HEAD") {
			json(res, 405, { error: "method not allowed" });
			return;
		}
		if (!isTrustedRead(req)) {
			json(res, 403, { error: "forbidden" });
			return;
		}
		if (pricing.fetchedAt === 0) {
			try {
				await refreshPricing(ctx);
			} catch {}
		}
		json(res, 200, {
			...pricing.data,
			fetchedAt: pricing.fetchedAt,
			source: pricing.source
		});
	};

	ctx.effect(() => ctx.webServer.register({ kind: "exact", path: "/api/deepseek-balance", handler: balanceHandler }), "deepseek-balance: /api/deepseek-balance route");
	ctx.effect(() => ctx.webServer.register({ kind: "exact", path: "/api/deepseek-pricing", handler: pricingHandler }), "deepseek-balance: /api/deepseek-pricing route");

	ctx.effect(() => {
		refreshPricing(ctx).catch(() => {});
		let timer;
		const schedule = () => {
			const delay = msUntilNextHourBeijing(1);
			timer = setTimeout(async () => {
				await refreshPricing(ctx).catch(() => {});
				schedule();
			}, delay);
		};
		schedule();
		return () => clearTimeout(timer);
	}, "deepseek-balance: daily 01:00 Beijing pricing refresh");
}

export { apply, inject, name };
