-- Database Schema for Cabinet Gériatrie

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('patient', 'medecin', 'chef_cabinet', 'admin', 'super_admin');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE evaluation_status AS ENUM ('draft', 'in_progress', 'completed');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'patient',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  specialty TEXT,
  license_number TEXT,
  date_of_birth DATE,
  gender gender,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT false
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE TABLE cabinets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE cabinet_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'medecin',
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cabinet_id, user_id)
);

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE SET NULL,
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  medical_history TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  family_contact TEXT,
  family_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  medecin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status appointment_status DEFAULT 'scheduled',
  type TEXT,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  record_type TEXT,
  content TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE geriatric_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE SET NULL,
  medecin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  status evaluation_status DEFAULT 'draft',
  informations_patient JSONB DEFAULT '{}',
  cognitif JSONB DEFAULT '{}',
  humeur JSONB DEFAULT '{}',
  fonctionnel JSONB DEFAULT '{}',
  mobilite JSONB DEFAULT '{}',
  nutrition JSONB DEFAULT '{}',
  chute JSONB DEFAULT '{}',
  social JSONB DEFAULT '{}',
  medicaments JSONB DEFAULT '{}',
  medicaux JSONB DEFAULT '{}',
  conclusion JSONB DEFAULT '{}',
  mms_total INTEGER,
  gds_total INTEGER,
  adl_total INTEGER,
  iadl_total INTEGER,
  morse_total INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  cabinet_id UUID REFERENCES cabinets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_type TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id)
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_patients_cabinet ON patients(cabinet_id);
CREATE INDEX idx_patients_user ON patients(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_geriatric_evaluations_patient ON geriatric_evaluations(patient_id);
CREATE INDEX idx_geriatric_evaluations_date ON geriatric_evaluations(evaluation_date);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

INSERT INTO cabinets (name, address, phone, email, description)
VALUES ('Cabinet Gériatrie Principal', '123 Rue de la Médecine, 75001 Paris', '+33 1 23 45 67 89', 'contact@cabinet-geriatrie.fr', 'Cabinet spécialisé en gériatrie');

INSERT INTO users (email, password_hash, first_name, last_name, role, specialty, date_of_birth, gender, is_active, email_verified)
VALUES 
  ('admin@cabinet-geriatrie.fr', crypt('admin123', gen_salt('bf')), 'Admin', 'Système', 'super_admin', NULL, NULL, NULL, true, true),
  ('chef@cabinet-geriatrie.fr', crypt('chef123', gen_salt('bf')), 'Jean', 'Dupont', 'chef_cabinet', NULL, NULL, NULL, true, true),
  ('medecin@cabinet-geriatrie.fr', crypt('medecin123', gen_salt('bf')), 'Marie', 'Martin', 'medecin', 'Gériatrie', NULL, NULL, true, true),
  ('patient@cabinet-geriatrie.fr', crypt('patient123', gen_salt('bf')), 'Pierre', 'Durand', 'patient', NULL, '1950-05-15', 'male', true, true);

INSERT INTO cabinet_members (cabinet_id, user_id, role)
SELECT c.id, u.id, u.role
FROM cabinets c, users u
WHERE u.email IN ('chef@cabinet-geriatrie.fr', 'medecin@cabinet-geriatrie.fr');

INSERT INTO patients (user_id, cabinet_id)
SELECT u.id, c.id
FROM users u, cabinets c
WHERE u.email = 'patient@cabinet-geriatrie.fr';
