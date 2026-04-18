'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Modal, Input } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { Calendar } from '@/components/calendar';
import { Appointment, Patient } from '@/lib/types';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  scheduled: 'info',
  confirmed: 'success',
  in_progress: 'warning',
  completed: 'default',
  cancelled: 'error',
  no_show: 'error',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Programmé',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'Absent',
};

export default function AppointmentsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      let filteredAppointments: Appointment[];
      
      if (user.role === 'patient') {
        const patient = db.getPatientByUserId(user.id);
        filteredAppointments = patient ? db.getAppointments({ patientId: patient.id }) : [];
      } else {
        filteredAppointments = db.getAppointments();
      }
      
      setAppointments(filteredAppointments);
      setPatients(db.getPatients());
    }
  }, [user]);

  const handleStatusChange = (id: string, newStatus: string) => {
    db.updateAppointment(id, { status: newStatus as any });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    setSelectedAppointment(null);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Rendez-vous
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {appointments.length} rendez-vous
            </p>
          </div>
          {hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin']) && (
            <Button onClick={() => setIsModalOpen(true)}>
              + Nouveau RDV
            </Button>
          )}
        </div>

        <Calendar 
          appointments={appointments}
          onAppointmentClick={(apt) => setSelectedAppointment(apt)}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau rendez-vous"
        size="lg"
      >
        <NewAppointmentForm
          patients={patients}
          onClose={() => setIsModalOpen(false)}
          onCreated={() => {
            setAppointments(db.getAppointments());
          }}
        />
      </Modal>

      <Modal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Détails du rendez-vous"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-300">
                  {selectedAppointment.patient?.user?.firstName?.[0]}{selectedAppointment.patient?.user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedAppointment.patient?.user?.firstName} {selectedAppointment.patient?.user?.lastName}
                </p>
                <p className="text-sm text-zinc-500">{selectedAppointment.reason}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase">Date</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(selectedAppointment.appointmentDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Heure</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(selectedAppointment.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Durée</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedAppointment.durationMinutes} minutes</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Type</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">{selectedAppointment.type.replace('_', ' ')}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-500 uppercase">Statut</p>
              <Badge variant={statusColors[selectedAppointment.status]} className="mt-1">
                {statusLabels[selectedAppointment.status]}
              </Badge>
            </div>

            {hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin']) && selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                {selectedAppointment.status === 'scheduled' && (
                  <Button size="sm" onClick={() => handleStatusChange(selectedAppointment.id, 'confirmed')}>
                    Confirmer
                  </Button>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <Button size="sm" onClick={() => handleStatusChange(selectedAppointment.id, 'in_progress')}>
                    Commencer
                  </Button>
                )}
                {selectedAppointment.status === 'in_progress' && (
                  <Button size="sm" onClick={() => handleStatusChange(selectedAppointment.id, 'completed')}>
                    Terminer
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => router.push(`/evaluations/new?appointment=${selectedAppointment.id}`)}>
                  Évaluation
                </Button>
                <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}>
                  Annuler
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

function NewAppointmentForm({ patients, onClose, onCreated }: { patients: Patient[]; onClose: () => void; onCreated?: () => void }) {
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    duration: '60',
    type: 'consultation',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appointmentDate = new Date(`${formData.date}T${formData.time}`);
    db.createAppointment({
      patientId: formData.patientId,
      medecinId: '3',
      cabinetId: '1',
      appointmentDate,
      durationMinutes: parseInt(formData.duration),
      status: 'scheduled',
      type: formData.type,
      reason: formData.reason,
    });
    onClose();
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Patient</label>
        <select
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
          value={formData.patientId}
          onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
          required
        >
          <option value="">Sélectionner un patient...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.user.firstName} {p.user.lastName}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
        <Input
          label="Heure"
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Durée</label>
          <select
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1h</option>
            <option value="90">1h30</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
          <select
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="consultation">Consultation</option>
            <option value="follow_up">Suivi</option>
            <option value="evaluation">Évaluation</option>
            <option value="emergency">Urgence</option>
          </select>
        </div>
      </div>
      
      <Input
        label="Motif"
        value={formData.reason}
        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        placeholder="Raison de la consultation"
      />

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" className="flex-1">
          Créer le RDV
        </Button>
      </div>
    </form>
  );
}
