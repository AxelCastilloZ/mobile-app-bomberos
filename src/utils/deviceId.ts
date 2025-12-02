import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'device_id';

/**
 * Obtiene el deviceId guardado o crea uno nuevo si no existe.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existingDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (existingDeviceId) {
      console.log('📱 [DeviceId] Recuperado:', existingDeviceId);
      return existingDeviceId;
    }

    const newDeviceId = generateDeviceId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);
    console.log('📱 [DeviceId] Creado nuevo:', newDeviceId);

    return newDeviceId;
  } catch (error) {
    console.error('❌ [DeviceId] Error:', error);
    return generateDeviceId();
  }
}

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `device-${timestamp}-${randomPart}`;
}
