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
    libraryGenreFocus: null,
    libraryAlbumsYearFocus: null,
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

  function formatDateTime(uts) {
    const d = new Date(Number(uts) * 1000);
    return d.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  function normalizeKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  const IGNORED_ALBUM_KEYS = new Set(
    [
      { album: "(removed)", artist: "Fjarri" },
      { album: "Dose 1", artist: "Diagnose Me Doc" },
      { album: "The Fjarri Collection", artist: "Fjarri" },
    ].map(({ album, artist }) => `${normalizeKey(artist)}::${normalizeKey(album)}`),
  );

  function isIgnoredAlbumRow(row) {
    const artistKey = normalizeKey(row?.Artist);
    const albumKey = normalizeKey(row?.Album);
    if (!artistKey || !albumKey) return false;
    return IGNORED_ALBUM_KEYS.has(`${artistKey}::${albumKey}`);
  }

  function formatUmbrellaCenterLabel(name) {
    const key = String(name || "").toLowerCase();
    if (key === "experimental / sound art") return "experimental";
    if (key === "world / traditional") return "world";
    if (key === "country / americana") return "country";
    return name;
  }

  function buildCollectionTagMaps(collection) {
    const byArtistAlbum = new Map();
    const byArtistTrack = new Map();
    const byAlbumTrack = new Map();
    collection.forEach((row) => {
      const artist = normalizeKey(row.Artist);
      const track = normalizeKey(row.Song);
      const album = normalizeKey(row.Album);
      const genres = row.Genres || "";
      if (artist && album) {
        const key = `${artist}::${album}`;
        if (!byArtistAlbum.has(key)) byArtistAlbum.set(key, genres);
      }
      if (artist && track) {
        const key = `${artist}::${track}`;
        if (!byArtistTrack.has(key)) byArtistTrack.set(key, genres);
      }
      if (album && track) {
        const key = `${album}::${track}`;
        if (!byAlbumTrack.has(key)) byAlbumTrack.set(key, genres);
      }
    });
    return { byArtistAlbum, byArtistTrack, byAlbumTrack };
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

  function isUtcMonthComplete(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
    const monthEndDay = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      0,
    )).getUTCDate();
    return date.getUTCDate() === monthEndDay;
  }

  function dropIncompleteTrailingMonth(monthlySeries, daily) {
    if (!monthlySeries.length || !daily.length) return monthlySeries;
    const latestDay = daily[daily.length - 1];
    const latestDate = latestDay?.date;
    if (isUtcMonthComplete(latestDate)) return monthlySeries;

    const trailingMonthKey = latestDay.day.slice(0, 7);
    const lastSeriesPoint = monthlySeries[monthlySeries.length - 1];
    if (lastSeriesPoint?.label !== trailingMonthKey) return monthlySeries;
    return monthlySeries.slice(0, -1);
  }

  function getSeriesForRange(range) {
    if (range === "all") {
      const daily = reflectivState.daily;
      if (!daily.length) return [];
      return dropIncompleteTrailingMonth(aggregateMonthly(daily), daily);
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

  function buildScrobblesLinePath(points, tension = 0.95) {
    if (typeof Path2D !== "function" || points.length < 2) return null;
    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

      path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    return path;
  }

  function formatScrobbleHoverBinLabel(point, range) {
    const date = point?.date;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return String(point?.label || "");
    if (range === "all") {
      return date.toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    }
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function drawLineHoverLabel(ctx, point, range, bounds) {
    if (!point || !bounds) return;
    const count = Math.max(0, Math.round(Number(point.count) || 0));
    const primary = `${count.toLocaleString()} scrobble${count === 1 ? "" : "s"}`;
    const secondary = formatScrobbleHoverBinLabel(point, range);

    ctx.save();
    ctx.font = "700 11px 'Ubuntu Mono', monospace";
    const primaryWidth = ctx.measureText(primary).width;
    ctx.font = "10px 'Ubuntu Mono', monospace";
    const secondaryWidth = ctx.measureText(secondary).width;
    const bubbleW = Math.max(primaryWidth, secondaryWidth) + 16;
    const bubbleH = 34;
    const bubbleX = Math.min(
      Math.max(point.x - bubbleW / 2, bounds.left),
      bounds.right - bubbleW,
    );
    const prefersBelow = point.y - bubbleH - 14 < bounds.top;
    const bubbleY = prefersBelow ? Math.min(point.y + 14, bounds.bottom - bubbleH) : point.y - bubbleH - 14;

    ctx.fillStyle = "rgba(245,240,232,0.96)";
    ctx.strokeStyle = "rgba(78,71,56,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#353027";
    ctx.font = "700 11px 'Ubuntu Mono', monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(primary, bubbleX + 8, bubbleY + 7);

    ctx.fillStyle = "rgba(78,71,56,0.82)";
    ctx.font = "10px 'Ubuntu Mono', monospace";
    ctx.fillText(secondary, bubbleX + 8, bubbleY + 20);
    ctx.restore();
  }

  function drawLineOnCanvas(canvas, series, range = "all", { hoverIndex = null } = {}) {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 220;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!series.length) {
      canvas._lineMeta = null;
      canvas._lineSeries = series;
      canvas._lineRange = range;
      canvas._lineHoverIndex = null;
      canvas.style.cursor = "default";
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

    const points = series.map((p, i) => ({
      x: pad.l + (i / Math.max(series.length - 1, 1)) * usableW,
      y: pad.t + usableH - (p.count / max) * usableH,
      ...p,
    }));
    const linePath = buildScrobblesLinePath(points);
    const activeHoverIndex =
      Number.isInteger(hoverIndex) && hoverIndex >= 0 && hoverIndex < points.length
        ? hoverIndex
        : null;

    ctx.strokeStyle = "#4e4738";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#4e4738";
      ctx.fill();
    } else {
      if (linePath) {
        ctx.stroke(linePath);
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
    }

    const markerDate = new Date("2024-01-01T00:00:00Z");
    const markerTooltip = document.querySelector("#scrobblesMobileTooltip");
    const firstTime = series[0]?.date?.getTime?.() ?? NaN;
    const lastTime = series[series.length - 1]?.date?.getTime?.() ?? NaN;
    if (
      Number.isFinite(firstTime) &&
      Number.isFinite(lastTime) &&
      markerDate.getTime() >= firstTime &&
      markerDate.getTime() <= lastTime
    ) {
      let markerIndex = series.findIndex((p) => (p.date?.getTime?.() ?? -1) >= markerDate.getTime());
      if (markerIndex === -1) markerIndex = series.length - 1;
      let pos = markerIndex;
      if (markerIndex > 0) {
        const prevTime = series[markerIndex - 1].date?.getTime?.() ?? firstTime;
        const nextTime = series[markerIndex].date?.getTime?.() ?? prevTime;
        const span = Math.max(nextTime - prevTime, 1);
        pos = markerIndex - 1 + (markerDate.getTime() - prevTime) / span;
      }
      const markerX = pad.l + (pos / Math.max(series.length - 1, 1)) * usableW;
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "rgba(78,71,56,0.6)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(markerX, pad.t);
      ctx.lineTo(markerX, pad.t + usableH);
      ctx.stroke();
      ctx.restore();

      if (markerTooltip) {
        markerTooltip.style.left = `${markerX}px`;
        markerTooltip.style.top = `${pad.t}px`;
        markerTooltip.style.transform = "translate(-50%, -120%)";
        markerTooltip.style.display = "inline-flex";
      }
    } else if (markerTooltip) {
      markerTooltip.style.display = "none";
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

    if (activeHoverIndex !== null) {
      const activePoint = points[activeHoverIndex];
      if (activePoint) {
        ctx.save();
        ctx.strokeStyle = "rgba(78,71,56,0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(activePoint.x, pad.t);
        ctx.lineTo(activePoint.x, pad.t + usableH);
        ctx.stroke();

        ctx.fillStyle = "#f5f0e8";
        ctx.strokeStyle = "#4e4738";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(activePoint.x, activePoint.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawLineHoverLabel(ctx, activePoint, range, {
          left: pad.l,
          right: width - pad.r,
          top: pad.t,
          bottom: pad.t + usableH,
        });
      }
    }

    canvas._lineSeries = series;
    canvas._lineRange = range;
    canvas._lineHoverIndex = activeHoverIndex;
    canvas._lineMeta = {
      points,
      path: linePath,
      bounds: {
        left: pad.l,
        right: width - pad.r,
        top: pad.t,
        bottom: pad.t + usableH,
      },
    };
  }

  function bindScrobblesLineInteractions(canvas) {
    if (!canvas || canvas.dataset.lineBound === "true") return;
    canvas.dataset.lineBound = "true";

    const getCanvasPoint = (event) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const getHoverIndex = (event) => {
      const meta = canvas._lineMeta;
      if (!meta?.points?.length) return null;
      const { x, y } = getCanvasPoint(event);
      const { bounds, points, path } = meta;
      const ctx = canvas.getContext?.("2d");

      if (x < bounds.left || x > bounds.right || y < bounds.top - 12 || y > bounds.bottom + 12) return null;

      if (points.length === 1) {
        const dist = Math.hypot(x - points[0].x, y - points[0].y);
        return dist <= 14 ? 0 : null;
      }

      if (ctx && path && typeof ctx.isPointInStroke === "function") {
        ctx.save();
        ctx.lineWidth = 14;
        const hit = ctx.isPointInStroke(path, x, y);
        ctx.restore();
        if (!hit) return null;
      }

      let nearestIndex = null;
      let nearestDistance = Infinity;
      points.forEach((point, index) => {
        const distance = Math.abs(point.x - x);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      return nearestIndex;
    };

    const setHoverIndex = (index) => {
      const nextHoverIndex = Number.isInteger(index) ? index : null;
      if (canvas._lineHoverIndex === nextHoverIndex) return;
      canvas._lineHoverIndex = nextHoverIndex;
      canvas.style.cursor = nextHoverIndex !== null ? "pointer" : "default";
      drawLineOnCanvas(canvas, canvas._lineSeries || [], canvas._lineRange || "all", {
        hoverIndex: nextHoverIndex,
      });
    };

    canvas.addEventListener("mousemove", (event) => {
      setHoverIndex(getHoverIndex(event));
    });

    canvas.addEventListener("mouseleave", () => {
      setHoverIndex(null);
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

  function drawGenreUmbrellaPie(canvas, countsMap, options = {}) {
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

    const slices = [];
    let angle = -Math.PI / 2;
    data.forEach((slice, idx) => {
      const sweep = (slice.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + sweep);
      ctx.closePath();
      const fill = palette[idx % palette.length];
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = "#ece5da";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      if (options.enableHover && options.hoverName && options.hoverName === slice.name) {
        ctx.save();
        ctx.strokeStyle = "rgba(78,71,56,0.8)";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 1.5, angle, angle + sweep);
        ctx.stroke();
        ctx.restore();
      }
      slices.push({
        name: slice.name,
        start: angle,
        end: angle + sweep,
      });
      angle += sweep;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ece5da";
    ctx.fill();
    ctx.strokeStyle = "rgba(78, 71, 56, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const hoverCenterLabel = options.showHoverCenterLabel ? options.hoverName : null;
    const activeCenterLabel = options.centerLabel || hoverCenterLabel;
    if (activeCenterLabel) {
      const formatLabel = options.centerLabelFormatter || ((value) => value);
      const formattedLabel = formatLabel(activeCenterLabel);
      const centerFontSize = options.centerFontSize || options.legendFontSize || 11;
      ctx.fillStyle = "rgba(78,71,56,0.9)";
      ctx.font = `${centerFontSize}px 'Ubuntu Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelY = options.centerSubLabel ? cy - 6 : cy;
      ctx.fillText(formattedLabel, cx, labelY);
      if (options.centerSubLabel) {
        ctx.fillStyle = "rgba(78,71,56,0.7)";
        ctx.font = "10px 'Ubuntu Mono', monospace";
        ctx.fillText(options.centerSubLabel, cx, cy + 8);
      }
    }

    const legendX = Math.max(cx + radius + 26, width * 0.46);
    const legendY = 14;
    const legendFontSize = options.legendFontSize || 12;
    const rowH = options.legendRowH || Math.max(16, legendFontSize + 4);
    const maxRows = Math.max(1, Math.floor((height - 20) / rowH));
    const shown = data.slice(0, maxRows);

    ctx.font = `${legendFontSize}px 'Ubuntu Mono', monospace`;
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

    const normalizeAngle = (theta) => (theta + Math.PI * 2) % (Math.PI * 2);
    const pieMeta = {
      cx,
      cy,
      radius,
      innerRadius,
      slices: slices.map((slice) => ({
        name: slice.name,
        start: normalizeAngle(slice.start),
        end: normalizeAngle(slice.end),
      })),
      legend: {
        x: legendX,
        y: legendY,
        rowH,
        width: Math.max(0, width - legendX - 8),
        items: shown.map((item) => item.name),
      },
    };
    canvas._pieMeta = pieMeta;
    canvas._countsMap = countsMap;
    canvas._pieOptions = options;
    return pieMeta;
  }

  function drawAlbumsByYearCanvas(
    canvas,
    yearCounts,
    { useProportion = false, hoverYear = null, activeYear = null } = {},
  ) {
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
    const focusYear = hoverYear ?? activeYear ?? null;

    ctx.strokeStyle = "rgba(78,71,56,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + usableH);
    ctx.lineTo(width - pad.r, pad.t + usableH);
    ctx.stroke();

    const barRects = [];
    years.forEach((entry, i) => {
      if (!entry.value) return;
      const h = (entry.value / maxValue) * usableH;
      const x = pad.l + i * barW;
      const y = pad.t + usableH - h;
      const isActive = activeYear === entry.year;
      const isHover = hoverYear === entry.year;
      ctx.fillStyle = isActive
        ? "rgba(78,71,56,0.9)"
        : isHover
          ? "rgba(78,71,56,0.82)"
          : "rgba(78,71,56,0.72)";
      ctx.fillRect(x, y, Math.max(1, barW - 1), h);
      barRects.push({
        year: entry.year,
        count: entry.count,
        x,
        y,
        w: Math.max(1, barW - 1),
        h,
      });
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

    if (focusYear !== null) {
      const focusBar = barRects.find((bar) => bar.year === focusYear);
      if (focusBar) {
        const yearLabel = String(focusBar.year);
        const countLabel = `${focusBar.count.toLocaleString()} album${focusBar.count === 1 ? "" : "s"}`;

        ctx.save();
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = "700 11px 'Ubuntu Mono', monospace";
        const yearWidth = ctx.measureText(yearLabel).width;
        ctx.font = "10px 'Ubuntu Mono', monospace";
        const countWidth = ctx.measureText(countLabel).width;
        const bubbleW = Math.max(yearWidth, countWidth) + 16;
        const bubbleH = 34;
        const bubbleX = Math.min(
          Math.max(focusBar.x + focusBar.w / 2 - bubbleW / 2, pad.l),
          width - pad.r - bubbleW,
        );
        const bubbleY = Math.max(4, focusBar.y - bubbleH - 8);

        ctx.fillStyle = "rgba(245,240,232,0.96)";
        ctx.strokeStyle = "rgba(78,71,56,0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#353027";
        ctx.font = "700 11px 'Ubuntu Mono', monospace";
        ctx.fillText(yearLabel, bubbleX + 8, bubbleY + 7);

        ctx.fillStyle = "rgba(78,71,56,0.82)";
        ctx.font = "10px 'Ubuntu Mono', monospace";
        ctx.fillText(countLabel, bubbleX + 8, bubbleY + 20);
        ctx.restore();
      }
    }

    canvas._yearBars = barRects;
    canvas._yearCounts = yearCounts;
    canvas._yearOptions = { useProportion, activeYear };
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

    const peakBin = bins.reduce((best, bin) => (bin.count > best.count ? bin : best), bins[0]);
    if (peakBin && peakBin.count > 0) {
      const peakX = xForDuration(peakBin.duration);
      const peakY = yForCount(peakBin.count);
      const peakLabel = `${peakBin.count} songs`;
      const labelX = Math.max(pad.l + 6, peakX - 56);
      const labelY = Math.max(peakY - 10, pad.t + 14);

      ctx.beginPath();
      ctx.arc(peakX, peakY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#4e4738";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(labelX + 2, labelY - 2);
      ctx.lineTo(peakX - 4, peakY - 2);
      ctx.strokeStyle = "rgba(78,71,56,0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "11px 'Ubuntu Mono', monospace";
      ctx.fillStyle = "rgba(78,71,56,0.92)";
      ctx.textBaseline = "bottom";
      ctx.textAlign = "right";
      ctx.fillText(peakLabel, labelX, labelY);
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

  function formatDurationAxisLabel(seconds) {
    const totalSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(totalSeconds / 60);
    const remainderSeconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${remainderSeconds}`;
  }

  function formatDurationCardLabel(seconds) {
    const totalSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainderSeconds = totalSeconds % 60;
    const parts = [];

    if (hours > 0) parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes === 1 ? "" : "s"}`);
    if (!parts.length || (hours === 0 && minutes === 0 && remainderSeconds > 0)) {
      parts.push(`${remainderSeconds} sec${remainderSeconds === 1 ? "" : "s"}`);
    } else if (remainderSeconds > 0 && hours === 0) {
      parts.push(`${remainderSeconds} sec${remainderSeconds === 1 ? "" : "s"}`);
    }

    return parts.join(" ");
  }

  function compareTextValues(a, b) {
    return String(a || "").localeCompare(String(b || ""), undefined, {
      sensitivity: "base",
    });
  }

  function drawSongLengthOverTimeScatter(canvas, points) {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 220;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!points.length) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("No duration/year data available", 12, 20);
      return;
    }

    const minVisibleDuration = 2 * 60;
    const maxVisibleDuration = 15 * 60;
    const visiblePoints = points.filter(
      (point) => point.duration >= minVisibleDuration && point.duration <= maxVisibleDuration,
    );
    if (!visiblePoints.length) {
      ctx.fillStyle = "#4e4738";
      ctx.font = "14px 'Ubuntu Mono', monospace";
      ctx.fillText("No songs between 2:00 and 15:00", 12, 20);
      return;
    }

    const years = visiblePoints.map((point) => point.year);
    const durationTotalsByYear = new Map();
    const durationCountsByYear = new Map();
    visiblePoints.forEach((point) => {
      durationTotalsByYear.set(point.year, (durationTotalsByYear.get(point.year) || 0) + point.duration);
      durationCountsByYear.set(point.year, (durationCountsByYear.get(point.year) || 0) + 1);
    });
    const averagePoints = [...durationTotalsByYear.entries()]
      .map(([year, totalDuration]) => ({
        year,
        duration: totalDuration / Math.max(durationCountsByYear.get(year) || 1, 1),
      }))
      .sort((a, b) => a.year - b.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const yTicks = [120, 180, 240, 300, 420, 600, 900];
    const pad = { l: 40, r: 14, t: 14, b: 36 };
    const usableW = width - pad.l - pad.r;
    const usableH = height - pad.t - pad.b;
    const xForYear = (year) => {
      const pct = (year - minYear) / Math.max(maxYear - minYear, 1);
      return pad.l + pct * usableW;
    };
    const yForDuration = (duration) => {
      const clamped = Math.min(maxVisibleDuration, Math.max(minVisibleDuration, Number(duration) || 0));
      const pct = (clamped - minVisibleDuration) / Math.max(maxVisibleDuration - minVisibleDuration, 1);
      return pad.t + usableH - pct * usableH;
    };

    ctx.strokeStyle = "rgba(78,71,56,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + usableH);
    ctx.lineTo(width - pad.r, pad.t + usableH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + usableH);
    ctx.stroke();

    ctx.font = "10px 'Ubuntu Mono', monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(78,71,56,0.82)";
    ctx.strokeStyle = "rgba(78,71,56,0.1)";
    yTicks.forEach((duration) => {
      const y = yForDuration(duration);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(width - pad.r, y);
      ctx.stroke();
      ctx.fillText(formatDurationAxisLabel(duration), pad.l - 6, y);
    });

    const yearSpan = Math.max(maxYear - minYear, 1);
    const yearStep = yearSpan <= 12 ? 1 : yearSpan <= 30 ? 5 : 10;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(78,71,56,0.14)";
    for (let year = Math.ceil(minYear / yearStep) * yearStep; year <= maxYear; year += yearStep) {
      const x = xForYear(year);
      ctx.beginPath();
      ctx.moveTo(x, pad.t + usableH);
      ctx.lineTo(x, pad.t + usableH + 4);
      ctx.stroke();
      ctx.fillText(String(year), x, pad.t + usableH + 8);
    }
    if (minYear === maxYear) {
      ctx.fillText(String(minYear), pad.l + usableW / 2, pad.t + usableH + 8);
    }

    ctx.fillStyle = "rgba(78,71,56,0.12)";
    visiblePoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(xForYear(point.year), yForDuration(point.duration), 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    const trendPoints = averagePoints.map((point) => ({
      x: xForYear(point.year),
      y: yForDuration(point.duration),
      ...point,
    }));

    if (trendPoints.length === 1) {
      ctx.beginPath();
      ctx.arc(trendPoints[0].x, trendPoints[0].y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "#4e4738";
      ctx.fill();
    } else if (trendPoints.length > 1) {
      const tension = 0.82;
      ctx.save();
      ctx.strokeStyle = "rgba(78,71,56,0.92)";
      ctx.lineWidth = 2.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(trendPoints[0].x, trendPoints[0].y);
      for (let i = 0; i < trendPoints.length - 1; i += 1) {
        const p0 = trendPoints[i - 1] || trendPoints[i];
        const p1 = trendPoints[i];
        const p2 = trendPoints[i + 1];
        const p3 = trendPoints[i + 2] || p2;
        const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
        const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
        const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
        const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "#4e4738";
    trendPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function bindGenreUmbrellaPieInteractions(modal, canvas) {
    if (!canvas || canvas.dataset.pieBound === "true") return;
    canvas.dataset.pieBound = "true";

    const container = canvas.closest(".chart-section");
    if (container && container.dataset.pieResetBound !== "true") {
      container.dataset.pieResetBound = "true";
      container.addEventListener("click", (event) => {
        if (event.target.closest(".chart-open-button, .ui-tooltip")) return;
        if (!reflectivState.libraryGenreFocus) return;
        reflectivState.libraryGenreFocus = null;
        if (cacheState.collection) renderMusicLibraryPanel(modal, cacheState.collection);
      });
    }

    const getSliceAtPoint = (event, meta) => {
      if (!meta) return null;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const dx = x - meta.cx;
      const dy = y - meta.cy;
      const dist = Math.hypot(dx, dy);
      if (dist >= meta.radius || dist <= meta.innerRadius) return null;
      let angle = Math.atan2(dy, dx);
      angle = (angle + Math.PI * 2) % (Math.PI * 2);
      return meta.slices.find((s) => {
        if (s.start < s.end) return angle >= s.start && angle < s.end;
        return angle >= s.start || angle < s.end;
      }) || null;
    };

    const getLegendSliceAtPoint = (x, y, meta) => {
      if (!meta?.legend) return null;
      const inLegendX = x >= meta.legend.x && x <= meta.legend.x + meta.legend.width;
      const inLegendY =
        y >= meta.legend.y - meta.legend.rowH * 0.6 &&
        y <= meta.legend.y + meta.legend.items.length * meta.legend.rowH;
      if (!inLegendX || !inLegendY) return null;
      const idx = Math.floor((y - meta.legend.y) / meta.legend.rowH);
      const name = meta.legend.items[idx];
      return name ? { name } : null;
    };

    canvas.addEventListener("mousemove", (event) => {
      if (reflectivState.libraryGenreFocus) return;
      const meta = canvas._pieMeta;
      if (!meta) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const slice = getSliceAtPoint(event, meta);
      const legendSlice = getLegendSliceAtPoint(x, y, meta);
      const hoverName = slice?.name || legendSlice?.name || null;
      if (canvas._pieHoverName === hoverName) return;
      canvas._pieHoverName = hoverName;
      canvas.style.cursor = hoverName ? "pointer" : "default";
      if (canvas._countsMap) {
        drawGenreUmbrellaPie(canvas, canvas._countsMap, { ...canvas._pieOptions, hoverName });
      }
    });

    canvas.addEventListener("mouseleave", () => {
      if (reflectivState.libraryGenreFocus) return;
      if (!canvas._pieHoverName) return;
      canvas._pieHoverName = null;
      canvas.style.cursor = "default";
      if (canvas._countsMap) {
        drawGenreUmbrellaPie(canvas, canvas._countsMap, { ...canvas._pieOptions, hoverName: null });
      }
    });

    canvas.addEventListener("click", (event) => {
      const meta = canvas._pieMeta;
      if (!meta) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const dx = x - meta.cx;
      const dy = y - meta.cy;
      const dist = Math.hypot(dx, dy);

      if (reflectivState.libraryGenreFocus) {
        reflectivState.libraryGenreFocus = null;
        if (cacheState.collection) renderMusicLibraryPanel(modal, cacheState.collection);
        return;
      }

      let slice = getSliceAtPoint(event, meta);
      if (!slice) slice = getLegendSliceAtPoint(x, y, meta);
      if (!slice && (dist >= meta.radius || dist <= meta.innerRadius)) return;
      if (!slice) return;
      reflectivState.libraryGenreFocus = slice.name;
      event.stopPropagation();
      if (cacheState.collection) renderMusicLibraryPanel(modal, cacheState.collection);
    });
  }

  function bindAlbumsByYearInteractions(modal, canvas) {
    if (!canvas || canvas.dataset.yearBound === "true") return;
    canvas.dataset.yearBound = "true";

    const getBarAtPoint = (event) => {
      const bars = canvas._yearBars;
      if (!bars?.length) return null;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return bars.find((bar) => x >= bar.x && x <= bar.x + bar.w && y >= bar.y && y <= bar.y + bar.h) || null;
    };

    canvas.addEventListener("mousemove", (event) => {
      const bar = getBarAtPoint(event);
      const hoverYear = bar?.year || null;
      if (canvas._yearHoverYear === hoverYear) return;
      canvas._yearHoverYear = hoverYear;
      canvas.style.cursor = hoverYear ? "pointer" : "default";
      if (canvas._yearCounts) {
        drawAlbumsByYearCanvas(canvas, canvas._yearCounts, {
          ...canvas._yearOptions,
          hoverYear,
        });
      }
    });

    canvas.addEventListener("mouseleave", () => {
      if (!canvas._yearHoverYear) return;
      canvas._yearHoverYear = null;
      canvas.style.cursor = "default";
      if (canvas._yearCounts) {
        drawAlbumsByYearCanvas(canvas, canvas._yearCounts, {
          ...canvas._yearOptions,
          hoverYear: null,
        });
      }
    });

    canvas.addEventListener("click", (event) => {
      const bar = getBarAtPoint(event);
      if (!bar) return;
      const albumsByYearMap = canvas._yearAlbumsMap;
      const albums = albumsByYearMap?.get(bar.year) || [];
      reflectivState.libraryAlbumsYearFocus = bar.year;
      updateAlbumsByYearModal(modal, bar.year, albums);
      const showModal = getShowModal?.();
      if (showModal && modals.albumsByYear) showModal(modals.albumsByYear);
    });
  }

  function updateAlbumsByYearModal(modal, label, albums) {
    const albumsModal = modals.albumsByYear;
    if (!albumsModal) return;
    const titleEl = albumsModal.querySelector("#window-title-albums-by-year");
    const listEl = albumsModal.querySelector("#albumsByYearList");
    const numeric = Number(label);
    const title = Number.isFinite(numeric) ? `albums in ${numeric}` : String(label || "albums");
    if (titleEl) titleEl.textContent = title;
    if (listEl) {
      if (!albums.length) {
        listEl.innerHTML = "<li>no albums found</li>";
      } else {
        listEl.innerHTML = albums
          .map((entry) => {
            if (typeof entry === "string") return `<li>${entry}</li>`;
            return `<li>${entry.label}</li>`;
          })
          .join("");
      }
    }
  }

  function buildPeakHoursCurvePath(points) {
    if (typeof Path2D !== "function" || !points.length) return null;
    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    return path;
  }

  function drawPeakHoursOnCanvas(canvas, scrobbles, { hoverDay = null } = {}) {
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 260;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (!scrobbles.length) {
      canvas._peakHoursMeta = null;
      canvas._peakHoursScrobbles = scrobbles;
      canvas._peakHoursHoverDay = null;
      canvas.style.cursor = "default";
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
    const activeDay = Number.isInteger(hoverDay) ? hoverDay : null;
    const hasActiveDay = activeDay !== null;

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

    const lineEntries = counts.map((dayCounts, dayIdx) => {
      const points = dayCounts.map((count, hour) => ({
        x: xForHour(hour),
        y: yForCount(count),
      }));
      return {
        dayIdx,
        color: dayColors[dayIdx % dayColors.length],
        points,
        path: buildPeakHoursCurvePath(points),
      };
    });

    const drawLineEntry = (entry, { emphasise = false, muted = false } = {}) => {
      const fallbackPath = () => {
        ctx.beginPath();
        ctx.moveTo(entry.points[0].x, entry.points[0].y);
        for (let i = 0; i < entry.points.length - 1; i += 1) {
          const p0 = entry.points[i - 1] || entry.points[i];
          const p1 = entry.points[i];
          const p2 = entry.points[i + 1];
          const p3 = entry.points[i + 2] || p2;
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
      };

      ctx.save();
      ctx.strokeStyle = entry.color;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.globalAlpha = muted ? 0.18 : 0.88;
      ctx.lineWidth = emphasise ? 3.4 : 1.7;
      if (emphasise) {
        ctx.globalAlpha = 1;
        ctx.shadowColor = entry.color;
        ctx.shadowBlur = 10;
      }
      if (entry.path) {
        ctx.stroke(entry.path);
      } else {
        fallbackPath();
        ctx.stroke();
      }
      ctx.restore();
    };

    lineEntries.forEach((entry) => {
      if (hasActiveDay && entry.dayIdx === activeDay) return;
      drawLineEntry(entry, { muted: hasActiveDay });
    });

    if (hasActiveDay) {
      const activeEntry = lineEntries[activeDay];
      if (activeEntry) drawLineEntry(activeEntry, { emphasise: true });
    }

    const legendY = pad.t + 4;
    const itemW = Math.max(58, Math.floor((width - pad.l - pad.r) / 7));
    const legendItems = [];
    dayNames.forEach((label, i) => {
      const x = pad.l + i * itemW;
      const y = legendY;
      const isActive = activeDay === i;
      const isMuted = hasActiveDay && !isActive;
      const labelWidth = Math.max(34, ctx.measureText(label).width + 20);
      legendItems.push({
        dayIdx: i,
        x,
        y: y - 9,
        w: Math.max(itemW - 4, labelWidth),
        h: 18,
      });
      ctx.save();
      ctx.strokeStyle = dayColors[i % dayColors.length];
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.globalAlpha = isMuted ? 0.28 : 1;
      if (isActive) {
        ctx.shadowColor = dayColors[i % dayColors.length];
        ctx.shadowBlur = 6;
      }
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 12, y);
      ctx.stroke();
      ctx.font = "10px 'Ubuntu Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isActive ? "rgba(53,48,39,1)" : (isMuted ? "rgba(78,71,56,0.42)" : "rgba(78,71,56,0.9)");
      ctx.fillText(label, x + 16, y);
      ctx.restore();
    });

    canvas._peakHoursScrobbles = scrobbles;
    canvas._peakHoursHoverDay = activeDay;
    canvas._peakHoursMeta = {
      lines: lineEntries.map((entry) => ({
        dayIdx: entry.dayIdx,
        path: entry.path,
      })),
      legendItems,
    };
  }

  function bindPeakHoursInteractions(canvas) {
    if (!canvas || canvas.dataset.peakHoursBound === "true") return;
    canvas.dataset.peakHoursBound = "true";

    const getCanvasPoint = (event) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const getLegendDayAtPoint = (x, y) => {
      const legendItems = canvas._peakHoursMeta?.legendItems || [];
      return legendItems.find((item) => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h)?.dayIdx ?? null;
    };

    const getLineDayAtPoint = (x, y) => {
      const ctx = canvas.getContext?.("2d");
      const lines = canvas._peakHoursMeta?.lines || [];
      if (!ctx || !lines.length || typeof ctx.isPointInStroke !== "function") return null;
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i];
        if (!line.path) continue;
        ctx.save();
        ctx.lineWidth = 12;
        if (ctx.isPointInStroke(line.path, x, y)) {
          ctx.restore();
          return line.dayIdx;
        }
        ctx.restore();
      }
      return null;
    };

    const setHoverDay = (dayIdx) => {
      const nextHoverDay = Number.isInteger(dayIdx) ? dayIdx : null;
      if (canvas._peakHoursHoverDay === nextHoverDay) return;
      canvas._peakHoursHoverDay = nextHoverDay;
      canvas.style.cursor = nextHoverDay !== null ? "pointer" : "default";
      drawPeakHoursOnCanvas(canvas, canvas._peakHoursScrobbles || [], { hoverDay: nextHoverDay });
    };

    canvas.addEventListener("mousemove", (event) => {
      const { x, y } = getCanvasPoint(event);
      const legendDay = getLegendDayAtPoint(x, y);
      const lineDay = legendDay === null ? getLineDayAtPoint(x, y) : null;
      setHoverDay(legendDay ?? lineDay);
    });

    canvas.addEventListener("mouseleave", () => {
      setHoverDay(null);
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
    let res = await fetch("/api/scrobbles");
    let text = "";
    if (res.ok) {
      text = await res.text();
    }
    let parsed = text ? parseCsv(text).filter((r) => r.uts && r.artist && r.track) : [];
    if (!res.ok || parsed.length === 0) {
      res = await fetch("/data/scrobbles.csv");
      if (!res.ok) throw new Error(`scrobbles.csv fetch failed: ${res.status}`);
      text = await res.text();
      parsed = parseCsv(text).filter((r) => r.uts && r.artist && r.track);
    }
    cacheState.scrobbles = parsed;
    return cacheState.scrobbles;
  }

  async function loadCollectionCsv() {
    if (cacheState.collection) return cacheState.collection;
    const res = await fetch("/data/collection.csv");
    if (!res.ok) throw new Error(`collection.csv fetch failed: ${res.status}`);
    const text = await res.text();
    cacheState.collection = parseCsv(text).filter((row) => !isIgnoredAlbumRow(row));
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
    if (firstEl) firstEl.textContent = formatDateTime(first.uts);
    if (lastEl) lastEl.textContent = formatDateTime(last.uts);
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
    const hoverIndex = lineCanvas?._lineHoverIndex ?? null;

    if (reflectivChartState.lineTween) {
      reflectivChartState.lineTween.kill();
      reflectivChartState.lineTween = null;
    }

    if (!lineCanvas || !reflectivChartState.lineSeries.length || !series.length) {
      drawLineOnCanvas(lineCanvas, series, reflectivState.range, { hoverIndex });
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
          drawLineOnCanvas(lineCanvas, blended, reflectivState.range, {
            hoverIndex: lineCanvas?._lineHoverIndex ?? null,
          });
        },
        onComplete: () => {
          reflectivChartState.lineSeries = cloneSeries(series);
          reflectivChartState.lineTween = null;
        },
      });
    }
    bindScrobblesLineInteractions(lineCanvas);

    drawBarsOnCanvas(modal.querySelector("#tagPie"), reflectivState.topTags, "name", "count");
    const peakHoursCanvas = modal.querySelector("#peakHours");
    drawPeakHoursOnCanvas(peakHoursCanvas, scrobbles, {
      hoverDay: peakHoursCanvas?._peakHoursHoverDay ?? null,
    });
    bindPeakHoursInteractions(peakHoursCanvas);

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

  function sortAlphaIgnoringArticles(values) {
    const stripArticle = (value) => {
      const raw = String(value || "").trim();
      if (!raw) return "";
      const lower = raw.toLowerCase();
      if (lower.startsWith("the ")) return raw.slice(4).trim() || raw;
      if (lower.startsWith("an ")) return raw.slice(3).trim() || raw;
      if (lower.startsWith("a ")) return raw.slice(2).trim() || raw;
      return raw;
    };
    return [...values].sort((a, b) => {
      const aKey = stripArticle(a);
      const bKey = stripArticle(b);
      const cmp = aKey.localeCompare(bKey, "en-GB", { sensitivity: "base" });
      if (cmp !== 0) return cmp;
      return String(a).localeCompare(String(b), "en-GB", { sensitivity: "base" });
    });
  }

  function normalizeLibrarySongKey(value) {
    return String(value || "").trim().toLowerCase();
  }

  function buildArtistSongCountExclusions(rows) {
    const exclusions = new Set();
    const dusterArtist = "Duster";
    const dusterBoxSet = "Capsule Losing Contact";
    const dusterSongsOutsideBoxSet = new Set();

    rows.forEach((row) => {
      const artist = (row.Artist || "").trim();
      const album = (row.Album || "").trim();
      const songKey = normalizeLibrarySongKey(row.Song);
      if (artist !== dusterArtist || !songKey || album === dusterBoxSet) return;
      dusterSongsOutsideBoxSet.add(songKey);
    });

    rows.forEach((row, index) => {
      const artist = (row.Artist || "").trim();
      const album = (row.Album || "").trim();
      const songKey = normalizeLibrarySongKey(row.Song);
      if (artist !== dusterArtist || album !== dusterBoxSet || !songKey) return;
      if (dusterSongsOutsideBoxSet.has(songKey)) exclusions.add(index);
    });

    return exclusions;
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
    const artistSongCountExclusions = buildArtistSongCountExclusions(rows);
    const albums = new Set();
    const artists = new Set();
    const genres = new Set();
    const artistSongCounts = new Map();
    const artistDurationTotals = new Map();
    const genreSongCounts = new Map();
    const genreDurationTotals = new Map();
    const umbrellaGenreCounts = new Map();
    const fileTypeCounts = new Map();
    const durationValues = [];
    const durationYearPoints = [];
    const songDurationEntries = [];
    let totalDurationSeconds = 0;
    const albumUmbrellasByKey = new Map();
    const artistAlbumSets = new Map();
    const genreAlbumSets = new Map();
    const albumYearByKey = new Map();
    const albumDurationTotals = new Map();
    const albumSongCounts = new Map();
    const albumEntryByKey = new Map();
    const albumCountriesByKey = new Map();

    rows.forEach((r, index) => {
      const artist = (r.Artist || "").trim();
      const album = (r.Album || "").trim();
      const song = (r.Song || "").trim();
      const albumKey = artist && album ? `${artist.toLowerCase()}::${album.toLowerCase()}` : "";
      if (albumKey && !albumEntryByKey.has(albumKey)) {
        albumEntryByKey.set(albumKey, {
          artist,
          album,
          label: `${album} — ${artist}`,
        });
      }

      if (artist) artists.add(artist);
      if (albumKey) albums.add(albumKey);
      if (albumKey) albumSongCounts.set(albumKey, (albumSongCounts.get(albumKey) || 0) + 1);
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
      if (artist && !artistSongCountExclusions.has(index)) {
        artistSongCounts.set(artist, (artistSongCounts.get(artist) || 0) + 1);
      }

      const duration = parseDurationToSeconds(r.Duration);
      const year = Number.parseInt((r.Year || "").trim(), 10);
      if (Number.isFinite(duration) && duration > 0) {
        durationValues.push(duration);
        songDurationEntries.push({
          duration,
          label: song && artist ? `${song} - ${artist}` : song || artist || "unknown song",
        });
        if (Number.isInteger(year) && year >= 1900 && year <= 2100) {
          durationYearPoints.push({ year, duration });
        }
        totalDurationSeconds += duration;
        if (artist) {
          artistDurationTotals.set(artist, (artistDurationTotals.get(artist) || 0) + duration);
        }
        if (albumKey) albumDurationTotals.set(albumKey, (albumDurationTotals.get(albumKey) || 0) + duration);
        rowGenres.forEach((genre) => {
          genreDurationTotals.set(genre, (genreDurationTotals.get(genre) || 0) + duration);
        });
      }
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

    const genresByUmbrella = new Map();
    genreSongCounts.forEach((count, genre) => {
      const umbrella = normalizedGenreUmbrellaMap[normalizeGenreKey(genre)] || "other";
      if (!genresByUmbrella.has(umbrella)) genresByUmbrella.set(umbrella, new Map());
      genresByUmbrella.get(umbrella).set(genre, count);
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
    const albumsByYearMap = new Map();
    const filteredAlbumEntries = [];
    albumYearByKey.forEach((year, albumKey) => {
      const umbrellas = albumUmbrellasByKey.get(albumKey);
      if (reflectivState.libraryYearGenreFilter !== "all" && !umbrellas?.has(reflectivState.libraryYearGenreFilter)) return;
      filteredYearCountsMap.set(year, (filteredYearCountsMap.get(year) || 0) + 1);
      if (!albumsByYearMap.has(year)) albumsByYearMap.set(year, []);
      const entry = albumEntryByKey.get(albumKey) || { album: albumKey, artist: "", label: albumKey };
      albumsByYearMap.get(year).push(entry);
      filteredAlbumEntries.push(entry);
    });
    const sortAlbumEntries = (a, b) => {
      const normalizeAlbumSort = (value) => {
        const raw = String(value || "").trim();
        if (!raw) return "";
        const lower = raw.toLowerCase();
        if (lower.startsWith("the ")) return raw.slice(4).trim() || raw;
        if (lower.startsWith("an ")) return raw.slice(3).trim() || raw;
        if (lower.startsWith("a ")) return raw.slice(2).trim() || raw;
        return raw;
      };
      const albumCompare = normalizeAlbumSort(a.album || "").localeCompare(
        normalizeAlbumSort(b.album || ""),
        undefined,
        { sensitivity: "base" },
      );
      if (albumCompare !== 0) return albumCompare;
      return (a.artist || "").localeCompare(b.artist || "", undefined, { sensitivity: "base" });
    };
    albumsByYearMap.forEach((list) => list.sort(sortAlbumEntries));
    filteredAlbumEntries.sort(sortAlbumEntries);
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

    const setStat = (baseId, value, detail) => {
      setText(`#${baseId}`, value || "-");
      setText(`#${baseId}-detail`, detail || "no data");
    };
    const pickExtreme = (items, compareFn) => {
      if (!items.length) return null;
      return [...items].sort(compareFn)[0];
    };

    const longestSong = pickExtreme(songDurationEntries, (a, b) => (
      b.duration - a.duration || compareTextValues(a.label, b.label)
    ));
    const shortestSong = pickExtreme(songDurationEntries, (a, b) => (
      a.duration - b.duration || compareTextValues(a.label, b.label)
    ));
    const albumDurationEntries = [...albumDurationTotals.entries()].map(([albumKey, duration]) => ({
      key: albumKey,
      duration,
      label: albumEntryByKey.get(albumKey)?.label || albumKey,
    }));
    const longestAlbum = pickExtreme(albumDurationEntries, (a, b) => (
      b.duration - a.duration || compareTextValues(a.label, b.label)
    ));
    const mostSongsAlbum = pickExtreme([...albumSongCounts.entries()].map(([albumKey, count]) => ({
      key: albumKey,
      count,
      label: albumEntryByKey.get(albumKey)?.label || albumKey,
    })), (a, b) => (
      b.count - a.count || compareTextValues(a.label, b.label)
    ));

    setStat(
      "musiclib-longest-song",
      longestSong ? formatDurationCardLabel(longestSong.duration) : "-",
      longestSong?.label,
    );
    setStat(
      "musiclib-shortest-song",
      shortestSong ? formatDurationCardLabel(shortestSong.duration) : "-",
      shortestSong?.label,
    );
    setStat(
      "musiclib-longest-album",
      longestAlbum ? formatDurationCardLabel(longestAlbum.duration) : "-",
      longestAlbum?.label,
    );
    setStat(
      "musiclib-most-songs-album",
      mostSongsAlbum ? `${mostSongsAlbum.count.toLocaleString()} songs` : "-",
      mostSongsAlbum?.label,
    );

    reflectivState.libraryArtists = sortAlphaIgnoringArticles(artists);
    reflectivState.libraryGenres = sortAlpha(genres);

    const topArtistsList = modal.querySelector("#libraryTopArtistsList");
    const topArtistsCountLabel = modal.querySelector("#libraryTopArtistsCountLabel");
    const topGenresCountLabel = modal.querySelector("#libraryTopGenresCountLabel");
    if (topArtistsList) {
      const metric = reflectivState.libraryMetric;
      const topArtists = (metric === "albums"
        ? [...artistAlbumSets.entries()].map(([name, albumSet]) => [name, albumSet.size])
        : metric === "duration"
          ? [...artistDurationTotals.entries()]
          : [...artistSongCounts.entries()])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);
      const totalForPercent = metric === "albums" ? albums.size : metric === "duration" ? totalDurationSeconds : rows.length;
      const percentFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
      const valueFormatter = metric === "duration"
        ? (value) => `${Math.round(value / 60).toLocaleString("en-GB")}`
        : (value) => value.toLocaleString();
      if (topArtistsCountLabel) topArtistsCountLabel.textContent = metric === "duration" ? "duration (mins)" : metric;
      topArtistsList.innerHTML = topArtists
        .map(([name, count], i) => {
          const share = totalForPercent > 0 ? `${percentFormatter.format((count / totalForPercent) * 100)}%` : "0%";
          return `<li><span class="artist-name">${i + 1}. ${name}</span><span class="artist-count">${valueFormatter(count)}</span><span class="artist-share">${share}</span></li>`;
        })
        .join("");
    }

    const topGenresList = modal.querySelector("#libraryTopGenresList");
    if (topGenresList) {
      const metric = reflectivState.libraryMetric;
      const topGenres = (metric === "albums"
        ? [...genreAlbumSets.entries()].map(([name, albumSet]) => [name, albumSet.size])
        : metric === "duration"
          ? [...genreDurationTotals.entries()]
          : [...genreSongCounts.entries()])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50);
      const totalForPercent = metric === "albums" ? albums.size : metric === "duration" ? totalDurationSeconds : rows.length;
      const percentFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
      const valueFormatter = metric === "duration"
        ? (value) => `${Math.round(value / 60).toLocaleString("en-GB")}`
        : (value) => value.toLocaleString();
      if (topGenresCountLabel) topGenresCountLabel.textContent = metric === "duration" ? "duration (mins)" : metric;
      topGenresList.innerHTML = topGenres
        .map(([name, count], i) => {
          const share = totalForPercent > 0 ? `${percentFormatter.format((count / totalForPercent) * 100)}%` : "0%";
          return `<li><span class="artist-name">${i + 1}. ${name}</span><span class="artist-count">${valueFormatter(count)}</span><span class="artist-share">${share}</span></li>`;
        })
        .join("");
    }

    const metricButtons = modal.querySelectorAll(".musiclib-metric-filter[data-metric]");
    metricButtons.forEach((button) => {
      const metric = button.dataset.metric || "songs";
      button.classList.toggle("active", metric === reflectivState.libraryMetric);
    });

    const albumsByYearCanvas = modal.querySelector("#libraryAlbumsByYear");
    const activeYear =
      Number.isFinite(Number(reflectivState.libraryAlbumsYearFocus))
        ? Number(reflectivState.libraryAlbumsYearFocus)
        : null;
    if (albumsByYearCanvas) {
      drawAlbumsByYearCanvas(albumsByYearCanvas, filteredAlbumsByYear, {
        useProportion: true,
        activeYear,
      });
      albumsByYearCanvas._yearAlbumsMap = albumsByYearMap;
      bindAlbumsByYearInteractions(modal, albumsByYearCanvas);
    }
    if (reflectivState.libraryAlbumsYearFocus) {
      if (reflectivState.libraryAlbumsYearFocus === "all") {
        updateAlbumsByYearModal(modal, "all albums", filteredAlbumEntries);
      } else {
        const albums = albumsByYearMap.get(activeYear) || [];
        if (!albums.length) {
          reflectivState.libraryAlbumsYearFocus = null;
        } else {
          updateAlbumsByYearModal(modal, activeYear, albums);
        }
      }
    }
    renderMusicLibraryWorldMap(modal, countryAlbumCounts);
    const focusUmbrella = reflectivState.libraryGenreFocus;
    const focusedMap = focusUmbrella ? genresByUmbrella.get(focusUmbrella) : null;
    if (focusUmbrella && !focusedMap) {
      reflectivState.libraryGenreFocus = null;
    }
    const umbrellaCanvas = modal.querySelector("#libraryGenreUmbrellaPie");
    const umbrellaModalCanvas = document.querySelector("#libraryGenreUmbrellaPieModal");
    const pieOptions = focusedMap
      ? {
          centerLabel: focusUmbrella,
          centerLabelFormatter: formatUmbrellaCenterLabel,
          enableHover: false,
          legendFontSize: 12,
          legendRowH: 16,
          centerFontSize: 12,
        }
      : {
          enableHover: true,
          showHoverCenterLabel: true,
          centerLabelFormatter: formatUmbrellaCenterLabel,
          legendFontSize: 12,
          legendRowH: 16,
          centerFontSize: 12,
        };
    const modalPieOptions = focusedMap
      ? {
          centerLabel: focusUmbrella,
          centerLabelFormatter: formatUmbrellaCenterLabel,
          enableHover: false,
          legendFontSize: 14,
          legendRowH: 20,
          centerFontSize: 14,
        }
      : {
          enableHover: true,
          showHoverCenterLabel: true,
          centerLabelFormatter: formatUmbrellaCenterLabel,
          legendFontSize: 14,
          legendRowH: 20,
          centerFontSize: 14,
        };

    if (umbrellaCanvas) {
      drawGenreUmbrellaPie(umbrellaCanvas, focusedMap || umbrellaGenreCounts, pieOptions);
      bindGenreUmbrellaPieInteractions(modal, umbrellaCanvas);
    }
    if (umbrellaModalCanvas) {
      drawGenreUmbrellaPie(umbrellaModalCanvas, focusedMap || umbrellaGenreCounts, modalPieOptions);
      bindGenreUmbrellaPieInteractions(modal, umbrellaModalCanvas);
    }
    drawGenreUmbrellaPie(modal.querySelector("#libraryFileTypePie"), fileTypeCounts);
    drawDurationDistributionLine(modal.querySelector("#libraryDurationScatter"), durationValues);
    drawSongLengthOverTimeScatter(modal.querySelector("#libraryDurationYearScatter"), durationYearPoints);
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

    const albumsCard = modal.querySelector("#musiclib-albums-card");
    if (albumsCard) {
      const openAllAlbums = () => {
        if (!cacheState.collection?.length) return;
        reflectivState.libraryAlbumsYearFocus = "all";
        renderMusicLibraryPanel(modal, cacheState.collection);
        const showModal = getShowModal?.();
        if (showModal && modals.albumsByYear) showModal(modals.albumsByYear);
      };
      albumsCard.addEventListener("click", openAllAlbums);
      albumsCard.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openAllAlbums();
      });
    }

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
    reflectivState.libraryAlbumsYearFocus = null;
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
      const { byArtistAlbum, byArtistTrack, byAlbumTrack } = buildCollectionTagMaps(collection);
      reflectivState.scrobbles.forEach((scrobble) => {
        const artist = normalizeKey(scrobble.artist);
        const album = normalizeKey(scrobble.album);
        const track = normalizeKey(scrobble.track);
        if (!artist && !album && !track) return;
        const genres =
          (artist && album ? byArtistAlbum.get(`${artist}::${album}`) : null) ||
          (artist && track ? byArtistTrack.get(`${artist}::${track}`) : null) ||
          (album && track ? byAlbumTrack.get(`${album}::${track}`) : null);
        if (!genres) return;
        const tags = genres
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
