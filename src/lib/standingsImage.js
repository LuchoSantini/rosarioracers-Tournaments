import { computeStandings } from './standings';
import { hotLapStandings } from './hotlap';
import { formatGap, formatLapTime } from './laptime';
import { isHotLap, roundStatuses } from './tournament';
import { BRAND_YELLOW, MEDALS } from '../theme';

// Imagen resumida de una tabla de posiciones (campeonato o Hot Lap), dibujada en un canvas y abierta en una pestaña nueva.
export const IMAGE_FORMATS = {
  instagram: { id: 'instagram', label: 'Instagram', detail: '1080 × 1920 · vertical (stories)', width: 1080, height: 1920 },
  pc: { id: 'pc', label: 'PC', detail: '1920 × 1080 · horizontal', width: 1920, height: 1080 },
};

const DISPLAY = '"Barlow Condensed", "Arial Narrow", sans-serif';
const BODY = '"Barlow", system-ui, sans-serif';
const MAX_ROWS = 28;

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, alpha) => `rgba(${hexToRgb(hex).join(',')},${alpha})`;

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

// Recorta el texto con "…" para que entre en `maxWidth` con la fuente actual del canvas.
function fit(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function setSpacing(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

// Filas normalizadas según el tipo de torneo: { pos, name, main, sub, leader, medal }.
function buildRows(tournament) {
  if (isHotLap(tournament)) {
    const { rows } = hotLapStandings(tournament);
    return {
      columns: { main: 'MEJOR TIEMPO', sub: 'DIF. LÍDER' },
      rows: rows.map((row) => ({
        pos: row.position,
        name: row.participant.name,
        main: row.time == null ? '—' : formatLapTime(row.time),
        sub: row.time == null ? '' : row.position === 1 ? 'MEJOR' : formatGap(row.gapToLeader),
      })),
    };
  }
  return {
    columns: { main: 'PUNTOS', sub: null },
    rows: computeStandings(tournament).map((row) => ({ pos: row.position, name: row.participant.name, main: String(row.total), sub: null })),
  };
}

// Línea de contexto bajo el título: hasta qué fecha llegó el campeonato o en qué pista se corre el Hot Lap.
function contextLine(tournament) {
  if (isHotLap(tournament)) return tournament.rounds[0]?.track ? `Pista: ${tournament.rounds[0].track.name}` : '';
  const statuses = roundStatuses(tournament);
  const played = tournament.rounds.filter((r) => statuses[r.id] === 'done');
  if (played.length === 0) return `${tournament.rounds.length} fechas`;
  const last = played[played.length - 1];
  const lastIndex = tournament.rounds.indexOf(last) + 1;
  return `Tras la fecha ${lastIndex} de ${tournament.rounds.length} · ${last.track.name}`;
}

function drawBackground(ctx, W, H, accent, logo) {
  ctx.fillStyle = '#07080b';
  ctx.fillRect(0, 0, W, H);

  const glowA = ctx.createRadialGradient(W * 0.1, 0, 0, W * 0.1, 0, Math.max(W, H) * 0.75);
  glowA.addColorStop(0, rgba(accent, 0.28));
  glowA.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, W, H);

  const glowB = ctx.createRadialGradient(W, H, 0, W, H, Math.max(W, H) * 0.7);
  glowB.addColorStop(0, rgba(BRAND_YELLOW, 0.16));
  glowB.addColorStop(1, rgba(BRAND_YELLOW, 0));
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, W, H);

  // líneas de velocidad
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 3;
  for (let x = -H; x < W + H; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - H * 0.47, H);
    ctx.stroke();
  }
  ctx.restore();

  // logo grande y difuminado de fondo
  if (logo) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.1;
    ctx.filter = 'blur(6px)';
    const size = Math.min(W, H) * 0.95;
    ctx.drawImage(logo, W - size * 0.78, H - size * 0.9, size, size);
    ctx.restore();
  }
}

function drawHeader(ctx, { W, accent, logo, tournament, categoryName, context, compact, x, y }) {
  const logoSize = compact ? 130 : 150;
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, logoSize, logoSize, 14);
    ctx.clip();
    ctx.drawImage(logo, x, y, logoSize, logoSize);
    ctx.restore();
    ctx.strokeStyle = BRAND_YELLOW;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, logoSize, logoSize, 14);
    ctx.stroke();
  }

  const textX = x + logoSize + 36;
  const maxW = (compact ? W - textX - 70 : W - textX - 70);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#9ba1ad';
  ctx.font = `600 ${compact ? 28 : 30}px ${DISPLAY}`;
  setSpacing(ctx, 6);
  ctx.fillText(isHotLap(tournament) ? 'HOT LAP · MEJORES VUELTAS' : 'TABLA DE POSICIONES', textX, y + 36);

  setSpacing(ctx, 0);
  ctx.fillStyle = '#f4f5f7';
  let size = compact ? 84 : 92;
  ctx.font = `800 italic ${size}px ${DISPLAY}`;
  const title = tournament.name.toUpperCase();
  while (ctx.measureText(title).width > maxW && size > 40) {
    size -= 2;
    ctx.font = `800 italic ${size}px ${DISPLAY}`;
  }
  ctx.fillText(title, textX, y + 36 + 14 + size * 0.86);

  const subY = y + 36 + 14 + size * 0.86 + 18 + 30;
  ctx.font = `600 32px ${BODY}`;
  ctx.fillStyle = accent;
  const tag = `${categoryName.toUpperCase()}  ·  ${tournament.game}`;
  ctx.fillText(fit(ctx, tag, maxW), textX, subY - 6);
  ctx.fillStyle = '#c4c8d0';
  ctx.font = `500 30px ${BODY}`;
  if (context) ctx.fillText(fit(ctx, context, maxW), textX, subY + 34);

  // barra de color de la categoría
  ctx.save();
  ctx.fillStyle = accent;
  ctx.transform(1, 0, -0.42, 1, 0, 0);
  ctx.fillRect(textX + 0.42 * (subY + 52), subY + 52, 190, 8);
  ctx.restore();

  return subY + 52 + 8;
}

// Dibuja una tarjeta con las filas. `box` = { x, y, w, h }.
function drawTable(ctx, { rows, columns, startIndex, box, accent, rowHeightMax = 78, hasSub }) {
  const { x, y, w, h } = box;
  ctx.fillStyle = 'rgba(14,16,21,0.9)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const pad = 34;
  const headH = 56;
  const innerY = y + 22;
  ctx.font = `700 24px ${DISPLAY}`;
  setSpacing(ctx, 4);
  ctx.fillStyle = '#7d8493';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('POS', x + pad, innerY + headH / 2);
  ctx.fillText('PARTICIPANTE', x + pad + 78, innerY + headH / 2);
  ctx.textAlign = 'right';
  const mainRight = x + w - pad - (hasSub ? 190 : 0);
  ctx.fillText(columns.main, mainRight, innerY + headH / 2);
  if (hasSub && columns.sub) ctx.fillText(columns.sub, x + w - pad, innerY + headH / 2);
  setSpacing(ctx, 0);

  const listY = innerY + headH;
  const availH = y + h - 22 - listY;
  const rowH = Math.min(rowHeightMax, Math.floor(availH / rows.length));

  rows.forEach((row, i) => {
    const ry = listY + i * rowH;
    const cy = ry + rowH / 2;
    const medal = MEDALS[row.pos];

    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      ctx.beginPath();
      ctx.roundRect(x + 14, ry + 2, w - 28, rowH - 4, 12);
      ctx.fill();
    }
    if (medal) {
      ctx.fillStyle = medal;
      ctx.beginPath();
      ctx.roundRect(x + 14, ry + 6, 6, rowH - 12, 3);
      ctx.fill();
    }

    // posición
    const badge = Math.min(46, rowH - 10);
    ctx.fillStyle = medal ?? 'transparent';
    ctx.beginPath();
    ctx.roundRect(x + pad - 4, cy - badge / 2, badge + 6, badge, 9);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = medal ? '#000' : '#9ba1ad';
    ctx.font = `800 ${Math.round(badge * 0.72)}px ${DISPLAY}`;
    ctx.fillText(row.pos == null ? '–' : String(row.pos), x + pad - 4 + (badge + 6) / 2, cy + 2);

    // nombre
    ctx.textAlign = 'left';
    ctx.fillStyle = row.pos === 1 ? '#ffffff' : '#e6e8ec';
    ctx.font = `${row.pos && row.pos <= 3 ? 700 : 600} ${Math.min(42, Math.round(rowH * 0.58))}px ${BODY}`;
    ctx.fillText(fit(ctx, row.name, mainRight - (x + pad + 78) - (hasSub ? 190 : 150)), x + pad + 78, cy + 2);

    // dato principal
    ctx.textAlign = 'right';
    ctx.fillStyle = row.pos === 1 ? MEDALS[1] : row.main === '—' ? '#5d6371' : '#ffffff';
    ctx.font = `800 ${Math.min(50, Math.round(rowH * 0.7))}px ${DISPLAY}`;
    ctx.fillText(row.main, mainRight, cy + 2);

    if (hasSub && row.sub) {
      ctx.fillStyle = '#9ba1ad';
      ctx.font = `500 ${Math.min(30, Math.round(rowH * 0.42))}px ${BODY}`;
      ctx.fillText(row.sub, x + w - pad, cy + 2);
    }
  });
  ctx.textAlign = 'left';
}

function drawFooter(ctx, { W, H, extra }) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = BRAND_YELLOW;
  ctx.font = `700 30px ${DISPLAY}`;
  setSpacing(ctx, 6);
  ctx.fillText('ROSARIO RACERS CAFÉ', W / 2, H - 56);
  setSpacing(ctx, 0);
  ctx.fillStyle = '#7d8493';
  ctx.font = `500 24px ${BODY}`;
  const date = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  ctx.fillText(extra ? `${extra}  ·  ${date}` : date, W / 2, H - 22);
  ctx.textAlign = 'left';
}

export async function renderStandingsImage(tournament, category, formatId) {
  const format = IMAGE_FORMATS[formatId];
  const { width: W, height: H } = format;
  const accent = category?.accent ?? BRAND_YELLOW;

  // las fuentes se cargan bajo demanda: hay que pedirlas antes de dibujar
  await Promise.all([
    document.fonts.load(`800 italic 40px ${DISPLAY}`),
    document.fonts.load(`700 24px ${DISPLAY}`),
    document.fonts.load(`600 24px ${DISPLAY}`),
    document.fonts.load(`600 24px ${BODY}`),
    document.fonts.load(`500 24px ${BODY}`),
  ]).catch(() => {});
  const logo = await loadImage(`${import.meta.env.BASE_URL}logo-rrc.png`);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const { rows: allRows, columns } = buildRows(tournament);
  const rows = allRows.slice(0, MAX_ROWS);
  const hidden = allRows.length - rows.length;
  const hasSub = Boolean(columns.sub);
  const compact = format.id === 'pc';

  drawBackground(ctx, W, H, accent, logo);
  const headerBottom = drawHeader(ctx, {
    W, accent, logo, tournament, categoryName: category?.name ?? '', context: contextLine(tournament),
    compact, x: compact ? 90 : 70, y: compact ? 60 : 90,
  });

  const footerH = 110;
  if (rows.length === 0) {
    ctx.fillStyle = '#9ba1ad';
    ctx.font = `600 40px ${BODY}`;
    ctx.textAlign = 'center';
    ctx.fillText('Todavía no hay participantes', W / 2, H / 2 + 100);
    ctx.textAlign = 'left';
  } else if (!compact) {
    // vertical: una sola tarjeta que ocupa el alto disponible
    const top = headerBottom + 50;
    drawTable(ctx, { rows, columns, hasSub, accent, box: { x: 60, y: top, w: W - 120, h: H - top - footerH } });
  } else if (rows.length > 10) {
    // horizontal con muchos participantes: dos columnas
    const top = headerBottom + 36;
    const half = Math.ceil(rows.length / 2);
    const gap = 40, margin = 70;
    const colW = (W - margin * 2 - gap) / 2;
    const h = H - top - footerH + 30;
    drawTable(ctx, { rows: rows.slice(0, half), columns, hasSub, accent, rowHeightMax: 72, box: { x: margin, y: top, w: colW, h } });
    drawTable(ctx, { rows: rows.slice(half), columns, hasSub, accent, rowHeightMax: 72, box: { x: margin + colW + gap, y: top, w: colW, h } });
  } else {
    const top = headerBottom + 36;
    const w = 1200;
    drawTable(ctx, { rows, columns, hasSub, accent, rowHeightMax: 78, box: { x: (W - w) / 2, y: top, w, h: H - top - footerH + 30 } });
  }

  drawFooter(ctx, { W, H, extra: hidden > 0 ? `+${hidden} participantes más` : '' });

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))), 'image/png'));
}

const slug = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Abre la imagen en una pestaña nueva. Hay que llamarla directamente desde un clic: la pestaña se abre antes de generar
// la imagen (que tarda un instante) para que el navegador no la bloquee como ventana emergente.
export async function openStandingsImage(tournament, category, formatId) {
  const format = IMAGE_FORMATS[formatId];
  const fileName = `${slug(tournament.name)}-${format.id}.png`;
  const win = window.open('', '_blank');
  if (win) {
    win.document.title = `Generando imagen…`;
    win.document.body.style.cssText = 'margin:0;background:#07080b;color:#9ba1ad;font:16px system-ui;display:grid;place-items:center;height:100vh';
    win.document.body.textContent = 'Generando imagen…';
  }

  let blob;
  try {
    blob = await renderStandingsImage(tournament, category, formatId);
  } catch (error) {
    win?.close();
    throw error;
  }
  const url = URL.createObjectURL(blob);

  if (!win) {
    // ventanas emergentes bloqueadas: se descarga el archivo
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    return;
  }

  win.document.open();
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${tournament.name} · ${format.label}</title>
<style>
  html,body{margin:0;background:#07080b;min-height:100%}
  body{display:flex;flex-direction:column;align-items:center;gap:14px;padding:16px;box-sizing:border-box;min-height:100vh;font:600 15px system-ui,sans-serif}
  img{max-width:100%;max-height:calc(100vh - 80px);object-fit:contain;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.6)}
  a{color:#000;background:#ffcc01;padding:9px 18px;border-radius:8px;text-decoration:none}
</style></head><body>
<img src="${url}" alt="Tabla de posiciones: ${tournament.name}">
<a href="${url}" download="${fileName}">Descargar PNG (${format.width} × ${format.height})</a>
</body></html>`);
  win.document.close();
}
