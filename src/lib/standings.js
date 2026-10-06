import { pointsForPosition } from './scoring';
import { groupASize } from './tournament';

const positionIn = (list, id) => {
  const index = list.indexOf(id);
  return index === -1 ? null : index + 1;
};

// Puntos de un participante en una fecha, con el detalle de cada sesión.
export function participantRound(tournament, round, participantId) {
  const { scoring } = tournament;
  const { q1, q2, finalA, finalB } = round.results;
  const q2B = round.results.q2B ?? []; // los torneos guardados antes de existir el grupo B no lo tienen

  const q1Pos = positionIn(q1, participantId);

  // La Clasificación 2 y la Final tienen grupos A y B. Los puestos se cuentan dentro de cada grupo (P1, P2, P3… de la A
  // y P1, P2, P3… de la B); `q2Group` y `group` dicen a cuál pertenece el participante en cada sesión.
  let q2Group = null;
  let q2Pos = positionIn(q2, participantId);
  if (q2Pos) q2Group = 'A';
  else if ((q2Pos = positionIn(q2B, participantId))) q2Group = 'B';

  let group = null;
  let finalPos = positionIn(finalA, participantId);
  if (finalPos) group = 'A';
  else if ((finalPos = positionIn(finalB, participantId))) group = 'B';

  // Puntos: la Clasificación 2 B da los mismos que la A (el P1 de la B vale lo mismo que el P1 de la A). En la Final B
  // el puesto es P1, P2… de la B, pero cada uno recibe los puntos que siguen al último de la Final A: si en la A
  // corrieron 7, el P1 de la B suma los puntos del 8º, el P2 los del 9º, y así.
  const finalPointsPosition = group === 'B' ? groupASize(round.results, 'finalA') + finalPos : finalPos;

  const q1Points = pointsForPosition(scoring.q1, q1Pos);
  const q2Points = pointsForPosition(scoring.q2, q2Pos);
  const finalPoints = group ? pointsForPosition(scoring.finalA, finalPointsPosition) : 0;

  return {
    q1Pos,
    q1Points,
    q2Pos,
    q2Points,
    q2Group,
    group,
    finalPos,
    finalPoints,
    total: q1Points + q2Points + finalPoints,
  };
}

// Tabla general. Desempate: total → victorias en Final A → puntos de finales → nombre.
export function computeStandings(tournament) {
  const rows = tournament.participants.map((participant) => {
    const rounds = tournament.rounds.map((round) => participantRound(tournament, round, participant.id));
    return {
      participant,
      rounds,
      total: rounds.reduce((sum, r) => sum + r.total, 0),
      wins: rounds.filter((r) => r.group === 'A' && r.finalPos === 1).length,
      finalPoints: rounds.reduce((sum, r) => sum + r.finalPoints, 0),
    };
  });

  rows.sort(
    (a, b) =>
      b.total - a.total ||
      b.wins - a.wins ||
      b.finalPoints - a.finalPoints ||
      a.participant.name.localeCompare(b.participant.name, 'es'),
  );

  return rows.map((row, index) => ({ ...row, position: index + 1 }));
}

// Orden de los participantes según la clasificación (Q1 + Q2) de una fecha.
// Sirve para sugerir quién va a la Final A (primeros 12) y quién a la Final B.
export function qualifyingOrder(tournament, round) {
  const scored = tournament.participants.map((participant) => {
    const { q1Points, q2Points } = participantRound(tournament, round, participant.id);
    return { participant, points: q1Points + q2Points };
  });
  scored.sort((a, b) => b.points - a.points || a.participant.name.localeCompare(b.participant.name, 'es'));
  return scored.map((s) => s.participant.id);
}
