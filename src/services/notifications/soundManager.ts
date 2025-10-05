/**
 * Servicio de Gestión de Sonidos
 * Módulo 2 - Nosara Emergency App
 */

import { Audio } from 'expo-av';
import { AUDIO_MODE_CONFIG, SOUND_CONFIG, SOUND_FILES } from '../../constants/sounds';
import { SoundCategory } from '../../types/notifications';

class SoundManager {
  private sounds: Map<SoundCategory, Audio.Sound> = new Map();
  private isInitialized: boolean = false;
  private currentlyPlaying: SoundCategory | null = null;

  /**
   * Inicializa el sistema de audio
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: AUDIO_MODE_CONFIG.playsInSilentModeIOS,
        allowsRecordingIOS: AUDIO_MODE_CONFIG.allowsRecordingIOS,
        staysActiveInBackground: AUDIO_MODE_CONFIG.staysActiveInBackground,
        shouldDuckAndroid: AUDIO_MODE_CONFIG.shouldDuckAndroid,
        playThroughEarpieceAndroid: AUDIO_MODE_CONFIG.playThroughEarpieceAndroid,
      });

      // Precargar todos los sonidos
      await this.preloadSounds();

      this.isInitialized = true;
      console.log('✅ Sistema de audio inicializado');
    } catch (error) {
      console.error('❌ Error inicializando audio:', error);
      throw error;
    }
  }

  /**
   * Precarga todos los sonidos en memoria
   */
  private async preloadSounds(): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    for (const [category, file] of Object.entries(SOUND_FILES)) {
      if (file && category !== SoundCategory.NONE) {
        loadPromises.push(this.loadSound(category as SoundCategory, file));
      }
    }

    await Promise.all(loadPromises);
    console.log(`✅ ${loadPromises.length} sonidos precargados`);
  }

  /**
   * Carga un sonido individual
   */
  private async loadSound(category: SoundCategory, file: any): Promise<void> {
    try {
      const config = SOUND_CONFIG[category];
      const { sound } = await Audio.Sound.createAsync(
        file,
        {
          volume: config.volume,
          shouldPlay: false,
          isLooping: config.isLooping,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        this.onPlaybackStatusUpdate
      );

      this.sounds.set(category, sound);
    } catch (error) {
      console.error(`❌ Error cargando sonido ${category}:`, error);
    }
  }

  /**
   * Reproduce un sonido
   */
  async playSound(category: SoundCategory): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Si es NONE, no reproducir
      if (category === SoundCategory.NONE) {
        return;
      }

      // Detener sonido actual si está reproduciendo
      if (this.currentlyPlaying) {
        await this.stopSound(this.currentlyPlaying);
      }

      const sound = this.sounds.get(category);
      if (!sound) {
        console.warn(`⚠️ Sonido no encontrado: ${category}`);
        return;
      }

      // Configurar volumen específico
      const config = SOUND_CONFIG[category];
      await sound.setVolumeAsync(config.volume);

      // Reproducir desde el inicio
      await sound.setPositionAsync(0);
      await sound.playAsync();

      this.currentlyPlaying = category;
      console.log(`🔊 Reproduciendo sonido: ${category}`);
    } catch (error) {
      console.error(`❌ Error reproduciendo sonido ${category}:`, error);
    }
  }

  /**
   * Detiene un sonido específico
   */
  async stopSound(category: SoundCategory): Promise<void> {
    try {
      const sound = this.sounds.get(category);
      if (sound) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);

        if (this.currentlyPlaying === category) {
          this.currentlyPlaying = null;
        }
      }
    } catch (error) {
      console.error(`❌ Error deteniendo sonido ${category}:`, error);
    }
  }

  /**
   * Detiene todos los sonidos
   */
  async stopAllSounds(): Promise<void> {
    const stopPromises: Promise<any>[] = [];

    for (const [category, sound] of this.sounds.entries()) {
      stopPromises.push(
        sound.stopAsync().catch(error =>
          console.error(`Error deteniendo ${category}:`, error)
        )
      );
    }

    await Promise.all(stopPromises);
    this.currentlyPlaying = null;
  }

  /**
   * Ajusta el volumen de un sonido
   */
  async setVolume(category: SoundCategory, volume: number): Promise<void> {
    try {
      const sound = this.sounds.get(category);
      if (sound) {
        // Asegurar que el volumen esté entre 0 y 1
        const clampedVolume = Math.max(0, Math.min(1, volume));
        await sound.setVolumeAsync(clampedVolume);
      }
    } catch (error) {
      console.error(`❌ Error ajustando volumen de ${category}:`, error);
    }
  }

  /**
   * Ajusta el volumen de todos los sonidos
   */
  async setGlobalVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const volumePromises: Promise<any>[] = [];

    for (const [category, sound] of this.sounds.entries()) {
      if (category !== SoundCategory.NONE) {
        volumePromises.push(
          sound.setVolumeAsync(clampedVolume).catch(error =>
            console.error(`Error ajustando volumen de ${category}:`, error)
          )
        );
      }
    }

    await Promise.all(volumePromises);
  }

  /**
   * Callback de actualización de reproducción
   */
  private onPlaybackStatusUpdate = (status: any): void => {
    if ('didJustFinish' in status && status.didJustFinish && !status.isLooping) {
      this.currentlyPlaying = null;
    }
  };

  /**
   * Verifica si un sonido está reproduciendo
   */
  async isPlaying(category: SoundCategory): Promise<boolean> {
    try {
      const sound = this.sounds.get(category);
      if (!sound) return false;

      const status = await sound.getStatusAsync();
      return 'isLoaded' in status && status.isLoaded && 'isPlaying' in status && status.isPlaying;
    } catch (error) {
      console.error(`❌ Error verificando reproducción de ${category}:`, error);
      return false;
    }
  }

  /**
   * Obtiene el sonido que está reproduciendo actualmente
   */
  getCurrentlyPlaying(): SoundCategory | null {
    return this.currentlyPlaying;
  }

  /**
   * Limpia recursos
   */
  async cleanup(): Promise<void> {
    try {
      await this.stopAllSounds();

      const unloadPromises: Promise<any>[] = [];
      for (const sound of this.sounds.values()) {
        unloadPromises.push(
          sound.unloadAsync().catch(error =>
            console.error('Error descargando sonido:', error)
          )
        );
      }

      await Promise.all(unloadPromises);
      this.sounds.clear();
      this.isInitialized = false;
      this.currentlyPlaying = null;

      console.log('✅ Sistema de audio limpiado');
    } catch (error) {
      console.error('❌ Error limpiando sistema de audio:', error);
    }
  }

  /**
   * Verifica si el sistema está inicializado
   */
  isSystemInitialized(): boolean {
    return this.isInitialized;
  }
}

// Exportar instancia singleton
export const soundManager = new SoundManager();
