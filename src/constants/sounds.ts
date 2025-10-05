/**
 * Constantes de Sonidos
 * Módulo 2 - Nosara Emergency App
 */

import { SoundCategory } from '../types/notifications';

// Rutas de archivos de sonido
export const SOUND_FILES = {
  [SoundCategory.EMERGENCY_ALARM]: require('../assets/sounds/emergency_alarm.mp3'),
  [SoundCategory.EMERGENCY_UPDATE]: require('../assets/sounds/emergency_update.mp3'),
  [SoundCategory.NEW_REPORT]: require('../assets/sounds/new_report.mp3'),
  [SoundCategory.STATUS_CHANGE]: require('../assets/sounds/status_change.mp3'),
  [SoundCategory.NONE]: null,
} as const;

// Configuración de reproducción por categoría
export const SOUND_CONFIG = {
  [SoundCategory.EMERGENCY_ALARM]: {
    volume: 1.0,
    shouldPlay: true,
    isLooping: false,
    numberOfLoops: 0,
    interruptionMode: 'doNotMix' as const,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: true,
  },
  [SoundCategory.EMERGENCY_UPDATE]: {
    volume: 0.8,
    shouldPlay: true,
    isLooping: false,
    numberOfLoops: 0,
    interruptionMode: 'duckOthers' as const,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  },
  [SoundCategory.NEW_REPORT]: {
    volume: 0.6,
    shouldPlay: true,
    isLooping: false,
    numberOfLoops: 0,
    interruptionMode: 'duckOthers' as const,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  },
  [SoundCategory.STATUS_CHANGE]: {
    volume: 0.5,
    shouldPlay: true,
    isLooping: false,
    numberOfLoops: 0,
    interruptionMode: 'duckOthers' as const,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  },
  [SoundCategory.NONE]: {
    volume: 0,
    shouldPlay: false,
    isLooping: false,
    numberOfLoops: 0,
    interruptionMode: 'duckOthers' as const,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  },
} as const;

// Duración aproximada de cada sonido (en milisegundos)
export const SOUND_DURATIONS = {
  [SoundCategory.EMERGENCY_ALARM]: 3000,
  [SoundCategory.EMERGENCY_UPDATE]: 2000,
  [SoundCategory.NEW_REPORT]: 1500,
  [SoundCategory.STATUS_CHANGE]: 1000,
  [SoundCategory.NONE]: 0,
} as const;

// Configuración de audio del sistema
export const AUDIO_MODE_CONFIG = {
  playsInSilentModeIOS: true,
  allowsRecordingIOS: false,
  staysActiveInBackground: true,
  interruptionModeIOS: 'duckOthers' as const,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
} as const;
