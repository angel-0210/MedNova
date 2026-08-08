import { useState, useEffect, useMemo } from 'react';
import {
  usePatientsQuery, useCreatePatientMutation, useUpdatePatientMutation,
  useUpdateFollowUpMutation,
  useAlertsQuery, useAcknowledgeAlertMutation, useResolveAlertMutation,
  useDevicesQuery, useRegisterDeviceMutation, useAssignmentsQuery,
  usePairDeviceMutation, useUnpairDeviceMutation,
  useHospitalQuery, useCreateHospitalMutation,
  useWardsQuery, useCreateWardMutation,
  useUsersQuery, useCreateStaffMutation,
  useAuditLogsQuery, useLatestVitalsQuery, useAIPredictionQuery,
} from '@mednova/hooks';
import { authRepository, setOnSessionExpired } from '@mednova/api';
import { parseAPIError, formatDateTime } from '@mednova/utils';
import {
  LayoutDashboard, Building2, DoorOpen, Users, Cpu, Activity, Bell,
  ScrollText, LogOut, Plus, AlertTriangle, RefreshCw, Pencil,
  User as UserIcon, ShieldAlert, X, CheckCircle2, Stethoscope,
} from 'lucide-react';
import type { User, Patient, Device, UserRole, FollowUpStatus } from '@mednova/types';

// =========================================================================
// NAVIGATION
// Every entry below is backed by a real endpoint. Pages with no backing API
// (live monitoring, global AI predictions, reports) were removed rather than
// left as placeholders -- vitals and predictions are per-patient only, so they
// live in the patient detail dialog where those endpoints actually fit.
// =========================================================================
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'patients', label: 'Patients', icon: Users, group: 'Clinical' },
  { id: 'staff', label: 'Staff', icon: Stethoscope, group: 'Clinical' },
  { id: 'alerts', label: 'Alerts', icon: Bell, group: 'Clinical' },
  { id: 'devices', label: 'Devices', icon: Cpu, group: 'Infrastructure' },
  { id: 'wards', label: 'Wards', icon: DoorOpen, group: 'Infrastructure' },
  { id: 'hospital', label: 'Hospital', icon: Building2, group: 'Infrastructure' },
  { id: 'audit', label: 'Audit Log', icon: ScrollText, group: 'Infrastructure' },
] as const;

type TabId = (typeof NAV)[number]['id'];

// =========================================================================
// SHARED PRIMITIVES
// =========================================================================
const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm';

type Field = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'password' | 'email' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
};

function Modal({ title, subtitle, icon, onClose, children }: {
  title: string; subtitle?: string; icon: React.ReactNode;
  onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200/80 p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6 pr-10">
          <div className="h-10 w-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * One form component drives every "Add X" dialog. Values come back as raw
 * strings; each caller converts what it needs (numbers, optional fields)
 * before posting.
 */
function FormModal({ title, subtitle, icon, fields, submitLabel, pending, error, initial, onSubmit, onClose }: {
  title: string; subtitle?: string; icon: React.ReactNode; fields: Field[];
  submitLabel: string; pending: boolean; error: string;
  /** Prefills the form -- an edit dialog has to open showing the current values. */
  initial?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void; onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map(f => [f.name, initial?.[f.name] ?? '']))
  );

  return (
    <Modal title={title} subtitle={subtitle} icon={icon} onClose={onClose}>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSubmit(values); }}>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">
              {field.label}{field.required && <span className="text-red-500"> *</span>}
            </label>
            {field.type === 'select' ? (
              <select
                className={inputClass}
                required={field.required}
                value={values[field.name]}
                onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
              >
                <option value="">{field.placeholder || '-- Select --'}</option>
                {field.options?.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                className={inputClass}
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
              />
            )}
            {field.hint && <p className="text-[10px] text-slate-400 mt-1">{field.hint}</p>}
          </div>
        ))}

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            {pending ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Panel({ title, description, action, children }: {
  title: string; description: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm shrink-0"
    >
      <Plus className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

function Empty({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
      <div className="text-slate-300 mb-3">{icon}</div>
      <p className="font-bold text-slate-700">{title}</p>
      <p className="text-xs mt-1">{hint}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-48 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Badge({ tone, children }: { tone: 'green' | 'red' | 'orange' | 'slate' | 'blue'; children: React.ReactNode }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}

function StatCard({ icon, tone, label, value, footnote }: {
  icon: React.ReactNode; tone: string; label: string; value: number | string; footnote?: string;
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      <div className={`h-10 w-10 ${tone} text-white rounded-xl flex items-center justify-center shadow-sm`}>
        {icon}
      </div>
      <div className="mt-4">
        <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">{label}</span>
        <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{value}</span>
        {footnote && <span className="text-[11px] text-slate-500 font-semibold mt-1 block">{footnote}</span>}
      </div>
    </div>
  );
}

// Follow-up vocabulary. Kept beside the panel because every surface that renders a
// prediction needs the same four states -- they mirror the DB CHECK constraint.
const FOLLOW_UP_OPTIONS: { value: FollowUpStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'not_required', label: 'Not Required' },
];
const FOLLOW_UP_LABEL: Record<string, string> =
  Object.fromEntries(FOLLOW_UP_OPTIONS.map(o => [o.value, o.label]));
const followUpTone: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50',
  in_progress: 'text-blue-600 bg-blue-50',
  completed: 'text-emerald-600 bg-emerald-50',
  not_required: 'text-slate-500 bg-slate-100',
};

// =========================================================================
// PATIENT DETAIL -- real vitals + real prediction, one patient at a time.
// Its own component so the per-patient hooks stay unconditional.
// =========================================================================
function PatientDetail({ patient, deviceLabel, canFollowUp, staffNameById, onClose }: {
  patient: Patient; deviceLabel: string | null;
  canFollowUp: boolean; staffNameById: Map<string, string>;
  onClose: () => void;
}) {
  const vitals = useLatestVitalsQuery(patient.patient_id);
  const prediction = useAIPredictionQuery(patient.patient_id);
  const followUp = useUpdateFollowUpMutation(patient.patient_id);

  const [status, setStatus] = useState<FollowUpStatus>('pending');
  const [note, setNote] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const predictionId = prediction.data?.prediction_id;
  // Seed from the record only when the prediction itself changes. This query polls every
  // 15s, so syncing on every data change would wipe a note while it is being typed.
  useEffect(() => {
    if (!prediction.data) return;
    setStatus(prediction.data.follow_up_status ?? 'pending');
    setNote(prediction.data.clinician_note ?? '');
    setSaveError('');
    setSaved(false);
  }, [predictionId]);

  const saveFollowUp = async () => {
    if (!predictionId) return;
    setSaveError('');
    try {
      await followUp.mutateAsync({ predictionId, follow_up_status: status, clinician_note: note });
      setSaved(true);
    } catch (err) {
      setSaveError(parseAPIError(err));
    }
  };

  const riskTone: Record<string, string> = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-blue-600 bg-blue-50',
    normal: 'text-emerald-600 bg-emerald-50',
  };

  return (
    <Modal
      title={patient.name}
      subtitle={`Bed ${patient.bed_number || 'N/A'} • ${patient.gender} • ${patient.age} yrs • admitted ${patient.admission_date}`}
      icon={<Users className="h-6 w-6" />}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 pb-2 mb-3">
            Latest Vitals
          </h4>
          {vitals.isLoading ? (
            <p className="text-xs text-slate-400 py-4">Loading telemetry...</p>
          ) : vitals.data ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'SpO2', value: `${vitals.data.spo2}%` },
                  { label: 'Heart Rate', value: `${vitals.data.heart_rate} bpm` },
                  { label: 'Temperature', value: `${vitals.data.temperature} °C` },
                ].map(v => (
                  <div key={v.label} className="bg-slate-50 p-4 rounded-xl">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">{v.label}</span>
                    <span className="text-lg font-extrabold text-slate-900 mt-1 block">{v.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Recorded {formatDateTime(vitals.data.timestamp)}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500 py-4">
              No sensor readings yet. Pair a device and let it report to see live vitals.
            </p>
          )}
        </div>

        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 pb-2 mb-3">
            AI Risk Prediction
          </h4>
          {prediction.isLoading ? (
            <p className="text-xs text-slate-400 py-4">Loading prediction...</p>
          ) : prediction.data ? (
            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center gap-3">
                <span className="text-xs font-bold text-slate-800">
                  Risk score {prediction.data.risk_score}/100
                </span>
                <span className={`font-bold text-xs uppercase px-2 py-0.5 rounded-md ${riskTone[prediction.data.risk_level] || riskTone.normal}`}>
                  {prediction.data.risk_level}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                Confidence {Math.round(prediction.data.confidence * 100)}% • model {prediction.data.model_version}
              </p>
              {prediction.data.recommendation && (
                <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-3">
                  {prediction.data.recommendation}
                </p>
              )}

              {/* ---- Follow-up: what a clinician is doing about this result ---- */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    Follow-up
                  </span>
                  <span className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded-md ${followUpTone[prediction.data.follow_up_status] || followUpTone.pending}`}>
                    {FOLLOW_UP_LABEL[prediction.data.follow_up_status] ?? prediction.data.follow_up_status}
                  </span>
                </div>

                {prediction.data.follow_up_at && (
                  <p className="text-[10px] text-slate-400">
                    Last updated by {staffNameById.get(prediction.data.follow_up_by ?? '') ?? 'a clinician'}
                    {' • '}{formatDateTime(prediction.data.follow_up_at)}
                  </p>
                )}

                {canFollowUp ? (
                  <>
                    <select
                      className={inputClass}
                      value={status}
                      onChange={e => { setStatus(e.target.value as FollowUpStatus); setSaved(false); }}
                    >
                      {FOLLOW_UP_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <textarea
                      className={`${inputClass} min-h-[80px] resize-y`}
                      placeholder="Clinician note — what was done, or what to watch for."
                      maxLength={2000}
                      value={note}
                      onChange={e => { setNote(e.target.value); setSaved(false); }}
                    />
                    {saveError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-[11px] rounded-lg font-medium">
                        {saveError}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={saveFollowUp}
                        disabled={followUp.isPending}
                        className="bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                      >
                        {followUp.isPending ? 'Saving...' : 'Save Follow-up'}
                      </button>
                      {saved && !followUp.isPending && (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-auto">{note.length}/2000</span>
                    </div>
                  </>
                ) : prediction.data.clinician_note ? (
                  <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-lg p-3">
                    {prediction.data.clinician_note}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">No clinician note recorded.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4">No prediction generated for this patient yet.</p>
          )}
        </div>

        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100 pb-2 mb-3">
            Paired Device
          </h4>
          <p className="text-xs text-slate-700 font-medium">
            {deviceLabel || <span className="text-slate-400">No device currently paired.</span>}
          </p>
        </div>
      </div>
    </Modal>
  );
}

// =========================================================================
// ADMIN PANEL
// Mounted only once authenticated. Keeping the data hooks in here rather than
// in App means the login screen doesn't fire polling queries that 401 in a loop.
// =========================================================================
function AdminPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<null | 'patient' | 'staff' | 'doctor' | 'device' | 'ward' | 'hospital' | 'pair'>(null);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const isAdmin = user.role === 'admin';

  // ---- Data -------------------------------------------------------------
  const patients = usePatientsQuery();
  const alerts = useAlertsQuery();
  const devices = useDevicesQuery();
  const assignments = useAssignmentsQuery();
  const users = useUsersQuery();
  const wards = useWardsQuery();
  const hospital = useHospitalQuery(user.hospital_id);
  const auditLogs = useAuditLogsQuery(isAdmin);

  // ---- Mutations --------------------------------------------------------
  const createPatient = useCreatePatientMutation();
  const updatePatient = useUpdatePatientMutation();
  const createStaff = useCreateStaffMutation();
  const registerDevice = useRegisterDeviceMutation();
  const createWard = useCreateWardMutation();
  const createHospital = useCreateHospitalMutation();
  const pairDevice = usePairDeviceMutation();
  const unpairDevice = useUnpairDeviceMutation();
  const acknowledgeAlert = useAcknowledgeAlertMutation();
  const resolveAlert = useResolveAlertMutation();

  const patientList = patients.data ?? [];
  const alertList = alerts.data ?? [];
  const deviceList = devices.data ?? [];
  const assignmentList = assignments.data ?? [];
  const userList = users.data ?? [];
  const wardList = wards.data ?? [];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Also clears the edit target so submit()'s shared success path closes the edit dialog too.
  const closeForm = () => { setOpenForm(null); setEditPatientId(null); setFormError(''); };

  /** Every create flow funnels through here so errors and toasts behave identically. */
  const submit = async (run: () => Promise<unknown>, okMessage: string) => {
    setFormError('');
    try {
      await run();
      closeForm();
      setToast({ tone: 'ok', text: okMessage });
    } catch (err) {
      setFormError(parseAPIError(err));
    }
  };

  // Device -> its active assignment. /unassign takes an assignment_id, not a
  // device_id; without this lookup the unpair button had nothing valid to send.
  const assignmentByDevice = useMemo(
    () => new Map(assignmentList.map(a => [a.device_id, a])),
    [assignmentList]
  );
  /**
   * Sidebar shortcut to the patient dialog. The dialog is per-patient, so it opens the
   * one already in focus and otherwise falls back to the first on the ward -- reaching
   * it used to mean Patients tab -> find the card -> Open Telemetry.
   */
  const openPatientDialog = () => {
    if (patientList.length === 0) {
      setActiveTab('patients');
      setToast({ tone: 'err', text: 'No patients admitted yet.' });
      return;
    }
    const stillOnWard = patientList.some(p => p.patient_id === selectedPatientId);
    setSelectedPatientId(stillOnWard ? selectedPatientId : patientList[0].patient_id);
  };

  const patientNameById = useMemo(
    () => new Map(patientList.map(p => [p.patient_id, p.name])),
    [patientList]
  );

  const refreshAll = () => {
    patients.refetch(); alerts.refetch(); devices.refetch();
    assignments.refetch(); users.refetch(); wards.refetch();
    if (isAdmin) auditLogs.refetch();
  };

  const selectedPatient = patientList.find(p => p.patient_id === selectedPatientId);
  const onlineDevices = deviceList.filter(d => d.status === 'online').length;
  const criticalAlerts = alertList.filter(a => a.alert_type === 'critical').length;
  const clinicalStaff = userList.filter(u => u.role === 'doctor' || u.role === 'nurse').length;

  // /users is already scoped to the caller's hospital server-side, so filtering by role
  // here is the whole "doctors under this hospital" query -- no extra request needed.
  const doctorList = userList.filter(u => u.role === 'doctor');

  // Mirrors RequireRole(["admin","doctor","nurse"]) on the patients endpoints -- an
  // attendant would only get a 403, so the control is hidden rather than shown broken.
  const canEditPatients = ['admin', 'doctor', 'nurse'].includes(user.role);
  const staffNameById = useMemo(
    () => new Map(userList.map(u => [u.user_id, u.name])),
    [userList]
  );
  const editingPatient = patientList.find(p => p.patient_id === editPatientId);

  const staffOptions = (role: UserRole) =>
    userList.filter(u => u.role === role).map(u => ({ value: u.user_id, label: u.name }));

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 tracking-tight leading-none text-base">MedNova</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Health Systems</div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {['Overview', 'Clinical', 'Infrastructure'].map(group => (
            <div key={group} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{group}</div>
              {NAV.filter(n => n.group === group).map(item => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active ? 'bg-teal-50 text-teal-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'alerts' && alertList.length > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {alertList.length}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Opens the per-patient modal, so it is an action rather than a tab --
                  giving it a NAV id would select a tab with no panel behind it. */}
              {group === 'Clinical' && (
                <button
                  onClick={openPatientDialog}
                  disabled={patients.isLoading}
                  title={
                    patientList.length === 0
                      ? 'No patients admitted yet'
                      : `Open ${patientNameById.get(selectedPatientId ?? '') ?? patientList[0].name}`
                  }
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                >
                  <span className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                    <span>Patient Dialog</span>
                  </span>
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="px-3 py-2 mb-1">
            <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{user.role}</div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0">
          <div className="text-xl font-bold text-slate-900">
            {hospital.data?.name || 'MedNova Admin'}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshAll}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              <span>Refresh</span>
            </button>
            <div className="h-9 w-9 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-600">
              <UserIcon className="h-5 w-5" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto space-y-8">

          {/* ---------------- DASHBOARD ---------------- */}
          {activeTab === 'dashboard' && (
            <>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h2>
                <p className="text-slate-500 text-sm mt-1">Live counts from your hospital's records.</p>
              </div>

              {/* ponytail: counts derive from the list endpoints, which page at 100 rows.
                  Past that these under-report -- add a /stats endpoint with SQL COUNTs. */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={<Users className="h-5 w-5" />} tone="bg-blue-500"
                  label="Patients" value={patientList.length}
                  footnote={`${patientList.filter(p => p.ventilator_status === 'active').length} on ventilator`}
                />
                <StatCard
                  icon={<AlertTriangle className="h-5 w-5" />} tone="bg-red-500"
                  label="Pending Alerts" value={alertList.length}
                  footnote={`${criticalAlerts} critical`}
                />
                <StatCard
                  icon={<Cpu className="h-5 w-5" />} tone="bg-slate-700"
                  label="Devices" value={deviceList.length}
                  footnote={`${onlineDevices} online • ${assignmentList.length} paired`}
                />
                <StatCard
                  icon={<Stethoscope className="h-5 w-5" />} tone="bg-teal-500"
                  label="Clinical Staff" value={clinicalStaff}
                  footnote={`${userList.length} total accounts`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-blue-600" />
                    <span>Device Status</span>
                  </h3>
                  {deviceList.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6">No devices registered yet.</p>
                  ) : (
                    (['online', 'offline', 'maintenance', 'error'] as const).map(status => {
                      const count = deviceList.filter(d => d.status === status).length;
                      const pct = Math.round((count / deviceList.length) * 100);
                      const bar = {
                        online: 'bg-emerald-600', offline: 'bg-red-500',
                        maintenance: 'bg-orange-500', error: 'bg-slate-700',
                      }[status];
                      return (
                        <div key={status} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700 capitalize">{status}</span>
                            <span className="text-slate-900">{count}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`${bar} h-full rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-blue-600" />
                    <span>Alerts by Severity</span>
                  </h3>
                  {alertList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-2" />
                      <p className="text-xs font-bold text-slate-700">No pending alerts</p>
                    </div>
                  ) : (
                    (['critical', 'high', 'medium', 'low', 'device'] as const).map(type => {
                      const count = alertList.filter(a => a.alert_type === type).length;
                      if (!count) return null;
                      return (
                        <div key={type} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <span className="text-xs font-bold text-slate-700 capitalize">{type}</span>
                          <span className="text-lg font-extrabold text-slate-900">{count}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                    <button onClick={() => setActiveTab('audit')} className="text-xs text-blue-600 font-bold hover:underline">
                      View full log
                    </button>
                  </div>
                  {auditLogs.isLoading ? <Spinner /> : (auditLogs.data ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500 py-6">No activity recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="pb-3">Time</th><th className="pb-3">Action</th>
                            <th className="pb-3">Entity</th><th className="pb-3">Source IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(auditLogs.data ?? []).slice(0, 8).map(log => (
                            <tr key={log.log_id} className="hover:bg-slate-50/50">
                              <td className="py-3 font-semibold text-slate-500">{formatDateTime(log.created_at)}</td>
                              <td className="py-3 font-bold text-slate-800">{log.action}</td>
                              <td className="py-3 text-slate-600">{log.entity_name}</td>
                              <td className="py-3 text-slate-400 font-mono">{log.ip_address || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ---------------- PATIENTS ---------------- */}
          {activeTab === 'patients' && (
            <Panel
              title="Patient Registry"
              description="ICU occupants, ventilator status and paired telemetry."
              action={<AddButton onClick={() => setOpenForm('patient')} label="Add Patient" />}
            >
              {patients.isLoading ? <Spinner /> : patientList.length === 0 ? (
                <Empty icon={<Users className="h-12 w-12" />} title="No patients yet" hint="Add your first patient to begin monitoring." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patientList.map(patient => {
                    const paired = assignmentList.find(a => a.patient_id === patient.patient_id);
                    return (
                      <div key={patient.patient_id} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 hover:border-blue-500/40 hover:bg-white transition-all flex flex-col justify-between shadow-sm">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{patient.name}</h4>
                              <p className="text-xs text-slate-500 mt-1">
                                Bed {patient.bed_number || 'N/A'} • {patient.gender} • {patient.age} yrs
                              </p>
                            </div>
                            <Badge tone={
                              patient.ventilator_status === 'active' ? 'green'
                                : patient.ventilator_status === 'weaning' ? 'orange' : 'slate'
                            }>
                              {patient.ventilator_status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-4 bg-slate-100/60 rounded-lg px-3 py-2">
                            {paired
                              ? `Paired with ${deviceList.find(d => d.device_id === paired.device_id)?.mac_address ?? 'device'}`
                              : 'No device paired'}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => setSelectedPatientId(patient.patient_id)}
                            className="flex-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs py-2.5 rounded-xl transition-all"
                          >
                            Open Telemetry
                          </button>
                          {canEditPatients && (
                            <button
                              onClick={() => setEditPatientId(patient.patient_id)}
                              title={`Edit ${patient.name}`}
                              aria-label={`Edit ${patient.name}`}
                              className="px-3 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          )}

          {/* ---------------- STAFF ---------------- */}
          {activeTab === 'staff' && (
            <Panel
              title="Staff Directory"
              description="Accounts that can sign in to this hospital."
              action={isAdmin ? <AddButton onClick={() => setOpenForm('staff')} label="Add Staff" /> : undefined}
            >
              {users.isLoading ? <Spinner /> : userList.length === 0 ? (
                <Empty icon={<Stethoscope className="h-12 w-12" />} title="No staff accounts" hint="Add doctors and nurses to assign them to patients." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Name</th><th className="pb-3">Email</th>
                        <th className="pb-3">Role</th><th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userList.map(u => (
                        <tr key={u.user_id} className="hover:bg-slate-50/50">
                          <td className="py-4 font-bold text-slate-900">{u.name}</td>
                          <td className="py-4 text-slate-600">{u.email}</td>
                          <td className="py-4"><Badge tone="blue">{u.role}</Badge></td>
                          <td className="py-4">
                            <Badge tone={u.is_active ? 'green' : 'slate'}>{u.is_active ? 'active' : 'inactive'}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}

          {/* ---------------- ALERTS ---------------- */}
          {activeTab === 'alerts' && (
            <Panel title="Active Alerts" description="Pending warnings from AI models and device monitors.">
              {alerts.isLoading ? <Spinner /> : alertList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-3" />
                  <p className="font-bold text-slate-800 text-base">No active alerts</p>
                  <p className="text-xs mt-1">All patients within normal bounds.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alertList.map(alert => (
                    <div key={alert.alert_id} className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      alert.alert_type === 'critical' ? 'bg-red-50/50 border-red-200' : 'bg-orange-50/50 border-orange-200'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-xl mt-0.5 text-white ${alert.alert_type === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`}>
                          <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                            {alert.alert_type} Alert
                          </span>
                          <p className="text-sm text-slate-700 mt-1.5 font-medium">{alert.message}</p>
                          <p className="text-xs text-slate-500 mt-2 font-bold">
                            {patientNameById.get(alert.patient_id) ?? 'Unknown patient'} • {formatDateTime(alert.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {alert.status === 'pending' && (
                          <button
                            onClick={() => acknowledgeAlert.mutate(alert.alert_id, {
                              onError: err => setToast({ tone: 'err', text: parseAPIError(err) }),
                            })}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => resolveAlert.mutate(alert.alert_id, {
                            onError: err => setToast({ tone: 'err', text: parseAPIError(err) }),
                          })}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {/* ---------------- DEVICES ---------------- */}
          {activeTab === 'devices' && (
            <Panel
              title="IoT Device Gateway"
              description="Ventilator telemetry sensors and their patient pairings."
              action={
                <div className="flex gap-3">
                  <button
                    onClick={() => setOpenForm('pair')}
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm"
                  >
                    Pair Device
                  </button>
                  {isAdmin && <AddButton onClick={() => setOpenForm('device')} label="Register Device" />}
                </div>
              }
            >
              {devices.isLoading ? <Spinner /> : deviceList.length === 0 ? (
                <Empty icon={<Cpu className="h-12 w-12" />} title="No devices registered" hint="Register a sensor by its MAC address and 5-digit code." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">MAC Address</th><th className="pb-3">Code</th>
                        <th className="pb-3">Battery</th><th className="pb-3">Status</th>
                        <th className="pb-3">Paired Patient</th><th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deviceList.map(device => {
                        const assignment = assignmentByDevice.get(device.device_id);
                        return (
                          <tr key={device.device_id} className="hover:bg-slate-50/50">
                            <td className="py-4 font-mono font-bold text-slate-900">{device.mac_address}</td>
                            <td className="py-4 text-slate-500 font-mono">{device.connection_code}</td>
                            <td className="py-4 font-bold text-slate-900">
                              {device.battery_level != null ? `${device.battery_level}%` : '—'}
                            </td>
                            <td className="py-4">
                              <Badge tone={
                                device.status === 'online' ? 'green'
                                  : device.status === 'offline' ? 'red' : 'orange'
                              }>
                                {device.status}
                              </Badge>
                            </td>
                            <td className="py-4 text-slate-600 font-medium">
                              {assignment
                                ? patientNameById.get(assignment.patient_id) ?? 'Unknown'
                                : <span className="text-slate-400">Unpaired</span>}
                            </td>
                            <td className="py-4 text-right">
                              {assignment ? (
                                <button
                                  onClick={() => unpairDevice.mutate(assignment.assignment_id, {
                                    onSuccess: () => setToast({ tone: 'ok', text: 'Device unpaired.' }),
                                    onError: err => setToast({ tone: 'err', text: parseAPIError(err) }),
                                  })}
                                  className="bg-red-50 text-red-600 border border-red-200 font-bold px-3 py-1.5 rounded-lg text-[10px] hover:bg-red-100 transition-all"
                                >
                                  Unpair
                                </button>
                              ) : (
                                <span className="text-slate-300 text-[10px] font-bold">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}

          {/* ---------------- WARDS ---------------- */}
          {activeTab === 'wards' && (
            <Panel
              title="Wards & Units"
              description="Physical units patients are admitted into."
              action={isAdmin ? <AddButton onClick={() => setOpenForm('ward')} label="Add Ward" /> : undefined}
            >
              {wards.isLoading ? <Spinner /> : wardList.length === 0 ? (
                <Empty icon={<DoorOpen className="h-12 w-12" />} title="No wards defined" hint="Add a ward before admitting patients into it." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {wardList.map(ward => (
                    <div key={ward.ward_id} className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50">
                      <h4 className="font-bold text-slate-900">{ward.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 capitalize">{ward.unit_type}</p>
                      <p className="text-[11px] text-slate-400 mt-3">
                        {patientList.filter(p => p.ward_id === ward.ward_id).length} patients
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {/* ---------------- HOSPITAL ---------------- */}
          {activeTab === 'hospital' && (
            <Panel
              title="Hospital"
              description="Your tenant details. The hospital code is what new staff use to self-register."
              action={isAdmin ? <AddButton onClick={() => setOpenForm('hospital')} label="Add Hospital" /> : undefined}
            >
              {hospital.isLoading ? <Spinner /> : hospital.data ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Name', value: hospital.data.name },
                    { label: 'Hospital Code', value: hospital.data.hospital_code },
                    { label: 'Address', value: hospital.data.address || '—' },
                  ].map(f => (
                    <div key={f.label} className="bg-slate-50 p-4 rounded-xl">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">{f.label}</span>
                      <span className="text-sm font-bold text-slate-900 mt-1 block break-words">{f.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon={<Building2 className="h-12 w-12" />} title="Hospital unavailable" hint="Could not load your hospital record." />
              )}

              {/* ---- Doctors belonging to this hospital ---- */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-slate-400" />
                    Doctors
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {doctorList.length} {doctorList.length === 1 ? 'doctor' : 'doctors'}
                    </span>
                    {isAdmin && <AddButton onClick={() => setOpenForm('doctor')} label="Add Doctor" />}
                  </div>
                </div>

                {users.isLoading ? <Spinner /> : doctorList.length === 0 ? (
                  <Empty
                    icon={<Stethoscope className="h-12 w-12" />}
                    title="No doctors in this hospital"
                    hint="Add a doctor from the Staff tab, or share the hospital code so they can self-register."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {doctorList.map(d => {
                      const caseload = patientList.filter(p => p.assigned_doctor_id === d.user_id).length;
                      return (
                        <div key={d.user_id} className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 truncate">{d.name}</h4>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{d.email}</p>
                            </div>
                            <Badge tone={d.is_active ? 'green' : 'slate'}>
                              {d.is_active ? 'active' : 'inactive'}
                            </Badge>
                          </div>

                          <p className="text-xs text-slate-500 mt-3 capitalize">
                            {d.department || 'No department set'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {d.license_number ? `Licence ${d.license_number}` : 'Licence not recorded'}
                          </p>

                          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-200/70">
                            {caseload} {caseload === 1 ? 'patient' : 'patients'} assigned
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-4">
                The API scopes every record to one hospital, so this page shows yours only. Creating a
                hospital sets up a separate tenant — you stay assigned to this one, so hand the new code
                to that hospital's first admin to register against.
              </p>
            </Panel>
          )}

          {/* ---------------- AUDIT ---------------- */}
          {activeTab === 'audit' && (
            <Panel title="Audit Log" description="Newest 50 recorded actions for this hospital.">
              {!isAdmin ? (
                <Empty icon={<ScrollText className="h-12 w-12" />} title="Admins only" hint="Your role cannot view audit records." />
              ) : auditLogs.isLoading ? <Spinner /> : (auditLogs.data ?? []).length === 0 ? (
                <Empty icon={<ScrollText className="h-12 w-12" />} title="No activity yet" hint="Actions appear here as staff use the system." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Time</th><th className="pb-3">Action</th>
                        <th className="pb-3">Entity</th><th className="pb-3">Record</th><th className="pb-3">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(auditLogs.data ?? []).map(log => (
                        <tr key={log.log_id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-semibold text-slate-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                          <td className="py-3 font-bold text-slate-800">{log.action}</td>
                          <td className="py-3 text-slate-600">{log.entity_name}</td>
                          <td className="py-3 text-slate-400 font-mono truncate max-w-[180px]">{log.entity_id}</td>
                          <td className="py-3 text-slate-400 font-mono">{log.ip_address || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}
        </main>
      </div>

      {/* ---------------- FORMS ---------------- */}
      {openForm === 'patient' && (
        <FormModal
          title="Add Patient" subtitle="Admit a patient into this hospital."
          icon={<Users className="h-6 w-6" />} submitLabel="Admit Patient"
          pending={createPatient.isPending} error={formError} onClose={closeForm}
          fields={[
            { name: 'name', label: 'Full Name', required: true },
            { name: 'age', label: 'Age', type: 'number', required: true },
            { name: 'gender', label: 'Gender', type: 'select', required: true,
              options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }] },
            { name: 'ventilator_status', label: 'Ventilator Status', type: 'select', required: true,
              options: [{ value: 'active', label: 'Active' }, { value: 'weaning', label: 'Weaning' }, { value: 'off', label: 'Off' }] },
            { name: 'bed_number', label: 'Bed Number', placeholder: 'e.g. 12' },
            { name: 'ward_id', label: 'Ward', type: 'select', options: wardList.map(w => ({ value: w.ward_id, label: w.name })) },
            { name: 'assigned_doctor_id', label: 'Assigned Doctor', type: 'select', options: staffOptions('doctor') },
            { name: 'assigned_nurse_id', label: 'Assigned Nurse', type: 'select', options: staffOptions('nurse') },
          ]}
          onSubmit={v => submit(() => createPatient.mutateAsync({
            hospital_id: user.hospital_id,
            name: v.name,
            age: Number(v.age),
            gender: v.gender,
            ventilator_status: v.ventilator_status as Patient['ventilator_status'],
            bed_number: v.bed_number || undefined,
            ward_id: v.ward_id || undefined,
            assigned_doctor_id: v.assigned_doctor_id || undefined,
            assigned_nurse_id: v.assigned_nurse_id || undefined,
          }), 'Patient admitted.')}
        />
      )}

      {/* Edit uses its own state, not openForm, because the dialog needs to know WHICH
          patient it is editing in order to prefill. */}
      {editingPatient && (
        <FormModal
          title="Edit Patient" subtitle={`Update the record for ${editingPatient.name}.`}
          icon={<Users className="h-6 w-6" />} submitLabel="Save Changes"
          pending={updatePatient.isPending} error={formError} onClose={closeForm}
          initial={{
            name: editingPatient.name ?? '',
            age: editingPatient.age != null ? String(editingPatient.age) : '',
            gender: editingPatient.gender ?? '',
            ventilator_status: editingPatient.ventilator_status ?? '',
            bed_number: editingPatient.bed_number ?? '',
            ward_id: editingPatient.ward_id ?? '',
            assigned_doctor_id: editingPatient.assigned_doctor_id ?? '',
            assigned_nurse_id: editingPatient.assigned_nurse_id ?? '',
          }}
          fields={[
            { name: 'name', label: 'Full Name', required: true },
            { name: 'age', label: 'Age', type: 'number', required: true },
            { name: 'gender', label: 'Gender', type: 'select', required: true,
              options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }] },
            { name: 'ventilator_status', label: 'Ventilator Status', type: 'select', required: true,
              options: [{ value: 'active', label: 'Active' }, { value: 'weaning', label: 'Weaning' }, { value: 'off', label: 'Off' }] },
            { name: 'bed_number', label: 'Bed Number', placeholder: 'e.g. 12' },
            { name: 'ward_id', label: 'Ward', type: 'select', options: wardList.map(w => ({ value: w.ward_id, label: w.name })) },
            { name: 'assigned_doctor_id', label: 'Assigned Doctor', type: 'select', options: staffOptions('doctor') },
            { name: 'assigned_nurse_id', label: 'Assigned Nurse', type: 'select', options: staffOptions('nurse') },
          ]}
          onSubmit={v => submit(() => updatePatient.mutateAsync({
            patientId: editingPatient.patient_id,
            // Empty means "left blank", not "clear it" -- the server skips absent keys,
            // so an untouched optional field keeps whatever it already had.
            name: v.name || undefined,
            age: v.age ? Number(v.age) : undefined,
            gender: v.gender || undefined,
            ventilator_status: (v.ventilator_status || undefined) as Patient['ventilator_status'] | undefined,
            bed_number: v.bed_number || undefined,
            ward_id: v.ward_id || undefined,
            assigned_doctor_id: v.assigned_doctor_id || undefined,
            assigned_nurse_id: v.assigned_nurse_id || undefined,
          }), 'Patient details updated.')}
        />
      )}

      {openForm === 'staff' && (
        <FormModal
          title="Add Staff" subtitle="Creates a confirmed account that can sign in immediately."
          icon={<Stethoscope className="h-6 w-6" />} submitLabel="Create Account"
          pending={createStaff.isPending} error={formError} onClose={closeForm}
          fields={[
            { name: 'name', label: 'Full Name', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Temporary Password', type: 'password', required: true, hint: 'Minimum 8 characters.' },
            { name: 'role', label: 'Role', type: 'select', required: true, options: [
              { value: 'doctor', label: 'Doctor' }, { value: 'nurse', label: 'Nurse' },
              { value: 'attendant', label: 'Attendant' }, { value: 'admin', label: 'Admin' },
            ] },
          ]}
          onSubmit={v => submit(() => createStaff.mutateAsync({
            name: v.name, email: v.email, password: v.password, role: v.role as UserRole,
          }), 'Staff account created.')}
        />
      )}

      {/* Same endpoint as Add Staff, with the role pinned -- this form is reached from the
          hospital's Doctors list, so making the admin re-pick "Doctor" is a way to get it wrong. */}
      {openForm === 'doctor' && (
        <FormModal
          title="Add Doctor" subtitle={`Creates a confirmed doctor account in ${hospital.data?.name ?? 'this hospital'}.`}
          icon={<Stethoscope className="h-6 w-6" />} submitLabel="Create Doctor"
          pending={createStaff.isPending} error={formError} onClose={closeForm}
          fields={[
            { name: 'name', label: 'Full Name', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'password', label: 'Temporary Password', type: 'password', required: true, hint: 'Minimum 8 characters.' },
          ]}
          onSubmit={v => submit(() => createStaff.mutateAsync({
            name: v.name, email: v.email, password: v.password, role: 'doctor',
          }), 'Doctor account created.')}
        />
      )}

      {openForm === 'device' && (
        <FormModal
          title="Register Device" subtitle="Add a telemetry sensor to this hospital."
          icon={<Cpu className="h-6 w-6" />} submitLabel="Register"
          pending={registerDevice.isPending} error={formError} onClose={closeForm}
          fields={[
            { name: 'mac_address', label: 'MAC Address', required: true, placeholder: 'AA:BB:CC:DD:EE:FF' },
            { name: 'connection_code', label: 'Connection Code', required: true, placeholder: '12345', hint: 'Exactly 5 digits.' },
            { name: 'status', label: 'Status', type: 'select', required: true, options: [
              { value: 'offline', label: 'Offline' }, { value: 'online', label: 'Online' },
              { value: 'maintenance', label: 'Maintenance' }, { value: 'error', label: 'Error' },
            ] },
            { name: 'firmware_version', label: 'Firmware Version', placeholder: 'v1.0.0' },
            { name: 'battery_level', label: 'Battery Level (%)', type: 'number' },
          ]}
          onSubmit={v => submit(() => registerDevice.mutateAsync({
            hospital_id: user.hospital_id,
            mac_address: v.mac_address,
            connection_code: v.connection_code,
            status: v.status as Device['status'],
            firmware_version: v.firmware_version || undefined,
            battery_level: v.battery_level ? Number(v.battery_level) : undefined,
          }), 'Device registered.')}
        />
      )}

      {openForm === 'ward' && (
        <FormModal
          title="Add Ward" subtitle="Define a unit patients can be admitted into."
          icon={<DoorOpen className="h-6 w-6" />} submitLabel="Create Ward"
          pending={createWard.isPending} error={formError} onClose={closeForm}
          fields={[
            { name: 'name', label: 'Ward Name', required: true, placeholder: 'Ward 4' },
            { name: 'unit_type', label: 'Unit Type', type: 'select', required: true, options: [
              { value: 'ICU', label: 'ICU' }, { value: 'HDU', label: 'HDU' },
              { value: 'general', label: 'General' }, { value: 'emergency', label: 'Emergency' },
            ] },
          ]}
          onSubmit={v => submit(() => createWard.mutateAsync({
            name: v.name, unit_type: v.unit_type, hospital_id: user.hospital_id,
          }), 'Ward created.')}
        />
      )}

      {openForm === 'hospital' && (
        <FormModal
          title="Add Hospital" subtitle="Sets up a new tenant. You remain assigned to your current hospital."
          icon={<Building2 className="h-6 w-6" />} submitLabel="Create Hospital"
          pending={createHospital.isPending} error={formError} onClose={closeForm}
          fields={[
            { name: 'name', label: 'Hospital Name', required: true },
            { name: 'hospital_code', label: 'Hospital Code', required: true, hint: 'Staff use this code to self-register.' },
            { name: 'address', label: 'Address' },
          ]}
          onSubmit={v => submit(async () => {
            const created = await createHospital.mutateAsync({
              name: v.name, hospital_code: v.hospital_code, address: v.address || undefined,
            });
            // Surfaced because the creator can't open the new tenant -- the code is the
            // only handle they get for onboarding its first admin.
            setToast({ tone: 'ok', text: `Hospital created. Registration code: ${created.hospital_code}` });
          }, 'Hospital created.')}
        />
      )}

      {openForm === 'pair' && (
        <FormModal
          title="Pair Telemetry Device" subtitle="Link an unpaired sensor to a patient."
          icon={<Cpu className="h-6 w-6" />} submitLabel="Link Device"
          pending={pairDevice.isPending} error={formError} onClose={closeForm}
          fields={[
            { name: 'patient_id', label: 'Patient', type: 'select', required: true,
              options: patientList.map(p => ({ value: p.patient_id, label: `${p.name} (Bed ${p.bed_number || 'N/A'})` })) },
            { name: 'device_id', label: 'Device', type: 'select', required: true,
              // Backend rejects a second active assignment, so only offer unpaired ones.
              options: deviceList
                .filter(d => !assignmentByDevice.has(d.device_id))
                .map(d => ({ value: d.device_id, label: `${d.mac_address} (${d.status})` })) },
          ]}
          onSubmit={v => submit(() => pairDevice.mutateAsync({
            device_id: v.device_id, patient_id: v.patient_id, hospital_id: user.hospital_id,
          }), 'Device paired.')}
        />
      )}

      {selectedPatient && (
        <PatientDetail
          patient={selectedPatient}
          deviceLabel={(() => {
            const a = assignmentList.find(x => x.patient_id === selectedPatient.patient_id);
            if (!a) return null;
            return deviceList.find(d => d.device_id === a.device_id)?.mac_address ?? 'Unknown device';
          })()}
          canFollowUp={canEditPatients}
          staffNameById={staffNameById}
          onClose={() => setSelectedPatientId(null)}
        />
      )}

      {/* ---------------- TOAST ---------------- */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-lg text-xs font-bold border ${
            toast.tone === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// APP -- owns the session; renders the login screen or the panel.
// =========================================================================
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('mednova_access_token');
    localStorage.removeItem('mednova_refresh_token');
    localStorage.removeItem('mednova_user_profile');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('mednova_access_token');
    const storedUser = localStorage.getItem('mednova_user_profile');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('mednova_user_profile');
      }
    }
    setOnSessionExpired(() => handleLogout());
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
    } catch (err) {
      setAuthError(parseAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  if (user) return <AdminPanel user={user} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-slate-50">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-400/15 blur-[120px] rounded-full" />

      <div className="w-full max-w-md bg-white border border-slate-200/80 p-8 rounded-2xl shadow-xl flex flex-col items-center z-10">
        <div className="h-14 w-14 bg-gradient-to-tr from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-md rotate-6">
          <Activity className="h-8 w-8 text-white stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mt-6 text-slate-900">MedNova</h1>
        <p className="text-slate-500 text-sm mt-1">Smart Ventilator Telemetry System</p>

        <form className="w-full mt-8 space-y-5" onSubmit={handleLogin}>
          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
              {authError}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Hospital Email</label>
            <input
              type="email" required className={inputClass} placeholder="doctor@hospital.org"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password" required className={inputClass} placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/10 mt-2 text-sm flex justify-center items-center gap-2 disabled:opacity-60"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Authenticate Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
