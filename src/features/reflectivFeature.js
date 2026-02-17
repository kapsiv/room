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

export function createReflectivFeature({ gsap, modals, getShowModal }) {
  const reflectivState = {
    range: "all",
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
    const daily = reflectivState.daily;
    if (!daily.length) return [];
    if (range === "week") return lastNDays(daily, 7).map((d) => ({ label: d.day.slice(5), count: d.count, date: d.date }));
    if (range === "month") return lastNDays(daily, 31).map((d) => ({ label: d.day.slice(5), count: d.count, date: d.date }));
    if (range === "year") return lastNDays(daily, 365).map((d) => ({ label: d.day.slice(2), count: d.count, date: d.date }));
    return aggregateMonthly(daily);
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

  function drawAlbumsByYearCanvas(canvas, yearCounts) {
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
    const years = [];
    for (let year = minYear; year <= maxYear; year += 1) {
      years.push({ year, count: countsMap.get(year) || 0 });
    }

    const pad = { l: 28, r: 12, t: 12, b: 34 };
    const usableW = width - pad.l - pad.r;
    const usableH = height - pad.t - pad.b;
    const maxCount = Math.max(...years.map((y) => y.count), 1);
    const barW = Math.max(1, usableW / years.length);

    ctx.strokeStyle = "rgba(78,71,56,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + usableH);
    ctx.lineTo(width - pad.r, pad.t + usableH);
    ctx.stroke();

    years.forEach((entry, i) => {
      if (!entry.count) return;
      const h = (entry.count / maxCount) * usableH;
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
    const scrobbles = reflectivState.scrobbles;
    const totalEl = modal.querySelector("#fact-total-scrobbles");
    const busyEl = modal.querySelector("#fact-busiest-day");
    const firstEl = modal.querySelector("#fact-last-updated");
    const lastEl = modal.querySelector("#fact-first-scrobble");
    if (!scrobbles.length) return;

    const first = scrobbles[scrobbles.length - 1];
    const last = scrobbles[0];
    const busiest = reflectivState.daily.reduce((max, d) => (d.count > max.count ? d : max), reflectivState.daily[0]);

    if (totalEl) totalEl.textContent = scrobbles.length.toLocaleString();
    if (busyEl) busyEl.textContent = `${busiest.count} on ${busiest.day}`;
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

  function renderMusicLibraryPanel(modal, rows) {
    const albums = new Set();
    const artists = new Set();
    const genres = new Set();
    const artistCounts = new Map();
    const genreCounts = new Map();
    const albumYearByKey = new Map();
    const albumCountriesByKey = new Map();

    rows.forEach((r) => {
      const artist = (r.Artist || "").trim();
      const album = (r.Album || "").trim();
      const albumKey = artist && album ? `${artist.toLowerCase()}::${album.toLowerCase()}` : "";

      if (artist) artists.add(artist);
      if (albumKey) albums.add(albumKey);
      (r.Genres || "")
        .split(";")
        .map((g) => g.trim().toLowerCase())
        .filter(Boolean)
        .forEach((g) => {
          genres.add(g);
          genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
        });
      if (artist) artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);

      const year = Number.parseInt((r.Year || "").trim(), 10);
      if (albumKey && Number.isInteger(year) && year >= 1900 && year <= 2100 && !albumYearByKey.has(albumKey)) {
        albumYearByKey.set(albumKey, year);
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

    const albumYearCounts = new Map();
    albumYearByKey.forEach((year) => {
      albumYearCounts.set(year, (albumYearCounts.get(year) || 0) + 1);
    });
    const albumsByYear = [...albumYearCounts.entries()]
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);
    const countryAlbumCounts = new Map();
    albumCountriesByKey.forEach((countrySet) => {
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

    const topArtistsList = modal.querySelector("#libraryTopArtistsList");
    if (topArtistsList) {
      const topArtists = [...artistCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
      topArtistsList.innerHTML = topArtists
        .map(([name, count], i) => `<li><span class="artist-name">${i + 1}. ${name}</span><span class="artist-count">${count.toLocaleString()}</span></li>`)
        .join("");
    }

    const topGenresList = modal.querySelector("#libraryTopGenresList");
    if (topGenresList) {
      const topGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
      topGenresList.innerHTML = topGenres
        .map(([name, count], i) => `<li><span class="artist-name">${i + 1}. ${name}</span><span class="artist-count">${count.toLocaleString()}</span></li>`)
        .join("");
    }

    drawAlbumsByYearCanvas(modal.querySelector("#libraryAlbumsByYear"), albumsByYear);
    renderMusicLibraryWorldMap(modal, countryAlbumCounts);
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
        renderReflectivCharts(modal);
      });
    });

    const libraryBtn = modal.querySelector(".reflectiv-musiclib-button");
    if (libraryBtn) {
      libraryBtn.addEventListener("click", () => {
        setReflectivTab(modal, "library");
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
