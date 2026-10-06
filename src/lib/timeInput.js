// Estilo compartido de los campos de tiempo (clasificaciones y Hot Lap).
export const TIME_HINT = 'Ej: 1:23.456';

// El mensaje de error flota debajo del campo para no mover las filas.
export const timeHintSx = {
  position: 'absolute', top: '100%', right: 0, m: 0, mt: '1px', whiteSpace: 'nowrap', fontSize: '0.7rem', zIndex: 1,
};

// Los clics y toques dentro de un campo de texto no deben iniciar el arrastre de una fila ordenable.
export const keepOutOfDrag = {
  onMouseDown: (e) => e.stopPropagation(),
  onTouchStart: (e) => e.stopPropagation(),
};
