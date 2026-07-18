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
const CURSE_DETAILS = {
  'Curse of the Impressionable Consumer':
    'Seekers must enter and gain admission to a location or buy a product from a real-world ad before asking another question. Casting cost: the seekers’ next question is free.',
  'Curse of the Mediocre Travel Agent':
    'Choose any publicly-accessible place within half a mile of the seekers. They must go there, stay ten minutes, and bring you a souvenir. Casting cost: destination must be further from you than they are now.',
  'Curse of the Jammed Door':
    'For three hours, seekers must roll 2 dice before entering a doorway and need 7 or higher. Casting cost: discard a card.',
  'Curse of the Lemon Phylactery':
    'Before asking another question, each seeker must attach a lemon to the outside of their clothes or skin. Casting cost: discard a powerup.',
  'Curse of the Distant Cuisine':
    'Find a restaurant in your zone serving food from a specific foreign country. Seekers must visit one serving food from a country at least as far away. Casting cost: you must be at the restaurant.',
  'Curse of the Drained Brain':
    'Choose three questions in different categories. Seekers cannot ask them for the rest of your run. Casting cost: discard your hand.',
  'Curse of the Unguided Tourist':
    'Send seekers an unzoomed Google Street View image near them. They must find it in real life before transport or another question. Casting cost: seekers must be outside.',
  'Curse of the Gambler’s Feet':
    'For the next hour, seekers roll a die before taking steps and may only take that many. Casting cost: roll a die; even means no effect.',
  'Curse of the Bridge Troll':
    'Seekers must ask their next question from under a bridge. Casting cost: seekers must be at least 10 km away from you.',
  'Curse of the Cairn':
    'Build a rock tower once. Seekers must match the height before asking another question. Casting cost: build a rock tower.',
  'Curse of the Luxury Car':
    'Take a photo of a car. Seekers must take a photo of a more expensive car before asking another question. Casting cost: a photo of a car.',
  'Curse of the Endless Tumble':
    'Seekers must roll a die at least 100 feet and land a 5 or 6 before their next question. Casting cost: roll a die; 5 or 6 means no effect.',
  'Curse of the Foggy Memory':
    'One random question category is disabled at all times during your run, rerolled after each question. Casting cost: discard a time bonus card.',
  'Curse of the Hidden Hangman':
    'Seekers must beat the hider in hangman before asking another question or boarding transport. Casting cost: discard 2 cards.',
  'Curse of the Bird Guide':
    'Film a bird as long as possible up to 15 minutes. Seekers must beat your time before asking another question. Casting cost: film a bird.',
  'Curse of the Frozen Dot':
    'Place a point at least 1,000 feet from the seekers. If they are within 250 feet of it in exactly 15 minutes, they freeze for 30 minutes. Casting cost: seekers must be at least 10 km away.',
  'Curse of the Zoologist':
    'Take a photo of a wild animal. Seekers must photograph one in the same category before asking another question. Casting cost: a photo of an animal.',
  'Curse of the Right Turn':
    'For the next hour, seekers can only turn right at intersections. Casting cost: discard a curse and one other card.',
  'Curse of the Urban Explorer':
    'Seekers cannot ask questions while on transit or in a transit station for the rest of your run. Casting cost: discard 2 cards.',
  'Curse of the Census Taker':
    'Seekers must visit a town or city hall within a mile and estimate the population within 25%. Casting cost: the seekers’ next question is free.',
  'Curse of Free Parking':
    'Seekers must travel three stops in the opposite direction on the same line. Casting cost: send a street name sign photo from your zone.',
  'Curse of the Sphinx':
    'Seekers must answer the hider’s riddle before another question or transport. Casting cost: discard 2 cards.',
};
const POWERUP_DETAILS = {
  '5 minute bonus': 'Adds 5 minutes to your hiding time.',
  '10 minute bonus': 'Adds 10 minutes to your hiding time.',
  '15 minute bonus': 'Adds 15 minutes to your hiding time.',
  '20 minute bonus': 'Adds 20 minutes to your hiding time.',
  '30 minute bonus': 'Adds 30 minutes to your hiding time.',
  'Discard one draw two': 'Discard one card, then draw two cards.',
  'Discard two draw three': 'Discard two cards, then draw three cards.',
  'Veto question': 'Notify the seekers immediately upon playing to veto the current question.',
  Move: 'Roll a die. Odd: discard this card. Even: you have 1 hour to move to a new Hiding Zone while seekers stay fixed until you confirm the move message was read.',
};
const CURSES = Object.keys(CURSE_DETAILS);
const POWERUPS = Object.keys(POWERUP_DETAILS);
const RULES_CONTENT = [
  {
    title: 'Section 1 - Hiding',
    bullets: [
      'The first Hider is determined as the player who roles the highest number of a two-dice roll',
      'The Hider may only move using TfL Bus, Underground, Overground, Elizabeth Line and DLR services (between zones 1-6) and on foot.',
      'The Hider must choose a TfL Underground, Overground, Elizabeth Line or DLR station (within zones 1-6) as the centre of their Hiding Zone.',
      'The Hiding Zone extends a 500 metre radius from their chosen Hiding Station, regardless of terrain. The centre of the Zone is defined as the location where the roundel for the hiding station is displayed on Google Maps.',
      'The Hider has a maximum of 1 hour to arrive within their chosen hiding zone.',
      'If the Hider is not within 500m of their desired hiding station by the end of the 1 hour, they will be allocated the nearest station (as per rule 1c) as the centre of their Hiding Zone. They must travel to this Zone immediately.',
      'The Hider may only hide on publicly-accessible streets and within publicly-accessible parks. The Hider may not hide wherever the Seekers may be restricted from access. The Hider may not hide in a manner that would reasonably draw public scrutiny and/or police/security attention.',
      'Once the Seeking period has begun, the Hider may exit their Zone, but must be able to answer any question from the Seekers within its allocated time (Section 3) and return to the Zone before the Seekers enter it.',
      'Once the Seekers enter the Hiding Zone, the Endgame is triggered. The Hider may not move from their position at the time the Seekers enter the Hiding Zone.',
      'During the Seeking Period and Endgame, the Hider may draw and play Curses and/or Powerups against the Seekers (as per Sections 3 and 4)',
      'Once the first Hider is found, the player who scored second-highest on the dice roll at the beginning becomes the new Hider. Once they are found, the remaining player becomes the Hider.',
      'At the end of the game, the player with the longest hiding time is declared the winner.',
    ],
  },
  {
    title: 'Section 2 - Seeking',
    bullets: [
      'The first Seekers are determined as the players who did not roll the highest on the initial two-dice roll.',
      'The Seekers must make their trackers visible to the Hider at all times (except when connection is lost due to reasons beyond their control).',
      'The Seekers must remain within the previous Hider’s Hiding Zone for the duration of the new Hiding Period (for the first round’s Hiding Period the Seekers must remain within 500 metres of the game’s starting point)',
      'The Seekers may only move using TfL Bus, Underground, Overground, Elizabeth Line and DLR services (between zones 1-6) and on foot.',
      'Seekers may only view images shown on Google Maps during the Seeking Period, though may not use Google Street View.',
      'The Seekers may ask questions to the Hider to gather information on their Hiding Zone, in return for Curses or Powerups (as per Sections 3 and 4).',
      'The Seekers must physically tap the Hider to end the round and immediately begin the next.',
    ],
  },
  {
    title: 'Section 3 - Questions',
    bullets: [
      'The Seekers may ask as many Questions from the Questions List as they desire, at any time during the Seeking Period.',
      'Each Question has a time period within which the Hider must return an answer to the Seekers, beginning upon its confirmed delivery to the Hider.',
      'Once a Question has been asked by the Seekers it cannot be asked again for the duration of the round (except where rule 3d applies).',
      'If a Hider fails to answer or is unable to answer a Question within its time period, the Seekers retains the ability to ask that Question once more and may ask their next question for free (without giving a Reward to the Hider).',
      'Each Question has a reward which the Hider receives for their answer upon its confirmed delivery to the Seekers.',
    ],
  },
  {
    title: 'Section 4 - Rewards for Answers (Curses and Powerups)',
    bullets: [
      'The Hider must select Curses and/or Powerups from the Curses and Powerups List as specified in the “Reward” section of each Question.',
      'The Hider may play a Curse at any time during the round by notifying the Seekers of its details. The Curse comes into effect upon its confirmed delivery to the Seekers.',
      'The Hider may only have a maximum of five Curses and/or Powerups in their hand at any time. Should the Hider possess more than five, they must play or discard excess Curses and/or Powerups of their choice immediately.',
      'If any of the Seekers fails to abide by a Curse for its specified duration, the curse is discarded and Hider may randomly draw one new Powerup or Curse.',
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
const chatRoleNote = document.querySelector('#chat-role-note');
const questionSection = document.querySelector('#question-section');
const questionCategorySelect = document.querySelector('#question-category-select');
const questionSelect = document.querySelector('#question-select');
const sendQuestionButton = document.querySelector('#send-question');
const handSection = document.querySelector('#hand-section');
const handCountElement = document.querySelector('#hand-count');
const handSlotsElement = document.querySelector('#hand-slots');
const handEditorElement = document.querySelector('#hand-editor');
const handEditorTitle = document.querySelector('#hand-editor-title');
const handTypeCurseButton = document.querySelector('#hand-type-curse');
const handTypePowerupButton = document.querySelector('#hand-type-powerup');
const handItemSelect = document.querySelector('#hand-item-select');
const handAssignButton = document.querySelector('#hand-assign');
const handUseButton = document.querySelector('#hand-use');
const handRemoveButton = document.querySelector('#hand-remove');
const handInfoButton = document.querySelector('#hand-info');
const handCancelButton = document.querySelector('#hand-cancel');
const rulesContentElement = document.querySelector('#rules-content');
const rulesFullscreenToggleButton = document.querySelector('#rules-fullscreen-toggle');

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
  isRulesFullscreen: false,
  hand: Array.from({ length: 5 }, () => null),
  editingHandSlotIndex: null,
  editingHandType: 'curse',
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

function isHider() {
  return state.roomSession?.role === 'hider';
}

function isSeeker() {
  return state.roomSession?.role === 'seeker';
}

function getItemDescription(itemType, itemName) {
  if (itemType === 'curse') {
    return CURSE_DETAILS[itemName] || '';
  }
  if (itemType === 'powerup') {
    return POWERUP_DETAILS[itemName] || '';
  }
  return '';
}

function showItemInfo(itemType, itemName) {
  const description = getItemDescription(itemType, itemName);
  if (!description) {
    window.alert(itemName);
    return;
  }
  window.alert(`${itemName}\n\n${description}`);
}

function getHandStorageKey() {
  if (!state.roomSession) return '';
  return `hide-map-hand-${state.roomSession.roomCode}-${state.roomSession.participantId}`;
}

function persistHand() {
  const storageKey = getHandStorageKey();
  if (!storageKey) return;
  localStorage.setItem(storageKey, JSON.stringify(state.hand));
}

function loadHand() {
  state.hand = Array.from({ length: 5 }, () => null);
  const storageKey = getHandStorageKey();
  if (!storageKey || !isHider()) return;
  const rawValue = localStorage.getItem(storageKey);
  if (!rawValue) return;
  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return;
    state.hand = Array.from({ length: 5 }, (_, index) => {
      const item = parsed[index];
      if (!item || !item.type || !item.name) return null;
      return item;
    });
  } catch {
    localStorage.removeItem(storageKey);
  }
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

function renderRoleChatUi() {
  const connected = Boolean(state.roomSession);
  const hider = isHider();
  const seeker = isSeeker();

  questionSection.hidden = !connected || !seeker;
  handSection.hidden = !connected || !hider;

  if (!connected) {
    chatRoleNote.textContent = 'Join a room to use role-based chat tools';
  } else if (hider) {
    chatRoleNote.textContent = 'Hider view: manage your 5-card hand and send curses or powerups';
  } else {
    chatRoleNote.textContent = 'Seeker view: send quick questions without typing them out';
  }
}

function renderHandEditor() {
  const slotIndex = state.editingHandSlotIndex;
  const slotItem = slotIndex === null ? null : state.hand[slotIndex];
  const selectedType = slotItem?.type || state.editingHandType;
  const selectedItems = selectedType === 'powerup' ? POWERUPS : CURSES;

  handEditorElement.hidden = slotIndex === null;
  if (slotIndex === null) {
    return;
  }

  handEditorTitle.textContent = `Slot ${slotIndex + 1}`;
  handTypeCurseButton.dataset.active = selectedType === 'curse' ? 'true' : 'false';
  handTypePowerupButton.dataset.active = selectedType === 'powerup' ? 'true' : 'false';

  handItemSelect.innerHTML = '';
  for (const itemName of selectedItems) {
    const option = document.createElement('option');
    option.value = itemName;
    option.textContent = itemName;
    if ((slotItem?.name || '') === itemName) {
      option.selected = true;
    }
    handItemSelect.append(option);
  }

  handRemoveButton.disabled = !slotItem;
  handUseButton.disabled = !slotItem;
  handInfoButton.disabled = !slotItem;
}

function renderHandSlots() {
  handSlotsElement.innerHTML = '';
  const filledCount = state.hand.filter(Boolean).length;
  handCountElement.textContent = `${filledCount} / 5`;

  state.hand.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hand-slot';
    if (item) {
      button.dataset.filled = 'true';
      button.textContent = item.name;
    } else {
      button.dataset.empty = 'true';
      button.textContent = `Empty slot ${index + 1}`;
    }
    button.addEventListener('click', () => {
      state.editingHandSlotIndex = index;
      state.editingHandType = item?.type || 'curse';
      renderHandEditor();
    });
    handSlotsElement.append(button);
  });

  renderHandEditor();
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

function toggleRulesFullscreen() {
  if (state.activePanel !== 'rules') {
    setActivePanel('rules');
  }
  state.isRulesFullscreen = !state.isRulesFullscreen;
  updatePanelVisibility();
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
  document.body.dataset.rulesFullscreen = state.isRulesFullscreen ? 'true' : 'false';
  rulesFullscreenToggleButton.textContent = state.isRulesFullscreen ? 'Exit full screen' : 'Full screen';
}

function setActivePanel(panelName) {
  state.activePanel = panelName;
  if (panelName) {
    state.lastPanel = panelName;
  }
  if (panelName !== 'rules') {
    state.isRulesFullscreen = false;
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
    state.isRulesFullscreen = false;
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
  sendQuestionButton.disabled = !connected || !isSeeker();
  handAssignButton.disabled = !connected || !isHider();
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

    if (message.itemType && message.itemName && getItemDescription(message.itemType, message.itemName)) {
      const infoButton = document.createElement('button');
      infoButton.type = 'button';
      infoButton.className = 'chat-info-button';
      infoButton.textContent = 'Info';
      infoButton.addEventListener('click', () => showItemInfo(message.itemType, message.itemName));
      bubble.append(infoButton);
    }

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
    renderRoleChatUi();
    renderHandSlots();
    updateControlState();
    return;
  }

  roomBadge.textContent = `Room ${state.roomSession.roomCode}`;
  roomMeta.textContent =
    `${state.roomSession.nickname} · ${state.roomSession.role} · ${state.roomSession.color}`;
  updateRoomGateVisibility();
  renderParticipantList();
  renderMessages();
  renderRoleChatUi();
  renderHandSlots();
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
  loadHand();
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
  state.hand = Array.from({ length: 5 }, () => null);
  state.editingHandSlotIndex = null;
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
    if (isHider()) {
      loadHand();
    }
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

async function sendMessage(text, kind = 'text', extra = {}) {
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
      itemType: extra.itemType || null,
      itemName: extra.itemName || null,
    }),
  });

  state.messages = payload.messages || state.messages;
  renderMessages();
}

function selectHandType(type) {
  state.editingHandType = type;
  renderHandEditor();
}

function getSelectedHandItem() {
  if (state.editingHandSlotIndex === null) return null;
  return {
    type: state.editingHandType,
    name: handItemSelect.value,
  };
}

function assignHandItem() {
  if (!isHider() || state.editingHandSlotIndex === null || !handItemSelect.value) return;
  state.hand[state.editingHandSlotIndex] = getSelectedHandItem();
  persistHand();
  renderHandSlots();
  setStatus(`Saved ${handItemSelect.value} to hand.`);
}

async function useHandItem() {
  if (!isHider() || state.editingHandSlotIndex === null) return;
  const slotItem = state.hand[state.editingHandSlotIndex];
  if (!slotItem) return;
  const label = slotItem.type === 'curse' ? `[Curse] ${slotItem.name}` : `[Powerup] ${slotItem.name}`;
  await sendMessage(label, slotItem.type, {
    itemType: slotItem.type,
    itemName: slotItem.name,
  });
  state.hand[state.editingHandSlotIndex] = null;
  persistHand();
  setStatus(`${slotItem.name} sent to chat.`);
  renderHandSlots();
}

function removeHandItem() {
  if (state.editingHandSlotIndex === null) return;
  state.hand[state.editingHandSlotIndex] = null;
  persistHand();
  setStatus('Removed card from hand.');
  renderHandSlots();
}

function closeHandEditor() {
  state.editingHandSlotIndex = null;
  renderHandEditor();
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
    loadHand();
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
  rulesFullscreenToggleButton.addEventListener('click', toggleRulesFullscreen);
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
  handTypeCurseButton.addEventListener('click', () => selectHandType('curse'));
  handTypePowerupButton.addEventListener('click', () => selectHandType('powerup'));
  handAssignButton.addEventListener('click', assignHandItem);
  handUseButton.addEventListener('click', useHandItem);
  handRemoveButton.addEventListener('click', removeHandItem);
  handInfoButton.addEventListener('click', () => {
    const slotItem = state.editingHandSlotIndex === null ? null : state.hand[state.editingHandSlotIndex];
    if (slotItem) {
      showItemInfo(slotItem.type, slotItem.name);
    }
  });
  handCancelButton.addEventListener('click', closeHandEditor);
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
