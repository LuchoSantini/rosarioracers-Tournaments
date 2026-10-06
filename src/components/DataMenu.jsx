import { useRef, useState } from 'react';
import { Alert, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Snackbar, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined';
import UploadIcon from '@mui/icons-material/FileUploadOutlined';
import ScienceIcon from '@mui/icons-material/ScienceOutlined';
import DeleteIcon from '@mui/icons-material/DeleteForeverOutlined';
import { initialState } from '../store/reducer';
import { useStore } from '../store/StoreContext';
import { isValidState } from '../store/validate';
import { buildDemoState } from '../data/demo';
import { useConfirm } from './ConfirmProvider';

// Los datos viven en este navegador (localStorage): exportar/importar sirve de respaldo o para pasarlos a otra PC.
export default function DataMenu() {
  const { state, actions, editMode } = useStore();
  const confirm = useConfirm();
  const [anchor, setAnchor] = useState(null);
  const [notice, setNotice] = useState(null);
  const fileInput = useRef(null);

  const close = () => setAnchor(null);

  const exportData = () => {
    close();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rrc-torneos-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!isValidState(parsed)) throw new Error('formato');
      if (await confirm({ title: 'Importar datos', message: 'Esto reemplaza todos los torneos actuales por los del archivo.', confirmLabel: 'Importar', danger: true })) {
        actions.replaceAll(parsed);
        setNotice({ severity: 'success', text: `Se importaron ${parsed.tournaments.length} torneos.` });
      }
    } catch {
      setNotice({ severity: 'error', text: 'El archivo no es un respaldo válido de RRC Torneos.' });
    }
  };

  const loadDemo = async () => {
    close();
    if (await confirm({ title: 'Cargar mock de F1', message: 'Esto reemplaza todos los torneos actuales por el mock de F1 (participantes y pistas de ejemplo) y las categorías vuelven a las iniciales.', confirmLabel: 'Cargar mock', danger: true })) {
      actions.replaceAll(buildDemoState());
    }
  };

  const reset = async () => {
    close();
    if (await confirm({ title: 'Borrar todo', message: 'Se eliminan todos los torneos, participantes y resultados de este navegador, y las categorías vuelven a las iniciales. No se puede deshacer.', confirmLabel: 'Borrar todo', danger: true })) {
      actions.replaceAll(initialState);
    }
  };

  return (
    <>
      <Tooltip title="Datos">
        <IconButton aria-label="Datos" onClick={(e) => setAnchor(e.currentTarget)}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem onClick={exportData}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Exportar respaldo (JSON)</ListItemText>
        </MenuItem>
        {editMode && [
          <MenuItem key="import" onClick={() => { close(); fileInput.current?.click(); }}>
            <ListItemIcon><UploadIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Importar respaldo</ListItemText>
          </MenuItem>,
          <Divider key="div" />,
          <MenuItem key="demo" onClick={loadDemo}>
            <ListItemIcon><ScienceIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Cargar mock de F1</ListItemText>
          </MenuItem>,
          <MenuItem key="reset" onClick={reset} sx={{ color: 'error.light' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Borrar todo</ListItemText>
          </MenuItem>,
        ]}
      </Menu>

      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importData} />

      <Snackbar open={Boolean(notice)} autoHideDuration={5000} onClose={() => setNotice(null)}>
        {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.text}</Alert> : undefined}
      </Snackbar>
    </>
  );
}
