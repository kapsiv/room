export function createModalManager({
  modals,
  gsap,
  onBeforeShow = null,
  onShowAbout = null,
  onShowBlu = null,
  onShowNowPlaying = null,
  onShowReflectiv = null,
  onShowLogo = null,
  onShowModelling = null,
  modalMargin = 16,
  mobileBreakpoint = 760,
  mobileViewportInset = 12,
  initialZIndex = 10000,
}) {
  let modalZIndex = initialZIndex;
  let touchHappened = false;

  function isMobileModalLayout() {
    return window.matchMedia(`(max-width: ${mobileBreakpoint}px)`).matches;
  }

  function clampModalPosition(modal, left, top) {
    if (isMobileModalLayout()) {
      const rect = modal.getBoundingClientRect();
      const width = modal.offsetWidth || rect.width;
      const height = modal.offsetHeight || rect.height;
      return {
        left: Math.max((window.innerWidth - width) / 2, mobileViewportInset),
        top: Math.max((window.innerHeight - height) / 2, mobileViewportInset),
      };
    }

    const rect = modal.getBoundingClientRect();
    const maxLeft = Math.max(modalMargin, window.innerWidth - rect.width - modalMargin);
    const maxTop = Math.max(modalMargin, window.innerHeight - rect.height - modalMargin);

    return {
      left: Math.min(Math.max(modalMargin, left), maxLeft),
      top: Math.min(Math.max(modalMargin, top), maxTop),
    };
  }

  function bringModalToFront(modal) {
    modalZIndex += 1;
    modal.style.zIndex = String(modalZIndex);
  }

  function placeModalAt(modal, left, top) {
    syncModalViewportConstraints(modal);
    const clamped = clampModalPosition(modal, left, top);
    modal.style.right = "auto";
    modal.style.left = `${clamped.left}px`;
    modal.style.top = `${clamped.top}px`;
  }

  function centerModal(modal) {
    syncModalViewportConstraints(modal);
    const rect = modal.getBoundingClientRect();
    const left = (window.innerWidth - rect.width) / 2;
    const top = (window.innerHeight - rect.height) / 2;
    placeModalAt(modal, left, top);
  }

  function clearModalViewportConstraints(modal) {
    if (!modal) return;
    modal.style.removeProperty("max-height");
    const content = modal.querySelector(".modal-window-content");
    content?.style.removeProperty("max-height");
  }

  function syncModalViewportConstraints(modal) {
    if (!modal) return;

    if (!isMobileModalLayout()) {
      clearModalViewportConstraints(modal);
      return;
    }

    const availableHeight = Math.max(220, window.innerHeight - mobileViewportInset * 2);
    modal.style.maxHeight = `${availableHeight}px`;

    const content = modal.querySelector(".modal-window-content");
    if (!content) return;

    content.style.removeProperty("max-height");

    const chromeHeight = Array.from(modal.children).reduce((total, child) => {
      if (child === content) return total;
      return total + child.getBoundingClientRect().height;
    }, 0);
    const availableContentHeight = Math.max(120, availableHeight - chromeHeight - 6);

    content.style.maxHeight = `${availableContentHeight}px`;
  }

  function setupModalTitleIcon(modal) {
    const iconPath = modal?.dataset.modalIcon;
    const titleEl = modal?.querySelector(".modal-window-title");
    if (!iconPath || !titleEl || titleEl.querySelector(".modal-window-title-icon")) return;

    const iconEl = document.createElement("span");
    iconEl.className = "modal-window-title-icon";
    iconEl.setAttribute("aria-hidden", "true");
    iconEl.style.setProperty("--modal-title-icon", `url("${iconPath}")`);
    titleEl.prepend(iconEl);
  }

  function setupDraggableModal(modal) {
    const handle = modal.querySelector(".modal-window-bar");
    if (!handle) return;

    let activePointerId = null;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const endDrag = () => {
      activePointerId = null;
      modal.classList.remove("dragging");
    };

    handle.addEventListener("pointerdown", (e) => {
      if (isMobileModalLayout()) return;
      const isMouse = e.pointerType === "mouse";
      if (isMouse && e.button !== 0) return;
      if (e.target.closest(".modal-exit-button")) return;

      e.preventDefault();
      activePointerId = e.pointerId;

      const rect = modal.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      bringModalToFront(modal);
      modal.classList.add("dragging");
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener("pointermove", (e) => {
      if (activePointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      placeModalAt(modal, startLeft + dx, startTop + dy);
    });

    handle.addEventListener("pointerup", (e) => {
      if (activePointerId !== e.pointerId) return;
      handle.releasePointerCapture(e.pointerId);
      endDrag();
    });

    handle.addEventListener("pointercancel", endDrag);

    modal.addEventListener("click", (e) => e.stopPropagation());
    modal.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    modal.addEventListener("touchend", (e) => e.stopPropagation(), { passive: true });
  }

  function hideModal(modal) {
    if (!modal) return;

    gsap.killTweensOf(modal);
    if (isMobileModalLayout()) {
      gsap.to(modal, {
        opacity: 0,
        scale: 0.94,
        y: 18,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(modal, { clearProps: "scale,y,transformOrigin" });
          modal.style.display = "none";
        },
      });
      return;
    }

    gsap.to(modal, {
      opacity: 0,
      scale: 0.9,
      y: 22,
      duration: 0.24,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(modal, { clearProps: "scale,y,transformOrigin" });
        modal.style.display = "none";
      },
    });
  }

  function hideModalImmediately(modal) {
    if (!modal) return;
    gsap.killTweensOf(modal);
    gsap.set(modal, {
      opacity: 0,
      scale: 1,
      y: 0,
      clearProps: "scale,y,transformOrigin",
    });
    modal.style.display = "none";
  }

  function hideAllModals({ except = null, immediate = false } = {}) {
    Object.values(modals).forEach((modal) => {
      if (!modal || modal === except || modal.style.display === "none") return;
      if (immediate) {
        hideModalImmediately(modal);
        return;
      }
      hideModal(modal);
    });
  }

  function showModal(modal) {
    if (!modal) return;

    if (isMobileModalLayout()) {
      hideAllModals({ except: modal, immediate: true });
    }

    modal.style.display = "block";
    bringModalToFront(modal);

    if (isMobileModalLayout()) {
      centerModal(modal);
      modal.dataset.positioned = "true";
    } else if (!modal.dataset.positioned) {
      centerModal(modal);
      modal.dataset.positioned = "true";
    } else {
      const rect = modal.getBoundingClientRect();
      placeModalAt(modal, rect.left, rect.top);
    }

    if (typeof onBeforeShow === "function") {
      onBeforeShow();
    }

    gsap.killTweensOf(modal);
    if (isMobileModalLayout()) {
      gsap.set(modal, {
        opacity: 0,
        scale: 0.94,
        y: 18,
        transformOrigin: "50% 50%",
      });
      gsap.to(modal, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "back.out(1.5)",
      });
    } else {
      gsap.set(modal, {
        opacity: 0,
        scale: 0.9,
        y: 22,
        transformOrigin: "50% 50%",
      });
      gsap.to(modal, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "back.out(1.45)",
      });
    }

    if (modal === modals.about && typeof onShowAbout === "function") {
      onShowAbout(modal, { showModal, hideModal });
    }

    if (modal === modals.blu && typeof onShowBlu === "function") {
      onShowBlu(modal, { showModal, hideModal });
    }

    if (modal === modals.nowplaying && typeof onShowNowPlaying === "function") {
      onShowNowPlaying(modal, { showModal, hideModal });
    }

    if (modal === modals.reflectiv && typeof onShowReflectiv === "function") {
      onShowReflectiv(modal, { showModal, hideModal });
    }

    if (modal === modals.logo && typeof onShowLogo === "function") {
      onShowLogo(modal, { showModal, hideModal });
    }

    if (modal === modals.modelling && typeof onShowModelling === "function") {
      onShowModelling(modal, { showModal, hideModal });
    }

    if (isMobileModalLayout()) {
      centerModal(modal);
    }
  }

  function setupCloseButtons() {
    document.querySelectorAll(".modal-exit-button").forEach((button) => {
      button.addEventListener(
        "touchend",
        (e) => {
          touchHappened = true;
          e.preventDefault();
          const modal = e.target.closest(".modal");
          hideModal(modal);
        },
        { passive: false }
      );

      button.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        hideAllModals();
      });

      button.addEventListener(
        "click",
        (e) => {
          if (touchHappened) return;
          e.preventDefault();
          const modal = e.target.closest(".modal");
          hideModal(modal);
        },
        { passive: false }
      );
    });
  }

  function init() {
    Object.values(modals).forEach((modal) => {
      if (!modal) return;
      setupModalTitleIcon(modal);
      setupDraggableModal(modal);
    });
    setupCloseButtons();
  }

  return {
    init,
    bringModalToFront,
    placeModalAt,
    centerModal,
    showModal,
    hideModal,
  };
}
