import { get, put } from "@vercel/blob";
import { kv } from "@vercel/kv";

const CSV_HEADER = "uts,utc_time,artist,artist_mbid,album,album_mbid,track,track_mbid";
const CSV_PATH = process.env.SCROBBLES_BLOB_PATH || "reflectiv/scrobbles.csv";
const BLOB_ACCESS = process.env.SCROBBLES_BLOB_ACCESS || "private";
const LAST_UTS_KEY = "lastfm:last_uts";
const LASTFM_USER = process.env.LASTFM_USER || "kapsiv";
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const MAX_PAGE_SIZE = 200;

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
  const authHeader = getAuthHeader(request);
  return normalizeAuth(authHeader) === secret;
}

function csvEscape(value) {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

function parseCsvRows(csvText) {
  return csvText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getLastUtsFromCsv(csvText) {
  const rows = parseCsvRows(csvText);
  if (rows.length <= 1) return 0;
  for (let i = rows.length - 1; i >= 1; i -= 1) {
    const row = rows[i];
    const firstComma = row.indexOf(",");
    if (firstComma === -1) continue;
    const utsRaw = row.slice(0, firstComma).replace(/"/g, "").trim();
    const uts = Number(utsRaw);
    if (Number.isFinite(uts)) return uts;
  }
  return 0;
}

async function fetchExistingCsv(seedUrl) {
  try {
    const blob = await get(CSV_PATH, { access: BLOB_ACCESS });
    if (blob) {
      const text = await new Response(blob.stream).text();
      return { text };
    }
  } catch (err) {
    if (err?.code !== "BLOB_NOT_FOUND") throw err;
  }

  if (seedUrl) {
    const res = await fetch(seedUrl);
    if (res.ok) {
      const text = await res.text();
      return { text };
    }
  }

  return { text: `${CSV_HEADER}\n` };
}

async function fetchRecentTracks(fromUts) {
  if (!LASTFM_API_KEY) {
    throw new Error("Missing LASTFM_API_KEY env var");
  }

  const tracks = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = new URL("https://ws.audioscrobbler.com/2.0/");
    url.searchParams.set("method", "user.getrecenttracks");
    url.searchParams.set("user", LASTFM_USER);
    url.searchParams.set("api_key", LASTFM_API_KEY);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(MAX_PAGE_SIZE));
    url.searchParams.set("page", String(page));
    if (Number.isFinite(fromUts) && fromUts > 0) {
      url.searchParams.set("from", String(fromUts));
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "room-portfolio-reflectiv/1.0",
      },
    });

    if (!res.ok) {
      throw new Error(`Last.fm API error: ${res.status}`);
    }

    const data = await res.json();
    const recentTracks = data?.recenttracks?.track ?? [];
    const attr = data?.recenttracks?.["@attr"] ?? {};
    totalPages = Number(attr.totalPages || 1);

    for (const track of recentTracks) {
      if (track?.["@attr"]?.nowplaying === "true") continue;
      const uts = Number(track?.date?.uts);
      if (!Number.isFinite(uts)) continue;
      tracks.push({
        uts,
        utc_time: track?.date?.["#text"] || "",
        artist: track?.artist?.["#text"] || "",
        artist_mbid: track?.artist?.mbid || "",
        album: track?.album?.["#text"] || "",
        album_mbid: track?.album?.mbid || "",
        track: track?.name || "",
        track_mbid: track?.mbid || "",
      });
    }

    page += 1;
  }

  return tracks;
}

function buildCsvLines(tracks) {
  return tracks
    .map((track) => {
      return [
        track.uts,
        track.utc_time,
        track.artist,
        track.artist_mbid,
        track.album,
        track.album_mbid,
        track.track,
        track.track_mbid,
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

  const seedUrl = new URL("/data/scrobbles.csv", new URL(request.url).origin).toString();
  const { text: existingCsv } = await fetchExistingCsv(seedUrl);
  const fallbackLastUts = getLastUtsFromCsv(existingCsv);
  const storedLastUts = Number(await kv.get(LAST_UTS_KEY));
  const lastUts = Number.isFinite(storedLastUts) && storedLastUts > 0 ? storedLastUts : fallbackLastUts;

  const tracks = await fetchRecentTracks(lastUts + 1);
  if (!tracks.length) {
    response.status(200).json({ appended: 0, lastUts });
    return;
  }

  const uniqueTracks = tracks
    .filter((track) => track.uts > lastUts)
    .sort((a, b) => a.uts - b.uts);

  const csvLines = buildCsvLines(uniqueTracks);
  const needsNewline = existingCsv && !existingCsv.endsWith("\n");
  const updatedCsv = `${existingCsv}${needsNewline ? "\n" : ""}${csvLines}\n`;

  await put(CSV_PATH, updatedCsv, {
    access: BLOB_ACCESS,
    contentType: "text/csv",
    cacheControlMaxAge: 60,
    allowOverwrite: true,
  });

  const newLastUts = Math.max(lastUts, uniqueTracks[uniqueTracks.length - 1]?.uts || lastUts);
  await kv.set(LAST_UTS_KEY, newLastUts);

  response.status(200).json({
    appended: uniqueTracks.length,
    lastUts: newLastUts,
  });
}
