// Tiempos de vuelta de las clasificaciones, guardados en milisegundos.

// Acepta las formas habituales de escribir un tiempo y devuelve ms (o null si no es válido):
//   1:23.456 · 1:23,456 · 1.23.456 · 1:23:456 · 1:23 · 83.456 · 83 · 123456 (= 1:23.456)
export function parseLapTime(text) {
  const raw = text.trim().replace(',', '.');
  if (!raw) return null;

  let minutes = 0;
  let seconds;
  let fraction = '';

  if (/^\d+$/.test(raw)) {
    if (raw.length >= 4) {
      // Atajo sólo con dígitos: los últimos 3 son milésimas, los 2 anteriores segundos y el resto minutos.
      fraction = raw.slice(-3);
      const rest = raw.slice(0, -3);
      seconds = Number(rest.slice(-2));
      minutes = Number(rest.slice(0, -2) || 0);
    } else {
      seconds = Number(raw);
    }
  } else {
    const parts = raw.split(/[:.]/);
    const separators = raw.match(/[:.]/g) ?? [];
    if (parts.some((part) => !/^\d+$/.test(part)) || parts.length > 3) return null;
    if (parts.length === 2 && separators[0] === ':') {
      [minutes, seconds] = parts.map(Number); // m:ss
    } else if (parts.length === 2) {
      seconds = Number(parts[0]); // ss.mmm
      fraction = parts[1];
    } else {
      minutes = Number(parts[0]); // m:ss.mmm (acepta : o . como separador)
      seconds = Number(parts[1]);
      fraction = parts[2];
    }
  }

  if (fraction.length > 3 || minutes > 99 || seconds > 999) return null;
  if (minutes > 0 && seconds >= 60) return null;
  const total = (minutes * 60 + seconds) * 1000 + Number(fraction.padEnd(3, '0') || 0);
  return total > 0 ? total : null;
}

// ms → "1:23.456"
export function formatLapTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

// Diferencia con el mejor tiempo: "+0.345" o, si pasa del minuto, "+1:02.300".
export function formatGap(ms) {
  return ms < 60000 ? `+${(ms / 1000).toFixed(3)}` : `+${formatLapTime(ms)}`;
}

// Ordena por mejor tiempo: primero los que tienen tiempo (de menor a mayor) y después, sin cambiar su
// orden relativo, los que todavía no lo tienen. Los empates mantienen el orden que ya tenían.
export function sortByTimes(order, times) {
  const index = new Map(order.map((id, i) => [id, i]));
  return [...order].sort((a, b) => {
    const ta = times[a];
    const tb = times[b];
    if (ta != null && tb != null) return ta - tb || index.get(a) - index.get(b);
    if (ta != null) return -1;
    if (tb != null) return 1;
    return index.get(a) - index.get(b);
  });
}
