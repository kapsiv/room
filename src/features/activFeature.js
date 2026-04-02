import CalHeatmap from "cal-heatmap";
import CalendarLabel from "cal-heatmap/plugins/CalendarLabel";
import "cal-heatmap/cal-heatmap.css";

const WEEKDAY_LABELS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

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
  const weekdayCounts = new Map(WEEKDAY_LABELS.map((_, index) => [index, 0]));
  let totalEntryMinutes = 0;

  yearVisits.forEach((visit) => {
    const weekdayIndex = (visit.enteredAt.getUTCDay() + 6) % 7;
    weekdayCounts.set(weekdayIndex, (weekdayCounts.get(weekdayIndex) || 0) + 1);
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

  const totalDaysTracked = getDayDifferenceInclusive(yearStart, coverageEnd);
  const attendanceDayCount = attendanceDays.size;
  const averageDaysPerWeek = attendanceDayCount / (totalDaysTracked / 7);
  const averageEntryMinutes = yearVisits.length ? totalEntryMinutes / yearVisits.length : NaN;
  const attendanceRate = totalDaysTracked ? (attendanceDayCount / totalDaysTracked) * 100 : 0;

  return {
    focusYear,
    yearVisits,
    lastVisit,
    attendanceDays,
    weekdayCounts,
    totalDaysTracked,
    attendanceDayCount,
    averageDaysPerWeek,
    averageEntryMinutes,
    attendanceRate,
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
    value: stats.weekdayCounts.get(index) || 0,
  }));
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  const pad = { l: 42, r: 12, t: 16, b: 48 };
  const usableW = width - pad.l - pad.r;
  const usableH = height - pad.t - pad.b;
  const slotW = usableW / rows.length;
  const barW = Math.min(42, Math.max(22, slotW - 12));
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

    drawCanvasText(ctx, String(value), pad.l - 8, y, {
      align: "right",
      baseline: "middle",
      fillStyle: "rgba(78,71,56,0.8)",
      font: "10px 'Ubuntu Mono', monospace",
    });
  }

  rows.forEach((row, index) => {
    const x = pad.l + slotW * index + (slotW - barW) / 2;
    const y = yForValue(row.value);
    const barHeight = Math.max(pad.t + usableH - y, 2);

    ctx.fillStyle = "#4e4738";
    ctx.fillRect(x, y, barW, barHeight);

    drawCanvasText(ctx, row.label, x + barW / 2, pad.t + usableH + 14, {
      align: "center",
      baseline: "top",
      fillStyle: "rgba(78,71,56,0.9)",
      font: "11px 'Ubuntu Mono', monospace",
    });

    drawCanvasText(ctx, String(row.value), x + barW / 2, Math.max(y - 6, pad.t + 10), {
      align: "center",
      baseline: "bottom",
      fillStyle: "rgba(78,71,56,0.86)",
      font: "11px 'Ubuntu Mono', monospace",
    });
  });
}

async function renderModal(modal, visits, heatmapState) {
  const stats = buildYearStats(visits);
  const lastVisit = stats.lastVisit;

  await renderAttendanceHeatmap(modal, stats, heatmapState);
  renderWeekdayChart(modal, stats);

  renderFactCard(
    modal,
    "#activFactWeeklyRate",
    formatAveragePerWeek(stats.averageDaysPerWeek),
    `${stats.attendanceDayCount} gym day${stats.attendanceDayCount === 1 ? "" : "s"} tracked in ${stats.focusYear}`,
  );

  renderFactCard(
    modal,
    "#activFactEntryTime",
    formatMinutesAsTime(stats.averageEntryMinutes),
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
    `${stats.attendanceDayCount} of ${stats.totalDaysTracked} days since jan 1`,
  );
}

export function createActivFeature() {
  const cacheState = {
    visits: null,
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

  async function initActivModal(modal) {
    if (!modal) return;

    const overlay = modal.querySelector("#activLoadingOverlay");
    overlay?.classList.add("visible");

    try {
      const visits = await loadVisitsCsv();
      await renderModal(modal, visits, heatmapState);
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
