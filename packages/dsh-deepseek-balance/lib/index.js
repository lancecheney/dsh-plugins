import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { z } from "zod";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { zstdDecompressSync } from "node:zlib";

/**
 * @lancecheney/dsh-deepseek-balance — host half.
 * - `/api/deepseek-balance` proxies DeepSeek `GET /user/balance` (carries the account currency).
 * - `/api/deepseek-pricing` serves CNY + USD price tables, refreshed daily at
 *   01:00 Beijing time from the official docs, with a hardcoded fallback.
 */

const name = "deepseek-balance";
const inject = ["webServer", "credentials", "settings"];
const Config = z.object({
	tokenName: z.string().default("DeepSeek")
});

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_KEY_ENV = "DEEPSEEK_API_KEY";
const UPSTREAM_TIMEOUT_MS = 8000;
const PRICING_CN_URL = "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/";
const PRICING_US_URL = "https://api-docs.deepseek.com/quick_start/pricing/";
const PRICING_FETCH_TIMEOUT_MS = 15000;

/** Last-known-good prices: legacy + the 2026-08-17 peak/off-peak table, per currency. */
const FALLBACK_PRICING = {
	effectiveFrom: "2026-08-17T00:00:00+08:00",
	currencies: {
		CNY: {
			symbol: "¥",
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
		},
		USD: {
			symbol: "$",
			models: {
				"deepseek-v4-flash": {
					legacy: { hit: 0.0028, miss: 0.14, output: 0.28 },
					peak: { hit: 0.014, miss: 0.44, output: 1.32 },
					offPeak: { hit: 0.007, miss: 0.22, output: 0.66 }
				},
				"deepseek-v4-pro": {
					legacy: { hit: 0.003625, miss: 0.435, output: 0.87 },
					peak: { hit: 0.044, miss: 1.32, output: 3.96 },
					offPeak: { hit: 0.022, miss: 0.66, output: 1.98 }
				}
			}
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

function resolveSettingsSection(ctx) {
	try {
		const settings = ctx.get("settings");
		if (settings && typeof settings.get === "function") {
			return settings.get(settingsNamespace("llm-deepseek"));
		}
	} catch {}
	return void 0;
}

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

const number = (match, index) => {
	const value = Number(match[index]);
	return Number.isFinite(value) ? value : void 0;
};

/** Parse the zh-CN docs page: CNY prices + the effective date. */
function parseCnPricing(html) {
	const text = stripTags(html);
	const parseModel = (id) => {
		const re = new RegExp(id + "\\s+空闲时段\\s+([\\d.]+)元\\s+([\\d.]+)元\\s+([\\d.]+)元\\s+高峰时段\\s+([\\d.]+)元\\s+([\\d.]+)元\\s+([\\d.]+)元");
		const m = text.match(re);
		if (!m) return void 0;
		return {
			offPeak: { hit: number(m, 1), miss: number(m, 2), output: number(m, 3) },
			peak: { hit: number(m, 4), miss: number(m, 5), output: number(m, 6) }
		};
	};
	const flash = parseModel("deepseek-v4-flash");
	const pro = parseModel("deepseek-v4-pro");
	if (!flash || !pro) throw new Error("CNY peak/off-peak table not found");

	let effectiveFrom = FALLBACK_PRICING.effectiveFrom;
	const dm = text.match(/北京时间\s*(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*(\d{1,2}):(\d{2})/);
	if (dm) {
		const [y, mo, d, h, mi] = [1, 2, 3, 4, 5].map((i) => Number(dm[i]));
		effectiveFrom = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+08:00`;
	}

	let legacy;
	const lm = text.match(/百万tokens输入（缓存命中）\s*([\d.]+)元\s*([\d.]+)元\s*百万tokens输入（缓存未命中）\s*([\d.]+)元\s*([\d.]+)元\s*百万tokens输出\s*([\d.]+)元\s*([\d.]+)元/);
	if (lm) {
		legacy = {
			flash: { hit: number(lm, 1), miss: number(lm, 3), output: number(lm, 5) },
			pro: { hit: number(lm, 2), miss: number(lm, 4), output: number(lm, 6) }
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

/** Parse the English docs page: USD prices. */
function parseUsModels(html) {
	const text = stripTags(html);
	const parseModel = (id) => {
		const re = new RegExp(id + "\\s+OFF-PEAK\\s+\\$([\\d.]+)\\s+\\$([\\d.]+)\\s+\\$([\\d.]+)\\s+PEAK\\s+\\$([\\d.]+)\\s+\\$([\\d.]+)\\s+\\$([\\d.]+)", "i");
		const m = text.match(re);
		if (!m) return void 0;
		return {
			offPeak: { hit: number(m, 1), miss: number(m, 2), output: number(m, 3) },
			peak: { hit: number(m, 4), miss: number(m, 5), output: number(m, 6) }
		};
	};
	const flash = parseModel("deepseek-v4-flash");
	const pro = parseModel("deepseek-v4-pro");
	if (!flash || !pro) throw new Error("USD peak/off-peak table not found");

	let legacy;
	const lm = text.match(/1M INPUT TOKENS \(CACHE HIT\)\s+\$([\d.]+)\s+\$([\d.]+)\s+1M INPUT TOKENS \(CACHE MISS\)\s+\$([\d.]+)\s+\$([\d.]+)\s+1M OUTPUT TOKENS\s+\$([\d.]+)\s+\$([\d.]+)/i);
	if (lm) {
		legacy = {
			flash: { hit: number(lm, 1), miss: number(lm, 3), output: number(lm, 5) },
			pro: { hit: number(lm, 2), miss: number(lm, 4), output: number(lm, 6) }
		};
	}

	return {
		"deepseek-v4-flash": { ...(legacy?.flash ? { legacy: legacy.flash } : {}), peak: flash.peak, offPeak: flash.offPeak },
		"deepseek-v4-pro": { ...(legacy?.pro ? { legacy: legacy.pro } : {}), peak: pro.peak, offPeak: pro.offPeak }
	};
}

const pricing = { data: FALLBACK_PRICING, fetchedAt: 0, source: "fallback" };
let pricingRefresh = null;

async function refreshPricing(ctx) {
	if (pricingRefresh) return pricingRefresh;
	pricingRefresh = (async () => {
		const warn = (message) => {
			if (ctx?.logger?.warn) ctx.logger.warn(`deepseek-balance: ${message}`);
		};
		let effectiveFrom = FALLBACK_PRICING.effectiveFrom;
		let cnModels = FALLBACK_PRICING.currencies.CNY.models;
		let usModels = FALLBACK_PRICING.currencies.USD.models;
		try {
			const [cnRes, usRes] = await Promise.all([
				fetch(PRICING_CN_URL, { signal: AbortSignal.timeout(PRICING_FETCH_TIMEOUT_MS), headers: { accept: "text/html" } }),
				fetch(PRICING_US_URL, { signal: AbortSignal.timeout(PRICING_FETCH_TIMEOUT_MS), headers: { accept: "text/html" } })
			]);
			if (cnRes.ok) {
				try {
					const parsed = parseCnPricing(await cnRes.text());
					effectiveFrom = parsed.effectiveFrom;
					cnModels = parsed.models;
				} catch (error) {
					warn(`CNY pricing parse failed: ${error instanceof Error ? error.message : String(error)}`);
				}
			} else {
				warn(`CNY pricing docs HTTP ${cnRes.status}`);
			}
			if (usRes.ok) {
				try {
					usModels = parseUsModels(await usRes.text());
				} catch (error) {
					warn(`USD pricing parse failed: ${error instanceof Error ? error.message : String(error)}`);
				}
			} else {
				warn(`USD pricing docs HTTP ${usRes.status}`);
			}
			pricing.data = {
				effectiveFrom,
				currencies: {
					CNY: { symbol: "¥", models: cnModels },
					USD: { symbol: "$", models: usModels }
				}
			};
			pricing.fetchedAt = Date.now();
			pricing.source = "docs";
		} catch (error) {
			warn(`pricing refresh failed (keeping fallback): ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			pricingRefresh = null;
		}
	})();
	return pricingRefresh;
}

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

/** Beijing hour of a timestamp (UTC+8, no DST). */
function beijingHourOf(time) {
	return new Date(time + 8 * 3600 * 1000).getUTCHours();
}

function isPeakHour(hour) {
	return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18);
}

const bucketSchema = z.object({
	uncachedInputTokens: z.number().int().nonnegative(),
	outputTokens: z.number().int().nonnegative(),
	cacheReadTokens: z.number().int().nonnegative(),
	cacheWriteTokens: z.number().int().nonnegative()
});

const tokenUsageByPeriodSchema = z.object({
	peak: bucketSchema,
	offPeak: bucketSchema
});

const zeroBucket = () => ({ uncachedInputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 });

const bucketsFrom = (usage) => ({
	uncachedInputTokens: usage.inputTokens,
	outputTokens: usage.outputTokens,
	cacheReadTokens: usage.cacheReadTokens ?? 0,
	cacheWriteTokens: usage.cacheWriteTokens ?? 0
});

const bucketsEqual = (a, b) =>
	a.uncachedInputTokens === b.uncachedInputTokens &&
	a.outputTokens === b.outputTokens &&
	a.cacheReadTokens === b.cacheReadTokens &&
	a.cacheWriteTokens === b.cacheWriteTokens;

const addBucket = (total, delta) => ({
	uncachedInputTokens: total.uncachedInputTokens + delta.uncachedInputTokens,
	outputTokens: total.outputTokens + delta.outputTokens,
	cacheReadTokens: total.cacheReadTokens + delta.cacheReadTokens,
	cacheWriteTokens: total.cacheWriteTokens + delta.cacheWriteTokens
});

const subtractBucket = (total, delta) => ({
	uncachedInputTokens: total.uncachedInputTokens - delta.uncachedInputTokens,
	outputTokens: total.outputTokens - delta.outputTokens,
	cacheReadTokens: total.cacheReadTokens - delta.cacheReadTokens,
	cacheWriteTokens: total.cacheWriteTokens - delta.cacheWriteTokens
});

/**
 * Whole-log token usage bucketed by Beijing-time peak/off-peak hour, so the
 * client can price each hour at its own rate. Replacement semantics mirror the
 * token-meter `tokenUsage` projection: an assistant/message finalizes the usage
 * for its turn/step, replacing an earlier usage chunk instead of double counting.
 */
const tokenUsageByPeriodProjection = {
	key: "tokenUsageByPeriod",
	schema: tokenUsageByPeriodSchema,
	init: () => ({ totals: { peak: zeroBucket(), offPeak: zeroBucket() }, last: null }),
	apply: (state, event) => {
		let turn;
		let step;
		let usage;
		if (event.type === "assistant/chunk" && event.data.chunk.type === "usage") {
			({ turn, step } = event.data);
			usage = event.data.chunk.usage;
		} else if (event.type === "assistant/message" && event.data.usage !== void 0) {
			({ turn, step, usage } = event.data);
		} else {
			return state;
		}
		const period = isPeakHour(beijingHourOf(event.time)) ? "peak" : "offPeak";
		const buckets = bucketsFrom(usage);
		const previous = state.last !== null && state.last.turn === turn && state.last.step === step ? state.last : void 0;
		if (previous !== void 0 && previous.period === period && bucketsEqual(previous.buckets, buckets)) return state;
		const totals = { peak: state.totals.peak, offPeak: state.totals.offPeak };
		if (previous !== void 0) totals[previous.period] = subtractBucket(totals[previous.period], previous.buckets);
		totals[period] = addBucket(totals[period], buckets);
		return { totals, last: { turn, step, period, buckets } };
	},
	view: (state) => state.totals,
	stateVersion: 1
};


const ZSTD_MAGIC = 4247762216;

function scanZstdFrames(buffer) {
	const frames = [];
	let offset = 0;
	while (offset < buffer.length) {
		const start = offset;
		if (buffer.length - offset < 4) break;
		if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) break;
		offset += 4;
		const descriptor = buffer.readUInt8(offset);
		offset += 1;
		const contentSizeFlag = descriptor >>> 6;
		const singleSegment = (descriptor & 32) !== 0;
		const checksum = (descriptor & 4) !== 0;
		const dictionaryFlag = descriptor & 3;
		const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
		const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : (1 << contentSizeFlag);
		offset += (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
		for (;;) {
			const blockHeader = buffer.readUIntLE(offset, 3);
			offset += 3;
			const lastBlock = (blockHeader & 1) !== 0;
			const blockType = (blockHeader >>> 1) & 3;
			const blockSize = blockHeader >>> 3;
			offset += blockType === 1 ? 1 : blockSize;
			if (lastBlock) break;
		}
		if (checksum) offset += 4;
		frames.push({ start, end: offset });
	}
	return frames;
}

function dshHome() {
	return process.env.DSH_HOME || join(homedir(), ".dsh");
}

function beijingDayKey(ms) {
	return new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function periodOfUsage(time, effectiveFromMs) {
	if (time < effectiveFromMs) return "flat";
	const hour = new Date(time + 8 * 3600 * 1000).getUTCHours();
	return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18) ? "peak" : "offPeak";
}

function readSessionRecords(path) {
	const buf = readFileSync(path);
	let text;
	if (path.endsWith(".zstd")) {
		const parts = [];
		for (const frame of scanZstdFrames(buf)) parts.push(zstdDecompressSync(buf.subarray(frame.start, frame.end)).toString("utf8"));
		text = parts.join("");
	} else {
		text = buf.toString("utf8");
	}
	const records = [];
	for (const line of text.split("\n")) {
		const t = line.trim();
		if (t === "") continue;
		try { records.push(JSON.parse(t)); } catch {}
	}
	return records;
}

function aggregateSessions(archivedIds = []) {
	const archivedSet = new Set(archivedIds);
	const root = join(dshHome(), "sessions");
	const summary = {
		totalTokens: 0,
		peakTokens: 0,
		offPeakTokens: 0,
		flatTokens: 0,
		dailyPeakTokens: 0,
		longestChatMs: 0,
		currentStreak: 0,
		longestStreak: 0,
		days: {},
		sessions: [],
		modelEffort: {}
	};
	if (!existsSync(root)) return summary;
	const effectiveFromMs = Date.parse(pricing.data.effectiveFrom || FALLBACK_PRICING.effectiveFrom);
	if (!Number.isFinite(effectiveFromMs)) return summary;

	let wsDirs = [];
	try { wsDirs = readdirSync(root); } catch { return summary; }
	for (const wsDir of wsDirs) {
		const wsPath = join(root, wsDir);
		let sDirs = [];
		try { sDirs = readdirSync(wsPath); } catch { continue; }
		for (const sDir of sDirs) {
			const sPath = join(wsPath, sDir);
			const zstd = join(sPath, "session.jsonl.zstd");
			const plain = join(sPath, "session.jsonl");
			const path = existsSync(zstd) ? zstd : existsSync(plain) ? plain : null;
			if (path === null) continue;
			let records;
			try { records = readSessionRecords(path); } catch { continue; }
			let header = null;
			let title = null;
			let model = null;
			let effort = null;
			let firstTime = null;
			let lastTime = null;
			let tokens = 0;
			let peakTokens = 0;
			let offPeakTokens = 0;
			let flatTokens = 0;
			const dayTokens = {};
			for (const r of records) {
				if (r.type === "session" && header === null) { header = r; continue; }
				if (r.type === "session/title" && title === null) title = r.data?.title ?? null;
				if (r.type === "request/header" && model === null) {
					model = r.data?.header?.config?.model ?? null;
					effort = r.data?.header?.config?.reasoningEffort ?? null;
				}
				const time = typeof r.time === "number" ? r.time : null;
				if (time !== null) {
					if (firstTime === null || time < firstTime) firstTime = time;
					if (lastTime === null || time > lastTime) lastTime = time;
				}
				let usage = null;
				if (r.type === "assistant/message" && r.data?.usage) usage = r.data.usage;
				else if (r.type === "assistant/chunk" && r.data?.chunk?.type === "usage") usage = r.data.chunk.usage;
				if (usage && time !== null) {
					const t = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0) + (usage.cacheReadTokens ?? 0);
					const period = periodOfUsage(time, effectiveFromMs);
					const dayKey = beijingDayKey(time);
					tokens += t;
					if (period === "peak") peakTokens += t;
					else if (period === "offPeak") offPeakTokens += t;
					else flatTokens += t;
					dayTokens[dayKey] = dayTokens[dayKey] || { peak: 0, offPeak: 0, flat: 0 };
					dayTokens[dayKey][period] += t;
				}
			}
			summary.totalTokens += tokens;
			summary.peakTokens += peakTokens;
			summary.offPeakTokens += offPeakTokens;
			summary.flatTokens += flatTokens;
			for (const [dayKey, d] of Object.entries(dayTokens)) {
				summary.days[dayKey] = summary.days[dayKey] || { tokens: 0, peak: 0, offPeak: 0, flat: 0 };
				const dayTotal = d.peak + d.offPeak + d.flat;
				summary.days[dayKey].tokens += dayTotal;
				summary.days[dayKey].peak += d.peak;
				summary.days[dayKey].offPeak += d.offPeak;
				summary.days[dayKey].flat += d.flat;
				if (summary.days[dayKey].tokens > summary.dailyPeakTokens) summary.dailyPeakTokens = summary.days[dayKey].tokens;
			}
			const duration = (lastTime ?? 0) - (firstTime ?? 0);
			if (duration > summary.longestChatMs) summary.longestChatMs = duration;
			if (model !== null) {
				const key = `${model}|${effort ?? ""}`;
				summary.modelEffort[key] = summary.modelEffort[key] || { tokens: 0 };
				summary.modelEffort[key].tokens += tokens;
			}
			const sid = header?.id ?? sDir.replace(/^session-/, "");
			summary.sessions.push({
				id: sid,
				title: title ?? header?.id ?? sDir,
				cwd: header?.cwd ?? wsDir,
				tokens,
				peakTokens,
				createdAt: header?.createdAt ?? firstTime,
				endedAt: lastTime,
				archived: archivedSet.has(sid)
			});
		}
	}

	summary.sessions.sort((a, b) => b.tokens - a.tokens);

	const dayKeys = Object.keys(summary.days).sort();
	let longest = 0;
	let run = 0;
	let prev = null;
	for (const d of dayKeys) {
		if (prev === null) run = 1;
		else {
			const diff = Math.round((Date.parse(d) - Date.parse(prev)) / 86400000);
			run = diff === 1 ? run + 1 : 1;
		}
		if (run > longest) longest = run;
		prev = d;
	}
	summary.longestStreak = longest;

	const daySet = new Set(dayKeys);
	let cur = 0;
	let cursor = Date.parse(beijingDayKey(Date.now()));
	while (daySet.has(beijingDayKey(cursor))) {
		cur++;
		cursor -= 86400000;
	}
	summary.currentStreak = cur;

	return summary;
}

const usageCache = { data: null, at: 0 };
const USAGE_CACHE_TTL_MS = 60000;

async function maskApiKey(ctx) {
	try {
		const { apiKey } = await resolveDeepSeekFacts(ctx);
		return apiKey.length > 12 ? `${apiKey.slice(0, 8)}*****${apiKey.slice(-4)}` : `${apiKey.slice(0, 8)}****`;
	} catch {
		return null;
	}
}

function apply(ctx, config = {}) {
	ctx.inject(["sessionProjections"], (projectionCtx) => {
		projectionCtx.sessionProjections.register(tokenUsageByPeriodProjection);
	});

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

	const usageHandler = async (req, res) => {
		if (req.method !== "GET" && req.method !== "HEAD") {
			json(res, 405, { error: "method not allowed" });
			return;
		}
		if (!isTrustedRead(req)) {
			json(res, 403, { error: "forbidden" });
			return;
		}
		if (usageCache.at === 0 || Date.now() - usageCache.at > USAGE_CACHE_TTL_MS) {
			try {
				const ws = ctx.get("workspaceRegistry");
				usageCache.data = aggregateSessions(ws?.archivedSessionIds ?? []);
				usageCache.at = Date.now();
			} catch (error) {
				if (ctx?.logger?.warn) ctx.logger.warn(`deepseek-balance: usage aggregation failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
		const key = await maskApiKey(ctx);
		json(res, 200, {
			...(usageCache.data || aggregateSessions()),
			apiKeyPreview: key,
			tokenName: config.tokenName || "DeepSeek",
			effectiveFrom: pricing.data.effectiveFrom,
			fetchedAt: usageCache.at,
			source: pricing.source
		});
	};

	ctx.effect(() => ctx.webServer.register({ kind: "exact", path: "/api/deepseek-usage", handler: usageHandler }), "deepseek-balance: /api/deepseek-usage route");

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

export { Config, apply, inject, name };
