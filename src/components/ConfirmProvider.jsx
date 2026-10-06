import { useCallback, useContext, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { ConfirmContext } from './confirmContext';

// const confirm = useConfirm(); if (await confirm({ title, message, confirmLabel, danger })) { ... }
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const [open, setOpen] = useState(false);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setRequest({ ...options, resolve });
        setOpen(true);
      }),
    [],
  );

  const close = (result) => {
    request.resolve(result);
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onClose={() => close(false)} maxWidth="xs">
        <DialogTitle>{request?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{request?.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={request?.danger ? 'error' : 'primary'}
            onClick={() => close(true)}
            autoFocus
          >
            {request?.confirmLabel ?? 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}
