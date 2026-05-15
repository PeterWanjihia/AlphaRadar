type SupabaseFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
};

function getSupabaseEnv() {
  return {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function buildUrl(path: string, params?: Record<string, string | number | boolean>) {
  const { url } = getSupabaseEnv();
  if (!url) throw new Error("SUPABASE_URL is not set in environment");

  const base = url.replace(/\/+$/g, "");
  const u = new URL(`${base}/rest/v1/${path}`);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      u.searchParams.set(k, String(v));
    }
  }

  return u.toString();
}

async function supabaseFetch(path: string, options: SupabaseFetchOptions = {}) {
  const env = getSupabaseEnv();
  if (!env.url) throw new Error("SUPABASE_URL not set (env: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)");
  if (!env.serviceRole) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set - leaderboard persistence unavailable");

  const url = buildUrl(path, options.params);

  const headers: Record<string, string> = {
    apikey: env.anonKey ?? "",
    Authorization: `Bearer ${env.serviceRole}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...(options.headers ?? {}),
  };

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error(`Supabase returned invalid JSON: ${e}`);
  }

  if (!res.ok) {
    const errorDetail = typeof json === "object" && json !== null && "message" in json ? (json as { message?: string }).message : String(json);
    const err = {
      status: res.status,
      statusText: res.statusText,
      body: json,
    };
    throw Object.assign(new Error(`Supabase request failed (${res.status}): ${errorDetail}`), err);
  }

  return json;
}

export async function insertIntoTable(table: string, rows: unknown | unknown[]) {
  return supabaseFetch(table, { method: "POST", body: Array.isArray(rows) ? rows : [rows] });
}

export async function selectFromTable(table: string, query?: string) {
  // query should be PostgREST-formatted (e.g. "wallet=eq.abc&select=*")
  return supabaseFetch(`${table}?${query ?? "select=*"}`, { method: "GET" });
}

export async function upsertIntoTable(table: string, rows: unknown | unknown[], onConflict?: string) {
  const headers = onConflict ? { "Prefer": `resolution=merge-duplicates,on_conflict=${onConflict}` } : { "Prefer": "return=representation" };
  return supabaseFetch(table, { method: "POST", body: Array.isArray(rows) ? rows : [rows], headers });
}
