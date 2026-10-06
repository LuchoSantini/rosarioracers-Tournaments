// Categorías iniciales. Después se administran desde la app (Gestión → Categorías) y se guardan con el resto de los datos.
// `accent` tiñe la landing y la página de cada categoría; `slug` es la parte de la URL y no cambia al renombrar.
export const DEFAULT_CATEGORIES = [
  { id: 'f1', slug: 'f1', name: 'F1', accent: '#ff2d20' },
  { id: 'tn3', slug: 'tn-clase-3', name: 'TN Clase 3', accent: '#3b82f6' },
  { id: 'tc', slug: 'turismo-carretera', name: 'Turismo Carretera', accent: '#ffcc01' },
  { id: 'golf', slug: 'copa-golf', name: 'Copa Golf', accent: '#22c55e' },
  { id: 'saveiro', slug: 'copa-saveiro', name: 'Copa Saveiro', accent: '#ff7a1a' },
];

// Colores sugeridos para elegir en el formulario (también se puede escribir uno propio).
export const ACCENT_PALETTE = [
  '#ff2d20', '#ff7a1a', '#ffcc01', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#e5e7eb',
];

export const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(value);

// "Copa Ñandú 2" → "copa-nandu-2"; si ya existe, se le agrega -2, -3…
export function uniqueSlug(name, existing) {
  const base =
    name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'categoria';
  const taken = new Set(existing);
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}
