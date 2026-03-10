import * as THREE from "three";

const SVG_NS = "http://www.w3.org/2000/svg";

const worldPosition = new THREE.Vector3();
const projectedPosition = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createAnnotationElements(config) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "annotation-card";
  button.setAttribute("aria-label", config.ariaLabel || config.body || config.title || "Open annotation");
  button.tabIndex = -1;
  button.innerHTML = `
    <span class="annotation-card-surface">
      ${config.title ? `<span class="annotation-card-eyebrow">${escapeHtml(config.title)}</span>` : ""}
      <span class="annotation-card-body">${escapeHtml(config.body)}</span>
    </span>
  `;

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("class", "annotation-line");

  const dot = document.createElementNS(SVG_NS, "circle");
  dot.setAttribute("class", "annotation-dot");
  dot.setAttribute("r", "3.5");

  return { button, path, dot };
}

export function createAnnotationFeature({
  camera,
  annotations = [],
  rootParent = document.body,
  maxVisible = 1,
  getIsSuppressed = () => false,
}) {
  const root = document.createElement("div");
  root.className = "annotation-overlay";
  root.setAttribute("aria-hidden", "false");

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "annotation-overlay-lines");
  svg.setAttribute("aria-hidden", "true");
  root.append(svg);
  rootParent.append(root);

  const items = annotations.map((annotation, index) => {
    const { button, path, dot } = createAnnotationElements(annotation);

    const item = {
      id: annotation.id || `annotation-${index}`,
      modal: annotation.modal || null,
      target: annotation.target || null,
      onActivate: annotation.onActivate || null,
      preferredSide:
        annotation.preferredSide === "left" || annotation.preferredSide === "right"
          ? annotation.preferredSide
          : "auto",
      priority: Number(annotation.priority || 0),
      idleMs: Math.max(0, Number(annotation.idleMs || 18000)),
      maxDistance: Number(annotation.maxDistance || 72),
      screenMargin: Number(annotation.screenMargin || 24),
      offsetX: Number(annotation.offsetX || 168),
      offsetY: Number(annotation.offsetY || -88),
      anchorOffset: annotation.anchorOffset || new THREE.Vector3(),
      button,
      path,
      dot,
      cardWidth: 0,
      cardHeight: 0,
      lastOpenedAt: performance.now(),
      isVisible: false,
    };

    button.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      item.lastOpenedAt = performance.now();
      if (typeof item.onActivate === "function") {
        item.onActivate(item);
      }
    });

    root.append(button);
    svg.append(path, dot);

    return item;
  });

  const itemsById = new Map(items.map((item) => [item.id, item]));

  function hideItem(item) {
    item.isVisible = false;
    item.button.classList.remove("is-visible");
    item.button.setAttribute("aria-hidden", "true");
    item.button.tabIndex = -1;
    item.path.classList.remove("is-visible");
    item.dot.classList.remove("is-visible");
  }

  function showItem(item, layout) {
    item.button.style.setProperty("--annotation-x", `${layout.cardLeft}px`);
    item.button.style.setProperty("--annotation-y", `${layout.cardTop}px`);
    item.button.style.transformOrigin = layout.direction > 0 ? "center left" : "center right";
    item.button.classList.add("is-visible");
    item.button.removeAttribute("aria-hidden");
    item.button.tabIndex = 0;

    item.path.setAttribute("d", layout.path);
    item.path.classList.add("is-visible");
    item.dot.setAttribute("cx", String(layout.anchorX));
    item.dot.setAttribute("cy", String(layout.anchorY));
    item.dot.classList.add("is-visible");

    item.isVisible = true;
  }

  function measureCard(item) {
    item.cardWidth = item.button.offsetWidth || item.cardWidth || 220;
    item.cardHeight = item.button.offsetHeight || item.cardHeight || 86;
  }

  function getCandidateLayout(item, now) {
    if (!item.target) return null;
    if (now - item.lastOpenedAt < item.idleMs) return null;

    item.target.getWorldPosition(worldPosition);
    worldPosition.add(item.anchorOffset);

    camera.getWorldPosition(cameraPosition);
    if (cameraPosition.distanceTo(worldPosition) > item.maxDistance) return null;

    projectedPosition.copy(worldPosition).project(camera);
    if (projectedPosition.z <= -1 || projectedPosition.z >= 1) return null;
    if (Math.abs(projectedPosition.x) > 1.2 || Math.abs(projectedPosition.y) > 1.2) return null;

    measureCard(item);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const anchorX = ((projectedPosition.x + 1) * 0.5) * viewportWidth;
    const anchorY = ((1 - projectedPosition.y) * 0.5) * viewportHeight;
    const direction =
      item.preferredSide === "left"
        ? -1
        : item.preferredSide === "right"
          ? 1
          : anchorX > viewportWidth * 0.54
            ? -1
            : 1;
    const cardLeft = clamp(
      direction > 0 ? anchorX + item.offsetX : anchorX - item.offsetX - item.cardWidth,
      item.screenMargin,
      viewportWidth - item.cardWidth - item.screenMargin,
    );
    const cardTop = clamp(
      anchorY + item.offsetY,
      item.screenMargin,
      viewportHeight - item.cardHeight - item.screenMargin,
    );
    const lineEndX = direction > 0 ? cardLeft + 2 : cardLeft + item.cardWidth - 2;
    const lineEndY = cardTop + item.cardHeight * 0.5;
    const bendX = clamp(
      anchorX + direction * Math.max(34, Math.min(item.offsetX * 0.46, 76)),
      item.screenMargin,
      viewportWidth - item.screenMargin,
    );
    const leadX = lineEndX - direction * 12;
    const path = `M ${anchorX} ${anchorY} L ${bendX} ${anchorY} L ${leadX} ${lineEndY} L ${lineEndX} ${lineEndY}`;

    return {
      item,
      score: now - item.lastOpenedAt + item.priority * 1000,
      cardLeft,
      cardTop,
      anchorX,
      anchorY,
      direction,
      path,
    };
  }

  function registerTarget(id, target) {
    const item = itemsById.get(id);
    if (!item) return;
    item.target = target || null;
  }

  function notifyModalShown(modal) {
    if (!modal) return;

    items.forEach((item) => {
      if (item.modal !== modal) return;
      item.lastOpenedAt = performance.now();
      hideItem(item);
    });
  }

  function update(now = performance.now()) {
    if (getIsSuppressed()) {
      items.forEach(hideItem);
      return;
    }

    const candidates = items
      .map((item) => getCandidateLayout(item, now))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    const visibleIds = new Set();

    candidates.slice(0, Math.max(1, maxVisible)).forEach((candidate) => {
      visibleIds.add(candidate.item.id);
      showItem(candidate.item, candidate);
    });

    items.forEach((item) => {
      if (visibleIds.has(item.id)) return;
      hideItem(item);
    });
  }

  function destroy() {
    root.remove();
  }

  items.forEach(hideItem);

  return {
    destroy,
    notifyModalShown,
    registerTarget,
    update,
  };
}
