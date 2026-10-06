import { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { StoreContext } from './context';
import { initialState, reducer } from './reducer';
import { buildDemoState } from '../data/demo';
import { isValidState, normalizeState } from './validate';
import { activeOf } from '../lib/tournament';
import { ADMIN_PASSWORD, ADMIN_USER } from '../auth/credentials';

const STORAGE_KEY = 'rrc-torneos:v1';
const EDIT_MODE_KEY = 'rrc-torneos:edit-mode';
const ADMIN_KEY = 'rrc-torneos:admin';

// Primera vez que se abre la app (nada guardado): se arranca con el mock de F1 para tener algo que ver.
// Si ya hay datos guardados, incluso vacíos tras "Borrar todo", se respetan tal cual.
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return buildDemoState();
    const parsed = JSON.parse(saved);
    if (isValidState(parsed)) return normalizeState(parsed);
  } catch (error) {
    // Sin acceso al storage o JSON corrupto: se arranca vacío.
    console.warn('No se pudieron cargar los datos guardados:', error);
  }
  return initialState;
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  // Sesión de administrador (login en /adminFer). Sin ella la app es de sólo lectura. Ver auth/credentials.js.
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [editModeSetting, setEditModeState] = useState(() => {
    try {
      return localStorage.getItem(EDIT_MODE_KEY) !== '0';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Cuota llena o storage bloqueado: la app sigue funcionando en memoria.
    }
  }, [state]);

  const setEditMode = useCallback((value) => {
    setEditModeState(value);
    try {
      localStorage.setItem(EDIT_MODE_KEY, value ? '1' : '0');
    } catch {
      // ignorado
    }
  }, []);

  const login = useCallback((user, password) => {
    if (user.trim() !== ADMIN_USER || password !== ADMIN_PASSWORD) return false;
    setIsAdmin(true);
    try {
      localStorage.setItem(ADMIN_KEY, '1');
    } catch {
      // ignorado: la sesión dura hasta recargar
    }
    return true;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(ADMIN_KEY);
    } catch {
      // ignorado
    }
  }, []);

  // Sólo el administrador puede editar: el modo edición queda activo únicamente con la sesión iniciada.
  const editMode = isAdmin && editModeSetting;

  const actions = useMemo(
    () => ({
      createTournament: (tournament) => dispatch({ type: 'tournament/create', tournament }),
      updateTournament: (id, patch) => dispatch({ type: 'tournament/update', id, patch }),
      finishTournament: (id) => dispatch({ type: 'tournament/finish', id }),
      reopenTournament: (id) => dispatch({ type: 'tournament/reopen', id }),
      deleteTournament: (id) => dispatch({ type: 'tournament/delete', id }),
      addParticipants: (id, names) => dispatch({ type: 'participants/add', id, names }),
      renameParticipant: (id, participantId, name) => dispatch({ type: 'participant/rename', id, participantId, name }),
      removeParticipant: (id, participantId) => dispatch({ type: 'participant/remove', id, participantId }),
      addRounds: (id, tracks) => dispatch({ type: 'rounds/add', id, tracks }),
      reorderRounds: (id, roundIds) => dispatch({ type: 'rounds/reorder', id, roundIds }),
      removeRound: (id, roundId) => dispatch({ type: 'round/remove', id, roundId }),
      setResult: (id, roundId, session, order) => dispatch({ type: 'result/set', id, roundId, session, order }),
      recordLap: (id, name, ms) => dispatch({ type: 'lap/record', id, name, ms }),
      setLap: (id, participantId, ms) => dispatch({ type: 'lap/set', id, participantId, ms }),
      setTime: (id, roundId, session, participantId, ms) => dispatch({ type: 'time/set', id, roundId, session, participantId, ms }),
      sortByTime: (id, roundId, session) => dispatch({ type: 'result/sortByTime', id, roundId, session }),
      setBallast: (id, roundId, participantId, kg) => dispatch({ type: 'ballast/set', id, roundId, participantId, kg }),
      replaceBallast: (id, roundId, ballast) => dispatch({ type: 'ballast/replace', id, roundId, ballast }),
      createCategory: (category) => dispatch({ type: 'category/create', category }),
      updateCategory: (id, patch) => dispatch({ type: 'category/update', id, patch }),
      deleteCategory: (id) => dispatch({ type: 'category/delete', id }),
      reorderCategories: (ids) => dispatch({ type: 'categories/reorder', ids }),
      replaceAll: (next) => dispatch({ type: 'data/replace', state: next }),
    }),
    [],
  );

  const value = useMemo(
    () => ({ state, actions, editMode, setEditMode, isAdmin, login, logout }),
    [state, actions, editMode, setEditMode, isAdmin, login, logout],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}

// Categorías en el orden en que se muestran, con búsquedas por id y por slug.
export function useCategories() {
  const { state } = useStore();
  return useMemo(() => {
    const categories = state.categories;
    return {
      categories,
      categoryById: (id) => categories.find((c) => c.id === id),
      categoryBySlug: (slug) => categories.find((c) => c.slug === slug),
    };
  }, [state.categories]);
}

// Torneos de una categoría: el campeonato en curso (`active`), el Hot Lap en curso (`activeHotLap`) —como máximo uno
// de cada tipo— y el histórico de finalizados de ambos tipos, del más reciente al más antiguo.
export function useCategoryTournaments(categoryId) {
  const { state } = useStore();
  return useMemo(() => {
    const all = state.tournaments.filter((t) => t.categoryId === categoryId);
    return {
      active: activeOf(all, categoryId, 'championship'),
      activeHotLap: activeOf(all, categoryId, 'hotlap'),
      history: all
        .filter((t) => t.status === 'finished')
        .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? '')),
      total: all.length,
    };
  }, [state.tournaments, categoryId]);
}
