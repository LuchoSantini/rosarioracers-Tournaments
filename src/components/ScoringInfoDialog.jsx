import { Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { pointsForPosition } from '../lib/scoring';
import { MAX_FINAL_SIZE } from '../lib/tournament';
import { DISPLAY_FONT, MEDALS, PERFECT_COLOR } from '../theme';

const MAX_ROWS = 30;

// "20 al primero, 1 menos por puesto" / "30, 26, 23, 21, 19 y 17; luego de 2 en 2 menos".
function describe(rule) {
  const { points, step } = rule;
  if (points.length === 0) return 'sin puntos';
  if (points.length === 1) return `${points[0]} al primero${step > 0 ? ` y ${step} menos por cada puesto` : ' y lo mismo para el resto'}`;
  const list = `${points.slice(0, -1).join(', ')} y ${points[points.length - 1]}`;
  return `${list} para los primeros ${points.length}${step > 0 ? `; después se resta ${step} por puesto` : ''}`;
}

const Section = ({ title, children }) => (
  <Box>
    <Typography variant="h6" sx={{ mb: 0.75 }}>{title}</Typography>
    {children}
  </Box>
);

const Rule = ({ children }) => (
  <Typography component="li" variant="body2" color="text.secondary" sx={{ '& b': { color: 'text.primary' }, mb: 0.5 }}>{children}</Typography>
);

const headSx = { fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' };

// Modal que explica el sistema de puntos de un campeonato: tabla de puntos por posición en cada sesión y reglas de cálculo.
export default function ScoringInfoDialog({ open, onClose, tournament }) {
  const { scoring } = tournament;
  const total = tournament.participants.length;
  const rowsCount = Math.min(MAX_ROWS, Math.max(total, 6));
  const manyParticipants = total > MAX_FINAL_SIZE;
  const finalRows = Math.min(MAX_FINAL_SIZE, rowsCount);
  const positions = Array.from({ length: rowsCount }, (_, i) => i + 1);

  // Final A: sólo hasta 12. Final B: P1, P2… suman los puntos que siguen al último de la Final A (12 si corrió completa).
  const finalA = (p) => (p <= finalRows ? pointsForPosition(scoring.finalA, p) : null);
  const finalB = (p) => (manyParticipants && p <= total - MAX_FINAL_SIZE ? pointsForPosition(scoring.finalA, MAX_FINAL_SIZE + p) : null);
  const cell = (value) => (value == null ? <Box component="span" sx={{ color: 'text.disabled' }}>–</Box> : `+${value}`);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pr: 7 }}>
        <Typography component="span" variant="h4" sx={{ display: 'block' }}>Sistema de puntos</Typography>
        <Typography component="span" variant="body2" color="text.secondary" sx={{ fontFamily: 'inherit', textTransform: 'none', letterSpacing: 0, fontWeight: 400, display: 'block' }}>
          {tournament.name}
        </Typography>
        <IconButton aria-label="Cerrar" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Section title="Cómo se suma">
            <Typography variant="body2" color="text.secondary">
              Cada fecha tiene Clasificación 1, Clasificación 2 (grupos A y B) y Final (grupos A y B). Los puntos de la fecha son la suma de lo que
              se gana en cada sesión según la posición, y el total del campeonato es la suma de todas las fechas.
            </Typography>
          </Section>

          <Section title="Puntos por posición">
            <Stack component="ul" spacing={0} sx={{ pl: 2.5, mb: 1.5, mt: 0 }}>
              <Rule><b>Clasificación 1:</b> {describe(scoring.q1)}.</Rule>
              <Rule><b>Clasificación 2 (A y B):</b> {describe(scoring.q2)}. La B da los mismos puntos que la A.</Rule>
              <Rule><b>Final:</b> {describe(scoring.finalA)}.</Rule>
            </Stack>

            <TableContainer sx={{ maxHeight: 320, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small" stickyHeader aria-label="Puntos por posición">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headSx}>Pos</TableCell>
                    <TableCell align="right" sx={headSx}>Clasif. 1</TableCell>
                    <TableCell align="right" sx={headSx}>Clasif. 2 A / B</TableCell>
                    <TableCell align="right" sx={headSx}>Final A</TableCell>
                    {manyParticipants && <TableCell align="right" sx={headSx}>Final B</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((p) => {
                    const medal = MEDALS[p];
                    return (
                      <TableRow key={p}>
                        <TableCell>
                          <Box component="span" sx={{ display: 'inline-grid', placeItems: 'center', minWidth: 34, px: 0.75, borderRadius: 1, fontFamily: DISPLAY_FONT, fontWeight: 800, bgcolor: medal ?? 'transparent', color: medal ? '#000' : 'text.secondary' }}>
                            P{p}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{cell(pointsForPosition(scoring.q1, p))}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{cell(p <= MAX_FINAL_SIZE || !manyParticipants ? pointsForPosition(scoring.q2, p) : null)}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{cell(finalA(p))}</TableCell>
                        {manyParticipants && <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{cell(finalB(p))}</TableCell>}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          <Stack component="ul" spacing={0} sx={{ pl: 2.5, m: 0 }}>
            {manyParticipants && (
              <Rule><b>Final B:</b> el P1 suma los puntos del siguiente al último de la Final A, el P2 los del que sigue, y así.</Rule>
            )}
            <Rule>
              <b>Marcas en la tabla:</b> puntos <Box component="span" sx={{ color: MEDALS[1], fontWeight: 700 }}>dorados</Box> = ganó la Final A; cuadradito = pole de la Clasificación 2; todo en{' '}
              <Box component="span" sx={{ color: PERFECT_COLOR, fontWeight: 700 }}>violeta</Box> = primero en todo (Clasificación 1, Clasificación 2 y Final A).
            </Rule>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
