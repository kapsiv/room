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

function formatMonthLabel(date) {
  return date.toLocaleDateString("en-GB", {
    month: "short",
    timeZone: "UTC",
  });
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

function renderAttendanceHeatmap(modal, stats) {
  const mount = modal.querySelector("#activHeatmap");
  const labelsMount = modal.querySelector("#activHeatmapMonths");
  if (!mount || !labelsMount) return;

  const yearStart = getYearStart(stats.focusYear);
  const yearEnd = getYearEnd(stats.focusYear);
  const totalDays = getDayDifferenceInclusive(yearStart, yearEnd);
  const leadingOffset = (yearStart.getUTCDay() + 6) % 7;
  const totalWeeks = Math.ceil((leadingOffset + totalDays) / 7);

  mount.style.setProperty("--activ-heatmap-weeks", String(totalWeeks));
  labelsMount.style.setProperty("--activ-heatmap-weeks", String(totalWeeks));

  const monthLabels = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthStart = new Date(Date.UTC(stats.focusYear, monthIndex, 1));
    const dayOffset = getDayDifferenceInclusive(yearStart, monthStart) - 1;
    const gridColumn = Math.floor((leadingOffset + dayOffset) / 7) + 1;
    return `
      <span class="activ-heatmap-month" style="grid-column:${gridColumn};">
        ${formatMonthLabel(monthStart)}
      </span>
    `;
  });

  labelsMount.innerHTML = monthLabels.join("");

  const cells = [];
  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    for (let weekdayIndex = 0; weekdayIndex < 7; weekdayIndex += 1) {
      const dayOffset = weekIndex * 7 + weekdayIndex - leadingOffset;

      if (dayOffset < 0 || dayOffset >= totalDays) {
        cells.push(`
          <span
            class="activ-heatmap-cell activ-heatmap-cell--pad"
            style="grid-column:${weekIndex + 1};grid-row:${weekdayIndex + 1};"
            aria-hidden="true"
          ></span>
        `);
        continue;
      }

      const date = addUtcDays(yearStart, dayOffset);
      const dateKey = date.toISOString().slice(0, 10);
      const isActive = stats.attendanceDays.has(dateKey);
      const label = `${formatDateLabel(date)}: ${isActive ? "gym visit recorded" : "no visit recorded"}`;

      cells.push(`
        <span
          class="activ-heatmap-cell${isActive ? " is-active" : ""}"
          style="grid-column:${weekIndex + 1};grid-row:${weekdayIndex + 1};"
          title="${label}"
          aria-label="${label}"
        ></span>
      `);
    }
  }

  mount.innerHTML = `
    <div class="activ-heatmap-days" aria-hidden="true">
      ${WEEKDAY_LABELS.map((label) => `<span>${label}</span>`).join("")}
    </div>
    <div
      class="activ-heatmap-grid"
      role="img"
      aria-label="GitHub-style attendance grid for ${stats.focusYear}"
    >
      ${cells.join("")}
    </div>
  `;
}

function renderWeekdayChart(modal, stats) {
  const mount = modal.querySelector("#activWeekdayChart");
  if (!mount) return;

  const rows = WEEKDAY_LABELS.map((label, index) => {
    const visits = stats.weekdayCounts.get(index) || 0;
    const share = stats.yearVisits.length ? (visits / stats.yearVisits.length) * 100 : 0;
    return { label, visits, share };
  });

  mount.innerHTML = rows
    .map((row) => {
      const title = `${row.label}: ${row.visits} visit${row.visits === 1 ? "" : "s"} (${formatPercent(row.share)})`;
      return `
        <div class="activ-bar-row" title="${title}">
          <span class="activ-bar-label">${row.label}</span>
          <span class="activ-bar-track">
            <span class="activ-bar-fill" style="width:${row.share}%"></span>
          </span>
          <span class="activ-bar-value">${formatPercent(row.share)}</span>
        </div>
      `;
    })
    .join("");
}

function renderModal(modal, visits) {
  const stats = buildYearStats(visits);
  const lastVisit = stats.lastVisit;

  renderAttendanceHeatmap(modal, stats);
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

  async function loadVisitsCsv() {
    if (cacheState.visits) return cacheState.visits;

    let response = await fetch("/api/puregym-visits");
    let text = "";

    if (response.ok) {
      text = await response.text();
    }

    let parsed = text ? parseCsv(text) : [];

    if (!response.ok || parsed.length === 0) {
      response = await fetch("/data/visit_history.csv");
      if (!response.ok) {
        throw new Error(`visit_history.csv fetch failed: ${response.status}`);
      }
      text = await response.text();
      parsed = parseCsv(text);
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
      renderModal(modal, visits);
    } catch (error) {
      console.warn("actIV load failed:", error);
      const root = modal.querySelector("#activRoot");
      if (root) {
        root.innerHTML = `
          <div class="chart-section activ-empty-state">
            <h3 class="chart-title">couldn't load actIV data</h3>
            <p>blob fetch failed and the local backup csv was not available.</p>
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
