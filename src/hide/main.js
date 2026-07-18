import { ROOM_COLORS } from '../../shared/hideRoomConfig.js';
import './styles.css';

const LONDON_CENTER = { lat: 51.5072, lng: -0.1276 };
const DEFAULT_ZOOM = 11;
const ROOM_SESSION_KEY = 'hide-map-room-session-v1';
const POLL_INTERVAL_MS = 4000;
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
const QUESTION_GROUPS = {
  Relative: [
    'Is your latitude higher or lower than ours?',
    'Is your longitude higher or lower than ours?',
    'Is your altitude higher or lower than ours?',
    'Is your borough the same as ours?',
    'Did your constituency vote for the same political party as ours in the 2024 General Election?',
    'Is your nearest international airport the same as ours?',
  ],
  Radar: [
    'Are you within 100 metres of us?',
    'Are you within 200 metres of us?',
    'Are you within 500 metres of us?',
    'Are you within 1 km of us?',
    'Are you within 2 km of us?',
    'Are you within 3 km of us?',
    'Are you within 5 km of us?',
    'Are you within 10 km of us?',
    'Are you within 25 km of us?',
  ],
  Photos: [
    'Send a Picture of the Tallest Visible Structure',
    'Send a Picture of the Local Church',
    'Send a Picture of the facade of your Hiding Station',
    'Send a Picture where at least 5 Buildings are Visible',
    'Send a Picture of the largest body of water within your Hiding Zone',
    'Send a Picture of the Local Bank',
    'Send a Picture of your Local Town Hall',
    'Send a Picture of a McDonalds',
  ],
  Oddball: [
    'Facetime the seekers until you show them a bird',
    'Send 30 seconds of audio from your Hiding Station',
    'Send the Seekers 5 words. One must rhyme with your station.',
    'Send a Strava of yourself walking 1km on streets (including at least 6 turns)',
    'Is your next train at your next station at an odd or even time?',
  ],
  Precision: [
    'What is the (rounded) price of your nearest hotel?',
    'Send a Photo with the camera facing straight upwards',
    'Send a Photo of yourself',
    'What letter does your nearest street begin with?',
    'How long (in minutes) would it take you to walk to your nearest train station?',
    'What is the rating of your nearest restaurant?',
    'What Intercardinal direction does your nearest street run?',
    'Rounded to 5, how many metres are you from your nearest road?',
    'Rounded to 5, how many metres are you from your nearest intersection?',
    'Are you on the same street as us?',
  ],
};
const CURSES = [
  'Curse of the Impressionable Consumer',
  'Curse of the Mediocre Travel Agent',
  'Curse of the Jammed Door',
  'Curse of the Lemon Phylactery',
  'Curse of the Distant Cuisine',
  'Curse of the Drained Brain',
  'Curse of the Unguided Tourist',
  'Curse of the Gambler’s Feet',
  'Curse of the Bridge Troll',
  'Curse of the Cairn',
  'Curse of the Luxury Car',
  'Curse of the Endless Tumble',
  'Curse of the Foggy Memory',
  'Curse of the Hidden Hangman',
  'Curse of the Bird Guide',
  'Curse of the Frozen Dot',
  'Curse of the Zoologist',
  'Curse of the Right Turn',
  'Curse of the Urban Explorer',
  'Curse of the Census Taker',
  'Curse of Free Parking',
  'Curse of the Sphinx',
];
const RULES_CONTENT = [
  {
    title: 'Hiding',
    bullets: [
      'Hider chooses a TfL station in zones 1–6 and hides within 500 metres.',
      'Hider has 1 hour to reach the zone.',
      'Once seekers enter the hiding zone, endgame starts and the hider must stop moving.',
    ],
  },
  {
    title: 'Seeking',
    bullets: [
      'Seekers must keep trackers visible to the hider.',
      'Seekers may use TfL and walking only.',
      'Street View is banned; regular Google Maps imagery is allowed.',
    ],
  },
  {
    title: 'Questions',
    bullets: [
      'A question may only be asked once per round unless the hider fails to answer in time.',
      'Radar distances: 100m, 200m, 500m, 1km, 2km, 3km, 5km, 10km, 25km.',
      'Tentacles omitted from quick sender here.',
    ],
  },
  {
    title: 'Rewards',
    bullets: [
      'Questions grant curses and powerups to the hider.',
      'Keep a hand of five or fewer cards.',
      'Use chat for quick question and curse sends.',
    ],
  },
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
const nicknameInput = document.querySelector('#nickname-input');
const roomCodeInput = document.querySelector('#room-code-input');
const roomPasswordInput = document.querySelector('#room-password-input');
const roleSelect = document.querySelector('#role-select');
const createRoomButton = document.querySelector('#create-room');
const joinRoomButton = document.querySelector('#join-room');
const leaveRoomButton = document.querySelector('#leave-room');
const shareToggleButton = document.querySelector('#share-toggle');
const roomBadge = document.querySelector('#room-badge');
const roomMeta = document.querySelector('#room-meta');
const participantListElement = document.querySelector('#participant-list');
const roomGate = document.querySelector('#room-gate');
const panelShell = document.querySelector('#panel-shell');
const toolsPanel = document.querySelector('#tools-panel');
const dicePanel = document.querySelector('#dice-panel');
const roomPanel = document.querySelector('#room-panel');
const chatPanel = document.querySelector('#chat-panel');
const rulesPanel = document.querySelector('#rules-panel');
const toolsToggleButton = document.querySelector('#tools-toggle');
const diceToggleButton = document.querySelector('#dice-toggle');
const roomToggleButton = document.querySelector('#room-toggle');
const chatToggleButton = document.querySelector('#chat-toggle');
const rulesToggleButton = document.querySelector('#rules-toggle');
const hideUiToggleButton = document.querySelector('#hide-ui-toggle');
const showUiToggleButton = document.querySelector('#show-ui-toggle');
const chatMessagesElement = document.querySelector('#chat-messages');
const chatInput = document.querySelector('#chat-input');
const chatSendButton = document.querySelector('#chat-send');
const questionCategorySelect = document.querySelector('#question-category-select');
const questionSelect = document.querySelector('#question-select');
const sendQuestionButton = document.querySelector('#send-question');
const curseSelect = document.querySelector('#curse-select');
const sendCurseButton = document.querySelector('#send-curse');
const rulesContentElement = document.querySelector('#rules-content');

const state = {
  map: null,
  circles: [],
  isPlacementArmed: false,
  selectedRadius: 500,
  isSatellite: false,
  localMarker: null,
  localAccuracyCircle: null,
  localLocation: null,
  participantOverlays: new Map(),
  roomSession: null,
  participants: [],
  messages: [],
  pollTimerId: null,
  watchId: null,
  isSharing: false,
  lastSharedLocation: null,
  activePanel: null,
  lastPanel: 'tools',
  isUiHidden: false,
  lastRenderedMessageId: null,
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

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'never';
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 5) return 'now';
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
  return `${Math.round(elapsedSeconds / 60)}m ago`;
}

function normalizeRoomCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
}

function getCircleColor(radius) {
  const maxIndex = Math.max(RADIUS_OPTIONS.length - 1, 1);
  const index = RADIUS_OPTIONS.findIndex((option) => option.value === radius);
  const hue = 212 - Math.max(index, 0) * (132 / maxIndex);
  return `hsl(${hue} 82% 46%)`;
}

function getParticipantColor(participant) {
  return participant?.color || ROOM_COLORS[0];
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

function renderQuestionControls() {
  questionCategorySelect.innerHTML = '';
  for (const category of Object.keys(QUESTION_GROUPS)) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    questionCategorySelect.append(option);
  }
  renderQuestionOptions();

  curseSelect.innerHTML = '';
  for (const curse of CURSES) {
    const option = document.createElement('option');
    option.value = curse;
    option.textContent = curse;
    curseSelect.append(option);
  }
}

function renderQuestionOptions() {
  const category = questionCategorySelect.value || Object.keys(QUESTION_GROUPS)[0];
  questionSelect.innerHTML = '';
  for (const question of QUESTION_GROUPS[category]) {
    const option = document.createElement('option');
    option.value = question;
    option.textContent = question;
    questionSelect.append(option);
  }
}

function renderRules() {
  rulesContentElement.innerHTML = '';
  for (const section of RULES_CONTENT) {
    const wrapper = document.createElement('section');
    wrapper.className = 'rules-section';

    const title = document.createElement('h3');
    title.textContent = section.title;

    const list = document.createElement('ul');
    for (const bullet of section.bullets) {
      const item = document.createElement('li');
      item.textContent = bullet;
      list.append(item);
    }

    wrapper.append(title, list);
    rulesContentElement.append(wrapper);
  }
}

function updateRoomGateVisibility() {
  document.body.dataset.roomGate = state.roomSession ? 'closed' : 'open';
  roomGate.hidden = Boolean(state.roomSession);
}

function updatePanelVisibility() {
  const hasSession = Boolean(state.roomSession);
  const uiVisible = hasSession && !state.isUiHidden;
  document.body.dataset.uiHidden = state.isUiHidden ? 'true' : 'false';

  panelShell.hidden = !uiVisible || !state.activePanel;
  toolsPanel.hidden = state.activePanel !== 'tools';
  dicePanel.hidden = state.activePanel !== 'dice';
  roomPanel.hidden = state.activePanel !== 'room';
  chatPanel.hidden = state.activePanel !== 'chat';
  rulesPanel.hidden = state.activePanel !== 'rules';

  const floatingButtons = [
    hideUiToggleButton,
    toolsToggleButton,
    diceToggleButton,
    roomToggleButton,
    chatToggleButton,
    rulesToggleButton,
  ];
  for (const button of floatingButtons) {
    button.hidden = !hasSession || state.isUiHidden;
  }
  showUiToggleButton.hidden = !hasSession || !state.isUiHidden;

  toolsToggleButton.dataset.active = state.activePanel === 'tools' ? 'true' : 'false';
  diceToggleButton.dataset.active = state.activePanel === 'dice' ? 'true' : 'false';
  roomToggleButton.dataset.active = state.activePanel === 'room' ? 'true' : 'false';
  chatToggleButton.dataset.active = state.activePanel === 'chat' ? 'true' : 'false';
  rulesToggleButton.dataset.active = state.activePanel === 'rules' ? 'true' : 'false';
}

function setActivePanel(panelName) {
  state.activePanel = panelName;
  if (panelName) {
    state.lastPanel = panelName;
  }
  updatePanelVisibility();
}

function togglePanel(panelName) {
  if (state.isUiHidden) {
    state.isUiHidden = false;
    setActivePanel(panelName);
    return;
  }
  setActivePanel(state.activePanel === panelName ? null : panelName);
}

function setUiHidden(isHidden) {
  state.isUiHidden = isHidden;
  if (isHidden) {
    setActivePanel(null);
    return;
  }
  setActivePanel(state.lastPanel || 'tools');
}

function updateControlState() {
  armPlaceButton.dataset.armed = state.isPlacementArmed ? 'true' : 'false';
  armPlaceButton.textContent = state.isPlacementArmed ? 'Tap map' : 'Place';
  undoCircleButton.disabled = state.circles.length === 0;
  clearCirclesButton.disabled = state.circles.length === 0;
  fitCirclesButton.disabled = state.circles.length === 0;
  toggleMapTypeButton.textContent = state.isSatellite ? 'Map' : 'Satellite';
  circleCountElement.textContent =
    state.circles.length === 1 ? '1 circle' : `${state.circles.length} circles`;
  const connected = Boolean(state.roomSession);
  leaveRoomButton.disabled = !connected;
  shareToggleButton.disabled = !connected;
  shareToggleButton.textContent = state.isSharing ? 'Stop sharing' : 'Start sharing';
  roomToggleButton.disabled = !connected;
  chatToggleButton.disabled = !connected;
  rulesToggleButton.disabled = !connected;
  chatSendButton.disabled = !connected;
  sendQuestionButton.disabled = !connected;
  sendCurseButton.disabled = !connected;
  updatePanelVisibility();
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
      `${formatCoordinate(circleEntry.center.lat)}, ${formatCoordinate(circleEntry.center.lng)}`;

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
  const circleEntry = { id: crypto.randomUUID(), center, radius, circleOverlay, marker };
  state.circles.push(circleEntry);
  persistCircleState();
  renderCircleList();
  updateControlState();
  setStatus(`${formatRadius(radius)} circle placed. Pan and zoom normally.`);
}

function removeCircle(circleId) {
  const circleIndex = state.circles.findIndex((circleEntry) => circleEntry.id === circleId);
  if (circleIndex === -1) return;
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
  if (!circleEntry) return;
  state.map.panTo(circleEntry.center);
  state.map.fitBounds(circleEntry.circleOverlay.getBounds(), 72);
  setStatus(`Focused ${formatRadius(circleEntry.radius)} circle.`);
}

function fitAllCircles() {
  if (state.circles.length === 0) return;
  const bounds = new google.maps.LatLngBounds();
  for (const circleEntry of state.circles) {
    bounds.union(circleEntry.circleOverlay.getBounds());
  }
  bounds.extend(state.map.getCenter());
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

function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unavailable.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000,
    });
  });
}

function updateLocalLocationMarker(location, options = {}) {
  state.localLocation = location;
  const color = state.roomSession?.color || '#111827';
  if (!state.localMarker) {
    state.localMarker = new google.maps.Marker({
      map: state.map,
      position: location,
      title: 'My location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: 50,
    });
  } else {
    state.localMarker.setPosition(location);
    state.localMarker.setIcon({
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    });
  }

  if (location.accuracy && Number.isFinite(location.accuracy)) {
    if (!state.localAccuracyCircle) {
      state.localAccuracyCircle = new google.maps.Circle({
        map: state.map,
        center: location,
        radius: location.accuracy,
        strokeColor: color,
        strokeOpacity: 0.35,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: 0.08,
        clickable: false,
      });
    } else {
      state.localAccuracyCircle.setCenter(location);
      state.localAccuracyCircle.setRadius(location.accuracy);
      state.localAccuracyCircle.setOptions({ strokeColor: color, fillColor: color });
    }
  }

  if (options.centerMap) {
    state.map.panTo(location);
    state.map.setZoom(Math.max(state.map.getZoom(), 15));
  }
}

async function locateMe() {
  locateMeButton.disabled = true;
  setStatus('Requesting your exact location...');
  try {
    const position = await requestCurrentPosition();
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      updatedAt: Date.now(),
    };
    updateLocalLocationMarker(location, { centerMap: true });
    setStatus(
      `Marked your location at ${formatCoordinate(location.lat)}, ${formatCoordinate(location.lng)}.`
    );
    if (state.isSharing) {
      await sendLocationToRoom(location);
    }
  } catch {
    setStatus('Location was unavailable or denied.', true);
  } finally {
    locateMeButton.disabled = false;
  }
}

function rollDice(count) {
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
  const total = rolls.reduce((sum, value) => sum + value, 0);
  diceResult.textContent = count === 1 ? `${rolls[0]}` : `${rolls.join(' + ')} = ${total}`;
}

function haversineDistanceMeters(a, b) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const value = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * earthRadius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function shouldShareLocation(nextLocation) {
  if (!state.lastSharedLocation) return true;
  const elapsedMs = Date.now() - state.lastSharedLocation.updatedAt;
  if (elapsedMs >= 10000) return true;
  return haversineDistanceMeters(state.lastSharedLocation, nextLocation) >= 8;
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }
  return payload;
}

function persistRoomSession() {
  if (!state.roomSession) {
    localStorage.removeItem(ROOM_SESSION_KEY);
    return;
  }
  localStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(state.roomSession));
}

function clearParticipantOverlays() {
  for (const overlay of state.participantOverlays.values()) {
    overlay.marker.setMap(null);
  }
  state.participantOverlays.clear();
}

function syncParticipantOverlays() {
  if (!state.map) return;
  const visibleIds = new Set();
  for (const participant of state.participants) {
    if (!participant.location || participant.id === state.roomSession?.participantId) continue;
    visibleIds.add(participant.id);
    const color = getParticipantColor(participant);
    const label = participant.nickname.slice(0, 2).toUpperCase();
    let overlay = state.participantOverlays.get(participant.id);
    if (!overlay) {
      const marker = new google.maps.Marker({
        map: state.map,
        position: participant.location,
        label: {
          text: label,
          color: '#111827',
          fontSize: '11px',
          fontWeight: '700',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 30,
      });
      overlay = { marker };
      state.participantOverlays.set(participant.id, overlay);
    } else {
      overlay.marker.setPosition(participant.location);
      overlay.marker.setLabel({
        text: label,
        color: '#111827',
        fontSize: '11px',
        fontWeight: '700',
      });
      overlay.marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      });
    }
  }
  for (const [participantId, overlay] of state.participantOverlays.entries()) {
    if (!visibleIds.has(participantId)) {
      overlay.marker.setMap(null);
      state.participantOverlays.delete(participantId);
    }
  }
}

function renderParticipantList() {
  participantListElement.innerHTML = '';
  if (!state.roomSession) {
    const empty = document.createElement('p');
    empty.className = 'empty-state room-empty';
    empty.textContent = 'No room connected.';
    participantListElement.append(empty);
    return;
  }
  for (const participant of state.participants) {
    const row = document.createElement('article');
    row.className = 'participant-row';
    const swatch = document.createElement('span');
    swatch.className = 'participant-swatch';
    swatch.style.background = getParticipantColor(participant);
    const info = document.createElement('div');
    info.className = 'participant-info';
    const name = document.createElement('div');
    name.className = 'participant-name';
    name.textContent =
      participant.id === state.roomSession.participantId
        ? `${participant.nickname} (you)`
        : participant.nickname;
    const meta = document.createElement('div');
    meta.className = 'participant-meta';
    meta.textContent =
      `${participant.role} · ${participant.isOnline ? 'online' : 'idle'} · ${formatRelativeTime(
        participant.location?.updatedAt || participant.lastSeenAt
      )}`;
    info.append(name, meta);
    row.append(swatch, info);
    participantListElement.append(row);
  }
}

function renderMessages() {
  chatMessagesElement.innerHTML = '';
  if (state.messages.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state room-empty';
    empty.textContent = 'No messages yet.';
    chatMessagesElement.append(empty);
    return;
  }

  const lastMessageId = state.messages.at(-1)?.id || null;
  for (const message of state.messages) {
    const bubble = document.createElement('article');
    bubble.className = 'chat-bubble';
    if (message.participantId === state.roomSession?.participantId) {
      bubble.dataset.own = 'true';
    }
    bubble.style.setProperty('--message-color', message.color || '#111827');

    const meta = document.createElement('div');
    meta.className = 'chat-meta';
    meta.textContent = `${message.nickname} · ${message.kind} · ${formatTime(message.createdAt)}`;

    const text = document.createElement('div');
    text.className = 'chat-text';
    text.textContent = message.text;

    bubble.append(meta, text);
    chatMessagesElement.append(bubble);
  }

  if (lastMessageId && lastMessageId !== state.lastRenderedMessageId) {
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    state.lastRenderedMessageId = lastMessageId;
  }
}

function updateRoomUi() {
  if (!state.roomSession) {
    roomBadge.textContent = 'No room';
    roomMeta.textContent = 'Join from the gate first';
    state.participants = [];
    state.messages = [];
    clearParticipantOverlays();
    updateRoomGateVisibility();
    renderParticipantList();
    renderMessages();
    updateControlState();
    return;
  }

  roomBadge.textContent = `Room ${state.roomSession.roomCode}`;
  roomMeta.textContent =
    `${state.roomSession.nickname} · ${state.roomSession.role} · ${state.roomSession.color}`;
  updateRoomGateVisibility();
  renderParticipantList();
  renderMessages();
  updateControlState();
}

function setRoomActionBusy(isBusy) {
  createRoomButton.disabled = isBusy;
  joinRoomButton.disabled = isBusy;
}

function applyRoomPayload(payload, password) {
  state.roomSession = {
    roomCode: payload.roomCode,
    participantId: payload.participantId,
    nickname: payload.participant.nickname,
    role: payload.participant.role,
    color: payload.participant.color,
    password,
  };
  roomCodeInput.value = payload.roomCode;
  state.participants = payload.participants || [];
  state.messages = payload.messages || [];
  state.isUiHidden = false;
  persistRoomSession();
  updateRoomUi();
  syncParticipantOverlays();
}

async function createRoom() {
  const nickname = nicknameInput.value.trim();
  const password = roomPasswordInput.value;
  const role = roleSelect.value;
  const roomCode = normalizeRoomCode(roomCodeInput.value);
  setRoomActionBusy(true);
  setStatus('Creating room...');
  try {
    const payload = await apiJson('/api/hide-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', nickname, password, role, roomCode }),
    });
    applyRoomPayload(payload, password);
    startPolling();
    await startSharing();
    setActivePanel('tools');
    setStatus(`Room ${payload.roomCode} created.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setRoomActionBusy(false);
  }
}

async function joinRoom() {
  const nickname = nicknameInput.value.trim();
  const password = roomPasswordInput.value;
  const role = roleSelect.value;
  const roomCode = normalizeRoomCode(roomCodeInput.value);
  setRoomActionBusy(true);
  setStatus('Joining room...');
  try {
    const payload = await apiJson('/api/hide-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', nickname, password, role, roomCode }),
    });
    applyRoomPayload(payload, password);
    startPolling();
    await startSharing();
    setActivePanel('tools');
    setStatus(`Joined room ${payload.roomCode}.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setRoomActionBusy(false);
  }
}

async function leaveRoom() {
  if (!state.roomSession) return;
  try {
    await apiJson('/api/hide-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'leave',
        roomCode: state.roomSession.roomCode,
        password: state.roomSession.password,
        participantId: state.roomSession.participantId,
      }),
    });
  } catch (error) {
    console.error(error);
  }

  stopSharing();
  stopPolling();
  state.roomSession = null;
  state.participants = [];
  state.messages = [];
  state.activePanel = null;
  state.isUiHidden = false;
  clearParticipantOverlays();
  persistRoomSession();
  updateRoomUi();
  updatePanelVisibility();
  setStatus('Left room.');
}

async function fetchRoomState(isSilent = false) {
  if (!state.roomSession) return;
  try {
    const query = new URLSearchParams({
      roomCode: state.roomSession.roomCode,
      password: state.roomSession.password,
      participantId: state.roomSession.participantId,
    });
    const payload = await apiJson(`/api/hide-room?${query.toString()}`);
    state.roomSession = {
      ...state.roomSession,
      roomCode: payload.roomCode,
      participantId: payload.participantId,
      nickname: payload.participant.nickname,
      role: payload.participant.role,
      color: payload.participant.color,
    };
    state.participants = payload.participants || [];
    state.messages = payload.messages || [];
    persistRoomSession();
    updateRoomUi();
    syncParticipantOverlays();
  } catch (error) {
    if (!isSilent) {
      setStatus(error.message, true);
    }
  }
}

function startPolling() {
  stopPolling();
  fetchRoomState(true);
  state.pollTimerId = window.setInterval(() => {
    fetchRoomState(true);
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (state.pollTimerId) {
    window.clearInterval(state.pollTimerId);
    state.pollTimerId = null;
  }
}

async function sendLocationToRoom(location) {
  if (!state.roomSession) return;
  if (!shouldShareLocation(location)) return;
  await apiJson('/api/hide-room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'location',
      roomCode: state.roomSession.roomCode,
      password: state.roomSession.password,
      participantId: state.roomSession.participantId,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
    }),
  });
  state.lastSharedLocation = location;
}

async function sendMessage(text, kind = 'text') {
  if (!state.roomSession) {
    setStatus('Join a room before chatting.', true);
    return;
  }
  const trimmedText = String(text || '').trim();
  if (!trimmedText) return;

  const payload = await apiJson('/api/hide-room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'message',
      roomCode: state.roomSession.roomCode,
      password: state.roomSession.password,
      participantId: state.roomSession.participantId,
      text: trimmedText,
      kind,
    }),
  });

  state.messages = payload.messages || state.messages;
  renderMessages();
}

async function startSharing() {
  if (!state.roomSession) {
    setStatus('Join a room before sharing location.', true);
    return;
  }
  if (state.isSharing) return;
  try {
    const position = await requestCurrentPosition();
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      updatedAt: Date.now(),
    };
    updateLocalLocationMarker(location, { centerMap: !state.localLocation });
    await sendLocationToRoom(location);
    state.watchId = navigator.geolocation.watchPosition(
      async (nextPosition) => {
        const nextLocation = {
          lat: nextPosition.coords.latitude,
          lng: nextPosition.coords.longitude,
          accuracy: nextPosition.coords.accuracy,
          updatedAt: Date.now(),
        };
        updateLocalLocationMarker(nextLocation);
        try {
          await sendLocationToRoom(nextLocation);
        } catch (error) {
          console.error(error);
        }
      },
      () => {
        setStatus('Live location stopped because access was lost.', true);
        stopSharing();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
    state.isSharing = true;
    updateControlState();
    setStatus('Live location sharing started.');
  } catch {
    setStatus('Location access is required for sharing.', true);
  }
}

function stopSharing() {
  if (state.watchId !== null) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }
  state.isSharing = false;
  updateControlState();
}

async function toggleSharing() {
  if (state.isSharing) {
    stopSharing();
    setStatus('Live location sharing stopped.');
    return;
  }
  await startSharing();
}

function restoreRoomSession() {
  const rawValue = localStorage.getItem(ROOM_SESSION_KEY);
  if (!rawValue) {
    updateRoomUi();
    updatePanelVisibility();
    return;
  }
  try {
    const savedSession = JSON.parse(rawValue);
    if (
      !savedSession?.roomCode ||
      !savedSession?.participantId ||
      !savedSession?.nickname ||
      !savedSession?.password
    ) {
      throw new Error('Invalid room session.');
    }
    state.roomSession = {
      roomCode: normalizeRoomCode(savedSession.roomCode),
      participantId: String(savedSession.participantId),
      nickname: String(savedSession.nickname),
      role: savedSession.role === 'hider' ? 'hider' : 'seeker',
      color: String(savedSession.color || ROOM_COLORS[0]),
      password: String(savedSession.password),
    };
    nicknameInput.value = state.roomSession.nickname;
    roomCodeInput.value = state.roomSession.roomCode;
    roomPasswordInput.value = state.roomSession.password;
    roleSelect.value = state.roomSession.role;
    state.isUiHidden = false;
    updateRoomUi();
    setActivePanel('tools');
    startPolling();
    fetchRoomState(true);
  } catch {
    localStorage.removeItem(ROOM_SESSION_KEY);
    updateRoomUi();
  }
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
    if (!state.isPlacementArmed) return;
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
  roomCodeInput.addEventListener('input', () => {
    roomCodeInput.value = normalizeRoomCode(roomCodeInput.value);
  });
  questionCategorySelect.addEventListener('change', renderQuestionOptions);
  chatInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await sendMessage(chatInput.value, 'text');
      chatInput.value = '';
    }
  });

  armPlaceButton.addEventListener('click', armPlacement);
  locateMeButton.addEventListener('click', locateMe);
  fitCirclesButton.addEventListener('click', fitAllCircles);
  undoCircleButton.addEventListener('click', () => {
    const lastCircle = state.circles.at(-1);
    if (lastCircle) removeCircle(lastCircle.id);
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
  createRoomButton.addEventListener('click', createRoom);
  joinRoomButton.addEventListener('click', joinRoom);
  leaveRoomButton.addEventListener('click', leaveRoom);
  shareToggleButton.addEventListener('click', toggleSharing);
  toolsToggleButton.addEventListener('click', () => togglePanel('tools'));
  diceToggleButton.addEventListener('click', () => togglePanel('dice'));
  roomToggleButton.addEventListener('click', () => togglePanel('room'));
  chatToggleButton.addEventListener('click', () => togglePanel('chat'));
  rulesToggleButton.addEventListener('click', () => togglePanel('rules'));
  hideUiToggleButton.addEventListener('click', () => setUiHidden(true));
  showUiToggleButton.addEventListener('click', () => setUiHidden(false));
  chatSendButton.addEventListener('click', async () => {
    await sendMessage(chatInput.value, 'text');
    chatInput.value = '';
  });
  sendQuestionButton.addEventListener('click', async () => {
    const category = questionCategorySelect.value;
    const question = questionSelect.value;
    await sendMessage(`[${category}] ${question}`, 'question');
  });
  sendCurseButton.addEventListener('click', async () => {
    await sendMessage(`[Curse] ${curseSelect.value}`, 'curse');
  });
}

async function initialize() {
  renderRadiusOptions();
  renderQuestionControls();
  renderRules();
  renderCircleList();
  renderMessages();
  updateRoomGateVisibility();
  updateControlState();
  updateRoomUi();

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
    restoreRoomSession();
  } catch (error) {
    console.error(error);
    setStatus('Google Maps could not load. Check the API key and referrer rules.', true);
  }
}

initialize();
