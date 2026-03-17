const CLOSED_FAB_SIZE_FACTOR = 0.82;
const OPEN_FAB_VISUAL_SCALE = 1.32;
const MOBILE_BREAKPOINT = 760;
const MOBILE_DOCK_ITEMS = [
  { name: "about", modalKey: "about", icon: "/icons/about.svg" },
  { name: "now playing", modalKey: "nowplaying", icon: "/icons/music.svg" },
  { name: "inventory", modalKey: "inventory", icon: "/icons/box.svg" },
  { name: "reflectiv", modalKey: "reflectiv", icon: "/icons/reflectIV.svg" },
];

const PAGES = [
  { name: "info", url: "/info", icon: "/icons/info.svg" },
  { name: "links", url: "/links", icon: "/icons/links.svg" },
  { name: "random", url: "/random", icon: "/icons/random.png" },
  { name: "cv", url: "/cv", icon: "/icons/cv.svg" },
  { name: "data pipelines", url: "", icon: "/icons/data_pipelines.svg" },
  { name: "gear", url: "/gear", icon: "/icons/gear.svg" },
  { name: "guitar", url: "/guitar", icon: "/icons/classical_guitar.svg" },
  { name: "typography", url: "/typography", icon: "/icons/typography.svg" },
  { name: "github", url: "https://github.com/kapsiv", icon: "/icons/github.svg" },
  { name: "about", url: "/about", icon: "/icons/about.svg" },
  { name: "portfolio", url: "/portfolio", icon: "/icons/portfolio.svg" },
  { name: "projects", url: "/projects", icon: "/icons/projects.svg" },
  { name: "room", url: "/", icon: "/icons/room.svg" },
  { name: "gallery", url: "/gallery", icon: "/icons/gallery.svg" },
  { name: "archive", url: "/archive", icon: "/icons/archive.svg" },
  { name: "bloomba", url: "/bloomba", icon: "/icons/bloomba.svg" },
  { name: "blog", url: "/blog", icon: "/icons/blog.svg" },
  { name: "reflectIV", url: "/reflectIV", icon: "/icons/reflectIV.svg" },
  { name: "vinaflow", url: "/vinaflow", icon: "/icons/vinaflow.svg" },
  { name: "informatIV", url: "/informatIV", icon: "/icons/informatIV.svg" },
  { name: "404", url: "/404", icon: "/icons/404.svg" },
  { name: "design philosophy", url: "/blog", icon: "/icons/design_philosophy.svg" },
  { name: "logo", url: "/logo", icon: "/icons/logo.svg" },
  { name: "now playing", url: "/music", icon: "/icons/music.svg" },
  { name: "2026", url: "/2026", icon: "/icons/2026.svg" },
  { name: "faq", url: "/faq", icon: "/icons/faq.svg" },
  { name: "blu", url: "/faq", icon: "/icons/blu.svg" },
  { name: "dissertation", url: "/faq", icon: "/icons/book.svg" },
];

function buildFabMarkSvg() {
  return `
    <svg viewBox="0 0 975.98 975.98" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="fabMarkClip">
          <path d="M725.98,0H250C111.93,0,0,111.93,0,250v475.98c0,138.07,111.93,250,250,250h475.98c138.07,0,250-111.93,250-250V250C975.98,111.93,864.05,0,725.98,0ZM344.28,823.11c33.61,0,66.23-6.59,96.98-19.6,29.67-12.55,56.3-30.5,79.16-53.36,22.86-22.86,40.81-49.49,53.36-79.16,13-30.75,19.6-63.38,19.6-96.98h0s23.88,25,23.88,25c-2.54,28.16-9.39,55.55-20.45,81.72-13.82,32.66-33.57,61.96-58.71,87.1-25.14,25.14-54.45,44.89-87.1,58.71-26.16,11.07-53.55,17.92-81.72,20.46l-25-23.88Z"/>
        </clipPath>
      </defs>
      <g clip-path="url(#fabMarkClip)">
        <path id="fab-logo-path" class="fab-logo-path" d="M344.27,190.76c105.83,0,191.62,85.79,191.62,191.62v191.62c0,105.83-85.79,191.62-191.62,191.62s-191.62-85.79-191.62-191.62h0c0-105.83,85.79-191.62,191.62-191.62h287.42c105.83,0,191.62,85.79,191.62,191.62h0c0,105.83-85.79,191.62-191.62,191.62h-191.62"/>
      </g>
    </svg>
  `;
}

function playFabMarkAnimation(gsap, pathEl) {
  if (!pathEl) return;
  const pathLength = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = `${pathLength}`;
  pathEl.style.strokeDashoffset = `${pathLength}`;
  gsap.to(pathEl, {
    strokeDashoffset: 0,
    duration: 1.32,
    ease: "sine.inOut",
  });
}

function getFabPathLength(pathEl) {
  if (!pathEl) return 0;
  const pathLength = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = `${pathLength}`;
  return pathLength;
}

export function createFabManager({
  gsap,
  loadingScreen,
  getModals,
  getShowModal,
  getNowPlayingTrack,
  onLoadingComplete,
  onMobileModeSelect,
}) {
  let loadingRevealStarted = false;
  let fabOrbitAnimating = false;
  let fabExpanded = false;
  let assetsLoaded = false;
  let loadingLogoDrawDone = true;
  let selectedMobileMode = isMobileDockLayout() ? null : "full";
  let modeChooser = null;

  function isMobileDockLayout() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  }

  function canPlayLoadingReveal() {
    return loadingLogoDrawDone && assetsLoaded && selectedMobileMode !== null;
  }

  function selectMobileMode(mode) {
    selectedMobileMode = mode;
    if (loadingScreen) {
      loadingScreen.dataset.mobileMode = mode;
      loadingScreen.classList.add("loading-screen--mode-selected");
    }

    if (modeChooser) {
      modeChooser.classList.add("is-hidden");
      modeChooser.setAttribute("aria-hidden", "true");
    }

    onMobileModeSelect?.(mode);

    if (mode === "lite") {
      assetsLoaded = true;
    }

    if (canPlayLoadingReveal()) {
      playLoadingReveal();
    }
  }

  function initMobileModeChooser() {
    if (!loadingScreen || !isMobileDockLayout() || loadingScreen.dataset.modeChooserBound === "true") return;

    loadingScreen.dataset.modeChooserBound = "true";
    loadingScreen.dataset.mobileMode = "pending";

    const heading = document.createElement("div");
    heading.className = "loading-mobile-title";
    heading.innerHTML = '<span class="loading-mobile-title-text">kapsiv</span>';
    loadingScreen.appendChild(heading);

    modeChooser = document.createElement("div");
    modeChooser.className = "loading-mode-chooser";
    modeChooser.innerHTML = `
      <button type="button" class="loading-mode-button" data-mobile-mode="full">
        <span class="loading-mode-button-title">continue to mobile site</span>
      </button>
      <button type="button" class="loading-mode-button loading-mode-button--secondary" data-mobile-mode="lite">
        <span class="loading-mode-button-title">lite version</span>
        <span class="loading-mode-button-subtitle">FOR SLOWER PHONES</span>
      </button>
    `;

    modeChooser.querySelectorAll("[data-mobile-mode]").forEach((button) => {
      const handleModeSelect = () => {
        const mode = button.getAttribute("data-mobile-mode");
        if (!mode || selectedMobileMode) return;
        selectMobileMode(mode);
      };

      button.addEventListener("pointerup", (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleModeSelect();
      });

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleModeSelect();
      });
    });

    loadingScreen.appendChild(modeChooser);
  }

  function getMobileDockMetrics() {
    const dockHeight = Math.max(84, Math.min(96, Math.round(window.innerHeight * 0.102)));
    const dockWidth = Math.max(264, Math.min(window.innerWidth - 20, 376));
    const dockMargin = 16;
    const dockTop = Math.max(12, window.innerHeight - dockMargin - dockHeight);
    const dockRadius = Math.round(dockHeight / 2);

    return {
      dockHeight,
      dockWidth,
      dockMargin,
      dockTop,
      dockRadius,
    };
  }

  function updateMobileDockLayout() {
    if (!loadingScreen || !loadingScreen.classList.contains("loading-screen--dock")) return;
    const { dockHeight, dockWidth, dockMargin, dockTop } = getMobileDockMetrics();
    loadingScreen.style.setProperty("--dock-height", `${dockHeight}px`);
    loadingScreen.style.setProperty("--dock-width", `${dockWidth}px`);
    loadingScreen.style.setProperty("--dock-margin", `${dockMargin}px`);
    loadingScreen.style.setProperty("--dock-top", `${dockTop + dockHeight / 2}px`);
  }

  function initMobileDock() {
    if (!loadingScreen || loadingScreen.dataset.dockBound === "true") return;
    loadingScreen.dataset.dockBound = "true";
    loadingScreen.setAttribute("role", "toolbar");
    loadingScreen.setAttribute("aria-label", "Quick access");
    loadingScreen.removeAttribute("tabindex");

    const dock = document.createElement("div");
    dock.className = "fab-dock-buttons";

    MOBILE_DOCK_ITEMS.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fab-dock-button";
      button.setAttribute("aria-label", `Open ${item.name}`);
      button.dataset.modalKey = item.modalKey;
      button.innerHTML = `
        <span class="fab-dock-button-icon" style="--dock-icon: url('${item.icon}')"></span>
      `;
      const openDockModal = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        const showModal = typeof getShowModal === "function" ? getShowModal() : null;
        const modals = typeof getModals === "function" ? getModals() : null;
        const modal = item.modalKey === "inventory"
          ? document.querySelector(".modal.inventory")
          : modals?.[item.modalKey];
        if (!showModal || !modal) return;
        showModal(modal);
      };

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
      });
      button.addEventListener("pointerup", openDockModal);
      button.addEventListener("touchend", openDockModal, { passive: false });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        if (event.detail !== 0) return;
        openDockModal(event);
      });
      dock.appendChild(button);
    });

    loadingScreen.appendChild(dock);
    updateMobileDockLayout();
    window.addEventListener("resize", updateMobileDockLayout);
  }

  function initLoadingFab() {
    if (!loadingScreen || loadingScreen.dataset.fabBound === "true") return;

    if (isMobileDockLayout()) {
      initMobileDock();
      return;
    }

    loadingScreen.dataset.fabBound = "true";
    loadingScreen.setAttribute("role", "button");
    loadingScreen.setAttribute("aria-label", "Open fab");
    loadingScreen.setAttribute("tabindex", "0");

    const fabMark = document.createElement("div");
    fabMark.className = "fab-mark";
    fabMark.innerHTML = buildFabMarkSvg();
    loadingScreen.appendChild(fabMark);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "fab-close-button";
    closeBtn.setAttribute("aria-label", "Close fab");
    closeBtn.textContent = "x";
    loadingScreen.appendChild(closeBtn);

    const plusIcon = document.createElement("span");
    plusIcon.className = "fab-plus-icon";
    plusIcon.setAttribute("aria-hidden", "true");
    plusIcon.textContent = "+";
    loadingScreen.appendChild(plusIcon);

    const centerIconWrap = document.createElement("button");
    centerIconWrap.type = "button";
    centerIconWrap.className = "fab-center-icon fab-center-icon--overlay";
    centerIconWrap.setAttribute("aria-label", "Open selected page");
    centerIconWrap.setAttribute("tabindex", "-1");
    const centerIconImg = document.createElement("img");
    centerIconImg.alt = "";
    centerIconWrap.appendChild(centerIconImg);
    document.body.appendChild(centerIconWrap);

    const wheel = document.createElement("div");
    wheel.className = "fab-wheel fab-wheel--overlay";
    document.body.appendChild(wheel);

    const fabGlow = document.createElement("div");
    fabGlow.className = "fab-contrast-glow";
    document.body.appendChild(fabGlow);

    let wheelCenterX = 0;
    let wheelCenterY = 0;
    const positionWheelToFab = () => {
      if (!loadingScreen) return;
      const rect = loadingScreen.getBoundingClientRect();
      wheelCenterX = rect.left + rect.width / 2;
      wheelCenterY = rect.top + rect.height / 2;
      gsap.set(wheel, { left: wheelCenterX, top: wheelCenterY });
      gsap.set(centerIconWrap, { left: wheelCenterX, top: wheelCenterY });
      gsap.set(fabGlow, { left: wheelCenterX + 220, top: wheelCenterY - 120 });
    };

    const slotOffsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const visibleLimit = 3;
    const wheelScrollZoneRadius = 500;
    let currentPageIndex = 0;
    let wheelDeltaBuffer = 0;
    let wheelStepAnimating = false;
    let queuedWheelSteps = 0;
    let wheelIdleTimer = null;
    const wheelButtons = Array.from({ length: slotOffsets.length }, () => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "fab-wheel-item";
      wheel.appendChild(b);
      return b;
    });

    const wrapPageIndex = (idx) => ((idx % PAGES.length) + PAGES.length) % PAGES.length;

    const escapeHtml = (value) =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const isNowPlayingPage = (page) => (page?.name || "").toLowerCase() === "now playing";

    const NOWPLAYING_IDLE_MS = 2200;
    let nowPlayingIdleTimer = null;
    let nowPlayingActive = false;
    let nowPlayingPayload = null;
    let nowPlayingText = "";

    const clearNowPlayingIdle = () => {
      if (nowPlayingIdleTimer) clearTimeout(nowPlayingIdleTimer);
      nowPlayingIdleTimer = null;
    };

    const resetNowPlayingPreview = () => {
      clearNowPlayingIdle();
      nowPlayingActive = false;
      nowPlayingPayload = null;
      nowPlayingText = "";
      centerIconWrap.classList.remove("fab-center-icon--nowplaying");
      centerIconWrap.classList.remove("fab-center-icon--loaded");
      centerIconWrap.style.width = "";
      centerIconWrap.style.height = "";
      const page = PAGES[wrapPageIndex(currentPageIndex)];
      if (page) {
        centerIconImg.src = page.icon;
        centerIconImg.alt = page.name;
      }
    };

    const scheduleNowPlayingPreview = () => {
      clearNowPlayingIdle();
      if (!fabExpanded) return;
      const page = PAGES[wrapPageIndex(currentPageIndex)];
      if (!isNowPlayingPage(page) || nowPlayingActive) return;
      nowPlayingIdleTimer = window.setTimeout(async () => {
        if (!fabExpanded) return;
        const currentPage = PAGES[wrapPageIndex(currentPageIndex)];
        if (!isNowPlayingPage(currentPage)) return;
        let track = null;
        if (typeof getNowPlayingTrack === "function") {
          track = await getNowPlayingTrack();
        }
        if (!track || !track.title) return;
        const descriptor = track.artist || track.album || "";
        nowPlayingText = `now playing: ${track.title}${descriptor ? ` - ${descriptor}` : ""}`;
        nowPlayingPayload = track;
        nowPlayingActive = true;
        centerIconWrap.classList.add("fab-center-icon--nowplaying");
        centerIconWrap.classList.remove("fab-center-icon--loaded");
        centerIconImg.onload = () => {
          centerIconWrap.classList.add("fab-center-icon--loaded");
        };
        if (loadingScreen) {
          const rect = loadingScreen.getBoundingClientRect();
          const borderWidth = parseFloat(getComputedStyle(loadingScreen).borderTopWidth || "0");
          const size = Math.round((rect.width || 84) - borderWidth * 2);
          centerIconWrap.style.width = `${size}px`;
          centerIconWrap.style.height = `${size}px`;
        }
        renderWheel();
      }, NOWPLAYING_IDLE_MS);
    };

    const modalNameMap = {
      info: "info",
      links: "links",
      about: "about",
      cv: "cv",
      faq: "faq",
      guitar: "guitar",
      archive: "archive",
      gallery: "gallery",
      projects: "projects",
      "design philosophy": "designPhilosophy",
      "data pipelines": "dataPipelines",
      vinaflow: "vinaflow",
      informativ: "informativ",
      reflectiv: "reflectiv",
      "2026": "calendar",
      logo: "logo",
      music: "nowplaying",
      "now playing": "nowplaying",
      blu: "blu",
      dissertation: "book",
    };

    const getRandomModal = (modals) => {
      const candidates = Object.values(modals).filter((modal) => modal && modal.dataset.randomExclude !== "true");
      if (!candidates.length) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
    };

    const openCurrentPage = () => {
      const page = PAGES[wrapPageIndex(currentPageIndex)];
      if (!page) return;
      if (typeof page.url === "string" && /^https?:\/\//.test(page.url)) {
        window.open(page.url, "_blank", "noopener,noreferrer");
        return;
      }

      const showModal = typeof getShowModal === "function" ? getShowModal() : null;
      const modals = typeof getModals === "function" ? getModals() : null;
      if (!showModal || !modals) return;
      if ((page.name || "").toLowerCase() === "random") {
        const randomModal = getRandomModal(modals);
        if (randomModal) showModal(randomModal);
        return;
      }
      const modalKey = modalNameMap[(page.name || "").toLowerCase()];
      const modal = modalKey ? modals[modalKey] : null;
      if (!modal) return;
      showModal(modal);
    };

    const getWheelMetrics = (relative) => {
      const norm = relative / Math.max(visibleLimit, 1);
      const theta = norm * 1.1;
      const radius = 160;
      const offsetX = 100;
      const offsetY = -18;
      const x = Math.round(offsetX + Math.cos(theta) * radius);
      const y = Math.round(Math.sin(theta) * radius * 0.9 + offsetY);
      const fontSize = Math.round(Math.max(22, 35 - Math.abs(relative) * 3.2));
      const opacity = Math.abs(relative) > visibleLimit
        ? 0
        : Math.max(0.26, 1 - Math.abs(relative) * 0.2);

      return { x, y, fontSize, opacity };
    };

    const renderWheel = () => {
      const centerPage = PAGES[wrapPageIndex(currentPageIndex)];
      const isNowPlayingCenter = isNowPlayingPage(centerPage);
      if (nowPlayingActive && (!fabExpanded || !isNowPlayingCenter)) {
        resetNowPlayingPreview();
      }

      if (centerPage) {
        if (nowPlayingActive && isNowPlayingCenter && nowPlayingPayload?.imageUrl) {
          centerIconImg.src = nowPlayingPayload.imageUrl;
          centerIconImg.alt = nowPlayingPayload.title || centerPage.name;
        } else {
          centerIconImg.src = centerPage.icon;
          centerIconImg.alt = centerPage.name;
        }
      }

      wheelButtons.forEach((button, slotIndex) => {
        const slotOffset = slotOffsets[slotIndex];
        const pageIndex = wrapPageIndex(currentPageIndex + slotOffset);
        const page = PAGES[pageIndex];
        if (!page) return;

        const { x, y, fontSize, opacity } = getWheelMetrics(slotOffset);

        const isCenter = slotOffset === 0;
        const shouldShowNowPlaying = isCenter && nowPlayingActive && isNowPlayingCenter && nowPlayingText;
        if (shouldShowNowPlaying) {
          button.classList.add("fab-wheel-item--nowplaying");
          const safeText = escapeHtml(nowPlayingText);
          button.innerHTML = `
            <span class="fab-nowplaying-wrap">
              <span class="fab-nowplaying-inner is-animating">
                <span class="fab-nowplaying-text">${safeText}</span>
                <span class="fab-nowplaying-text fab-nowplaying-duplicate" aria-hidden="true">${safeText}</span>
              </span>
            </span>
          `;
          button.setAttribute("aria-label", nowPlayingText);
        } else {
          button.classList.remove("fab-wheel-item--nowplaying");
          button.textContent = page.name;
          button.setAttribute("aria-label", page.name);
        }
        button.dataset.relative = String(slotOffset);
        button.dataset.pageIndex = String(pageIndex);
        button.classList.toggle("is-center", slotOffset === 0);
        button.style.zIndex = String(20 - Math.abs(slotOffset));
        button.style.pointerEvents = Math.abs(slotOffset) <= visibleLimit ? "auto" : "none";
        gsap.set(button, {
          x,
          y,
          scale: 1,
          opacity,
          fontSize: `${fontSize}px`,
          force3D: false,
        });
      });

      if (isNowPlayingCenter && fabExpanded && !nowPlayingActive) {
        scheduleNowPlayingPreview();
      }
    };

    const animateWheelStep = (dir, onDone) => {
      if (wheelStepAnimating) return;
      wheelStepAnimating = true;
      let doneCount = 0;

      wheelButtons.forEach((button, slotIndex) => {
        const slotOffset = slotOffsets[slotIndex];
        const targetRelative = slotOffset - dir;
        const { x, y, fontSize, opacity } = getWheelMetrics(targetRelative);

        gsap.to(button, {
          x,
          y,
          scale: 1,
          opacity,
          fontSize: `${fontSize}px`,
          duration: 0.2,
          ease: "sine.inOut",
          autoRound: true,
          force3D: false,
          overwrite: true,
          onComplete: () => {
            doneCount += 1;
            if (doneCount !== wheelButtons.length) return;
            currentPageIndex = wrapPageIndex(currentPageIndex + dir);
            renderWheel();
            wheelStepAnimating = false;
            onDone?.();
          },
        });
      });
    };

    const processWheelQueue = () => {
      if (wheelStepAnimating || queuedWheelSteps === 0) return;
      const dir = queuedWheelSteps > 0 ? 1 : -1;
      queuedWheelSteps -= dir;
      animateWheelStep(dir, processWheelQueue);
    };

    const shiftSelection = (delta) => {
      if (!delta) return;
      resetNowPlayingPreview();
      const clamped = Math.max(-(PAGES.length - 1), Math.min(PAGES.length - 1, delta));
      queuedWheelSteps += clamped;
      processWheelQueue();
    };

    wheelButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!fabExpanded || wheelStepAnimating) return;
        const relative = Number(button.dataset.relative);
        if (!Number.isFinite(relative)) return;

        if (relative !== 0) {
          shiftSelection(relative);
          return;
        }
        openCurrentPage();
      });
    });

    const isInWheelScrollZone = (clientX, clientY) => {
      const dx = clientX - wheelCenterX;
      const dy = clientY - wheelCenterY;
      return (dx * dx) + (dy * dy) <= wheelScrollZoneRadius * wheelScrollZoneRadius;
    };

    const handleWheelScroll = (e) => {
      if (!fabExpanded) return;
      if (e.target instanceof Element && e.target.closest(".modal")) return;
      if (!isInWheelScrollZone(e.clientX, e.clientY)) return;
      e.preventDefault();
      e.stopPropagation();
      if (wheelIdleTimer) clearTimeout(wheelIdleTimer);
      wheelDeltaBuffer += e.deltaY;
      const threshold = 44;
      let steps = 0;

      while (wheelDeltaBuffer >= threshold) {
        steps += 1;
        wheelDeltaBuffer -= threshold;
      }

      while (wheelDeltaBuffer <= -threshold) {
        steps -= 1;
        wheelDeltaBuffer += threshold;
      }

      if (steps !== 0) shiftSelection(steps);

      // Prevent long "tail" scrolling after input stops.
      wheelIdleTimer = window.setTimeout(() => {
        wheelDeltaBuffer = 0;
        queuedWheelSteps = 0;
      }, 90);
    };

    document.addEventListener("wheel", handleWheelScroll, { passive: false, capture: true });

    centerIconWrap.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!fabExpanded || wheelStepAnimating) return;
      openCurrentPage();
    });

    renderWheel();

    const pathEl = fabMark.querySelector("#fab-logo-path");
    const pathLength = getFabPathLength(pathEl);
    pathEl.style.strokeDashoffset = `${pathLength}`;

    const openFab = () => {
      if (fabOrbitAnimating || fabExpanded) return;
      fabOrbitAnimating = true;
      positionWheelToFab();
      resetNowPlayingPreview();

      gsap.to(fabMark, {
        opacity: 0.98,
        duration: 0.16,
        ease: "power1.out",
      });
      gsap.to(plusIcon, {
        opacity: 0,
        duration: 0.18,
        ease: "power1.out",
      });
      playFabMarkAnimation(gsap, pathEl);

      const expandedX = Math.min(window.innerWidth * 0.2, 210);
      const expandedY = -Math.min(window.innerHeight * 0.18, 170);

      gsap.to(loadingScreen, {
        x: fabExpanded ? 0 : expandedX,
        y: fabExpanded ? 0 : expandedY,
        rotation: fabExpanded ? 0 : 180,
        scale: fabExpanded ? 1 : OPEN_FAB_VISUAL_SCALE / CLOSED_FAB_SIZE_FACTOR,
        duration: 0.9,
        ease: "power3.inOut",
        onUpdate: positionWheelToFab,
        onComplete: () => {
          fabExpanded = true;
          loadingScreen.setAttribute("aria-label", "Fab open");
          positionWheelToFab();
          scheduleNowPlayingPreview();
          gsap.to(wheel, {
            opacity: 1,
            duration: 0.38,
            delay: 0.22,
            ease: "power1.out",
            pointerEvents: "auto",
          });

          gsap.to(fabGlow, {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            delay: 0.06,
            ease: "power2.out",
          });
          fabOrbitAnimating = false;
        },
      });

      gsap.to(closeBtn, {
        opacity: 1,
        x: 0,
        duration: 0.55,
        ease: "power1.out",
        pointerEvents: "auto",
      });

      gsap.to(centerIconWrap, {
        opacity: 1,
        duration: 0.68,
        delay: 0.92,
        ease: "power1.out",
        pointerEvents: "auto",
      });
    };

    const closeFab = () => {
      if (fabOrbitAnimating || !fabExpanded) return;
      fabOrbitAnimating = true;
      resetNowPlayingPreview();
      gsap.to(pathEl, {
        strokeDashoffset: pathLength,
        duration: 0.6,
        ease: "power2.inOut",
      });

      gsap.to(fabMark, {
        opacity: 0,
        duration: 0.25,
        delay: 0.34,
        ease: "power1.inOut",
      });

      gsap.to(loadingScreen, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: 0.9,
        ease: "power3.inOut",
        onUpdate: positionWheelToFab,
        onComplete: () => {
          fabExpanded = false;
          loadingScreen.setAttribute("aria-label", "Open fab");
          positionWheelToFab();
          fabOrbitAnimating = false;
        },
      });

      gsap.to(closeBtn, {
        opacity: 0,
        x: -6,
        duration: 0.18,
        ease: "power2.in",
        pointerEvents: "none",
      });

      gsap.to([wheel, centerIconWrap], {
        opacity: 0,
        duration: 0.18,
        ease: "power2.in",
        pointerEvents: "none",
      });

      gsap.to(fabGlow, {
        opacity: 0,
        scale: 0.62,
        duration: 0.2,
        ease: "power2.in",
      });

      gsap.to(plusIcon, {
        opacity: 1,
        duration: 0.18,
        delay: 0.34,
        ease: "power1.inOut",
      });
    };

    loadingScreen.addEventListener("click", openFab);
    loadingScreen.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      openFab();
    });

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeFab();
    });

    window.addEventListener("resize", () => {
      if (!fabExpanded) return;
      positionWheelToFab();
    });

    positionWheelToFab();
  }

  function playLoadingReveal() {
    if (loadingRevealStarted) return;
    loadingRevealStarted = true;
    if (!loadingScreen) {
      onLoadingComplete?.();
      return;
    }

    const logo = loadingScreen.querySelector(".loading-logo");
    const baseFabSize = Math.max(
      72,
      Math.min(92, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.11))
    );
    const fabSize = Math.max(58, Math.round(baseFabSize * CLOSED_FAB_SIZE_FACTOR));
    const fabMargin = 24;
    const fabTop = Math.max(16, window.innerHeight - fabMargin - fabSize);
    const fabCorner = Math.round(fabSize * 0.5);
    const isMobile = isMobileDockLayout();
    const {
      dockHeight,
      dockWidth,
      dockMargin,
      dockTop,
      dockRadius,
    } = getMobileDockMetrics();
    const targetCenterX = isMobile ? window.innerWidth / 2 : fabMargin + fabSize / 2;
    const targetCenterY = isMobile ? dockTop + dockHeight / 2 : fabTop + fabSize / 2;
    const deltaX = targetCenterX - window.innerWidth / 2;
    const deltaY = targetCenterY - window.innerHeight / 2;
    loadingScreen.style.setProperty("--fab-size", `${fabSize}px`);
    loadingScreen.style.setProperty("--fab-margin", `${fabMargin}px`);
    loadingScreen.style.setProperty("--dock-width", `${dockWidth}px`);
    loadingScreen.style.setProperty("--dock-height", `${dockHeight}px`);
    loadingScreen.style.setProperty("--dock-margin", `${dockMargin}px`);
    loadingScreen.style.setProperty("--dock-top", `${targetCenterY}px`);

    const tl = gsap.timeline();
    if (modeChooser) {
      tl.to(modeChooser, {
        opacity: 0,
        duration: 0.18,
        ease: "power2.out",
      });
    }

    tl.to(loadingScreen, {
      scale: 0.64,
      duration: 1.05,
      ease: "power3.out",
    }, modeChooser ? "-=0.04" : 0);

    if (logo) {
      tl.to(
        logo,
        {
          opacity: 0,
          duration: 0.45,
          ease: "power2.out",
        },
        "-=0.15"
      );
    }

    tl.to(
      loadingScreen,
      {
        x: isMobile ? 0 : deltaX,
        y: deltaY,
        width: isMobile ? dockWidth : fabSize,
        height: isMobile ? dockHeight : fabSize,
        borderWidth: 4,
        borderRadius: isMobile
          ? `${dockRadius}px`
          : `${fabCorner}px ${fabCorner}px ${fabCorner}px 0px`,
        scale: 1,
        duration: 1.05,
        ease: "power2.inOut",
        onComplete: () => {
          if (isMobile) {
            loadingScreen.classList.add("loading-screen--dock");
            gsap.set(loadingScreen, { clearProps: "x,y,scale" });
          } else {
            gsap.set(loadingScreen, { clearProps: "transform,left,top,x,y,scale" });
            loadingScreen.classList.add("loading-screen--fab");
          }
          initLoadingFab();
          onLoadingComplete?.();
        },
      },
      "-=0.45"
    );
  }

  function init() {
    if (!loadingScreen) return;
    const logoPath = document.querySelector("#logo");
    if (!logoPath) return;

    initMobileModeChooser();

    loadingLogoDrawDone = false;
    const pathLength = logoPath.getTotalLength();
    logoPath.style.strokeDasharray = pathLength;
    logoPath.style.strokeDashoffset = pathLength;

    gsap.to(logoPath, {
      strokeDashoffset: 0,
      duration: 2,
      ease: "power2.inOut",
      onComplete: () => {
        loadingLogoDrawDone = true;
        if (canPlayLoadingReveal()) playLoadingReveal();
      },
    });
  }

  function markAssetsLoaded() {
    assetsLoaded = true;
    if (canPlayLoadingReveal()) playLoadingReveal();
  }

  function markAssetsPending() {
    assetsLoaded = false;
  }

  return {
    init,
    markAssetsLoaded,
    markAssetsPending,
  };
}
