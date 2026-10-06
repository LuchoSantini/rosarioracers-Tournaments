import { useState } from 'react';
import { Alert, Button, ListItemIcon, ListItemText, Menu, MenuItem, Snackbar } from '@mui/material';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import MonitorIcon from '@mui/icons-material/DesktopWindowsOutlined';
import PhoneIcon from '@mui/icons-material/PhoneIphoneOutlined';
import { IMAGE_FORMATS, openStandingsImage } from '../lib/standingsImage';
import { useCategories } from '../store/StoreContext';

const ICONS = { instagram: PhoneIcon, pc: MonitorIcon };

// Botón "Imagen": elegir el formato (Instagram o PC) y abrir en una pestaña nueva una imagen resumida de la tabla.
export default function StandingsImageButton({ tournament, variant = 'outlined', size = 'medium' }) {
  const { categoryById } = useCategories();
  const [anchor, setAnchor] = useState(null);
  const [failed, setFailed] = useState(false);

  const choose = (formatId) => {
    setAnchor(null);
    // se llama directo desde el clic del menú: así el navegador permite abrir la pestaña nueva
    openStandingsImage(tournament, categoryById(tournament.categoryId), formatId).catch((error) => {
      console.error('No se pudo generar la imagen:', error);
      setFailed(true);
    });
  };

  return (
    <>
      <Button variant={variant} size={size} startIcon={<ImageIcon />} onClick={(e) => setAnchor(e.currentTarget)} aria-haspopup="menu">
        Imagen
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {Object.values(IMAGE_FORMATS).map((format) => {
          const Icon = ICONS[format.id];
          return (
            <MenuItem key={format.id} onClick={() => choose(format.id)}>
              <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
              <ListItemText primary={format.label} secondary={format.detail} />
            </MenuItem>
          );
        })}
      </Menu>
      <Snackbar open={failed} autoHideDuration={5000} onClose={() => setFailed(false)}>
        <Alert severity="error" onClose={() => setFailed(false)}>No se pudo generar la imagen.</Alert>
      </Snackbar>
    </>
  );
}
