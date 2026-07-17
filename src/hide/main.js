import './styles.css';

const LONDON_CENTER = { lat: 51.5072, lng: -0.1276 };
const DEFAULT_ZOOM = 11;
const RADIUS_OPTIONS = [
  { value: 100, label: '100 m' },
  { value: 200, label: '200 m' },
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 3000, label: '3 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
];

const radiusSelect = document.querySelector('#radius-select');
const armPlaceButton = document.querySelector('#arm-place');
const locateMeButton = document.querySelector('#locate-me');
const fitCirclesButton = document.querySelector('#fit-circles');
const undoCircleButton = document.querySelector('#undo-circle');
const clearCirclesButton = document.querySelector('#clear-circles');
const toggleMapTypeButton = document.querySelector('#toggle-map-type');
const rollOneButton = document.querySelector('#roll-one');
const rollTwoButton = document.querySelector('#roll-two');
const diceResult = document.querySelector('#dice-result');
const statusElement = document.querySelector('#status');
const circleCountElement = document.querySelector('#circle-count');
const circleListElement = document.querySelector('#circle-list');

const state = {
  map: null,
  circles: [],
  isPlacementArmed: false,
  selectedRadius: 500,
  isSatellite: false,
};

function getApiKey() {
  const apiKey = document.body.dataset.googleMapsApiKey?.trim() ?? '';
  if (!apiKey || apiKey.startsWith('%VITE_')) {
    return '';
  }
  return apiKey;
}

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    const callbackName = '__hideMapInit';
    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      '&v=weekly&callback=__hideMapInit';
    script.async = true;
    script.onerror = () => reject(new Error('Google Maps failed to load.'));
    document.head.append(script);
  });
}

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.dataset.error = isError ? 'true' : 'false';
}

function formatRadius(radius) {
  if (radius >= 1000) {
    const km = radius / 1000;
    return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
  }
  return `${radius} m`;
}

function formatCoordinate(value) {
  return value.toFixed(4);
}

function getCircleColor(radius) {
  const maxIndex = Math.max(RADIUS_OPTIONS.length - 1, 1);
  const index = RADIUS_OPTIONS.findIndex((option) => option.value === radius);
  const hue = 212 - Math.max(index, 0) * (132 / maxIndex);
  return `hsl(${hue} 82% 46%)`;
}

function renderRadiusOptions() {
  radiusSelect.innerHTML = '';

  for (const option of RADIUS_OPTIONS) {
    const element = document.createElement('option');
    element.value = String(option.value);
    element.textContent = option.label;
    if (option.value === state.selectedRadius) {
      element.selected = true;
    }
    radiusSelect.append(element);
  }
}

function updateControlState() {
  armPlaceButton.dataset.armed = state.isPlacementArmed ? 'true' : 'false';
  armPlaceButton.textContent = state.isPlacementArmed ? 'Tap map now' : 'Place circle';
  undoCircleButton.disabled = state.circles.length === 0;
  clearCirclesButton.disabled = state.circles.length === 0;
  fitCirclesButton.disabled = state.circles.length === 0;
  toggleMapTypeButton.textContent = state.isSatellite ? 'Map' : 'Satellite';
  circleCountElement.textContent =
    state.circles.length === 1 ? '1 circle' : `${state.circles.length} circles`;
}

function renderCircleList() {
  circleListElement.innerHTML = '';

  if (state.circles.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No circles yet.';
    circleListElement.append(emptyState);
    return;
  }

  const circles = [...state.circles].reverse();

  for (const circleEntry of circles) {
    const item = document.createElement('article');
    item.className = 'circle-card';

    const title = document.createElement('div');
    title.className = 'circle-card-title';
    title.textContent = formatRadius(circleEntry.radius);

    const subtitle = document.createElement('div');
    subtitle.className = 'circle-card-subtitle';
    subtitle.textContent =
      `${formatCoordinate(circleEntry.center.lat)}, ` +
      `${formatCoordinate(circleEntry.center.lng)}`;

    const actions = document.createElement('div');
    actions.className = 'circle-card-actions';

    const focusButton = document.createElement('button');
    focusButton.type = 'button';
    focusButton.textContent = 'Focus';
    focusButton.addEventListener('click', () => focusCircle(circleEntry.id));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => removeCircle(circleEntry.id));

    actions.append(focusButton, deleteButton);
    item.append(title, subtitle, actions);
    circleListElement.append(item);
  }
}

function persistCircleState() {
  const serializableCircles = state.circles.map((circleEntry) => ({
    id: circleEntry.id,
    radius: circleEntry.radius,
    center: circleEntry.center,
  }));

  localStorage.setItem('hide-map-circles', JSON.stringify(serializableCircles));
}

function addCircle(center, radius) {
  const color = getCircleColor(radius);
  const circleOverlay = new google.maps.Circle({
    map: state.map,
    center,
    radius,
    strokeColor: color,
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: color,
    fillOpacity: 0.12,
    clickable: false,
  });

  const marker = new google.maps.Marker({
    map: state.map,
    position: center,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    },
    zIndex: 10,
  });

  const circleEntry = {
    id: crypto.randomUUID(),
    center,
    radius,
    color,
    circleOverlay,
    marker,
  };

  state.circles.push(circleEntry);
  persistCircleState();
  renderCircleList();
  updateControlState();
  setStatus(`${formatRadius(radius)} circle placed. Pan and zoom normally.`);
}

function removeCircle(circleId) {
  const circleIndex = state.circles.findIndex((circleEntry) => circleEntry.id === circleId);
  if (circleIndex === -1) {
    return;
  }

  const [circleEntry] = state.circles.splice(circleIndex, 1);
  circleEntry.circleOverlay.setMap(null);
  circleEntry.marker.setMap(null);

  persistCircleState();
  renderCircleList();
  updateControlState();
  setStatus('Circle removed.');
}

function clearAllCircles() {
  for (const circleEntry of state.circles) {
    circleEntry.circleOverlay.setMap(null);
    circleEntry.marker.setMap(null);
  }

  state.circles = [];
  persistCircleState();
  renderCircleList();
  updateControlState();
  setStatus('All circles cleared.');
}

function focusCircle(circleId) {
  const circleEntry = state.circles.find((entry) => entry.id === circleId);
  if (!circleEntry) {
    return;
  }

  state.map.panTo(circleEntry.center);
  state.map.fitBounds(circleEntry.circleOverlay.getBounds(), 72);
  setStatus(`Focused ${formatRadius(circleEntry.radius)} circle.`);
}

function fitAllCircles() {
  if (state.circles.length === 0) {
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  for (const circleEntry of state.circles) {
    bounds.union(circleEntry.circleOverlay.getBounds());
  }
  state.map.fitBounds(bounds, 72);
  setStatus('Map fitted to all circles.');
}

function restoreCircles() {
  const savedValue = localStorage.getItem('hide-map-circles');
  if (!savedValue) {
    renderCircleList();
    updateControlState();
    return;
  }

  try {
    const savedCircles = JSON.parse(savedValue);
    if (!Array.isArray(savedCircles)) {
      throw new Error('Invalid saved circles.');
    }

    for (const circleEntry of savedCircles) {
      if (
        typeof circleEntry.radius !== 'number' ||
        typeof circleEntry.center?.lat !== 'number' ||
        typeof circleEntry.center?.lng !== 'number'
      ) {
        continue;
      }

      addCircle(circleEntry.center, circleEntry.radius);
    }
  } catch {
    localStorage.removeItem('hide-map-circles');
    setStatus('Saved circles could not be restored.', true);
  }
}

function armPlacement() {
  state.isPlacementArmed = !state.isPlacementArmed;
  updateControlState();

  if (state.isPlacementArmed) {
    setStatus(`Tap the map to place a ${formatRadius(state.selectedRadius)} circle.`);
    return;
  }

  setStatus('Placement cancelled.');
}

function locateMe() {
  if (!navigator.geolocation) {
    setStatus('This browser does not support location.', true);
    return;
  }

  locateMeButton.disabled = true;
  setStatus('Requesting your location...');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const nextCenter = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      state.map.panTo(nextCenter);
      state.map.setZoom(Math.max(state.map.getZoom(), 14));
      locateMeButton.disabled = false;
      setStatus('Map centred on your location.');
    },
    () => {
      locateMeButton.disabled = false;
      setStatus('Location was unavailable or denied.', true);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 15000,
    }
  );
}

function rollDice(count) {
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
  const total = rolls.reduce((sum, value) => sum + value, 0);
  diceResult.textContent = count === 1 ? `${rolls[0]}` : `${rolls.join(' + ')} = ${total}`;
}

function buildMap() {
  state.map = new google.maps.Map(document.querySelector('#map'), {
    center: LONDON_CENTER,
    zoom: DEFAULT_ZOOM,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    clickableIcons: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    rotateControl: false,
    keyboardShortcuts: false,
    gestureHandling: 'greedy',
    disableDoubleClickZoom: true,
  });

  state.map.addListener('click', (event) => {
    if (!state.isPlacementArmed) {
      return;
    }

    addCircle(event.latLng.toJSON(), state.selectedRadius);
    state.isPlacementArmed = false;
    updateControlState();
  });
}

function bindControls() {
  radiusSelect.addEventListener('change', (event) => {
    state.selectedRadius = Number(event.target.value);
    if (state.isPlacementArmed) {
      setStatus(`Tap the map to place a ${formatRadius(state.selectedRadius)} circle.`);
    }
  });

  armPlaceButton.addEventListener('click', armPlacement);
  locateMeButton.addEventListener('click', locateMe);
  fitCirclesButton.addEventListener('click', fitAllCircles);
  undoCircleButton.addEventListener('click', () => {
    const lastCircle = state.circles.at(-1);
    if (lastCircle) {
      removeCircle(lastCircle.id);
    }
  });
  clearCirclesButton.addEventListener('click', clearAllCircles);
  toggleMapTypeButton.addEventListener('click', () => {
    state.isSatellite = !state.isSatellite;
    state.map.setMapTypeId(
      state.isSatellite ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP
    );
    updateControlState();
  });
  rollOneButton.addEventListener('click', () => rollDice(1));
  rollTwoButton.addEventListener('click', () => rollDice(2));
}

async function initialize() {
  renderRadiusOptions();
  updateControlState();
  renderCircleList();

  const apiKey = getApiKey();
  if (!apiKey) {
    setStatus('Google Maps key missing. Add VITE_GOOGLE_MAPS_API_KEY in Vercel.', true);
    return;
  }

  try {
    await loadGoogleMaps(apiKey);
    buildMap();
    bindControls();
    restoreCircles();
  } catch (error) {
    console.error(error);
    setStatus('Google Maps could not load. Check the API key and referrer rules.', true);
  }
}

initialize();
