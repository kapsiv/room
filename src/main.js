import './style.scss'

import gsap from "gsap";
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import { OrbitControls } from './utils/OrbitControls.js';
import { createReflectivFeature } from './features/reflectivFeature.js';
import { createModalManager } from './ui/modalManager.js';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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
  about: document.querySelector(".modal.about"),
  blu: document.querySelector(".modal.blu"),
  reflectiv: document.querySelector(".modal.reflectiv"),
  libraryLookup: document.querySelector(".modal.library-lookup"),
  nowplaying: document.querySelector(".modal.nowplaying"),
  archive: document.querySelector(".modal.archive"),
  calendar: document.querySelector(".modal.calendar"),
  modelling: document.querySelector(".modal.modelling"),
  book: document.querySelector(".modal.book"),
};

let showModal;
let hideModal;
let placeModalAt;

const reflectivFeature = createReflectivFeature({
  gsap,
  modals,
  getShowModal: () => showModal,
});

const {
  initAboutModal,
  initNowPlayingModal,
  initReflectivModal,
  setReflectivTab,
} = reflectivFeature;

const modalManager = createModalManager({
  modals,
  gsap,
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
    initNowPlayingModal(modal);
  },
  onShowReflectiv: (modal) => {
    initReflectivModal(modal);
  },
});

modalManager.init();
({ showModal, hideModal, placeModalAt } = modalManager);

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

    if (!state.isOpen) {
      statusEl.textContent = total ? `pages ${left}-${Math.min(right, total)} / ${total}` : "pages 1-2";
      openBtn.textContent = "open";
      openBtn.classList.remove("active");
      return;
    }

    statusEl.textContent = total ? `pages ${left}-${Math.min(right, total)} / ${total}` : `pages ${left}-${right}`;
    openBtn.textContent = "close";
    openBtn.classList.add("active");
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
const raycastHitToVisualObject = new Map();
let currentIntersects = [];
let currentHoveredObject = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function createDetachedHitboxForTarget(target) {
  if (!target?.isMesh || !target.geometry) return null;

  target.updateWorldMatrix(true, false);
  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  target.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

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
  hitbox.quaternion.copy(worldQuaternion);
  hitbox.scale.copy(worldScale);
  hitbox.userData.isRaycastHitbox = true;

  scene.add(hitbox);
  raycastHitToVisualObject.set(hitbox, target);
  raycasterObjects.push(hitbox);
  return hitbox;
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
  const visualObject = resolveRaycastVisualObject(hitObject);

  const stringIndex = getGuitarStringIndex(visualObject);
  if (stringIndex) {
    playStringSoundByIndex(stringIndex);
    return;
  }

  if (visualObject.name.includes("Blu_Body")) {
    showModal(modals.blu);
  } else if (visualObject.name.includes("Rug")) {
    showModal(modals.about);
  } else if (visualObject.name.includes("Book_Blue")) {
    bookViewer?.reset();
    showModal(modals.book);
  } else if (visualObject.name.includes("Vinyl")) {
    showModal(modals.reflectiv);
  } else if (visualObject.name.includes("Bin")) {
    showModal(modals.reflectiv);
    setReflectivTab(modals.reflectiv, "library");
  } else if (visualObject.name.includes("Calendar")) {
    showModal(modals.calendar);
  } else if (visualObject.name.includes("Photo_Frame")) {
    modellingViewer?.play();
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
      if (raycasterNameTags.some((tag) => child.name.includes(tag)) || child.name.includes("Photo_Frame")) {
        createDetachedHitboxForTarget(child);
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

    createDetachedHitboxForTarget(guitarGroup);
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

  bookViewer?.renderIfOpen();
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
      const visualObject = resolveRaycastVisualObject(hitObject);
      const hoverRoot = getHoverRoot(visualObject);
      const hoverLogKey = hoverRoot.name.includes("Hover") ? hoverRoot.name : visualObject.name;

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
