export function createModalManager({
  modals,
  gsap,
  onBeforeShow = null,
  onShowAbout = null,
  onShowBlu = null,
  onShowNowPlaying = null,
  onShowReflectiv = null,
  modalMargin = 16,
  initialZIndex = 10000,
}) {
  let modalZIndex = initialZIndex;
  let touchHappened = false;

  function clampModalPosition(modal, left, top) {
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
    const clamped = clampModalPosition(modal, left, top);
    modal.style.left = `${clamped.left}px`;
    modal.style.top = `${clamped.top}px`;
  }

  function centerModal(modal) {
    const rect = modal.getBoundingClientRect();
    const left = (window.innerWidth - rect.width) / 2;
    const top = (window.innerHeight - rect.height) / 2;
    placeModalAt(modal, left, top);
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

    gsap.to(modal, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        modal.style.display = "none";
      },
    });
  }

  function showModal(modal) {
    if (!modal) return;

    modal.style.display = "block";
    bringModalToFront(modal);

    if (!modal.dataset.positioned) {
      centerModal(modal);
      modal.dataset.positioned = "true";
    } else {
      const rect = modal.getBoundingClientRect();
      placeModalAt(modal, rect.left, rect.top);
    }

    if (typeof onBeforeShow === "function") {
      onBeforeShow();
    }

    gsap.set(modal, { opacity: 0 });
    gsap.to(modal, {
      opacity: 1,
      duration: 0.5,
    });

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
      if (modal) setupDraggableModal(modal);
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
