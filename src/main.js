import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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

const showModal = (modal) => {
  modal.style.display = "block";

  gsap.set(modal, { opacity: 0});

  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
  });
};

const hideModal = (modal) => {
  gsap.to(modal, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      modal.style.display = "none";
    },
  });
};

const yAxisVinyl = []

const raycasterObjects = [];
let currentIntersects = [];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

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
  e.preventDefault()
  pointer.x = ( e.touches[0].clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
  },
  { passive: false }
);

window.addEventListener("touchend", (e) => {
  e.preventDefault()
  handleRaycasterInteraction()
  },
  { passive: false }
);

function handleRaycasterInteraction(){
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    if (object.name.includes("Blu")) {
      showModal(modals.blu);
    } else if (object.name.includes("Vinyl")) {
      showModal(modals.reflectiv);
    } else if (object.name.includes("Bin")) {
      showModal(modals.archive);
    }
  }
}

window.addEventListener("click", handleRaycasterInteraction);


loader.load("/models/Room_Portfolio.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
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
  raycaster.setFromCamera( pointer, camera);

  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  for (let i = 0; i < currentIntersects.length; i++) {
  }

  if (currentIntersects.length > 0) {
    const currentIntersectObject = currentIntersects[0].object

    if (currentIntersectObject.name.includes("Pointer")) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  } else {
    document.body.style.cursor = "default";
  }

  renderer.render( scene, camera );

  window.requestAnimationFrame(render);
}

render();
