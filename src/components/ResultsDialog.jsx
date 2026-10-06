import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tab, Tabs, TextField,
  Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import ArrowDownIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DragIcon from '@mui/icons-material/DragIndicator';
import SortIcon from '@mui/icons-material/SortRounded';
import { formatGap, parseLapTime, sortByTimes } from '../lib/laptime';
import { TIME_HINT, timeHintSx } from '../lib/timeInput';
import { pointsForPosition } from '../lib/scoring';
import { FINAL_SOURCE, MAX_FINAL_SIZE, SESSIONS, SESSION_PAIR, TIMED_SESSIONS, groupASize } from '../lib/tournament';
import { DISPLAY_FONT, MEDALS } from '../theme';
import { useStore } from '../store/StoreContext';
import { useConfirm } from './ConfirmProvider';
import Flag from './Flag';
import SortableList, { SortableItem } from './SortableList';
import TimeField from './TimeField';

// P1, P2 y P3 se marcan con oro, plata y bronce.
function PositionTag({ position }) {
  const medal = MEDALS[position];
  return (
    <Box
      sx={{
        width: 40, height: 28, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 1,
        fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: '1.1rem',
        bgcolor: medal ?? 'transparent', color: medal ? '#000' : 'text.secondary',
      }}
    >
      P{position}
    </Box>
  );
}

// Fila de la lista de pendientes en una clasificación: se escribe el tiempo y Enter (o "+" para ubicarlo sin tiempo).
function PendingTimeRow({ participant, disabled = false, onAdd, onAddedWithKeyboard }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const added = useRef(false);

  const submit = (viaKeyboard) => {
    if (added.current || disabled) return;
    const trimmed = text.trim();
    if (!trimmed) {
      added.current = true;
      return onAdd(null);
    }
    const ms = parseLapTime(trimmed);
    if (ms == null) return setError(true);
    added.current = true;
    onAdd(ms);
    if (viaKeyboard) onAddedWithKeyboard();
  };

  // Al salir del campo (Tab o clic en otro lado) con un tiempo escrito también se ubica, no sólo con Enter.
  // Se difiere un instante para que el foco llegue primero al campo siguiente.
  const submitOnLeave = () => {
    if (text.trim()) setTimeout(() => submit(false), 0);
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography sx={{ flex: 1, minWidth: 0, fontWeight: 600 }} noWrap>{participant.name}</Typography>
      <TextField
        size="small"
        value={text}
        error={error}
        disabled={disabled}
        helperText={error ? TIME_HINT : undefined}
        placeholder="1:23.456"
        onChange={(e) => { setText(e.target.value); setError(false); }}
        onBlur={submitOnLeave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) {
            e.preventDefault();
            submit(true);
          }
        }}
        slotProps={{
          htmlInput: { 'aria-label': `Tiempo de ${participant.name}`, inputMode: 'decimal', style: { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } },
          formHelperText: { sx: timeHintSx },
        }}
        sx={{ width: { xs: 100, sm: 118 }, flexShrink: 0, position: 'relative' }}
      />
      <Tooltip title={text.trim() ? 'Ubicar con este tiempo' : 'Ubicar sin tiempo'}>
        <IconButton size="small" color="primary" tabIndex={-1} disabled={disabled} aria-label={`Ubicar a ${participant.name}`} onMouseDown={(e) => e.preventDefault()} onClick={() => submit(false)}><AddIcon /></IconButton>
      </Tooltip>
    </Stack>
  );
}

// Puntos que suma cada posición (P1, P2, P3…) en la sesión que se está cargando. `offset` corre la tabla: en la Final B
// el P1 suma los puntos del puesto siguiente al último de la Final A. P1, P2 y P3 llevan oro, plata y bronce.
function PointsStrip({ rule, offset = 0, count }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexShrink: 0, mb: 1.5 }}>
      <Typography variant="overline" color="text.secondary" sx={{ flexShrink: 0 }}>Puntos por posición</Typography>
      <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.75, flex: 1, minWidth: 0 }}>
        {Array.from({ length: count }, (_, i) => {
          const position = i + 1;
          const medal = MEDALS[position];
          return (
            <Chip
              key={position}
              size="small"
              variant={medal ? 'filled' : 'outlined'}
              sx={{ flexShrink: 0, ...(medal && { bgcolor: medal, color: '#000', fontWeight: 700 }) }}
              label={<><span style={{ opacity: 0.7 }}>P{position}</span>&nbsp;<b style={{ fontFamily: DISPLAY_FONT, fontSize: '1.05em' }}>+{pointsForPosition(rule, position + offset)}</b></>}
            />
          );
        })}
      </Box>
    </Stack>
  );
}

// Carga de resultados. Finales: se toca a cada participante en el orden en que llegó. Clasificaciones: además se
// pueden cargar los tiempos y la tabla se ordena sola por mejor tiempo. Todo se guarda al instante.
export default function ResultsDialog({ open, onClose, tournament, initialRoundId }) {
  const { actions } = useStore();
  const confirm = useConfirm();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const pendingRef = useRef(null);

  const [roundId, setRoundId] = useState(null);
  const [sessionKey, setSessionKey] = useState('q1');

  useEffect(() => {
    if (!open) return;
    setRoundId(initialRoundId ?? tournament.rounds[0]?.id ?? null);
    setSessionKey('q1');
  }, [open, initialRoundId]); // eslint-disable-line react-hooks/exhaustive-deps

  const round = tournament.rounds.find((r) => r.id === roundId) ?? tournament.rounds[0];
  const participants = tournament.participants;
  const byId = useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants]);

  if (!round) return null;

  const order = round.results[sessionKey] ?? [];
  // La Clasificación 2 B da los mismos puntos que la A (su P1 vale lo mismo que el P1 de la A). En la Final B los puestos
  // son P1, P2, P3… de la B, pero cada uno suma los puntos que siguen al último de la Final A (`pointsOffset`).
  const isFinalB = sessionKey === 'finalB';
  const pointsOffset = isFinalB ? groupASize(round.results, 'finalA') : 0;
  // Sólo en la Final B y mientras la Final A está vacía: el corrimiento sale de los clasificados en la Clasificación 2 A.
  const offsetFromQualified = isFinalB && (round.results.finalA ?? []).length === 0 && pointsOffset > 0;
  const rule = tournament.scoring[isFinalB ? 'finalA' : sessionKey === 'q2B' ? 'q2' : sessionKey];
  const sessionLabel = SESSIONS.find((s) => s.key === sessionKey).label;
  const timed = TIMED_SESSIONS.includes(sessionKey);
  const times = round.times?.[sessionKey] ?? {};
  const timeValues = Object.values(times);
  const bestTime = timeValues.length ? Math.min(...timeValues) : null;
  const sortedByTime = sortByTimes(order, times).every((id, i) => id === order[i]);

  // Grupo contrario de la misma sesión (Clasificación 2 A↔B, Final A↔B): quienes ya están ahí no se ofrecen en este.
  const pairKey = SESSION_PAIR[sessionKey];
  const otherGroup = pairKey ? round.results[pairKey] ?? [] : [];
  const full = Boolean(pairKey) && order.length >= MAX_FINAL_SIZE;

  // A cada final van quienes clasificaron en la Clasificación 2 de su grupo (Q2 A → Final A, Q2 B → Final B).
  // Mientras ese grupo de la Clasificación 2 esté vacío (todavía no se cargó, o es un torneo viejo) no se restringe.
  const sourceKey = FINAL_SOURCE[sessionKey];
  const qualified = sourceKey ? round.results[sourceKey] ?? [] : [];
  const restricted = qualified.length > 0;
  const eligible = new Set(qualified);

  const placed = new Set(order);
  const inOtherGroup = new Set(otherGroup);
  const pool = participants.filter((p) => !placed.has(p.id) && !inOtherGroup.has(p.id) && (!restricted || eligible.has(p.id)));

  // Cuántas posiciones mostrar en la franja de puntos: todos en la Clasificación 1; en los grupos, hasta 12 (en los B,
  // los que quedan fuera del grupo A; en las finales, los que clasificaron).
  const isSecondGroup = sessionKey === 'q2B' || isFinalB;
  const expectedCount = !pairKey
    ? participants.length
    : restricted
      ? Math.min(MAX_FINAL_SIZE, qualified.length)
      : Math.min(MAX_FINAL_SIZE, isSecondGroup ? Math.max(participants.length - otherGroup.length, 0) : participants.length);

  const save = (next) => actions.setResult(tournament.id, round.id, sessionKey, next);
  const add = (id) => save([...order, id]);
  const remove = (id) => save(order.filter((x) => x !== id));
  const setTime = (id, ms) => actions.setTime(tournament.id, round.id, sessionKey, id, ms);
  const move = (index, delta) => {
    const next = [...order];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    save(next);
  };
  const addWithTime = (id, ms) => (ms == null ? add(id) : setTime(id, ms));
  // Después de cargar un tiempo con Enter, el cursor pasa al siguiente participante pendiente.
  const focusNextPending = () => setTimeout(() => pendingRef.current?.querySelector('input')?.focus(), 60);

  const clear = async () => {
    if (await confirm({ title: 'Vaciar resultados', message: `Se borra el orden de llegada${timed ? ' y los tiempos' : ''} de ${SESSIONS.find((s) => s.key === sessionKey).label}.`, confirmLabel: 'Vaciar', danger: true })) save([]);
  };

  const removeRound = async () => {
    if (await confirm({ title: 'Eliminar fecha', message: `Se elimina la fecha en ${round.track.name} con todos sus resultados.`, confirmLabel: 'Eliminar', danger: true })) {
      actions.removeRound(tournament.id, round.id);
      if (tournament.rounds.length <= 1) onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={fullScreen}
      // Tamaño fijo: no cambia al pasar de una fecha o sesión a otra; lo que sobra se desplaza adentro.
      slotProps={{ paper: { sx: fullScreen ? {} : { width: 1100, maxWidth: 'calc(100vw - 48px)', height: 720, maxHeight: 'calc(100vh - 48px)' } } }}
    >
      <DialogTitle sx={{ pb: 0 }}>Cargar resultados</DialogTitle>
      <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs
          value={round.id}
          onChange={(_, value) => setRoundId(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Fecha"
          sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
        >
          {tournament.rounds.map((r, i) => (
            <Tab
              key={r.id}
              value={r.id}
              sx={{ minHeight: 56, textTransform: 'none' }}
              label={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Flag code={r.track.countryCode} name={r.track.countryName} height={16} />
                  <span>{i + 1}. {r.track.name}</span>
                </Stack>
              }
            />
          ))}
        </Tabs>

        <Tabs value={sessionKey} onChange={(_, value) => setSessionKey(value)} variant="scrollable" scrollButtons="auto" aria-label="Sesión" sx={{ flexShrink: 0, mb: 1.5 }}>
          {SESSIONS.map((s) => {
            const count = (round.results[s.key] ?? []).length;
            return (
              <Tab
                key={s.key}
                value={s.key}
                label={
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <span>{s.label}</span>
                    <Chip size="small" color={count ? 'primary' : 'default'} label={SESSION_PAIR[s.key] ? `${count}/${MAX_FINAL_SIZE}` : count} />
                  </Stack>
                }
              />
            );
          })}
        </Tabs>

        {participants.length > 0 && expectedCount > 0 && <PointsStrip rule={rule} offset={pointsOffset} count={expectedCount} />}

        {participants.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Primero agregá participantes al torneo.
          </Typography>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1.25fr' }, gridTemplateRows: { md: 'minmax(0, 1fr)' }, overflowY: { xs: 'auto', md: 'hidden' } }}>
            <Box ref={pendingRef} sx={{ minHeight: 0, overflowY: { md: 'auto' }, pr: { md: 0.5 } }}>
              <Typography variant="overline" color="text.secondary">
                {timed ? 'Tiempos de vuelta' : 'Tocá en el orden de llegada'}{full ? ` · completa (${order.length}/${MAX_FINAL_SIZE})` : ''}
              </Typography>

              {timed ? (
                <>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {pool.length === 0 && (
                      <Typography color="text.secondary" variant="body2">
                        {order.length > 0 ? 'Ya están todos ubicados.' : 'No hay participantes disponibles.'}
                      </Typography>
                    )}
                    {pool.map((p) => (
                      <PendingTimeRow key={p.id} participant={p} disabled={full} onAdd={(ms) => addWithTime(p.id, ms)} onAddedWithKeyboard={focusNextPending} />
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                    Escribí el tiempo (1:23.456) y Enter: se ubica solo según su tiempo y el más rápido queda P1. Con “+” se ubica sin tiempo.
                  </Typography>
                </>
              ) : (
                <>
                  <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
                    {pool.length === 0 && (
                      <Typography color="text.secondary" variant="body2">
                        {order.length > 0 ? 'Ya están todos ubicados.' : 'No hay participantes disponibles.'}
                      </Typography>
                    )}
                    {pool.map((p) => (
                      <Chip
                        key={p.id}
                        label={p.name}
                        disabled={full}
                        onClick={() => add(p.id)}
                        variant="outlined"
                        sx={{ fontSize: '0.95rem', height: 38 }}
                      />
                    ))}
                  </Stack>
                </>
              )}

              {sessionKey === 'q2B' && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                  La Clasificación 2 B da los mismos puntos que la Clasificación 2 A: el P1 de la B suma lo mismo que el P1 de la A, y así con los demás.
                </Typography>
              )}
              {isFinalB && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                  {pointsOffset === 0
                    ? 'En la Final B los puestos se cuentan P1, P2, P3…, pero suman los puntos que siguen al último de la Final A. Todavía no hay participantes en la A, así que por ahora cuenta desde el 1º.'
                    : offsetFromQualified
                      ? `En la Final B los puestos se cuentan P1, P2, P3…, pero suman los puntos que siguen al último de la Final A. Como todavía no hay resultados en la A, se cuentan los ${pointsOffset} que clasificaron en la Clasificación 2 A: el P1 de la B suma los puntos del ${pointsOffset + 1}º.`
                      : `En la Final B los puestos se cuentan P1, P2, P3…, pero suman los puntos que siguen al último de la Final A: como en la A corrieron ${pointsOffset}, el P1 de la B suma los puntos del ${pointsOffset + 1}º, el P2 los del ${pointsOffset + 2}º, y así.`}
                </Typography>
              )}
              {sourceKey && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {restricted
                    ? `A la ${sessionLabel} van quienes corrieron la ${SESSIONS.find((s) => s.key === sourceKey).label} (${qualified.length}).`
                    : `Cargá primero la ${SESSIONS.find((s) => s.key === sourceKey).label}: a la ${sessionLabel} van quienes clasificaron ahí.`}
                </Typography>
              )}
              {otherGroup.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {otherGroup.length} participante{otherGroup.length === 1 ? '' : 's'} ya {otherGroup.length === 1 ? 'corre' : 'corren'} en la {SESSIONS.find((s) => s.key === pairKey).label} de esta fecha.
                </Typography>
              )}
            </Box>

            <Box sx={{ minHeight: 0, overflowY: { md: 'auto' }, pr: { md: 0.5 } }}>
              <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="overline" color="text.secondary">{timed ? 'Orden por tiempo' : 'Orden de llegada'}</Typography>
                <Stack direction="row" spacing={0.5}>
                  {timed && (
                    <Tooltip title="Reordena según los tiempos cargados (por ejemplo, después de mover a alguien a mano)">
                      <span>
                        <Button size="small" startIcon={<SortIcon />} disabled={timeValues.length === 0 || sortedByTime} onClick={() => actions.sortByTime(tournament.id, round.id, sessionKey)}>
                          Ordenar por tiempo
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                  <Button size="small" color="inherit" disabled={order.length === 0} onClick={clear}>Vaciar</Button>
                </Stack>
              </Stack>
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mt: 0.5, minHeight: 120 }}>
                {order.length === 0 && (
                  <Typography color="text.secondary" variant="body2" sx={{ p: 2 }}>
                    Todavía no hay resultados en esta sesión. Después podés reordenar arrastrando o con las flechas.
                  </Typography>
                )}
                <SortableList ids={order} onReorder={save}>
                  {order.map((id, i) => {
                    const time = times[id];
                    return (
                      <SortableItem key={id} id={id} sx={{ bgcolor: 'background.paper', borderBottom: i < order.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 1.5, py: 0.5 }}>
                          <DragIcon fontSize="small" sx={{ color: 'text.disabled', ml: -0.5 }} />
                          <PositionTag position={i + 1} />
                          <Typography sx={{ flex: 1, minWidth: 0, fontWeight: 600 }} noWrap>{byId.get(id)?.name}</Typography>
                          {timed && (
                            <>
                              <TimeField key={`${id}:${time ?? ''}`} value={time} label={`Tiempo de ${byId.get(id)?.name}`} onCommit={(ms) => setTime(id, ms)} />
                              <Typography
                                variant="caption"
                                sx={{ width: 62, flexShrink: 0, textAlign: 'right', display: { xs: 'none', sm: 'block' }, fontVariantNumeric: 'tabular-nums', color: time != null && time === bestTime ? MEDALS[1] : 'text.secondary', fontWeight: time === bestTime ? 700 : 400 }}
                              >
                                {time == null ? '—' : time === bestTime ? 'Mejor' : formatGap(time - bestTime)}
                              </Typography>
                            </>
                          )}
                          <Chip size="small" variant="outlined" color="primary" label={`+${pointsForPosition(rule, i + 1 + pointsOffset)}`} sx={{ fontWeight: 700, display: { xs: 'none', sm: 'inline-flex' } }} />
                          <Tooltip title="Subir">
                            <span><IconButton size="small" aria-label="Subir posición" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpIcon /></IconButton></span>
                          </Tooltip>
                          <Tooltip title="Bajar">
                            <span><IconButton size="small" aria-label="Bajar posición" disabled={i === order.length - 1} onClick={() => move(i, 1)}><ArrowDownIcon /></IconButton></span>
                          </Tooltip>
                          <Tooltip title="Quitar">
                            <IconButton size="small" aria-label="Quitar del resultado" onClick={() => remove(id)}><CloseIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </Stack>
                      </SortableItem>
                    );
                  })}
                </SortableList>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="error" startIcon={<DeleteIcon />} onClick={removeRound}>Eliminar fecha</Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }}>
          Se guarda automáticamente
        </Typography>
        <Button variant="contained" onClick={onClose}>Listo</Button>
      </DialogActions>
    </Dialog>
  );
}
