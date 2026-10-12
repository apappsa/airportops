export type FlightDirection = 'arrival' | 'departure';
export type FlightStatus =
  | 'Scheduled'
  | 'Approaching'
  | 'Landed'
  | 'At gate'
  | 'Boarding'
  | 'Final call'
  | 'Taxiing'
  | 'Departed'
  | 'Delayed'
  | 'Cancelled';

export type StandType = 'contact' | 'remote';
export type StandStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Blocked';

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  direction: FlightDirection;
  scheduledTime: string;
  estimatedTime: string;
  aircraft: string;
  passengers: number;
  terminal: 'T1' | 'T2';
  gateId: string | null;
  status: FlightStatus;
  delayMinutes: number;
}

export interface Gate {
  id: string;
  name: string;
  terminal: 'T1' | 'T2';
  zone: string;
  type: StandType;
  maxAircraftCategory: 'C' | 'D' | 'E' | 'F';
  hasJetBridge: boolean;
  status: StandStatus;
  flightId: string | null;
}

export interface Incident {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  createdAt: string;
  resolved: boolean;
}
