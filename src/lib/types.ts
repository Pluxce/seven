export type UserRole = 'patient' | 'medecin' | 'agent_terrain' | 'chef_cabinet' | 'admin' | 'super_admin';

export type AppointmentRequestStatus = 'pending' | 'confirmed' | 'rejected';

export interface AppointmentRequest {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  reason: string;
  preferredDate: string;
  preferredTime?: string;
  medecinId?: string;
  message?: string;
  status: AppointmentRequestStatus;
  createdAt: Date;
  confirmedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  patientId?: string;
  appointmentId?: string;
  generatedPassword?: string;
}

export interface DoctorSchedule {
  medecinId: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  startTime: string; // 'HH:mm'
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export type EvaluationStatus = 'draft' | 'in_progress' | 'completed';

export type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'report_pending';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue';
export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'bank_transfer' | 'insurance';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patient?: Patient;
  cabinetId: string;
  appointmentId?: string;
  visitId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoice?: Invoice;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  phoneNumber?: string;
  operator?: string;
  notes?: string;
  paidAt: Date;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  specialty?: string;
  licenseNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isActive: boolean;
  lastLogin?: Date;
}

export interface Cabinet {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Patient {
  id: string;
  userId: string;
  user: User;
  cabinetId: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  medicalHistory?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  familyContact?: string;
  familyPhone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  medecinId: string;
  medecin?: User;
  cabinetId: string;
  appointmentDate: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  type: string;
  reason?: string;
  notes?: string;
  createdAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  cabinetId: string;
  title: string;
  recordType: string;
  content?: string;
  attachments?: string[];
  createdAt: Date;
  createdBy: string;
}

export interface GeriatricEvaluation {
  id: string;
  patientId: string;
  cabinetId: string;
  medecinId: string;
  evaluationDate: Date;
  status: EvaluationStatus;
  informationsPatient: Record<string, any>;
  cognitif: Record<string, any>;
  humeur: Record<string, any>;
  fonctionnel: Record<string, any>;
  mobilite: Record<string, any>;
  nutrition: Record<string, any>;
  chute: Record<string, any>;
  social: Record<string, any>;
  medicaments: Record<string, any>;
  medicaux: Record<string, any>;
  conclusion: Record<string, any>;
  mmsTotal?: number;
  gdsTotal?: number;
  adlTotal?: number;
  iadlTotal?: number;
  morseTotal?: number;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

export interface HomeVisit {
  id: string;
  patientId: string;
  patient?: Patient;
  agentId: string;
  agent?: User;
  cabinetId: string;
  scheduledDate: Date;
  scheduledTime: string;
  durationMinutes: number;
  status: VisitStatus;
  address: string;
  latitude?: number;
  longitude?: number;
  reason: string;
  notes?: string;
  report?: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    oxygenSaturation?: number;
  };
  createdAt: Date;
  completedAt?: Date;
}
