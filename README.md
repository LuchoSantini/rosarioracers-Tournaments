# RRC Torneos

SPA de torneos de simuladores de conducción para Rosario Racers Café. React (JSX) + Material UI + Vite.

## Cómo correrlo

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # genera dist/ (se puede subir a cualquier hosting estático)
```

## Cómo funciona

- **Landing**: carrusel con una categoría por pantalla (flechas, teclado ← →, o deslizando en celular).
- **Categoría**: un selector **Campeonatos | Hot Laps** (junto a "Nuevo torneo" y "Gestionar torneos") separa los dos tipos de torneo; la vista elegida queda en la URL (`?v=hotlap`). *Campeonatos*: la tabla de posiciones del campeonato en curso (70%) y sus pistas (30%, reordenables, con la próxima destacada). *Hot Laps*: el Hot Lap en curso con su tabla de mejores vueltas. En ambos casos, abajo y a todo el ancho, va el histórico de ese tipo con el ganador de cada torneo. Tocar un participante abre un modal con sus puntos por fecha; tocar un torneo del histórico abre el detalle con podio y tabla final.
- **Torneo**: juego + pistas + sistema de puntos. Cada pista es una **fecha** con Clasificación 1, Clasificación 2 A, Clasificación 2 B, Final A y Final B (máx. 12 por grupo; nadie corre los dos grupos de la misma sesión). A la Final A van quienes corrieron la Clasificación 2 A y a la Final B quienes corrieron la Clasificación 2 B. La Clasificación 2 B da los mismos puntos que la A (su P1 vale lo mismo que el P1 de la A). En la Final B los puestos se cuentan P1, P2, P3…, pero suman los puntos que siguen al último de la Final A: si en la A corren 7, el P1 de la B suma los puntos del 8º, el P2 los del 9º, y así. El total es la suma de todas las fechas.
- **Cargar resultados**: en las finales se toca a cada participante en el orden en que llegó (se puede reordenar arrastrando) y los puntos se calculan solos. En cada tanda, arriba de las listas, se ve cuántos puntos suma cada posición (en la Final B, ya desplazados según los que corrieron en la A). En las clasificaciones (Clasificación 1 y 2 A/B) se cargan los tiempos de vuelta y la tabla se ordena sola por mejor tiempo.
- **Puntos** (por defecto, formato F1): Q1 20→1, Q2 10→1, carrera 30·26·23·21·19·17 y de 2 en 2. Es editable por torneo (`src/lib/scoring.js`).
- **Tipos de torneo**: *Campeonato* (fechas con clasificaciones y finales, descrito arriba) y *Hot Lap* (una pista; gana la mejor vuelta). Cada categoría puede tener a la vez un campeonato y un Hot Lap en curso. El Hot Lap tiene su propia vista: tabla de mejores vueltas con medallas y diferencias contra el líder y el anterior; las vueltas se registran por nombre y tiempo (si el participante ya tenía un tiempo, se conserva el mejor) y se pueden corregir en la tabla.
- **Imagen de la tabla**: el botón *Imagen* (junto a la tabla de posiciones, en el Hot Lap y en el detalle de un torneo del histórico) abre en una pestaña nueva una imagen resumida de la tabla, a elegir entre formato **Instagram** (1080 × 1920, vertical) o **PC** (1920 × 1080, horizontal; con más de 10 participantes se parte en dos columnas). La pestaña incluye un enlace para descargar el PNG; si el navegador bloquea las ventanas emergentes, el archivo se descarga directamente. Se dibuja en un canvas (`src/lib/standingsImage.js`).
- **Gestión de torneos (ABM)**: botón de lista del encabezado (`/#/torneos`). Lista todos los torneos con filtros por categoría, tipo y estado, y permite crear, editar (nombre, juego, categoría y, en campeonatos, puntos), finalizar, reabrir y eliminar. El tipo y la pista de un torneo no se cambian después de crearlo.
- **Gestión de categorías**: pestaña "Categorías" de la gestión (`/#/categorias`). Permite crear categorías (nombre y color), renombrarlas, cambiarles el color, ordenarlas —el orden es el del carrusel de la pantalla principal— y eliminarlas. El slug (la URL) se genera al crearla y no cambia al renombrar. Eliminar una categoría elimina también sus torneos (se pide confirmación indicando cuántos) y siempre queda al menos una.
- **Acceso de administrador** (`/#/adminFer`): sólo quien inicia sesión puede editar; el resto ve la app en modo lectura, sin ningún control de edición. Con la sesión iniciada aparece en el encabezado el interruptor **Edición** (apagado oculta los controles, útil para mostrar la tabla en una pantalla del local) y un botón para cerrar sesión. Las credenciales están en `src/auth/credentials.js` y son **sólo para pruebas**: como la app no tiene servidor, la comprobación es local, los valores viajan dentro del JavaScript y cualquiera con conocimientos puede saltearla o editar el `localStorage`. Para proteger la edición de verdad hace falta un backend con sesiones.

## Datos

Se guardan en el `localStorage` del navegador, no hay servidor. Desde el engranaje del encabezado se puede exportar/importar un respaldo (JSON), cargar el mock de F1 o borrar todo. La primera vez que se abre la app arranca con el mock de F1: el Campeonato F1 2026 con el calendario real (23 fechas, 16 ya disputadas) y los 20 participantes y puntos de la tabla anual del local, más campeonatos anteriores y dos Hot Laps. Los resultados de cada fecha están deducidos para que la tabla dé exactamente esos puntos (`src/data/f1Season2026.js`); "Borrar todo" lo elimina y no vuelve a aparecer.

## Personalizar

- Logo: `public/logo-rrc.png`.
- Categorías iniciales: `src/data/categories.js` (después se administran desde la app). Juegos sugeridos: `src/data/games.js`.
- Pistas y países: `src/data/tracks.js` y `src/data/countries.js`. Las banderas son SVG locales en `src/assets/flags/` (de [flag-icons](https://github.com/lipis/flag-icons), MIT); si un país no tiene bandera se muestran las 3 primeras letras de su nombre.
