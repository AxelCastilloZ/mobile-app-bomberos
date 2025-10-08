import 'dotenv/config';

// Validar que las variables críticas existan
const requiredEnvVars = ['DEV_API_URL', 'DEV_WS_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV !== 'production') {
  console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
  console.error('💡 Crea un archivo .env.development con estas variables');
}

export default {
  expo: {
    name: "Nosara Emergency",
    slug: "nosara-emergency-app",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "nosara-emergency",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#dc2626"
    },
    assetBundlePatterns: ["**/*"],
    plugins: [
      "expo-router",
      "expo-secure-store"
    ],
    extra: {
      router: {
        origin: false
      },

      environment: process.env.NODE_ENV || "development",

      // ✅ CORRECTO: Solo variables de entorno, sin fallbacks hardcodeados
      apiEndpoint: process.env.NODE_ENV === 'production'
        ? process.env.PROD_API_URL
        : process.env.DEV_API_URL,

      wsEndpoint: process.env.NODE_ENV === 'production'
        ? process.env.PROD_WS_URL
        : process.env.DEV_WS_URL,
    }
  }
};
