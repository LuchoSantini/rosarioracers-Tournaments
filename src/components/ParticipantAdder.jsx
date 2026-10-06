import { useState } from 'react';
import { Button, Stack, TextField } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import { useStore } from '../store/StoreContext';

// Alta rápida: escribí un nombre y Enter. También acepta varios pegados (uno por línea o separados por coma).
export default function ParticipantAdder({ tournament }) {
  const { actions } = useStore();
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  const submit = () => {
    const names = text.split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) return;

    const taken = new Set(tournament.participants.map((p) => p.name.toLowerCase()));
    const repeated = [];
    const fresh = [];
    for (const name of names) {
      if (taken.has(name.toLowerCase())) repeated.push(name);
      else { taken.add(name.toLowerCase()); fresh.push(name); }
    }

    if (fresh.length) actions.addParticipants(tournament.id, fresh);
    setText('');
    setMessage(repeated.length ? `Ya estaba${repeated.length > 1 ? 'n' : ''}: ${repeated.join(', ')}` : '');
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
      <TextField
        size="small"
        fullWidth
        multiline
        maxRows={4}
        label="Agregar participante"
        placeholder="Nombre y Enter (podés pegar varios)"
        value={text}
        error={Boolean(message)}
        helperText={message || ' '}
        onChange={(e) => { setText(e.target.value); if (message) setMessage(''); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={submit} disabled={!text.trim()} sx={{ height: 40, flexShrink: 0 }}>
        Agregar
      </Button>
    </Stack>
  );
}
