
export interface EmergencyReport {
  id: string;
  type: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  timestamp: Date;
  status?: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  deviceInfo?: {
    deviceName: string;
    platform: string;
    osVersion: string;
  };
}

export interface EmergencyType {
  id: string;
  label: string;
  icon: string;
  color: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface EmergencyResponse {
  reportId: string;
  status: string;
  estimatedArrival?: string;
  assignedUnit?: string;
  message?: string;
}