import { cloneScoring } from './scoring';

// Sesiones de cada fecha. La Clasificación 2 y la Final se dividen en dos grupos (A y B). La clave `q2` es la
// Clasificación 2 A (se llama así desde antes de existir el grupo B, para no tocar los datos ya guardados).
export const SESSIONS = [
  { key: 'q1', label: 'Clasificación 1', short: 'Q1' },
  { key: 'q2', label: 'Clasificación 2 A', short: 'Q2 A' },
  { key: 'q2B', label: 'Clasificación 2 B', short: 'Q2 B' },
  { key: 'finalA', label: 'Final A', short: 'Final A' },
  { key: 'finalB', label: 'Final B', short: 'Final B' },
];

// Cada grupo B continúa al A de su sesión: nadie corre los dos y cada uno admite hasta 12 participantes.
export const SESSION_PAIR = { q2: 'q2B', q2B: 'q2', finalA: 'finalB', finalB: 'finalA' };

// A cada final van quienes clasificaron en la Clasificación 2 de su mismo grupo: Q2 A → Final A y Q2 B → Final B.
export const FINAL_SOURCE = { finalA: 'q2', finalB: 'q2B' };

export const MAX_FINAL_SIZE = 12;

// Cuántos puestos ocupa la Final A antes de los puntos de la B (el P1 de la B suma los puntos del puesto siguiente al
// último de la A). Es la cantidad que efectivamente corrió. Mientras la Final A esté vacía se cuentan los que clasificaron
// en la Clasificación 2 A, que son los que van a correrla; así la Final B no suma de más por un momento.
export function groupASize(results, groupAKey) {
  const own = (results[groupAKey] ?? []).length;
  return own > 0 || groupAKey !== 'finalA' ? own : (results[FINAL_SOURCE.finalA] ?? []).length;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export const emptyResults = () => ({ q1: [], q2: [], q2B: [], finalA: [], finalB: [] });

// Sesiones de clasificación: además del orden de llegada se pueden cargar los tiempos de vuelta (round.times).
export const TIMED_SESSIONS = ['q1', 'q2', 'q2B'];

// `ballast` = lastre de la fecha en kg por participante ({ participantId: kg }); sólo se usa en torneos con lastre.
export const createRound = (track) => ({ id: uid(), track, results: emptyResults(), times: { q1: {}, q2: {}, q2B: {} }, ballast: {} });

// Lastre (kg) que se puede asignar a un participante en una fecha.
export const MAX_BALLAST = 999;

// Torneos con lastre: sólo campeonatos, y los guardados antes de existir el lastre no tienen `ballast`.
export const hasBallast = (tournament) => Boolean(tournament.ballast) && !isHotLap(tournament);

// Lastre (kg) de un participante en una fecha; 0 si no tiene.
export const ballastOf = (round, participantId) => round.ballast?.[participantId] ?? 0;

// Tipos de torneo:
//   championship = campeonato por fechas (clasificaciones + finales, suma de puntos).
//   hotlap       = una pista y gana el que hace la mejor vuelta (round.laps = { participantId: ms }).
export const TOURNAMENT_TYPES = [
  { id: 'championship', label: 'Campeonato', description: 'Fechas con clasificaciones y finales; los puntos se suman.' },
  { id: 'hotlap', label: 'Hot Lap', description: 'Una pista y gana quien haga la mejor vuelta.' },
];

// Los torneos guardados antes de existir el tipo no tienen `type`: son campeonatos.
export const isHotLap = (tournament) => tournament.type === 'hotlap';
export const typeLabel = (tournament) => (isHotLap(tournament) ? 'Hot Lap' : 'Campeonato');

// Torneo en curso de una categoría y un tipo (máximo uno de cada tipo). `exceptId` sirve para ignorar el torneo que se edita.
export const activeOf = (tournaments, categoryId, type, exceptId = null) =>
  tournaments.find(
    (t) => t.categoryId === categoryId && t.status === 'active' && (t.type ?? 'championship') === type && t.id !== exceptId,
  ) ?? null;

export function createTournament({ categoryId, name, game, tracks, scoring, type = 'championship', ballast = false }) {
  const rounds = tracks.map(createRound);
  if (type === 'hotlap') rounds.forEach((round) => { round.laps = {}; });
  return {
    id: uid(),
    type,
    categoryId,
    name,
    game,
    status: 'active',
    createdAt: new Date().toISOString(),
    finishedAt: null,
    scoring: cloneScoring(scoring),
    ballast: type === 'championship' && Boolean(ballast),
    participants: [],
    rounds,
  };
}

export const hasAnyResults = (tournament) =>
  tournament.rounds.some((round) => SESSIONS.some((s) => (round.results[s.key] ?? []).length > 0));

// Estado de cada fecha, en el orden actual del torneo:
//   done = ya se disputó (todas sus sesiones tienen resultados) · live = la primera pendiente, con resultados a medias
//   next = la primera pendiente, todavía sin resultados (la que sigue) · pending = pendiente, más adelante.
export function roundStatuses(tournament) {
  const statuses = {};
  let upcomingFound = false;
  for (const round of tournament.rounds) {
    const { done, total } = roundProgress(tournament, round);
    if (done === total) statuses[round.id] = 'done';
    else if (!upcomingFound) {
      upcomingFound = true;
      statuses[round.id] = done > 0 ? 'live' : 'next';
    } else statuses[round.id] = 'pending';
  }
  return statuses;
}

// Sesiones que cuentan para el progreso de una fecha. Los grupos B sólo hacen falta si hay más de 12 participantes
// (y, en la Clasificación 2, si el grupo A no tiene ya a todos, como en los torneos cargados antes de existir el B).
export function roundProgress(tournament, round) {
  const results = (key) => round.results[key] ?? [];
  const many = tournament.participants.length > MAX_FINAL_SIZE;
  const applies = {
    q2B: results('q2B').length > 0 || (many && results('q2').length < tournament.participants.length),
    finalB: results('finalB').length > 0 || many,
  };
  const keys = SESSIONS.map((s) => s.key).filter((key) => applies[key] ?? true);
  const done = keys.filter((key) => results(key).length > 0).length;
  return { done, total: keys.length };
}
