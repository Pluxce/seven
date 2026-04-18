import {
  User, Cabinet, Patient, Appointment, MedicalRecord, GeriatricEvaluation,
  Notification, ActivityLog, HomeVisit, Invoice, Payment,
  AppointmentRequest, DoctorSchedule,
} from './types';

// ── SEED USERS (always available after any reset) ─────────────
const passwordStore: Record<string, string> = {
  'admin@cabinet-geriatrie.fr':   'admin123',
  'chef@cabinet-geriatrie.fr':    'chef123',
  'medecin@cabinet-geriatrie.fr': 'medecin123',
  'agent@cabinet-geriatrie.fr':   'agent123',
  'patient@cabinet-geriatrie.fr': 'patient123',
};

export const seedUsers: User[] = [
  { id: '1', email: 'admin@cabinet-geriatrie.fr',   firstName: 'Admin',  lastName: 'Système', role: 'super_admin',   phone: '+225 07 00 00 001', isActive: true, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '2', email: 'chef@cabinet-geriatrie.fr',    firstName: 'Jean',   lastName: 'Dupont',  role: 'chef_cabinet',  phone: '+225 07 00 00 002', isActive: true, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '3', email: 'medecin@cabinet-geriatrie.fr', firstName: 'Marie',  lastName: 'Martin',  role: 'medecin', specialty: 'Gériatrie', licenseNumber: 'CI-100001', phone: '+225 07 00 00 003', isActive: true, createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') },
  { id: '4', email: 'patient@cabinet-geriatrie.fr', firstName: 'Pierre', lastName: 'Durand',  role: 'patient',       phone: '+225 07 11 22 33', dateOfBirth: new Date('1950-05-15'), gender: 'male' as const, address: 'Cocody Angré, Abidjan', isActive: true, createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-02-01') },
  { id: '5', email: 'agent@cabinet-geriatrie.fr',   firstName: 'Ahmed',  lastName: 'Benali',  role: 'agent_terrain', phone: '+225 07 98 76 54', isActive: true, createdAt: new Date('2024-02-15'), updatedAt: new Date('2024-02-15') },
];

const SEED_USER_IDS = new Set(seedUsers.map(u => u.id));
const SEED_PASSWORD_KEYS = new Set(Object.keys(passwordStore));

export const cabinets: Cabinet[] = [
  {
    id: '1',
    name: 'Centre Médical Spécialisé SEVEN',
    address: "Cocody Angré, Rue des Jardins, Abidjan, Côte d'Ivoire",
    phone: '+225 27 22 40 00 00',
    email: 'contact@centre-medical-seven.ci',
    website: 'https://www.centre-medical-seven.ci',
    description: "Centre médical spécialisé en gériatrie et gérontologie à Abidjan.",
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
];

// Dr. Marie Martin schedule — Lun-Ven 08h-17h (30 min slots), Sam 08h-12h
const seedSchedules: DoctorSchedule[] = [
  ...[1, 2, 3, 4, 5].map(d => ({ medecinId: '3', dayOfWeek: d, startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30, isActive: true })),
  { medecinId: '3', dayOfWeek: 6, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30, isActive: true },
];

// ── ISO date reviver for JSON.parse ────────────────────────────
const dateReviver = (_: string, v: any) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v) ? new Date(v) : v;

// ── Database class ─────────────────────────────────────────────
class Database {
  // Seeds always loaded fresh — extra dynamic users merged in
  private users: User[] = [...seedUsers];
  // Passwords: seeds always present; extra ones merged from storage
  private passwords: Record<string, string> = { ...passwordStore };

  // Collections persisted to localStorage
  private patients: Patient[]                 = [];
  private appointments: Appointment[]         = [];
  private medicalRecords: MedicalRecord[]     = [];
  private geriatricEvaluations: GeriatricEvaluation[] = [];
  private notifications: Notification[]       = [];
  private homeVisits: HomeVisit[]             = [];
  private invoices: Invoice[]                 = [];
  private payments: Payment[]                 = [];
  private appointmentRequests: AppointmentRequest[] = [];
  private cabinets: Cabinet[]                 = [...cabinets];
  private schedules: DoctorSchedule[]         = [...seedSchedules];

  constructor() {
    this.loadFromStorage();
  }

  // ── Persistence ───────────────────────────────────────────────
  private save(): void {
    if (typeof window === 'undefined') return;
    try {
      // Only store EXTRA users (not seeds) and EXTRA passwords (not seed ones)
      const dynamicUsers = this.users.filter(u => !SEED_USER_IDS.has(u.id));
      const extraPasswords = Object.fromEntries(
        Object.entries(this.passwords).filter(([k]) => !SEED_PASSWORD_KEYS.has(k))
      );
      localStorage.setItem('cabinet_db_v3', JSON.stringify({
        dynamicUsers,
        extraPasswords,
        patients:              this.patients,
        appointments:          this.appointments,
        medicalRecords:        this.medicalRecords,
        geriatricEvaluations:  this.geriatricEvaluations,
        notifications:         this.notifications,
        homeVisits:            this.homeVisits,
        invoices:              this.invoices,
        payments:              this.payments,
        appointmentRequests:   this.appointmentRequests,
      }));
    } catch (e) {
      console.warn('[DB] persist failed:', e);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('cabinet_db_v3');
      if (!raw) return;
      const d = JSON.parse(raw, dateReviver);

      // Merge dynamic users ON TOP of seeds (seeds are always fresh)
      if (Array.isArray(d.dynamicUsers) && d.dynamicUsers.length) {
        // Remove any stale seed duplicates that might have been saved previously
        const freshSeedIds = new Set(seedUsers.map(u => u.id));
        const dynamicOnly = d.dynamicUsers.filter((u: User) => !freshSeedIds.has(u.id));
        this.users = [...seedUsers, ...dynamicOnly];
      }

      // Merge extra passwords ON TOP of seeds
      if (d.extraPasswords && typeof d.extraPasswords === 'object') {
        Object.assign(this.passwords, d.extraPasswords);
      }

      // Restore dynamic collections
      if (Array.isArray(d.patients))             this.patients             = d.patients;
      if (Array.isArray(d.appointments))         this.appointments         = d.appointments;
      if (Array.isArray(d.medicalRecords))       this.medicalRecords       = d.medicalRecords;
      if (Array.isArray(d.geriatricEvaluations)) this.geriatricEvaluations = d.geriatricEvaluations;
      if (Array.isArray(d.notifications))        this.notifications        = d.notifications;
      if (Array.isArray(d.homeVisits))           this.homeVisits           = d.homeVisits;
      if (Array.isArray(d.invoices))             this.invoices             = d.invoices;
      if (Array.isArray(d.payments))             this.payments             = d.payments;
      if (Array.isArray(d.appointmentRequests))  this.appointmentRequests  = d.appointmentRequests;
    } catch (e) {
      console.warn('[DB] loadFromStorage failed:', e);
    }
  }

  /** Wipe all dynamic data (useful for dev/reset) */
  resetDynamic(): void {
    localStorage.removeItem('cabinet_db_v3');
    this.users               = [...seedUsers];
    this.passwords           = { ...passwordStore };
    this.patients            = [];
    this.appointments        = [];
    this.medicalRecords      = [];
    this.geriatricEvaluations = [];
    this.notifications       = [];
    this.homeVisits          = [];
    this.invoices            = [];
    this.payments            = [];
    this.appointmentRequests = [];
  }

  // ── CABINETS ──────────────────────────────────────────────────
  getCabinet(): Cabinet | undefined { return this.cabinets[0]; }
  getCabinets(): Cabinet[] { return this.cabinets; }
  updateCabinet(id: string, updates: Partial<Cabinet>): Cabinet | undefined {
    const i = this.cabinets.findIndex(c => c.id === id);
    if (i === -1) return undefined;
    this.cabinets[i] = { ...this.cabinets[i], ...updates };
    return this.cabinets[i];
  }

  // ── USERS ─────────────────────────────────────────────────────
  getUsers(): User[] { return this.users; }
  getUserById(id: string): User | undefined { return this.users.find(u => u.id === id); }
  getUserByEmail(email: string): User | undefined {
    const norm = email.trim().toLowerCase();
    return this.users.find(u => u.email.toLowerCase() === norm);
  }
  getMedecins(): User[] { return this.users.filter(u => u.role === 'medecin' && u.isActive); }
  getAgents(): User[] { return this.users.filter(u => u.role === 'agent_terrain' && u.isActive); }

  createUser(data: Partial<User> & { email: string; password?: string }): User {
    const norm = data.email.trim().toLowerCase();
    const newUser: User = {
      firstName: '', lastName: '', role: 'patient', isActive: true,
      ...data,
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: norm,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    if (data.password) this.passwords[norm] = data.password;
    this.save();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const i = this.users.findIndex(u => u.id === id);
    if (i === -1) return undefined;
    this.users[i] = { ...this.users[i], ...updates, updatedAt: new Date() };
    this.save();
    return this.users[i];
  }

  deleteUser(id: string): boolean {
    const i = this.users.findIndex(u => u.id === id);
    if (i === -1) return false;
    this.users.splice(i, 1);
    this.save();
    return true;
  }

  changePassword(email: string, newPassword: string): void {
    this.passwords[email.trim().toLowerCase()] = newPassword;
    this.save();
  }

  // ── AUTH ──────────────────────────────────────────────────────
  login(email: string, password: string): User | null {
    const norm = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === norm && u.isActive);
    if (!user) return null;
    const stored = this.passwords[norm];
    // If password exists in store, it must match exactly
    if (stored !== undefined && stored !== password) return null;
    user.lastLogin = new Date();
    this.save();
    return user;
  }

  // ── PATIENTS ──────────────────────────────────────────────────
  getPatients(): Patient[] { return this.patients; }
  getPatientById(id: string): Patient | undefined { return this.patients.find(p => p.id === id); }
  getPatientByUserId(userId: string): Patient | undefined { return this.patients.find(p => p.userId === userId); }

  createPatient(data: {
    firstName: string; lastName: string; email: string; phone?: string;
    dateOfBirth?: string; gender?: string; bloodType?: string;
    insuranceProvider?: string; insuranceNumber?: string;
    address?: string; allergies?: string[]; chronicConditions?: string[];
    familyContact?: string; familyPhone?: string; medicalHistory?: string;
    password?: string;
  }): Patient {
    const normEmail = data.email.trim().toLowerCase();
    let user = this.getUserByEmail(normEmail);
    if (!user) {
      user = this.createUser({
        email: normEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'patient',
        phone: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender as any,
        isActive: true,
        password: data.password,
      });
    }

    const newPatient: Patient = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      user,
      cabinetId: '1',
      bloodType: data.bloodType,
      allergies: data.allergies || [],
      chronicConditions: data.chronicConditions || [],
      medicalHistory: data.medicalHistory,
      insuranceProvider: data.insuranceProvider,
      insuranceNumber: data.insuranceNumber,
      familyContact: data.familyContact,
      familyPhone: data.familyPhone,
      address: data.address,
      createdAt: new Date(),
    };
    this.patients.push(newPatient);
    this.save();
    return newPatient;
  }

  updatePatient(id: string, updates: Partial<Patient>): Patient | undefined {
    const i = this.patients.findIndex(p => p.id === id);
    if (i === -1) return undefined;
    this.patients[i] = { ...this.patients[i], ...updates };
    this.save();
    return this.patients[i];
  }

  deletePatient(id: string): boolean {
    const i = this.patients.findIndex(p => p.id === id);
    if (i === -1) return false;
    this.patients.splice(i, 1);
    this.save();
    return true;
  }

  // ── APPOINTMENTS ──────────────────────────────────────────────
  getAppointments(filters?: { patientId?: string; medecinId?: string; status?: string }): Appointment[] {
    let res = [...this.appointments];
    if (filters?.patientId) res = res.filter(a => a.patientId === filters.patientId);
    if (filters?.medecinId) res = res.filter(a => a.medecinId === filters.medecinId);
    if (filters?.status)    res = res.filter(a => a.status    === filters.status);
    return res.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }

  getAppointmentById(id: string): Appointment | undefined { return this.appointments.find(a => a.id === id); }

  createAppointment(data: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
    const appt: Appointment = {
      ...data,
      patient:  this.patients.find(p => p.id === data.patientId) ?? data.patient,
      medecin:  this.users.find(u => u.id === data.medecinId) ?? data.medecin,
      id: `a-${Date.now()}`,
      createdAt: new Date(),
    };
    this.appointments.push(appt);
    this.save();
    return appt;
  }

  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | undefined {
    const i = this.appointments.findIndex(a => a.id === id);
    if (i === -1) return undefined;
    this.appointments[i] = { ...this.appointments[i], ...updates };
    this.save();
    return this.appointments[i];
  }

  deleteAppointment(id: string): boolean {
    const i = this.appointments.findIndex(a => a.id === id);
    if (i === -1) return false;
    this.appointments.splice(i, 1);
    this.save();
    return true;
  }

  // ── MEDICAL RECORDS ───────────────────────────────────────────
  getMedicalRecords(patientId?: string): MedicalRecord[] {
    return patientId
      ? this.medicalRecords.filter(r => r.patientId === patientId)
      : this.medicalRecords;
  }
  getMedicalRecordById(id: string): MedicalRecord | undefined { return this.medicalRecords.find(r => r.id === id); }

  createMedicalRecord(data: Omit<MedicalRecord, 'id' | 'createdAt'>): MedicalRecord {
    const rec: MedicalRecord = { ...data, id: `r-${Date.now()}`, createdAt: new Date() };
    this.medicalRecords.push(rec);
    this.save();
    return rec;
  }

  updateMedicalRecord(id: string, updates: Partial<MedicalRecord>): MedicalRecord | undefined {
    const i = this.medicalRecords.findIndex(r => r.id === id);
    if (i === -1) return undefined;
    this.medicalRecords[i] = { ...this.medicalRecords[i], ...updates };
    this.save();
    return this.medicalRecords[i];
  }

  deleteMedicalRecord(id: string): boolean {
    const i = this.medicalRecords.findIndex(r => r.id === id);
    if (i === -1) return false;
    this.medicalRecords.splice(i, 1);
    this.save();
    return true;
  }

  // ── GERIATRIC EVALUATIONS ─────────────────────────────────────
  getGeriatricEvaluations(patientId?: string): GeriatricEvaluation[] {
    return patientId
      ? this.geriatricEvaluations.filter(e => e.patientId === patientId)
      : this.geriatricEvaluations;
  }
  getGeriatricEvaluationById(id: string): GeriatricEvaluation | undefined { return this.geriatricEvaluations.find(e => e.id === id); }

  createGeriatricEvaluation(data: Omit<GeriatricEvaluation, 'id' | 'createdAt'>): GeriatricEvaluation {
    const ev: GeriatricEvaluation = { ...data, id: `e-${Date.now()}`, createdAt: new Date() };
    this.geriatricEvaluations.push(ev);
    this.save();
    return ev;
  }

  updateGeriatricEvaluation(id: string, updates: Partial<GeriatricEvaluation>): GeriatricEvaluation | undefined {
    const i = this.geriatricEvaluations.findIndex(e => e.id === id);
    if (i === -1) return undefined;
    this.geriatricEvaluations[i] = { ...this.geriatricEvaluations[i], ...updates };
    this.save();
    return this.geriatricEvaluations[i];
  }

  // ── HOME VISITS ───────────────────────────────────────────────
  getHomeVisits(filters?: { agentId?: string; patientId?: string; status?: string }): HomeVisit[] {
    let res = [...this.homeVisits];
    if (filters?.agentId)   res = res.filter(v => v.agentId   === filters.agentId);
    if (filters?.patientId) res = res.filter(v => v.patientId === filters.patientId);
    if (filters?.status)    res = res.filter(v => v.status    === filters.status);
    return res.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  getHomeVisitById(id: string): HomeVisit | undefined { return this.homeVisits.find(v => v.id === id); }

  createHomeVisit(data: Omit<HomeVisit, 'id' | 'createdAt'>): HomeVisit {
    const visit: HomeVisit = {
      ...data,
      patient: this.patients.find(p => p.id === data.patientId) ?? data.patient,
      agent:   this.users.find(u => u.id === data.agentId) ?? data.agent,
      id: `v-${Date.now()}`,
      createdAt: new Date(),
    };
    this.homeVisits.push(visit);
    this.save();
    return visit;
  }

  updateHomeVisit(id: string, updates: Partial<HomeVisit>): HomeVisit | undefined {
    const i = this.homeVisits.findIndex(v => v.id === id);
    if (i === -1) return undefined;
    this.homeVisits[i] = { ...this.homeVisits[i], ...updates };
    this.save();
    return this.homeVisits[i];
  }

  // ── INVOICES ──────────────────────────────────────────────────
  getInvoices(filters?: { patientId?: string; status?: string }): Invoice[] {
    let res = [...this.invoices];
    if (filters?.patientId) res = res.filter(i => i.patientId === filters.patientId);
    if (filters?.status)    res = res.filter(i => i.status    === filters.status);
    return res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getInvoiceById(id: string): Invoice | undefined { return this.invoices.find(i => i.id === id); }

  createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice {
    const inv: Invoice = {
      ...data,
      patient: this.patients.find(p => p.id === data.patientId) ?? data.patient,
      id: `inv-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.push(inv);
    this.save();
    return inv;
  }

  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | undefined {
    const i = this.invoices.findIndex(inv => inv.id === id);
    if (i === -1) return undefined;
    this.invoices[i] = { ...this.invoices[i], ...updates, updatedAt: new Date() };
    this.save();
    return this.invoices[i];
  }

  generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const count = this.invoices.length + 1;
    return `FAC-${year}-${String(count).padStart(4, '0')}`;
  }

  // ── PAYMENTS ──────────────────────────────────────────────────
  getPayments(filters?: { invoiceId?: string }): Payment[] {
    let res = [...this.payments];
    if (filters?.invoiceId) res = res.filter(p => p.invoiceId === filters.invoiceId);
    return res.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }

  createPayment(data: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const pay: Payment = { ...data, id: `pay-${Date.now()}`, createdAt: new Date() };
    this.payments.push(pay);
    if (data.status === 'completed') this.updateInvoice(data.invoiceId, { status: 'paid' });
    this.save();
    return pay;
  }

  // ── NOTIFICATIONS ─────────────────────────────────────────────
  getNotifications(userId: string): Notification[] {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getUnreadCount(userId: string): number {
    return this.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  addNotification(data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const n: Notification = { ...data, id: `n-${Date.now()}`, isRead: false, createdAt: new Date() };
    this.notifications.push(n);
    this.save();
    return n;
  }

  markNotificationAsRead(id: string): void {
    const n = this.notifications.find(n => n.id === id);
    if (n) { n.isRead = true; this.save(); }
  }

  markAllAsRead(userId: string): void {
    this.notifications.filter(n => n.userId === userId).forEach(n => { n.isRead = true; });
    this.save();
  }

  // ── ACTIVITY LOGS ─────────────────────────────────────────────
  addActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): void {
    // Not persisted (logs are ephemeral for now)
  }

  // ── APPOINTMENT REQUESTS ──────────────────────────────────────
  getAppointmentRequests(status?: AppointmentRequest['status']): AppointmentRequest[] {
    const list = status
      ? this.appointmentRequests.filter(r => r.status === status)
      : this.appointmentRequests;
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPendingRequestsCount(): number {
    return this.appointmentRequests.filter(r => r.status === 'pending').length;
  }

  createAppointmentRequest(data: {
    firstName: string; lastName: string; phone: string; email: string;
    reason: string; preferredDate: string; preferredTime?: string;
    medecinId?: string; message?: string;
  }): AppointmentRequest {
    const req: AppointmentRequest = {
      ...data,
      id: `req-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
    };
    this.appointmentRequests.push(req);
    // Notify staff
    ['1', '2'].forEach(uid =>
      this.addNotification({
        userId: uid,
        title: 'Nouvelle demande de RDV',
        message: `${data.firstName} ${data.lastName} — ${data.reason}`,
        type: 'info',
        link: '/demandes',
      })
    );
    this.save();
    return req;
  }

  confirmAppointmentRequest(id: string): { request: AppointmentRequest; patient: Patient; password: string } | null {
    const i = this.appointmentRequests.findIndex(r => r.id === id);
    if (i === -1) return null;
    const req = this.appointmentRequests[i];

    // Generate secure-enough temporary password
    const password =
      Math.random().toString(36).slice(2, 7).toUpperCase() +
      Math.floor(10 + Math.random() * 90);

    // Create patient account with the password embedded
    const patient = this.createPatient({
      firstName: req.firstName,
      lastName:  req.lastName,
      email:     req.email,
      phone:     req.phone,
      password,                 // ← password saved inside createPatient → createUser
    });

    // Extra safety: also set it directly
    this.passwords[req.email.trim().toLowerCase()] = password;

    // Create the appointment if doctor + date provided
    let appointmentId: string | undefined;
    if (req.medecinId && req.preferredDate) {
      const [h = 9, m = 0] = (req.preferredTime || '09:00').split(':').map(Number);
      const apptDate = new Date(req.preferredDate);
      apptDate.setHours(h, m, 0, 0);
      const appt = this.createAppointment({
        patientId: patient.id,
        patient,
        medecinId: req.medecinId,
        cabinetId: '1',
        appointmentDate: apptDate,
        durationMinutes: 30,
        status: 'confirmed',
        type: 'consultation',
        reason: req.reason,
      });
      appointmentId = appt.id;
    }

    // Update request record
    this.appointmentRequests[i] = {
      ...req,
      status: 'confirmed',
      confirmedAt: new Date(),
      patientId: patient.id,
      appointmentId,
      generatedPassword: password,
    };

    this.save(); // Final save — everything is in sync
    return { request: this.appointmentRequests[i], patient, password };
  }

  rejectAppointmentRequest(id: string, reason: string): AppointmentRequest | null {
    const i = this.appointmentRequests.findIndex(r => r.id === id);
    if (i === -1) return null;
    this.appointmentRequests[i] = {
      ...this.appointmentRequests[i],
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason,
    };
    this.save();
    return this.appointmentRequests[i];
  }

  // ── DOCTOR SCHEDULES ──────────────────────────────────────────
  getSchedule(medecinId: string): DoctorSchedule[] {
    return this.schedules.filter(s => s.medecinId === medecinId && s.isActive);
  }

  getAvailableSlots(medecinId: string, dateStr: string): string[] {
    const date = new Date(dateStr);
    const dow = date.getDay();
    const schedule = this.schedules.find(s => s.medecinId === medecinId && s.dayOfWeek === dow && s.isActive);
    if (!schedule) return []; // Doctor not available this day

    // Build all theoretical slots
    const slots: string[] = [];
    const [sh, sm] = schedule.startTime.split(':').map(Number);
    const [eh, em] = schedule.endTime.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + schedule.slotDurationMinutes <= end) {
      slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
      cur += schedule.slotDurationMinutes;
    }

    // Remove already-booked slots
    const booked = new Set(
      this.appointments
        .filter(a => {
          const ad = new Date(a.appointmentDate);
          return a.medecinId === medecinId &&
            ad.toDateString() === date.toDateString() &&
            !['cancelled', 'no_show'].includes(a.status);
        })
        .map(a => {
          const d = new Date(a.appointmentDate);
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        })
    );

    return slots.filter(s => !booked.has(s));
  }
}

export const db = new Database();
