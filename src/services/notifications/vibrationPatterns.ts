/**
 * Servicio de Patrones de Vibración
 * Módulo 2 - Nosara Emergency App
 */

import * as Haptics from 'expo-haptics';
import { VibrationPattern } from '../../types/notifications';

// Patrones de vibración en milisegundos [vibrar, pausa, vibrar, pausa, ...]
const VIBRATION_PATTERNS = {
  [VibrationPattern.CRITICAL]: [0, 500, 200, 500, 200, 500, 200, 500], // Continuo
  [VibrationPattern.URGENT]: [0, 400, 200, 400], // Urgente
  [VibrationPattern.STANDARD]: [0, 300], // Estándar
  [VibrationPattern.SUBTLE]: [0, 100], // Sutil
  [VibrationPattern.NONE]: [], // Sin vibración
} as const;

// Tipos de feedback háptico de Expo
const HAPTIC_FEEDBACK = {
  [VibrationPattern.CRITICAL]: Haptics.NotificationFeedbackType.Error,
  [VibrationPattern.URGENT]: Haptics.NotificationFeedbackType.Warning,
  [VibrationPattern.STANDARD]: Haptics.NotificationFeedbackType.Success,
  [VibrationPattern.SUBTLE]: Haptics.ImpactFeedbackStyle.Light,
  [VibrationPattern.NONE]: null,
} as const;

class VibrationService {
  private isVibrating: boolean = false;
  private vibrationTimeout: NodeJS.Timeout | null = null;

  /**
   * Ejecuta un patrón de vibración
   */
  async vibrate(pattern: VibrationPattern): Promise<void> {
    try {
      // Si ya está vibrando, cancelar
      if (this.isVibrating) {
        this.cancel();
      }

      // Si es NONE, no hacer nada
      if (pattern === VibrationPattern.NONE) {
        return;
      }

      this.isVibrating = true;

      // Usar feedback háptico de Expo (mejor para iOS)
      const hapticType = HAPTIC_FEEDBACK[pattern];

      if (hapticType) {
        if (pattern === VibrationPattern.SUBTLE) {
          // Para vibración sutil usar impact
          await Haptics.impactAsync(hapticType as Haptics.ImpactFeedbackStyle);
        } else {
          // Para otras usar notification
          await Haptics.notificationAsync(hapticType as Haptics.NotificationFeedbackType);
        }

        // Para patrones críticos y urgentes, repetir
        if (pattern === VibrationPattern.CRITICAL) {
          await this.repeatVibration(4, 500); // 4 repeticiones con 500ms de pausa
        } else if (pattern === VibrationPattern.URGENT) {
          await this.repeatVibration(2, 400); // 2 repeticiones con 400ms de pausa
        }
      }

      this.isVibrating = false;
    } catch (error) {
      console.error('Error en vibración:', error);
      this.isVibrating = false;
    }
  }

  /**
   * Repite una vibración varias veces
   */
  private async repeatVibration(times: number, intervalMs: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.delay(intervalMs);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }

  /**
   * Vibración simple (un solo pulso)
   */
  async vibrateSimple(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error en vibración simple:', error);
    }
  }

  /**
   * Vibración de selección (para interacciones UI)
   */
  async vibrateSelection(): Promise<void> {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.error('Error en vibración de selección:', error);
    }
  }

  /**
   * Vibración de éxito
   */
  async vibrateSuccess(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error en vibración de éxito:', error);
    }
  }

  /**
   * Vibración de advertencia
   */
  async vibrateWarning(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.error('Error en vibración de advertencia:', error);
    }
  }

  /**
   * Vibración de error
   */
  async vibrateError(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.error('Error en vibración de error:', error);
    }
  }

  /**
   * Cancela la vibración actual
   */
  cancel(): void {
    if (this.vibrationTimeout) {
      clearTimeout(this.vibrationTimeout);
      this.vibrationTimeout = null;
    }
    this.isVibrating = false;
  }

  /**
   * Verifica si está vibrando actualmente
   */
  isCurrentlyVibrating(): boolean {
    return this.isVibrating;
  }

  /**
   * Obtiene el patrón de vibración para un tipo
   */
  getPattern(pattern: VibrationPattern): readonly number[] {
    return VIBRATION_PATTERNS[pattern];
  }

  /**
   * Helper para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instancia singleton
export const vibrationService = new VibrationService();
