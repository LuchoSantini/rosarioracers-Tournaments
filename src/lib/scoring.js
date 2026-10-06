// Una regla de puntos es { points: number[], step: number }:
//   - `points` son los puntos de las primeras posiciones (P1, P2, ...).
//   - desde la siguiente posición se le resta `step` al último valor, sin bajar de 0.
// Ej. clasificación 1 del F1: { points: [20], step: 1 } → 20, 19, 18, ...
//     carrera del F1:         { points: [30, 26, 23, 21, 19, 17], step: 2 } → ..., 15, 13, 11, ...
export const F1_SCORING = {
  q1: { points: [20], step: 1 },
  q2: { points: [10], step: 1 },
  // Tabla de las finales: la Final B no tiene la suya, continúa la de la A (ver participantRound en standings.js).
  finalA: { points: [30, 26, 23, 21, 19, 17], step: 2 },
};

export const cloneScoring = (scoring) => JSON.parse(JSON.stringify(scoring));

export function pointsForPosition(rule, position) {
  const { points, step } = rule;
  if (!position || position < 1 || points.length === 0) return 0;
  if (position <= points.length) return points[position - 1];
  return Math.max(0, points[points.length - 1] - step * (position - points.length));
}

// "30, 26, 23" → [30, 26, 23]. Ignora lo que no sea número.
export function parsePoints(text) {
  return text
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0);
}
