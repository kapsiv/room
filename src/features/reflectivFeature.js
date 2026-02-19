const LASTFM_USER = "kapsiv";
const LASTFM_API_KEY = "683650a829cee53959e8d505e8841726";
const LASTFM_ENDPOINT = "https://ws.audioscrobbler.com/2.0/";
const WORLD_GEOJSON_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

const countryAliases = {
  usa: "united states of america",
  us: "united states of america",
  uk: "united kingdom",
  uae: "united arab emirates",
  russia: "russian federation",
  czechia: "czech republic",
  "south korea": "korea republic of",
  "north korea": "korea democratic peoples republic of",
};

const genreUmbrellaMap = {
  // rock
  "acid rock": "rock",
  "alternative rock": "rock",
  "anatolian rock": "rock",
  "art rock": "rock",
  "avant-prog": "rock",
  "brutal prog": "rock",
  "canterbury scene": "rock",
  "garage rock": "rock",
  "garage rock revival": "rock",
  "gothic rock": "rock",
  "grunge": "rock",
  "hard rock": "rock",
  "indie rock": "rock",
  "industrial rock": "rock",
  "javanese tribal rock": "rock",
  "krautrock": "rock",
  "math rock": "rock",
  "neo-psychedelia": "rock",
  "new wave": "rock",
  "no wave": "rock",
  "noise rock": "rock",
  "pop rock": "rock",
  "post-britpop": "rock",
  "post-rock": "rock",
  "progressive rock": "rock",
  "proto-punk": "rock",
  "psychedelic rock": "rock",
  "raga rock": "rock",
  "rock in opposition": "rock",
  "rock opera": "rock",
  "shoegaze": "rock",
  "slacker rock": "rock",
  "slowcore": "rock",
  "space rock": "rock",
  "space rock revival": "rock",
  "symphonic prog": "rock",
  "symphonic rock": "rock",
  "yacht rock": "rock",
  
  // punk
  "art punk": "punk / hardcore",
  "emo": "punk / hardcore",
  "hardcore punk": "punk / hardcore",
  "midwest emo": "punk / hardcore",
  "post-hardcore": "punk / hardcore",
  "post-punk": "punk / hardcore",
  "post-punk revival": "punk / hardcore",
  "punk blues": "punk / hardcore",
  "stoner metal": "metal",
  
  // jazz
  "avant-garde jazz": "jazz",
  "chamber jazz": "jazz",
  "contemporary jazz": "jazz",
  "cool jazz": "jazz",
  "european free jazz": "jazz",
  "experimental big band": "jazz",
  "free improvisation": "jazz",
  "free jazz": "jazz",
  "hard bop": "jazz",
  "indo jazz": "jazz",
  "jazz funk": "jazz",
  "jazz fusion": "jazz",
  "jazz pop": "jazz",
  "jazz rock": "jazz",
  "modal jazz": "jazz",
  "post-bop": "jazz",
  "spiritual jazz": "jazz",
  "third stream": "jazz",
  "vocal jazz": "jazz",
  
  // blues
  "blues": "blues",
  "blues rock": "blues",
  "chicago blues": "blues",
  "electric blues": "blues",
  
  // electronic
  "acid techno": "electronic",
  "ambient techno": "electronic",
  "downtempo": "electronic",
  "drill and bass": "electronic",
  "dubstep": "electronic",
  "electronic": "electronic",
  "electronic dance music": "electronic",
  "electropop": "electronic",
  "future garage": "electronic",
  "glitch": "electronic",
  "glitch pop": "electronic",
  "house": "electronic",
  "idm": "electronic",
  "indietronica": "electronic",
  "industrial": "electronic",
  "microhouse": "electronic",
  "microsound": "electronic",
  "progressive electronic": "electronic",
  "synthpop": "electronic",
  "trip hop": "electronic",
  
  // ambient
  "ambient": "ambient",
  "ambient pop": "ambient",
  "dark ambient": "ambient",
  "drone": "ambient",
  "eai": "ambient",
  "onkyo": "ambient",
  "new age": "ambient",
  "space ambient": "ambient",
  "tribal ambient": "ambient",
  
  // experimental
  "avant-garde": "experimental / sound art",
  "data sonification": "experimental / sound art",
  "electroacoustic": "experimental / sound art",
  "experimental": "experimental / sound art",
  "field recordings": "experimental / sound art",
  "musique concrete": "experimental / sound art",
  "nature recordings": "experimental / sound art",
  "noise": "experimental / sound art",
  "sound collage": "experimental / sound art",
  "plunderphonics": "experimental / sound art",
  "tape music": "experimental / sound art",
  "turntable music": "experimental / sound art",
  
  // country
  "alt-country": "country / americana",
  "americana": "country / americana",
  "contemporary country": "country / americana",
  "progressive bluegrass": "country / americana",
  
  // folk
  "acoustic": "folk",
  "avant-folk": "folk",
  "chamber folk": "folk",
  "contemporary folk": "folk",
  "folk baroque": "folk",
  "folk rock": "folk",
  "folktronica": "folk",
  "freak folk": "folk",
  "indie folk": "folk",
  "neofolk": "folk",
  "progressive folk": "folk",
  "psychedelic folk": "folk",
  "wyrd folk": "folk",

  // classical
  "ballet": "classical",
  "carnatic classical music": "classical",
  "chamber music": "classical",
  "classical": "classical",
  "hindustani classical music": "classical",
  "microtonal classical": "classical",
  "minimalism": "classical",
  "modern classical": "classical",
  "post-minimalism": "classical",
  "totalism": "classical",

  // pop
  "a cappella": "pop",
  "art pop": "pop",
  "baroque pop": "pop",
  "chamber pop": "pop",
  "dark cabaret": "pop",
  "dream pop": "pop",
  "hypnagogic pop": "pop",
  "indie": "rock",
  "indie pop": "pop",
  "jangle pop": "pop",
  "math pop": "pop",
  "noise pop": "pop",
  "power pop": "pop",
  "progressive pop": "pop",
  "psychedelic pop": "pop",
  "shibuya-kei": "pop",

  // funk / reggae
  "funk": "funk / soul",
  "dub": "reggae",
  "reggae fusion": "reggae",

  // world
  "afrobeat": "world / traditional",
  "bossa nova": "world / traditional",
  "burmese stereo": "world / traditional",
  "gamelan": "world / traditional",
  "ghazal": "world / traditional",
  "griot music": "world / traditional",
  "jaipongan": "world / traditional",
  "klezmer": "world / traditional",
  "mande music": "world / traditional",
  "min yo": "world / traditional",
  "molam sing": "world / traditional",
  "qawwali": "world / traditional",
  "southeast asian folk music": "world / traditional",

  // other
  "spoken word": "spoken / vocal",
};

function normalizeGenreKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getFileTypeLabel(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "unknown";
  const cleaned = raw.split(/[?#]/)[0];
  const lastSegment = cleaned.split(/[\\/]/).pop() || cleaned;
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex > 0 && dotIndex < lastSegment.length - 1) {
    return lastSegment.slice(dotIndex + 1);
  }
  if (/^[a-z0-9]{2,8}$/.test(lastSegment)) return lastSegment;
  return "unknown";
}

function parseDurationToSeconds(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parts = raw.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((p) => !Number.isFinite(p))) return null;
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  return null;
}

const normalizedGenreUmbrellaMap = Object.fromEntries(
  Object.entries(genreUmbrellaMap).map(([key, umbrella]) => [normalizeGenreKey(key), umbrella]),
);

export function createReflectivFeature({ gsap, modals, getShowModal }) {
  const reflectivState = {
    range: "all",
    libraryMetric: "songs",
    libraryYearGenreFilter: "all",
    libraryCountryGenreFilter: "all",
    libraryArtists: [],
    libraryGenres: [],
    libraryLookupType: "artists",
    libraryLookupGrouped: false,
    scrobbles: [],
    daily: [],
    topArtists: [],
    topTags: [],
  };

  const reflectivChartState = {
    lineSeries: [],
    lineTween: null,
  };

  const cacheState = {
    nowPlaying: null,
    scrobbles: null,
    collection: null,
    worldGeo: null,
  };

  function normalizeCountryKey(value) {
    const normalized = String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (!normalized) return "";
    return countryAliases[normalized] || normalized;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && char === ",") {
        row.push(cell);
        cell = "";
        continue;
      }

      if (!inQuotes && (char === "\n" || char === "\r")) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cell);
        if (row.some((c) => c !== "")) rows.push(row);
        row = [];
        cell = "";
        continue;
      }

      cell += char;
    }

    if (cell.length || row.length) {
      row.push(cell);
      if (row.some((c) => c !== "")) rows.push(row);
    }

    if (!rows.length) return [];

    const headers = rows[0].map((h) => h.trim());
    return rows.slice(1).map((r) => {
      const out = {};
      headers.forEach((h, idx) => {
        out[h] = (r[idx] || "").trim();
      });
      return out;
    });
  }

  async function fetchNowPlayingTrack() {
    const url = `${LASTFM_ENDPOINT}?method=user.getrecenttracks&user=${encodeURIComponent(LASTFM_USER)}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const trackData = data?.recenttracks?.track;
    if (!trackData) return null;
    const track = Array.isArray(trackData) ? trackData[0] : trackData;

    const title = track?.name || "";
    const artist = track?.artist?.["#text"] || "";
    const album = track?.album?.["#text"] || "";
    const images = track?.image || [];
    const imageUrl = images.length ? images[images.length - 1]?.["#text"] || "" : "";

    if (!title || !artist) return null;
    return { title, artist, album, imageUrl };
  }

  async function fetchRecentTracks(limit = 11) {
    const url = `${LASTFM_ENDPOINT}?method=user.getrecenttracks&user=${encodeURIComponent(LASTFM_USER)}&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const tracksData = data?.recenttracks?.track;
    if (!tracksData) return [];
    const arr = Array.isArray(tracksData) ? tracksData : [tracksData];
    return arr
      .map((track) => {
        const images = track?.image || [];
        return {
          title: track?.name || "",
          artist: track?.artist?.["#text"] || "",
          album: track?.album?.["#text"] || "",
          imageUrl: images.length ? images[images.length - 1]?.["#text"] || "" : "",
        };
      })
      .filter((t) => t.title && t.artist);
  }

  async function getNowPlayingTrack() {
    try {
      cacheState.nowPlaying = await fetchNowPlayingTrack();
    } catch (err) {
      console.warn("Now playing fetch failed:", err);
    }
    return cacheState.nowPlaying;
  }

  function formatDate(uts) {
    const d = new Date(Number(uts) * 1000);
    return d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatDayKey(dayKey) {
    const d = new Date(`${dayKey}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return dayKey;
    return d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  function countBy(items, keyFn) {
    const map = new Map();
    items.forEach((item) => {
      const key = keyFn(item);
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }

  function aggregateDaily(scrobbles) {
    const byDay = countBy(scrobbles, (s) => {
      const d = new Date(Number(s.uts) * 1000);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    });
    return [...byDay.entries()]
      .map(([day, count]) => ({ day, count, date: new Date(`${day}T00:00:00Z`) }))
      .sort((a, b) => a.date - b.date);
  }

  function lastNDays(daily, n) {
    if (!daily.length) return [];
    const last = daily[daily.length - 1].date.getTime();
    const cutoff = last - (n - 1) * 24 * 60 * 60 * 1000;
    return daily.filter((d) => d.date.getTime() >= cutoff);
  }

  function aggregateMonthly(daily) {
    const monthly = new Map();
    daily.forEach((d) => {
      const key = d.day.slice(0, 7);
      monthly.set(key, (monthly.get(key) || 0) + d.count);
    });
    return [...monthly.entries()].map(([month, count]) => ({
      label: month,
      count,
      date: new Date(`${month}-01T00:00:00Z`),
    }));
  }

  function getSeriesForRange(range) {
    if (range === "all") {
      const daily = reflectivState.daily;
      if (!daily.length) return [];
      return aggregateMonthly(daily);
    }

    const scrobbles = getScrobblesForRange(range);
    if (!scrobbles.length) return [];
    const daily = aggregateDaily(scrobbles);
    if (range === "year") return daily.map((d) => ({ label: d.day.slice(2), count: d.count, date: d.date }));
    return daily.map((d) => ({ label: d.day.slice(5), count: d.count, date: d.date }));
  }

  function getRangeCutoffTimestamp(range, latestUts) {
    const latestDate = new Date(Number(latestUts) * 1000);
    if (Number.isNaN(latestDate.getTime())) return null;

    const cutoff = new Date(latestDate);
    if (range === "year") cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
    else if (range === "month") cutoff.setUTCMonth(cutoff.getUTCMonth() - 1);
    else if (range === "week") cutoff.setUTCDate(cutoff.getUTCDate() - 7);
    else return null;

    return Math.floor(cutoff.getTime() / 1000);
  }

  function getScrobblesForRange(range) {
    const scrobbles = reflectivState.scrobbles;
    if (!scrobbles.length || range === "all") return scrobbles;

    const latestUts = Number(scrobbles[0]?.uts);
    if (!Number.isFinite(latestUts)) return scrobbles;

    const cutoffUts = getRangeCutoffTimestamp(range, latestUts);
    if (!Number.isFinite(cutoffUts)) return scrobbles;

    return scrobbles.filter((s) => Number(s.uts) >= cutoffUts);
  }

  function drawLineOnCanvas(canvas, series, range = "all") {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 220;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!series.length) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("No data available", 12, 20);
      return;
    }

    const pad = { l: 28, r: 12, t: 10, b: 36 };
    const max = Math.max(...series.map((s) => s.count), 1);
    const usableW = width - pad.l - pad.r;
    const usableH = height - pad.t - pad.b;

    ctx.strokeStyle = "rgba(78,71,56,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + usableH);
    ctx.lineTo(width - pad.r, pad.t + usableH);
    ctx.stroke();

    ctx.strokeStyle = "#4e4738";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const points = series.map((p, i) => ({
      x: pad.l + (i / Math.max(series.length - 1, 1)) * usableW,
      y: pad.t + usableH - (p.count / max) * usableH,
    }));

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#4e4738";
      ctx.fill();
    } else {
      const tension = 0.95;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
        const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
        const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
        const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      ctx.stroke();
    }

    const tickSet = new Set();
    const ticks = [];
    const addTick = (index, label) => {
      if (index < 0 || index >= series.length || tickSet.has(index) || !label) return;
      tickSet.add(index);
      ticks.push({ index, label });
    };

    if (range === "week") {
      series.forEach((p, i) => {
        const date = p.date;
        const label = date
          ? date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })
          : p.label;
        addTick(i, label);
      });
    } else if (range === "month") {
      series.forEach((p, i) => {
        const day = p.date?.getUTCDate?.() ?? null;
        if (i === 0 || i === series.length - 1 || (day !== null && ((day - 1) % 5 === 0))) {
          const label = p.date
            ? p.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
            : p.label;
          addTick(i, label);
        }
      });
    } else if (range === "year") {
      series.forEach((p, i) => {
        const date = p.date;
        if (!date) return;
        if (i === 0 || date.getUTCDate() === 1) {
          addTick(
            i,
            date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
          );
        }
      });
    } else {
      series.forEach((p, i) => {
        const date = p.date;
        if (!date) return;
        if (i === 0 || date.getUTCMonth() === 0) addTick(i, String(date.getUTCFullYear()));
      });
    }

    ctx.font = "11px 'Ubuntu Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(78,71,56,0.85)";
    ctx.strokeStyle = "rgba(78,71,56,0.12)";
    ctx.lineWidth = 1;
    ticks.forEach((tick) => {
      const x = pad.l + (tick.index / Math.max(series.length - 1, 1)) * usableW;
      ctx.beginPath();
      ctx.moveTo(x, pad.t + usableH);
      ctx.lineTo(x, pad.t + usableH + 4);
      ctx.stroke();

      if (x <= pad.l + 20) ctx.textAlign = "left";
      else if (x >= width - pad.r - 20) ctx.textAlign = "right";
      else ctx.textAlign = "center";
      ctx.fillText(tick.label, x, pad.t + usableH + 8);
    });
  }

  function cloneSeries(series) {
    return series.map((p) => ({ ...p }));
  }

  function resampleSeriesToTarget(sourceSeries, targetSeries) {
    if (!targetSeries.length) return [];
    if (!sourceSeries.length) return targetSeries.map((p) => ({ ...p, count: 0 }));

    const sourceCounts = sourceSeries.map((p) => Number(p.count) || 0);
    const sourceMaxIndex = sourceCounts.length - 1;
    const targetMaxIndex = Math.max(targetSeries.length - 1, 1);

    return targetSeries.map((targetPoint, i) => {
      const sourcePos = (i / targetMaxIndex) * Math.max(sourceMaxIndex, 1);
      const leftIndex = Math.floor(sourcePos);
      const rightIndex = Math.min(sourceMaxIndex, leftIndex + 1);
      const frac = sourcePos - leftIndex;
      const leftVal = sourceCounts[leftIndex] ?? sourceCounts[sourceMaxIndex] ?? 0;
      const rightVal = sourceCounts[rightIndex] ?? leftVal;
      return { ...targetPoint, count: leftVal + (rightVal - leftVal) * frac };
    });
  }

  function drawBarsOnCanvas(canvas, items, labelKey, valueKey) {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 220;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const topItems = items.slice(0, 8);
    if (!topItems.length) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("No data available", 12, 20);
      return;
    }

    const max = Math.max(...topItems.map((i) => i[valueKey]), 1);
    const rowH = Math.floor((height - 16) / topItems.length);

    topItems.forEach((item, i) => {
      const y = 8 + i * rowH;
      const w = Math.floor(((item[valueKey] || 0) / max) * (width - 220));

      ctx.fillStyle = "rgba(78,71,56,0.18)";
      ctx.fillRect(190, y + 4, w, rowH - 8);

      ctx.fillStyle = "#4e4738";
      ctx.font = "12px 'Ubuntu Mono', monospace";
      ctx.fillText(String(item[labelKey]).slice(0, 24), 8, y + rowH / 2 + 4);
      ctx.fillText(String(item[valueKey]), 194 + w, y + rowH / 2 + 4);
    });
  }

  function drawGenreUmbrellaPie(canvas, countsMap) {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 260;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const data = [...countsMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);

    if (!data.length) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("No genre data available", 12, 20);
      return;
    }

    const total = data.reduce((sum, d) => sum + d.count, 0);
    const size = Math.min(width * 0.38, height - 20);
    const radius = Math.max(42, size / 2);
    const innerRadius = Math.round(radius * 0.58);
    const cx = Math.max(radius + 14, Math.min(width * 0.24, width - radius - 14));
    const cy = height / 2;

    const palette = data.map((_, idx) => {
      const hue = 34 + ((idx * 31) % 56);
      const saturation = 20 + ((idx * 17) % 18);
      const lightness = 28 + ((idx * 13) % 30);
      return `hsl(${hue} ${saturation}% ${lightness}%)`;
    });

    let angle = -Math.PI / 2;
    data.forEach((slice, idx) => {
      const sweep = (slice.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = palette[idx % palette.length];
      ctx.fill();
      ctx.strokeStyle = "#ece5da";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      angle += sweep;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ece5da";
    ctx.fill();
    ctx.strokeStyle = "rgba(78, 71, 56, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const legendX = Math.max(cx + radius + 26, width * 0.46);
    const legendY = 14;
    const rowH = 16;
    const maxRows = Math.max(1, Math.floor((height - 20) / rowH));
    const shown = data.slice(0, maxRows);

    ctx.font = "12px 'Ubuntu Mono', monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    shown.forEach((item, idx) => {
      const y = legendY + idx * rowH;
      const pct = `${((item.count / total) * 100).toFixed(1)}%`;
      ctx.fillStyle = palette[idx % palette.length];
      ctx.fillRect(legendX, y - 4, 8, 8);
      ctx.fillStyle = "#4e4738";
      ctx.fillText(`${item.name} (${pct})`, legendX + 12, y);
    });
  }

  function drawAlbumsByYearCanvas(canvas, yearCounts, { useProportion = false } = {}) {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 220;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!yearCounts.length) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("No year data available", 12, 20);
      return;
    }

    const countsMap = new Map(yearCounts.map((p) => [p.year, p.count]));
    const minYear = yearCounts[0].year;
    const maxYear = yearCounts[yearCounts.length - 1].year;
    const total = yearCounts.reduce((sum, y) => sum + y.count, 0);
    const years = [];
    for (let year = minYear; year <= maxYear; year += 1) {
      const count = countsMap.get(year) || 0;
      years.push({
        year,
        count,
        value: useProportion && total > 0 ? count / total : count,
      });
    }

    const pad = { l: 28, r: 12, t: 12, b: 34 };
    const usableW = width - pad.l - pad.r;
    const usableH = height - pad.t - pad.b;
    const rawMaxValue = Math.max(...years.map((y) => y.value), 0);
    const maxValue = useProportion ? Math.max(rawMaxValue, 0.0001) : Math.max(rawMaxValue, 1);
    const barW = Math.max(1, usableW / years.length);

    ctx.strokeStyle = "rgba(78,71,56,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + usableH);
    ctx.lineTo(width - pad.r, pad.t + usableH);
    ctx.stroke();

    years.forEach((entry, i) => {
      if (!entry.value) return;
      const h = (entry.value / maxValue) * usableH;
      const x = pad.l + i * barW;
      const y = pad.t + usableH - h;
      ctx.fillStyle = "rgba(78,71,56,0.72)";
      ctx.fillRect(x, y, Math.max(1, barW - 1), h);
    });

    const decadeStart = Math.floor(minYear / 10) * 10;
    const decadeEnd = Math.ceil(maxYear / 10) * 10;
    ctx.font = "11px 'Ubuntu Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(78,71,56,0.85)";
    ctx.strokeStyle = "rgba(78,71,56,0.18)";

    for (let decade = decadeStart; decade <= decadeEnd; decade += 10) {
      if (decade < minYear || decade > maxYear) continue;
      const pct = (decade - minYear) / Math.max(maxYear - minYear, 1);
      const x = pad.l + pct * usableW;

      ctx.beginPath();
      ctx.moveTo(x, pad.t + usableH);
      ctx.lineTo(x, pad.t + usableH + 4);
      ctx.stroke();

      if (x <= pad.l + 20) ctx.textAlign = "left";
      else if (x >= width - pad.r - 20) ctx.textAlign = "right";
      else ctx.textAlign = "center";
      ctx.fillText(String(decade), x, pad.t + usableH + 8);
    }
  }

  function drawDurationDistributionLine(canvas, durations) {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 240;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!durations.length) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("No duration data available", 12, 20);
      return;
    }

    const binSize = 30;
    const maxDurationCap = 16 * 60;
    const countsByBin = new Map();
    const filteredDurations = [];
    durations.forEach((duration) => {
      if (duration > maxDurationCap) return;
      filteredDurations.push(duration);
      const bin = Math.floor(duration / binSize) * binSize;
      countsByBin.set(bin, (countsByBin.get(bin) || 0) + 1);
    });
    if (!countsByBin.size) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("No duration data available", 12, 20);
      return;
    }
    const minBin = 0;
    const maxBin = maxDurationCap;
    const bins = [];
    for (let bin = minBin; bin <= maxBin; bin += binSize) {
      bins.push({ duration: bin, count: countsByBin.get(bin) || 0 });
    }
    const maxCount = Math.max(...bins.map((b) => b.count), 1);

    const pad = { l: 40, r: 12, t: 10, b: 36 };
    const usableW = width - pad.l - pad.r;
    const usableH = height - pad.t - pad.b;

    const xForDuration = (duration) => {
      const pct = (duration - minBin) / Math.max(maxBin - minBin, binSize);
      return pad.l + pct * usableW;
    };
    const yForCount = (count) => pad.t + usableH - (count / maxCount) * usableH;
    const meanDuration = filteredDurations.reduce((sum, d) => sum + d, 0) / Math.max(filteredDurations.length, 1);

    ctx.strokeStyle = "rgba(78,71,56,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + usableH);
    ctx.lineTo(width - pad.r, pad.t + usableH);
    ctx.stroke();

    const meanX = xForDuration(meanDuration);
    const meanM = Math.floor(meanDuration / 60);
    const meanS = String(Math.round(meanDuration % 60)).padStart(2, "0");
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(78,71,56,0.65)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(meanX, pad.t);
    ctx.lineTo(meanX, pad.t + usableH);
    ctx.stroke();
    ctx.restore();
    ctx.font = "11px 'Ubuntu Mono', monospace";
    ctx.fillStyle = "rgba(78,71,56,0.9)";
    ctx.textBaseline = "bottom";
    ctx.textAlign = meanX > width - 110 ? "right" : "left";
    ctx.fillText(`mean ${meanM}:${meanS}`, meanX + (meanX > width - 110 ? -6 : 6), pad.t - 1);

    const points = bins.map((bin) => ({
      x: xForDuration(bin.duration),
      y: yForCount(bin.count),
    }));
    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 2.3, 0, Math.PI * 2);
      ctx.fillStyle = "#4e4738";
      ctx.fill();
    } else {
      const tension = 0.92;
      ctx.strokeStyle = "rgba(78,71,56,0.82)";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
        const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
        const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
        const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      ctx.stroke();
    }

    ctx.font = "11px 'Ubuntu Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(78,71,56,0.85)";
    ctx.strokeStyle = "rgba(78,71,56,0.14)";
    const maxSeconds = maxBin;
    const minuteStep = 60;
    for (let sec = Math.floor(minBin / minuteStep) * minuteStep; sec <= maxSeconds; sec += minuteStep) {
      if (sec < minBin || sec > maxBin) continue;
      const x = xForDuration(sec);
      ctx.beginPath();
      ctx.moveTo(x, pad.t + usableH);
      ctx.lineTo(x, pad.t + usableH + 4);
      ctx.stroke();
      ctx.textAlign = x <= pad.l + 20 ? "left" : (x >= width - pad.r - 20 ? "right" : "center");
      const mm = Math.floor(sec / 60);
      const ss = String(sec % 60).padStart(2, "0");
      ctx.fillText(`${mm}:${ss}`, x, pad.t + usableH + 8);
    }
  }

  function drawPeakHoursOnCanvas(canvas, scrobbles) {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 260;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!scrobbles.length) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("No data available", 12, 20);
      return;
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayColors = dayNames.map((_, idx) => {
      const hue = 34 + ((idx * 31) % 56);
      const saturation = 20 + ((idx * 17) % 18);
      const lightness = 28 + ((idx * 13) % 30);
      return `hsl(${hue} ${saturation}% ${lightness}%)`;
    });
    const counts = Array.from({ length: 7 }, () => Array(24).fill(0));

    scrobbles.forEach((scrobble) => {
      const date = new Date(Number(scrobble.uts) * 1000);
      if (Number.isNaN(date.getTime())) return;
      counts[date.getDay()][date.getHours()] += 1;
    });

    const maxCount = Math.max(...counts.flat(), 1);
    const pad = { l: 38, r: 16, t: 14, b: 36 };
    const usableW = width - pad.l - pad.r;
    const usableH = height - pad.t - pad.b;
    const xForHour = (hour) => pad.l + (hour / 23) * usableW;
    const yForCount = (count) => pad.t + usableH - (count / maxCount) * usableH;

    ctx.strokeStyle = "rgba(78,71,56,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + usableH);
    ctx.lineTo(width - pad.r, pad.t + usableH);
    ctx.stroke();

    ctx.font = "10px 'Ubuntu Mono', monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(78,71,56,0.82)";
    ctx.strokeStyle = "rgba(78,71,56,0.12)";
    [0, 3, 6, 9, 12, 15, 18, 21, 23].forEach((hour) => {
      const x = xForHour(hour);
      ctx.beginPath();
      ctx.moveTo(x, pad.t + usableH);
      ctx.lineTo(x, pad.t + usableH + 4);
      ctx.stroke();
      ctx.textAlign = x <= pad.l + 20 ? "left" : (x >= width - pad.r - 20 ? "right" : "center");
      ctx.fillText(String(hour).padStart(2, "0"), x, pad.t + usableH + 7);
    });

    ctx.strokeStyle = "rgba(78,71,56,0.2)";
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach((ratio) => {
      const count = Math.round(maxCount * ratio);
      const y = yForCount(count);
      ctx.beginPath();
      ctx.moveTo(pad.l - 4, y);
      ctx.lineTo(pad.l, y);
      ctx.stroke();
    });

    counts.forEach((dayCounts, dayIdx) => {
      const points = dayCounts.map((count, hour) => ({
        x: xForHour(hour),
        y: yForCount(count),
      }));
      const color = dayColors[dayIdx % dayColors.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.7;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      ctx.stroke();
    });

    const legendY = pad.t + 4;
    const itemW = Math.max(58, Math.floor((width - pad.l - pad.r) / 7));
    dayNames.forEach((label, i) => {
      const x = pad.l + i * itemW;
      const y = legendY;
      ctx.strokeStyle = dayColors[i % dayColors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 12, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(78,71,56,0.9)";
      ctx.font = "10px 'Ubuntu Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + 16, y);
    });
  }

  function drawGeoGeometry(ctx, geometry, project) {
    const drawRing = (ring) => {
      ring.forEach((point, i) => {
        const [x, y] = project(point[0], point[1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    };

    if (geometry?.type === "Polygon") {
      geometry.coordinates.forEach((ring) => drawRing(ring));
    } else if (geometry?.type === "MultiPolygon") {
      geometry.coordinates.forEach((poly) => poly.forEach((ring) => drawRing(ring)));
    }
  }

  function mixRgb(from, to, t) {
    const clamped = Math.max(0, Math.min(1, t));
    return [
      Math.round(from[0] + (to[0] - from[0]) * clamped),
      Math.round(from[1] + (to[1] - from[1]) * clamped),
      Math.round(from[2] + (to[2] - from[2]) * clamped),
    ];
  }

  function drawWorldAlbumsMap(canvas, geojson, countryAlbumCounts) {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return { matched: 0, totalCountries: 0 };
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 220;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const features = geojson?.features || [];
    if (!features.length) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("map unavailable", 12, 20);
      return { matched: 0, totalCountries: countryAlbumCounts.size };
    }

    const pad = { l: 14, r: 14, t: 10, b: 14 };
    const usableW = width - pad.l - pad.r;
    const usableH = height - pad.t - pad.b;
    const mapAspect = 2;
    const mapW = Math.min(usableW, usableH * mapAspect);
    const mapH = mapW / mapAspect;
    const mapLeft = pad.l + (usableW - mapW) / 2;
    const mapTop = pad.t + (usableH - mapH) / 2;
    const project = (lon, lat) => [
      mapLeft + ((lon + 180) / 360) * mapW,
      mapTop + ((90 - lat) / 180) * mapH,
    ];

    const low = [236, 229, 218];
    const high = [78, 71, 56];

    let matched = 0;
    features.forEach((feature) => {
      const props = feature.properties || {};
      const rawName = props.name || props.ADMIN || props.admin || "";
      const key = normalizeCountryKey(rawName);
      if (key === "antarctica") return;

      const count = countryAlbumCounts.get(key) || 0;
      if (count > 0) matched += 1;

      const t = count > 0 ? Math.min(1, 1 - Math.exp(-0.55 * count)) : 0;
      const rgb = mixRgb(low, high, t);

      ctx.beginPath();
      drawGeoGeometry(ctx, feature.geometry, project);
      ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
      ctx.fill();
      ctx.strokeStyle = "rgba(78,71,56,0.22)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    return { matched, totalCountries: countryAlbumCounts.size };
  }

  async function renderMusicLibraryWorldMap(modal, countryAlbumCounts) {
    const noteEl = modal.querySelector("#libraryWorldMapNote");
    const canvas = modal.querySelector("#libraryWorldMap");
    if (!canvas || !noteEl) return;

    noteEl.textContent = "loading map...";
    try {
      const geo = await loadWorldGeoJson();
      const stats = drawWorldAlbumsMap(canvas, geo, countryAlbumCounts);
      noteEl.textContent = `${stats.matched.toLocaleString()} of ${stats.totalCountries.toLocaleString()} countries mapped`;
    } catch (err) {
      console.warn("World map render failed:", err);
      noteEl.textContent = "couldn't load world map";
    }
  }

  async function loadScrobblesCsv() {
    if (cacheState.scrobbles) return cacheState.scrobbles;
    const res = await fetch("/data/scrobbles.csv");
    if (!res.ok) throw new Error(`scrobbles.csv fetch failed: ${res.status}`);
    const text = await res.text();
    cacheState.scrobbles = parseCsv(text).filter((r) => r.uts && r.artist && r.track);
    return cacheState.scrobbles;
  }

  async function loadCollectionCsv() {
    if (cacheState.collection) return cacheState.collection;
    const res = await fetch("/data/collection.csv");
    if (!res.ok) throw new Error(`collection.csv fetch failed: ${res.status}`);
    const text = await res.text();
    cacheState.collection = parseCsv(text);
    return cacheState.collection;
  }

  async function loadWorldGeoJson() {
    if (cacheState.worldGeo) return cacheState.worldGeo;
    const res = await fetch(WORLD_GEOJSON_URL);
    if (!res.ok) throw new Error(`world geojson fetch failed: ${res.status}`);
    cacheState.worldGeo = await res.json();
    return cacheState.worldGeo;
  }

  function setNowPlayingPill(modal, track) {
    const textEls = modal.querySelectorAll(".now-playing-text");
    const innerEl = modal.querySelector(".now-playing-inner");
    if (!textEls.length || !innerEl) return;
    const value = track
      ? ` ${String(track.title).toLowerCase()} - ${String(track.artist).toLowerCase()}`
      : " not sure right now";
    textEls.forEach((el) => { el.textContent = value; });
    innerEl.classList.remove("is-animating");
    void innerEl.offsetWidth;
    innerEl.classList.add("is-animating");
  }

  async function initAboutModal(modal) {
    const track = await getNowPlayingTrack();
    setNowPlayingPill(modal, track);
  }

  async function initNowPlayingModal(modal) {
    const art = modal.querySelector(".nowplaying-art");
    const artPlaceholder = modal.querySelector(".nowplaying-art-placeholder");
    const titleEl = modal.querySelector(".nowplaying-title");
    const artistEl = modal.querySelector(".nowplaying-artist");
    const listEl = modal.querySelector(".nowplaying-recent-list");

    if (titleEl) titleEl.textContent = "loading...";
    if (artistEl) artistEl.textContent = "";
    if (listEl) listEl.innerHTML = "<li>loading your recent listens...</li>";

    try {
      const tracks = await fetchRecentTracks(11);
      const current = tracks[0];
      const previous = tracks.slice(1, 11);

      if (titleEl) titleEl.textContent = current?.title ? String(current.title).toLowerCase() : "not sure right now";
      if (artistEl) {
        artistEl.textContent = current?.artist
          ? `${String(current.artist).toLowerCase()}${current.album ? ` - ${String(current.album).toLowerCase()}` : ""}`
          : "";
      }

      if (art && artPlaceholder) {
        if (current?.imageUrl) {
          art.src = current.imageUrl;
          art.style.display = "block";
          artPlaceholder.style.display = "none";
        } else {
          art.removeAttribute("src");
          art.style.display = "none";
          artPlaceholder.style.display = "grid";
        }
      }

      if (listEl) {
        if (!previous.length) {
          listEl.innerHTML = "<li>no earlier tracks found.</li>";
        } else {
          listEl.innerHTML = previous
            .map((t) => `<li>${String(t.title).toLowerCase()} - ${String(t.artist).toLowerCase()}</li>`)
            .join("");
        }
      }
    } catch (err) {
      console.warn("Recent tracks fetch failed:", err);
      if (titleEl) titleEl.textContent = "couldn't load recent tracks";
    }

    const seeAllBtn = modal.querySelector(".nowplaying-see-scrobbles");
    if (seeAllBtn && modal.dataset.nowPlayingBound !== "true") {
      modal.dataset.nowPlayingBound = "true";
      seeAllBtn.addEventListener("click", () => {
        const showModal = getShowModal?.();
        if (!showModal) return;
        showModal(modals.reflectiv);
        setReflectivTab(modals.reflectiv, "reflectiv");
      });
    }
  }

  function updateReflectivNowPlaying(modal, track) {
    const titleEl = modal.querySelector(".rnw-title");
    const artistEl = modal.querySelector(".rnw-artist");
    const albumEl = modal.querySelector(".rnw-album");
    const artEl = modal.querySelector(".rnw-art");
    const artPlaceholderEl = modal.querySelector(".rnw-art-placeholder");
    if (titleEl) titleEl.textContent = track?.title || "not sure right now";
    if (artistEl) artistEl.textContent = track?.artist || "";
    if (albumEl) albumEl.textContent = track?.album ? `from ${track.album}` : "";
    if (artEl && artPlaceholderEl) {
      if (track?.imageUrl) {
        artEl.src = track.imageUrl;
        artEl.style.display = "block";
        artPlaceholderEl.style.display = "none";
      } else {
        artEl.removeAttribute("src");
        artEl.style.display = "none";
        artPlaceholderEl.style.display = "grid";
      }
    }
  }

  function updateReflectivFacts(modal) {
    const scrobbles = getScrobblesForRange(reflectivState.range);
    const totalEl = modal.querySelector("#fact-total-scrobbles");
    const busyEl = modal.querySelector("#fact-busiest-day");
    const firstEl = modal.querySelector("#fact-last-updated");
    const lastEl = modal.querySelector("#fact-first-scrobble");
    if (!scrobbles.length) {
      if (totalEl) totalEl.textContent = "0";
      if (busyEl) busyEl.textContent = "-";
      if (firstEl) firstEl.textContent = "-";
      if (lastEl) lastEl.textContent = "-";
      return;
    }

    const first = scrobbles[scrobbles.length - 1];
    const last = scrobbles[0];
    const daily = aggregateDaily(scrobbles);
    const busiest = daily.reduce((max, d) => (d.count > max.count ? d : max), daily[0]);

    if (totalEl) totalEl.textContent = scrobbles.length.toLocaleString();
    if (busyEl) busyEl.textContent = `${busiest.count} on ${formatDayKey(busiest.day)}`;
    if (firstEl) firstEl.textContent = formatDate(first.uts);
    if (lastEl) lastEl.textContent = formatDate(last.uts);
  }

  function renderReflectivTopArtists(modal) {
    const list = modal.querySelector("#topArtistsList");
    if (!list) return;
    const top = reflectivState.topArtists.slice(0, 30);
    list.innerHTML = "";
    top.forEach((a, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="artist-name">${idx + 1}. ${a.name}</span><span class="artist-count">${a.count.toLocaleString()}</span>`;
      list.appendChild(li);
    });
  }

  function renderReflectivCharts(modal) {
    const series = getSeriesForRange(reflectivState.range);
    const scrobbles = getScrobblesForRange(reflectivState.range);
    const lineCanvas = modal.querySelector("#scrobblesOverTime");

    if (reflectivChartState.lineTween) {
      reflectivChartState.lineTween.kill();
      reflectivChartState.lineTween = null;
    }

    if (!lineCanvas || !reflectivChartState.lineSeries.length || !series.length) {
      drawLineOnCanvas(lineCanvas, series, reflectivState.range);
      reflectivChartState.lineSeries = cloneSeries(series);
    } else {
      const fromSeries = resampleSeriesToTarget(reflectivChartState.lineSeries, series);
      const tweenState = { progress: 0 };

      reflectivChartState.lineTween = gsap.to(tweenState, {
        progress: 1,
        duration: 0.38,
        ease: "power2.out",
        onUpdate: () => {
          const blended = series.map((point, i) => {
            const from = fromSeries[i]?.count ?? 0;
            return {
              ...point,
              count: from + (point.count - from) * tweenState.progress,
            };
          });
          reflectivChartState.lineSeries = cloneSeries(blended);
          drawLineOnCanvas(lineCanvas, blended, reflectivState.range);
        },
        onComplete: () => {
          reflectivChartState.lineSeries = cloneSeries(series);
          reflectivChartState.lineTween = null;
        },
      });
    }

    drawBarsOnCanvas(modal.querySelector("#tagPie"), reflectivState.topTags, "name", "count");
    drawPeakHoursOnCanvas(modal.querySelector("#peakHours"), scrobbles);

    const tagStream = modal.querySelector("#tagStream");
    const ctx = tagStream?.getContext?.("2d");
    if (ctx && tagStream) {
      tagStream.width = tagStream.clientWidth || 720;
      tagStream.height = tagStream.clientHeight || 220;
      ctx.clearRect(0, 0, tagStream.width, tagStream.height);
      ctx.fillStyle = "#4e4738";
      ctx.font = "13px 'Ubuntu Mono', monospace";
      ctx.fillText("coming soon - streamgraph in progress", 10, 20);
    }
  }

  function bindReflectivNowPlayingSlider(modal) {
    if (modal.dataset.reflectivSliderBound === "true") return;
    modal.dataset.reflectivSliderBound = "true";

    const track = modal.querySelector(".rnw-slider-track");
    const thumb = modal.querySelector(".rnw-slider-thumb");
    if (!track || !thumb) return;

    const state = { x: 0 };
    let activePointerId = null;
    let startX = 0;
    let startOffset = 0;
    let maxOffset = 0;

    const setOffset = (x) => {
      state.x = Math.min(Math.max(0, x), maxOffset);
      thumb.style.transform = `translate(${state.x}px, -50%)`;
    };

    const recalc = () => {
      maxOffset = Math.max(0, track.clientWidth - thumb.offsetWidth - 12);
      setOffset(state.x);
    };

    const animateTo = (x, onComplete) => {
      gsap.killTweensOf(state);
      gsap.to(state, {
        x,
        duration: 0.26,
        ease: "power2.out",
        onUpdate: () => setOffset(state.x),
        onComplete,
      });
    };

    const endDrag = () => {
      activePointerId = null;
      track.classList.remove("is-dragging");
    };

    thumb.addEventListener("pointerdown", (e) => {
      const isMouse = e.pointerType === "mouse";
      if (isMouse && e.button !== 0) return;

      e.preventDefault();
      gsap.killTweensOf(state);
      activePointerId = e.pointerId;
      startX = e.clientX;
      startOffset = state.x;
      track.classList.add("is-dragging");
      thumb.setPointerCapture(e.pointerId);
    });

    thumb.addEventListener("pointermove", (e) => {
      if (activePointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      setOffset(startOffset + dx);
    });

    thumb.addEventListener("pointerup", (e) => {
      if (activePointerId !== e.pointerId) return;
      thumb.releasePointerCapture(e.pointerId);
      endDrag();

      const didUnlock = maxOffset > 0 && state.x >= maxOffset * 0.82;
      if (didUnlock) {
        animateTo(maxOffset, () => {
          const showModal = getShowModal?.();
          if (showModal) showModal(modals.nowplaying);
          animateTo(0);
        });
        return;
      }

      animateTo(0);
    });

    thumb.addEventListener("pointercancel", () => {
      endDrag();
      animateTo(0);
    });

    window.addEventListener("resize", recalc);
    recalc();
  }

  function setReflectivTab(modal, tabName) {
    if (!modal) return;
    const tabs = modal.querySelectorAll(".modal-tab[data-reflectiv-tab]");
    const panels = modal.querySelectorAll(".reflectiv-panel[data-reflectiv-panel]");
    tabs.forEach((tab) => {
      const isActive = tab.dataset.reflectivTab === tabName;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
    panels.forEach((panel) => {
      const isActive = panel.dataset.reflectivPanel === tabName;
      panel.classList.toggle("is-active", isActive);
    });

    if (tabName === "reflectiv" && reflectivState.daily.length) {
      renderReflectivCharts(modal);
    }
    if (tabName === "library" && cacheState.collection?.length) {
      renderMusicLibraryPanel(modal, cacheState.collection);
    }
  }

  function sortAlpha(values) {
    return [...values].sort((a, b) => String(a).localeCompare(String(b), "en-GB", { sensitivity: "base" }));
  }

  function updateLibraryLookupToggle(lookupModal) {
    const toggle = lookupModal?.querySelector("#libraryLookupGroupToggle");
    if (!toggle) return;
    const isGenres = reflectivState.libraryLookupType === "genres";
    toggle.hidden = !isGenres;
    if (!isGenres) return;
    toggle.classList.toggle("active", reflectivState.libraryLookupGrouped);
    toggle.textContent = `group genres: ${reflectivState.libraryLookupGrouped ? "on" : "off"}`;
  }

  function renderLibraryLookupList(lookupModal) {
    const listEl = lookupModal?.querySelector("#libraryLookupList");
    if (!listEl) return;

    const isGenres = reflectivState.libraryLookupType === "genres";
    const items = isGenres ? reflectivState.libraryGenres : reflectivState.libraryArtists;
    if (!items.length) {
      listEl.innerHTML = "<li>no data found.</li>";
      return;
    }

    if (!isGenres || !reflectivState.libraryLookupGrouped) {
      listEl.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
      return;
    }

    const grouped = new Map();
    items.forEach((genre) => {
      const umbrella = normalizedGenreUmbrellaMap[normalizeGenreKey(genre)] || "other";
      if (!grouped.has(umbrella)) grouped.set(umbrella, []);
      grouped.get(umbrella).push(genre);
    });

    const groupNames = sortAlpha(grouped.keys());
    listEl.innerHTML = groupNames
      .map((group) => {
        const rows = sortAlpha(grouped.get(group))
          .map((genre) => `<li class="library-lookup-child-row">${genre}</li>`)
          .join("");
        return `<li class="library-lookup-group-block"><div class="library-lookup-group-row">${group}</div><ul class="library-lookup-sublist">${rows}</ul></li>`;
      })
      .join("");
  }

  function openLibraryLookupModal(type) {
    const showModal = getShowModal?.();
    const lookupModal = modals.libraryLookup;
    if (!showModal || !lookupModal) return;

    const titleEl = lookupModal.querySelector("#window-title-library-lookup");
    if (!titleEl) return;

    const isGenres = type === "genres";
    const title = isGenres ? "genres" : "artists";
    reflectivState.libraryLookupType = isGenres ? "genres" : "artists";
    reflectivState.libraryLookupGrouped = false;
    titleEl.textContent = title;
    updateLibraryLookupToggle(lookupModal);
    renderLibraryLookupList(lookupModal);

    showModal(lookupModal);
  }

  function renderMusicLibraryPanel(modal, rows) {
    const albums = new Set();
    const artists = new Set();
    const genres = new Set();
    const artistSongCounts = new Map();
    const genreSongCounts = new Map();
    const umbrellaGenreCounts = new Map();
    const fileTypeCounts = new Map();
    const durationValues = [];
    const albumUmbrellasByKey = new Map();
    const artistAlbumSets = new Map();
    const genreAlbumSets = new Map();
    const albumYearByKey = new Map();
    const albumCountriesByKey = new Map();

    rows.forEach((r) => {
      const artist = (r.Artist || "").trim();
      const album = (r.Album || "").trim();
      const albumKey = artist && album ? `${artist.toLowerCase()}::${album.toLowerCase()}` : "";

      if (artist) artists.add(artist);
      if (albumKey) albums.add(albumKey);
      const fileType = getFileTypeLabel(r.File);
      fileTypeCounts.set(fileType, (fileTypeCounts.get(fileType) || 0) + 1);
      const rowGenres = [...new Set((r.Genres || "")
        .split(";")
        .map((g) => g.trim().toLowerCase())
        .filter(Boolean))];
      rowGenres.forEach((g) => {
        genres.add(g);
        genreSongCounts.set(g, (genreSongCounts.get(g) || 0) + 1);
        const umbrella = normalizedGenreUmbrellaMap[normalizeGenreKey(g)] || "other";
        umbrellaGenreCounts.set(umbrella, (umbrellaGenreCounts.get(umbrella) || 0) + 1);
      });
      if (artist) artistSongCounts.set(artist, (artistSongCounts.get(artist) || 0) + 1);

      const duration = parseDurationToSeconds(r.Duration);
      if (Number.isFinite(duration) && duration > 0) durationValues.push(duration);
      const year = Number.parseInt((r.Year || "").trim(), 10);
      if (albumKey && Number.isInteger(year) && year >= 1900 && year <= 2100 && !albumYearByKey.has(albumKey)) {
        albumYearByKey.set(albumKey, year);
      }

      if (albumKey) {
        if (artist) {
          if (!artistAlbumSets.has(artist)) artistAlbumSets.set(artist, new Set());
          artistAlbumSets.get(artist).add(albumKey);
        }
        if (!albumUmbrellasByKey.has(albumKey)) albumUmbrellasByKey.set(albumKey, new Set());
        const umbrellaSet = albumUmbrellasByKey.get(albumKey);
        rowGenres.forEach((genre) => {
          if (!genreAlbumSets.has(genre)) genreAlbumSets.set(genre, new Set());
          genreAlbumSets.get(genre).add(albumKey);
          umbrellaSet.add(normalizedGenreUmbrellaMap[normalizeGenreKey(genre)] || "other");
        });
      }

      if (albumKey) {
        const countries = (r.Countries || "")
          .split(";")
          .map((country) => normalizeCountryKey(country))
          .filter(Boolean);
        if (countries.length) {
          if (!albumCountriesByKey.has(albumKey)) albumCountriesByKey.set(albumKey, new Set());
          const countrySet = albumCountriesByKey.get(albumKey);
          countries.forEach((country) => countrySet.add(country));
        }
      }
    });

    const umbrellaOptions = sortAlpha(new Set([...albumUmbrellasByKey.values()].flatMap((set) => [...set])));
    if (!umbrellaOptions.includes(reflectivState.libraryYearGenreFilter)) {
      reflectivState.libraryYearGenreFilter = "all";
    }
    if (!umbrellaOptions.includes(reflectivState.libraryCountryGenreFilter)) {
      reflectivState.libraryCountryGenreFilter = "all";
    }
    const yearGenreFilterSelect = modal.querySelector("#libraryYearGenreFilter");
    if (yearGenreFilterSelect) {
      const optionsHtml = ["<option value=\"all\">all genres</option>"]
        .concat(umbrellaOptions.map((name) => `<option value="${name}">${name}</option>`))
        .join("");
      if (yearGenreFilterSelect.innerHTML !== optionsHtml) {
        yearGenreFilterSelect.innerHTML = optionsHtml;
      }
      yearGenreFilterSelect.value = reflectivState.libraryYearGenreFilter;
    }
    const countryGenreFilterSelect = modal.querySelector("#libraryCountryGenreFilter");
    if (countryGenreFilterSelect) {
      const optionsHtml = ["<option value=\"all\">all genres</option>"]
        .concat(umbrellaOptions.map((name) => `<option value="${name}">${name}</option>`))
        .join("");
      if (countryGenreFilterSelect.innerHTML !== optionsHtml) {
        countryGenreFilterSelect.innerHTML = optionsHtml;
      }
      countryGenreFilterSelect.value = reflectivState.libraryCountryGenreFilter;
    }
    const filteredYearCountsMap = new Map();
    albumYearByKey.forEach((year, albumKey) => {
      const umbrellas = albumUmbrellasByKey.get(albumKey);
      if (reflectivState.libraryYearGenreFilter !== "all" && !umbrellas?.has(reflectivState.libraryYearGenreFilter)) return;
      filteredYearCountsMap.set(year, (filteredYearCountsMap.get(year) || 0) + 1);
    });
    const filteredAlbumsByYear = [...filteredYearCountsMap.entries()]
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year);
    const countryAlbumCounts = new Map();
    albumCountriesByKey.forEach((countrySet, albumKey) => {
      const umbrellas = albumUmbrellasByKey.get(albumKey);
      if (reflectivState.libraryCountryGenreFilter !== "all" && !umbrellas?.has(reflectivState.libraryCountryGenreFilter)) return;
      countrySet.forEach((country) => {
        countryAlbumCounts.set(country, (countryAlbumCounts.get(country) || 0) + 1);
      });
    });

    const setText = (selector, value) => {
      const el = modal.querySelector(selector);
      if (el) el.textContent = value;
    };

    setText("#musiclib-total-albums", albums.size.toLocaleString());
    setText("#musiclib-total-songs", rows.length.toLocaleString());
    setText("#musiclib-total-artists", artists.size.toLocaleString());
    setText("#musiclib-total-genres", genres.size.toLocaleString());

    reflectivState.libraryArtists = sortAlpha(artists);
    reflectivState.libraryGenres = sortAlpha(genres);

    const topArtistsList = modal.querySelector("#libraryTopArtistsList");
    const topArtistsCountLabel = modal.querySelector("#libraryTopArtistsCountLabel");
    const topGenresCountLabel = modal.querySelector("#libraryTopGenresCountLabel");
    if (topArtistsList) {
      const metric = reflectivState.libraryMetric;
      const topArtists = (metric === "albums"
        ? [...artistAlbumSets.entries()].map(([name, albumSet]) => [name, albumSet.size])
        : [...artistSongCounts.entries()])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);
      const totalForPercent = metric === "albums" ? albums.size : rows.length;
      const percentFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
      if (topArtistsCountLabel) topArtistsCountLabel.textContent = metric;
      topArtistsList.innerHTML = topArtists
        .map(([name, count], i) => {
          const share = totalForPercent > 0 ? `${percentFormatter.format((count / totalForPercent) * 100)}%` : "0%";
          return `<li><span class="artist-name">${i + 1}. ${name}</span><span class="artist-count">${count.toLocaleString()}</span><span class="artist-share">${share}</span></li>`;
        })
        .join("");
    }

    const topGenresList = modal.querySelector("#libraryTopGenresList");
    if (topGenresList) {
      const metric = reflectivState.libraryMetric;
      const topGenres = (metric === "albums"
        ? [...genreAlbumSets.entries()].map(([name, albumSet]) => [name, albumSet.size])
        : [...genreSongCounts.entries()])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50);
      const totalForPercent = metric === "albums" ? albums.size : rows.length;
      const percentFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
      if (topGenresCountLabel) topGenresCountLabel.textContent = metric;
      topGenresList.innerHTML = topGenres
        .map(([name, count], i) => {
          const share = totalForPercent > 0 ? `${percentFormatter.format((count / totalForPercent) * 100)}%` : "0%";
          return `<li><span class="artist-name">${i + 1}. ${name}</span><span class="artist-count">${count.toLocaleString()}</span><span class="artist-share">${share}</span></li>`;
        })
        .join("");
    }

    const metricButtons = modal.querySelectorAll(".musiclib-metric-filter[data-metric]");
    metricButtons.forEach((button) => {
      const metric = button.dataset.metric || "songs";
      button.classList.toggle("active", metric === reflectivState.libraryMetric);
    });

    drawAlbumsByYearCanvas(modal.querySelector("#libraryAlbumsByYear"), filteredAlbumsByYear, { useProportion: true });
    renderMusicLibraryWorldMap(modal, countryAlbumCounts);
    drawGenreUmbrellaPie(modal.querySelector("#libraryGenreUmbrellaPie"), umbrellaGenreCounts);
    drawGenreUmbrellaPie(modal.querySelector("#libraryFileTypePie"), fileTypeCounts);
    drawDurationDistributionLine(modal.querySelector("#libraryDurationScatter"), durationValues);
  }

  function bindReflectivControls(modal) {
    if (modal.dataset.reflectivBound === "true") return;
    modal.dataset.reflectivBound = "true";
    bindReflectivNowPlayingSlider(modal);

    const tabs = modal.querySelectorAll(".modal-tab[data-reflectiv-tab]");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setReflectivTab(modal, tab.dataset.reflectivTab || "reflectiv");
      });
    });

    const buttons = modal.querySelectorAll(".reflectiv-filter[data-range]");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.range || "all";
        reflectivState.range = next;
        buttons.forEach((b) => b.classList.toggle("active", b === btn));
        updateReflectivFacts(modal);
        renderReflectivCharts(modal);
      });
    });

    const libraryBtn = modal.querySelector(".reflectiv-musiclib-button");
    if (libraryBtn) {
      libraryBtn.addEventListener("click", () => {
        setReflectivTab(modal, "library");
      });
    }

    const metricButtons = modal.querySelectorAll(".musiclib-metric-filter[data-metric]");
    metricButtons.forEach((button) => {
      button.addEventListener("click", () => {
        reflectivState.libraryMetric = button.dataset.metric || "songs";
        metricButtons.forEach((b) => b.classList.toggle("active", b === button));
        if (cacheState.collection?.length) {
          renderMusicLibraryPanel(modal, cacheState.collection);
        }
      });
    });

    const bindLookupCard = (selector, type) => {
      const card = modal.querySelector(selector);
      if (!card) return;
      const open = () => {
        if (!cacheState.collection?.length) return;
        openLibraryLookupModal(type);
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        open();
      });
    };

    bindLookupCard("#musiclib-artists-card", "artists");
    bindLookupCard("#musiclib-genres-card", "genres");

    const yearGenreFilterSelect = modal.querySelector("#libraryYearGenreFilter");
    if (yearGenreFilterSelect) {
      yearGenreFilterSelect.addEventListener("change", () => {
        reflectivState.libraryYearGenreFilter = yearGenreFilterSelect.value || "all";
        if (cacheState.collection?.length) {
          renderMusicLibraryPanel(modal, cacheState.collection);
        }
      });
    }

    const countryGenreFilterSelect = modal.querySelector("#libraryCountryGenreFilter");
    if (countryGenreFilterSelect) {
      countryGenreFilterSelect.addEventListener("change", () => {
        reflectivState.libraryCountryGenreFilter = countryGenreFilterSelect.value || "all";
        if (cacheState.collection?.length) {
          renderMusicLibraryPanel(modal, cacheState.collection);
        }
      });
    }

    const lookupModal = modals.libraryLookup;
    const lookupToggle = lookupModal?.querySelector("#libraryLookupGroupToggle");
    if (lookupToggle && lookupModal.dataset.lookupBound !== "true") {
      lookupModal.dataset.lookupBound = "true";
      lookupToggle.addEventListener("click", () => {
        if (reflectivState.libraryLookupType !== "genres") return;
        reflectivState.libraryLookupGrouped = !reflectivState.libraryLookupGrouped;
        updateLibraryLookupToggle(lookupModal);
        renderLibraryLookupList(lookupModal);
      });
    }
  }

  async function initReflectivModal(modal) {
    const overlay = modal.querySelector("#reflectiv-loading-overlay");
    const loadingText = modal.querySelector("#reflectiv-loading-main");
    if (overlay) overlay.classList.add("visible");
    if (loadingText) loadingText.textContent = "loading last.fm data...";

    bindReflectivControls(modal);

    try {
      const [track, scrobbles, collection] = await Promise.all([
        getNowPlayingTrack(),
        loadScrobblesCsv(),
        loadCollectionCsv(),
      ]);

      updateReflectivNowPlaying(modal, track);

      reflectivState.scrobbles = [...scrobbles].sort((a, b) => Number(b.uts) - Number(a.uts));
      reflectivState.daily = aggregateDaily(reflectivState.scrobbles);
      reflectivState.topArtists = [...countBy(reflectivState.scrobbles, (s) => s.artist).entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const tagCounts = new Map();
      collection.forEach((row) => {
        const tags = (row.Genres || "")
          .split(";")
          .map((g) => g.trim().toLowerCase())
          .filter(Boolean);
        tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      reflectivState.topTags = [...tagCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      updateReflectivFacts(modal);
      renderReflectivTopArtists(modal);
      renderReflectivCharts(modal);
      renderMusicLibraryPanel(modal, collection);
    } catch (err) {
      console.error("Reflectiv init failed:", err);
      if (loadingText) loadingText.textContent = "couldn't load reflectiv data";
    } finally {
      if (overlay) overlay.classList.remove("visible");
    }
  }

  return {
    initAboutModal,
    initNowPlayingModal,
    initReflectivModal,
    setReflectivTab,
  };
}
