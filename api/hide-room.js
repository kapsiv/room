import { createHash, randomUUID } from 'node:crypto';
import { createClient } from 'redis';

import { ROOM_CODE_LENGTH, ROOM_COLORS, ROOM_TTL_SECONDS } from '../shared/hideRoomConfig.js';

const REDIS_URL = process.env.REDIS_URL || process.env.STORAGE_REDIS_URL;
const ROOM_PREFIX = 'hide:room:';
const ONLINE_WINDOW_MS = 30_000;

function json(response, status, payload) {
  response.status(status);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.send(JSON.stringify(payload));
}

function normalizeNickname(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 24);
}

function normalizeRoomCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

function normalizeRole(value) {
  return value === 'hider' ? 'hider' : 'seeker';
}

function hashPassword(password) {
  return createHash('sha256').update(String(password || '')).digest('hex');
}

function roomKey(roomCode) {
  return `${ROOM_PREFIX}${roomCode}`;
}

function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  while (code.length < ROOM_CODE_LENGTH) {
    const index = Math.floor(Math.random() * alphabet.length);
    code += alphabet[index];
  }
  return code;
}

async function withRedisClient(fn) {
  if (!REDIS_URL) {
    throw new Error('Missing REDIS_URL or STORAGE_REDIS_URL');
  }

  const client = createClient({ url: REDIS_URL });
  await client.connect();

  try {
    return await fn(client);
  } finally {
    await client.quit();
  }
}

async function loadRoom(client, roomCode) {
  const rawValue = await client.get(roomKey(roomCode));
  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue);
}

async function saveRoom(client, room) {
  await client.set(roomKey(room.code), JSON.stringify(room), {
    EX: ROOM_TTL_SECONDS,
  });
}

function publicParticipant(participant) {
  const lastSeenAt = participant.lastSeenAt || 0;
  return {
    id: participant.id,
    nickname: participant.nickname,
    role: participant.role,
    color: participant.color,
    joinedAt: participant.joinedAt,
    lastSeenAt,
    isOnline: Date.now() - lastSeenAt <= ONLINE_WINDOW_MS,
    location: participant.location || null,
  };
}

function visibleParticipants(room, viewer) {
  if (viewer.role === 'hider') {
    return room.participants.map(publicParticipant);
  }

  return room.participants
    .filter((participant) => participant.role === 'seeker')
    .map(publicParticipant);
}

function findParticipant(room, participantId) {
  return room.participants.find((participant) => participant.id === participantId) || null;
}

function nextColor(room) {
  const usedColors = new Set(room.participants.map((participant) => participant.color));
  for (const color of ROOM_COLORS) {
    if (!usedColors.has(color)) {
      return color;
    }
  }

  return ROOM_COLORS[room.participants.length % ROOM_COLORS.length];
}

async function parseRequestBody(request) {
  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  if (typeof request.body === 'string') {
    return JSON.parse(request.body || '{}');
  }

  return {};
}

async function handleCreate(client, request, response) {
  const body = await parseRequestBody(request);
  const nickname = normalizeNickname(body.nickname);
  const password = String(body.password || '');
  const role = normalizeRole(body.role);
  const preferredCode = normalizeRoomCode(body.roomCode);

  if (!nickname) {
    json(response, 400, { error: 'Nickname is required.' });
    return;
  }

  if (password.length < 4) {
    json(response, 400, { error: 'Password must be at least 4 characters.' });
    return;
  }

  let roomCode = preferredCode;
  if (!roomCode) {
    do {
      roomCode = makeRoomCode();
    } while (await loadRoom(client, roomCode));
  } else if (await loadRoom(client, roomCode)) {
    json(response, 409, { error: 'Room code is already in use.' });
    return;
  }

  const now = Date.now();
  const participant = {
    id: randomUUID(),
    nickname,
    role,
    color: ROOM_COLORS[0],
    joinedAt: now,
    lastSeenAt: now,
    location: null,
  };

  const room = {
    code: roomCode,
    passwordHash: hashPassword(password),
    createdAt: now,
    participants: [participant],
  };

  await saveRoom(client, room);
  json(response, 200, {
    ok: true,
    roomCode,
    participantId: participant.id,
    participant: publicParticipant(participant),
    participants: visibleParticipants(room, participant),
  });
}

async function handleJoin(client, request, response) {
  const body = await parseRequestBody(request);
  const roomCode = normalizeRoomCode(body.roomCode);
  const password = String(body.password || '');
  const nickname = normalizeNickname(body.nickname);
  const role = normalizeRole(body.role);

  if (!roomCode || !nickname || !password) {
    json(response, 400, { error: 'Room code, nickname and password are required.' });
    return;
  }

  const room = await loadRoom(client, roomCode);
  if (!room) {
    json(response, 404, { error: 'Room not found.' });
    return;
  }

  if (room.passwordHash !== hashPassword(password)) {
    json(response, 403, { error: 'Password is incorrect.' });
    return;
  }

  const now = Date.now();
  const participant = {
    id: randomUUID(),
    nickname,
    role,
    color: nextColor(room),
    joinedAt: now,
    lastSeenAt: now,
    location: null,
  };

  room.participants.push(participant);
  await saveRoom(client, room);

  json(response, 200, {
    ok: true,
    roomCode,
    participantId: participant.id,
    participant: publicParticipant(participant),
    participants: visibleParticipants(room, participant),
  });
}

async function handleState(client, request, response) {
  const roomCode = normalizeRoomCode(request.query.roomCode);
  const password = String(request.query.password || '');
  const participantId = String(request.query.participantId || '');

  if (!roomCode || !password || !participantId) {
    json(response, 400, { error: 'Missing room credentials.' });
    return;
  }

  const room = await loadRoom(client, roomCode);
  if (!room) {
    json(response, 404, { error: 'Room not found.' });
    return;
  }

  if (room.passwordHash !== hashPassword(password)) {
    json(response, 403, { error: 'Password is incorrect.' });
    return;
  }

  const participant = findParticipant(room, participantId);
  if (!participant) {
    json(response, 404, { error: 'Participant not found.' });
    return;
  }

  participant.lastSeenAt = Date.now();
  await saveRoom(client, room);

  json(response, 200, {
    ok: true,
    roomCode,
    participantId,
    participant: publicParticipant(participant),
    participants: visibleParticipants(room, participant),
  });
}

async function handleLocation(client, request, response) {
  const body = await parseRequestBody(request);
  const roomCode = normalizeRoomCode(body.roomCode);
  const password = String(body.password || '');
  const participantId = String(body.participantId || '');
  const latitude = Number(body.lat);
  const longitude = Number(body.lng);
  const accuracy = Number(body.accuracy);

  if (!roomCode || !password || !participantId) {
    json(response, 400, { error: 'Missing room credentials.' });
    return;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    json(response, 400, { error: 'Invalid location.' });
    return;
  }

  const room = await loadRoom(client, roomCode);
  if (!room) {
    json(response, 404, { error: 'Room not found.' });
    return;
  }

  if (room.passwordHash !== hashPassword(password)) {
    json(response, 403, { error: 'Password is incorrect.' });
    return;
  }

  const participant = findParticipant(room, participantId);
  if (!participant) {
    json(response, 404, { error: 'Participant not found.' });
    return;
  }

  participant.lastSeenAt = Date.now();
  participant.location = {
    lat: latitude,
    lng: longitude,
    accuracy: Number.isFinite(accuracy) ? Math.max(0, accuracy) : null,
    updatedAt: participant.lastSeenAt,
  };

  await saveRoom(client, room);
  json(response, 200, { ok: true });
}

async function handleLeave(client, request, response) {
  const body = await parseRequestBody(request);
  const roomCode = normalizeRoomCode(body.roomCode);
  const password = String(body.password || '');
  const participantId = String(body.participantId || '');

  if (!roomCode || !password || !participantId) {
    json(response, 400, { error: 'Missing room credentials.' });
    return;
  }

  const room = await loadRoom(client, roomCode);
  if (!room) {
    json(response, 200, { ok: true });
    return;
  }

  if (room.passwordHash !== hashPassword(password)) {
    json(response, 403, { error: 'Password is incorrect.' });
    return;
  }

  room.participants = room.participants.filter((participant) => participant.id !== participantId);

  if (room.participants.length === 0) {
    await client.del(roomKey(roomCode));
    json(response, 200, { ok: true });
    return;
  }

  await saveRoom(client, room);
  json(response, 200, { ok: true });
}

export default async function handler(request, response) {
  try {
    await withRedisClient(async (client) => {
      if (request.method === 'GET') {
        await handleState(client, request, response);
        return;
      }

      if (request.method !== 'POST') {
        json(response, 405, { error: 'Method not allowed.' });
        return;
      }

      const body = await parseRequestBody(request);
      const action = String(body.action || '');

      if (action === 'create') {
        await handleCreate(client, request, response);
        return;
      }

      if (action === 'join') {
        await handleJoin(client, request, response);
        return;
      }

      if (action === 'location') {
        await handleLocation(client, request, response);
        return;
      }

      if (action === 'leave') {
        await handleLeave(client, request, response);
        return;
      }

      json(response, 400, { error: 'Unknown action.' });
    });
  } catch (error) {
    console.error(error);
    json(response, 500, { error: 'Room service unavailable.' });
  }
}
