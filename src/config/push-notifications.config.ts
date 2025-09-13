
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { CONFIG, NOTIFICATION_CONFIG } from './environment';


export const NOTIFICATION_CATEGORIES = [
  {
    identifier: 'emergency',
    actions: [
      {
        identifier: 'view_emergency',
        title: 'Ver Emergencia',
        options: {
          foreground: true,
        },
      },
      {
        identifier: 'dismiss',
        title: 'Descartar',
        options: {
          foreground: false,
        },
      },
    ],
    options: {
      customDismissAction: true,
      allowInCarPlay: false,
    },
  },
  {
    identifier: 'report_update',
    actions: [
      {
        identifier: 'view_report',
        title: 'Ver Reporte',
        options: {
          foreground: true,
        },
      },
    ],
    options: {
      customDismissAction: false,
      allowInCarPlay: false,
    },
  },
  {
    identifier: 'personnel_alert',
    actions: [
      {
        identifier: 'acknowledge',
        title: 'Reconocer',
        options: {
          foreground: false,
        },
      },
      {
        identifier: 'view_details',
        title: 'Ver Detalles',
        options: {
          foreground: true,
        },
      },
    ],
    options: {
      customDismissAction: true,
      allowInCarPlay: false,
    },
  },
];


export const ANDROID_CHANNELS = [
  {
    channelId: NOTIFICATION_CONFIG.EMERGENCY_CHANNEL_ID,
    name: 'Emergencias Críticas',
    description: 'Notificaciones de emergencias que requieren atención inmediata',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'emergency_alert.wav',
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    lightColor: '#D32F2F',
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  },
  {
    channelId: NOTIFICATION_CONFIG.REPORTS_CHANNEL_ID,
    name: 'Actualizaciones de Reportes',
    description: 'Notificaciones sobre el estado de tus reportes de emergencia',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2196F3',
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  },
  {
    channelId: NOTIFICATION_CONFIG.GENERAL_CHANNEL_ID,
    name: 'Notificaciones Generales',
    description: 'Información general y recordatorios de la aplicación',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 250],
    lightColor: '#4CAF50',
    enableLights: false,
    enableVibrate: true,
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  },
];


export const NOTIFICATION_BEHAVIOR = {
 
  handleNotification: async (notification: Notifications.Notification) => {
    const notificationData = notification.request.content.data;
    
    
    if (notificationData?.type === 'emergency' && notificationData?.priority === 'critical') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidImportance.MAX,
      };
    }
    
    
    if (notificationData?.type === 'emergency') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidImportance.HIGH,
      };
    }
    
    
    if (notificationData?.type === 'report_update') {
      return {
        shouldShowAlert: false, 
        shouldPlaySound: false,
        shouldSetBadge: true,
        priority: Notifications.AndroidImportance.DEFAULT,
      };
    }
    
   
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: true,
      priority: Notifications.AndroidImportance.DEFAULT,
    };
  },
};


export const NOTIFICATION_TEMPLATES = {
  
  emergency: {
    newReport: {
      title: '🚨 Nueva Emergencia Reportada',
      getTitleWithType: (emergencyType: string) => `🚨 Emergencia: ${emergencyType}`,
      getBody: (location: string) => `Se reportó una emergencia en ${location}. Toca para ver detalles.`,
      sound: NOTIFICATION_CONFIG.EMERGENCY_SOUND,
      priority: 'max' as const,
      categoryId: 'emergency',
      channelId: NOTIFICATION_CONFIG.EMERGENCY_CHANNEL_ID,
    },
    statusUpdate: {
      title: 'Actualización de Emergencia',
      getBody: (status: string) => `El estado de la emergencia cambió a: ${status}`,
      sound: 'default',
      priority: 'high' as const,
      categoryId: 'emergency',
      channelId: NOTIFICATION_CONFIG.EMERGENCY_CHANNEL_ID,
    },
  },
  
  
  report: {
    statusUpdate: {
      title: 'Estado de tu Reporte',
      getBody: (status: string) => {
        switch (status) {
          case 'acknowledged':
            return 'Tu reporte ha sido recibido y está siendo procesado';
          case 'in_progress':
            return 'Personal de emergencia está atendiendo tu reporte';
          case 'resolved':
            return 'Tu reporte de emergencia ha sido resuelto';
          case 'cancelled':
            return 'Tu reporte ha sido cancelado';
          default:
            return `El estado de tu reporte cambió a: ${status}`;
        }
      },
      sound: 'default',
      priority: 'default' as const,
      categoryId: 'report_update',
      channelId: NOTIFICATION_CONFIG.REPORTS_CHANNEL_ID,
    },
    reminder: {
      title: 'Recordatorio de Reporte',
      body: 'Tienes un reporte pendiente de seguimiento',
      sound: 'default',
      priority: 'default' as const,
      categoryId: 'report_update',
      channelId: NOTIFICATION_CONFIG.REPORTS_CHANNEL_ID,
    },
  },
  
  
  personnel: {
    alert: {
      title: '👨‍🚒 Alerta de Personal',
      getBody: (message: string) => message,
      sound: NOTIFICATION_CONFIG.EMERGENCY_SOUND,
      priority: 'high' as const,
      categoryId: 'personnel_alert',
      channelId: NOTIFICATION_CONFIG.EMERGENCY_CHANNEL_ID,
    },
    briefing: {
      title: 'Briefing Diario',
      body: 'Revisa los reportes y actualizaciones del día',
      sound: 'default',
      priority: 'default' as const,
      categoryId: 'personnel_alert',
      channelId: NOTIFICATION_CONFIG.GENERAL_CHANNEL_ID,
    },
    shift: {
      title: 'Cambio de Turno',
      getBody: (shift: string) => `Recordatorio: Tu turno ${shift} comienza pronto`,
      sound: 'default',
      priority: 'default' as const,
      categoryId: 'personnel_alert',
      channelId: NOTIFICATION_CONFIG.GENERAL_CHANNEL_ID,
    },
  },
  
  
  general: {
    maintenance: {
      title: '🔧 Recordatorio de Mantenimiento',
      body: 'Es hora de revisar el equipo de emergencias',
      sound: 'default',
      priority: 'default' as const,
      categoryId: 'general',
      channelId: NOTIFICATION_CONFIG.GENERAL_CHANNEL_ID,
    },
    test: {
      title: '✅ Test de Notificaciones',
      body: 'Las notificaciones están funcionando correctamente',
      sound: 'default',
      priority: 'default' as const,
      categoryId: 'general',
      channelId: NOTIFICATION_CONFIG.GENERAL_CHANNEL_ID,
    },
  },
};


export const SCHEDULING_CONFIG = {
  
  daily: {
    briefing: {
      hour: 8,
      minute: 0,
      repeats: true,
    },
    maintenance: {
      hour: 10,
      minute: 0,
      repeats: true,
      weekday: 1, 
    },
  },
  
  
  weekly: {
    equipment_check: {
      weekday: 1, 
      hour: 9,
      minute: 0,
      repeats: true,
    },
  },
  
  
  monthly: {
    training: {
      day: 1, 
      hour: 14,
      minute: 0,
      repeats: true,
    },
  },
};


export const CUSTOM_SOUNDS = {
  emergency_alert: {
    android: 'emergency_alert.wav',
    ios: 'emergency_alert.wav',
  },
  fire_alarm: {
    android: 'fire_alarm.wav',
    ios: 'fire_alarm.wav',
  },
  ambulance: {
    android: 'ambulance.wav',
    ios: 'ambulance.wav',
  },
};


export const VIBRATION_PATTERNS = {
  fire: [0, 500, 200, 500, 200, 500], 
  medical: [0, 300, 100, 300], 
  accident: [0, 400, 200, 400], 
  rescue: [0, 200, 100, 200, 100, 200], 
  general: [0, 250], 
};


export const DEV_NOTIFICATION_CONFIG = {
  
  EMERGENCY_SOUND_DURATION: CONFIG.DEBUG_MODE ? 2000 : 5000,
  VIBRATION_INTENSITY: CONFIG.DEBUG_MODE ? 0.5 : 1.0,
  SHOW_DEBUG_INFO: CONFIG.DEBUG_MODE,
  MOCK_PUSH_NOTIFICATIONS: false, 
};


export const validateNotificationConfig = (): boolean => {
  try {
    
    if (Platform.OS === 'android' && ANDROID_CHANNELS.length === 0) {
      console.error('No Android notification channels defined');
      return false;
    }

    if (Platform.OS === 'ios' && NOTIFICATION_CATEGORIES.length === 0) {
      console.error('No iOS notification categories defined');
      return false;
    }
    
    
    if (!NOTIFICATION_TEMPLATES || Object.keys(NOTIFICATION_TEMPLATES).length === 0) {
      console.error('No notification templates defined');
      return false;
    }
    
    console.log('✅ Notification configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Invalid notification configuration:', error);
    return false;
  }
};


export const getPlatformNotificationConfig = () => {
  return {
    channels: Platform.OS === 'android' ? ANDROID_CHANNELS : [],
    categories: Platform.OS === 'ios' ? NOTIFICATION_CATEGORIES : [],
    behavior: NOTIFICATION_BEHAVIOR,
    templates: NOTIFICATION_TEMPLATES,
    sounds: CUSTOM_SOUNDS,
    vibrations: VIBRATION_PATTERNS,
    scheduling: SCHEDULING_CONFIG,
    dev: DEV_NOTIFICATION_CONFIG,
  };
};