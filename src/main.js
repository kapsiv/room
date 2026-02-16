import './style.scss'

import gsap from "gsap";
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from './utils/OrbitControls.js';

let isLoading = true;
let loadingRevealStarted = false;
const manager = new THREE.LoadingManager();

const loadingScreen = document.querySelector(".loading-screen");

if (loadingScreen) {
  const logoPath = document.querySelector("#logo");
  if (logoPath) {
    const pathLength = logoPath.getTotalLength();

    logoPath.style.strokeDasharray = pathLength;
    logoPath.style.strokeDashoffset = pathLength;

    gsap.to(logoPath, {
      strokeDashoffset: 0,
      duration: 2,
      ease: "power2.inOut",
    });
  }
}

function playLoadingReveal() {
  if (loadingRevealStarted) return;
  loadingRevealStarted = true;
  const tl = gsap.timeline();
  tl.to(loadingScreen, {
    scale: 0.54,
    duration: 2,
    ease: "power4.inOut",
  }).to(
    loadingScreen,
    {
      y: "220vh",
      opacity: 0,
      duration: 1.2,
      ease: "power4.inOut",
      onComplete: () => {
        isLoading = false;
        playIntroAnimation();
        loadingScreen.remove();
      },
    },
    "-=0.1"
  );
}


manager.onLoad = () => playLoadingReveal();

const canvas = document.querySelector("#experience-canvas")
const sizes ={
  width: window.innerWidth,
  height: window.innerHeight
}

const modals = {
  blu: document.querySelector(".modal.blu"),
  reflectiv: document.querySelector(".modal.reflectiv"),
  nowplaying: document.querySelector(".modal.nowplaying"),
  archive: document.querySelector(".modal.archive"),
};

const LASTFM_USER = "kapsiv";
const LASTFM_API_KEY = "683650a829cee53959e8d505e8841726";
const LASTFM_ENDPOINT = "https://ws.audioscrobbler.com/2.0/";
const WORLD_GEOJSON_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

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
  const mapAspect = 2; // equirectangular world: 360 / 180
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
        showModal(modals.nowplaying);
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
const modalMargin = 16;
let modalZIndex = 10000;

function clampModalPosition(modal, left, top) {
  const rect = modal.getBoundingClientRect();
  const maxLeft = Math.max(modalMargin, window.innerWidth - rect.width - modalMargin);
  const maxTop = Math.max(modalMargin, window.innerHeight - rect.height - modalMargin);

  return {
    left: Math.min(Math.max(modalMargin, left), maxLeft),
    top: Math.min(Math.max(modalMargin, top), maxTop),
  };
}

function bringModalToFront(modal) {
  modalZIndex += 1;
  modal.style.zIndex = String(modalZIndex);
}

function placeModalAt(modal, left, top) {
  const clamped = clampModalPosition(modal, left, top);
  modal.style.left = `${clamped.left}px`;
  modal.style.top = `${clamped.top}px`;
}

function centerModal(modal) {
  const rect = modal.getBoundingClientRect();
  const left = (window.innerWidth - rect.width) / 2;
  const top = (window.innerHeight - rect.height) / 2;
  placeModalAt(modal, left, top);
}

function setupDraggableModal(modal) {
  const handle = modal.querySelector(".modal-window-bar");
  if (!handle) return;

  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const endDrag = () => {
    activePointerId = null;
    modal.classList.remove("dragging");
  };

  handle.addEventListener("pointerdown", (e) => {
    const isMouse = e.pointerType === "mouse";
    if (isMouse && e.button !== 0) return;
    if (e.target.closest(".modal-exit-button")) return;

    e.preventDefault();
    activePointerId = e.pointerId;

    const rect = modal.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    bringModalToFront(modal);
    modal.classList.add("dragging");
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener("pointermove", (e) => {
    if (activePointerId !== e.pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    placeModalAt(modal, startLeft + dx, startTop + dy);
  });

  handle.addEventListener("pointerup", (e) => {
    if (activePointerId !== e.pointerId) return;
    handle.releasePointerCapture(e.pointerId);
    endDrag();
  });

  handle.addEventListener("pointercancel", endDrag);

  modal.addEventListener("click", (e) => e.stopPropagation());
  modal.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  modal.addEventListener("touchend", (e) => e.stopPropagation(), { passive: true });
}

Object.values(modals).forEach((modal) => {
  if (modal) setupDraggableModal(modal);
});

let touchHappened = false;
document.querySelectorAll(".modal-exit-button").forEach(button => {
  button.addEventListener(
    "touchend",
    (e) => {
      touchHappened = true;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModal(modal);
    },
    {passive: false }
  );

  button.addEventListener(
    "click",
    (e) => {
      if(touchHappened) return;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModal(modal);
    },
    {passive: false }
  );
});


const showModal = (modal) => {
  if (!modal) return;

  modal.style.display = "block";
  bringModalToFront(modal);

  if (!modal.dataset.positioned) {
    centerModal(modal);
    modal.dataset.positioned = "true";
  } else {
    const rect = modal.getBoundingClientRect();
    placeModalAt(modal, rect.left, rect.top);
  }

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }

  document.body.style.cursor = 'default';
  currentIntersects = [];

  gsap.set(modal, { opacity: 0});

  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
  });

  if (modal === modals.blu) {
    initAboutModal(modal);
    const pill = modal.querySelector(".now-playing-pill");
    if (pill && modal.dataset.aboutBound !== "true") {
      modal.dataset.aboutBound = "true";
      pill.style.cursor = "pointer";
      pill.addEventListener("click", () => {
        showModal(modals.nowplaying);
      });
    }
  }

  if (modal === modals.nowplaying) {
    initNowPlayingModal(modal);
  }

  if (modal === modals.reflectiv) {
    initReflectivModal(modal);
  }
};

const hideModal = (modal) => {
  if (!modal) return;

  gsap.to(modal, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      modal.style.display = "none";
    },
  });
};

const stringAudioByIndex = {
  1: new Audio("/audio/guitar-string-1.mp3"),
  2: new Audio("/audio/guitar-string-2.mp3"),
  3: new Audio("/audio/guitar-string-3.mp3"),
  4: new Audio("/audio/guitar-string-4.mp3"),
};

Object.values(stringAudioByIndex).forEach((a) => {
  a.preload = "auto";
});

let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;

  const first = stringAudioByIndex[1];
  if (!first) return;

  const prevVol = first.volume;
  first.volume = 0;

  first.play()
    .then(() => {
      first.pause();
      first.currentTime = 0;
      first.volume = prevVol;
      audioUnlocked = true;
      console.log("Audio working");
    })
    .catch((err) => {
      console.warn("Audio unlock failed:", err);
    });
}

canvas.addEventListener("pointerdown", unlockAudio, { once: true });

function playStringSoundByIndex(i) {
  if (!audioUnlocked) return;

  const base = stringAudioByIndex[i];
  if (!base) return;

  const a = base.cloneNode(true);
  a.currentTime = 0;
  a.volume = 0.85;
  a.play().catch((err) => {
    console.warn("Audio play failed:", err);
  });
}

function getGuitarStringIndex(object) {
  let cur = object;
  while (cur) {
    const name = typeof cur.name === "string" ? cur.name : "";

    const m = name.match(/Guitar\.?0*([1-4])_Fifth/i);
    if (m) return Number(m[1]);

    cur = cur.parent;
  }
  return null;
}

let chairTop;
let marimo;
let hourHand;
let minuteHand;
const monsteras = [];
const yAxisVinyl = []

let bookBlue,
  bookGreen,
  bookYellow,
  bookOrange,
  bookPurple,
  bookBrown,
  bookRed,
  logo1,
  logo2,
  logo3,
  logo4,
  logo5,
  logo6,
  slipper1,
  slipper2,
  light1,
  light2,
  light3,
  light4,
  light5,
  light6,
  light7,
  light8,
  light9,
  light10,
  lilypad1,
  lilypad2,
  lilypad3,
  lilypad4;

const raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Loaders
const textureLoader = new THREE.TextureLoader(manager);

// Model loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( '/draco/' );

const loader = new GLTFLoader(manager);
loader.setDRACOLoader( dracoLoader );

const environmentMap = new THREE.CubeTextureLoader(manager)
  .setPath('textures/skybox/')
  .load(['px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp']);

const textureMap = {
  Zeroth: {
    day: "/textures/room/Zeroth_Texture_Set.webp",
  },
  First: {
    day: "/textures/room/First_Texture_Set.webp",
  },
  Second: {
    day: "/textures/room/Second_Texture_Set.webp",
  },
  Third: {
    day: "/textures/room/Third_Texture_Set.webp",
  },
  Fourth: {
    day: "/textures/room/Fourth_Texture_Set.webp",
  },
  Fifth: {
    day: "/textures/room/Fifth_Texture_Set.webp",
  },
  Sixth: {
    day: "/textures/room/Sixth_Texture_Set.webp",
  },
};

const loadedTextures = {
  day: {},
}

Object.entries(textureMap).forEach(([key, paths])=>{
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false
  dayTexture.colorSpace = THREE.SRGBColorSpace
  loadedTextures.day[key] = dayTexture;
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  opacity: 1,
  metalness: 0,
  roughness: 0,
  ior: 1.5,
  thickness: 0.01,
  specularIntensity: 1,
  envMap: environmentMap,
  envMapIntensity: 1,
  depthWrite: false,
})

const videoElement = document.createElement("video");
videoElement.src  = "textures/video/Screen2.mp4";
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play()

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.flipY = false;
videoTexture.center.set(0.5, 0.5);
videoTexture.rotation = -Math.PI / 2;
const zoom = 4.6;
const squash = 0.6;
videoTexture.repeat.set(zoom * squash, zoom);
videoTexture.offset.set(
  (1 - videoTexture.repeat.x) / 2,
  (1 - videoTexture.repeat.y) / 2
);
videoTexture.offset.x += 0.7;
videoTexture.offset.y += 1.50;
videoTexture.needsUpdate = true;

const screenVideoMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture,
});

// screen 1 texture

const terminalCanvas = document.createElement("canvas");
terminalCanvas.width = 1024;
terminalCanvas.height = 1024;
const terminalCtx = terminalCanvas.getContext("2d");
const terminalLines = [];
const terminalQueue = [];
const terminalMaxLines = 20;
let lastTerminalHoverKey = "";
let typingLine = "";
let typingCharIndex = 0;
let terminalLastTypeAt = 0;
let terminalLastCursorToggleAt = 0;
let terminalCursorVisible = true;

const terminalTypeIntervalMs = 26;
const terminalCursorBlinkMs = 460;
const terminalMaxQueuedLines = 60;

const screenTerminalTexture = new THREE.CanvasTexture(terminalCanvas);
screenTerminalTexture.colorSpace = THREE.SRGBColorSpace;
screenTerminalTexture.flipY = true;
screenTerminalTexture.repeat.x = -1;
screenTerminalTexture.offset.x = 1;

function wrapTerminalLine(text, maxWidth) {
  if (!terminalCtx) return [text];

  const words = text.split(" ");
  const wrapped = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (terminalCtx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      return;
    }

    if (current) {
      wrapped.push(current);
      current = "";
    }

    if (terminalCtx.measureText(word).width <= maxWidth) {
      current = word;
      return;
    }

    let chunk = "";
    for (const ch of word) {
      const next = chunk + ch;
      if (terminalCtx.measureText(next).width > maxWidth) {
        if (chunk) wrapped.push(chunk);
        chunk = ch;
      } else {
        chunk = next;
      }
    }
    current = chunk;
  });

  if (current) {
    wrapped.push(current);
  }

  return wrapped.length ? wrapped : [text];
}

function drawTerminal() {
  if (!terminalCtx) return;

  const width = terminalCanvas.width;
  const height = terminalCanvas.height;
  const rightEdge = Math.floor(width * 0.72);
  const textColumnWidth = Math.floor(width * 0.27);
  const padX = rightEdge - textColumnWidth;
  const leftInset = 100;
  const textStartX = padX + leftInset;
  const padY = 280;
  const lineHeight = 20;
  const maxTextWidth = textColumnWidth - leftInset;

  terminalCtx.fillStyle = "#d9d2c5";
  terminalCtx.fillRect(0, 0, width, height);

  terminalCtx.fillStyle = "#4e4738";
  terminalCtx.font = "700 16px 'Ubuntu Mono', monospace";
  terminalCtx.textBaseline = "top";

  const wrappedLog = [];
  terminalLines.forEach((line) => {
    wrappedLog.push(...wrapTerminalLine(line, maxTextWidth));
  });

  const inProgressLine = typingLine ? typingLine.slice(0, typingCharIndex) : "";
  const wrappedTypingLine = inProgressLine ? wrapTerminalLine(inProgressLine, maxTextWidth) : [];
  const renderLines = [...wrappedLog, ...wrappedTypingLine];

  const visibleLines = renderLines.slice(-terminalMaxLines);
  const startY = height - padY - visibleLines.length * lineHeight;

  visibleLines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    terminalCtx.fillText(line, textStartX, y);
  });

  if (terminalCursorVisible) {
    const visibleStartIndex = Math.max(0, renderLines.length - terminalMaxLines);
    let cursorLineGlobalIndex = 0;
    let cursorLineText = "";

    if (typingLine) {
      if (wrappedTypingLine.length > 0) {
        cursorLineGlobalIndex = wrappedLog.length + wrappedTypingLine.length - 1;
        cursorLineText = wrappedTypingLine[wrappedTypingLine.length - 1];
      } else {
        cursorLineGlobalIndex = wrappedLog.length;
        cursorLineText = "";
      }
    } else if (renderLines.length > 0) {
      cursorLineGlobalIndex = renderLines.length - 1;
      cursorLineText = renderLines[renderLines.length - 1];
    }

    const cursorLineVisibleIndex = cursorLineGlobalIndex - visibleStartIndex;
    const cursorY = startY + cursorLineVisibleIndex * lineHeight;
    const cursorX = textStartX + terminalCtx.measureText(cursorLineText).width + 2;

    terminalCtx.fillRect(cursorX, cursorY + 2, 2, lineHeight - 4);
  }

  screenTerminalTexture.needsUpdate = true;
}

function appendTerminalLine(text) {
  terminalQueue.push(text);

  if (terminalQueue.length > terminalMaxQueuedLines) {
    terminalQueue.splice(0, terminalQueue.length - terminalMaxQueuedLines);
  }
}

function updateTerminalTyping(timestampMs) {
  if (!terminalCtx) return;

  if (!typingLine && terminalQueue.length > 0) {
    typingLine = terminalQueue.shift() || "";
    typingCharIndex = 0;
    terminalLastTypeAt = timestampMs;
  }

  if (typingLine && timestampMs - terminalLastTypeAt >= terminalTypeIntervalMs) {
    typingCharIndex += 1;
    terminalLastTypeAt = timestampMs;

    if (typingCharIndex >= typingLine.length) {
      terminalLines.push(typingLine);
      if (terminalLines.length > terminalMaxLines * 2) {
        terminalLines.splice(0, terminalLines.length - terminalMaxLines * 2);
      }
      typingLine = "";
      typingCharIndex = 0;
    }
  }

  if (timestampMs - terminalLastCursorToggleAt >= terminalCursorBlinkMs) {
    terminalCursorVisible = !terminalCursorVisible;
    terminalLastCursorToggleAt = timestampMs;
  }

  drawTerminal();
}

function toTerminalLabel(rawName) {
  return rawName
    .replace(/_Hover$/i, "")
    .replace(/\d+/g, "")
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b(First|Second|Third|Fourth|Fifth|Sixth)\b/gi, "")
    .toLowerCase();
}

const hoverMessages = {
  guitar: [
    "click the strings to play",
    "yamaha c40",
  ],
  vinyl: [
    "analogue music",
    "vinyl spinning at 33.3",
    "reflectiv",
  ],
  blu: [
    "meow meow",
    "meow meow meow",
    "meow x3",
  ],
  bin: [
    "old stuff",
  ],
  marimo: [
    "bob the marimo",
    "marimo stil alive",
  ],
  otamatone: [
    "the coltrane of otamatone",
    "kilometers davis",
    "otamatonious monk",
  ],
  amp: [
    "vox av15",
    "treble at 0",
    "slight reverb",
  ],
  mug: [
    "tea, milk no sugar",
    "caution, contents hot",
    "wide-bottom mug",
  ],
  plant: [
    "plont",
    "do monsteras grow in water",
    "peas in a pod",
    "bology",
  ],
  default: [
    "%label% detected",
    "hovering on %label%",
    "%label% written",
    "%label% loaded",
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTodayGmtDateLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date()).toLowerCase();
}

function buildHoverTerminalLine(rawName) {
  const name = rawName || "UNKNOWN_NODE";
  if (name.includes("Keyboard") || name.includes("Chair_Top")) return null;
  if (name.includes("Calendar")) return `the date is ${getTodayGmtDateLabel()}`;
  const label = toTerminalLabel(name);

  let pool = hoverMessages.default;
  if (name.includes("Guitar")) pool = hoverMessages.guitar;
  else if (name.includes("Vinyl")) pool = hoverMessages.vinyl;
  else if (name.includes("Blu")) pool = hoverMessages.blu;
  else if (name.includes("Bin")) pool = hoverMessages.bin;
  else if (name.includes("Marimo")) pool = hoverMessages.marimo;
  else if (name.includes("Otamatone")) pool = hoverMessages.otamatone;
  else if (name.includes("Amp")) pool = hoverMessages.amp;
  else if (name.includes("Mug")) pool = hoverMessages.mug;
  else if (name.includes("Plant") || name.includes("Leaf") || name.includes("Monstera")) {
    pool = hoverMessages.plant;
  }

  return pickRandom(pool).replace("%label%", label);
}

appendTerminalLine(":: booting kapsiv");
appendTerminalLine(":: click objects !");
appendTerminalLine("‎");
appendTerminalLine("‎       ████");
appendTerminalLine("‎          ██");
appendTerminalLine("‎    █████████████");
appendTerminalLine("‎  ███     ███  ███");
appendTerminalLine("‎  ██      ███   ███");
appendTerminalLine("‎  ███     ██    ███");
appendTerminalLine("‎   ████████ ██████");
appendTerminalLine("‎      ███ █████");
appendTerminalLine("‎ ");

const screenStaticMaterial = new THREE.MeshBasicMaterial({
  map: screenTerminalTexture,
});

const screenGlassMaterial = new THREE.MeshPhysicalMaterial({
  transparent: true,
  opacity: 0.32,
  metalness: 0,
  roughness: 0.25,
  envMap: environmentMap,
  envMapIntensity: 0.35,
  clearcoat: 1,
  clearcoatRoughness: 0.2,
  depthWrite: false,

  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});

function applyScreenGlassOverlay(screenMesh) {
  screenMesh.renderOrder = 1;

  const glassOverlay = screenMesh.clone();
  glassOverlay.material = screenGlassMaterial;
  glassOverlay.renderOrder = 2;

  screenMesh.parent.add(glassOverlay);
}

window.addEventListener("mousemove", (e) => {
  touchHappened = false;
  pointer.x = ( e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("touchstart", (e) => {
  e.preventDefault();
  pointer.x = ( e.touches[0].clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
  },
  { passive: false }
);

window.addEventListener("touchend", (e) => {
  e.preventDefault();
  handleRaycasterInteraction();
  },
  { passive: false }
);

function handleRaycasterInteraction(e) {
  if (e?.target?.closest?.(".modal")) return;
  if (currentIntersects.length === 0) return;

  const hitObject = currentIntersects[0].object;

  const stringIndex = getGuitarStringIndex(hitObject);
  if (stringIndex) {
    playStringSoundByIndex(stringIndex);
    return;
  }

  if (hitObject.name.includes("Blu_Body") || hitObject.name.includes("Rug")) {
    showModal(modals.blu);
  } else if (hitObject.name.includes("Vinyl")) {
    showModal(modals.reflectiv);
  } else if (hitObject.name.includes("Bin")) {
    showModal(modals.reflectiv);
    setReflectivTab(modals.reflectiv, "library");
  }
}

function getHoverRoot(obj) {
  let cur = obj;
  while (cur) {
    if (cur.name === "Guitar_HoverGroup") return cur;
    cur = cur.parent;
  }
  return obj;
}

window.addEventListener("click", handleRaycasterInteraction);


loader.load("/models/Room_Portfolio_V4.glb", (glb) => {
  let guitarMesh = null;
  const guitarParts = [];

  glb.scene.traverse((child) => {
    if (child.isMesh) {



      if (child.name.includes("Clock_H_Second")) {
        hourHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
        child.raycast = () => {};
      }

      if (child.name.includes("Clock_M_Second")) {
        minuteHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
        child.raycast = () => {};
      }

      if(child.name.includes("Marimo_Sixth_Hover")) {
        marimo = child;
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
      }

      if(child.name.includes("Chair_Top")) {
        chairTop = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Monstera")) {
        monsteras.push(child);
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
        child.userData.swayPhase = Math.random() * Math.PI * 2;
        child.userData.swaySpeed = 0.45 + Math.random() * 0.25;
        child.userData.swayAmp = 0.03 + Math.random() * 0.02;
      }

      if (child.name === "Guitar_Fifth_Hover") guitarMesh = child;

      if (child.name.includes("Guitar")) {
        guitarParts.push(child)
      }

      const raycasterNameTags = [
        "_Zeroth",
        "_First",
        "_Second",
        "_Third",
        "_Fourth",
        "_Fifth",
        "_Sixth",
      ];
      if (raycasterNameTags.some((tag) => child.name.includes(tag))) {
        if (child.name.includes("Hover")) {
          raycasterObjects.push(child);
        } else {
          raycasterObjects.push(child);
        }
      }

      if (child.name.includes("Hover")) {
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
        child.userData.initialRotation = new THREE.Vector3().copy(child.rotation);
      }

      if (child.name.includes("Book_Blue")) {
        bookBlue = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Book_Green")) {
        bookGreen = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Book_Yellow")) {
        bookYellow = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Book_Orange")) {
        bookOrange = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Book_Purple")) {
        bookPurple = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Book_Brown")) {
        bookBrown = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Book_Red")) {
        bookRed = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Kapsiv_Logo001")) {
        logo1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Kapsiv_Logo002")) {
        logo2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Kapsiv_Logo003")) {
        logo3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Kapsiv_Logo004")) {
        logo4 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Kapsiv_Logo005")) {
        logo5 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Kapsiv_Logo006")) {
        logo6 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Slipper_Left")) {
        slipper1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Slipper_Right")) {
        slipper2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_1001")) {
        light1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_1002")) {
        light2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_1003")) {
        light3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_1004")) {
        light4 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_1005")) {
        light5 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_1006")) {
        light6 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_2001")) {
        light7 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_2002")) {
        light8 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_2003")) {
        light9 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lights_2004")) {
        light10 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lilypad_1")) {
        lilypad1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lilypad_2")) {
        lilypad2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lilypad_3")) {
        lilypad3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lilypad_4")) {
        lilypad4 = child;
        child.scale.set(0, 0, 0);
      }

      if (child.name.includes("Water")) {
          child.material = new THREE.MeshBasicMaterial({
            color: 0x558bc8,
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
          });
        } else if (child.name.includes("Screen_2")){
          child.material = screenVideoMaterial;
          applyScreenGlassOverlay(child);
        } else if (child.name.includes("Screen_1")) {
          child.material = screenStaticMaterial;
          applyScreenGlassOverlay(child);
        } else if (child.name.includes("Glass")){
          child.material = glassMaterial;
        } else {
          Object.keys(textureMap).forEach((key) => {
            if (child.name.includes(key)) {
              const material = new THREE.MeshBasicMaterial({
                map: loadedTextures.day[key],
              });

            child.material = material;

            if(child.name.includes("Vinyl")){
              yAxisVinyl.push(child);
            }

            if(child.material.map){
            child.material.map.minFilter = THREE.LinearFilter;
            }
          }
        });
      }
    }
  });
  scene.add(glb.scene);

  if (guitarMesh && guitarParts.length) {
    const guitarGroup = new THREE.Group();
    guitarGroup.name = "Guitar_HoverGroup";

    guitarGroup.position.copy(guitarMesh.position);
    guitarGroup.quaternion.copy(guitarMesh.quaternion);
    guitarGroup.scale.copy(guitarMesh.scale);

    guitarMesh.parent.add(guitarGroup);

    guitarParts.forEach((part) => {
      part.updateMatrixWorld(true);
      guitarGroup.attach(part);
    });

    guitarGroup.userData.initialScale = guitarGroup.scale.clone();
    guitarGroup.userData.initialRotation = new THREE.Euler().copy(guitarGroup.rotation);
    guitarGroup.userData.hoverTiltX = Math.PI / 24;
    guitarGroup.userData.hoverTiltY = Math.PI / 24;
    guitarGroup.userData.initialQuaternion = guitarGroup.quaternion.clone();

    raycasterObjects.push(guitarGroup);
  }
});

function playIntroAnimation() {
  const basePopDuration = 0.6;
  const settleDuration = 0.15;
  const overlap = "-=0.45";
  const overshoot = 1.15;

  const master = gsap.timeline();

  function addSequence(items, opts = {}) {
    const {
      startOffset = 0,
      speedMultiplier = 1,
      jitter = 0.08,
    } = opts;

    const tl = gsap.timeline({ delay: startOffset });

    let first = true;

    items.forEach((obj) => {
      if (!obj || !obj.scale) return;

      const popDuration =
        basePopDuration * speedMultiplier * (1 + (Math.random() - 0.5) * jitter);

      const tweenVars = {
        keyframes: [
          {
            x: overshoot,
            y: overshoot,
            z: overshoot,
            duration: popDuration,
            ease: "back.out(2.6)",
          },
          {
            x: 1,
            y: 1,
            z: 1,
            duration: settleDuration,
            ease: "power2.out",
          },
        ],
      };

      if (first) {
        tl.to(obj.scale, tweenVars);
        first = false;
      } else {
        tl.to(obj.scale, tweenVars, overlap);
      }
    });

    return tl;
  }

  // intro sequences
  master.add(
    addSequence(
      [bookBlue, bookGreen, bookYellow, bookOrange, bookPurple, bookBrown, bookRed],
      { startOffset: 0.0, speedMultiplier: 1.0 }
    ),
    0
  );

  master.add(
    addSequence([logo1, logo2, logo3, logo4, logo5, logo6], {
      startOffset: 0.1,
      speedMultiplier: 0.95,
    }),
    0
  );

  master.add(
    addSequence([slipper1, slipper2], {
      startOffset: 0.18,
      speedMultiplier: 1.05,
    }),
    0
  );

  master.add(
    addSequence(
      [light1, light2, light3, light4, light5, light6, light7, light8, light9, light10],
      { startOffset: 0.05, speedMultiplier: 0.9 }
    ),
    0
  );

  master.add(
    addSequence([lilypad1, lilypad2, lilypad3, lilypad4], {
      startOffset: 0.22,
      speedMultiplier: 1.1,
    }),
    0
  );
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1, 1000
);

camera.position.set(
  -38.44019158594338,
  18.26488478861603,
  -39.38105389743106
);

scene.background = new THREE.Color("#b8aaa5");

const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias: true });
renderer.setSize(sizes.width , sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 5;
controls.maxDistance = 70;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = -Math.PI;
controls.maxAzimuthAngle = -Math.PI / 2;;

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.update();
controls.target.set(
  0,
  4,
  0
)

// Event listeners
window.addEventListener("resize", ()=>{
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  Object.values(modals).forEach((modal) => {
    if (!modal || modal.style.display !== "block") return;
    const rect = modal.getBoundingClientRect();
    placeModalAt(modal, rect.left, rect.top);
  });
})

function getHoverScaleMultiplier(name) {
  if (typeof name !== "string") return 1;
  if (name === "Guitar_HoverGroup") return 0.92;

  if (name.includes("Pea_Plant00")) return 1.55;
  if (name.includes("Pick")) return 1.7;
  if (name.includes("Leaf")) return 1.12;
  if (name.includes("Lilypad")) return 1.12;
  if (name.includes("Box")) return 1.1;
  if (name.includes("Otamatone")) return 1.15;
  if (name.includes("Amp")) return 0.9;

  return 1;
}

function playHoverAnimation (object, isHovering) {
  const target = object;
  const hoverEase = "back.out(1.35)";
  const returnEase = "power2.out";

  if (!target.userData.initialScale) {
    target.userData.initialScale = new THREE.Vector3().copy(target.scale);
  }
  if (!target.userData.initialPosition) {
    target.userData.initialPosition = new THREE.Vector3().copy(target.position);
  }
  if (!target.userData.initialRotation) {
    target.userData.initialRotation = new THREE.Euler().copy(target.rotation);
  }

  gsap.killTweensOf(target.scale);
  gsap.killTweensOf(target.position);

  const isButton = typeof target.name === "string" && target.name.includes("Button");
  const isLogo = typeof target.name === "string" && target.name.includes("Logo");

  const isGuitar = target.name === "Guitar_HoverGroup";
  const canRotate = target.name.includes("Otamatone") || isGuitar;

  if (canRotate) {
    if (isGuitar) {
      gsap.killTweensOf(target.quaternion);
    } else {
      gsap.killTweensOf(target.rotation);
    }
  }

  if (isHovering){
    if (isButton) {
      gsap.to(target.scale, {
        x: target.userData.initialScale.x,
        y: target.userData.initialScale.y,
        z: target.userData.initialScale.z,
        duration: 0.15,
        ease: "power2.out",
      });

      gsap.to(target.position, {
        y: target.userData.initialPosition.y - 0.08,
        duration: 0.18,
        ease: "power2.out",
      });
    } else {
      const baseHoverScale = 1.2;
      const mult = getHoverScaleMultiplier(target.name);
      const hoverTarget = baseHoverScale * mult;

      gsap.to(target.scale, {
        x: target.userData.initialScale.x * hoverTarget,
        y: target.userData.initialScale.y * hoverTarget,
        z: target.userData.initialScale.z * hoverTarget,
        duration: 0.5,
        ease: hoverEase,
      });

      if (isLogo) {
        gsap.to(target.position, {
          y: target.userData.initialPosition.y + 0.32,
          duration: 0.35,
          ease: "power2.out",
        });
      }
    }

    if (canRotate) {
      if (isGuitar) {
        const tiltX = target.userData.hoverTiltX ?? Math.PI / 18;
        const tiltY = target.userData.hoverTiltY ?? Math.PI / 18;

        const deltaEuler = new THREE.Euler(-tiltX, tiltY, 0, "YXZ");
        const deltaQ = new THREE.Quaternion().setFromEuler(deltaEuler);

        const initialQ = target.userData.initialQuaternion
          ? target.userData.initialQuaternion.clone()
          : target.quaternion.clone();
        const targetQ = initialQ.clone().multiply(deltaQ);

        gsap.to(target.quaternion, {
          x: targetQ.x,
          y: targetQ.y,
          z: targetQ.z,
          w: targetQ.w,
          duration: 0.5,
          ease: hoverEase,
          onUpdate: () => target.quaternion.normalize(),
        });
      } else {
        gsap.to(target.rotation, {
          x: target.userData.initialRotation.x - Math.PI / 20,
          duration: 0.5,
          ease: hoverEase,
        });
      }
    }

  } else {
    gsap.to(target.scale, {
      x: target.userData.initialScale.x,
      y: target.userData.initialScale.y,
      z: target.userData.initialScale.z,
      duration: 0.3,
      ease: returnEase,
    });
    gsap.to(target.position, {
      y: target.userData.initialPosition.y,
      duration: 0.22,
      ease: "power2.out",
    });

    if (canRotate) {
      if (isGuitar) {
        const initialQ = target.userData.initialQuaternion
          ? target.userData.initialQuaternion
          : target.quaternion.clone();

        gsap.to(target.quaternion, {
          x: initialQ.x,
          y: initialQ.y,
          z: initialQ.z,
          w: initialQ.w,
          duration: 0.3,
          ease: returnEase,
          onUpdate: () => target.quaternion.normalize(),
        });
      } else {
        gsap.to(target.rotation, {
          x: target.userData.initialRotation.x,
          duration: 0.3,
          ease: returnEase,
        });
      }
    }
  }
}

const DEBUG_FAST_CLOCK = false;

const updateClockHands = () => {
  if (!hourHand || !minuteHand) return;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const getPart = (type) => Number(parts.find((p) => p.type === type)?.value || 0);

  const hours = getPart("hour") % 12;
  const minutes = getPart("minute");
  const seconds = getPart("second");

  let minuteAngle = 0;
  let hourAngle = 0;

  if (DEBUG_FAST_CLOCK) {
    const elapsedSeconds = performance.now() * 0.001;
    const fastMinuteCyclesPerSecond = 0.5;
    const minuteTurns = elapsedSeconds * fastMinuteCyclesPerSecond;
    const fullTurn = Math.PI * 2;

    minuteAngle = -((minuteTurns % 1) * fullTurn);
    hourAngle = -(((minuteTurns / 12) % 1) * fullTurn);
  } else {
    const minuteOffset = 17;
    const hourOffset = 7.2;

    const calibratedMinute = ((minutes + seconds / 60 - minuteOffset) % 60 + 60) % 60;
    const calibratedHour = ((hours + minutes / 60 + seconds / 3600 - hourOffset) % 12 + 12) % 12;

    minuteAngle = -(calibratedMinute * ((Math.PI * 2) / 60));
    hourAngle = -(calibratedHour * ((Math.PI * 2) / 12));
  }

  const CLOCK_ROTATION_OFFSET = -Math.PI / 2;
  minuteHand.rotation.x = -minuteAngle - CLOCK_ROTATION_OFFSET;
  hourHand.rotation.x = -hourAngle - CLOCK_ROTATION_OFFSET;
};

const render = (timestamp = 0) => {
  updateTerminalTyping(timestamp);
  controls.update();
  updateClockHands();

  // animate vinyl
  yAxisVinyl.forEach((fan) => {
    fan.rotation.y += 0.03;
  });

  // rotate chair
  if (chairTop) {
    const time = timestamp * 0.001;
    const baseAmplitude = Math.PI / 8;

    const rotationOffset =
      baseAmplitude *
      Math.sin(time * 0.5) *
      (1 - Math.abs(Math.sin(time * 0.5)) * 0.3);

    chairTop.rotation.y = chairTop.userData.initialRotation.y + rotationOffset;
  }

  // marimo bobbing
  if (marimo) {
    const time = timestamp * 0.0015;
    const amplitude = 0.12;
    const position =
      amplitude * Math.sin(time) * (1 - Math.abs(Math.sin(time)) * 0.1);
    marimo.position.y = marimo.userData.initialPosition.y + position;
  }

  // monstera sway
  if (monsteras.length) {
    const t = timestamp * 0.001;
    monsteras.forEach((plant) => {
      const base = plant.userData.initialRotation;
      const phase = plant.userData.swayPhase || 0;
      const speed = plant.userData.swaySpeed || 0.45;
      const amp = plant.userData.swayAmp || 0.04;

      const swayA = Math.sin(t * speed + phase) * amp;
      const swayB =
        Math.sin(t * (speed * 0.8) + phase * 1.7) * (amp * 0.6);

      plant.rotation.y = base.y + swayA;
      plant.rotation.z = base.z + swayB;
    });
  }

  // Raycaster
  if (!isLoading) {
    raycaster.setFromCamera(pointer, camera);

    currentIntersects = raycaster.intersectObjects(raycasterObjects, true);

    if (currentIntersects.length > 0) {
      const hitObject = currentIntersects[0].object;
      const hoverRoot = getHoverRoot(hitObject);
      const hoverLogKey = hoverRoot.name.includes("Hover") ? hoverRoot.name : hitObject.name;

      if (hoverLogKey && hoverLogKey !== lastTerminalHoverKey) {
        const line = buildHoverTerminalLine(hoverLogKey);
        if (line) {
          appendTerminalLine(line);
        }
        lastTerminalHoverKey = hoverLogKey;
      }

      document.body.style.cursor = hitObject.name.includes("Pointer")
        ? "pointer"
        : "default";

      if (hoverRoot.name.includes("Hover")) {
        if (hoverRoot !== currentHoveredObject) {
          if (currentHoveredObject) {
            playHoverAnimation(currentHoveredObject, false);
          }
          playHoverAnimation(hoverRoot, true);
          currentHoveredObject = hoverRoot;
        }
      } else {
        if (currentHoveredObject) {
          playHoverAnimation(currentHoveredObject, false);
          currentHoveredObject = null;
        }
      }
    } else {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
};

window.requestAnimationFrame(render);
