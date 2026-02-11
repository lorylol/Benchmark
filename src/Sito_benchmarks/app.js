const state = {
  cpus: [],
  gpus: [],
  pairs: [],
  saved: [],
  compare: [],
  theme: "light",
  maxCpuScore: 0,
  maxGpuScore: 0,
  maxCpuValue: 0,
  maxGpuValue: 0,
  minCpuValue: 0,
  minGpuValue: 0,
  maxCpuRank: 0,
  maxGpuRank: 0,
};

const selectors = {
  cpuGrid: document.getElementById("cpuGrid"),
  gpuGrid: document.getElementById("gpuGrid"),
  pairGrid: document.getElementById("pairGrid"),
  cpuSearch: document.getElementById("cpuSearch"),
  gpuSearch: document.getElementById("gpuSearch"),
  pairSearch: document.getElementById("pairSearch"),
  cpuSort: document.getElementById("cpuSort"),
  gpuSort: document.getElementById("gpuSort"),
  pairSort: document.getElementById("pairSort"),
  themeToggle: document.getElementById("themeToggle"),
  cpuBrand: document.getElementById("cpuBrand"),
  gpuBrand: document.getElementById("gpuBrand"),
  pairCount: document.getElementById("pairCount"),
  cpuVisibleCount: document.getElementById("cpuVisibleCount"),
  gpuVisibleCount: document.getElementById("gpuVisibleCount"),
  cpuReset: document.getElementById("cpuReset"),
  gpuReset: document.getElementById("gpuReset"),
  cpuViewGrid: document.getElementById("cpuViewGrid"),
  cpuViewTable: document.getElementById("cpuViewTable"),
  gpuViewGrid: document.getElementById("gpuViewGrid"),
  gpuViewTable: document.getElementById("gpuViewTable"),
  cpuTable: document.getElementById("cpuTable"),
  gpuTable: document.getElementById("gpuTable"),
  cpuLoadMore: document.getElementById("cpuLoadMore"),
  gpuLoadMore: document.getElementById("gpuLoadMore"),
  calcCpuInput: document.getElementById("calcCpuInput"),
  calcGpuInput: document.getElementById("calcGpuInput"),
  calcCpuList: document.getElementById("calcCpuList"),
  calcGpuList: document.getElementById("calcGpuList"),
  calcProfile: document.getElementById("calcProfile"),
  calcScore: document.getElementById("calcScore"),
  calcValue: document.getElementById("calcValue"),
  calcNotes: document.getElementById("calcNotes"),
  userBadge: document.getElementById("userBadge"),
  userBadgeText: document.getElementById("userBadgeText"),
  userMenu: document.getElementById("userMenu"),
  userMenuName: document.getElementById("userMenuName"),
  logoutBtn: document.getElementById("logoutBtn"),
  registerOverlay: document.getElementById("registerOverlay"),
  registerClose: document.getElementById("registerClose"),
  registerStart: document.getElementById("registerStart"),
  registerSkip: document.getElementById("registerSkip"),
  registerHaveAccount: document.getElementById("registerHaveAccount"),
  registerForm: document.getElementById("registerForm"),
  registerName: document.getElementById("registerName"),
  registerEmail: document.getElementById("registerEmail"),
  registerSubmit: document.getElementById("registerSubmit"),
  floatingBadge: document.getElementById("floatingBadge"),
  savedGrid: document.getElementById("savedGrid"),
  savedEmpty: document.getElementById("savedEmpty"),
  compareGrid: document.getElementById("compareGrid"),
  compareEmpty: document.getElementById("compareEmpty"),
  bestCpuGrid: document.getElementById("bestCpuGrid"),
  bestGpuGrid: document.getElementById("bestGpuGrid"),
  topMonthList: document.getElementById("topMonthList"),
  cpuDetailBtn: document.getElementById("cpuDetailBtn"),
  cpuDetailOverlay: document.getElementById("cpuDetailOverlay"),
  cpuDetailClose: document.getElementById("cpuDetailClose"),
  cpuSingleContent: document.getElementById("cpuSingleContent"),
  cpuMultiContent: document.getElementById("cpuMultiContent"),
  cpuArchiveSearch: document.getElementById("cpuArchiveSearch"),
  cpuArchiveList: document.getElementById("cpuArchiveList"),
  cpuArchiveCount: document.getElementById("cpuArchiveCount"),
  cpuArchiveMore: document.getElementById("cpuArchiveMore"),
  cardDetailOverlay: document.getElementById("cardDetailOverlay"),
  cardDetailClose: document.getElementById("cardDetailClose"),
  cardDetailContent: document.getElementById("cardDetailContent"),
  cookieBanner: document.getElementById("cookieBanner"),
  cookieAccept: document.getElementById("cookieAccept"),
  cookieReject: document.getElementById("cookieReject"),
};

const storageKeys = {
  user: "benchlab.user",
  theme: "benchlab.theme",
  saved: "benchlab.saved",
  view: "benchlab.view",
  tableSort: "benchlab.tableSort",
  cookie: "benchlab.cookie",
};

const formatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 2,
});

const scoreFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 1,
});

const safe = (value) => (value ?? "").toString();

const formatMetric = (value, formatter) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "N/D";
  return formatter.format(numeric);
};

const normalizeMarketValue = (value, minValue, maxValue) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || !Number.isFinite(minValue) || !Number.isFinite(maxValue) || maxValue <= minValue) {
    return null;
  }
  const normalized = ((numeric - minValue) / (maxValue - minValue)) * 100;
  return Math.max(0, Math.min(100, normalized));
};

const formatPerformanceIndex = (value, maxValue) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || !maxValue) return "N/D";
  const normalized = (numeric / maxValue) * 100;
  return scoreFormatter.format(normalized);
};

const computeRating = ({ score, value, rank }, maxScore, minValue, maxValue, maxRank) => {
  if (!Number.isFinite(Number(score)) || !maxScore) return null;
  const perf = (Number(score) / maxScore) * 100;
  const val = normalizeMarketValue(value, minValue, maxValue);
  const rk = Number.isFinite(Number(rank)) && maxRank ? (1 - (Number(rank) - 1) / maxRank) * 100 : null;

  const parts = [
    { weight: 0.6, value: perf },
    { weight: 0.3, value: val },
    { weight: 0.1, value: rk },
  ].filter((part) => Number.isFinite(part.value));

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  if (!totalWeight) return null;
  const scoreIndex = parts.reduce((sum, part) => sum + part.value * part.weight, 0) / totalWeight;

  let label = "Base";
  if (scoreIndex >= 85) label = "Eccellente";
  else if (scoreIndex >= 70) label = "Ottima";
  else if (scoreIndex >= 55) label = "Buona";
  else if (scoreIndex >= 40) label = "Media";

  return { label, scoreIndex };
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.user));
  } catch (error) {
    return null;
  }
};

const setStoredUser = (user) => {
  localStorage.setItem(storageKeys.user, JSON.stringify(user));
};

const clearStoredUser = () => {
  localStorage.removeItem(storageKeys.user);
};

const getStoredSaved = () => {
  try {
    const items = JSON.parse(localStorage.getItem(storageKeys.saved));
    return Array.isArray(items) ? items : [];
  } catch (error) {
    return [];
  }
};

const setStoredSaved = (items) => {
  localStorage.setItem(storageKeys.saved, JSON.stringify(items));
};

const cpuSourceUrl = "https://www.cpubenchmark.net/cpu-list/";
const gpuSourceUrl = "https://www.videocardbenchmark.net/video_lookup.php";

const dedupeByName = (items) => {
  const seen = new Map();
  items.forEach((item) => {
    const key = safe(item.name).toLowerCase();
    if (!key) return;
    if (!seen.has(key)) {
      seen.set(key, item);
      return;
    }
    const existing = seen.get(key);
    const merged = {
      ...existing,
      ...item,
      score: Number.isFinite(Number(item.score)) ? item.score : existing.score,
      value: Number.isFinite(Number(item.value)) ? item.value : existing.value,
      rank: Number.isFinite(Number(item.rank)) ? item.rank : existing.rank,
      source: item.source || existing.source,
    };
    seen.set(key, merged);
  });
  return Array.from(seen.values());
};

const normalizeName = (value) =>
  safe(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const shouldKeepCpu = (name) => {
  const normalized = safe(name);
  const lower = normalized.toLowerCase();

  if (/intel\s+core\s+i[3579]\b/i.test(normalized)) return true;
  if (/intel\s+pentium\b/i.test(normalized) || /\bpentium\b/i.test(lower)) return true;
  if (/intel\s+xeon\b/i.test(normalized) || /\bxeon\b/i.test(lower)) return true;

  if (/amd\s+ryzen/i.test(normalized)) {
    const match = normalized.match(/\b(\d{4})\b/);
    if (!match) return false;
    const series = Number(match[1].slice(0, 1));
    return [2, 3, 5, 7, 9].includes(series);
  }

  return false;
};

const parseCoreScoreTable = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(doc.querySelectorAll("table"));
  const parseNumber = (text) => {
    const cleaned = text.replace(/[^\d.]/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const bestTable = tables
    .map((table) => {
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      return { table, rows };
    })
    .filter((entry) => entry.rows.length > 5)
    .sort((a, b) => b.rows.length - a.rows.length)[0];

  if (!bestTable) return new Map();

  const map = new Map();
  bestTable.rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length < 2) return;
    const name = cells[0].textContent.replace(/\s+/g, " ").trim();
    if (!name) return;
    const numbers = cells
      .slice(1)
      .map((cell) => parseNumber(cell.textContent))
      .filter((num) => Number.isFinite(num));
    if (!numbers.length) return;
    const score = Math.max(...numbers);
    map.set(normalizeName(name), score);
  });
  return map;
};

const parseCpuMarkMap = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll("#cputable tbody tr"));
  const map = new Map();
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    const name = cells[0]?.querySelector("a")?.textContent?.trim();
    if (!name) return;
    const score = Number(cells[1]?.textContent?.replace(/,/g, ""));
    if (!Number.isFinite(score)) return;
    map.set(normalizeName(name), score);
  });
  return map;
};

const buildCpuMarkPreview = (html, limit = 6, proxyLabel = "CPU Mark") => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll("#cputable tbody tr")).slice(0, limit);
  if (!rows.length) return null;
  /*
  const headers = ["CPU Name", proxyLabel, "Rank"ంద
];
  */
  const headers = ["CPU Name", proxyLabel, "Rank"];
  const tableRows = rows.map((row) => {
    const cells = row.querySelectorAll("td");
    const name = cells[0]?.textContent?.replace(/\s+/g, " ").trim() || "";
    const score = cells[1]?.textContent?.replace(/\s+/g, " ").trim() || "";
    const rank = cells[2]?.textContent?.replace(/\s+/g, " ").trim() || "";
    return [name, score, rank];
  });
  return { headers, rows: tableRows };
};

const mergeCpuCoreScores = async () => {
  try {
    const [singleHtml, multiHtml, cpuListHtml] = await Promise.all([
      fetch("cpu_singleCore.html").then((res) => res.text()),
      fetch("cpu_multiCore.html").then((res) => res.text()),
      fetch("Processors_list.html").then((res) => res.text()),
    ]);
    const singleMap = parseCoreScoreTable(singleHtml);
    const multiMap = parseCoreScoreTable(multiHtml);
    const cpuMarkMap = parseCpuMarkMap(cpuListHtml);

    state.cpus = state.cpus.map((cpu) => {
      const key = normalizeName(cpu.name);
      const singleScore = singleMap.get(key);
      const multiScore = multiMap.get(key);
      const cpuMarkScore = cpuMarkMap.get(key);
      const fallbackSingle = singleScore ?? cpu.singleCoreScore ?? cpuMarkScore ?? null;
      const fallbackMulti = multiScore ?? cpuMarkScore ?? cpu.multiCoreScore ?? null;
      return {
        ...cpu,
        singleCoreScore: fallbackSingle,
        multiCoreScore: fallbackMulti,
        singleCoreProxy: !singleScore && Number.isFinite(cpuMarkScore),
        multiCoreProxy: !multiScore && Number.isFinite(cpuMarkScore),
      };
    });
  } catch (error) {
    // ignore merge errors
  }
};

const mergeExtraCpus = async () => {
  try {
    const html = await fetch("Processors_list.html").then((res) => res.text());
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rows = Array.from(doc.querySelectorAll("tr[id^='cpu']"));
    const dataMap = new Map();

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      const name = cells[0]?.querySelector("a")?.textContent?.trim();
      if (!name) return;
      const score = Number(cells[1]?.textContent?.replace(/,/g, ""));
      const rank = Number(cells[2]?.textContent?.replace(/,/g, ""));
      const valueText = cells[3]?.textContent?.replace(/[^\d.]/g, "");
      const value = valueText ? Number(valueText) : null;
      dataMap.set(name.toLowerCase(), {
        name,
        score: Number.isFinite(score) ? score : null,
        value: Number.isFinite(value) ? value : null,
        rank: Number.isFinite(rank) ? rank : null,
        source: cpuSourceUrl,
      });
    });

    const filteredNames = Array.from(dataMap.values())
      .map((entry) => entry.name)
      .filter((name) => {
        const isIntel = /Intel\s+Core/i.test(name) || /Intel\s+Core\s+Ultra/i.test(name) || /Intel\s+Ultra/i.test(name);
        const isRyzen = /AMD\s+Ryzen\s+(3|5|7|9)\b/i.test(name);
        return isIntel || isRyzen;
      });

    const filteredSet = new Set(filteredNames.map((name) => name.toLowerCase()));

    state.cpus = state.cpus.map((cpu) => {
      const entry = dataMap.get(cpu.name.toLowerCase());
      if (!entry) return cpu;
      return { ...cpu, ...entry };
    });

    const existing = new Set(state.cpus.map((cpu) => cpu.name.toLowerCase()));
    const missing = Array.from(filteredSet)
      .filter((name) => !existing.has(name))
      .map((name) => dataMap.get(name))
      .filter(Boolean);

    if (missing.length) {
      state.cpus = [...state.cpus, ...missing];
    }
  } catch (error) {
    // ignore local file parsing errors
  }
};

const mergeExtraGpus = async () => {
  try {
    const html = await fetch("Videocard_list.html").then((res) => res.text());
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rows = Array.from(doc.querySelectorAll("tr[id^='gpu']"));
    const dataMap = new Map();

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      const name = cells[0]?.querySelector("a")?.textContent?.trim();
      if (!name) return;
      const score = Number(cells[1]?.textContent?.replace(/,/g, ""));
      const rank = Number(cells[2]?.textContent?.replace(/,/g, ""));
      const valueText = cells[3]?.textContent?.replace(/[^\d.]/g, "");
      const value = valueText ? Number(valueText) : null;
      dataMap.set(name.toLowerCase(), {
        name,
        score: Number.isFinite(score) ? score : null,
        value: Number.isFinite(value) ? value : null,
        rank: Number.isFinite(rank) ? rank : null,
        source: gpuSourceUrl,
      });
    });

    const filteredNames = Array.from(dataMap.values())
      .map((entry) => entry.name)
      .filter((name) => {
        const isNvidia = /(NVIDIA|Nvidia)\s*(RTX|GTX)\s*\d+/i.test(name);
        const isAmd = /AMD\s*RX\s*\d+/i.test(name);
        const isIntel = /Intel\s*Arc\s*[A-Za-z0-9-]+/i.test(name);
        return isNvidia || isAmd || isIntel;
      });

    const filteredSet = new Set(filteredNames.map((name) => name.toLowerCase()));

    state.gpus = state.gpus.map((gpu) => {
      const entry = dataMap.get(gpu.name.toLowerCase());
      if (!entry) return gpu;
      return { ...gpu, ...entry };
    });

    const existing = new Set(state.gpus.map((gpu) => gpu.name.toLowerCase()));
    const missing = Array.from(filteredSet)
      .filter((name) => !existing.has(name))
      .map((name) => dataMap.get(name))
      .filter(Boolean);

    if (missing.length) {
      state.gpus = [...state.gpus, ...missing];
    }
  } catch (error) {
    // ignore local file parsing errors
  }
};

const loadJson = async (url, fallback) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return await res.json();
  } catch (error) {
    return fallback;
  }
};

const loadData = async () => {
  const cpuFallback = window.__CPU_DATA__ || [];
  const gpuFallback = window.__GPU_DATA__ || [];

  const cpu = await loadJson("data/cpus.json", cpuFallback);
  const gpu = await loadJson("data/gpus.json", gpuFallback);
  const pairs = await loadJson("data/pairs.json", []);

  state.cpus = Array.isArray(cpu) && cpu.length ? cpu : cpuFallback;
  state.gpus = Array.isArray(gpu) && gpu.length ? gpu : gpuFallback;
  state.pairs = Array.isArray(pairs) ? pairs : [];

  await mergeExtraCpus();
  await mergeExtraGpus();
  await mergeCpuCoreScores();
  state.cpus = dedupeByName(state.cpus);
  state.cpus = state.cpus.filter((cpu) => shouldKeepCpu(cpu.name));
  state.gpus = dedupeByName(state.gpus);
  updateScoreRanges();
  updateCounts();
  buildCalculatorOptions();
  renderAll();
  calculatePower();
};

const renderCard = (item, type) => {
  const badgeLabel = type === "pair" ? "Coppia" : "Benchmark";
  const header = type === "pair" ? `${item.cpu} + ${item.gpu}` : item.name;
  const scoreLabel = "Punteggio";
  const valueLabel = type === "pair" ? "FPS" : "Valore mercato";
  const scoreText =
    type === "cpu"
      ? formatPerformanceIndex(item.score, state.maxCpuScore)
      : type === "gpu"
        ? formatPerformanceIndex(item.score, state.maxGpuScore)
        : formatMetric(item.score, scoreFormatter);
  const marketValue =
    type === "cpu"
      ? normalizeMarketValue(item.value, state.minCpuValue, state.maxCpuValue)
      : type === "gpu"
        ? normalizeMarketValue(item.value, state.minGpuValue, state.maxGpuValue)
        : item.value;
  const valueText =
    type === "cpu" || type === "gpu"
      ? formatMetric(marketValue, scoreFormatter)
      : formatMetric(item.value, formatter);
  const rankText = Number.isFinite(Number(item.rank)) ? `#${item.rank}` : "N/D";
  const ratingData =
    type === "cpu"
      ? computeRating(item, state.maxCpuScore, state.minCpuValue, state.maxCpuValue, state.maxCpuRank)
      : type === "gpu"
        ? computeRating(item, state.maxGpuScore, state.minGpuValue, state.maxGpuValue, state.maxGpuRank)
        : null;
  const ratingText = ratingData ? `${ratingData.label} (${scoreFormatter.format(ratingData.scoreIndex)})` : "N/D";
  const canSave = type === "cpu" || type === "gpu";
  const saveLabel = canSave ? "Salva" : "";
  const saveDataName = canSave ? item.name : "";
  const saveDataType = canSave ? type : "";
  const singleLabel = item.singleCoreProxy ? "Single core (proxy)" : "Single core";
  const multiLabel = item.multiCoreProxy ? "Multi core (CPU Mark)" : "Multi core";

  return `
    <article class="card">
      <span class="badge">${badgeLabel}</span>
      <h3>${header}</h3>
      ${canSave ? `<button class="save-btn" type="button" data-action="save" data-type="${saveDataType}" data-name="${saveDataName}">${saveLabel}</button>` : ""}
      <div class="metric-row"><span>${scoreLabel}</span><strong>${scoreText}</strong></div>
      <div class="metric-row"><span>${valueLabel}</span><strong>${valueText}</strong></div>
      <div class="metric-row"><span>Posizione</span><strong>${rankText}</strong></div>
      ${
        type === "cpu"
         ? `<div class="metric-row"><span>${singleLabel}</span><strong>${formatMetric(item.singleCoreScore, scoreFormatter)}</strong></div>
           <div class="metric-row"><span>${multiLabel}</span><strong>${formatMetric(item.multiCoreScore, scoreFormatter)}</strong></div>`
          : ""
      }
      ${type === "cpu" || type === "gpu" ? `<div class="metric-row"><span>Valutazione</span><strong>${ratingText}</strong></div>` : ""}
    </article>
  `;
};

const renderGrid = (items, type, grid) => {
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state">Nessun risultato trovato.</div>`;
    return;
  }
  grid.innerHTML = items.map((item) => renderCard(item, type)).join("");
};

const sortTableItems = (items, type) => {
  const { key, dir } = tableSortState[type] || { key: "rank", dir: "asc" };
  const mult = dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const aVal = key === "name" ? safe(a.name).toLowerCase() : Number(a[key]);
    const bVal = key === "name" ? safe(b.name).toLowerCase() : Number(b[key]);
    if (key === "name") return aVal.localeCompare(bVal) * mult;
    return ((aVal ?? 0) - (bVal ?? 0)) * mult;
  });
};

const renderTable = (items, type, container) => {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">Nessun risultato trovato.</div>`;
    return;
  }
  const sorted = sortTableItems(items, type);
  const headers =
    type === "cpu"
      ? [
          { key: "name", label: "CPU" },
          { key: "rank", label: "Rank" },
          { key: "value", label: "Valore 0-100" },
          { key: "singleCoreScore", label: "Single Core" },
          { key: "multiCoreScore", label: "Multi Core" },
        ]
      : [
          { key: "name", label: "GPU" },
          { key: "rank", label: "Rank" },
          { key: "value", label: "Valore 0-100" },
        ];

  const headerHtml = `
    <div class="bench-row head">
      ${headers
        .map(
          (h) =>
            `<button class="bench-head" type="button" data-table-sort="${type}" data-sort-key="${h.key}">${h.label}</button>`
        )
        .join("")}
      <span class="bench-head">Azioni</span>
    </div>
  `;

  const rowsHtml = sorted
    .map((item) => {
      const marketValue =
        type === "cpu"
          ? normalizeMarketValue(item.value, state.minCpuValue, state.maxCpuValue)
          : normalizeMarketValue(item.value, state.minGpuValue, state.maxGpuValue);
      const rowCells =
        type === "cpu"
          ? [
              item.name,
              Number.isFinite(Number(item.rank)) ? `#${item.rank}` : "N/D",
              formatMetric(marketValue, scoreFormatter),
              formatMetric(item.singleCoreScore, scoreFormatter),
              formatMetric(item.multiCoreScore, scoreFormatter),
            ]
          : [
              item.name,
              Number.isFinite(Number(item.rank)) ? `#${item.rank}` : "N/D",
              formatMetric(marketValue, scoreFormatter),
            ];
      return `
        <div class="bench-row">
          ${rowCells.map((cell) => `<span>${cell}</span>`).join("")}
          <button class="save-btn" type="button" data-action="save" data-type="${type}" data-name="${item.name}">Salva</button>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `${headerHtml}${rowsHtml}`;
};

const sortItems = (items, sortKey) => {
  const cloned = [...items];
  if (sortKey === "name") {
    return cloned.sort((a, b) => safe(a.name || a.cpu).localeCompare(safe(b.name || b.cpu)));
  }
  if (sortKey === "release") {
    const getRelease = (item) => {
      const raw = item.releaseDate ?? item.release ?? item.launchDate ?? null;
      if (!raw) return Number.NEGATIVE_INFINITY;
      if (typeof raw === "number") return new Date(raw, 0, 1).getTime();
      const trimmed = safe(raw).trim();
      if (/^\d{4}$/.test(trimmed)) return new Date(Number(trimmed), 0, 1).getTime();
      const dmY = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (dmY) {
        const [, dd, mm, yyyy] = dmY;
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
      }
      const parsed = Date.parse(trimmed);
      return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
    };
    return cloned.sort((a, b) => getRelease(b) - getRelease(a));
  }
  if (sortKey === "value") {
    return cloned.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  }
  if (sortKey === "rank") {
    return cloned.sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER));
  }
  return cloned.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
};

const matchesBrand = (name, brand) => {
  if (!brand || brand === "all") return true;
  return safe(name).toLowerCase().includes(brand.toLowerCase());
};

const filterItems = (items, term, type, brand) => {
  const query = term?.toLowerCase() || "";
  return items.filter((item) => {
    const text = type === "pair" ? `${item.cpu} ${item.gpu}` : item.name;
    const matchesQuery = !query || safe(text).toLowerCase().includes(query);
    const matchesVendor = type === "pair" ? true : matchesBrand(item.name, brand);
    return matchesQuery && matchesVendor;
  });
};

const updateCounts = () => {
  if (selectors.pairCount) selectors.pairCount.textContent = state.pairs.length.toLocaleString("it-IT");
};

const updateScoreRanges = () => {
  const cpuScores = state.cpus.map((item) => Number(item.score)).filter(Number.isFinite);
  const gpuScores = state.gpus.map((item) => Number(item.score)).filter(Number.isFinite);
  const cpuValues = state.cpus.map((item) => Number(item.value)).filter(Number.isFinite);
  const gpuValues = state.gpus.map((item) => Number(item.value)).filter(Number.isFinite);
  const cpuRanks = state.cpus.map((item) => Number(item.rank)).filter(Number.isFinite);
  const gpuRanks = state.gpus.map((item) => Number(item.rank)).filter(Number.isFinite);
  state.maxCpuScore = Math.max(...cpuScores, 0);
  state.maxGpuScore = Math.max(...gpuScores, 0);
  state.maxCpuValue = Math.max(...cpuValues, 0);
  state.maxGpuValue = Math.max(...gpuValues, 0);
  state.minCpuValue = cpuValues.length ? Math.min(...cpuValues) : 0;
  state.minGpuValue = gpuValues.length ? Math.min(...gpuValues) : 0;
  state.maxCpuRank = Math.max(...cpuRanks, 0);
  state.maxGpuRank = Math.max(...gpuRanks, 0);
};
const buildCalculatorOptions = () => {
  if (selectors.calcCpuList) {
    selectors.calcCpuList.innerHTML = state.cpus.map((cpu) => `<option value="${cpu.name}"></option>`).join("");
  }

  if (selectors.calcGpuList) {
    selectors.calcGpuList.innerHTML = state.gpus.map((gpu) => `<option value="${gpu.name}"></option>`).join("");
  }
};

const profileWeights = {
  balanced: { cpu: 0.5, gpu: 0.5 },
  gaming: { cpu: 0.35, gpu: 0.65 },
  creator: { cpu: 0.65, gpu: 0.35 },
};

const profileLabels = {
  balanced: "Bilanciato",
  gaming: "Gaming",
  creator: "Creator",
};

const viewState = {
  cpu: "grid",
  gpu: "grid",
};

const cpuPagination = {
  pageSize: 12,
  step: 12,
  visible: 12,
  lastKey: "",
};

const gpuPagination = {
  pageSize: 24,
  step: 24,
  visible: 24,
  lastKey: "",
};

const savedPagination = {
  pageSize: 24,
  step: 24,
  visible: 24,
  lastCount: 0,
};

const tableSortState = {
  cpu: { key: "rank", dir: "asc" },
  gpu: { key: "rank", dir: "asc" },
};

const detailCache = {
  single: null,
  multi: null,
};

const archiveState = {
  items: [],
  headers: [],
  filtered: [],
  page: 1,
  pageSize: 60,
  loaded: false,
};

const normalizeValue = (value, maxValue) => {
  if (!maxValue) return 0;
  return Math.max(0, Math.min(1, (value ?? 0) / maxValue));
};

const normalizeRank = (rank, maxRank) => {
  if (!maxRank) return 0;
  const safeRank = Math.max(1, rank ?? maxRank);
  return Math.max(0, Math.min(1, 1 - (safeRank - 1) / maxRank));
};

const findByName = (items, term) => {
  const query = term?.trim().toLowerCase();
  if (!query) return null;
  const exact = items.find((item) => safe(item.name).toLowerCase() === query);
  if (exact) return exact;
  return items.find((item) => safe(item.name).toLowerCase().includes(query)) || null;
};

const calculatePower = () => {
  const cpuTerm = selectors.calcCpuInput?.value || "";
  const gpuTerm = selectors.calcGpuInput?.value || "";
  const profile = selectors.calcProfile?.value || "balanced";

  const cpu = findByName(state.cpus, cpuTerm);
  const gpu = findByName(state.gpus, gpuTerm);

  if (!cpu || !gpu) {
    if (selectors.calcScore) selectors.calcScore.textContent = "-";
    if (selectors.calcValue) selectors.calcValue.textContent = "-";
    if (selectors.calcNotes) selectors.calcNotes.textContent = "Seleziona CPU e GPU per ottenere il risultato.";
    return;
  }

  const hasScore = Number.isFinite(Number(cpu.score)) && Number.isFinite(Number(gpu.score));
  const hasValue = Number.isFinite(Number(cpu.value)) && Number.isFinite(Number(gpu.value));
  if (!hasScore || !hasValue) {
    if (selectors.calcScore) selectors.calcScore.textContent = "N/D";
    if (selectors.calcValue) selectors.calcValue.textContent = "N/D";
    if (selectors.calcNotes) selectors.calcNotes.textContent = "Dati incompleti per il calcolo.";
    return;
  }

  const weights = profileWeights[profile] || profileWeights.balanced;
  const cpuScores = state.cpus.map((item) => Number(item.score)).filter(Number.isFinite);
  const gpuScores = state.gpus.map((item) => Number(item.score)).filter(Number.isFinite);
  const cpuValues = state.cpus.map((item) => Number(item.value)).filter(Number.isFinite);
  const gpuValues = state.gpus.map((item) => Number(item.value)).filter(Number.isFinite);
  const cpuRanks = state.cpus.map((item) => Number(item.rank)).filter(Number.isFinite);
  const gpuRanks = state.gpus.map((item) => Number(item.rank)).filter(Number.isFinite);

  const maxCpuScore = Math.max(...cpuScores, 0);
  const maxGpuScore = Math.max(...gpuScores, 0);
  const maxCpuValue = Math.max(...cpuValues, 0);
  const maxGpuValue = Math.max(...gpuValues, 0);
  const maxCpuRank = Math.max(...cpuRanks, 0);
  const maxGpuRank = Math.max(...gpuRanks, 0);

  const cpuPerf =
    normalizeValue(cpu.score, maxCpuScore) * 0.7 + normalizeRank(cpu.rank, maxCpuRank) * 0.3;
  const gpuPerf =
    normalizeValue(gpu.score, maxGpuScore) * 0.7 + normalizeRank(gpu.rank, maxGpuRank) * 0.3;
  const cpuMarket = normalizeMarketValue(cpu.value, state.minCpuValue, state.maxCpuValue);
  const gpuMarket = normalizeMarketValue(gpu.value, state.minGpuValue, state.maxGpuValue);
  const cpuVal = Number.isFinite(cpuMarket) ? cpuMarket / 100 : 0;
  const gpuVal = Number.isFinite(gpuMarket) ? gpuMarket / 100 : 0;

  const combinedScore = (cpuPerf * weights.cpu + gpuPerf * weights.gpu) * 100;
  const combinedValue = (cpuVal * weights.cpu + gpuVal * weights.gpu) * 100;

  if (selectors.calcScore) selectors.calcScore.textContent = scoreFormatter.format(combinedScore);
  if (selectors.calcValue) selectors.calcValue.textContent = scoreFormatter.format(combinedValue);
  if (selectors.calcNotes) {
    const profileLabel = profileLabels[profile] || "Bilanciato";
    selectors.calcNotes.textContent = `CPU: ${cpu.name} · GPU: ${gpu.name} · Profilo: ${profileLabel}`;
  }
};

const updateUserUI = (user) => {
  const isRegistered = Boolean(user && user.name);
  if (selectors.userBadgeText) {
    selectors.userBadgeText.textContent = isRegistered ? `Ciao, ${user.name}` : "Utente non registrato";
  }
  if (selectors.userBadge) {
    selectors.userBadge.classList.toggle("registered", isRegistered);
  }
  if (selectors.floatingBadge) {
    selectors.floatingBadge.classList.toggle("hidden", isRegistered);
  }
  if (selectors.userMenuName) {
    selectors.userMenuName.textContent = isRegistered ? user.email || user.name : "";
  }
};

const openRegisterOverlay = () => {
  if (selectors.registerOverlay) {
    selectors.registerOverlay.classList.remove("hidden");
  }
};

const setRegisterMode = (mode) => {
  if (selectors.registerForm) {
    selectors.registerForm.dataset.mode = mode;
    selectors.registerForm.classList.remove("hidden");
  }
  if (selectors.registerSubmit) {
    selectors.registerSubmit.textContent = mode === "login" ? "Accedi" : "Completa registrazione";
  }
};

const closeRegisterOverlay = () => {
  if (selectors.registerOverlay) {
    selectors.registerOverlay.classList.add("hidden");
  }
  if (selectors.registerForm) {
    selectors.registerForm.classList.add("hidden");
    selectors.registerForm.reset();
  }
  if (selectors.registerSubmit) {
    selectors.registerSubmit.textContent = "Completa registrazione";
  }
};

const ensureVisible = (...elements) => {
  elements.forEach((element) => element?.classList.add("is-visible"));
};

const renderAll = () => {
  try {
    const cpuTerm = selectors.cpuSearch?.value.trim() || "";
    const gpuTerm = selectors.gpuSearch?.value.trim() || "";
    const pairTerm = selectors.pairSearch?.value.trim() || "";
    const cpuBrand = selectors.cpuBrand?.value || "all";
    const gpuBrand = selectors.gpuBrand?.value || "all";

    const cpuSortKey = selectors.cpuSort?.value || "rank";
    const sortedCpus = sortItems(filterItems(state.cpus, cpuTerm, "cpu", cpuBrand), cpuSortKey);
    const sortedGpus = sortItems(filterItems(state.gpus, gpuTerm, "gpu", gpuBrand), selectors.gpuSort?.value || "rank");
    const sortedPairs = sortItems(filterItems(state.pairs, pairTerm, "pair"), selectors.pairSort?.value || "score");

    if (selectors.cpuVisibleCount) {
      selectors.cpuVisibleCount.textContent = `${sortedCpus.length.toLocaleString("it-IT")} risultati`;
    }
    if (selectors.gpuVisibleCount) {
      selectors.gpuVisibleCount.textContent = `${sortedGpus.length.toLocaleString("it-IT")} risultati`;
    }

    if (viewState.cpu === "table") {
      renderTable(sortedCpus, "cpu", selectors.cpuTable);
      selectors.cpuGrid?.classList.add("hidden");
      selectors.cpuTable?.classList.remove("hidden");
      ensureVisible(selectors.cpuTable);
      if (selectors.cpuLoadMore) {
        selectors.cpuLoadMore.style.display = "none";
      }
    } else {
      const paginationKey = `${cpuTerm}::${cpuBrand}::${cpuSortKey}::${viewState.cpu}`;
      if (cpuPagination.lastKey !== paginationKey) {
        cpuPagination.visible = cpuPagination.pageSize;
        cpuPagination.lastKey = paginationKey;
      }
      const totalCpu = sortedCpus.length;
      const visibleCpu = Math.min(cpuPagination.visible, totalCpu);
      const cpuSlice = sortedCpus.slice(0, visibleCpu);
      renderGrid(cpuSlice, "cpu", selectors.cpuGrid);
      selectors.cpuGrid?.classList.remove("hidden");
      selectors.cpuTable?.classList.add("hidden");
      ensureVisible(selectors.cpuGrid);
      if (selectors.cpuLoadMore) {
        selectors.cpuLoadMore.style.display = visibleCpu < totalCpu ? "inline-flex" : "none";
      }
    }

    if (viewState.gpu === "table") {
      renderTable(sortedGpus, "gpu", selectors.gpuTable);
      selectors.gpuGrid?.classList.add("hidden");
      selectors.gpuTable?.classList.remove("hidden");
      ensureVisible(selectors.gpuTable);
      if (selectors.gpuLoadMore) {
        selectors.gpuLoadMore.style.display = "none";
      }
    } else {
      const paginationKey = `${gpuTerm}::${gpuBrand}::${selectors.gpuSort?.value || "rank"}::${viewState.gpu}`;
      if (gpuPagination.lastKey !== paginationKey) {
        gpuPagination.visible = gpuPagination.pageSize;
        gpuPagination.lastKey = paginationKey;
      }
      const totalGpu = sortedGpus.length;
      const visibleGpu = Math.min(gpuPagination.visible, totalGpu);
      const gpuSlice = sortedGpus.slice(0, visibleGpu);
      renderGrid(gpuSlice, "gpu", selectors.gpuGrid);
      selectors.gpuGrid?.classList.remove("hidden");
      selectors.gpuTable?.classList.add("hidden");
      ensureVisible(selectors.gpuGrid);
      if (selectors.gpuLoadMore) {
        selectors.gpuLoadMore.style.display = visibleGpu < totalGpu ? "inline-flex" : "none";
      }
    }
    renderGrid(sortedPairs, "pair", selectors.pairGrid);
    ensureVisible(selectors.pairGrid);
    renderSaved();
    renderInsights();
  } catch (error) {
    console.error("Render failed", error);
  }
};

const renderInsights = () => {
  const bestCpuGrid = selectors.bestCpuGrid;
  const bestGpuGrid = selectors.bestGpuGrid;
  const topMonthList = selectors.topMonthList;

  const pickTop = (items, sortKey, count = 1, direction = "desc") => {
    const valid = items.filter((item) => Number.isFinite(Number(item[sortKey])));
    const sorted = [...valid].sort((a, b) => {
      const delta = Number(a[sortKey]) - Number(b[sortKey]);
      return direction === "asc" ? delta : -delta;
    });
    return sorted.slice(0, count);
  };

  if (bestCpuGrid) {
    const topScore = pickTop(state.cpus, "score", 1)[0];
    const topValue = pickTop(state.cpus, "value", 1)[0];
    const topRank = pickTop(state.cpus, "rank", 1, "asc")[0];
    bestCpuGrid.innerHTML = [
      { label: "Gaming", item: topScore },
      { label: "Produttività", item: topRank },
      { label: "Budget", item: topValue },
    ]
      .map(({ label, item }) => {
        if (!item) return "";
        return `<div class="stack-row"><span>${label}</span><strong>${item.name}</strong></div>`;
      })
      .join("");
  }

  if (bestGpuGrid) {
    const topScore = pickTop(state.gpus, "score", 1)[0];
    const topValue = pickTop(state.gpus, "value", 1)[0];
    const topRank = pickTop(state.gpus, "rank", 1, "asc")[0];
    bestGpuGrid.innerHTML = [
      { label: "Gaming", item: topScore },
      { label: "Creator", item: topRank },
      { label: "Budget", item: topValue },
    ]
      .map(({ label, item }) => {
        if (!item) return "";
        return `<div class="stack-row"><span>${label}</span><strong>${item.name}</strong></div>`;
      })
      .join("");
  }

  if (topMonthList) {
    const topCpu = pickTop(state.cpus, "rank", 3, "asc").map((item) => ({ type: "CPU", item }));
    const topGpu = pickTop(state.gpus, "rank", 3, "asc").map((item) => ({ type: "GPU", item }));
    const combined = [...topCpu, ...topGpu];
    topMonthList.innerHTML = combined
      .map(({ type, item }) => `<li><strong>${type}</strong> · ${item.name}</li>`)
      .join("");
  }
};

const renderSaved = () => {
  try {
    if (!selectors.savedGrid) return;
    const saved = state.saved || [];
    if (savedPagination.lastCount !== saved.length && savedPagination.visible > saved.length) {
      savedPagination.visible = Math.min(savedPagination.pageSize, saved.length);
    }
    savedPagination.lastCount = saved.length;
    if (selectors.savedEmpty) {
      selectors.savedEmpty.style.display = saved.length ? "none" : "block";
    }
    const visibleSaved = saved.slice(0, Math.min(savedPagination.visible, saved.length));
    selectors.savedGrid.innerHTML = visibleSaved
      .map((item) => {
        const compareSelected = state.compare.some((entry) => entry.name === item.name && entry.type === item.type);
        const compareLabel = compareSelected ? "Selezionato" : "Confronta";
        return `
          <article class="card">
            <span class="badge">${item.type?.toUpperCase() || ""}</span>
            <h3>${item.name}</h3>
            <div class="metric-row"><span>Valore mercato</span><strong>${formatMetric(item.marketValue, scoreFormatter)}</strong></div>
            <div class="metric-row"><span>Posizione</span><strong>${Number.isFinite(Number(item.rank)) ? `#${item.rank}` : "N/D"}</strong></div>
            <div class="metric-row"><span>Salvato il</span><strong>${item.savedAt}</strong></div>
            <div class="card-actions">
              <button class="compare-btn" type="button" data-action="compare-toggle" data-type="${item.type}" data-name="${item.name}" aria-pressed="${compareSelected}">${compareLabel}</button>
              <button class="remove-btn" type="button" data-action="remove" data-type="${item.type}" data-name="${item.name}">Rimuovi</button>
            </div>
          </article>
        `;
      })
      .join("");
    if (selectors.savedLoadMore) {
      selectors.savedLoadMore.style.display = visibleSaved.length < saved.length ? "inline-flex" : "none";
    }
    renderCompare();
  } catch (error) {
    console.error("Saved render failed", error);
  }
};

const renderCompare = () => {
  try {
    if (!selectors.compareGrid) return;
    const items = state.compare;
    if (selectors.compareEmpty) {
      selectors.compareEmpty.style.display = items.length ? "none" : "block";
    }
    selectors.compareGrid.innerHTML = items
      .map((item) => {
        return `
          <article class="compare-card">
            <span class="badge">${item.type?.toUpperCase() || ""}</span>
            <h4>${item.name}</h4>
            <div class="metric-row"><span>Valore mercato</span><strong>${formatMetric(item.marketValue, scoreFormatter)}</strong></div>
            <div class="metric-row"><span>Posizione</span><strong>${Number.isFinite(Number(item.rank)) ? `#${item.rank}` : "N/D"}</strong></div>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Compare render failed", error);
  }
};

const ensureAuthenticated = () => {
  const user = getStoredUser();
  if (user && user.name) return true;
  openRegisterOverlay();
  return false;
};

const findItemByName = (type, name) => {
  if (type === "cpu") return state.cpus.find((item) => item.name === name) || null;
  if (type === "gpu") return state.gpus.find((item) => item.name === name) || null;
  return null;
};

const saveComponent = (name, type) => {
  if (!ensureAuthenticated()) return;
  const trimmedName = safe(name).trim();
  if (!trimmedName) return;
  const existing = state.saved.find((item) => item.name === trimmedName && item.type === type);
  if (existing) return;
  const data = findItemByName(type, trimmedName);
  const marketValue =
    type === "cpu"
      ? normalizeMarketValue(data?.value, state.minCpuValue, state.maxCpuValue)
      : normalizeMarketValue(data?.value, state.minGpuValue, state.maxGpuValue);
  const savedAt = new Date().toLocaleDateString("it-IT");
  state.saved = [
    {
      name: trimmedName,
      type,
      score: data?.score ?? null,
      value: data?.value ?? null,
      marketValue: Number.isFinite(marketValue) ? marketValue : null,
      rank: data?.rank ?? null,
      savedAt,
    },
    ...state.saved,
  ].slice(0, 200);
  setStoredSaved(state.saved);
  renderSaved();
};

const removeComponent = (name, type) => {
  const trimmedName = safe(name).trim();
  if (!trimmedName) return;
  state.saved = state.saved.filter((item) => !(item.name === trimmedName && item.type === type));
  state.compare = state.compare.filter((item) => !(item.name === trimmedName && item.type === type));
  setStoredSaved(state.saved);
  renderSaved();
};

const toggleCompare = (name, type) => {
  const trimmedName = safe(name).trim();
  if (!trimmedName) return;
  const existingIndex = state.compare.findIndex((item) => item.name === trimmedName && item.type === type);
  if (existingIndex >= 0) {
    state.compare.splice(existingIndex, 1);
    renderSaved();
    return;
  }
  if (state.compare.length >= 3) return;
  const savedItem = state.saved.find((item) => item.name === trimmedName && item.type === type);
  if (!savedItem) return;
  state.compare = [...state.compare, savedItem];
  renderSaved();
};

const setDetailTab = (tab) => {
  const buttons = document.querySelectorAll(".detail-tab");
  const panels = document.querySelectorAll(".detail-panel");
  buttons.forEach((button) => {
    const isActive = button.dataset.detailTab === tab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.detailPanel === tab);
  });
};

const extractTablePreview = (doc, limit = 5) => {
  const tables = Array.from(doc.querySelectorAll("table"));
  if (!tables.length) return null;
  const scored = tables
    .map((table) => {
      const rows = Array.from(table.querySelectorAll("tr")).filter((row) => row.querySelectorAll("td").length >= 2);
      return { table, rows };
    })
    .filter((entry) => entry.rows.length);
  if (!scored.length) return null;
  const best = scored.sort((a, b) => b.rows.length - a.rows.length)[0];
  const headers = Array.from(best.table.querySelectorAll("th")).map((th) => th.textContent.trim()).filter(Boolean);
  const rows = best.rows.slice(0, limit).map((row) =>
    Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent.trim())
  );
  return { headers, rows };
};

const renderDetailContent = (target, data) => {
  if (!target) return;
  const table = data.table;
  const rowsHtml = table
    ? `
      <div class="detail-table">
        ${table.headers.length ? `<div class="detail-head">${table.headers.map((h) => `<span>${h}</span>`).join("")}</div>` : ""}
        ${table.rows
          .map(
            (row) => `<div class="detail-row">${row.map((cell) => `<span>${cell}</span>`).join("")}</div>`
          )
          .join("")}
      </div>
    `
    : "";

  target.innerHTML = `
    <div class="detail-meta">
      <h4>${data.title || "Dettagli"}</h4>
      <p class="muted">${data.description || ""}</p>
    </div>
    ${rowsHtml || `<p class="muted">Nessuna tabella disponibile nel file sorgente.</p>`}
  `;
};

const loadCpuDetail = async (kind) => {
  if (detailCache[kind]) return detailCache[kind];
  const path = kind === "single" ? "cpu_singleCore.html" : "cpu_multiCore.html";
  const html = await fetch(path).then((res) => res.text());
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = doc.querySelector("title")?.textContent?.trim();
  const description = doc.querySelector("meta[name='description']")?.getAttribute("content")?.trim();
  let table = extractTablePreview(doc, 6);
  let note = "";

  if (!table) {
    try {
      const cpuListHtml = await fetch("Processors_list.html").then((res) => res.text());
      const proxyLabel = kind === "single" ? "CPU Mark (proxy)" : "CPU Mark";
      table = buildCpuMarkPreview(cpuListHtml, 6, proxyLabel);
      if (table) {
        note =
          kind === "single"
            ? "Il file offline non include la tabella single core. Mostro il CPU Mark come proxy." 
            : "Il file offline non include la tabella multi core. Mostro il CPU Mark dal listino PassMark.";
      }
    } catch (error) {
      // ignore fallback errors
    }
  }

  const combinedDescription = [description, note].filter(Boolean).join(" ");
  detailCache[kind] = { title, description: combinedDescription, table };
  return detailCache[kind];
};

const loadCpuArchive = async () => {
  if (archiveState.loaded) return archiveState;
  const html = await fetch("Processors_list.html").then((res) => res.text());
  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.querySelector("#cputable");
  if (!table) {
    archiveState.loaded = true;
    return archiveState;
  }

  const headers = Array.from(table.querySelectorAll("thead th"))
    .map((th) => th.textContent.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const items = rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent.replace(/\s+/g, " ").trim());
      const name = cells[0] || "";
      return { name, cells };
    })
    .filter((item) => item.name);

  archiveState.items = items;
  archiveState.headers = headers.slice(0, 5);
  archiveState.filtered = items;
  archiveState.loaded = true;
  return archiveState;
};

const renderArchive = () => {
  if (!selectors.cpuArchiveList) return;
  const query = selectors.cpuArchiveSearch?.value.trim().toLowerCase() || "";
  archiveState.filtered = !query
    ? archiveState.items
    : archiveState.items.filter((item) => item.name.toLowerCase().includes(query));
  const visible = archiveState.filtered.slice(0, archiveState.page * archiveState.pageSize);
  if (selectors.cpuArchiveCount) {
    selectors.cpuArchiveCount.textContent = `${archiveState.filtered.length.toLocaleString("it-IT")} processori`;
  }
  if (selectors.cpuArchiveMore) {
    selectors.cpuArchiveMore.style.display = visible.length < archiveState.filtered.length ? "inline-flex" : "none";
  }

  const headers = archiveState.headers.length ? archiveState.headers : ["CPU Name", "CPU Mark", "Rank", "CPU Value", "Price"];
  const headerHtml = `<div class="archive-row head">${headers.map((h) => `<span>${h}</span>`).join("")}</div>`;
  const rowsHtml = visible
    .map((item) => {
      const cells = item.cells.slice(0, headers.length).map((cell) => `<span>${cell || "-"}</span>`).join("");
      return `<div class="archive-row">${cells}</div>`;
    })
    .join("");
  selectors.cpuArchiveList.innerHTML = `${headerHtml}${rowsHtml}`;
};

const setActiveTab = (tab) => {
  const buttons = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");
  buttons.forEach((button) => {
    const isActive = button.dataset.tab === tab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tab);
  });
};

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setupRevealAnimations = () => {
  const targets = Array.from(
    document.querySelectorAll(
      ".hero-content, .quick-actions, .section, .quick-card, .insight-card, .calculator, .grid, .table-wrap, .compare-grid, .stack, .list"
    )
  );

  if (!targets.length) return;
  targets.forEach((target) => target.classList.add("is-visible"));
};

const setupTiltEffects = () => {
  const cards = document.querySelectorAll(".quick-card, .insight-card, .card");
  if (!cards.length) return;

  cards.forEach((card) => {
    card.classList.add("js-tilt");
    card.addEventListener("mousemove", (event) => {
      if (prefersReducedMotion()) return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
      card.style.setProperty("--glow-x", `${(x / rect.width) * 100}%`);
      card.style.setProperty("--glow-y", `${(y / rect.height) * 100}%`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
};

const setupScrollSpy = () => {
  const navLinks = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  if (!navLinks.length) return;

  const linkBySection = new Map();
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const section = document.querySelector(href);
    if (section) {
      linkBySection.set(section, link);
    }
  });

  if (!linkBySection.size) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove("active"));
        const link = linkBySection.get(entry.target);
        if (link) link.classList.add("active");
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0.1 }
  );

  linkBySection.forEach((_, section) => observer.observe(section));
};

const initInteractiveEnhancements = () => {
  setupRevealAnimations();
  setupTiltEffects();
  setupScrollSpy();
};

const init = () => {
  state.saved = getStoredSaved();
  state.compare = [];
  renderSaved();

  try {
    const storedView = JSON.parse(localStorage.getItem(storageKeys.view));
    if (storedView?.cpu) viewState.cpu = storedView.cpu;
    if (storedView?.gpu) viewState.gpu = storedView.gpu;
    const storedSort = JSON.parse(localStorage.getItem(storageKeys.tableSort));
    if (storedSort?.cpu) tableSortState.cpu = storedSort.cpu;
    if (storedSort?.gpu) tableSortState.gpu = storedSort.gpu;
  } catch (error) {
    // ignore
  }

  if (selectors.cpuViewGrid && selectors.cpuViewTable) {
    selectors.cpuViewGrid.classList.toggle("active", viewState.cpu === "grid");
    selectors.cpuViewTable.classList.toggle("active", viewState.cpu === "table");
  }
  if (selectors.gpuViewGrid && selectors.gpuViewTable) {
    selectors.gpuViewGrid.classList.toggle("active", viewState.gpu === "grid");
    selectors.gpuViewTable.classList.toggle("active", viewState.gpu === "table");
  }

  document.querySelectorAll("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.scroll);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      if (btn.dataset.tab) {
        setActiveTab(btn.dataset.tab);
      }
    });
  });

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab) {
        setActiveTab(btn.dataset.tab);
      }
    });
  });

  document.querySelectorAll("[data-protected]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!ensureAuthenticated()) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  });

  [selectors.cpuSearch, selectors.gpuSearch, selectors.pairSearch]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("input", renderAll);
    });

  [selectors.calcCpuInput, selectors.calcGpuInput]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("input", () => {
        calculatePower();
      });
    });

  [
    selectors.cpuSort,
    selectors.gpuSort,
    selectors.pairSort,
    selectors.cpuBrand,
    selectors.gpuBrand,
    selectors.calcCpuInput,
    selectors.calcGpuInput,
    selectors.calcProfile,
  ]
    .filter(Boolean)
    .forEach((select) => {
      select.addEventListener("change", () => {
        renderAll();
        calculatePower();
      });
    });

  if (selectors.themeToggle) {
    selectors.themeToggle.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = state.theme;
      localStorage.setItem(storageKeys.theme, state.theme);
    });
  }

  const storedTheme = localStorage.getItem(storageKeys.theme);
  if (storedTheme) {
    state.theme = storedTheme;
    document.documentElement.dataset.theme = state.theme;
  }

  const storedUser = getStoredUser();
  updateUserUI(storedUser);

  // Avoid blocking the UI with the registration overlay on initial load.

  if (selectors.userBadge) {
    selectors.userBadge.addEventListener("click", () => {
      const user = getStoredUser();
      if (user && selectors.userMenu) {
        selectors.userMenu.classList.toggle("hidden");
      } else {
        openRegisterOverlay();
      }
    });
  }

  if (selectors.floatingBadge) {
    selectors.floatingBadge.addEventListener("click", openRegisterOverlay);
  }

  if (selectors.logoutBtn) {
    selectors.logoutBtn.addEventListener("click", () => {
      clearStoredUser();
      updateUserUI(null);
      if (selectors.userMenu) {
        selectors.userMenu.classList.add("hidden");
      }
      openRegisterOverlay();
    });
  }

  if (selectors.registerClose) {
    selectors.registerClose.addEventListener("click", closeRegisterOverlay);
  }

  if (selectors.registerSkip) {
    selectors.registerSkip.addEventListener("click", closeRegisterOverlay);
  }

  if (selectors.registerHaveAccount) {
    selectors.registerHaveAccount.addEventListener("click", () => {
      setRegisterMode("login");
      selectors.registerName?.focus();
    });
  }

  if (selectors.registerStart) {
    selectors.registerStart.addEventListener("click", () => {
      setRegisterMode("signup");
      selectors.registerName?.focus();
    });
  }

  if (selectors.registerForm) {
    selectors.registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = selectors.registerName?.value.trim();
      const email = selectors.registerEmail?.value.trim();
      if (!name || !email) return;
      const user = { name, email, registeredAt: new Date().toISOString() };
      setStoredUser(user);
      updateUserUI(user);
      closeRegisterOverlay();
      selectors.registerForm.reset();
      selectors.registerForm.classList.add("hidden");
      renderSaved();
    });
  }

  if (selectors.cpuDetailBtn) {
    selectors.cpuDetailBtn.addEventListener("click", async () => {
      if (!selectors.cpuDetailOverlay) return;
      selectors.cpuDetailOverlay.classList.remove("hidden");
      selectors.cpuArchiveList && (selectors.cpuArchiveList.textContent = "Caricamento...");
      const single = await loadCpuDetail("single");
      const multi = await loadCpuDetail("multi");
      await loadCpuArchive();
      renderDetailContent(selectors.cpuSingleContent, single);
      renderDetailContent(selectors.cpuMultiContent, multi);
      archiveState.page = 1;
      renderArchive();
      setDetailTab("archive");
    });
  }

  document.querySelectorAll(".detail-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      setDetailTab(tab.dataset.detailTab);
    });
  });

  if (selectors.cpuDetailClose) {
    selectors.cpuDetailClose.addEventListener("click", () => {
      selectors.cpuDetailOverlay?.classList.add("hidden");
    });
  }

  if (selectors.cpuDetailOverlay) {
    selectors.cpuDetailOverlay.addEventListener("click", (event) => {
      if (event.target === selectors.cpuDetailOverlay) {
        selectors.cpuDetailOverlay.classList.add("hidden");
      }
    });
  }

  if (selectors.cpuArchiveSearch) {
    selectors.cpuArchiveSearch.addEventListener("input", () => {
      archiveState.page = 1;
      renderArchive();
    });
  }

  if (selectors.cpuArchiveMore) {
    selectors.cpuArchiveMore.addEventListener("click", () => {
      archiveState.page += 1;
      renderArchive();
    });
  }

  if (selectors.cpuViewGrid && selectors.cpuViewTable) {
    selectors.cpuViewGrid.addEventListener("click", () => {
      viewState.cpu = "grid";
      selectors.cpuViewGrid.classList.add("active");
      selectors.cpuViewTable.classList.remove("active");
      localStorage.setItem(storageKeys.view, JSON.stringify(viewState));
      renderAll();
    });
    selectors.cpuViewTable.addEventListener("click", () => {
      viewState.cpu = "table";
      selectors.cpuViewTable.classList.add("active");
      selectors.cpuViewGrid.classList.remove("active");
      localStorage.setItem(storageKeys.view, JSON.stringify(viewState));
      renderAll();
    });
  }

  if (selectors.gpuViewGrid && selectors.gpuViewTable) {
    selectors.gpuViewGrid.addEventListener("click", () => {
      viewState.gpu = "grid";
      selectors.gpuViewGrid.classList.add("active");
      selectors.gpuViewTable.classList.remove("active");
      localStorage.setItem(storageKeys.view, JSON.stringify(viewState));
      renderAll();
    });
    selectors.gpuViewTable.addEventListener("click", () => {
      viewState.gpu = "table";
      selectors.gpuViewTable.classList.add("active");
      selectors.gpuViewGrid.classList.remove("active");
      localStorage.setItem(storageKeys.view, JSON.stringify(viewState));
      renderAll();
    });
  }

  const cookieChoice = localStorage.getItem(storageKeys.cookie);
  if (!cookieChoice && selectors.cookieBanner) {
    selectors.cookieBanner.classList.remove("hidden");
  }
  if (selectors.cookieAccept) {
    selectors.cookieAccept.addEventListener("click", () => {
      localStorage.setItem(storageKeys.cookie, "accepted");
      selectors.cookieBanner?.classList.add("hidden");
    });
  }
  if (selectors.cookieReject) {
    selectors.cookieReject.addEventListener("click", () => {
      localStorage.setItem(storageKeys.cookie, "rejected");
      selectors.cookieBanner?.classList.add("hidden");
    });
  }

  if (selectors.cpuReset) {
    selectors.cpuReset.addEventListener("click", () => {
      if (selectors.cpuSearch) selectors.cpuSearch.value = "";
      if (selectors.cpuBrand) selectors.cpuBrand.value = "all";
      if (selectors.cpuSort) selectors.cpuSort.value = "rank";
      renderAll();
    });
  }

  if (selectors.gpuReset) {
    selectors.gpuReset.addEventListener("click", () => {
      if (selectors.gpuSearch) selectors.gpuSearch.value = "";
      if (selectors.gpuBrand) selectors.gpuBrand.value = "all";
      if (selectors.gpuSort) selectors.gpuSort.value = "rank";
      renderAll();
    });
  }

  if (selectors.cpuLoadMore) {
    selectors.cpuLoadMore.addEventListener("click", () => {
      cpuPagination.visible += cpuPagination.step;
      renderAll();
    });
  }

  if (selectors.gpuLoadMore) {
    selectors.gpuLoadMore.addEventListener("click", () => {
      gpuPagination.visible += gpuPagination.step;
      renderAll();
    });
  }

  if (selectors.savedLoadMore) {
    selectors.savedLoadMore.addEventListener("click", () => {
      savedPagination.visible += savedPagination.step;
      renderSaved();
    });
  }

  initInteractiveEnhancements();

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches("[data-action='save']")) {
      const name = target.getAttribute("data-name");
      const type = target.getAttribute("data-type");
      saveComponent(name, type);
    }
    if (target.matches("[data-action='compare-toggle']")) {
      const name = target.getAttribute("data-name");
      const type = target.getAttribute("data-type");
      toggleCompare(name, type);
    }
    if (target.matches("[data-action='remove']")) {
      const name = target.getAttribute("data-name");
      const type = target.getAttribute("data-type");
      removeComponent(name, type);
    }
    if (target.matches("[data-table-sort]")) {
      const type = target.getAttribute("data-table-sort");
      const key = target.getAttribute("data-sort-key");
      if (!type || !key) return;
      const current = tableSortState[type] || { key: "rank", dir: "asc" };
      const dir = current.key === key && current.dir === "asc" ? "desc" : "asc";
      tableSortState[type] = { key, dir };
      localStorage.setItem(storageKeys.tableSort, JSON.stringify(tableSortState));
      renderAll();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("[data-action]")) return;
    const card = target.closest(".card");
    if (!card || !selectors.cardDetailOverlay || !selectors.cardDetailContent) return;
    selectors.cardDetailContent.innerHTML = card.innerHTML;
    selectors.cardDetailOverlay.classList.remove("hidden");
  });

  if (selectors.cardDetailClose) {
    selectors.cardDetailClose.addEventListener("click", () => {
      selectors.cardDetailOverlay?.classList.add("hidden");
    });
  }

  if (selectors.cardDetailOverlay) {
    selectors.cardDetailOverlay.addEventListener("click", (event) => {
      if (event.target === selectors.cardDetailOverlay) {
        selectors.cardDetailOverlay.classList.add("hidden");
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!selectors.userMenu || selectors.userMenu.classList.contains("hidden")) return;
    if (selectors.userBadge?.contains(event.target) || selectors.userMenu.contains(event.target)) return;
    selectors.userMenu.classList.add("hidden");
  });

  const backToTop = document.getElementById("backToTop");
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("visible", window.scrollY > 300);
    });
  }

  setActiveTab("cpu");
  loadData();
};

init();
