import { Button, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import TimerIcon from '@mui/icons-material/TimerOutlined';
import { useStore } from '../store/StoreContext';
import PanelCard from './PanelCard';

const COPY = {
  championship: {
    icon: FlagIcon,
    title: 'No hay un campeonato en curso',
    create: 'Crear campeonato',
    hint: (category) => `Elegí el juego, las pistas y el sistema de puntos para arrancar el próximo campeonato de ${category}.`,
    idle: (category) => `Cuando se arme el próximo campeonato de ${category} lo vas a ver acá.`,
  },
  hotlap: {
    icon: TimerIcon,
    title: 'No hay un Hot Lap en curso',
    create: 'Crear Hot Lap',
    hint: (category) => `Elegí el juego y la pista para arrancar el próximo Hot Lap de ${category}: gana quien haga la mejor vuelta.`,
    idle: (category) => `Cuando se arme el próximo Hot Lap de ${category} lo vas a ver acá.`,
  },
};

// Aviso de que la categoría no tiene un torneo en curso de ese tipo, con el botón para crearlo (en modo edición).
// `onCreate(tipo)` abre el alta de torneos.
export default function EmptyTournament({ kind, category, onCreate }) {
  const { editMode } = useStore();
  const copy = COPY[kind];
  const Icon = copy.icon;

  return (
    <PanelCard sx={{ gridColumn: '1 / -1', minHeight: 260, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 440 }}>
        <Icon sx={{ fontSize: 56, color: 'text.secondary' }} />
        <Typography variant="h4" component="h2">{copy.title}</Typography>
        {editMode ? (
          <>
            <Typography color="text.secondary">{copy.hint(category.name)}</Typography>
            <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => onCreate(kind)}>{copy.create}</Button>
          </>
        ) : (
          <Typography color="text.secondary">{copy.idle(category.name)}</Typography>
        )}
      </Stack>
    </PanelCard>
  );
}
