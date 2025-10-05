import { create } from 'zustand';
import {
    LocationPermissionStatus,
    LocationServiceState,
    UserLocation,
} from '../types/location';

interface LocationStore extends LocationServiceState {
  // Estado actual
  currentLocation: UserLocation | null;
  isWatching: boolean;
  lastUpdate: number | null;

  // Acciones para actualizar estado del servicio
  setLoading: (isLoading: boolean) => void;
  setEnabled: (isEnabled: boolean) => void;
  setPermission: (status: LocationPermissionStatus) => void;
  setError: (error: string | null) => void;

  // Acciones para ubicación
  setCurrentLocation: (location: UserLocation | null) => void;
  setWatching: (isWatching: boolean) => void;
  updateLocation: (location: UserLocation) => void;

  // Estado completo del servicio
  setServiceState: (state: Partial<LocationServiceState>) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  // Estado del servicio
  isLoading: false,
  isEnabled: false,
  hasPermission: false,
  permissionStatus: 'undetermined' as LocationPermissionStatus,
  error: null,

  // Estado de ubicación
  currentLocation: null,
  isWatching: false,
  lastUpdate: null,
};

export const useLocationStore = create<LocationStore>((set) => ({
  ...initialState,

  // Acciones del servicio
  setLoading: (isLoading) => set({ isLoading }),

  setEnabled: (isEnabled) => set({ isEnabled }),

  setPermission: (permissionStatus) =>
    set({
      permissionStatus,
      hasPermission: permissionStatus === 'granted',
    }),

  setError: (error) => set({ error }),

  // Acciones de ubicación
  setCurrentLocation: (currentLocation) =>
    set({
      currentLocation,
      lastUpdate: currentLocation ? Date.now() : null,
    }),

  setWatching: (isWatching) => set({ isWatching }),

  updateLocation: (location) =>
    set({
      currentLocation: location,
      lastUpdate: Date.now(),
    }),

  // Actualizar estado completo del servicio
  setServiceState: (state) =>
    set((prev) => ({
      ...prev,
      ...state,
    })),

  // Reset completo
  reset: () => set(initialState),
}));
