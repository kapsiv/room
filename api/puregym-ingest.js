import { get, put } from "@vercel/blob";

const CSV_HEADER =
  "date,entered_at,left_at,duration_minutes,is_duration_estimated,gym_id,gym_name";
const CSV_PATH = process.env.PUREGYM_VISITS_BLOB_PATH || "scrobbles/activ/visit_history.csv";
const BLOB_ACCESS = process.env.PUREGYM_VISITS_BLOB_ACCESS || "private";
const PUREGYM_EMAIL = process.env.PUREGYM_EMAIL;
const PUREGYM_PIN = process.env.PUREGYM_PIN;
const PUREGYM_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "PureGym/1523 CFNetwork/1312 Darwin/21.0.0",
};

function normalizeAuth(header) {
  if (!header) return "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return header.trim();
}

function getAuthHeader(request) {
  if (!request?.headers) return "";
  if (typeof request.headers.get === "function") {
    return request.headers.get("authorization") || "";
  }
  return request.headers.authorization || request.headers.Authorization || "";
}

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return normalizeAuth(getAuthHeader(request)) === secret;
}

function csvEscape(value) {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

function parseCsvRows(csvText) {
  return String(csvText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getLastVisitKeyFromCsv(csvText) {
  const rows = parseCsvRows(csvText);
  if (rows.length <= 1) return "";
  for (let i = rows.length - 1; i >= 1; i -= 1) {
    const match = rows[i].match(/^"([^"]*)","([^"]*)"/);
    if (match) return `${match[1]}T${match[2]}`;
  }
  return "";
}

async function fetchExistingCsv() {
  try {
    const blob = await get(CSV_PATH, { access: BLOB_ACCESS });
    if (blob) {
      const text = await new Response(blob.stream).text();
      return { text };
    }
  } catch (err) {
    if (err?.code !== "BLOB_NOT_FOUND") throw err;
  }

  return { text: `${CSV_HEADER}\n` };
}

async function authenticatePureGym() {
  if (!PUREGYM_EMAIL || !PUREGYM_PIN) {
    throw new Error("Missing PUREGYM_EMAIL or PUREGYM_PIN env vars");
  }

  const data = new URLSearchParams({
    grant_type: "password",
    username: PUREGYM_EMAIL,
    password: PUREGYM_PIN,
    scope: "pgcapi",
    client_id: "ro.client",
  });

  const response = await fetch("https://auth.puregym.com/connect/token", {
    method: "POST",
    headers: PUREGYM_HEADERS,
    body: data,
  });

  if (!response.ok) {
    throw new Error(`PureGym auth failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

async function fetchMemberActivity(accessToken) {
  const response = await fetch("https://capi.puregym.com/api/v2/gymSessions/member", {
    headers: {
      ...PUREGYM_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`PureGym member activity failed: ${response.status}`);
  }

  return response.json();
}

function parseLocalDateTime(value) {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0),
  };
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function addMinutesToLocalDateTime(value, minutesToAdd) {
  const parsed = parseLocalDateTime(value);
  if (!parsed || !Number.isFinite(minutesToAdd)) return null;
  const date = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute, parsed.second),
  );
  date.setUTCMinutes(date.getUTCMinutes() + minutesToAdd);
  return {
    date: `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`,
    time: `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`,
  };
}

function buildVisitKey(row) {
  return `${row.date}T${row.entered_at}`;
}

function buildVisitRows(memberActivity) {
  const visits = memberActivity?.Visits ?? [];
  return visits
    .map((visit) => {
      const startTime = String(visit?.StartTime || "");
      const durationMinutes = Number(visit?.Duration);
      const leftAt = addMinutesToLocalDateTime(startTime, durationMinutes);
      const enteredAtParts = parseLocalDateTime(startTime);
      const visitGym = visit?.Gym ?? {};

      if (!enteredAtParts) return null;

      return {
        date: `${pad2(enteredAtParts.year).padStart(4, "0")}-${pad2(enteredAtParts.month)}-${pad2(enteredAtParts.day)}`,
        entered_at: `${pad2(enteredAtParts.hour)}:${pad2(enteredAtParts.minute)}`,
        left_at: leftAt?.time || "",
        duration_minutes: Number.isFinite(durationMinutes) ? durationMinutes : "",
        is_duration_estimated: visit?.IsDurationEstimated === true ? "true" : "false",
        gym_id: visitGym?.Id ?? "",
        gym_name: visitGym?.Name ?? "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => buildVisitKey(a).localeCompare(buildVisitKey(b)));
}

function buildCsvLines(rows) {
  return rows
    .map((row) => {
      return [
        row.date,
        row.entered_at,
        row.left_at,
        row.duration_minutes,
        row.is_duration_estimated,
        row.gym_id,
        row.gym_name,
      ]
        .map(csvEscape)
        .join(",");
    })
    .join("\n");
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAuthorized(request)) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { text: existingCsv } = await fetchExistingCsv();
    const lastVisitKey = getLastVisitKeyFromCsv(existingCsv);
    const accessToken = await authenticatePureGym();
    const memberActivity = await fetchMemberActivity(accessToken);
    const rows = buildVisitRows(memberActivity);
    const newRows = rows.filter((row) => buildVisitKey(row) > lastVisitKey);

    if (!newRows.length) {
      response.status(200).json({
        appended: 0,
        lastVisitKey,
        totalVisits: memberActivity?.Summary?.Total?.Visits ?? rows.length,
      });
      return;
    }

    const csvLines = buildCsvLines(newRows);
    const needsNewline = existingCsv && !existingCsv.endsWith("\n");
    const updatedCsv = `${existingCsv}${needsNewline ? "\n" : ""}${csvLines}\n`;

    await put(CSV_PATH, updatedCsv, {
      access: BLOB_ACCESS,
      contentType: "text/csv",
      cacheControlMaxAge: 60,
      allowOverwrite: true,
    });

    response.status(200).json({
      appended: newRows.length,
      lastVisitKey: buildVisitKey(newRows[newRows.length - 1]),
      totalVisits: memberActivity?.Summary?.Total?.Visits ?? rows.length,
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Unknown PureGym ingest error",
    });
  }
}
