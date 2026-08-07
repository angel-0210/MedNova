import { useState, useEffect } from 'react';
import {
  usePatientsQuery, useAlertsQuery, useDevicesQuery,
  useAcknowledgeAlertMutation, useResolveAlertMutation,
  usePairDeviceMutation, useUnpairDeviceMutation
} from '@mednova/hooks';
import { authRepository, setOnSessionExpired } from '@mednova/api';
import { parseAPIError, formatDateTime } from '@mednova/utils';
import {
  Activity, Users, ShieldAlert, Wifi, ShieldCheck,
  LogOut, User as UserIcon, CheckCircle2, ChevronRight, X, Info
} from 'lucide-react';
import { User, Patient } from '@mednova/types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'devices' | 'alerts'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Device pairing form state
  const [selectedPairPatientId, setSelectedPairPatientId] = useState('');
  const [selectedPairDeviceId, setSelectedPairDeviceId] = useState('');

  // 1. Fetch data
  const { data: patients = [], isLoading: loadingPatients, refetch: refetchPatients } = usePatientsQuery();
  const { data: alerts = [], isLoading: loadingAlerts } = useAlertsQuery();
  const { data: devices = [], isLoading: loadingDevices } = useDevicesQuery();

  const acknowledgeAlert = useAcknowledgeAlertMutation();
  const resolveAlert = useResolveAlertMutation();
  const pairDevice = usePairDeviceMutation();
  const unpairDevice = useUnpairDeviceMutation();

  // 2. Session recovery
  useEffect(() => {
    const token = localStorage.getItem('mednova_access_token');
    const storedUser = localStorage.getItem('mednova_user_profile');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setOnSessionExpired(() => {
      handleLogout();
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      const res = await authRepository.login(email, password);
      localStorage.setItem('mednova_access_token', res.access_token);
      localStorage.setItem('mednova_refresh_token', res.refresh_token);
      localStorage.setItem('mednova_user_profile', JSON.stringify(res.user));
      setUser(res.user);
    } catch (err: any) {
      setAuthError(parseAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('mednova_access_token');
    localStorage.removeItem('mednova_refresh_token');
    localStorage.removeItem('mednova_user_profile');
    setUser(null);
  };

  // Selected patient details computed
  const selectedPatient: Patient | undefined = patients.find((p: Patient) => p.patient_id === selectedPatientId);

  // Stats
  const activeVentilators = patients.filter((p: Patient) => p.ventilator_status === 'active').length;
  const criticalAlerts = alerts.filter((a: any) => a.alert_type === 'critical').length;
  const systemStatus = criticalAlerts > 0 ? 'Degraded' : 'Optimal';

  if (!user) {
    // Elegant Neon Login Page
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary opacity-10 blur-[120px] rounded-full pulse-bg" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary opacity-15 blur-[120px] rounded-full pulse-bg" />

        <div className="w-full max-w-md glass-panel p-8 rounded-2xl glow-border flex flex-col items-center">
          <div className="h-16 w-16 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg border border-primary/20 rotate-12">
            <Activity className="h-10 w-10 text-background stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-6 text-white bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            MedNova
          </h1>
          <p className="text-textDim text-sm mt-1">Smart Ventilator Telemetry System</p>

          <form className="w-full mt-8 space-y-5" onSubmit={handleLogin}>
            {authError && (
              <div className="p-3 bg-statusCritical/20 border border-statusCritical/30 text-statusCritical text-xs rounded-lg text-center">
                {authError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-textDim uppercase tracking-wider mb-2">Hospital Email</label>
              <input
                type="email"
                required
                className="w-full bg-[#0d131a] border border-[#2f3b4c] rounded-xl px-4 py-3 text-white placeholder-textDim/50 focus:outline-none focus:border-primary transition-all text-sm"
                placeholder="doctor@hospital.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textDim uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full bg-[#0d131a] border border-[#2f3b4c] rounded-xl px-4 py-3 text-white placeholder-textDim/50 focus:outline-none focus:border-primary transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-background font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/10 mt-2 text-sm flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : 'Authenticate Session'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">MedNova Web</h1>
            <p className="text-[10px] text-primary/70 tracking-widest uppercase font-semibold">Ventilator Monitor</p>
          </div>
        </div>

        {/* Tab selection */}
        <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-primary text-background' : 'text-textDim hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'patients' ? 'bg-primary text-background' : 'text-textDim hover:text-white'}`}
          >
            Patient Registry
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'devices' ? 'bg-primary text-background' : 'text-textDim hover:text-white'}`}
          >
            IoT Devices
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all relative ${activeTab === 'alerts' ? 'bg-primary text-background' : 'text-textDim hover:text-white'}`}
          >
            Alerts Center
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-statusCritical text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>
        </nav>

        {/* Doctor profile card */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-sm font-bold text-white">{user.name}</p>
              <p className="text-xs text-textDim uppercase tracking-wider font-semibold">{user.role}</p>
            </div>
            <div className="h-10 w-10 bg-surface rounded-full border border-white/10 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-textMain" />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-statusCritical/15 border border-statusCritical/20 text-statusCritical hover:bg-statusCritical/20 transition-all"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Critical Alerts Alert Banner */}
        {criticalAlerts > 0 && (
          <div className="bg-statusCritical/20 border border-statusCritical/35 p-4 rounded-xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-statusCritical" />
              <div>
                <h4 className="text-sm font-bold text-white">CRITICAL INCIDENTS DETECTED</h4>
                <p className="text-xs text-textDim">{criticalAlerts} critical ventilator alerts require immediate staff resolution.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('alerts')}
              className="bg-statusCritical text-white font-bold text-xs px-4 py-2 rounded-lg hover:opacity-95 transition-all"
            >
              View Critical Log
            </button>
          </div>
        )}

        {/* View switching */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-textDim font-bold">Active Ventilators</p>
                  <h3 className="text-4xl font-extrabold text-primary mt-2">
                    {activeVentilators} <span className="text-base text-textDim font-medium">/ {patients.length}</span>
                  </h3>
                  <div className="w-48 bg-black/40 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${patients.length > 0 ? (activeVentilators / patients.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <Users className="h-10 w-10 text-primary/30" />
              </div>

              <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-statusCritical relative overflow-hidden group">
                <div>
                  <p className="text-xs uppercase tracking-widest text-textDim font-bold">Active Alerts</p>
                  <h3 className="text-4xl font-extrabold text-statusCritical mt-2">
                    {alerts.length} <span className="text-sm font-semibold text-textDim">unresolved</span>
                  </h3>
                  <p className="text-xs text-textDim mt-3 font-medium">
                    {criticalAlerts} Critical • {alerts.length - criticalAlerts} Moderate Warnings
                  </p>
                </div>
                <ShieldAlert className="h-10 w-10 text-statusCritical/30" />
              </div>

              <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-statusStable relative overflow-hidden group">
                <div>
                  <p className="text-xs uppercase tracking-widest text-textDim font-bold">System Integrity</p>
                  <h3 className="text-4xl font-extrabold text-statusStable mt-2">{systemStatus}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-textDim mt-3">
                    <ShieldCheck className="h-4 w-4 text-statusStable" />
                    <span>All sensor gateways responsive</span>
                  </div>
                </div>
                <Wifi className="h-10 w-10 text-statusStable/30" />
              </div>
            </div>

            {/* Live Focus Patient Telemetry Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Focus telechart */}
              <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Focus Monitor: Bed 402</h3>
                    <p className="text-xs text-textDim">John Doe • SpO2 Normal Rate Target</p>
                  </div>
                  <span className="bg-statusCritical/15 border border-statusCritical/30 text-statusCritical text-xs font-bold px-3 py-1 rounded-full uppercase">
                    High Risk Score
                  </span>
                </div>

                {/* Simulated waveforms using custom SVGs */}
                <div className="space-y-4">
                  <div className="bg-black/30 p-4 rounded-xl space-y-1 relative">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-primary font-bold">ECG (Waveform Monitor)</span>
                      <span className="text-statusCritical font-bold text-base animate-pulse">140 BPM</span>
                    </div>
                    {/* Pulsing SVG line */}
                    <svg className="w-full h-16 text-statusCritical stroke-current" viewBox="0 0 500 60">
                      <path
                        d="M 0 30 L 50 30 L 60 10 L 70 50 L 80 30 L 150 30 L 160 10 L 170 50 L 180 30 L 250 30 L 260 10 L 270 50 L 280 30 L 350 30 L 360 10 L 370 50 L 380 30 L 450 30 L 460 10 L 470 50 L 480 30 L 500 30"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="bg-black/30 p-4 rounded-xl space-y-1 relative">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-secondary font-bold">SPO2 (Plethysmogram)</span>
                      <span className="text-secondary font-bold text-base">92%</span>
                    </div>
                    {/* Simulated Waveform SVG */}
                    <svg className="w-full h-16 text-secondary stroke-current" viewBox="0 0 500 60">
                      <path
                        d="M 0 30 Q 15 10 30 30 T 60 30 T 90 30 T 120 30 T 150 30 T 180 30 T 210 30 T 240 30 T 270 30 T 300 30 T 330 30 T 360 30 T 390 30 T 420 30 T 450 30 T 480 30 T 500 30"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white border-b border-white/5 pb-4 mb-4">Device Actions</h3>
                  <p className="text-xs text-textDim mb-4">Quickly link an active smart sensor or ventilator connection gateway here.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-textDim uppercase tracking-widest font-semibold mb-1">Select Patient</label>
                      <select
                        className="w-full bg-[#0d131a] border border-[#2f3b4c] rounded-lg p-2.5 text-white text-xs"
                        value={selectedPairPatientId}
                        onChange={e => setSelectedPairPatientId(e.target.value)}
                      >
                        <option value="">-- Choose Patient --</option>
                        {patients.map(p => (
                          <option key={p.patient_id} value={p.patient_id}>
                            {p.name} (Bed {p.bed_number || 'Unassigned'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-textDim uppercase tracking-widest font-semibold mb-1">Select Device</label>
                      <select
                        className="w-full bg-[#0d131a] border border-[#2f3b4c] rounded-lg p-2.5 text-white text-xs"
                        value={selectedPairDeviceId}
                        onChange={e => setSelectedPairDeviceId(e.target.value)}
                      >
                        <option value="">-- Choose Device --</option>
                        {devices.filter(d => d.status === 'online').map(d => (
                          <option key={d.device_id} value={d.device_id}>
                            {d.mac_address} ({d.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!selectedPairPatientId || !selectedPairDeviceId) return;
                    try {
                      await pairDevice.mutateAsync({
                        device_id: selectedPairDeviceId,
                        patient_id: selectedPairPatientId,
                        hospital_id: user.hospital_id
                      });
                      setSelectedPairPatientId('');
                      setSelectedPairDeviceId('');
                      refetchPatients();
                      alert('Device paired successfully!');
                    } catch (err) {
                      alert('Failed to pair device');
                    }
                  }}
                  disabled={!selectedPairPatientId || !selectedPairDeviceId || pairDevice.isPending}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-background font-bold text-xs py-3 px-4 rounded-xl hover:opacity-95 transition-all mt-4 disabled:opacity-50"
                >
                  Pair Device
                </button>
              </div>
            </div>

            {/* Recent Patients Table */}
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-white">Telemetry Registry Overview</h3>
                <button
                  onClick={() => setActiveTab('patients')}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  View All Patients <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {loadingPatients ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-textDim uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Patient Name</th>
                        <th className="pb-3 font-semibold">Bed</th>
                        <th className="pb-3 font-semibold">Vent Status</th>
                        <th className="pb-3 font-semibold">Vitals (Heart / SpO2)</th>
                        <th className="pb-3 font-semibold">Risk Score</th>
                        <th className="pb-3 text-right">Telemetry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {patients.slice(0, 5).map(patient => (
                        <tr key={patient.patient_id} className="hover:bg-white/[0.02] transition-all">
                          <td className="py-4.5 font-bold text-white">{patient.name}</td>
                          <td className="py-4.5 text-textDim">{patient.bed_number || 'N/A'}</td>
                          <td className="py-4.5">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${patient.ventilator_status === 'active' ? 'bg-statusStable/15 text-statusStable' :
                                patient.ventilator_status === 'weaning' ? 'bg-statusWarning/15 text-statusWarning' :
                                  'bg-white/10 text-textDim'
                              }`}>
                              {patient.ventilator_status}
                            </span>
                          </td>
                          <td className="py-4.5 flex gap-3">
                            <span className="font-semibold text-statusCritical">82 HR</span>
                            <span className="font-semibold text-statusStable">96% SpO2</span>
                          </td>
                          <td className="py-4.5 font-bold text-primary">Normal (15%)</td>
                          <td className="py-4.5 text-right">
                            <button
                              onClick={() => setSelectedPatientId(patient.patient_id)}
                              className="bg-surface border border-white/10 hover:border-primary/50 text-white font-semibold py-1 px-3 rounded-lg transition-all"
                            >
                              Open Telemetry
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Patient Registry</h2>
              <p className="text-xs text-textDim">View status, settings, and incident history of ICU occupants.</p>
            </div>

            {loadingPatients ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.map(patient => (
                  <div key={patient.patient_id} className="bg-surface/50 border border-white/5 rounded-2xl p-5 hover:border-primary/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white text-base">{patient.name}</h4>
                          <p className="text-xs text-textDim mt-1">Bed {patient.bed_number || 'N/A'} • {patient.gender} • {patient.age} yrs</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${patient.ventilator_status === 'active' ? 'bg-statusStable/15 text-statusStable' :
                            patient.ventilator_status === 'weaning' ? 'bg-statusWarning/15 text-statusWarning' :
                              'bg-white/10 text-textDim'
                          }`}>
                          {patient.ventilator_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6 bg-black/30 p-3 rounded-xl">
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-textDim font-bold">Latest ECG</span>
                          <span className="font-bold text-statusStable text-sm">76 BPM</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-textDim font-bold">Latest SpO2</span>
                          <span className="font-bold text-statusStable text-sm">97%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPatientId(patient.patient_id)}
                      className="w-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs py-2.5 rounded-xl hover:bg-primary hover:text-background transition-all mt-6"
                    >
                      Open Patient telemetry
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">IoT Devices Gateway</h2>
              <p className="text-xs text-textDim">Manage smart ventilator telemetry interfaces connected to the system.</p>
            </div>

            {loadingDevices ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-textDim uppercase tracking-wider">
                      <th className="pb-3 font-semibold">MAC Address</th>
                      <th className="pb-3 font-semibold">Connection Code</th>
                      <th className="pb-3 font-semibold">Battery</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Firmware</th>
                      <th className="pb-3 font-semibold">Last Ping</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {devices.map(device => (
                      <tr key={device.device_id} className="hover:bg-white/[0.01]">
                        <td className="py-4 font-mono font-bold text-white">{device.mac_address}</td>
                        <td className="py-4 text-textDim font-mono">{device.connection_code}</td>
                        <td className="py-4 font-bold text-white">{device.battery_level ? `${device.battery_level}%` : 'N/A'}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${device.status === 'online' ? 'bg-statusStable/15 text-statusStable' :
                              device.status === 'offline' ? 'bg-statusCritical/15 text-statusCritical' :
                                'bg-statusWarning/15 text-statusWarning'
                            }`}>
                            {device.status}
                          </span>
                        </td>
                        <td className="py-4 text-textDim">{device.firmware_version || 'N/A'}</td>
                        <td className="py-4 text-textDim">{formatDateTime(device.last_ping)}</td>
                        <td className="py-4 text-right">
                          <button
                            onClick={async () => {
                              try {
                                await unpairDevice.mutateAsync(device.device_id);
                                alert('Device unassigned');
                              } catch {
                                alert('Error unassigning device');
                              }
                            }}
                            className="bg-statusCritical/15 text-statusCritical border border-statusCritical/20 font-bold px-3 py-1 rounded-lg text-[10px] hover:bg-statusCritical/25 transition-all"
                          >
                            Disconnect Gateway
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Active System Alerts</h2>
              <p className="text-xs text-textDim">Real-time warning list from AI models and ventilator pressure monitors.</p>
            </div>

            {loadingAlerts ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-textDim">
                    <CheckCircle2 className="h-12 w-12 text-statusStable mb-3" />
                    <p className="font-bold text-white text-base">No active alerts</p>
                    <p className="text-xs mt-1">All patient pressure thresholds within normal bounds.</p>
                  </div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.alert_id} className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${alert.alert_type === 'critical' ? 'bg-statusCritical/10 border-statusCritical/30' : 'bg-statusWarning/10 border-statusWarning/30'
                      }`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-xl mt-0.5 ${alert.alert_type === 'critical' ? 'bg-statusCritical/15 text-statusCritical' : 'bg-statusWarning/15 text-statusWarning'
                          }`}>
                          <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-extrabold text-white uppercase tracking-wide">
                              {alert.alert_type} Alert
                            </span>
                            <span className="text-[10px] text-textDim font-bold">
                              {formatDateTime(alert.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-textMain mt-1.5 font-medium">{alert.message}</p>
                          <p className="text-xs text-textDim mt-2 font-semibold">Status: <span className="text-white uppercase">{alert.status}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {alert.status === 'pending' && (
                          <button
                            onClick={() => acknowledgeAlert.mutate(alert.alert_id)}
                            className="bg-statusWarning text-background font-bold text-xs px-4.5 py-2.5 rounded-xl hover:opacity-90 transition-all"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => resolveAlert.mutate(alert.alert_id)}
                          className="bg-statusStable text-background font-bold text-xs px-4.5 py-2.5 rounded-xl hover:opacity-90 transition-all"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Patient Details Modal */}
      {selectedPatientId && selectedPatient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full rounded-3xl p-6 glow-border relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedPatientId(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-textDim hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
              <div className="h-12 w-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedPatient.name}</h3>
                <p className="text-xs text-textDim">Bed {selectedPatient.bed_number || 'N/A'} • {selectedPatient.gender} • {selectedPatient.age} years old</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest text-textDim font-bold border-b border-white/5 pb-2">Ventilator Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 p-4 rounded-2xl">
                    <span className="block text-[9px] uppercase tracking-wider text-textDim font-semibold">Tidal Volume</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">500 ml</span>
                  </div>
                  <div className="bg-black/30 p-4 rounded-2xl">
                    <span className="block text-[9px] uppercase tracking-wider text-textDim font-semibold">PEEP Pressure</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">8 cmH2O</span>
                  </div>
                  <div className="bg-black/30 p-4 rounded-2xl">
                    <span className="block text-[9px] uppercase tracking-wider text-textDim font-semibold">Respiratory Rate</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">14 bpm</span>
                  </div>
                  <div className="bg-black/30 p-4 rounded-2xl">
                    <span className="block text-[9px] uppercase tracking-wider text-textDim font-semibold">FiO2 Setting</span>
                    <span className="text-lg font-extrabold text-white mt-1 block">40 %</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest text-textDim font-bold border-b border-white/5 pb-2">AI Forecasting Prediction</h4>

                <div className="bg-gradient-to-tr from-primary/10 to-secondary/10 border border-primary/20 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Ventilator Weaning Risk</span>
                    <span className="text-statusStable font-bold text-sm uppercase">Stable (10%)</span>
                  </div>

                  <div className="flex items-start gap-3 text-xs text-textMain/80">
                    <Info className="h-5 w-5 text-primary shrink-0" />
                    <p className="leading-relaxed">Ventilator pressure trends indicate high probability of successful weaning within 24 hours. Vital compliance levels are optimal.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-b border-white/5 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPatientId(null)}
                className="bg-primary text-background font-bold text-xs px-5 py-3 rounded-xl hover:opacity-90 transition-all"
              >
                Close Telemetry View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
