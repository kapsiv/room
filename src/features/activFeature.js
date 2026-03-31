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

function formatDateLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatHoursLabel(hours) {
  return `${hours.toFixed(hours >= 100 ? 0 : 1)}h`;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date) {
  const copy = startOfUtcDay(date);
  const mondayOffset = (copy.getUTCDay() + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - mondayOffset);
  return copy;
}

function addUtcDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
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
        isDurationEstimated: String(row.is_duration_estimated || "").toLowerCase() === "true",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.enteredAt.getTime() - b.enteredAt.getTime());
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

function sumBy(items, keyFn) {
  return items.reduce((total, item) => total + (Number(keyFn(item)) || 0), 0);
}

function getTopEntry(map) {
  let bestKey = null;
  let bestValue = -1;
  map.forEach((value, key) => {
    if (value > bestValue) {
      bestKey = key;
      bestValue = value;
    }
  });
  return { key: bestKey, value: bestValue };
}

function buildMonthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(monthKey) {
  const date = new Date(`${monthKey}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return monthKey;
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildStatistics(visits) {
  const totalVisits = visits.length;
  const totalMinutes = sumBy(visits, (visit) => visit.durationMinutes);
  const averageDuration = totalVisits ? totalMinutes / totalVisits : 0;
  const visitsByDay = countBy(visits, (visit) => visit.dateKey);
  const weekdayCounts = countBy(visits, (visit) => visit.enteredAt.getUTCDay());
  const hourCounts = countBy(visits, (visit) => visit.enteredAt.getUTCHours());
  const monthCounts = countBy(visits, (visit) => buildMonthKey(visit.enteredAt));

  const durationBuckets = new Map([
    ["< 30m", 0],
    ["30-39m", 0],
    ["40-49m", 0],
    ["50m+", 0],
  ]);

  visits.forEach((visit) => {
    const minutes = visit.durationMinutes;
    if (minutes < 30) durationBuckets.set("< 30m", durationBuckets.get("< 30m") + 1);
    else if (minutes < 40) durationBuckets.set("30-39m", durationBuckets.get("30-39m") + 1);
    else if (minutes < 50) durationBuckets.set("40-49m", durationBuckets.get("40-49m") + 1);
    else durationBuckets.set("50m+", durationBuckets.get("50m+") + 1);
  });

  return {
    totalVisits,
    totalMinutes,
    averageDuration,
    visitsByDay,
    weekdayCounts,
    hourCounts,
    monthCounts,
    durationBuckets,
    topWeekday: getTopEntry(weekdayCounts),
    topHour: getTopEntry(hourCounts),
    topDay: getTopEntry(visitsByDay),
    topMonth: getTopEntry(monthCounts),
    lastVisit: visits[visits.length - 1] || null,
  };
}

function renderFactCard(modal, selector, value, detail = "") {
  const valueEl = modal.querySelector(`${selector} .fact-value`);
  const detailEl = modal.querySelector(`${selector} .fact-detail`);
  if (valueEl) valueEl.textContent = value;
  if (detailEl) detailEl.textContent = detail;
}

function renderHeatmap(modal, stats) {
  const mount = modal.querySelector("#activHeatmap");
  const labelsMount = modal.querySelector("#activHeatmapMonths");
  if (!mount || !labelsMount) return;

  const dayLabels = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const dayKeys = [...stats.visitsByDay.keys()].sort();
  if (!dayKeys.length) {
    mount.innerHTML = "";
    labelsMount.innerHTML = "";
    return;
  }

  const firstDate = new Date(`${dayKeys[0]}T00:00:00Z`);
  const lastDate = new Date(`${dayKeys[dayKeys.length - 1]}T00:00:00Z`);
  const startDate = startOfUtcWeek(firstDate);
  const endDate = addUtcDays(startOfUtcWeek(lastDate), 6);
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  const maxCount = Math.max(...stats.visitsByDay.values(), 1);

  mount.style.setProperty("--activ-heatmap-weeks", String(totalWeeks));
  labelsMount.style.setProperty("--activ-heatmap-weeks", String(totalWeeks));

  const monthLabels = [];
  let previousMonth = "";

  for (let week = 0; week < totalWeeks; week += 1) {
    const weekStart = addUtcDays(startDate, week * 7);
    const monthKey = buildMonthKey(weekStart);
    if (monthKey !== previousMonth) {
      monthLabels.push(`
        <span class="activ-heatmap-month" style="grid-column:${week + 1};">${weekStart.toLocaleDateString("en-GB", {
          month: "short",
          timeZone: "UTC",
        })}</span>
      `);
      previousMonth = monthKey;
    }
  }

  labelsMount.innerHTML = monthLabels.join("");

  const cells = [];
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const date = addUtcDays(startDate, dayIndex);
    const dateKey = date.toISOString().slice(0, 10);
    const weekIndex = Math.floor(dayIndex / 7);
    const weekdayIndex = (date.getUTCDay() + 6) % 7;
    const count = stats.visitsByDay.get(dateKey) || 0;
    const level = count === 0 ? 0 : Math.max(1, Math.ceil((count / maxCount) * 4));
    const label = `${formatDateLabel(date)}: ${count} visit${count === 1 ? "" : "s"}`;
    cells.push(`
      <span
        class="activ-heatmap-cell is-level-${Math.min(level, 4)}"
        style="grid-column:${weekIndex + 1};grid-row:${weekdayIndex + 1};"
        title="${label}"
        aria-label="${label}"
      ></span>
    `);
  }

  mount.innerHTML = `
    <div class="activ-heatmap-days" aria-hidden="true">
      ${dayLabels.map((label) => `<span>${label}</span>`).join("")}
    </div>
    <div class="activ-heatmap-grid" role="img" aria-label="Attendance heatmap showing gym visits by day">
      ${cells.join("")}
    </div>
  `;
}

function renderBars(mount, rows, labelFormatter = (value) => value) {
  if (!mount) return;
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  mount.innerHTML = rows
    .map((row) => {
      const width = `${(row.value / maxValue) * 100}%`;
      const label = `${labelFormatter(row.label)}: ${row.value}`;
      return `
        <div class="activ-bar-row" title="${label}">
          <span class="activ-bar-label">${labelFormatter(row.label)}</span>
          <span class="activ-bar-track">
            <span class="activ-bar-fill" style="width:${width}"></span>
          </span>
          <span class="activ-bar-value">${row.value}</span>
        </div>
      `;
    })
    .join("");
}

function renderHourChart(mount, counts) {
  if (!mount) return;
  const rows = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, "0")}:00`,
    value: counts.get(hour) || 0,
  }));
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  mount.innerHTML = rows
    .map((row) => {
      const height = `${(row.value / maxValue) * 100}%`;
      const label = `${row.label}: ${row.value} visit${row.value === 1 ? "" : "s"}`;
      return `
        <div class="activ-hour-col" title="${label}">
          <span class="activ-hour-bar" style="height:${height}"></span>
          <span class="activ-hour-tick">${row.label.slice(0, 2)}</span>
        </div>
      `;
    })
    .join("");
}

function renderMonthlyChart(mount, monthCounts) {
  if (!mount) return;
  const rows = [...monthCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ label: formatMonthKey(month), value: count }));
  renderBars(mount, rows);
}

function renderRecentTable(modal, visits) {
  const body = modal.querySelector("#activRecentTableBody");
  if (!body) return;
  body.innerHTML = [...visits]
    .sort((a, b) => b.enteredAt.getTime() - a.enteredAt.getTime())
    .slice(0, 12)
    .map((visit) => {
      return `
        <tr>
          <td>${formatDateLabel(visit.enteredAt)}</td>
          <td>${visit.enteredAt.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC",
          })}</td>
          <td>${visit.leftAt ? visit.leftAt.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC",
          }) : ""}</td>
          <td>${visit.durationMinutes}m</td>
          <td>${visit.gymName || "PureGym"}</td>
        </tr>
      `;
    })
    .join("");
}

function renderSourceState(modal, source, stats) {
  const sourceEl = modal.querySelector("#activDataSource");
  const freshnessEl = modal.querySelector("#activDataFreshness");
  if (sourceEl) {
    sourceEl.textContent = source === "blob" ? "source: vercel blob" : "source: backup csv";
    sourceEl.classList.toggle("is-fallback", source !== "blob");
  }
  if (freshnessEl && stats.lastVisit) {
    freshnessEl.textContent = `latest visit: ${formatDateLabel(stats.lastVisit.enteredAt)}`;
  }
}

function renderModal(modal, visits, source) {
  const stats = buildStatistics(visits);
  const weekdayLabels = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const weekdayRows = weekdayLabels.map((label, day) => ({
    label,
    value: stats.weekdayCounts.get(day) || 0,
  }));
  const durationRows = [...stats.durationBuckets.entries()].map(([label, value]) => ({ label, value }));

  renderSourceState(modal, source, stats);
  renderFactCard(modal, "#activFactVisits", `${stats.totalVisits}`, `${stats.visitsByDay.size} active day${stats.visitsByDay.size === 1 ? "" : "s"}`);
  renderFactCard(modal, "#activFactHours", formatHoursLabel(stats.totalMinutes / 60), `${Math.round(stats.totalMinutes)} minutes total`);
  renderFactCard(modal, "#activFactDuration", `${Math.round(stats.averageDuration)}m`, "average session length");
  renderFactCard(
    modal,
    "#activFactPattern",
    stats.topWeekday.key !== null ? weekdayLabels[stats.topWeekday.key] : "--",
    stats.topHour.key !== null ? `usual entry: ${String(stats.topHour.key).padStart(2, "0")}:00` : "usual entry unknown",
  );

  renderHeatmap(modal, stats);
  renderBars(modal.querySelector("#activWeekdayChart"), weekdayRows);
  renderHourChart(modal.querySelector("#activHourChart"), stats.hourCounts);
  renderMonthlyChart(modal.querySelector("#activMonthlyChart"), stats.monthCounts);
  renderBars(modal.querySelector("#activDurationChart"), durationRows);
  renderRecentTable(modal, visits);

  const bestDayEl = modal.querySelector("#activBestDayNote");
  if (bestDayEl) {
    bestDayEl.textContent = stats.topDay.key
      ? `peak attendance day: ${stats.topDay.key} (${stats.topDay.value} visit${stats.topDay.value === 1 ? "" : "s"})`
      : "peak attendance day unavailable";
  }

  const bestMonthEl = modal.querySelector("#activBestMonthNote");
  if (bestMonthEl) {
    bestMonthEl.textContent = stats.topMonth.key
      ? `most active month: ${formatMonthKey(stats.topMonth.key)} (${stats.topMonth.value} visits)`
      : "monthly view unavailable";
  }
}

export function createActivFeature() {
  const cacheState = {
    visits: null,
    source: null,
  };

  async function loadVisitsCsv() {
    if (cacheState.visits) {
      return { visits: cacheState.visits, source: cacheState.source || "blob" };
    }

    let res = await fetch("/api/puregym-visits");
    let text = "";
    let source = "blob";

    if (res.ok) {
      text = await res.text();
    }

    let parsed = text ? parseCsv(text) : [];

    if (!res.ok || parsed.length === 0) {
      res = await fetch("/data/visit_history.csv");
      if (!res.ok) {
        throw new Error(`visit_history.csv fetch failed: ${res.status}`);
      }
      text = await res.text();
      parsed = parseCsv(text);
      source = "backup";
    }

    cacheState.visits = buildVisitRecords(parsed);
    cacheState.source = source;
    return { visits: cacheState.visits, source };
  }

  async function initActivModal(modal) {
    if (!modal) return;

    const overlay = modal.querySelector("#activLoadingOverlay");
    overlay?.classList.add("visible");

    try {
      const { visits, source } = await loadVisitsCsv();
      renderModal(modal, visits, source);
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
