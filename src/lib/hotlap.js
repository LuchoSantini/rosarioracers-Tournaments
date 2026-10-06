import { computeStandings } from './standings';
import { formatLapTime } from './laptime';
import { isHotLap } from './tournament';

// Tabla de un Hot Lap: primero quienes tienen tiempo (de menor a mayor) y después, por nombre, los que todavía no.
// Cada fila trae la diferencia con el líder y con el puesto anterior.
export function hotLapStandings(tournament) {
  const laps = tournament.rounds[0]?.laps ?? {};
  const byName = (a, b) => a.participant.name.localeCompare(b.participant.name, 'es');

  const timed = [];
  const untimed = [];
  for (const participant of tournament.participants) {
    const time = laps[participant.id];
    (time != null ? timed : untimed).push({ participant, time: time ?? null });
  }
  timed.sort((a, b) => a.time - b.time || byName(a, b));
  untimed.sort(byName);

  const best = timed[0]?.time ?? null;
  const rows = [
    ...timed.map((row, i) => ({
      ...row,
      position: i + 1,
      gapToLeader: row.time - best,
      gapToPrevious: i === 0 ? 0 : row.time - timed[i - 1].time,
    })),
    ...untimed.map((row) => ({ ...row, position: null, gapToLeader: null, gapToPrevious: null })),
  ];
  return { rows, best, timedCount: timed.length };
}

// Podio de cualquier torneo: [{ name, label }] con los 3 primeros. Campeonato: puntos · Hot Lap: mejor tiempo.
export function podium(tournament) {
  if (isHotLap(tournament)) {
    return hotLapStandings(tournament).rows
      .filter((row) => row.time != null)
      .slice(0, 3)
      .map((row) => ({ id: row.participant.id, name: row.participant.name, label: formatLapTime(row.time) }));
  }
  return computeStandings(tournament)
    .slice(0, 3)
    .filter((row) => row.total > 0)
    .map((row) => ({ id: row.participant.id, name: row.participant.name, label: `${row.total} pts` }));
}
