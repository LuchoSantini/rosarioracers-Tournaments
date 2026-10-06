// Resultados de las primeras 16 fechas del campeonato F1 2026 del mock (hasta el GP de Bahréin en Sepang, 4 de octubre).
// Los números son posiciones en la lista de participantes de demo.js (0 = Augusto Giardini … 19 = Martin Ramirez).
//
// Se reconstruyeron para que la tabla general dé exactamente los puntos de la tabla anual real del local
// (830, 786, 626 … 106) con las reglas de la app: Clasificación 1 (20→1), Clasificación 2 A/B (10→1, igual en las dos),
// Final A (30·26·23…) y Final B con los puntos que siguen al último de la Final A. La Clasificación 2 A son los 12 mejores de
// la Clasificación 1 y la B el resto; cada final la corren los de su Clasificación 2. Algunos participantes faltaron a varias
// fechas, sobre todo los de abajo de la tabla. Además se fijó que haya cuatro fechas perfectas (primero en la Clasificación 1,
// en la 2 y en la Final A): tres de Augusto Giardini (fechas 3, 8 y 13) y una de Luciano Santini (fecha 10), para que se vea
// ese caso en la tabla. Es una deducción: los resultados reales de cada fecha no se conocen.
// Cada fecha: orden de llegada de q1 (todos los que corrieron), q2 (grupo A), q2B (grupo B), finalA y finalB.
export const SEASON_2026_RESULTS = [
  { q1: [6,0,3,5,2,1,4,8,9,7,14,11,10,15,13,12], q2: [1,7,0,9,4,5,8,3,14,11,2,6], q2B: [12,13,15,10], finalA: [0,4,2,6,1,3,5,11,9,14,7,8], finalB: [15,12,13,10] },
  { q1: [15,4,0,1,5,8,6,17,3,2,19,10,13,12,7,11], q2: [1,6,0,8,15,10,3,4,5,2,19,17], q2B: [11,13,12,7], finalA: [1,0,3,17,6,8,4,2,5,10,19,15], finalB: [7,13,12,11] },
  { q1: [0,8,7,11,1,13,15,10,6,3,9,2,4,19,5,12,16], q2: [0,11,3,2,1,9,10,8,6,13,7,15], q2B: [12,5,4,16,19], finalA: [0,3,1,15,7,6,2,10,9,8,11,13], finalB: [16,5,4,12,19] },
  { q1: [10,2,9,6,4,1,12,3,0,5,14,7,13,8,17,18,15,11], q2: [6,1,7,2,3,4,12,10,0,14,9,5], q2B: [8,18,13,11,15,17], finalA: [1,5,3,0,2,4,12,7,6,14,10,9], finalB: [18,8,15,13,11,17] },
  { q1: [3,0,1,5,2,13,6,7,14,4,9,12,16], q2: [4,1,3,0,6,14,12,2,13,7,5,9], q2B: [16], finalA: [1,0,4,2,5,9,14,6,7,3,12,13], finalB: [16] },
  { q1: [1,7,5,0,13,4,2,6,8,3,10,12,17,16,11,9], q2: [0,4,2,3,8,6,1,7,12,10,5,13], q2B: [11,9,17,16], finalA: [1,2,3,0,7,8,5,4,6,13,10,12], finalB: [11,9,16,17] },
  { q1: [3,1,5,12,0,13,11,10,4,9,6,2,8,14,18,19,7], q2: [6,12,2,3,4,9,1,13,0,11,10,5], q2B: [7,8,19,14,18], finalA: [5,1,0,4,2,11,10,9,3,13,12,6], finalB: [19,14,8,18,7] },
  { q1: [0,4,1,3,2,14,19,8,9,5,16,11,7,12,6,10], q2: [0,3,8,1,11,14,4,19,9,2,16,5], q2B: [6,7,10,12], finalA: [0,4,1,11,2,3,5,8,14,9,16,19], finalB: [7,10,6,12] },
  { q1: [3,2,0,4,7,16,15,17,1,5,6,13,18,8,10,9,14], q2: [0,13,1,3,4,2,5,7,16,15,6,17], q2B: [18,9,10,14,8], finalA: [1,0,4,3,5,13,6,2,7,17,16,15], finalB: [10,18,9,8,14] },
  { q1: [1,0,2,4,7,5,15,3,11,10,6,18,9,8,14,12,13,17,19,16], q2: [1,0,15,4,7,3,5,2,18,11,10,6], q2B: [12,13,14,17,9,8,16,19], finalA: [1,0,3,2,6,10,11,15,4,18,5,7], finalB: [9,12,17,8,13,14,19,16] },
  { q1: [0,8,4,1,5,2,18,13,6,11,12,3,7,14,16,9], q2: [0,1,11,6,5,2,8,3,12,13,18,4], q2B: [9,16,14,7], finalA: [2,1,4,8,0,5,11,3,6,18,12,13], finalB: [14,16,7,9] },
  { q1: [16,2,3,7,0,9,8,6,12,4,5,1,14,18,11,17,10], q2: [1,7,4,0,2,8,12,6,5,9,3,16], q2B: [10,18,11,17,14], finalA: [0,5,1,6,3,2,7,8,4,12,16,9], finalB: [18,11,10,17,14] },
  { q1: [0,10,1,6,11,5,3,9,4,2,17,15,13,19,7,12,16], q2: [0,11,9,1,10,17,6,4,15,3,2,5], q2B: [13,16,7,19,12], finalA: [0,1,5,9,6,3,2,10,15,11,4,17], finalB: [19,12,16,7,13] },
  { q1: [0,3,4,1,2,7,8,6,12,17,5,13,19,16,14,10,15], q2: [7,6,2,17,12,4,1,3,5,8,0,13], q2B: [16,14,19,10,15], finalA: [0,4,1,6,8,5,3,12,2,7,13,17], finalB: [14,10,19,16,15] },
  { q1: [3,4,14,0,5,15,1,2,6,11,9,10,16,8,13], q2: [0,2,4,15,3,5,6,10,9,1,11,14], q2B: [16,8,13], finalA: [0,1,6,5,2,9,10,3,14,4,11,15], finalB: [8,13,16] },
  { q1: [5,12,2,0,6,4,3,16,14,1,15,13,7,9,10,8,17,11], q2: [3,2,0,13,1,4,5,12,6,16,14,15], q2B: [17,7,8,9,10,11], finalA: [5,2,0,1,6,13,15,12,16,3,4,14], finalB: [10,9,8,11,17,7] },
];
