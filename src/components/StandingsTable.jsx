import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/EditOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { computeStandings } from '../lib/standings';
import { ballastOf, hasBallast, roundStatuses } from '../lib/tournament';
import { DISPLAY_FONT, MEDALS, PERFECT_COLOR } from '../theme';
import Flag from './Flag';
import LiveDot from './LiveDot';
import ParticipantDialog from './ParticipantDialog';
import PositionBadge from './PositionBadge';

// Sólo las columnas de fechas se desplazan en horizontal (torneos anuales con muchas fechas):
// Pos y Participante quedan fijos a la izquierda; Total y botones de edición, fijos a la derecha.
const ACTIONS_WIDTH = 84;
const sticky = { position: 'sticky', zIndex: 2, bgcolor: 'background.paper' };
const stickyPos = { ...sticky, left: 0, width: 56, minWidth: 56 };
const BALLAST_WIDTH = 78;
const stickyName = (withBallast) => ({ ...sticky, left: 56, width: 210, minWidth: 210, ...(!withBallast && { boxShadow: '6px 0 8px -6px rgba(0,0,0,0.7)' }) });
const stickyBallast = { ...sticky, left: 266, width: BALLAST_WIDTH, minWidth: BALLAST_WIDTH, px: 1, boxShadow: '6px 0 8px -6px rgba(0,0,0,0.7)' };
const stickyTotal = (editable) => ({ ...sticky, right: editable ? ACTIONS_WIDTH : 0, minWidth: 72, boxShadow: '-6px 0 8px -6px rgba(0,0,0,0.7)' });
const stickyActions = { ...sticky, right: 0, width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH, px: 0.5 };

// Puntos de un participante en una fecha, con las marcas de la tabla:
//   · puntos dorados = ganó la Final A
//   · cuadradito dorado = hizo la pole de la Clasificación 2 (primero de la Clasificación 2 A)
//   · todo violeta (puntos y cuadradito) = primero en todo: Clasificación 1, Clasificación 2 y Final A
function RoundPoints({ r }) {
  const wonFinal = r.group === 'A' && r.finalPos === 1;
  const pole = r.q2Group === 'A' && r.q2Pos === 1;
  const perfect = wonFinal && pole && r.q1Pos === 1;
  const color = perfect ? PERFECT_COLOR : wonFinal ? MEDALS[1] : undefined;
  const title = perfect
    ? 'Primero en todo: Clasificación 1, Clasificación 2 y Final A'
    : [wonFinal && 'Ganó la Final A', pole && 'Pole de la Clasificación 2'].filter(Boolean).join(' · ');

  return (
    <Tooltip title={title} disableHoverListener={!title}>
      <Box component="span" sx={{ position: 'relative', display: 'inline-block', color, fontWeight: color ? 700 : undefined }}>
        {r.total}
        {pole && (
          <Box
            component="span"
            aria-label="Pole de la Clasificación 2"
            sx={{ position: 'absolute', right: -11, top: '50%', width: 7, height: 7, mt: '-3.5px', borderRadius: '1px', bgcolor: perfect ? PERFECT_COLOR : MEDALS[1] }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

// Explica las marcas de los puntos por fecha.
function Legend() {
  const sample = (color, square) => (
    <Box component="span" sx={{ position: 'relative', display: 'inline-block', color, fontWeight: 700, mr: square ? 1.5 : 0.25 }}>
      {square ? '' : '00'}
      {square && <Box component="span" sx={{ display: 'inline-block', width: 7, height: 7, borderRadius: '1px', bgcolor: color, verticalAlign: 'middle' }} />}
    </Box>
  );
  return (
    <Stack direction="row" useFlexGap spacing={2} sx={{ flexWrap: 'wrap', mt: 1.5, color: 'text.secondary' }}>
      <Typography variant="caption">{sample(MEDALS[1])} ganó la Final A</Typography>
      <Typography variant="caption">{sample(MEDALS[1], true)}pole de la Clasificación 2</Typography>
      <Typography variant="caption">{sample(PERFECT_COLOR)} primero en todo</Typography>
    </Stack>
  );
}

// Tabla general: una columna por fecha (bandera de la pista) y el total.
// Al tocar una fila se abre un modal con el detalle de puntos de ese participante.
export default function StandingsTable({ tournament, onRename, onRemove }) {
  const rows = useMemo(() => computeStandings(tournament), [tournament]);
  const [selectedId, setSelectedId] = useState(null);
  const editable = Boolean(onRename || onRemove);
  const selected = rows.find((row) => row.participant.id === selectedId) ?? null;

  // Fecha que se está disputando: la primera sin completar (en disputa o la que sigue).
  const statuses = useMemo(() => roundStatuses(tournament), [tournament]);
  const currentRound = tournament.rounds.find((r) => statuses[r.id] === 'live' || statuses[r.id] === 'next') ?? null;
  const currentId = currentRound?.id ?? null;
  // Torneos con lastre: columna fija con el lastre (kg) que lleva cada uno en la fecha que se está disputando.
  const withBallast = hasBallast(tournament) && currentRound !== null;
  const hasRows = rows.length > 0;
  const boxRef = useRef(null);

  // Al abrir (o cuando cambia la fecha en curso) se desplaza la tabla para que esa fecha sea la primera visible,
  // justo después de las columnas fijas; las anteriores quedan a la izquierda, ocultas.
  useEffect(() => {
    const box = boxRef.current;
    const column = box?.querySelector('[data-current="true"]');
    const lastFixed = box?.querySelector('[data-col="ballast"]') ?? box?.querySelector('[data-col="name"]');
    if (!column || !lastFixed) return;
    box.scrollLeft += column.getBoundingClientRect().left - lastFixed.getBoundingClientRect().right;
  }, [currentId, tournament.id, hasRows, withBallast]);

  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Todavía no hay participantes.
      </Typography>
    );
  }

  const open = (id) => setSelectedId(id);

  return (
    <>
      <TableContainer ref={boxRef}>
        <Table size="small" aria-label="Tabla de posiciones" sx={{ "& tbody td": { py: 0.25 } }}>
          <TableHead>
            <TableRow>
              <TableCell className="sticky-cell" sx={stickyPos}>Pos</TableCell>
              <TableCell className="sticky-cell" data-col="name" sx={stickyName(withBallast)}>Participante</TableCell>
              {withBallast && (
                <TableCell className="sticky-cell" data-col="ballast" align="center" sx={stickyBallast}>
                  <Tooltip title={`Lastre para la fecha ${tournament.rounds.indexOf(currentRound) + 1} · ${currentRound.track.name}`}>
                    <span>Lastre</span>
                  </Tooltip>
                </TableCell>
              )}
              {tournament.rounds.map((round, i) => {
                const current = round.id === currentId;
                const note = current ? (statuses[round.id] === 'live' ? ' · en disputa' : ' · próxima') : '';
                return (
                  <TableCell
                    key={round.id}
                    align="center"
                    data-current={current ? 'true' : undefined}
                    sx={[
                      { px: 1 },
                      current && {
                        minWidth: 64,
                        color: 'primary.main',
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.16),
                        boxShadow: (t) => `inset 0 3px 0 ${t.palette.primary.main}`,
                      },
                    ]}
                  >
                    <Tooltip title={`${i + 1}. ${round.track.name} · ${round.track.countryName}${note}`}>
                      <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                        <Flag code={round.track.countryCode} name={round.track.countryName} height={14} />
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          {current && <LiveDot color="primary.main" size={7} />}
                          <span>F{i + 1}</span>
                        </Stack>
                      </Stack>
                    </Tooltip>
                  </TableCell>
                );
              })}
              <TableCell align="right" className="sticky-cell" sx={stickyTotal(editable)}>Total</TableCell>
              {editable && <TableCell className="sticky-cell" sx={stickyActions} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.participant.id}
                hover
                tabIndex={0}
                aria-label={`Ver resultados de ${row.participant.name}`}
                onClick={() => open(row.participant.id)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    open(row.participant.id);
                  }
                }}
                sx={{ cursor: 'pointer', '&:hover > .sticky-cell': { bgcolor: '#181b22' } }}
              >
                <TableCell className="sticky-cell" sx={stickyPos}><PositionBadge position={row.position} size={24} /></TableCell>
                <TableCell className="sticky-cell" sx={stickyName(withBallast)}>
                  <Typography sx={{ fontWeight: 600, fontSize: "1rem", lineHeight: 1.3 }}>{row.participant.name}</Typography>
                </TableCell>
                {withBallast && (
                  <TableCell className="sticky-cell" align="center" sx={stickyBallast}>
                    {ballastOf(currentRound, row.participant.id) > 0 ? (
                      <Box component="span" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
                        {ballastOf(currentRound, row.participant.id)} kg
                      </Box>
                    ) : (
                      <Box component="span" sx={{ color: 'text.disabled' }}>–</Box>
                    )}
                  </TableCell>
                )}
                {row.rounds.map((r, i) => {
                  const played = r.q1Pos || r.q2Pos || r.finalPos;
                  const current = tournament.rounds[i].id === currentId;
                  return (
                    <TableCell
                      key={tournament.rounds[i].id}
                      align="center"
                      sx={[{ color: played ? 'text.primary' : 'text.disabled' }, current && { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }]}
                    >
                      {played ? <RoundPoints r={r} /> : '–'}
                    </TableCell>
                  );
                })}
                <TableCell align="right" className="sticky-cell" sx={{ ...stickyTotal(editable), fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: "1.25rem", lineHeight: 1.3, color: row.position === 1 ? MEDALS[1] : 'text.primary' }}>
                  {row.total}
                </TableCell>
                {editable && (
                  <TableCell align="right" className="sticky-cell" sx={{ ...stickyActions, whiteSpace: 'nowrap' }}>
                    {onRename && (
                      <Tooltip title="Cambiar nombre">
                        <IconButton size="small" aria-label={`Cambiar nombre de ${row.participant.name}`} onClick={(e) => { e.stopPropagation(); onRename(row.participant); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onRemove && (
                      <Tooltip title="Quitar del torneo">
                        <IconButton size="small" aria-label={`Quitar a ${row.participant.name}`} onClick={(e) => { e.stopPropagation(); onRemove(row.participant); }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Legend />

      <ParticipantDialog row={selected} tournament={tournament} totalParticipants={rows.length} onClose={() => setSelectedId(null)} />
    </>
  );
}
