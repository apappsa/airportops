import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownLeft, ArrowUpRight, BarChart3, Bell,
  BriefcaseBusiness, Bus, CheckCircle2, ChevronDown, Clock3,
  CloudSun, Gauge, LayoutDashboard, Plane, Play, Pause, Search, Settings,
  ShieldCheck, Timer, Wrench, X, Database, MapPinned
} from 'lucide-react';
import { initialFlights, initialGates, initialIncidents } from './data/demo';
import { isSupabaseConfigured } from './lib/supabase';
import type { Flight, Gate, Incident } from './types/airport';

type Page = 'Overview' | 'Live Operations' | 'Flights' | 'Gates & Stands' | 'Turnarounds' | 'Ground Handling' | 'Check-in & Security' | 'Baggage' | 'Runways' | 'Incidents' | 'Analytics' | 'Finance' | 'Settings';

const nav: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard }, { label: 'Live Operations', icon: Activity },
  { label: 'Flights', icon: Plane }, { label: 'Gates & Stands', icon: MapPinned },
  { label: 'Turnarounds', icon: Timer }, { label: 'Ground Handling', icon: Bus },
  { label: 'Check-in & Security', icon: ShieldCheck }, { label: 'Baggage', icon: BriefcaseBusiness },
  { label: 'Runways', icon: Gauge }, { label: 'Incidents', icon: AlertTriangle },
  { label: 'Analytics', icon: BarChart3 }, { label: 'Finance', icon: BarChart3 },
  { label: 'Settings', icon: Settings }
];

function addMinutes(time: string, amount: number) {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + amount) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
function categoryForAircraft(aircraft: string): 'C' | 'D' | 'E' | 'F' {
  if (/A380/.test(aircraft)) return 'F';
  if (/A350|A330|B777|B787/.test(aircraft)) return 'E';
  if (/B757|B767/.test(aircraft)) return 'D';
  return 'C';
}
function statusClass(status: string) {
  return status.toLowerCase().replace(/ /g, '-');
}
function Status({ value }: { value: string }) {
  return <span className={`status status-${statusClass(value)}`}>{value}</span>;
}
function Kpi({ label, value, detail, icon: Icon, tone = 'blue' }: { label: string; value: string; detail: string; icon: typeof Plane; tone?: string }) {
  return <div className="kpi-card"><div className="kpi-top"><span>{label}</span><span className={`kpi-icon ${tone}`}><Icon size={17}/></span></div><div className="kpi-value">{value}</div><div className="kpi-detail">{detail}</div></div>;
}

export default function App() {
  const [page, setPage] = useState<Page>('Overview');
  const [flights, setFlights] = useState<Flight[]>(initialFlights);
  const [gates, setGates] = useState<Gate[]>(initialGates);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [simMinutes, setSimMinutes] = useState(7 * 60);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(true);
  const [search, setSearch] = useState('');
  const [flightFilter, setFlightFilter] = useState<'All' | 'Arrivals' | 'Departures' | 'Delayed'>('All');
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [assignmentGate, setAssignmentGate] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setSimMinutes(m => (m + speed) % (24 * 60));
      setFlights(current => current.map(f => {
        if (f.status === 'Departed' || f.status === 'Cancelled') return f;
        const [h, m] = f.estimatedTime.split(':').map(Number);
        const estimate = h * 60 + m;
        const now = simMinutes;
        if (f.direction === 'departure' && f.status === 'Scheduled' && now >= estimate - 35) return { ...f, status: 'Boarding' };
        if (f.direction === 'departure' && f.status === 'Boarding' && now >= estimate - 10) return { ...f, status: 'Final call' };
        if (f.direction === 'departure' && f.status === 'Final call' && now >= estimate) return { ...f, status: 'Departed' };
        if (f.direction === 'arrival' && f.status === 'Approaching' && now >= estimate) return { ...f, status: 'Landed' };
        if (f.direction === 'arrival' && f.status === 'Landed' && now >= estimate + 8) return { ...f, status: 'At gate' };
        return f;
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paused, speed, simMinutes]);

  const time = `${String(Math.floor(simMinutes / 60)).padStart(2, '0')}:${String(simMinutes % 60).padStart(2, '0')}`;
  const activeIncidents = incidents.filter(i => !i.resolved);
  const delayed = flights.filter(f => f.delayMinutes > 0 || f.status === 'Delayed').length;
  const onTime = Math.max(0, Math.round((flights.length - delayed) / Math.max(1, flights.length) * 100));
  const occupancy = Math.round(gates.filter(g => g.flightId).length / Math.max(1, gates.length) * 100);
  const passengers = flights.reduce((sum, f) => sum + f.passengers, 0);
  const filteredFlights = useMemo(() => flights.filter(f => {
    const matchSearch = `${f.flightNumber} ${f.airline} ${f.origin} ${f.destination}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = flightFilter === 'All' || (flightFilter === 'Arrivals' && f.direction === 'arrival') || (flightFilter === 'Departures' && f.direction === 'departure') || (flightFilter === 'Delayed' && (f.delayMinutes > 0 || f.status === 'Delayed'));
    return matchSearch && matchFilter;
  }), [flights, search, flightFilter]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }
  function assignGate(flightId: string, gateId: string) {
    const flight = flights.find(f => f.id === flightId);
    const gate = gates.find(g => g.id === gateId);
    if (!flight || !gate) return;
    if (gate.status === 'Maintenance' || gate.status === 'Blocked') return notify(`${gate.name} is not available.`);
    if (gate.flightId && gate.flightId !== flightId) return notify(`${gate.name} is already occupied.`);
    if (gate.terminal !== flight.terminal && gate.type !== 'remote') return notify(`Terminal mismatch: ${flight.flightNumber} is assigned to ${flight.terminal}.`);
    const aircraftCategory = categoryForAircraft(flight.aircraft);
    const categoryOrder = ['C', 'D', 'E', 'F'];
    if (categoryOrder.indexOf(aircraftCategory) > categoryOrder.indexOf(gate.maxAircraftCategory)) return notify(`${flight.aircraft} is incompatible with stand ${gate.name}.`);
    setGates(old => old.map(g => {
      if (g.flightId === flightId) return { ...g, flightId: null, status: 'Available' };
      if (g.id === gateId) return { ...g, flightId, status: 'Occupied' };
      return g;
    }));
    setFlights(old => old.map(f => f.id === flightId ? { ...f, gateId } : f));
    setSelectedFlight(null);
    notify(`${flight.flightNumber} assigned to ${gate.name}.`);
  }
  function resolveIncident(id: string) {
    setIncidents(old => old.map(i => i.id === id ? { ...i, resolved: true } : i));
    notify('Incident marked as resolved.');
  }
  function addDelay(flightId: string) {
    setFlights(old => old.map(f => f.id === flightId ? { ...f, delayMinutes: f.delayMinutes + 10, estimatedTime: addMinutes(f.estimatedTime, 10), status: 'Delayed' } : f));
    notify('10-minute delay applied to flight.');
  }
  function resetDay() {
    setFlights(initialFlights); setGates(initialGates); setIncidents(initialIncidents); setSimMinutes(7 * 60); setPaused(true); setSpeed(1); notify('Demo day reset.');
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Plane size={21}/></div><div><strong>AirportOps</strong><span>OPERATIONS CONTROL</span></div></div>
      <div className="airport-chip"><span className="airport-dot"/> BCN <span className="chip-sep">/</span> LEBL <ChevronDown size={14}/></div>
      <div className="nav-label">AIRPORT MANAGEMENT</div>
      <nav>{nav.map(item => { const Icon = item.icon; return <button key={item.label} className={`nav-item ${page === item.label ? 'active' : ''}`} onClick={() => setPage(item.label)}><Icon size={17}/><span>{item.label}</span>{item.label === 'Incidents' && activeIncidents.length > 0 && <b className="nav-count">{activeIncidents.length}</b>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="system-status"><span className="live-dot"/><div><strong>Simulation engine</strong><small>Running locally</small></div></div><div className="user-row"><div className="avatar">OD</div><div><strong>Operations Director</strong><small>Demo session</small></div><Settings size={16}/></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="breadcrumbs"><span>AirportOps</span><span>/</span><strong>{page}</strong></div>
        <div className="topbar-right"><span className="demo-badge">SIMULATED DATA</span><div className="weather"><CloudSun size={18}/><span>Clear · 22°C</span></div><div className="top-clock"><Clock3 size={16}/><strong>{time}</strong><small>LOCAL</small></div><button className="icon-button" title="Notifications" onClick={() => setPage('Incidents')}><Bell size={18}/>{activeIncidents.length > 0 && <i/>}</button></div>
      </header>

      <section className="content">
        <div className="page-heading"><div><div className="eyebrow">JOSEP TARRADELLAS BARCELONA–EL PRAT</div><h1>{page === 'Overview' ? 'Airport overview' : page}</h1><p>{page === 'Overview' ? 'Operational performance and live airport activity.' : 'Manage simulated airport operations for the current game session.'}</p></div><div className="game-controls"><div className="clock-control"><span className={`clock-indicator ${paused ? 'paused' : ''}`}/><div><small>SIMULATION TIME</small><strong>{time}</strong></div></div><button className={`control-button ${paused ? 'primary' : ''}`} onClick={() => setPaused(!paused)}>{paused ? <Play size={15}/> : <Pause size={15}/>} {paused ? 'Start' : 'Pause'}</button><select aria-label="Simulation speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}>{[1,2,5,10].map(v => <option key={v} value={v}>{v}x speed</option>)}</select><button className="control-button" onClick={resetDay}>Reset day</button></div></div>

        {page === 'Overview' && <>
          <div className="kpi-grid">
            <Kpi label="Flights scheduled" value={String(flights.length)} detail={`${flights.filter(f => f.direction === 'arrival').length} arrivals · ${flights.filter(f => f.direction === 'departure').length} departures`} icon={Plane}/>
            <Kpi label="On-time flights" value={`${onTime}%`} detail={`${delayed} flights delayed`} icon={CheckCircle2} tone="green"/>
            <Kpi label="Gate utilization" value={`${occupancy}%`} detail={`${gates.filter(g => g.flightId).length} of ${gates.length} positions occupied`} icon={MapPinned} tone="purple"/>
            <Kpi label="Passengers" value={passengers.toLocaleString('en-GB')} detail="Scheduled passenger total" icon={BriefcaseBusiness} tone="orange"/>
            <Kpi label="Active incidents" value={String(activeIncidents.length)} detail="Require operational attention" icon={AlertTriangle} tone="red"/>
            <Kpi label="Performance score" value={`${Math.max(0, Math.min(100, Math.round(onTime * .55 + (100 - activeIncidents.length * 8) * .25 + (100 - occupancy / 2) * .2)))}`} detail="Indicative demo score / 100" icon={Gauge} tone="blue"/>
          </div>
          <div className="overview-grid">
            <section className="panel flight-panel"><div className="panel-header"><div><h2>Flight activity</h2><p>Next scheduled movements</p></div><button className="text-button" onClick={() => setPage('Flights')}>View flight board <ArrowUpRight size={14}/></button></div><div className="flight-mini-list">{flights.slice(0, 6).map(f => <div className="flight-mini" key={f.id}><div className={`direction-icon ${f.direction}`} >{f.direction === 'arrival' ? <ArrowDownLeft size={17}/> : <ArrowUpRight size={17}/>}</div><div className="mini-flight-main"><strong>{f.flightNumber}</strong><span>{f.airline}</span></div><div className="mini-route"><strong>{f.direction === 'arrival' ? f.origin : f.destination}</strong><span>{f.direction === 'arrival' ? 'Arrival' : 'Departure'}</span></div><div className="mini-time"><strong>{f.estimatedTime}</strong><Status value={f.status}/></div></div>)}</div></section>
            <section className="panel incident-panel"><div className="panel-header"><div><h2>Operational alerts</h2><p>{activeIncidents.length} open items</p></div><button className="icon-button subtle" onClick={() => setPage('Incidents')}><ArrowUpRight size={16}/></button></div>{activeIncidents.length === 0 ? <div className="empty-state"><CheckCircle2 size={24}/><strong>No active incidents</strong></div> : <div className="incident-list">{activeIncidents.map(i => <div className="incident-item" key={i.id}><div className={`incident-symbol ${i.severity.toLowerCase()}`}><AlertTriangle size={16}/></div><div className="incident-copy"><div><strong>{i.title}</strong><Status value={i.severity}/></div><p>{i.description}</p><small>{i.createdAt} · Simulated event</small></div></div>)}</div>}</section>
            <section className="panel gate-panel"><div className="panel-header"><div><h2>Gate occupancy</h2><p>Contact gates and remote stands</p></div><button className="text-button" onClick={() => setPage('Gates & Stands')}>Manage gates <ArrowUpRight size={14}/></button></div><div className="gate-grid">{gates.map(g => <button key={g.id} className={`gate-tile ${g.flightId ? 'occupied' : ''}`} onClick={() => {setPage('Gates & Stands'); setSelectedFlight(g.flightId);}}><span>{g.name}</span><strong>{g.flightId ? flights.find(f => f.id === g.flightId)?.flightNumber || 'Occupied' : 'Available'}</strong><small>{g.type === 'remote' ? 'Remote' : g.terminal}</small></button>)}</div></section>
            <section className="panel ops-panel"><div className="panel-header"><div><h2>Operational snapshot</h2><p>Current simulated conditions</p></div><Activity size={17} className="muted-icon"/></div><div className="snapshot-row"><span><span className="snapshot-dot green"/>Runway configuration</span><strong>Normal operations</strong></div><div className="snapshot-row"><span><span className="snapshot-dot blue"/>Weather impact</span><strong>None</strong></div><div className="snapshot-row"><span><span className="snapshot-dot orange"/>Turnaround risk</span><strong>{delayed > 2 ? 'Elevated' : 'Low'}</strong></div><div className="snapshot-row"><span><span className="snapshot-dot purple"/>Data source</span><strong>Simulation engine</strong></div><div className="system-note"><Database size={15}/>{isSupabaseConfigured ? 'Supabase configured — demo state is not yet persisted.' : 'Supabase not configured — demo session runs in memory.'}</div></section>
          </div>
        </>}

        {page === 'Flights' && <section className="panel full-panel"><div className="panel-header"><div><h2>Flight board</h2><p>All movements for the current simulated operating day</p></div><span className="demo-badge">DEMO SCHEDULE</span></div><div className="table-tools"><div className="search-box"><Search size={16}/><input placeholder="Search flight, airline or city..." value={search} onChange={e => setSearch(e.target.value)}/><kbd>⌕</kbd></div><div className="filter-tabs">{(['All','Arrivals','Departures','Delayed'] as const).map(f => <button key={f} className={flightFilter === f ? 'selected' : ''} onClick={() => setFlightFilter(f)}>{f}</button>)}</div></div><div className="table-wrap"><table><thead><tr><th>Flight</th><th>Route</th><th>Time</th><th>Aircraft</th><th>Terminal / Gate</th><th>Pax</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredFlights.map(f => <tr key={f.id}><td><div className="flight-number">{f.flightNumber}</div><div className="secondary-text">{f.airline}</div></td><td><div className="route-cell">{f.direction === 'arrival' ? `${f.origin} → Barcelona` : `Barcelona → ${f.destination}`}</div><div className="secondary-text">{f.direction.toUpperCase()}</div></td><td><strong>{f.estimatedTime}</strong>{f.delayMinutes > 0 && <div className="delay-text">+{f.delayMinutes} min</div>}</td><td>{f.aircraft}</td><td>{f.terminal}<div className="secondary-text">{f.gateId || 'Unassigned'}</div></td><td>{f.passengers}</td><td><Status value={f.status}/></td><td><button className="small-action" onClick={() => {setSelectedFlight(f.id); setAssignmentGate(f.gateId || '');}}>{f.gateId ? 'Manage' : 'Assign gate'}</button></td></tr>)}</tbody></table>{filteredFlights.length === 0 && <div className="empty-state">No flights match your search.</div>}</div></section>}

        {page === 'Gates & Stands' && <section className="panel full-panel"><div className="panel-header"><div><h2>Gates & stands</h2><p>Assign flights to compatible positions. Demo occupancy is simplified and does not yet model time-window overlap.</p></div><span className="demo-badge">SIMULATED STANDS</span></div><div className="gate-management-grid">{gates.map(g => {const flight = flights.find(f => f.id === g.flightId); return <div className={`gate-card ${flight ? 'is-occupied' : ''}`} key={g.id}><div className="gate-card-head"><span className="gate-id">{g.name}</span><Status value={flight ? 'Occupied' : g.status}/></div><div className="gate-terminal">{g.terminal} · {g.type === 'remote' ? 'Remote stand' : `Zone ${g.zone}`}</div><div className="gate-plane">{flight ? <><Plane size={17}/><strong>{flight.flightNumber}</strong><span>{flight.aircraft}</span></> : <><MapPinned size={17}/><span>Position available</span></>}</div><div className="gate-card-footer"><span>Max category {g.maxAircraftCategory}</span><button className="small-action" onClick={() => {setSelectedFlight(flight?.id || null); setAssignmentGate(g.id); if (flight) setAssignmentGate(g.id); else setSelectedFlight('');}}>{flight ? 'Reassign' : 'Assign flight'}</button></div></div>;})}</div></section>}

        {page === 'Incidents' && <section className="panel full-panel"><div className="panel-header"><div><h2>Incident centre</h2><p>Operational events and resolution tracking</p></div><span className="demo-badge">{activeIncidents.length} OPEN</span></div><div className="incident-list large">{incidents.map(i => <div className={`incident-row ${i.resolved ? 'resolved' : ''}`} key={i.id}><div className={`incident-symbol ${i.severity.toLowerCase()}`}>{i.resolved ? <CheckCircle2 size={17}/> : <AlertTriangle size={17}/>}</div><div className="incident-copy"><div><strong>{i.title}</strong><Status value={i.resolved ? 'Resolved' : i.severity}/></div><p>{i.description}</p><small>{i.createdAt} · Simulated event</small></div>{!i.resolved && <button className="control-button" onClick={() => resolveIncident(i.id)}>Resolve</button>}</div>)}</div><button className="control-button" onClick={() => {const id = `i${Date.now()}`; setIncidents(old => [{id, severity:'WARNING', title:'Operational review required', description:'A manual review event was created by the Operations Director.', createdAt:time, resolved:false}, ...old]); notify('New incident created.');}}>Create test incident</button></section>}

        {!['Overview','Flights','Gates & Stands','Incidents'].includes(page) && <section className="panel module-placeholder"><div className="placeholder-icon"><Wrench size={26}/></div><h2>{page}</h2><p>This module is planned for a later development phase. It is not active in this MVP yet.</p><button className="control-button primary" onClick={() => setPage('Overview')}>Back to overview</button></section>}
        <footer className="page-footer"><span>AirportOps MVP · Barcelona–El Prat</span><span><span className="live-dot"/> Demo simulation · Not connected to live airport systems</span></footer>
      </section>
    </main>

    {selectedFlight !== null && <div className="modal-backdrop" onClick={() => setSelectedFlight(null)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">FLIGHT OPERATIONS</span><h2>{flights.find(f => f.id === selectedFlight)?.flightNumber || 'Assign flight to stand'}</h2></div><button className="icon-button" onClick={() => setSelectedFlight(null)}><X size={18}/></button></div>{flights.find(f => f.id === selectedFlight) ? <><p className="modal-description">{flights.find(f => f.id === selectedFlight)?.airline} · {flights.find(f => f.id === selectedFlight)?.aircraft} · {flights.find(f => f.id === selectedFlight)?.passengers} passengers</p><label className="form-label">Assign position</label><select className="wide-select" value={assignmentGate} onChange={e => setAssignmentGate(e.target.value)}><option value="">Choose a gate or stand</option>{gates.map(g => <option key={g.id} value={g.id}>{g.name} · {g.terminal} · {g.type} · {g.flightId && g.flightId !== selectedFlight ? 'Occupied' : g.status}</option>)}</select><div className="modal-actions"><button className="control-button" onClick={() => addDelay(selectedFlight)}>Apply +10 min delay</button><button className="control-button primary" onClick={() => assignmentGate ? assignGate(selectedFlight, assignmentGate) : notify('Select a gate first.')}>Confirm assignment</button></div></> : <><p className="modal-description">Select a flight to assign it to {assignmentGate || 'this position'}.</p><label className="form-label">Flight</label><select className="wide-select" value={selectedFlight || ''} onChange={e => setSelectedFlight(e.target.value)}><option value="">Choose a flight</option>{flights.filter(f => !['Departed','Cancelled'].includes(f.status)).map(f => <option key={f.id} value={f.id}>{f.flightNumber} · {f.airline} · {f.aircraft}</option>)}</select><div className="modal-actions"><button className="control-button" onClick={() => setSelectedFlight(null)}>Cancel</button><button className="control-button primary" onClick={() => selectedFlight && assignmentGate ? assignGate(selectedFlight, assignmentGate) : notify('Choose a flight first.')}>Confirm assignment</button></div></>}</div></div>}
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}
