import { DEFAULT_CATEGORIES } from '../data/categories';
import { sortByTimes } from '../lib/laptime';
import { normalizeState } from './validate';
import { FINAL_SOURCE, MAX_BALLAST, MAX_FINAL_SIZE, SESSION_PAIR, TIMED_SESSIONS, createRound, isHotLap, uid } from '../lib/tournament';

export const initialState = { version: 1, categories: DEFAULT_CATEGORIES, tournaments: [] };

const updateTournament = (state, id, fn) => ({
  ...state,
  tournaments: state.tournaments.map((t) => (t.id === id ? fn(t) : t)),
});

const unique = (list) => [...new Set(list)];

// Mantiene las reglas del torneo sin importar desde dónde se cargue el resultado: sólo participantes existentes,
// sin repetidos y, en las sesiones con grupos A y B (Clasificación 2 y Final), nadie en los dos grupos de una fecha
// y máximo 12 por grupo. Si una sesión guardada ya tenía más de 12 (torneos viejos) se respeta, pero no crece.
function sanitizeOrder(tournament, round, session, order) {
  const known = new Set(tournament.participants.map((p) => p.id));
  let next = unique(order).filter((id) => known.has(id));

  // A cada final sólo se suman quienes clasificaron en la Clasificación 2 de su grupo. Si ese grupo todavía está vacío
  // (no se cargó, o es un torneo viejo) no se restringe, y quienes ya estaban en la final se conservan siempre.
  const qualified = round.results[FINAL_SOURCE[session]] ?? [];
  if (qualified.length > 0) {
    const allowed = new Set([...qualified, ...(round.results[session] ?? [])]);
    next = next.filter((id) => allowed.has(id));
  }

  const pair = SESSION_PAIR[session];
  if (pair) {
    const other = new Set(round.results[pair] ?? []);
    const limit = Math.max(MAX_FINAL_SIZE, (round.results[session] ?? []).length);
    next = next.filter((id) => !other.has(id)).slice(0, limit);
  }
  return next;
}

// Reemplaza el orden de una sesión de una fecha. En las clasificaciones se descartan los tiempos de quienes salieron.
// (Los torneos guardados antes de existir los tiempos no tienen round.times: se tolera.)
function withOrder(tournament, round, session, order) {
  const next = sanitizeOrder(tournament, round, session, order);
  const updated = { ...round, results: { ...round.results, [session]: next } };
  if (TIMED_SESSIONS.includes(session)) {
    const kept = new Set(next);
    const times = Object.fromEntries(Object.entries(round.times?.[session] ?? {}).filter(([id]) => kept.has(id)));
    updated.times = { ...round.times, [session]: times };
  }
  return updated;
}

const mapRound = (tournament, roundId, fn) => ({
  ...tournament,
  rounds: tournament.rounds.map((round) => (round.id === roundId ? fn(round) : round)),
});

export function reducer(state, action) {
  switch (action.type) {
    case 'tournament/create':
      return { ...state, tournaments: [...state.tournaments, action.tournament] };

    case 'tournament/update':
      return updateTournament(state, action.id, (t) => ({ ...t, ...action.patch }));

    case 'tournament/finish':
      return updateTournament(state, action.id, (t) => ({
        ...t,
        status: 'finished',
        finishedAt: new Date().toISOString(),
      }));

    case 'tournament/reopen':
      return updateTournament(state, action.id, (t) => ({ ...t, status: 'active', finishedAt: null }));

    case 'tournament/delete':
      return { ...state, tournaments: state.tournaments.filter((t) => t.id !== action.id) };

    case 'participants/add':
      return updateTournament(state, action.id, (t) => {
        const taken = new Set(t.participants.map((p) => p.name.toLowerCase()));
        const added = [];
        for (const raw of action.names) {
          const name = raw.trim();
          if (!name || taken.has(name.toLowerCase())) continue;
          taken.add(name.toLowerCase());
          added.push({ id: uid(), name });
        }
        return { ...t, participants: [...t.participants, ...added] };
      });

    case 'participant/rename':
      return updateTournament(state, action.id, (t) => ({
        ...t,
        participants: t.participants.map((p) => (p.id === action.participantId ? { ...p, name: action.name } : p)),
      }));

    case 'participant/remove':
      return updateTournament(state, action.id, (t) => ({
        ...t,
        participants: t.participants.filter((p) => p.id !== action.participantId),
        rounds: t.rounds.map((round) => ({
          ...round,
          results: Object.fromEntries(
            Object.entries(round.results).map(([key, order]) => [key, order.filter((id) => id !== action.participantId)]),
          ),
          times: Object.fromEntries(
            Object.entries(round.times ?? {}).map(([key, byId]) => [key, Object.fromEntries(Object.entries(byId).filter(([id]) => id !== action.participantId))]),
          ),
          ballast: Object.fromEntries(Object.entries(round.ballast ?? {}).filter(([id]) => id !== action.participantId)),
          ...(round.laps ? { laps: Object.fromEntries(Object.entries(round.laps).filter(([id]) => id !== action.participantId)) } : {}),
        })),
      }));

    // Hot Lap: registra una vuelta por nombre (crea al participante si no existe). Si ya tenía tiempo, queda el mejor.
    case 'lap/record':
      return updateTournament(state, action.id, (t) => {
        const round = t.rounds[0];
        const name = action.name.trim();
        if (!isHotLap(t) || !round || !name || !(action.ms > 0)) return t;
        let participants = t.participants;
        let participant = participants.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (!participant) {
          participant = { id: uid(), name };
          participants = [...participants, participant];
        }
        const previous = round.laps?.[participant.id];
        const best = previous == null ? action.ms : Math.min(previous, action.ms);
        return { ...t, participants, rounds: [{ ...round, laps: { ...round.laps, [participant.id]: best } }, ...t.rounds.slice(1)] };
      });

    // Hot Lap: corrige el tiempo de un participante (ms = null lo borra, sin quitarlo del torneo).
    case 'lap/set':
      return updateTournament(state, action.id, (t) => {
        const round = t.rounds[0];
        if (!isHotLap(t) || !round || !t.participants.some((p) => p.id === action.participantId)) return t;
        const laps = { ...round.laps };
        if (action.ms == null) delete laps[action.participantId];
        else laps[action.participantId] = action.ms;
        return { ...t, rounds: [{ ...round, laps }, ...t.rounds.slice(1)] };
      });

    case 'rounds/add':
      return updateTournament(state, action.id, (t) => ({
        ...t,
        rounds: [...t.rounds, ...action.tracks.map(createRound)],
      }));

    case 'rounds/reorder':
      return updateTournament(state, action.id, (t) => {
        const byId = new Map(t.rounds.map((round) => [round.id, round]));
        const sorted = action.roundIds.map((id) => byId.get(id)).filter(Boolean);
        // Si la lista no coincide con las fechas actuales se ignora, para no perder ninguna.
        return sorted.length === t.rounds.length ? { ...t, rounds: sorted } : t;
      });

    case 'round/remove':
      return updateTournament(state, action.id, (t) => ({
        ...t,
        rounds: t.rounds.filter((round) => round.id !== action.roundId),
      }));

    case 'result/set':
      return updateTournament(state, action.id, (t) =>
        mapRound(t, action.roundId, (round) => withOrder(t, round, action.session, action.order)),
      );

    // Carga (o borra, con ms = null) el tiempo de un participante y reordena la clasificación por mejor tiempo.
    case 'time/set':
      return updateTournament(state, action.id, (t) =>
        mapRound(t, action.roundId, (round) => {
          const known = t.participants.some((p) => p.id === action.participantId);
          if (!TIMED_SESSIONS.includes(action.session) || !known) return round;
          const times = { ...(round.times?.[action.session] ?? {}) };
          const order = [...(round.results[action.session] ?? [])];
          if (action.ms == null) delete times[action.participantId];
          else {
            times[action.participantId] = action.ms;
            if (!order.includes(action.participantId)) order.push(action.participantId);
          }
          // Pasa por sanitizeOrder (grupo contrario y tope de 12); los tiempos de quien quede afuera se descartan.
          const next = sanitizeOrder(t, round, action.session, sortByTimes(order, times));
          const kept = new Set(next);
          for (const id of Object.keys(times)) if (!kept.has(id)) delete times[id];
          return {
            ...round,
            results: { ...round.results, [action.session]: next },
            times: { ...round.times, [action.session]: times },
          };
        }),
      );

    // Vuelve a ordenar por mejor tiempo (por ejemplo, después de mover a alguien a mano).
    case 'result/sortByTime':
      return updateTournament(state, action.id, (t) =>
        mapRound(t, action.roundId, (round) => {
          if (!TIMED_SESSIONS.includes(action.session)) return round;
          const order = sortByTimes(round.results[action.session] ?? [], round.times?.[action.session] ?? {});
          return { ...round, results: { ...round.results, [action.session]: order } };
        }),
      );

    // Lastre de una fecha: kg por participante (0 o null lo quita). Sólo participantes del torneo y enteros de 0 a MAX_BALLAST.
    case 'ballast/set':
      return updateTournament(state, action.id, (t) =>
        mapRound(t, action.roundId, (round) => {
          if (!t.participants.some((p) => p.id === action.participantId)) return round;
          const ballast = { ...round.ballast };
          const kg = Math.min(MAX_BALLAST, Math.round(Number(action.kg)));
          if (action.kg == null || !(kg > 0)) delete ballast[action.participantId];
          else ballast[action.participantId] = kg;
          return { ...round, ballast };
        }),
      );

    // Reemplaza todo el lastre de una fecha ({ participantId: kg }); sirve para aplicar una propuesta o vaciarlo.
    case 'ballast/replace':
      return updateTournament(state, action.id, (t) =>
        mapRound(t, action.roundId, (round) => {
          const known = new Set(t.participants.map((p) => p.id));
          const ballast = {};
          for (const [id, value] of Object.entries(action.ballast ?? {})) {
            const kg = Math.min(MAX_BALLAST, Math.round(Number(value)));
            if (known.has(id) && kg > 0) ballast[id] = kg;
          }
          return { ...round, ballast };
        }),
      );

    case 'category/create':
      return { ...state, categories: [...state.categories, action.category] };

    // Sólo cambian nombre y color: el slug (la URL) se conserva.
    case 'category/update':
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };

    // Al eliminar una categoría se eliminan también sus torneos. Siempre queda al menos una categoría.
    case 'category/delete':
      if (state.categories.length <= 1) return state;
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        tournaments: state.tournaments.filter((t) => t.categoryId !== action.id),
      };

    case 'categories/reorder': {
      const byId = new Map(state.categories.map((c) => [c.id, c]));
      const sorted = action.ids.map((id) => byId.get(id)).filter(Boolean);
      return sorted.length === state.categories.length ? { ...state, categories: sorted } : state;
    }

    case 'data/replace':
      return normalizeState(action.state);

    default:
      return state;
  }
}
