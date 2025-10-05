import 'dotenv/config';

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
    plugins: ["expo-router"],
    extra: {
      // Configuración original del router
      router: {
        origin: false
      },
      
      // Variables de entorno para la app
      environment: process.env.NODE_ENV || "development",
      
      // URLs dinámicas según el entorno
      apiEndpoint: process.env.NODE_ENV === 'production' 
        ? process.env.PROD_API_URL || "https://api.bomberos-nosara.cr"
        : process.env.DEV_API_URL || "http://192.168.100.115:3000",
        
      wsEndpoint: process.env.NODE_ENV === 'production'
        ? process.env.PROD_WS_URL || "wss://api.bomberos-nosara.cr" 
        : process.env.DEV_WS_URL || "ws://192.168.100.115:3000",
        
      // Variables adicionales
      apiUrl: process.env.API_URL || "http://192.168.100.115:3000",
      wsUrl: process.env.WS_URL || "ws://192.168.100.115:3000"
    }
  }
};