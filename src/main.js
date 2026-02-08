import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from './utils/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from "gsap"

const canvas = document.querySelector("#experience-canvas")
const sizes ={
  width: window.innerWidth,
  height: window.innerHeight
}

const modals = {
  blu: document.querySelector(".modal.blu"),
  reflectiv: document.querySelector(".modal.reflectiv"),
  archive: document.querySelector(".modal.archive"),
};

let touchHappened = false;
document.querySelectorAll(".modal-exit-button").forEach(button => {
  button.addEventListener(
    "touchend",
    (e) => {
      touchHappened = true;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModal(modal);
    },
    {passive: false }
  );

  button.addEventListener(
    "click",
    (e) => {
      if(touchHappened) return;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModal(modal);
    },
    {passive: false }
  );
});

let isModalOpen = false;

const showModal = (modal) => {
  modal.style.display = "block";
  isModalOpen = true;
  controls.enabled = false;

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }

  document.body.style.cursor = 'default';
  currentIntersects = [];

  gsap.set(modal, { opacity: 0});

  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
  });
};

const hideModal = (modal) => {
  isModalOpen = false;
  controls.enabled = true;

  gsap.to(modal, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      modal.style.display = "none";
    },
  });
};

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

const yAxisVinyl = []

const raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const hoverGroups = new Map();

// Loaders
const textureLoader = new THREE.TextureLoader();

// Model loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( '/draco/' );

const loader = new GLTFLoader();
loader.setDRACOLoader( dracoLoader );

const environmentMap = new THREE.CubeTextureLoader()
  .setPath( 'textures/skybox/' )
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

window.addEventListener("mousemove", (e) => {
  touchHappened = false;
  pointer.x = ( e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("touchstart", (e) => {
  if(isModalOpen) return;
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

function handleRaycasterInteraction() {
  if (isModalOpen) return;
  if (currentIntersects.length === 0) return;

  const hitObject = currentIntersects[0].object;

  const stringIndex = getGuitarStringIndex(hitObject);
  if (stringIndex) {
    playStringSoundByIndex(stringIndex);
    return;
  }

  if (hitObject.name.includes("Blu")) {
    showModal(modals.blu);
  } else if (hitObject.name.includes("Vinyl")) {
    showModal(modals.reflectiv);
  } else if (hitObject.name.includes("Bin")) {
    showModal(modals.archive);
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


loader.load("/models/Room_Portfolio_V3.glb", (glb) => {
  let guitarMesh = null;
  const guitarParts = [];

  glb.scene.traverse((child) => {
    if (child.isMesh) {
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
      if (raycasterNameTags.some((tag) => child.name.includes(tag))) {
        raycasterObjects.push(child);
      }

      if (child.name.includes("Hover")) {
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
        child.userData.initialRotation = new THREE.Vector3().copy(child.rotation);
      }

      if (child.name.includes("Water")) {
          child.material = new THREE.MeshBasicMaterial({
            color: 0x558bc8,
            transparent: true,
            opacity: 0.66,
            depthWrite: false,
          });
        } else if (child.name.includes("Glass")){
          child.material = glassMaterial;
        }
          else if (child.name.includes("Screen_2")){
          child.material = screenVideoMaterial;
          child.renderOrder = 1;

          const glassOverlay = child.clone();
          glassOverlay.material = screenGlassMaterial;
          glassOverlay.renderOrder = 2;
          
          child.parent.add(glassOverlay);
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

    raycasterObjects.push(guitarGroup);
  }
});



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
})

function playHoverAnimation (object, isHovering){
  gsap.killTweensOf(object.scale);

  const canRotate = object.name.includes("Otamatone");
  if (canRotate) {
    gsap.killTweensOf (object.rotation);
  }

  if (isHovering){
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * 1.2,
      y: object.userData.initialScale.y * 1.2,
      z: object.userData.initialScale.z * 1.2,
      duration: 0.5,
      ease: "bounce.out(1.8)",
    });

  if (canRotate) {
    gsap.to(object.rotation, {
      x: object.userData.initialRotation.x - Math.PI / 20,
      duration: 0.5,
      ease: "bounce.out(1.8)",
    });
  }
    
  } else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "bounce.out(1.8)",
    });

    if (canRotate) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x,
        duration: 0.3,
        ease: "bounce.out(1.8)",
      });
    }
  }
}

const render = () =>{
  controls.update();

  // console.log(camera.position);
  // console.log("0000000000");
  // console.log(controls.target);

  // animate vinyl
  yAxisVinyl.forEach((fan) => {
    fan.rotation.y += 0.03;
  });

  // Raycaster
  if (!isModalOpen){
    raycaster.setFromCamera( pointer, camera);
    
    currentIntersects = raycaster.intersectObjects(raycasterObjects, true);
    
    for (let i = 0; i < currentIntersects.length; i++) {
    }
    
    if (currentIntersects.length > 0) {
      const hitObject = currentIntersects[0].object;
      
      const hoverRoot = getHoverRoot(hitObject);

      if (hoverRoot.name.includes("Hover")) {
        if (hoverRoot !== currentHoveredObject) {
          
          if(currentHoveredObject){
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
      

    document.body.style.cursor = hitObject.name.includes("Pointer") ? "pointer" : "default";
  } else {

      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }
    
    renderer.render( scene, camera );
    
    window.requestAnimationFrame(render);
}
  
render();
