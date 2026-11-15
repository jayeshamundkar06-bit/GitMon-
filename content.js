// content.js – Optimized GitMon Chrome Extension (Pokémon contribution graph + legend)

// Central configuration for evolution levels (inclusive upper bounds)
const EVOLUTION_CONFIG = [
  { maxCount: 0, sprite: null }, // keep original empty square
  { maxCount: 1, sprite: 'charmander.png' },
  { maxCount: 3, sprite: 'charmeleon.png' },
  { maxCount: 6, sprite: 'charizard.png' },
  { maxCount: 9, sprite: 'mega-charizard-x.png' },
  { maxCount: Infinity, sprite: 'mega-charizard-y.png' },
];

// DEBUG flag – set to true for development diagnostics
const DEBUG = false;


// Selector for contribution day cells (HTML table cells)
const DAY_CELL_SELECTOR = 'td[id^="contribution-day-component-"]';
// Selector for the contribution graph container (stable element that holds the cells)
const GRAPH_CONTAINER_SELECTOR = '.js-contribution-graph';
const GRAPH_CONTAINER_SELECTORS = ['.js-contribution-graph', '.js-calendar-graph'];
function getGraphContainer() {
  for (const sel of GRAPH_CONTAINER_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// Global reference to the current graph container
let currentGraphContainer = null;
let renderScheduled = false; // debounce via requestAnimationFrame
let discoveryObserver = null;
let calendarObserver = null;
let rendering = false;
// Cache of date -> { count, sprite }
const contributionCache = new Map();

// Helper: Retrieve a setting from chrome.storage.local (with default fallback)
function getSetting(key, defaultValue, callback) {
  chrome.storage.local.get([key], (result) => {
    const value = result[key] !== undefined ? result[key] : defaultValue;
    console.log(`[GitMon DEBUG] getSetting: ${key} = ${value}`);
    callback(value);
  });
}

function isEnabled(callback) {
  getSetting('enabled', true, (enabled) => {
    console.log(`[GitMon DEBUG] Extension enabled state: ${enabled}`);
    callback(enabled);
  });
}

// Determine which sprite (if any) matches a contribution count
function spriteForCount(count) {
  for (const cfg of EVOLUTION_CONFIG) {
    if (count <= cfg.maxCount) return cfg.sprite; // may be null for empty
  }
  return null;
}

// Extract the exact contribution count from a cell's tooltip.
function getContributionCount(cell) {
  if (!cell) return 0;
  const tooltipId = cell.getAttribute('aria-labelledby');
  if (!tooltipId) {
    console.warn('[GitMon DEBUG] Cell missing aria-labelledby');
    return 0;
  }
  const tooltipEl = document.getElementById(tooltipId);
  if (!tooltipEl) {
    console.warn('[GitMon DEBUG] Tooltip element not found for id', tooltipId);
    return 0;
  }
  const text = (tooltipEl.textContent || '').trim();
  if (!text) {
    return 0;
  }

  // Handle explicit zero-contribution wording (singular or plural)
  if (/^no\s+contributions?\b/i.test(text)) {
    return 0;
  }

  // Handle numeric count (singular or plural): "1 contribution...", "5 contributions..."
  const match = text.match(/(\d+)\s+contributions?\b/i);
  if (match) {
    const count = parseInt(match[1], 10);
    return isNaN(count) ? 0 : count;
  }

  console.warn('[GitMon DEBUG] Failed to parse contribution count from tooltip:', text);
  return 0;
}

// Remove previously injected sprite overlays and clear cache.
function clearOverlays() {
  const removed = document.querySelectorAll('img.gitmon-overlay').length;
  document.querySelectorAll('img.gitmon-overlay').forEach((img) => img.remove());
  if (removed) console.log(`[GitMon DEBUG] clearOverlays: removed ${removed} overlays`);
  contributionCache.clear();
}

// Remove previously injected legend images (but keep the original legend structure).
function clearLegend() {
  const imgs = document.querySelectorAll(`${LEGEND_SELECTOR} img.gitmon-legend`);
  imgs.forEach((img) => img.remove());
  console.log('[GitMon DEBUG] Legend images cleared');
}

// Core rendering – schedule via requestAnimationFrame to batch work with timeout fallback for background tabs.
function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  const execute = () => {
    if (!renderScheduled) return;
    renderScheduled = false;
    renderAll();
  };
  requestAnimationFrame(execute);
  setTimeout(execute, 100);
}

function renderAll() {
  overlaySprites();
  renderLegend();
}

// Overlay sprites onto each contribution cell.
function overlaySprites() {
  if (rendering) {
    console.log('[GitMon DEBUG] overlaySprites already in progress – skipping');
    return;
  }
  rendering = true;
  console.log('[GitMon DEBUG] overlaySprites invoked');

  getSetting('originalColors', false, (useOriginal) => {
    if (useOriginal) {
      console.log('[GitMon DEBUG] Original Colors enabled – clearing overlays');
      clearOverlays();
      rendering = false;
      return;
    }

    const cells = document.querySelectorAll(DAY_CELL_SELECTOR);
    console.log(`[GitMon DEBUG] Contribution cells found: ${cells.length}`);
    if (cells.length === 0) {
      console.warn('[GitMon DEBUG] No contribution cells found – aborting overlay');
      rendering = false;
      return;
    }

    // Remove any old overlays before re‑rendering.
    clearOverlays();

    let activeCount = 0;
    let renderedCount = 0;
    cells.forEach((cell) => {
      const date = cell.dataset.date || cell.getAttribute('data-date');
      let cacheEntry = date ? contributionCache.get(date) : null;
      if (!cacheEntry) {
        const count = getContributionCount(cell);
        const sprite = spriteForCount(count);
        cacheEntry = { count, sprite };
        if (date) contributionCache.set(date, cacheEntry);
      }
      const { count, sprite } = cacheEntry;
      if (count > 0) activeCount++;
      if (!sprite) return; // 0 contributions – keep original cell

      const href = chrome.runtime.getURL(`assets/${sprite}`);
      const img = document.createElement('img');
      img.src = href;
      img.classList.add('gitmon-overlay');
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.style.pointerEvents = 'none';
      img.style.display = 'block';
      img.addEventListener('load', () => {
        console.log(`[GitMon DEBUG] Rendered ${sprite} for ${count} contributions on ${date}`);
      });
      img.addEventListener('error', () => {
        console.error(`[GitMon DEBUG] Missing asset ${sprite} at ${href}`);
      });
      cell.insertBefore(img, cell.firstChild);
      renderedCount++;
    });

    console.log(`[GitMon DEBUG] Active contribution cells (count>0): ${activeCount}`);
    console.log(`[GitMon DEBUG] Pokémon overlays rendered: ${renderedCount}`);
    rendering = false;
  });
}

// Render the Pokémon legend inside GitHub's contribution legend.
function renderLegend() {
  const container = getGraphContainer();
  if (!container) {
    console.warn('[GitMon DEBUG] Graph container not found for legend');
    return;
  }
  const legend = container.querySelector(LEGEND_SELECTOR);
  if (!legend) {
    console.warn('[GitMon DEBUG] Legend element not found');
    return;
  }

  // Preserve original texts – we only inject images.
  const items = legend.querySelectorAll('li');
  if (items.length !== 5) {
    console.warn('[GitMon DEBUG] Unexpected legend item count:', items.length);
  }

  // Mapping order corresponds to the EVOLUTION_CONFIG entries after the zero level.
  const legendConfigs = EVOLUTION_CONFIG.filter(c => c.maxCount > 0);

  items.forEach((li, index) => {
    // Clean previous image if any (idempotent)
    const existing = li.querySelector('img.gitmon-legend');
    if (existing) existing.remove();

    const cfg = legendConfigs[index];
    if (!cfg || !cfg.sprite) return; // safety

    const href = chrome.runtime.getURL(`assets/${cfg.sprite}`);
    const img = document.createElement('img');
    img.src = href;
    img.classList.add('gitmon-legend');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    img.title = `${cfg.sprite.replace('.png', '').replace(/-/g, ' ')} (≤ ${cfg.maxCount} contributions)`;
    li.insertBefore(img, li.firstChild);
  });
  console.log('[GitMon DEBUG] Legend rendered with Pokémon sprites');
}

// Start a MutationObserver scoped to the contribution graph container.
function startCalendarObserver(container) {
  if (calendarObserver) calendarObserver.disconnect();
  currentGraphContainer = container;
  calendarObserver = new MutationObserver((mutations) => {
    if (rendering) return;
    const needsRender = mutations.some((m) => {
      const added = Array.from(m.addedNodes).some((n) => n.matches && n.matches(DAY_CELL_SELECTOR));
      const removed = Array.from(m.removedNodes).some((n) => n.matches && n.matches(DAY_CELL_SELECTOR));
      const legendChanged = Array.from(m.addedNodes).some((n) => n.matches && n.matches(`${LEGEND_SELECTOR} li`)) ||
                           Array.from(m.removedNodes).some((n) => n.matches && n.matches(`${LEGEND_SELECTOR} li`));
      return added || removed || legendChanged;
    });
    if (needsRender) {
      console.log('[GitMon DEBUG] Calendar mutation detected – scheduling render');
      scheduleRender();
    }
  });
  calendarObserver.observe(container, { childList: true, subtree: true });
  console.log('[GitMon DEBUG] Calendar observer attached (enhanced)');
}

// Observe the whole document for contribution graph appearance and replacements (year switching)
function startDiscoveryObserver() {
  if (discoveryObserver) discoveryObserver.disconnect();
  discoveryObserver = new MutationObserver(() => {
    if (rendering) return;
    const graph = getGraphContainer();
    if (graph) {
      if (graph !== currentGraphContainer || !graph.querySelector('img.gitmon-overlay')) {
        currentGraphContainer = graph;
        scheduleRender();
        startCalendarObserver(graph);
      }
    }
  });
  discoveryObserver.observe(document.body, { childList: true, subtree: true });
  console.log('[GitMon DEBUG] Discovery observer active');
}

function init() {
  console.log('[GitMon DEBUG] init started');
  isEnabled((enabled) => {
    if (!enabled) {
      console.log('[GitMon DEBUG] Extension disabled – cleaning up');
      clearOverlays();
      clearLegend();
      if (discoveryObserver) discoveryObserver.disconnect();
      if (calendarObserver) calendarObserver.disconnect();
      return;
    }
    const graph = getGraphContainer();
    if (graph) {
      console.log('[GitMon DEBUG] Graph container already present');
      currentGraphContainer = graph;
      scheduleRender();
      startCalendarObserver(graph);
    } else {
      console.log('[GitMon DEBUG] Graph container not present – starting discovery observer');
    }
    startDiscoveryObserver();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
document.addEventListener("turbo:render", init);
document.addEventListener("turbo:load", init);


// Exported test helper (optional, can be used from console)
function testSpriteMapping() {
  console.log('--- GitMon Sprite Mapping Test ---');
  for (let i = 0; i <= 12; i++) {
    const sprite = spriteForCount(i);
    console.log(`${i} contribution(s) => ${sprite ? sprite : 'original'}`);
  }
  console.log('--- End of Test ---');
}

// Listen for live settings changes from popup
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      console.log('[GitMon DEBUG] Storage changed – re-initializing');
      init();
    }
  });
}
