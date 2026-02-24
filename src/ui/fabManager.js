const CLOSED_FAB_SIZE_FACTOR = 0.82;
const OPEN_FAB_VISUAL_SCALE = 1.32;

const PAGES = [
  { name: "info", url: "/info", icon: "/icons/info.png" },
  { name: "random", url: "/random", icon: "/icons/random.png" },
  { name: "cv", url: "/cv", icon: "/icons/cv.png" },
  { name: "data pipelines", url: "", icon: "/icons/data_pipelines.png" },
  { name: "gear", url: "/gear", icon: "/icons/gear.png" },
  { name: "guitar", url: "/guitar", icon: "/icons/classical_guitar.png" },
  { name: "typography", url: "/typography", icon: "/icons/typography.png" },
  { name: "github", url: "https://github.com/kapsiv", icon: "/icons/github.png" },
  { name: "about", url: "/about", icon: "/icons/about.png" },
  { name: "portfolio", url: "/portfolio", icon: "/icons/portfolio.png" },
  { name: "projects", url: "/projects", icon: "/icons/projects.png" },
  { name: "room", url: "/", icon: "/icons/room.png" },
  { name: "gallery", url: "/gallery", icon: "/icons/gallery.png" },
  { name: "archive", url: "/archive", icon: "/icons/archive.png" },
  { name: "bloomba", url: "/bloomba", icon: "/icons/bloomba.png" },
  { name: "blog", url: "/blog", icon: "/icons/blog.png" },
  { name: "reflectIV", url: "/reflectIV", icon: "/icons/reflectIV.png" },
  { name: "vinaflow", url: "/vinaflow", icon: "/icons/vinaflow.png" },
  { name: "informatIV", url: "/informatIV", icon: "/icons/informatIV.png" },
  { name: "404", url: "/404", icon: "/icons/404.png" },
  { name: "design philosophy", url: "/blog", icon: "/icons/design_philosophy.png" },
  { name: "logo", url: "/logo", icon: "/icons/logo.png" },
  { name: "now playing", url: "/music", icon: "/icons/music.png" },
  { name: "2026", url: "/2026", icon: "/icons/2026.png" },
  { name: "faq", url: "/faq", icon: "/icons/faq.png" },
  { name: "blu", url: "/faq", icon: "/icons/blu.png" },
  { name: "dissertation", url: "/faq", icon: "/icons/book.png" },
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
  onLoadingComplete,
}) {
  let loadingRevealStarted = false;
  let fabOrbitAnimating = false;
  let fabExpanded = false;
  let assetsLoaded = false;
  let loadingLogoDrawDone = true;

  function initLoadingFab() {
    if (!loadingScreen || loadingScreen.dataset.fabBound === "true") return;
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

    const modalNameMap = {
      about: "about",
      guitar: "guitar",
      archive: "archive",
      reflectiv: "reflectiv",
      music: "nowplaying",
      "now playing": "nowplaying",
      blu: "blu",
      dissertation: "book",
    };

    const openCurrentPage = () => {
      const page = PAGES[wrapPageIndex(currentPageIndex)];
      const showModal = typeof getShowModal === "function" ? getShowModal() : null;
      const modals = typeof getModals === "function" ? getModals() : null;
      if (!page || !showModal || !modals) return;
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
      if (centerPage) {
        centerIconImg.src = centerPage.icon;
        centerIconImg.alt = centerPage.name;
      }

      wheelButtons.forEach((button, slotIndex) => {
        const slotOffset = slotOffsets[slotIndex];
        const pageIndex = wrapPageIndex(currentPageIndex + slotOffset);
        const page = PAGES[pageIndex];
        if (!page) return;

        const { x, y, fontSize, opacity } = getWheelMetrics(slotOffset);

        button.textContent = page.name;
        button.dataset.relative = String(slotOffset);
        button.dataset.pageIndex = String(pageIndex);
        button.classList.toggle("is-center", slotOffset === 0);
        button.style.zIndex = String(20 - Math.abs(slotOffset));
        button.style.pointerEvents = Math.abs(slotOffset) <= visibleLimit ? "auto" : "none";
        button.setAttribute("aria-label", page.name);
        gsap.set(button, {
          x,
          y,
          scale: 1,
          opacity,
          fontSize: `${fontSize}px`,
          force3D: false,
        });
      });
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
    const targetCenterX = fabMargin + fabSize / 2;
    const targetCenterY = fabTop + fabSize / 2;
    const deltaX = targetCenterX - window.innerWidth / 2;
    const deltaY = targetCenterY - window.innerHeight / 2;
    loadingScreen.style.setProperty("--fab-size", `${fabSize}px`);
    loadingScreen.style.setProperty("--fab-margin", `${fabMargin}px`);

    const tl = gsap.timeline();
    tl.to(loadingScreen, {
      scale: 0.64,
      duration: 1.05,
      ease: "power3.out",
    });

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
        x: deltaX,
        y: deltaY,
        width: fabSize,
        height: fabSize,
        borderWidth: 4,
        borderRadius: `${fabCorner}px ${fabCorner}px ${fabCorner}px 0px`,
        scale: 1,
        duration: 1.05,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(loadingScreen, { clearProps: "transform,left,top,x,y,scale" });
          loadingScreen.classList.add("loading-screen--fab");
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
        if (assetsLoaded) playLoadingReveal();
      },
    });
  }

  function markAssetsLoaded() {
    assetsLoaded = true;
    if (loadingLogoDrawDone) playLoadingReveal();
  }

  return {
    init,
    markAssetsLoaded,
  };
}
