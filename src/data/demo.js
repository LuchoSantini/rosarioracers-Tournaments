import { DEFAULT_CATEGORIES } from './categories';
import { TRACK_CATALOG } from './tracks';
import { F1_SCORING } from '../lib/scoring';
import { MAX_FINAL_SIZE, createTournament, uid } from '../lib/tournament';
import { SEASON_2026_RESULTS } from './f1Season2026';

// Mock de F1: el campeonato anual 2026 en curso con el calendario real (23 fechas, 16 disputadas) y los participantes y
// puntos de la tabla anual del local, dos años anteriores finalizados y dos Hot Laps (uno en curso).
// Se arma igual en cada carga. La app lo usa como datos iniciales la primera vez que se abre.
// El orden de esta lista es el de la tabla anual (1º Augusto Giardini … 20º Martin Ramirez): f1Season2026.js la usa por posición.
const NAMES = [
  'Augusto Giardini', 'Luciano Santini', 'Franco Vincenzetti', 'Pasquinelli Astor', 'Guillermo Rolle',
  'Lisandro Oviedo', 'Guido Gentile', 'Elias Villordo', 'Pedro Alessio', 'Tomas Carpio',
  'Alex Navarro', 'Franco Sarfati', 'Jeremias Miño', 'Damian Ciancio', 'Horacio Tarragona',
  'Nico Lascares', 'Pasquinelli Giani', 'Ismael Ferrari', 'Martin Zamudio', 'Martin Ramirez',
];

// Calendario 2026 de la F1 (23 fechas) con el circuito de cada una; el GP de Bahréin se corre este año en Sepang.
const SEASON_2026_TRACKS = [
  'albertpark', 'shanghai', 'suzuka', 'miami', 'montreal', 'monaco', 'barcelona', 'redbullring', 'silverstone', 'spa',
  'hungaroring', 'zandvoort', 'monza', 'madring', 'baku', 'sepang', 'marinabay', 'cota', 'hermanosrodriguez',
  'interlagos', 'lasvegas', 'lusail', 'yasmarina',
];

// Tiempos de vuelta aproximados por pista (ms) sólo para que las clasificaciones del mock tengan tiempos creíbles.
const LAP_BASE_MS = {
  albertpark: 76000, shanghai: 91000, suzuka: 88000, miami: 87000, montreal: 71000, monaco: 70000, barcelona: 72000,
  redbullring: 65000, silverstone: 85000, spa: 104000, hungaroring: 75000, zandvoort: 69000, monza: 80000,
  madring: 90000, baku: 101000, sepang: 92000,
};

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shuffle = (list, random) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const track = (id) => TRACK_CATALOG.find((t) => t.id === id);

// Tiempos de vuelta coherentes con el orden de llegada: parten de ~1:28 y suben entre 80 y 450 ms por puesto.
function lapTimes(order, random, base = 88000) {
  let ms = base + Math.floor(random() * 6000);
  const times = {};
  for (const id of order) {
    times[id] = ms;
    ms += 80 + Math.floor(random() * 370);
  }
  return times;
}

// Campeonato F1 2026: las primeras 16 fechas ya están disputadas, con resultados reconstruidos para que la tabla dé los
// puntos reales del local (ver f1Season2026.js); la 17ª (Singapur) es la próxima y el resto están pendientes.
function buildSeason2026() {
  const random = rng(2026);
  const t = createTournament({
    categoryId: 'f1',
    name: 'Campeonato F1 2026',
    game: 'Assetto Corsa',
    tracks: SEASON_2026_TRACKS.map(track),
    scoring: F1_SCORING,
  });
  t.createdAt = '2026-02-20T20:00:00.000Z';
  t.participants = NAMES.map((name) => ({ id: uid(), name }));
  const ids = t.participants.map((p) => p.id);
  const pick = (positions) => positions.map((i) => ids[i]);

  SEASON_2026_RESULTS.forEach((result, index) => {
    const round = t.rounds[index];
    const base = LAP_BASE_MS[SEASON_2026_TRACKS[index]] ?? 90000;
    round.results.q1 = pick(result.q1);
    round.results.q2 = pick(result.q2);
    round.results.q2B = pick(result.q2B);
    round.results.finalA = pick(result.finalA);
    round.results.finalB = pick(result.finalB);
    round.times.q1 = lapTimes(round.results.q1, random, base);
    round.times.q2 = lapTimes(round.results.q2, random, base);
    round.times.q2B = lapTimes(round.results.q2B, random, base);
  });
  return t;
}

// Hot Lap: una pista y la mejor vuelta de cada participante (los últimos `sinTiempo` quedan sin tiempo).
function buildHotLap({ categoryId, name, game, trackId, people, baseMs, sinTiempo = 0, finishedAt, seed }) {
  const random = rng(seed);
  const t = createTournament({ categoryId, name, game, tracks: [track(trackId)], scoring: F1_SCORING, type: 'hotlap' });
  t.participants = NAMES.slice(0, people).map((n) => ({ id: uid(), name: n }));
  const ranked = shuffle(t.participants.map((p) => p.id), random);
  t.rounds[0].laps = lapTimes(ranked.slice(0, people - sinTiempo), random, baseMs);
  if (finishedAt) {
    t.status = 'finished';
    t.createdAt = finishedAt.created;
    t.finishedAt = finishedAt.finished;
  }
  return t;
}

// `sessions` indica cuántas etapas de cada fecha tienen resultados (0 = ninguna, 1 = Q1, 2 = + Q2 A y B, 3 = + Final A, 4 = + Final B).
function build({ categoryId, name, game, trackIds, people, sessionsPerRound, finishedAt, seed }) {
  const random = rng(seed);
  const t = createTournament({
    categoryId,
    name,
    game,
    tracks: trackIds.map(track),
    scoring: F1_SCORING,
  });
  t.participants = NAMES.slice(0, people).map((n) => ({ id: uid(), name: n }));
  const ids = t.participants.map((p) => p.id);

  t.rounds.forEach((round, index) => {
    const sessions = sessionsPerRound[index] ?? 0;
    if (sessions >= 1) {
      round.results.q1 = shuffle(ids, random);
      round.times.q1 = lapTimes(round.results.q1, random);
    }
    if (sessions >= 2) {
      // Clasificación 2 en dos grupos: los 12 mejores de la Clasificación 1 corren la A y el resto la B.
      round.results.q2 = shuffle(round.results.q1.slice(0, MAX_FINAL_SIZE), random);
      round.times.q2 = lapTimes(round.results.q2, random);
      round.results.q2B = shuffle(round.results.q1.slice(MAX_FINAL_SIZE), random);
      round.times.q2B = lapTimes(round.results.q2B, random);
    }
    if (sessions >= 3) {
      // A cada final van quienes corrieron la Clasificación 2 de su grupo.
      round.results.finalA = shuffle(round.results.q2, random);
      if (sessions >= 4) round.results.finalB = shuffle(round.results.q2B, random);
    }
  });

  if (finishedAt) {
    t.status = 'finished';
    t.createdAt = finishedAt.created;
    t.finishedAt = finishedAt.finished;
  }
  return t;
}

export function buildDemoState() {
  const tournaments = [
    // F1: el campeonato anual 2026 en curso (23 fechas, 16 disputadas) y dos años anteriores
    buildSeason2026(),
    build({
      categoryId: 'f1', name: 'Campeonato F1 2025', game: 'Automobilista 2',
      trackIds: ['galvez', 'monza', 'spa', 'silverstone', 'imola', 'interlagos'],
      people: 14, sessionsPerRound: [4, 4, 4, 4, 4, 4], seed: 22,
      finishedAt: { created: '2025-02-03T20:00:00.000Z', finished: '2025-12-15T23:30:00.000Z' },
    }),
    build({
      categoryId: 'f1', name: 'Campeonato F1 2024', game: 'Assetto Corsa',
      trackIds: ['interlagos', 'monaco', 'suzuka', 'zandvoort'],
      people: 12, sessionsPerRound: [4, 4, 4, 4], seed: 33,
      finishedAt: { created: '2024-03-04T20:00:00.000Z', finished: '2024-12-09T23:10:00.000Z' },
    }),

    // Hot Lap: uno en curso en Spa (2 participantes todavía sin tiempo) y uno ya finalizado en Monza
    buildHotLap({
      categoryId: 'f1', name: 'Hot Lap F1 · Spa', game: 'Assetto Corsa',
      trackId: 'spa', people: 12, sinTiempo: 2, baseMs: 123000, seed: 44,
    }),
    buildHotLap({
      categoryId: 'f1', name: 'Hot Lap F1 · Monza', game: 'Assetto Corsa',
      trackId: 'monza', people: 10, baseMs: 81500, seed: 55,
      finishedAt: { created: '2026-09-10T20:00:00.000Z', finished: '2026-09-20T23:00:00.000Z' },
    }),
  ];

  return { version: 1, categories: DEFAULT_CATEGORIES, tournaments };
}
