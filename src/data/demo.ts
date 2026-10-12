import type { Flight, Gate, Incident } from '../types/airport';

export const initialGates: Gate[] = [
  { id: 'A01', name: 'A01', terminal: 'T1', zone: 'A', type: 'contact', maxAircraftCategory: 'C', hasJetBridge: true, status: 'Occupied', flightId: 'f1' },
  { id: 'A02', name: 'A02', terminal: 'T1', zone: 'A', type: 'contact', maxAircraftCategory: 'C', hasJetBridge: true, status: 'Available', flightId: null },
  { id: 'B30', name: 'B30', terminal: 'T1', zone: 'B', type: 'contact', maxAircraftCategory: 'E', hasJetBridge: true, status: 'Occupied', flightId: 'f2' },
  { id: 'B32', name: 'B32', terminal: 'T1', zone: 'B', type: 'contact', maxAircraftCategory: 'C', hasJetBridge: true, status: 'Available', flightId: null },
  { id: 'D01', name: 'D01', terminal: 'T1', zone: 'D', type: 'contact', maxAircraftCategory: 'E', hasJetBridge: true, status: 'Available', flightId: null },
  { id: 'T2-01', name: 'T2-01', terminal: 'T2', zone: 'T2', type: 'contact', maxAircraftCategory: 'C', hasJetBridge: true, status: 'Available', flightId: null },
  { id: 'R01', name: 'R01', terminal: 'T1', zone: 'Remote', type: 'remote', maxAircraftCategory: 'E', hasJetBridge: false, status: 'Available', flightId: null },
  { id: 'R02', name: 'R02', terminal: 'T2', zone: 'Remote', type: 'remote', maxAircraftCategory: 'C', hasJetBridge: false, status: 'Available', flightId: null }
];

export const initialFlights: Flight[] = [
  { id: 'f1', flightNumber: 'VY8102', airline: 'Vueling', origin: 'Barcelona', destination: 'Paris-Orly', direction: 'departure', scheduledTime: '08:10', estimatedTime: '08:10', aircraft: 'A320', passengers: 174, terminal: 'T1', gateId: 'A01', status: 'Boarding', delayMinutes: 0 },
  { id: 'f2', flightNumber: 'LH1127', airline: 'Lufthansa', origin: 'Frankfurt', destination: 'Barcelona', direction: 'arrival', scheduledTime: '08:15', estimatedTime: '08:24', aircraft: 'A321', passengers: 186, terminal: 'T1', gateId: 'B30', status: 'Delayed', delayMinutes: 9 },
  { id: 'f3', flightNumber: 'BA475', airline: 'British Airways', origin: 'London-Heathrow', destination: 'Barcelona', direction: 'arrival', scheduledTime: '08:25', estimatedTime: '08:25', aircraft: 'A320', passengers: 162, terminal: 'T1', gateId: null, status: 'Approaching', delayMinutes: 0 },
  { id: 'f4', flightNumber: 'VY1420', airline: 'Vueling', origin: 'Barcelona', destination: 'Rome-Fiumicino', direction: 'departure', scheduledTime: '08:35', estimatedTime: '08:35', aircraft: 'A321neo', passengers: 210, terminal: 'T1', gateId: 'B32', status: 'Scheduled', delayMinutes: 0 },
  { id: 'f5', flightNumber: 'FR6364', airline: 'Ryanair', origin: 'Barcelona', destination: 'Milan-Bergamo', direction: 'departure', scheduledTime: '08:40', estimatedTime: '08:52', aircraft: 'B737-800', passengers: 189, terminal: 'T2', gateId: 'T2-01', status: 'Delayed', delayMinutes: 12 },
  { id: 'f6', flightNumber: 'EK185', airline: 'Emirates', origin: 'Dubai', destination: 'Barcelona', direction: 'arrival', scheduledTime: '08:50', estimatedTime: '08:50', aircraft: 'B777-300ER', passengers: 328, terminal: 'T1', gateId: null, status: 'Scheduled', delayMinutes: 0 },
  { id: 'f7', flightNumber: 'AF1648', airline: 'Air France', origin: 'Paris-CDG', destination: 'Barcelona', direction: 'arrival', scheduledTime: '09:00', estimatedTime: '09:00', aircraft: 'A320', passengers: 155, terminal: 'T1', gateId: null, status: 'Scheduled', delayMinutes: 0 },
  { id: 'f8', flightNumber: 'IB412', airline: 'Iberia', origin: 'Barcelona', destination: 'Madrid', direction: 'departure', scheduledTime: '09:10', estimatedTime: '09:10', aircraft: 'A320', passengers: 148, terminal: 'T1', gateId: null, status: 'Scheduled', delayMinutes: 0 },
  { id: 'f9', flightNumber: 'U21902', airline: 'easyJet', origin: 'Barcelona', destination: 'Geneva', direction: 'departure', scheduledTime: '09:25', estimatedTime: '09:25', aircraft: 'A320', passengers: 171, terminal: 'T2', gateId: null, status: 'Scheduled', delayMinutes: 0 },
  { id: 'f10', flightNumber: 'QR138', airline: 'Qatar Airways', origin: 'Doha', destination: 'Barcelona', direction: 'arrival', scheduledTime: '09:40', estimatedTime: '09:40', aircraft: 'B787-9', passengers: 270, terminal: 'T1', gateId: null, status: 'Scheduled', delayMinutes: 0 }
];

export const initialIncidents: Incident[] = [
  { id: 'i1', severity: 'WARNING', title: 'Arrival delay', description: 'LH1127 estimated 9 minutes behind schedule.', createdAt: '08:00', resolved: false },
  { id: 'i2', severity: 'INFO', title: 'Remote stand available', description: 'R01 and R02 are available for assignment.', createdAt: '08:02', resolved: false }
];
