export interface EmergencyType {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Location {
  coords: {
    latitude: number;
    longitude: number;
  };
}

export interface EmergencyReport {
  type: string;
  location: Location['coords'] | null;
  timestamp: Date;
}