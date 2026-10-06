import { DEFAULT_CATEGORIES } from '../data/categories';

const isCategory = (c) =>
  c && typeof c.id === 'string' && typeof c.slug === 'string' && typeof c.name === 'string' && typeof c.accent === 'string';

// Comprueba que un objeto tenga la forma de los datos guardados (al cargar localStorage o importar un respaldo).
// `categories` es opcional: los respaldos anteriores a la gestión de categorías no la traen.
export function isValidState(value) {
  return Boolean(
    value &&
      Array.isArray(value.tournaments) &&
      (value.categories === undefined || (Array.isArray(value.categories) && value.categories.every(isCategory))) &&
      value.tournaments.every(
        (t) =>
          t &&
          typeof t.id === 'string' &&
          typeof t.categoryId === 'string' &&
          Array.isArray(t.participants) &&
          Array.isArray(t.rounds) &&
          t.scoring,
      ),
  );
}

// Completa datos viejos: sin categorías guardadas (o con la lista vacía) se usan las iniciales, y las fechas guardadas
// antes de existir la Clasificación 2 B reciben ese grupo vacío (así el resto del código puede dar por hecho que existe).
export function normalizeState(state) {
  const categories = Array.isArray(state.categories) && state.categories.length > 0 ? state.categories : DEFAULT_CATEGORIES;
  const tournaments = state.tournaments.map((t) => ({
    ...t,
    rounds: t.rounds.map((round) => ({
      ...round,
      results: { q2B: [], ...round.results },
      times: { q1: {}, q2: {}, q2B: {}, ...round.times },
    })),
  }));
  return { ...state, categories, tournaments };
}
