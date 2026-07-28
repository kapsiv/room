import CalHeatmap from "cal-heatmap";
import CalendarLabel from "cal-heatmap/plugins/CalendarLabel";
import "cal-heatmap/cal-heatmap.css";

const WEEKDAY_LABELS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value !== "")) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] || "").trim();
    });
    return record;
  });
}

function countBy(items, keyFn) {
  const counts = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!key && key !== 0) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function parseDateParts(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseTimeParts(value) {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function buildPseudoUtcDate(dateValue, timeValue) {
  const dateParts = parseDateParts(dateValue);
  const timeParts = parseTimeParts(timeValue);
  if (!dateParts || !timeParts) return null;

  return new Date(
    Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      timeParts.hour,
      timeParts.minute,
      0,
      0,
    ),
  );
}

function addUtcDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getLondonDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function getLondonTodayUtcDay() {
  const parts = getLondonDateParts();
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function formatDateLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateCompact(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatTimeLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "--";
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function formatAveragePerWeek(value) {
  if (!Number.isFinite(value)) return "--";
  return value >= 10 ? value.toFixed(1) : value.toFixed(2).replace(/0$/, "");
}

function drawCanvasText(ctx, text, x, y, options = {}) {
  const {
    align = "left",
    baseline = "alphabetic",
    fillStyle = "#4e4738",
    font = "11px 'Ubuntu Mono', monospace",
  } = options;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = fillStyle;
  ctx.font = font;
  ctx.fillText(text, x, y);
}

function formatMinutesAsTime(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return "--";
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatMinutesAsDuration(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return "--";
  const rounded = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function getDayDifferenceInclusive(start, end) {
  const ms = startOfUtcDay(end).getTime() - startOfUtcDay(start).getTime();
  return Math.max(1, Math.floor(ms / 86400000) + 1);
}

function getYearStart(year) {
  return new Date(Date.UTC(year, 0, 1));
}

function getYearEnd(year) {
  return new Date(Date.UTC(year, 11, 31));
}

function buildVisitRecords(rows) {
  return rows
    .map((row) => {
      const enteredAt = buildPseudoUtcDate(row.date, row.entered_at);
      if (!enteredAt) return null;

      let leftAt = buildPseudoUtcDate(row.date, row.left_at);
      if (leftAt && leftAt.getTime() < enteredAt.getTime()) {
        leftAt = addUtcDays(leftAt, 1);
      }

      const durationMinutes = Number.parseInt(row.duration_minutes, 10);
      return {
        dateKey: row.date,
        enteredAt,
        leftAt,
        durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 0,
        gymId: row.gym_id || "",
        gymName: row.gym_name || "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.enteredAt.getTime() - b.enteredAt.getTime());
}

function buildScrobbleRecords(rows) {
  return rows
    .map((row) => {
      const uts = Number.parseInt(row.uts, 10);
      if (!Number.isFinite(uts)) return null;
      const playedAt = new Date(uts * 1000);
      if (Number.isNaN(playedAt.getTime())) return null;
      return {
        uts,
        playedAt,
        artist: String(row.artist || "").trim(),
        album: String(row.album || "").trim(),
        track: String(row.track || "").trim(),
      };
    })
    .filter((row) => row && row.artist && row.track)
    .sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());
}

function buildCollectionTagMaps(collection) {
  const byArtistAlbum = new Map();
  const byArtistTrack = new Map();
  const byAlbumTrack = new Map();

  collection.forEach((row) => {
    const artist = normalizeKey(row.Artist);
    const track = normalizeKey(row.Song);
    const album = normalizeKey(row.Album);
    const genres = String(row.Genres || "").trim();
    if (!genres) return;
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

function getFocusYear(visits) {
  const lastVisit = visits[visits.length - 1];
  if (lastVisit) return lastVisit.enteredAt.getUTCFullYear();
  return getLondonDateParts().year;
}

function buildYearStats(visits) {
  const focusYear = getFocusYear(visits);
  const yearVisits = visits.filter((visit) => visit.enteredAt.getUTCFullYear() === focusYear);
  const lastVisit = yearVisits[yearVisits.length - 1] || null;
  const attendanceDays = new Set(yearVisits.map((visit) => visit.dateKey));
  let totalEntryMinutes = 0;

  yearVisits.forEach((visit) => {
    totalEntryMinutes += visit.enteredAt.getUTCHours() * 60 + visit.enteredAt.getUTCMinutes();
  });

  const today = getLondonTodayUtcDay();
  const yearStart = getYearStart(focusYear);
  let coverageEnd = getYearEnd(focusYear);

  if (focusYear === today.getUTCFullYear()) {
    coverageEnd = today;
  } else if (focusYear > today.getUTCFullYear()) {
    coverageEnd = lastVisit ? startOfUtcDay(lastVisit.enteredAt) : yearStart;
  }

  const calculationStart = addUtcDays(yearStart, 7);
  const attendanceDaysAfterOpeningWeek = new Set(
    [...attendanceDays].filter((dateKey) => new Date(`${dateKey}T00:00:00Z`).getTime() >= calculationStart.getTime()),
  );
  const weekdayCounts = new Map(WEEKDAY_LABELS.map((_, index) => [index, 0]));
  attendanceDaysAfterOpeningWeek.forEach((dateKey) => {
    const weekdayIndex = (new Date(`${dateKey}T00:00:00Z`).getUTCDay() + 6) % 7;
    weekdayCounts.set(weekdayIndex, (weekdayCounts.get(weekdayIndex) || 0) + 1);
  });
  const weekdayTotals = new Map(WEEKDAY_LABELS.map((_, index) => [index, 0]));
  if (coverageEnd.getTime() >= calculationStart.getTime()) {
    for (let cursor = calculationStart; cursor.getTime() <= coverageEnd.getTime(); cursor = addUtcDays(cursor, 1)) {
      const weekdayIndex = (cursor.getUTCDay() + 6) % 7;
      weekdayTotals.set(weekdayIndex, (weekdayTotals.get(weekdayIndex) || 0) + 1);
    }
  }
  const totalDaysTracked =
    coverageEnd.getTime() >= calculationStart.getTime()
      ? getDayDifferenceInclusive(calculationStart, coverageEnd)
      : 0;
  const attendanceDayCount = attendanceDaysAfterOpeningWeek.size;
  const averageDaysPerWeek = totalDaysTracked ? attendanceDayCount / (totalDaysTracked / 7) : 0;
  const averageEntryMinutes = yearVisits.length ? totalEntryMinutes / yearVisits.length : NaN;
  const attendanceRate = totalDaysTracked ? (attendanceDayCount / totalDaysTracked) * 100 : 0;
  const totalDurationMinutes = yearVisits.reduce(
    (sum, visit) => sum + (Number.isFinite(visit.durationMinutes) ? visit.durationMinutes : 0),
    0,
  );
  const averageDurationMinutes = yearVisits.length ? totalDurationMinutes / yearVisits.length : NaN;
  const averageWeeklyDurationMinutes = totalDaysTracked ? totalDurationMinutes / (totalDaysTracked / 7) : NaN;

  return {
    focusYear,
    yearVisits,
    lastVisit,
    attendanceDays,
    weekdayCounts,
    weekdayTotals,
    totalDaysTracked,
    attendanceDayCount,
    calculationStart,
    averageDaysPerWeek,
    averageEntryMinutes,
    attendanceRate,
    totalDurationMinutes,
    averageDurationMinutes,
    averageWeeklyDurationMinutes,
  };
}

function buildGymListeningStats(visits, scrobbles, focusYear) {
  const sessions = visits.filter(
    (visit) => visit.enteredAt.getUTCFullYear() === focusYear && visit.leftAt instanceof Date,
  );
  const gymScrobbles = scrobbles.filter((scrobble) =>
    sessions.some(
      (visit) =>
        scrobble.playedAt.getTime() >= visit.enteredAt.getTime() &&
        scrobble.playedAt.getTime() <= visit.leftAt.getTime(),
    ),
  );

  const artistCounts = [...countBy(gymScrobbles, (row) => row.artist).entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20);
  const albumCounts = [...countBy(gymScrobbles, (row) => `${row.album || "(unknown album)"} — ${row.artist}`).entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20);

  return {
    totalGymScrobbles: gymScrobbles.length,
    gymScrobbles,
    artistCounts,
    albumCounts,
  };
}

function getScrobbleGenres(scrobble, tagMaps) {
  const artist = normalizeKey(scrobble.artist);
  const album = normalizeKey(scrobble.album);
  const track = normalizeKey(scrobble.track);
  if (!artist && !album && !track) return [];

  const genres =
    (artist && album ? tagMaps.byArtistAlbum.get(`${artist}::${album}`) : null) ||
    (artist && track ? tagMaps.byArtistTrack.get(`${artist}::${track}`) : null) ||
    (album && track ? tagMaps.byAlbumTrack.get(`${album}::${track}`) : null) ||
    "";

  return genres
    .split(";")
    .map((genre) => genre.trim().toLowerCase())
    .filter(Boolean);
}

function buildGenreComparisonStats(scrobbles, gymScrobbles, collection) {
  if (!collection.length) {
    return {
      rows: [],
      gymGenreCredits: 0,
      totalGenreCredits: 0,
    };
  }

  const tagMaps = buildCollectionTagMaps(collection);
  const totalCounts = new Map();
  const gymCounts = new Map();
  let totalGenreCredits = 0;
  let gymGenreCredits = 0;

  scrobbles.forEach((scrobble) => {
    const genres = getScrobbleGenres(scrobble, tagMaps);
    genres.forEach((genre) => {
      totalCounts.set(genre, (totalCounts.get(genre) || 0) + 1);
      totalGenreCredits += 1;
    });
  });

  gymScrobbles.forEach((scrobble) => {
    const genres = getScrobbleGenres(scrobble, tagMaps);
    genres.forEach((genre) => {
      gymCounts.set(genre, (gymCounts.get(genre) || 0) + 1);
      gymGenreCredits += 1;
    });
  });

  const rows = [...gymCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([genre, gymCount]) => ({
      genre,
      gymShare: gymGenreCredits ? (gymCount / gymGenreCredits) * 100 : 0,
      totalShare: totalGenreCredits ? ((totalCounts.get(genre) || 0) / totalGenreCredits) * 100 : 0,
    }));

  return {
    rows,
    gymGenreCredits,
    totalGenreCredits,
  };
}

function renderFactCard(modal, selector, value, detail = "") {
  const valueEl = modal.querySelector(`${selector} .fact-value`);
  const detailEl = modal.querySelector(`${selector} .fact-detail`);
  if (valueEl) valueEl.textContent = value;
  if (detailEl) detailEl.textContent = detail;
}

function buildAttendanceData(stats) {
  return [...stats.attendanceDays]
    .sort()
    .map((dateKey) => ({
      date: new Date(`${dateKey}T00:00:00Z`).getTime(),
      value: 1,
    }));
}

async function renderAttendanceHeatmap(modal, stats, heatmapState) {
  const mount = modal.querySelector("#activHeatmap");
  if (!mount) return;

  if (heatmapState.instance) {
    await heatmapState.instance.destroy();
    heatmapState.instance = null;
  }

  mount.innerHTML = "";

  const heatmap = new CalHeatmap();
  await heatmap.paint(
    {
      itemSelector: "#activHeatmap",
      range: 12,
      domain: {
        type: "month",
        gutter: 8,
        label: {
          text: "MMM",
          position: "top",
          textAlign: "start",
          offset: { x: 2, y: 2 },
        },
      },
      subDomain: {
        type: "ghDay",
        width: 11,
        height: 11,
        gutter: 4,
        radius: 2,
      },
      date: {
        start: new Date(Date.UTC(stats.focusYear, 0, 1)),
        locale: {
          weekStart: 1,
        },
        timezone: "Europe/London",
      },
      data: {
        source: buildAttendanceData(stats),
        x: "date",
        y: "value",
        defaultValue: 0,
      },
      scale: {
        color: {
          type: "threshold",
          range: ["#e5ddd0", "#4e4738"],
          domain: [1],
        },
      },
      animationDuration: 0,
    },
    [[
      CalendarLabel,
      {
        position: "left",
        text: () => WEEKDAY_LABELS,
        width: 26,
        height: 11,
        gutter: 4,
        textAlign: "start",
        padding: [24, 0, 0, 0],
      },
    ]],
  );

  heatmapState.instance = heatmap;
}

async function fetchCsvRows(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];
    const text = await response.text();
    return parseCsv(text);
  } catch (error) {
    console.warn(`actIV csv fetch failed for ${url}:`, error);
    return [];
  }
}

function drawSmoothLine(ctx, points) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    ctx.bezierCurveTo(midX, current.y, midX, next.y, next.x, next.y);
  }

  ctx.stroke();
}

function renderWeekdayChart(modal, stats) {
  const canvas = modal.querySelector("#activWeekdayChart");
  const ctx = canvas?.getContext?.("2d");
  if (!ctx || !canvas) return;

  const width = canvas.clientWidth || 720;
  const height = canvas.clientHeight || 260;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const rows = WEEKDAY_LABELS.map((label, index) => ({
    label,
    value: stats.weekdayTotals.get(index)
      ? ((stats.weekdayCounts.get(index) || 0) / stats.weekdayTotals.get(index)) * 100
      : 0,
  }));
  const maxValue = Math.max(10, Math.ceil(Math.max(...rows.map((row) => row.value), 0) / 10) * 10);
  const pad = { l: 42, r: 12, t: 16, b: 48 };
  const usableW = width - pad.l - pad.r;
  const usableH = height - pad.t - pad.b;
  const slotW = usableW / rows.length;
  const yForValue = (value) => pad.t + usableH - (value / maxValue) * usableH;

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

  const tickCount = Math.min(4, maxValue);
  for (let i = 0; i <= tickCount; i += 1) {
    const value = tickCount === 0 ? 0 : Math.round((maxValue / tickCount) * i);
    const y = yForValue(value);

    ctx.strokeStyle = i === 0 ? "rgba(78,71,56,0.22)" : "rgba(78,71,56,0.12)";
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(width - pad.r, y);
    ctx.stroke();

    drawCanvasText(ctx, `${value}%`, pad.l - 8, y, {
      align: "right",
      baseline: "middle",
      fillStyle: "rgba(78,71,56,0.8)",
      font: "10px 'Ubuntu Mono', monospace",
    });
  }

  const points = rows.map((row, index) => ({
    x: pad.l + slotW * index + slotW / 2,
    y: yForValue(row.value),
    label: row.label,
    value: row.value,
  }));

  ctx.strokeStyle = "#4e4738";
  ctx.lineWidth = 2;
  drawSmoothLine(ctx, points);

  ctx.fillStyle = "#4e4738";
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
    drawCanvasText(ctx, `${point.value.toFixed(point.value >= 10 ? 0 : 1)}%`, point.x, Math.max(point.y - 8, pad.t + 10), {
      align: "center",
      baseline: "bottom",
      fillStyle: "rgba(78,71,56,0.86)",
      font: "11px 'Ubuntu Mono', monospace",
    });
  });

  rows.forEach((row, index) => {
    const x = pad.l + slotW * index + slotW / 2;
    drawCanvasText(ctx, row.label, x, pad.t + usableH + 14, {
      align: "center",
      baseline: "top",
      fillStyle: "rgba(78,71,56,0.9)",
      font: "11px 'Ubuntu Mono', monospace",
    });
  });
}

function renderGenreComparisonChart(modal, genreStats) {
  const canvas = modal.querySelector("#activGenreComparisonChart");
  const ctx = canvas?.getContext?.("2d");
  if (!ctx || !canvas) return;

  const width = canvas.clientWidth || 720;
  const height = canvas.clientHeight || 320;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  if (!genreStats.rows.length) {
    drawCanvasText(ctx, "no genre metadata matched my gym scrobbles :(", 12, 22, {
      fillStyle: "#4e4738",
      font: "14px 'Ubuntu Mono', monospace",
    });
    return;
  }

  const pad = { l: 42, r: 16, t: 24, b: 96 };
  const usableW = width - pad.l - pad.r;
  const usableH = height - pad.t - pad.b;
  const maxValue = Math.max(
    10,
    Math.ceil(
      Math.max(...genreStats.rows.flatMap((row) => [row.gymShare, row.totalShare]), 0) / 10,
    ) * 10,
  );
  const slotW = usableW / genreStats.rows.length;
  const groupW = Math.min(54, Math.max(28, slotW - 10));
  const barW = Math.max(8, Math.floor((groupW - 6) / 2));
  const yForValue = (value) => pad.t + usableH - (value / maxValue) * usableH;

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

  const tickCount = 4;
  for (let i = 0; i <= tickCount; i += 1) {
    const value = Math.round((maxValue / tickCount) * i);
    const y = yForValue(value);
    ctx.strokeStyle = i === 0 ? "rgba(78,71,56,0.22)" : "rgba(78,71,56,0.12)";
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(width - pad.r, y);
    ctx.stroke();
    drawCanvasText(ctx, `${value}%`, pad.l - 8, y, {
      align: "right",
      baseline: "middle",
      fillStyle: "rgba(78,71,56,0.8)",
      font: "10px 'Ubuntu Mono', monospace",
    });
  }

  genreStats.rows.forEach((row, index) => {
    const groupX = pad.l + slotW * index + (slotW - groupW) / 2;
    const gymX = groupX;
    const totalX = groupX + barW + 6;
    const gymY = yForValue(row.gymShare);
    const totalY = yForValue(row.totalShare);

    ctx.fillStyle = "#4e4738";
    ctx.fillRect(gymX, gymY, barW, Math.max(pad.t + usableH - gymY, 2));
    ctx.fillStyle = "rgba(78,71,56,0.34)";
    ctx.fillRect(totalX, totalY, barW, Math.max(pad.t + usableH - totalY, 2));

    ctx.save();
    ctx.translate(groupX + groupW / 2, pad.t + usableH + 12);
    ctx.rotate(-Math.PI / 4);
    drawCanvasText(ctx, row.genre, 0, 0, {
      align: "right",
      baseline: "top",
      fillStyle: "rgba(78,71,56,0.9)",
      font: "11px 'Ubuntu Mono', monospace",
    });
    ctx.restore();
  });

  ctx.fillStyle = "#4e4738";
  ctx.fillRect(width - 148, 12, 10, 10);
  drawCanvasText(ctx, "gym", width - 132, 17, {
    baseline: "middle",
    fillStyle: "rgba(78,71,56,0.85)",
    font: "11px 'Ubuntu Mono', monospace",
  });
  ctx.fillStyle = "rgba(78,71,56,0.34)";
  ctx.fillRect(width - 88, 12, 10, 10);
  drawCanvasText(ctx, "total", width - 72, 17, {
    baseline: "middle",
    fillStyle: "rgba(78,71,56,0.85)",
    font: "11px 'Ubuntu Mono', monospace",
  });
}

function renderRankedList(modal, listSelector, items, totalCount) {
  const list = modal.querySelector(listSelector);
  if (!list) return;

  if (!items.length) {
    list.innerHTML = '<li><span class="artist-name">no gym scrobbles matched</span><span class="artist-count">0</span><span class="artist-share">0%</span></li>';
    return;
  }

  const percentFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
  list.innerHTML = items
    .map(([name, count], index) => {
      const share = totalCount > 0 ? `${percentFormatter.format((count / totalCount) * 100)}%` : "0%";
      return `<li><span class="artist-name">${index + 1}. ${name}</span><span class="artist-count">${count.toLocaleString()}</span><span class="artist-share">${share}</span></li>`;
    })
    .join("");
}

async function renderModal(modal, visits, scrobbles, collection, heatmapState) {
  const stats = buildYearStats(visits);
  const lastVisit = stats.lastVisit;
  const listeningStats = buildGymListeningStats(visits, scrobbles, stats.focusYear);
  const focusYearScrobbles = scrobbles.filter((scrobble) => scrobble.playedAt.getUTCFullYear() === stats.focusYear);
  const genreStats = buildGenreComparisonStats(focusYearScrobbles, listeningStats.gymScrobbles, collection);

  await renderAttendanceHeatmap(modal, stats, heatmapState);
  renderWeekdayChart(modal, stats);
  renderRankedList(modal, "#activTopArtistsList", listeningStats.artistCounts, listeningStats.totalGymScrobbles);
  renderRankedList(modal, "#activTopAlbumsList", listeningStats.albumCounts, listeningStats.totalGymScrobbles);
  renderGenreComparisonChart(modal, genreStats);
  const topArtistsCountLabel = modal.querySelector("#activTopArtistsCountLabel");
  const topAlbumsCountLabel = modal.querySelector("#activTopAlbumsCountLabel");
  if (topArtistsCountLabel) topArtistsCountLabel.textContent = `${listeningStats.totalGymScrobbles.toLocaleString()} scrobbles`;
  if (topAlbumsCountLabel) topAlbumsCountLabel.textContent = `${listeningStats.totalGymScrobbles.toLocaleString()} scrobbles`;

  renderFactCard(
    modal,
    "#activFactWeeklyRate",
    formatAveragePerWeek(stats.averageDaysPerWeek),
    `${stats.attendanceDayCount} gym day${stats.attendanceDayCount === 1 ? "" : "s"}`,
  );

  renderFactCard(
    modal,
    "#activFactEntryTime",
    formatMinutesAsTime(stats.averageEntryMinutes),
    `${stats.yearVisits.length} visit${stats.yearVisits.length === 1 ? "" : "s"} in ${stats.focusYear}`,
  );

  renderFactCard(
    modal,
    "#activFactAverageDuration",
    formatMinutesAsDuration(stats.averageDurationMinutes),
    `${stats.yearVisits.length} visit${stats.yearVisits.length === 1 ? "" : "s"} in ${stats.focusYear}`,
  );

  renderFactCard(
    modal,
    "#activFactLastVisit",
    lastVisit ? formatDateCompact(lastVisit.enteredAt) : "--",
    lastVisit
      ? `${formatTimeLabel(lastVisit.enteredAt)}-${formatTimeLabel(lastVisit.leftAt)}`
      : "no visits yet",
  );

  renderFactCard(
    modal,
    "#activFactAttendanceRate",
    formatPercent(stats.attendanceRate),
    `${stats.attendanceDayCount} of ${stats.totalDaysTracked}`,
  );

  renderFactCard(
    modal,
    "#activFactWeeklyDuration",
    formatMinutesAsDuration(stats.averageWeeklyDurationMinutes),
    `${formatMinutesAsDuration(stats.totalDurationMinutes)} total in ${stats.focusYear}`,
  );
}

export function createActivFeature() {
  const cacheState = {
    visits: null,
    scrobbles: null,
    collection: null,
  };
  const heatmapState = {
    instance: null,
  };

  async function loadVisitsCsv() {
    if (cacheState.visits) return cacheState.visits;

    let parsed = await fetchCsvRows("/api/puregym-visits");
    if (!parsed.length) {
      parsed = await fetchCsvRows("/data/visit_history.csv");
    }
    if (!parsed.length) {
      throw new Error("No actIV CSV data was available from Blob or the local fallback");
    }

    cacheState.visits = buildVisitRecords(parsed);
    return cacheState.visits;
  }

  async function loadScrobblesCsv() {
    if (cacheState.scrobbles) return cacheState.scrobbles;

    let parsed = await fetchCsvRows("/api/scrobbles");
    if (!parsed.length) {
      parsed = await fetchCsvRows("/data/scrobbles.csv");
    }

    cacheState.scrobbles = buildScrobbleRecords(parsed);
    return cacheState.scrobbles;
  }

  async function loadCollectionCsv() {
    if (cacheState.collection) return cacheState.collection;
    const parsed = await fetchCsvRows("/data/collection.csv");
    cacheState.collection = parsed;
    return cacheState.collection;
  }

  async function initActivModal(modal) {
    if (!modal) return;

    const overlay = modal.querySelector("#activLoadingOverlay");
    overlay?.classList.add("visible");

    try {
      const [visits, scrobbles, collection] = await Promise.all([
        loadVisitsCsv(),
        loadScrobblesCsv(),
        loadCollectionCsv(),
      ]);
      await renderModal(modal, visits, scrobbles, collection, heatmapState);
    } catch (error) {
      console.warn("actIV load failed:", error);
      const root = modal.querySelector("#activRoot");
      const message = error instanceof Error ? error.message : "unknown error";
      if (root) {
        root.innerHTML = `
          <div class="chart-section activ-empty-state">
            <h3 class="chart-title">couldn't load actIV data</h3>
            <p>${message}</p>
          </div>
        `;
      }
    } finally {
      overlay?.classList.remove("visible");
    }
  }

  return {
    initActivModal,
  };
}
