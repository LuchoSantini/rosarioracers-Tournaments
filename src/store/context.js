import { createContext } from 'react';

// El contexto vive en su propio archivo, que casi nunca se edita. Así, aunque el servidor de desarrollo recargue en
// caliente StoreContext.jsx, el proveedor y los hooks siguen usando el mismo objeto de contexto (si no, aparece
// "useStore debe usarse dentro de <StoreProvider>" hasta recargar la página).
export const StoreContext = createContext(null);
