import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

/**
 * @lancecheney/dsh-deepseek-balance — host half: exposes a same-origin
 * `/api/deepseek-balance` route that proxies the DeepSeek
 * `GET /user/balance` endpoint using the same credential + base-URL facts the
 * llm-deepseek adapter uses, so the browser never sees the API key.
 */

const name = "deepseek-balance";
const inject = ["webServer", "credentials", "settings"];

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_KEY_ENV = "DEEPSEEK_API_KEY";
const UPSTREAM_TIMEOUT_MS = 8000;

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

function apply(ctx) {
  const handler = async (req, res) => {
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
      json(res, 502, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  ctx.effect(
    () => ctx.webServer.register({ kind: "exact", path: "/api/deepseek-balance", handler }),
    "deepseek-balance: /api/deepseek-balance route"
  );
}

export { apply, inject, name };
