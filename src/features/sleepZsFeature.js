import * as THREE from "three";

const anchorWorldPosition = new THREE.Vector3();
const boundsSize = new THREE.Vector3();
const boundsCenter = new THREE.Vector3();

function createZTexture(label, fontSize) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize}px "Ubuntu Mono", monospace`;
  ctx.fillStyle = "rgba(244, 240, 232, 0.98)";
  ctx.shadowColor = "rgba(255, 252, 245, 0.28)";
  ctx.shadowBlur = 12;
  ctx.fillText(label, size * 0.52, size * 0.52);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

export function createSleepZsFeature({ scene, target } = {}) {
  if (!scene || !target?.isObject3D) {
    return {
      update() {},
    };
  }

  if (target.geometry && !target.geometry.boundingBox) {
    target.geometry.computeBoundingBox();
  }

  const localBounds = target.geometry?.boundingBox?.clone()
    || new THREE.Box3(
      new THREE.Vector3(-0.18, -0.08, -0.18),
      new THREE.Vector3(0.18, 0.08, 0.18),
    );

  localBounds.getSize(boundsSize);
  localBounds.getCenter(boundsCenter);

  const anchorLocalPosition = boundsCenter.clone().add(
    new THREE.Vector3(
      boundsSize.x * 0.2,
      -boundsSize.y * 0.52,
      boundsSize.z * 0.34,
    ),
  );

  const root = new THREE.Group();
  root.name = `${target.name}_SleepZs`;
  scene.add(root);

  const zConfigs = [
    {
      label: "z",
      delay: 0,
      driftX: -0.012,
      driftZ: 0.008,
      riseHeight: 0.21,
      scale: 0.28,
      opacity: 0.22,
      phase: 0.2,
      fontSize: 164,
    },
    {
      label: "z",
      delay: 0.34,
      driftX: 0.014,
      driftZ: -0.004,
      riseHeight: 0.31,
      scale: 0.34,
      opacity: 0.2,
      phase: 1.1,
      fontSize: 176,
    },
    {
      label: "Z",
      delay: 0.68,
      driftX: 0.026,
      driftZ: 0.014,
      riseHeight: 0.42,
      scale: 0.42,
      opacity: 0.18,
      phase: 2.1,
      fontSize: 190,
    },
  ];

  const sprites = zConfigs.map((config) => {
    const texture = createZTexture(config.label, config.fontSize);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      color: new THREE.Color("#f4efe6"),
    });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 6;
    sprite.scale.set(config.scale, config.scale, 1);
    sprite.userData = { ...config, texture };
    root.add(sprite);
    return sprite;
  });

  function update(timestamp = 0) {
    const time = timestamp * 0.001;

    target.updateWorldMatrix(true, false);
    anchorWorldPosition.copy(anchorLocalPosition);
    target.localToWorld(anchorWorldPosition);
    root.position.copy(anchorWorldPosition);

    sprites.forEach((sprite) => {
      const {
        delay,
        driftX,
        driftZ,
        riseHeight,
        scale,
        opacity,
        phase,
      } = sprite.userData;

      const cycle = (time * 0.22 + delay) % 1;
      const rise = THREE.MathUtils.smoothstep(cycle, 0, 1);
      const fadeIn = THREE.MathUtils.smoothstep(cycle, 0, 0.18);
      const fadeOut = 1 - THREE.MathUtils.smoothstep(cycle, 0.58, 1);
      const swayX = Math.sin(time * 0.9 + phase) * 0.01;
      const swayZ = Math.cos(time * 0.7 + phase) * 0.008;

      sprite.position.set(
        driftX * rise + swayX * rise,
        0.12 + riseHeight * rise,
        driftZ * rise + swayZ * rise,
      );

      const currentScale = scale * (0.88 + rise * 0.5);
      sprite.scale.set(currentScale, currentScale, 1);
      sprite.material.opacity = opacity * fadeIn * fadeOut;
    });
  }

  return {
    update,
  };
}
