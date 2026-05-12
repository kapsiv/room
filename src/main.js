import "./style.scss";

import gsap from "gsap";
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import steamVertexShader from "./shaders/steam/vertex.glsl?raw";
import steamFragmentShader from "./shaders/steam/fragment.glsl?raw";
import dataPipelineDiagramSvg from "./assets/data-pipeline-diagram.svg?raw";

import { OrbitControls } from './utils/OrbitControls.js';
import { createAnnotationFeature } from './features/annotationFeature.js';
import { createReflectivFeature } from './features/reflectivFeature.js';
import { createActivFeature } from './features/activFeature.js';
import { createSleepZsFeature } from './features/sleepZsFeature.js';
import { createModalManager } from './ui/modalManager.js';
import { createFabManager } from './ui/fabManager.js';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const LASTFM_USER = "kapsiv";
const LASTFM_API_KEY = "683650a829cee53959e8d505e8841726";
const LASTFM_ENDPOINT = "https://ws.audioscrobbler.com/2.0/";
const MOBILE_BREAKPOINT = 760;
const MOBILE_VIEWPORT_INSET = 12;
const MOBILE_LITE_LAUNCHER_IDS = ["reflectiv", "about", "logo", "faq"];
const DATA_PIPELINE_HOVER_TARGET_IDS = [
  "actIV",
  "github_repo",
  "puregym",
  "scrobbler",
  "music_player",
  "blob_storage",
  "health_app",
  "website",
  "computer",
  "phone",
  "last.fm",
  "smartwatch",
];
const DATA_PIPELINE_LINKS = {
  blob_storage: "https://vercel.com/docs/vercel-blob",
  puregym: "https://github.com/2t6h/puregym-attendance",
  scrobbler: "https://kawaiidango.github.io/pano-scrobbler/",
  health_app: "https://consumer.huawei.com/uk/mobileservices/health/",
  music_player: "https://getmusicbee.com",
  "last.fm": "https://www.last.fm/user/kapsiv",
  github_repo: "https://github.com/kapsiv/room",
};
function parseDataPipelineTags(value) {
  return (value || "")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

function initDataPipelineKeyHighlights(svg) {
  const highlightableElements = [...svg.querySelectorAll("[data-key-tags]")];
  const triggerElements = [...svg.querySelectorAll("[data-key-trigger]")];

  if (!highlightableElements.length || !triggerElements.length) return;

  highlightableElements.forEach((element) => {
    element.classList.add("data-pipeline-highlightable");
  });

  const clearHighlight = () => {
    svg.classList.remove("data-pipeline-has-highlight");
    highlightableElements.forEach((element) => {
      element.classList.remove("data-pipeline-highlighted", "data-pipeline-dimmed", "data-pipeline-key-active");
    });
  };

  const applyHighlight = (triggerId) => {
    const activeTriggerElements = triggerElements.filter(
      (element) => element.getAttribute("data-key-trigger") === triggerId,
    );
    const activeTags = new Set(
      activeTriggerElements.flatMap((element) =>
        parseDataPipelineTags(element.getAttribute("data-key-tags")),
      ),
    );

    if (!activeTags.size) {
      clearHighlight();
      return;
    }

    svg.classList.add("data-pipeline-has-highlight");

    highlightableElements.forEach((element) => {
      const tags = parseDataPipelineTags(element.getAttribute("data-key-tags"));
      const isPersistent = tags.includes("all");
      const isHighlighted = !isPersistent && tags.some((tag) => activeTags.has(tag));

      element.classList.toggle("data-pipeline-highlighted", isHighlighted);
      element.classList.toggle("data-pipeline-dimmed", !isPersistent && !isHighlighted);
      element.classList.toggle("data-pipeline-key-active", activeTriggerElements.includes(element));
    });
  };

  const maybeClearHighlight = (event, triggerId) => {
    const nextTriggerId =
      event.relatedTarget?.closest?.("[data-key-trigger]")?.getAttribute("data-key-trigger") ??
      event.relatedTarget?.getAttribute?.("data-key-trigger");

    if (nextTriggerId === triggerId) return;
    clearHighlight();
  };

  triggerElements.forEach((triggerElement) => {
    const triggerId = triggerElement.getAttribute("data-key-trigger");
    if (!triggerId) return;

    triggerElement.classList.add("data-pipeline-key-target");
    if (triggerElement.matches("text")) {
      triggerElement.setAttribute("tabindex", "0");
    }

    triggerElement.addEventListener("mouseenter", () => applyHighlight(triggerId));
    triggerElement.addEventListener("focus", () => applyHighlight(triggerId));
    triggerElement.addEventListener("mouseleave", (event) => maybeClearHighlight(event, triggerId));
    triggerElement.addEventListener("blur", (event) => maybeClearHighlight(event, triggerId));
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

if (import.meta.env.PROD) {
  import("@vercel/analytics").then(({ inject }) => {
    inject({ mode: "production" });
  });
  import("@vercel/speed-insights").then(({ injectSpeedInsights }) => {
    injectSpeedInsights();
  });
}

let isLoading = true;
let selectedMobileExperienceMode = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches ? null : "full";
let mobileLiteModeActive = false;
let roomModelLoadStarted = false;
let roomModelSceneReady = false;
let managedAssetsReady = false;
let loadingRevealQueued = false;
const manager = new THREE.LoadingManager();

const loadingScreen = document.querySelector(".loading-screen");
const fabManager = createFabManager({
  gsap,
  loadingScreen,
  getModals: () => modals,
  getShowModal: () => showModal,
  getNowPlayingTrack: fetchNowPlayingTrack,
  onMobileModeSelect: (mode) => {
    selectedMobileExperienceMode = mode;
    if (mode === "lite") {
      activateMobileLiteMode();
      return;
    }
    roomModelSceneReady = false;
    managedAssetsReady = false;
    loadingRevealQueued = false;
    fabManager.markAssetsPending();
    loadRoomModel();
  },
  onLoadingComplete: () => {
    isLoading = false;
    if (selectedMobileExperienceMode === "lite") {
      renderMobileLiteShell();
      return;
    }
    playIntroAnimation();
  },
});

fabManager.init();

function maybeRevealAfterSceneReady() {
  if (loadingRevealQueued) return;
  if (!roomModelSceneReady || !managedAssetsReady) return;

  loadingRevealQueued = true;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      fabManager.markAssetsLoaded();
    });
  });
}

manager.onLoad = () => {
  managedAssetsReady = true;
  maybeRevealAfterSceneReady();
};

const canvas = document.querySelector("#experience-canvas")
const sizes ={
  width: window.innerWidth,
  height: window.innerHeight
}

const modals = {
  info: document.querySelector(".modal.info"),
  about: document.querySelector(".modal.about"),
  blu: document.querySelector(".modal.blu"),
  guitar: document.querySelector(".modal.guitar"),
  reflectiv: document.querySelector(".modal.reflectiv"),
  libraryLookup: document.querySelector(".modal.library-lookup"),
  nowplaying: document.querySelector(".modal.nowplaying"),
  archive: document.querySelector(".modal.archive"),
  gallery: document.querySelector(".modal.gallery"),
  projects: document.querySelector(".modal.projects"),
  designPhilosophy: document.querySelector(".modal.design-philosophy"),
  dataPipelines: document.querySelector(".modal.data-pipelines"),
  utilities: document.querySelector(".modal.utilities"),
  vinaflow: document.querySelector(".modal.vinaflow"),
  links: document.querySelector(".modal.links"),
  food: document.querySelector(".modal.food"),
  marimo: document.querySelector(".modal.marimo"),
  inventory: document.querySelector(".modal.inventory"),
  genreDistribution: document.querySelector(".modal.genre-distribution"),
  albumsByYear: document.querySelector(".modal.albums-by-year"),
  cv: document.querySelector(".modal.cv"),
  faq: document.querySelector(".modal.faq"),
  logo: document.querySelector(".modal.logo"),
  calendar: document.querySelector(".modal.calendar"),
  modelling: document.querySelector(".modal.modelling"),
  activ: document.querySelector(".modal.activ"),
  inactiv: document.querySelector(".modal.inactiv"),
  book: document.querySelector(".modal.book"),
};

function initDataPipelinesDiagram() {
  const mount = modals.dataPipelines?.querySelector("[data-inline-svg='data-pipeline']");
  if (!mount || mount.dataset.svgMounted === "true") return;

  const cleanedSvg = dataPipelineDiagramSvg.replace(/<\?xml[\s\S]*?\?>\s*/u, "").trim();
  const parsedSvg = new DOMParser().parseFromString(cleanedSvg, "image/svg+xml").documentElement;

  if (!parsedSvg || parsedSvg.nodeName.toLowerCase() !== "svg") return;

  const svg = document.importNode(parsedSvg, true);
  svg.classList.add("data-pipeline-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    "Animated data pipeline diagram showing data movement between sources, caches, storage, and kapsiv.com.",
  );
  svg.setAttribute("focusable", "false");

  DATA_PIPELINE_HOVER_TARGET_IDS.forEach((id) => {
    const target = svg.querySelector(`#${CSS.escape(id)}`);
    if (!target) return;
    target.classList.add("data-pipeline-hover-target");

    const url = DATA_PIPELINE_LINKS[id];
    if (!url) return;

    target.setAttribute("role", "link");
    target.setAttribute("tabindex", "0");
    target.setAttribute("aria-label", `Open ${id.replaceAll("_", " ")} in a new tab`);

    const openLink = () => {
      window.open(url, "_blank", "noopener,noreferrer");
    };

    target.addEventListener("click", (e) => {
      e.stopPropagation();
      openLink();
    });
    target.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      e.stopPropagation();
      openLink();
    });
  });

  initDataPipelineKeyHighlights(svg);

  mount.replaceChildren(svg);
  mount.dataset.svgMounted = "true";
}

function hasVisibleModal() {
  return Object.values(modals).some((modal) => modal && modal.style.display === "block");
}

function isMobileLayout() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

function renderMobileLiteShell() {
  if (!mobileLiteModeActive) return;
  const appRoot = document.querySelector("#app");
  if (!appRoot || appRoot.dataset.mobileLiteShell === "true") return;

  appRoot.dataset.mobileLiteShell = "true";
  appRoot.innerHTML = `
    <div class="mobile-lite-shell">
      <div class="mobile-lite-watermark" aria-hidden="true">
        <img src="/icons/logo.svg" alt="" />
      </div>
      <main class="mobile-lite-main">
        <section class="mobile-lite-hero">
          <p class="mobile-lite-eyebrow">mobile lite mode</p>
          <h1>welcome to kapsiv.</h1>
          <p class="mobile-lite-copy">i originally designed this website for desktop (because phone = bad) so this is my compromise...</p>
          <p class="mobile-lite-copy">open the inventory for a list of all applications.</p>
        </section>
        <section class="mobile-lite-launcher">
          <div class="mobile-lite-launcher-grid">
            ${MOBILE_LITE_LAUNCHER_IDS.map((id) => {
              const modal = modals[id];
              const title = modal?.querySelector(".modal-window-title")?.textContent?.trim() || id;
              const icon = modal?.dataset.modalIcon || "";
              return `
                <button class="mobile-lite-card" type="button" data-lite-modal="${id}">
                  <span class="mobile-lite-card-icon" style="--mobile-lite-icon: url('${icon}')"></span>
                  <span class="mobile-lite-card-title">${title}</span>
                </button>
              `;
            }).join("")}
          </div>
        </section>
      </main>
    </div>
  `;

  appRoot.querySelectorAll("[data-lite-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const modalKey = button.getAttribute("data-lite-modal") || "";
      const modal = modals[modalKey];
      if (!modal || !showModal) return;
      showModal(modal);
    });
  });
}

function activateMobileLiteMode() {
  if (mobileLiteModeActive) return;
  mobileLiteModeActive = true;
  document.body.classList.add("mobile-lite-mode");
  controls && (controls.enabled = false);
  renderMobileLiteShell();
}

function resetTooltipViewportPosition(tooltipContent) {
  if (!tooltipContent) return;
  tooltipContent.style.removeProperty("--tooltip-shift-x");
  tooltipContent.style.removeProperty("--tooltip-shift-y");
}

function clampTooltipToViewport(tooltip) {
  const tooltipContent = tooltip?.querySelector(".ui-tooltip-content");
  if (!tooltipContent) return;

  if (!isMobileLayout()) {
    resetTooltipViewportPosition(tooltipContent);
    return;
  }

  resetTooltipViewportPosition(tooltipContent);

  const rect = tooltipContent.getBoundingClientRect();
  const minX = MOBILE_VIEWPORT_INSET;
  const maxX = window.innerWidth - MOBILE_VIEWPORT_INSET;
  const minY = MOBILE_VIEWPORT_INSET;
  const maxY = window.innerHeight - MOBILE_VIEWPORT_INSET;

  let shiftX = 0;
  let shiftY = 0;

  if (rect.left < minX) {
    shiftX += minX - rect.left;
  }

  if (rect.right + shiftX > maxX) {
    shiftX += maxX - (rect.right + shiftX);
  }

  if (rect.top < minY) {
    shiftY += minY - rect.top;
  }

  if (rect.bottom + shiftY > maxY) {
    shiftY += maxY - (rect.bottom + shiftY);
  }

  tooltipContent.style.setProperty("--tooltip-shift-x", `${Math.round(shiftX)}px`);
  tooltipContent.style.setProperty("--tooltip-shift-y", `${Math.round(shiftY)}px`);
}

function scheduleTooltipClamp(tooltip) {
  window.requestAnimationFrame(() => {
    clampTooltipToViewport(tooltip);
  });
}

function updateTooltipViewportBounds() {
  document.querySelectorAll(".ui-tooltip").forEach((tooltip) => {
    clampTooltipToViewport(tooltip);
  });
}

function setupTooltipBounds() {
  document.querySelectorAll(".ui-tooltip").forEach((tooltip) => {
    if (tooltip.dataset.viewportBound === "true") return;
    tooltip.dataset.viewportBound = "true";

    const schedule = () => scheduleTooltipClamp(tooltip);
    tooltip.addEventListener("focusin", schedule);
    tooltip.addEventListener("mouseenter", schedule);
    tooltip.addEventListener("click", schedule);
    tooltip.addEventListener("touchend", schedule, { passive: true });
  });

  document.querySelectorAll(".modal-window-content").forEach((container) => {
    if (container.dataset.tooltipScrollBound === "true") return;
    container.dataset.tooltipScrollBound = "true";
    container.addEventListener("scroll", updateTooltipViewportBounds, { passive: true });
  });

  updateTooltipViewportBounds();
}

let showModal;
let hideModal;
let placeModalAt;
let centerModal;
let controls;
let annotationFeature = null;

const reflectivFeature = createReflectivFeature({
  gsap,
  modals,
  getShowModal: () => showModal,
});
const activFeature = createActivFeature();

const {
  initAboutModal,
  initNowPlayingModal,
  initReflectivModal,
  setReflectivTab,
} = reflectivFeature;
const { initActivModal } = activFeature;
const logoModalTimelines = new WeakMap();

const modalManager = createModalManager({
  modals,
  gsap,
  mobileBreakpoint: MOBILE_BREAKPOINT,
  mobileViewportInset: MOBILE_VIEWPORT_INSET,
  onBeforeShow: () => {
    if (currentHoveredObject) {
      playHoverAnimation(currentHoveredObject, false);
      currentHoveredObject = null;
    }
    document.body.style.cursor = "default";
    currentIntersects = [];
  },
  onShowAbout: (modal, { showModal }) => {
    initAboutModal(modal);
    const pill = modal.querySelector(".now-playing-pill");
    if (pill && modal.dataset.aboutBound !== "true") {
      modal.dataset.aboutBound = "true";
      pill.style.cursor = "pointer";
      pill.addEventListener("click", () => {
        showModal(modals.nowplaying);
      });
    }
  },
  onShowNowPlaying: (modal) => {
    Promise.resolve(initNowPlayingModal(modal)).finally(() => {
      if (!isMobileLayout() || typeof centerModal !== "function" || modal?.style.display !== "block") return;
      requestAnimationFrame(() => {
        if (modal?.style.display !== "block") return;
        centerModal(modal);
        requestAnimationFrame(() => {
          if (modal?.style.display !== "block") return;
          centerModal(modal);
        });
      });
    });
  },
  onShowReflectiv: (modal) => {
    initReflectivModal(modal);
  },
  onShowActIV: (modal) => {
    initActivModal(modal);
  },
  onShowLogo: (modal) => {
    playLogoModalAnimation(modal);
  },
  onShowModelling: () => {
    modellingViewer?.play();
  },
});

modalManager.init();
({ showModal, hideModal, placeModalAt, centerModal } = modalManager);
initDataPipelinesDiagram();
setupTooltipBounds();

document.querySelectorAll("[data-modal-target]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const modalKey = link.getAttribute("data-modal-target") || "";
    if (isMobileLayout() && modalKey === "genreDistribution") return;
    const modal = modals[modalKey];
    if (!modal) return;
    showModal(modal);
  });
});

function getModalInventoryLabel(modal) {
  const titleId = modal?.getAttribute("aria-labelledby");
  const titleEl = titleId ? document.getElementById(titleId) : modal?.querySelector(".modal-window-title");
  if (!titleEl) return "";
  const clone = titleEl.cloneNode(true);
  clone.querySelectorAll(".ui-tooltip, .modal-window-title-icon").forEach((el) => el.remove());
  return clone.textContent.replace(/\s+/g, " ").trim();
}

const inventoryState = {
  organized: false,
};

const INVENTORY_CATEGORY_DEFS = [
  { key: "K", label: "knowledge", items: ["book", "info", "logo", "libraryLookup", "faq"] },
  { key: "A", label: "art", items: ["guitar", "modelling", "projects", "designPhilosophy"] },
  { key: "P", label: "profession", items: ["cv", "archive", "dataPipelines", "utilities", "vinaflow"] },
  { key: "S", label: "social", items: ["blu", "calendar", "gallery", "links"] },
  { key: "I", label: "introspection", items: ["about", "nowplaying", "reflectiv"] },
  { key: "V", label: "vitality", items: ["activ", "inactiv", "food", "marimo"] },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInventoryItemMarkup(item) {
  return `
    <div class="inventory-item">
      <button type="button" class="inventory-item-button" data-inventory-modal="${escapeHtml(item.key)}" aria-label="Open ${escapeHtml(item.label)}">
        <span class="inventory-item-squircle">
          <span class="inventory-item-icon" style="--inventory-icon: url('${item.icon}')"></span>
        </span>
      </button>
      <span class="inventory-item-label">${escapeHtml(item.label)}</span>
    </div>
  `;
}

function initInventoryModal() {
  const grid = document.querySelector("#inventoryGrid");
  const toggle = document.querySelector("#inventoryOrganizeToggle");
  if (!grid || !toggle) return;

  const items = Object.entries(modals)
    .filter(([key, modal]) => {
      if (!modal || key === "inventory") return false;
      if (isMobileLayout() && key === "genreDistribution") return false;
      return true;
    })
    .map(([key, modal]) => ({
      key,
      modal,
      label: getModalInventoryLabel(modal),
      icon: modal.dataset.modalIcon || "",
    }))
    .filter((item) => item.icon && item.label);

  const itemsByKey = new Map(items.map((item) => [item.key, item]));

  const bindInventoryButtons = () => {
    grid.querySelectorAll("[data-inventory-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        const modalKey = button.getAttribute("data-inventory-modal") || "";
        const modal = modals[modalKey];
        if (!modal) return;
        showModal(modal);
      });
    });
  };

  const renderInventory = () => {
    toggle.textContent = `organise: ${inventoryState.organized ? "on" : "off"}`;
    grid.classList.toggle("inventory-grid--organized", inventoryState.organized);

    if (!inventoryState.organized) {
      grid.innerHTML = items.map(buildInventoryItemMarkup).join("");
      bindInventoryButtons();
      return;
    }

    grid.innerHTML = INVENTORY_CATEGORY_DEFS
      .map((category) => {
        const categoryItems = category.items
          .map((key) => itemsByKey.get(key))
          .filter(Boolean);

        const itemMarkup = categoryItems.length
          ? categoryItems.map(buildInventoryItemMarkup).join("")
          : '<div class="inventory-empty">coming soon</div>';

        return `
          <section class="inventory-category">
            <h3 class="inventory-category-title">
              <span class="inventory-category-letter">${escapeHtml(category.key)}</span>
              <span class="inventory-category-name">${escapeHtml(category.label)}</span>
            </h3>
            <div class="inventory-category-items">${itemMarkup}</div>
          </section>
        `;
      })
      .join("");

    bindInventoryButtons();
  };

  if (toggle.dataset.bound !== "true") {
    toggle.dataset.bound = "true";
    toggle.addEventListener("click", () => {
      inventoryState.organized = !inventoryState.organized;
      renderInventory();
    });
  }

  renderInventory();
}

initInventoryModal();

function initMarimoModal() {
  const modal = modals.marimo;
  const water = modal?.querySelector(".marimo-tank-water");
  const ball = modal?.querySelector(".marimo-ball");
  const speechBubble = modal?.querySelector(".marimo-speech");
  const speechBubbleText = speechBubble?.querySelector(".marimo-speech-text");

  if (!modal || !water || !ball || !speechBubble || !speechBubbleText || ball.dataset.interactive === "true") return;

  ball.dataset.interactive = "true";

  const releaseMessages = [
    "why am i still alive",
    "i can't swim",
    "release me",
    "why does this room only have 2 walls lol",
    "wish i had ears so i could hear that music behind me",
    "you'll float too",
    "don't poke the glass",
    "...",
    "help i am under the water",
    "let me out",
    "the cats gonna eat me",
  ];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    initialized: false,
    x: 0,
    y: 0,
    scale: 1,
    lastMessageIndex: -1,
    hovering: false,
    dragging: false,
    pointerId: null,
    pointerOffsetX: 0,
    pointerOffsetY: 0,
    settleTween: null,
    bubbleTween: null,
  };

  const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

  function getMetrics() {
    const waterRect = water.getBoundingClientRect();
    if (!waterRect.width || !waterRect.height) return null;

    const ballSize = ball.offsetWidth || Math.min(waterRect.width, waterRect.height) * 0.24;
    const radius = ballSize / 2;
    const groundHeight = waterRect.height * 0.13;
    const minX = radius + 4;
    const maxX = Math.max(minX, waterRect.width - radius - 4);
    const minY = radius + 8;
    const maxY = Math.max(minY, waterRect.height - groundHeight - radius - 6);
    const settleY = clampValue(waterRect.height * 0.52, minY, maxY);

    return {
      waterRect,
      minX,
      maxX,
      minY,
      maxY,
      settleY,
    };
  }

  function syncBallState() {
    const metrics = getMetrics();
    if (!metrics) return null;

    if (!state.initialized) {
      state.x = metrics.waterRect.width / 2;
      state.y = metrics.settleY;
      state.scale = 1;
      state.initialized = true;
      return metrics;
    }

    state.x = clampValue(state.x, metrics.minX, metrics.maxX);

    if (!state.dragging && !state.settleTween) {
      state.y = metrics.settleY;
    } else {
      state.y = clampValue(state.y, metrics.minY, metrics.maxY);
    }

    return metrics;
  }

  function applyBallTransform(timestamp) {
    if (!state.initialized) return;

    const bobOffset =
      prefersReducedMotion.matches || state.dragging
        ? 0
        : Math.sin(timestamp * 0.003) * 7;
    const targetScale = state.dragging ? 1.14 : state.hovering ? 1.1 : 1;
    const easeFactor = state.dragging ? 0.28 : 0.16;
    state.scale += (targetScale - state.scale) * easeFactor;

    ball.style.left = `${state.x}px`;
    ball.style.top = `${state.y}px`;
    ball.style.transform = `translate(-50%, -50%) translateY(${bobOffset}px) scale(${state.scale})`;
  }

  function applySpeechBubblePosition() {
    if (!state.initialized) return;

    const bubbleWidth = speechBubble.offsetWidth || 160;
    const bubbleHeight = speechBubble.offsetHeight || 44;
    const waterWidth = water.offsetWidth || 0;
    const waterHeight = water.offsetHeight || 0;
    const ballWidth = ball.offsetWidth || 0;

    const desiredLeft = state.x + ballWidth * 0.46;
    const minLeft = bubbleWidth / 2 + 8;
    const maxLeft = Math.max(minLeft, waterWidth - bubbleWidth / 2 - 8);
    const bubbleLeft = clampValue(desiredLeft, minLeft, maxLeft);

    const desiredTop = state.y - ballWidth * 0.42;
    const minTop = bubbleHeight + 10;
    const maxTop = Math.max(minTop, waterHeight - 24);
    const bubbleTop = clampValue(desiredTop, minTop, maxTop);

    speechBubble.style.left = `${bubbleLeft}px`;
    speechBubble.style.top = `${bubbleTop}px`;
  }

  function showReleaseMessage() {
    let nextIndex = Math.floor(Math.random() * releaseMessages.length);
    if (releaseMessages.length > 1 && nextIndex === state.lastMessageIndex) {
      nextIndex = (nextIndex + 1) % releaseMessages.length;
    }

    state.lastMessageIndex = nextIndex;
    speechBubbleText.textContent = releaseMessages[nextIndex];
    applySpeechBubblePosition();

    if (state.bubbleTween) {
      state.bubbleTween.kill();
      state.bubbleTween = null;
    }

    gsap.set(speechBubble, {
      opacity: 0,
      y: 8,
    });

    state.bubbleTween = gsap.timeline({
      onComplete: () => {
        state.bubbleTween = null;
      },
    });

    state.bubbleTween
      .to(speechBubble, {
        opacity: 1,
        y: 0,
        duration: 0.18,
        ease: "power2.out",
      })
      .to(
        speechBubble,
        {
          opacity: 0,
          y: -4,
          duration: 0.2,
          ease: "power2.in",
        },
        "+=2.35",
      );
  }

  function releaseBall() {
    const metrics = getMetrics();
    if (!metrics) return;

    state.x = clampValue(state.x, metrics.minX, metrics.maxX);

    if (state.settleTween) {
      state.settleTween.kill();
    }

    state.settleTween = gsap.to(state, {
      y: metrics.settleY,
      duration: 0.55,
      ease: "sine.out",
      overwrite: true,
      onComplete: () => {
        state.settleTween = null;
      },
    });
  }

  function endDrag(pointerId) {
    if (state.pointerId !== pointerId) return;

    if (ball.hasPointerCapture(pointerId)) {
      ball.releasePointerCapture(pointerId);
    }

    state.pointerId = null;
    state.dragging = false;
    ball.classList.remove("is-dragging");
    state.hovering = ball.matches(":hover");
    showReleaseMessage();
    releaseBall();
  }

  ball.addEventListener("pointerenter", () => {
    state.hovering = true;
  });

  ball.addEventListener("pointerleave", () => {
    if (state.dragging) return;
    state.hovering = false;
  });

  ball.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const metrics = syncBallState();
    if (!metrics) return;

    e.preventDefault();
    e.stopPropagation();

    if (state.settleTween) {
      state.settleTween.kill();
      state.settleTween = null;
    }

    state.dragging = true;
    state.hovering = true;
    state.pointerId = e.pointerId;
    ball.classList.add("is-dragging");

    const localX = e.clientX - metrics.waterRect.left;
    const localY = e.clientY - metrics.waterRect.top;
    state.pointerOffsetX = state.x - localX;
    state.pointerOffsetY = state.y - localY;

    ball.setPointerCapture(e.pointerId);
  });

  ball.addEventListener("pointermove", (e) => {
    if (state.pointerId !== e.pointerId || !state.dragging) return;

    const metrics = getMetrics();
    if (!metrics) return;

    e.preventDefault();

    const localX = e.clientX - metrics.waterRect.left;
    const localY = e.clientY - metrics.waterRect.top;

    state.x = clampValue(localX + state.pointerOffsetX, metrics.minX, metrics.maxX);
    state.y = clampValue(localY + state.pointerOffsetY, metrics.minY, metrics.maxY);
  });

  ball.addEventListener("pointerup", (e) => {
    endDrag(e.pointerId);
  });

  ball.addEventListener("pointercancel", (e) => {
    endDrag(e.pointerId);
  });

  window.addEventListener("resize", () => {
    syncBallState();
  });

  const animateMarimoBall = (timestamp) => {
    if (modal.style.display === "block") {
      syncBallState();
    }

    applyBallTransform(timestamp);
    applySpeechBubblePosition();
    requestAnimationFrame(animateMarimoBall);
  };

  requestAnimationFrame(animateMarimoBall);
}

initMarimoModal();

function playLogoModalAnimation(modal) {
  if (!modal) return;

  const kaTarget = modal.querySelector("#logo-modal-ka");
  const piTarget = modal.querySelector("#logo-modal-pi");
  const laTarget = modal.querySelector("#logo-modal-la");
  const nTarget = modal.querySelector("#logo-modal-n");
  const kaPaths = Array.from(modal.querySelectorAll("#logo-modal-ka path"));
  const piPaths = Array.from(modal.querySelectorAll("#logo-modal-pi path"));
  const laPaths = Array.from(modal.querySelectorAll("#logo-modal-la"));
  const nPaths = Array.from(modal.querySelectorAll("#logo-modal-n path"));
  const allLogoPaths = [...kaPaths, ...piPaths, ...laPaths, ...nPaths];
  const syllableEls = Array.from(modal.querySelectorAll(".logo-modal-syllables [data-syllable]"));
  const introCopyEl = modal.querySelector(".logo-modal-copy[data-copy-text]");
  const strokeControlEl = modal.querySelector(".logo-stroke-control");
  const maskToggleEl = modal.querySelector("#logoMaskToggle");
  const strokeSliderEl = modal.querySelector("#logoStrokeWidth");
  const maskedGroups = Array.from(modal.querySelectorAll("svg > g[mask]"));
  const orderedGroups = [kaPaths, piPaths, laPaths, nPaths].filter((paths) => paths.length > 0);

  if (!orderedGroups.length) return;

  const priorTimeline = logoModalTimelines.get(modal);
  if (priorTimeline) {
    priorTimeline.kill();
  }

  orderedGroups.flat().forEach((pathEl) => {
    const length = pathEl.getTotalLength();
    const isLaPath = pathEl.id === "logo-modal-la";
    pathEl.style.strokeDasharray = isLaPath ? `${length} ${length}` : `${length}`;
    pathEl.style.strokeDashoffset = isLaPath ? `${-length}` : `${length}`;
  });

  const resetLetterPaths = (paths) => {
    paths.forEach((pathEl) => {
      const length = pathEl.getTotalLength();
      const isLaPath = pathEl.id === "logo-modal-la";
      pathEl.style.strokeDasharray = isLaPath ? `${length} ${length}` : `${length}`;
      pathEl.style.strokeDashoffset = isLaPath ? `${-length}` : `${length}`;
    });
  };

  const replayLetter = (paths, options = {}) => {
    if (!paths.length) return;
    gsap.killTweensOf(paths);
    resetLetterPaths(paths);
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: options.duration ?? 1.05,
      ease: "sine.inOut",
      stagger: options.stagger ?? 0,
      overwrite: true,
    });
  };

  const bindReplayTarget = (target, paths, options = {}) => {
    if (!target || target.dataset.replayBound === "true") return;
    target.dataset.replayBound = "true";
    target.setAttribute("role", "button");
    target.setAttribute("tabindex", "0");
    target.setAttribute("aria-label", options.label || "Replay letter animation");

    const triggerReplay = () => replayLetter(paths, options);

    target.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerReplay();
    });
    target.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      triggerReplay();
    });
  };

  bindReplayTarget(kaTarget, kaPaths, { duration: 1.05, stagger: 0.12, label: "Replay ka animation" });
  bindReplayTarget(piTarget, piPaths, { duration: 1.05, stagger: 0.12, label: "Replay pi animation" });
  bindReplayTarget(laTarget, laPaths, { duration: 1.12, label: "Replay la animation" });
  bindReplayTarget(nTarget, nPaths, { duration: 1.05, stagger: 0.12, label: "Replay n animation" });

  syllableEls.forEach((el) => {
    el.textContent = "";
    el.classList.remove("is-typing");
  });

  if (introCopyEl) {
    introCopyEl.textContent = "";
    introCopyEl.classList.remove("is-typing");
  }

  const defaultStrokeWidth = Number(strokeSliderEl?.defaultValue || strokeSliderEl?.value || 300);
  const applyStrokeWidth = (value) => {
    allLogoPaths.forEach((pathEl) => {
      pathEl.style.strokeWidth = `${value}px`;
    });
  };

  const applyMaskState = (maskEnabled) => {
    maskedGroups.forEach((groupEl) => {
      const originalMask = groupEl.dataset.originalMask || groupEl.getAttribute("mask") || "";
      if (!groupEl.dataset.originalMask && originalMask) {
        groupEl.dataset.originalMask = originalMask;
      }
      if (maskEnabled) {
        if (groupEl.dataset.originalMask) {
          groupEl.setAttribute("mask", groupEl.dataset.originalMask);
        }
      } else {
        groupEl.removeAttribute("mask");
      }
    });

    if (strokeSliderEl) {
      strokeSliderEl.disabled = maskEnabled;
    }
  };

  if (strokeSliderEl && strokeSliderEl.dataset.bound !== "true") {
    strokeSliderEl.dataset.bound = "true";
    strokeSliderEl.addEventListener("input", () => {
      applyStrokeWidth(strokeSliderEl.value);
    });
  }

  if (maskToggleEl && maskToggleEl.dataset.bound !== "true") {
    maskToggleEl.dataset.bound = "true";
    maskToggleEl.addEventListener("change", () => {
      if (maskToggleEl.checked && strokeSliderEl) {
        strokeSliderEl.value = String(defaultStrokeWidth);
        applyStrokeWidth(defaultStrokeWidth);
      }
      applyMaskState(maskToggleEl.checked);
    });
  }

  if (strokeSliderEl) {
    strokeSliderEl.value = String(defaultStrokeWidth);
  }
  applyStrokeWidth(defaultStrokeWidth);

  if (maskToggleEl) {
    maskToggleEl.checked = true;
  }
  applyMaskState(true);

  const getRenderedTypingText = (text, isHtml = false) => {
    if (!isHtml) return text;
    const temp = document.createElement("div");
    temp.innerHTML = text;
    return temp.textContent || temp.innerText || "";
  };

  const addTypingTween = (tl, el, text, position, options = {}) => {
    if (!el || !text) return;

    const isHtml = options.isHtml === true;
    const renderedText = getRenderedTypingText(text, isHtml);
    const state = { count: 0 };
    const duration = options.duration ?? Math.max(0.48, renderedText.length * 0.24);
    const keepCursor = options.keepCursor === true;

    tl.call(() => {
      el.textContent = "";
      el.classList.add("is-typing");
    }, null, position);

    tl.to(state, {
      count: renderedText.length,
      duration,
      ease: "none",
      snap: { count: 1 },
      onUpdate: () => {
        el.textContent = renderedText.slice(0, state.count);
      },
      onComplete: () => {
        if (isHtml) {
          el.innerHTML = text;
        } else {
          el.textContent = text;
        }
        if (!keepCursor) {
          el.classList.remove("is-typing");
        }
      },
    }, position);
  };

  const timeline = gsap.timeline();
  timeline
    .addLabel("kaStart")
    .to(kaPaths, {
      strokeDashoffset: 0,
      duration: 1.05,
      ease: "sine.inOut",
      stagger: 0.12,
    }, "kaStart")
    .addLabel("piStart", "-=0.12")
    .to(piPaths, {
      strokeDashoffset: 0,
      duration: 1.05,
      ease: "sine.inOut",
      stagger: 0.12,
    }, "piStart")
    .addLabel("laStart", "-=0.84")
    .to(laPaths, {
      strokeDashoffset: 0,
      duration: 1.12,
      ease: "sine.inOut",
    }, "laStart")
    .addLabel("nStart", "-=0.82")
    .to(nPaths, {
      strokeDashoffset: 0,
      duration: 1.05,
      ease: "sine.inOut",
      stagger: 0.12,
    }, "nStart");

  addTypingTween(timeline, syllableEls[0], syllableEls[0]?.dataset.syllable || "", "kaStart");
  addTypingTween(timeline, syllableEls[1], syllableEls[1]?.dataset.syllable || "", "piStart");
  addTypingTween(timeline, syllableEls[2], syllableEls[2]?.dataset.syllable || "", "laStart");
  addTypingTween(timeline, syllableEls[3], syllableEls[3]?.dataset.syllable || "", "nStart");
  addTypingTween(
    timeline,
    introCopyEl,
    introCopyEl?.dataset.copyText || "",
    "nStart+=0.9",
    {
      duration: Math.max(1.9, getRenderedTypingText(introCopyEl?.dataset.copyText || "", true).length * 0.038),
      keepCursor: true,
      isHtml: true,
    }
  );

  logoModalTimelines.set(modal, timeline);
}

function initGuitarModal(modal) {
  if (!modal || modal.dataset.guitarBound === "true") return;
  modal.dataset.guitarBound = "true";

  const tabs = modal.querySelectorAll(".modal-tab[data-guitar-tab]");
  const panels = modal.querySelectorAll(".guitar-panel[data-guitar-panel]");

  if (!tabs.length || !panels.length) return;

  const setGuitarTab = (tabName) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.guitarTab === tabName;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.guitarPanel === tabName;
      panel.classList.toggle("is-active", isActive);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.guitarTab;
      if (!tabName) return;
      setGuitarTab(tabName);
    });
  });
}

initGuitarModal(modals.guitar);

const BOOK_PDF_URL = "/docs/Dissertation.pdf";

function initBookViewer(modal) {
  if (!modal) return null;

  const shell = modal.querySelector("#bookShell");
  const coverBtn = modal.querySelector("#bookCoverButton");
  const openBtn = modal.querySelector("#bookOpenButton");
  const openTabBtn = modal.querySelector("#bookOpenPdfTab");
  const statusEl = modal.querySelector("#bookPageStatus");
  const leftCanvas = modal.querySelector("#bookPageLeft");
  const rightCanvas = modal.querySelector("#bookPageRight");

  if (!shell || !coverBtn || !openBtn || !openTabBtn || !statusEl || !leftCanvas || !rightCanvas) {
    return null;
  }

  const state = {
    pdf: null,
    pdfLoadPromise: null,
    leftPage: 1,
    isOpen: false,
    renderToken: 0,
  };

  const clearCanvas = (canvas, text = "") => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = Math.max(2, canvas.clientWidth || 300);
    const h = Math.max(2, canvas.clientHeight || 300);
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = "#f8f4eb";
    ctx.fillRect(0, 0, w, h);
    if (!text) return;
    ctx.fillStyle = "rgba(78,71,56,0.75)";
    ctx.font = "14px 'Ubuntu Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2);
  };

  const ensurePdfLoaded = async () => {
    if (state.pdf) return state.pdf;
    if (!state.pdfLoadPromise) {
      state.pdfLoadPromise = getDocument(BOOK_PDF_URL).promise
        .then((pdf) => {
          state.pdf = pdf;
          return pdf;
        })
        .catch((err) => {
          state.pdfLoadPromise = null;
          throw err;
        });
    }
    return state.pdfLoadPromise;
  };

  const maxLeftPage = () => {
    const total = state.pdf?.numPages || 1;
    return total % 2 === 0 ? total - 1 : total;
  };

  const updateControls = () => {
    const total = state.pdf?.numPages || null;
    const left = state.leftPage;
    const right = left + 1;
    const isMobileBook = isMobileLayout();

    if (!state.isOpen) {
      statusEl.textContent = total ? `pages ${left}-${Math.min(right, total)} / ${total}` : "pages 1-2";
      openBtn.textContent = "open";
      openBtn.classList.remove("active");
      openBtn.disabled = isMobileBook;
      coverBtn.disabled = isMobileBook;
      openBtn.setAttribute("aria-disabled", String(isMobileBook));
      coverBtn.setAttribute("aria-disabled", String(isMobileBook));
      return;
    }

    statusEl.textContent = total ? `pages ${left}-${Math.min(right, total)} / ${total}` : `pages ${left}-${right}`;
    openBtn.textContent = "close";
    openBtn.classList.add("active");
    openBtn.disabled = isMobileBook;
    coverBtn.disabled = isMobileBook;
    openBtn.setAttribute("aria-disabled", String(isMobileBook));
    coverBtn.setAttribute("aria-disabled", String(isMobileBook));
  };

  const renderPdfPage = async (pdf, pageNum, canvas, emptyLabel) => {
    if (!pageNum || pageNum > pdf.numPages) {
      clearCanvas(canvas, emptyLabel);
      return;
    }

    const page = await pdf.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const pageContainer = canvas.parentElement;
    const targetWidth = Math.max(120, pageContainer?.clientWidth || canvas.clientWidth || 300);
    const targetHeight = Math.max(120, pageContainer?.clientHeight || canvas.clientHeight || 300);
    const fitScale = Math.min(targetWidth / baseViewport.width, targetHeight / baseViewport.height);
    const viewport = page.getViewport({ scale: fitScale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    canvas.width = Math.max(2, Math.floor(viewport.width * dpr));
    canvas.height = Math.max(2, Math.floor(viewport.height * dpr));
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const transform = dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0];
    await page.render({ canvasContext: ctx, viewport, transform, background: "rgba(0,0,0,0)" }).promise;
  };

  const renderSpread = async () => {
    const token = ++state.renderToken;
    if (!state.isOpen) {
      clearCanvas(leftCanvas);
      clearCanvas(rightCanvas);
      updateControls();
      return;
    }

    statusEl.textContent = "loading...";
    try {
      const pdf = await ensurePdfLoaded();
      if (token !== state.renderToken) return;
      const left = Math.max(1, Math.min(state.leftPage, maxLeftPage()));
      state.leftPage = left;

      await Promise.all([
        renderPdfPage(pdf, left, leftCanvas, ""),
        renderPdfPage(pdf, left + 1, rightCanvas, "end"),
      ]);
      if (token !== state.renderToken) return;
      updateControls();
    } catch (err) {
      console.error("Book PDF render failed:", err);
      clearCanvas(leftCanvas, "couldn't load pdf");
      clearCanvas(rightCanvas, "");
      statusEl.textContent = "load failed";
    }
  };

  const setOpenState = (nextOpen) => {
    if (isMobileLayout()) {
      state.isOpen = false;
      shell.classList.remove("is-open");
      clearCanvas(leftCanvas);
      clearCanvas(rightCanvas);
      updateControls();
      return;
    }
    state.isOpen = Boolean(nextOpen);
    shell.classList.toggle("is-open", state.isOpen);
    updateControls();
    void renderSpread();
  };

  const goToSpread = (leftPage) => {
    state.leftPage = Math.max(1, leftPage);
    if (!state.isOpen) {
      setOpenState(true);
      return;
    }
    void renderSpread();
  };

  coverBtn.addEventListener("click", () => setOpenState(true));
  openBtn.addEventListener("click", () => setOpenState(!state.isOpen));
  openTabBtn.addEventListener("click", () => {
    const page = Math.max(1, state.leftPage);
    const win = window.open(`${BOOK_PDF_URL}#page=${page}`, "_blank", "noopener,noreferrer");
    if (win) win.opener = null;
  });
  leftCanvas.addEventListener("click", () => {
    if (!state.isOpen) return;
    goToSpread(state.leftPage - 2);
  });
  rightCanvas.addEventListener("click", () => {
    if (!state.isOpen) return;
    const total = state.pdf?.numPages || Number.POSITIVE_INFINITY;
    const nextLeft = Math.min(state.leftPage + 2, total % 2 === 0 ? total - 1 : total);
    goToSpread(nextLeft);
  });

  clearCanvas(leftCanvas);
  clearCanvas(rightCanvas);
  updateControls();

  return {
    reset() {
      state.leftPage = 1;
      state.renderToken += 1;
      setOpenState(false);
      clearCanvas(leftCanvas);
      clearCanvas(rightCanvas);
      updateControls();
    },
    renderIfOpen() {
      if (isMobileLayout()) {
        if (state.isOpen) {
          state.isOpen = false;
          shell.classList.remove("is-open");
          clearCanvas(leftCanvas);
          clearCanvas(rightCanvas);
          updateControls();
        }
        return;
      }
      if (!state.isOpen) return;
      void renderSpread();
    },
  };
}

const bookViewer = initBookViewer(modals.book);

function initModellingViewer(modal) {
  if (!modal) return null;

  const frame = modal.querySelector("#modellingVideoFrame");
  if (!frame) return null;

  const embedSrc = frame.dataset.embedSrc || "";
  if (!embedSrc) return null;

  const stop = () => {
    if (frame.src) {
      frame.src = "";
    }
  };

  const play = () => {
    if (!frame.src || frame.src !== embedSrc) {
      frame.src = embedSrc;
    }
  };

  const onClose = (event) => {
    if (!event.target.closest(".modal-exit-button")) return;
    stop();
  };

  modal.addEventListener("click", onClose);
  modal.addEventListener("touchend", onClose, { passive: true });

  return {
    play,
    stop,
  };
}

const modellingViewer = initModellingViewer(modals.modelling);
const soundToggleButton = document.querySelector(".sound-toggle");

const stringAudioByIndex = {
  1: new Audio("/audio/guitar-string-1.mp3"),
  2: new Audio("/audio/guitar-string-2.mp3"),
  3: new Audio("/audio/guitar-string-3.mp3"),
  4: new Audio("/audio/guitar-string-4.mp3"),
};
const backgroundAudio = new Audio("/audio/bensound-rainyday.mp3");

Object.values(stringAudioByIndex).forEach((a) => {
  a.preload = "auto";
});

backgroundAudio.loop = true;
backgroundAudio.preload = "auto";
backgroundAudio.volume = 0.42;

let audioUnlocked = false;
let backgroundAudioMuted = false;

function updateSoundToggleButton() {
  if (!soundToggleButton) return;

  const label = backgroundAudioMuted ? "Unmute background music" : "Mute background music";
  soundToggleButton.classList.toggle("is-muted", backgroundAudioMuted);
  soundToggleButton.setAttribute("aria-label", label);
  soundToggleButton.setAttribute("aria-pressed", String(backgroundAudioMuted));
  soundToggleButton.setAttribute("title", label);
}

async function playBackgroundAudio() {
  if (backgroundAudioMuted) return;

  try {
    backgroundAudio.muted = false;
    await backgroundAudio.play();
  } catch (err) {
    console.warn("Background audio autoplay was blocked:", err);
  }
}

function setBackgroundAudioMuted(nextMuted) {
  backgroundAudioMuted = nextMuted;
  backgroundAudio.muted = nextMuted;

  if (nextMuted) {
    backgroundAudio.pause();
  } else {
    void playBackgroundAudio();
  }

  updateSoundToggleButton();
}

function unlockAudio() {
  if (audioUnlocked) {
    void playBackgroundAudio();
    return;
  }

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
      void playBackgroundAudio();
      console.log("Audio working");
    })
    .catch((err) => {
      console.warn("Audio unlock failed:", err);
    });
}

canvas.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener(
  "keydown",
  () => {
    unlockAudio();
  },
  { once: true },
);

soundToggleButton?.addEventListener("click", () => {
  if (!backgroundAudioMuted && backgroundAudio.paused) {
    unlockAudio();
    return;
  }

  const nextMuted = !backgroundAudioMuted;
  setBackgroundAudioMuted(nextMuted);
  if (!nextMuted) {
    unlockAudio();
  }
});

updateSoundToggleButton();
void playBackgroundAudio();

function playStringSoundByIndex(i) {
  if (!audioUnlocked || backgroundAudioMuted) return;

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
  bluRevealMesh,
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
const raycastHitToVisualObject = new Map();
const raycastHitboxesFollowingTarget = [];
let currentIntersects = [];
let currentHoveredObject = null;
let hoveredGuitarStringIndex = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerClientX = null;
let pointerClientY = null;
let vinylAnnotationTarget = null;
let guitarAnnotationTarget = null;
let rugAnnotationTarget = null;
const mugSteamAnchor = new THREE.Vector3();
let bluSleepZs = null;

function isPointerOverModal() {
  if (pointerClientX === null || pointerClientY === null) return false;
  const el = document.elementFromPoint(pointerClientX, pointerClientY);
  return Boolean(el?.closest?.(".modal"));
}

function createDetachedHitboxForTarget(target, options = {}) {
  if (!target?.isMesh || !target.geometry) return null;
  const {
    followTargetTransform = false,
    worldOffset = null,
    worldPositionOverride = null,
    worldQuaternionOverride = null,
    useInitialScale = false,
    worldScaleOverride = null,
  } = options;

  target.updateWorldMatrix(true, false);
  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  target.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

  if (worldPositionOverride?.isVector3) {
    worldPosition.copy(worldPositionOverride);
  }

  if (worldQuaternionOverride?.isQuaternion) {
    worldQuaternion.copy(worldQuaternionOverride);
  }

  if (worldScaleOverride?.isVector3) {
    worldScale.copy(worldScaleOverride);
  } else if (useInitialScale && target.userData.initialScale) {
    const parentWorldScale = new THREE.Vector3(1, 1, 1);
    target.parent?.getWorldScale(parentWorldScale);
    worldScale.set(
      parentWorldScale.x * target.userData.initialScale.x,
      parentWorldScale.y * target.userData.initialScale.y,
      parentWorldScale.z * target.userData.initialScale.z,
    );
  }

  const hitbox = new THREE.Mesh(
    target.geometry.clone(),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );

  hitbox.name = target.name;
  hitbox.position.copy(worldPosition);
  if (worldOffset) {
    hitbox.position.add(worldOffset);
  }
  hitbox.quaternion.copy(worldQuaternion);
  hitbox.scale.copy(worldScale);
  hitbox.userData.isRaycastHitbox = true;

  scene.add(hitbox);
  raycastHitToVisualObject.set(hitbox, target);
  raycasterObjects.push(hitbox);

  if (followTargetTransform) {
    raycastHitboxesFollowingTarget.push({ hitbox, target, worldOffset });
  }

  return hitbox;
}

function syncFollowingRaycastHitboxes() {
  if (!raycastHitboxesFollowingTarget.length) return;

  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();

  raycastHitboxesFollowingTarget.forEach(({ hitbox, target, worldOffset }) => {
    if (!hitbox || !target) return;
    target.updateWorldMatrix(true, false);
    target.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
    hitbox.position.copy(worldPosition);
    if (worldOffset) {
      hitbox.position.add(worldOffset);
    }
    hitbox.quaternion.copy(worldQuaternion);
    hitbox.scale.copy(worldScale);
    hitbox.updateMatrixWorld(true);
  });
}

function resolveRaycastVisualObject(hitObject) {
  return raycastHitToVisualObject.get(hitObject) || hitObject;
}

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
  dayTexture.minFilter = THREE.LinearFilter;
  dayTexture.magFilter = THREE.LinearFilter;
  dayTexture.generateMipmaps = false;
  dayTexture.needsUpdate = true;
  loadedTextures.day[key] = dayTexture;
});

const steamGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
steamGeometry.translate(0, 0.5, 0);
steamGeometry.scale(0.3, 1.65, 0.28);

const perlinTexture = textureLoader.load("/images/perlin.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;
perlinTexture.minFilter = THREE.LinearFilter;
perlinTexture.magFilter = THREE.LinearFilter;
perlinTexture.generateMipmaps = false;
perlinTexture.needsUpdate = true;

const steamMaterial = new THREE.ShaderMaterial({
  vertexShader: steamVertexShader,
  fragmentShader: steamFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPerlinTexture: new THREE.Uniform(perlinTexture),
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
});

const steam = new THREE.Mesh(steamGeometry, steamMaterial);
steam.visible = false;
steam.renderOrder = 3;

function createWarmTextureMaterial(map) {
  const material = new THREE.MeshBasicMaterial({ map });

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <tonemapping_fragment>",
      `
        vec3 gradedColor = gl_FragColor.rgb;
        float gradedLuma = dot(gradedColor, vec3(0.2126, 0.7152, 0.0722));
        gradedColor = mix(vec3(gradedLuma), gradedColor, 1.12);
        gradedColor = ((gradedColor - 0.5) * 0.92) + 0.5;
        gradedColor = mix(gradedColor, gradedColor * vec3(1.14, 1.05, 0.9), 0.26);
        gradedColor += vec3(0.029, 0.02, 0.011);
        gl_FragColor.rgb = clamp(gradedColor, 0.0, 1.0);
        #include <tonemapping_fragment>
      `
    );
  };

  return material;
}

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

screenVideoMaterial.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <tonemapping_fragment>",
    `
      vec3 washedColor = gl_FragColor.rgb;
      float washedLuma = dot(washedColor, vec3(0.2126, 0.7152, 0.0722));
      washedColor = mix(vec3(washedLuma), washedColor, 0.84);
      washedColor = ((washedColor - 0.5) * 0.93) + 0.5;
      washedColor += vec3(0.045, 0.045, 0.045);
      gl_FragColor.rgb = clamp(washedColor, 0.0, 1.0);
      #include <tonemapping_fragment>
    `
  );
};

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
    "repertoire",
  ],
  vinyl: [
    "kaps' music data",
    "music library",
    "reflectIV",
  ],
  blu: [
    "meow meow",
    "meow meow meow",
    "blu",
  ],
  bin: [
    "archive",
  ],
  marimo: [
    "marimo",
  ],
  otamatone: [
    "the coltrane of otamatone",
    "kilometers davis",
    "otamatonious monk",
  ],
  amp: [
    "vox av15",
  ],
  mug: [
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
  pointer.x = ( e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  pointerClientX = e.clientX;
  pointerClientY = e.clientY;
});

window.addEventListener("touchstart", (e) => {
  if (
    e.target instanceof Element &&
    e.target.closest("button, a, input, textarea, select, .modal, .loading-screen")
  ) {
    return;
  }
  e.preventDefault();
  pointer.x = ( e.touches[0].clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
  pointerClientX = e.touches[0].clientX;
  pointerClientY = e.touches[0].clientY;
  },
  { passive: false }
);

window.addEventListener("touchend", (e) => {
  if (
    e.target instanceof Element &&
    e.target.closest("button, a, input, textarea, select, .modal, .loading-screen")
  ) {
    return;
  }
  e.preventDefault();
  handleRaycasterInteraction();
  },
  { passive: false }
);

function handleRaycasterInteraction(e) {
  if (e?.target?.closest?.(".modal, .loading-screen")) return;
  if (currentIntersects.length === 0) return;

  const hitObject = currentIntersects[0].object;
  const visualObject = resolveRaycastVisualObject(hitObject);

  if (visualObject.name.includes("Blu_Body")) {
    showModal(modals.blu);
  } else if (visualObject.name.includes("Rug")) {
    showModal(modals.about);
  } else if (visualObject.name.includes("Book_Blue")) {
    bookViewer?.reset();
    showModal(modals.book);
  } else if (visualObject.name.includes("Guitar")) {
    showModal(modals.guitar);
  } else if (visualObject.name.includes("Vinyl")) {
    showModal(modals.reflectiv);
  } else if (visualObject.name.includes("Bin")) {
    showModal(modals.reflectiv);
    setReflectivTab(modals.reflectiv, "library");
  } else if (visualObject.name.includes("Marimo")) {
    showModal(modals.marimo);
  } else if (visualObject.name.includes("Box")) {
    showModal(modals.inventory);
  } else if (visualObject.name.includes("Calendar")) {
    showModal(modals.calendar);
  } else if (visualObject.name.includes("Photo_Frame")) {
    showModal(modals.modelling);
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


function loadRoomModel() {
  if (roomModelLoadStarted) return;
  roomModelLoadStarted = true;

  loader.load("/models/Room_Portfolio_V4.glb", (glb) => {
  let bluMesh = null;
  let guitarMesh = null;
  const guitarParts = [];
  let mugMesh = null;

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

      if (child.name.includes("Rug")) {
        rugAnnotationTarget = rugAnnotationTarget || child;
      }

      if (child.name.includes("Blu_Body_First_Hover")) {
        child.updateWorldMatrix(true, false);
        child.userData.initialWorldPosition = child.getWorldPosition(new THREE.Vector3());
        child.userData.initialWorldQuaternion = child.getWorldQuaternion(new THREE.Quaternion());
        child.userData.initialWorldScale = child.getWorldScale(new THREE.Vector3());
        bluMesh = child;
        bluRevealMesh = child;
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.scale.set(0, 0, 0);
      }

      if (child.name.includes("Mug_First_Hover")) {
        mugMesh = child;
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
      if (raycasterNameTags.some((tag) => child.name.includes(tag)) || child.name.includes("Photo_Frame")) {
        createDetachedHitboxForTarget(child, {
          followTargetTransform: getGuitarStringIndex(child) !== null,
          worldPositionOverride: child.userData.initialWorldPosition || null,
          worldQuaternionOverride: child.userData.initialWorldQuaternion || null,
          useInitialScale: child.name.includes("Blu_Body_First_Hover"),
          worldScaleOverride: child.userData.initialWorldScale || null,
        });
      }

      if (child.name.includes("Hover")) {
        child.userData.initialScale ||= new THREE.Vector3().copy(child.scale);
        child.userData.initialPosition ||= new THREE.Vector3().copy(child.position);
        child.userData.initialRotation ||= new THREE.Vector3().copy(child.rotation);
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
              const material = createWarmTextureMaterial(loadedTextures.day[key]);

            child.material = material;

            if(child.name.includes("Vinyl")){
              yAxisVinyl.push(child);
              vinylAnnotationTarget = vinylAnnotationTarget || child;
            }
          }
        });
      }
    }
  });

  scene.add(glb.scene);
  glb.scene.updateWorldMatrix(true, true);

  if (bluMesh) {
    bluSleepZs = createSleepZsFeature({
      scene,
      target: bluMesh,
    });
  }

  if (mugMesh) {
    mugMesh.getWorldPosition(mugSteamAnchor);
    steam.position.set(
      mugSteamAnchor.x,
      mugSteamAnchor.y + 0.5,
      mugSteamAnchor.z
    );
    steam.visible = true;
  }

  if (vinylAnnotationTarget) {
    annotationFeature?.registerTarget("vinyl-reflectiv", vinylAnnotationTarget);
  }

  if (rugAnnotationTarget) {
    annotationFeature?.registerTarget("rug-about", rugAnnotationTarget);
  }

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

    guitarAnnotationTarget = guitarGroup;
    annotationFeature?.registerTarget("guitar-feature", guitarAnnotationTarget);
    createDetachedHitboxForTarget(guitarGroup);
  }

  roomModelSceneReady = true;
  maybeRevealAfterSceneReady();
  });
}

if (selectedMobileExperienceMode === "full") {
  loadRoomModel();
}

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
      [bluRevealMesh, bookBlue, bookGreen, bookYellow, bookOrange, bookPurple, bookBrown, bookRed],
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
const clock = new THREE.Clock();

camera.position.set(
  -38.44019158594338,
  18.26488478861603,
  -39.38105389743106
);

scene.background = new THREE.Color("#e7ddcd");
scene.add(steam);

const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias: true });
renderer.setSize(sizes.width , sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 0.98;

controls = new OrbitControls( camera, renderer.domElement );
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
annotationFeature = createAnnotationFeature({
  camera,
  maxVisible: 3,
  getIsSuppressed: () => isLoading || hasVisibleModal() || isMobileLayout(),
  getWheelTarget: () => renderer.domElement,
  annotations: [
    {
      id: "vinyl-reflectiv",
      body: "music habits",
      ariaLabel: "Open the music annotation",
      modal: modals.reflectiv,
      preferredSide: "left",
      anchorOffset: new THREE.Vector3(0, 0.48, 0),
      idleMs: 18000,
      maxDistance: 60,
      offsetX: 128,
      offsetY: -70,
      onActivate: () => {
        showModal(modals.reflectiv);
      },
    },
    {
      id: "guitar-feature",
      body: "guitar stuff",
      ariaLabel: "Open the guitar annotation",
      modal: modals.guitar,
      preferredSide: "right",
      anchorOffset: new THREE.Vector3(0, 0.58, 0),
      idleMs: 18000,
      maxDistance: 60,
      offsetX: 136,
      offsetY: -62,
      onActivate: () => {
        showModal(modals.guitar);
      },
    },
    {
      id: "rug-about",
      body: "about",
      ariaLabel: "Open the about annotation",
      modal: modals.about,
      preferredSide: "right",
      anchorOffset: new THREE.Vector3(0, 0.08, 0),
      idleMs: 18000,
      maxDistance: 60,
      offsetX: 120,
      offsetY: 58,
      onActivate: () => {
        showModal(modals.about);
      },
    },
  ],
});

if (vinylAnnotationTarget) {
  annotationFeature.registerTarget("vinyl-reflectiv", vinylAnnotationTarget);
}

if (guitarAnnotationTarget) {
  annotationFeature.registerTarget("guitar-feature", guitarAnnotationTarget);
}

if (rugAnnotationTarget) {
  annotationFeature.registerTarget("rug-about", rugAnnotationTarget);
}

const baseShowModal = showModal;
showModal = (modal) => {
  annotationFeature?.notifyModalShown(modal);
  baseShowModal(modal);
  modal?.querySelectorAll(".ui-tooltip").forEach((tooltip) => {
    scheduleTooltipClamp(tooltip);
  });
};

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

  updateTooltipViewportBounds();

  bookViewer?.renderIfOpen();

  if (mobileLiteModeActive) {
    render();
  }
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
  const isMug = typeof target.name === "string" && target.name.includes("Mug");

  const isGuitar = target.name === "Guitar_HoverGroup";
  const canRotate = target.name.includes("Otamatone") || isGuitar;

  if (isMug) {
    gsap.killTweensOf(steam.scale);
  }

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

      if (isMug) {
        gsap.to(steam.scale, {
          x: 1.35,
          y: 1.35,
          z: 1.35,
          duration: 0.5,
          ease: "back.out(2)",
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

    if (isMug) {
      gsap.to(steam.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }

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
  if (mobileLiteModeActive) {
    renderer.render(scene, camera);
    return;
  }

  const elapsedTime = clock.getElapsedTime();
  steamMaterial.uniforms.uTime.value = elapsedTime;
  bluSleepZs?.update(timestamp);

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
    if (isPointerOverModal()) {
      currentIntersects = [];
      hoveredGuitarStringIndex = null;
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
      annotationFeature?.update(timestamp);
      renderer.render(scene, camera);
      window.requestAnimationFrame(render);
      return;
    }

    syncFollowingRaycastHitboxes();
    raycaster.setFromCamera(pointer, camera);

    currentIntersects = raycaster.intersectObjects(raycasterObjects, true);

    if (currentIntersects.length > 0) {
      const hitObject = currentIntersects[0].object;
      const visualObject = resolveRaycastVisualObject(hitObject);
      const hoverRoot = getHoverRoot(visualObject);
      const hoverLogKey = hoverRoot.name.includes("Hover") ? hoverRoot.name : visualObject.name;
      const stringIndex = getGuitarStringIndex(visualObject);

      if (stringIndex && stringIndex !== hoveredGuitarStringIndex) {
        playStringSoundByIndex(stringIndex);
        hoveredGuitarStringIndex = stringIndex;
      } else if (!stringIndex) {
        hoveredGuitarStringIndex = null;
      }

      if (hoverLogKey && hoverLogKey !== lastTerminalHoverKey) {
        const line = buildHoverTerminalLine(hoverLogKey);
        if (line) {
          appendTerminalLine(line);
        }
        lastTerminalHoverKey = hoverLogKey;
      }

      document.body.style.cursor = visualObject.name.includes("Pointer")
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
      hoveredGuitarStringIndex = null;
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }

  annotationFeature?.update(timestamp);
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
};

window.requestAnimationFrame(render);
